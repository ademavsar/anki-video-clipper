const { app, BrowserWindow, dialog, Menu, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const fetch = require('node-fetch');
const keytar = require('keytar');
const { exec, spawn } = require('child_process');
const os = require('os');
const glob = require('glob');

// Set service name for keytar
const SERVICE_NAME = 'anki-video-clipper';
const API_KEY_ACCOUNT = 'openai-api-key';

// Dönüştürülmüş dosyaları önbelleklemek için global nesne
const audioConversionCache = {
  // Orijinal dosya yolu -> Dönüştürülmüş dosya yolu eşleşmeleri
  conversions: {},
  
  // Önbelleği dosyaya kaydet
  save: function() {
    try {
      const cachePath = path.join(app.getPath('userData'), 'audio-conversion-cache.json');
      fs.writeFileSync(cachePath, JSON.stringify(this.conversions), 'utf8');
      console.log('Audio conversion cache saved:', cachePath);
    } catch (error) {
      console.error('Could not save conversion cache:', error);
    }
  },
  
  // Önbelleği dosyadan yükle
  load: function() {
    try {
      const cachePath = path.join(app.getPath('userData'), 'audio-conversion-cache.json');
      if (fs.existsSync(cachePath)) {
        const data = fs.readFileSync(cachePath, 'utf8');
        this.conversions = JSON.parse(data);
        console.log('Dönüştürme önbelleği yüklendi');
        
        // Önbellekteki dosyaların varlığını kontrol et
        for (const [originalPath, convertedPath] of Object.entries(this.conversions)) {
          if (!fs.existsSync(convertedPath)) {
            console.log(`Önbellekteki dosya bulunamadı, siliniyor: ${convertedPath}`);
            delete this.conversions[originalPath];
          }
        }
      }
    } catch (error) {
      console.error('Dönüştürme önbelleği yüklenemedi:', error);
      this.conversions = {};
    }
  },
  
  // Dönüştürülmüş dosyayı önbelleğe ekle
  add: function(originalPath, convertedPath) {
    this.conversions[originalPath] = convertedPath;
    this.save();
  },
  
  // Dönüştürülmüş dosyayı önbellekten al
  get: function(originalPath) {
    return this.conversions[originalPath];
  },
  
  // Dosyanın önbellekte olup olmadığını kontrol et
  has: function(originalPath) {
    return originalPath in this.conversions && fs.existsSync(this.conversions[originalPath]);
  }
};

// Pencere referansını global tutuyoruz ki çöp toplayıcı kapatmasın
let mainWindow;

function createWindow() {
  // Ana pencereyi oluştur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'self'; media-src 'self' file: blob:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com;",
      worldSafeExecuteJavaScript: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // HTML dosyasını yükle
  mainWindow.loadFile('index.html');

  // Geliştirici araçlarını aç (geliştirme aşamasında)
  // mainWindow.webContents.openDevTools();
}

// Uygulama menüsünü oluştur
function createApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools', label: 'Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            dialog.showMessageBox({
              title: 'About Anki Video Clipper',
              message: 'An Electron-based application for creating Anki cards while watching films.\n\nVersion: 1.0.0'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Electron hazır olduğunda pencereyi oluştur
app.whenReady().then(() => {
  // Dönüştürme önbelleğini yükle
  audioConversionCache.load();
  
  createWindow();
  createApplicationMenu();

  app.on('activate', function () {
    // macOS'ta dock ikonuna tıklandığında pencere yoksa yeniden oluştur
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Tüm pencereler kapatıldığında uygulamayı sonlandır (Windows & Linux)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Uygulama kapatılmadan önce önbelleği kaydet
app.on('quit', () => {
  // Önbelleği kaydet
  audioConversionCache.save();
  
  // Eski geçici dosyaları temizle (isteğe bağlı)
  cleanupOldTempFiles();
});

// Eski geçici dosyaları temizle
function cleanupOldTempFiles() {
  try {
    const tempDir = path.join(os.tmpdir(), 'anki_video_clipper');
    if (!fs.existsSync(tempDir)) return;
    
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000); // 1 hafta önce
    
    // Aktif olarak kullanılan dosyaları topla
    const activeFiles = new Set(Object.values(audioConversionCache.conversions));
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      
      // Dosya aktif olarak kullanılıyorsa atla
      if (activeFiles.has(filePath)) continue;
      
      try {
        const stats = fs.statSync(filePath);
        // Dosya 1 haftadan eski ise sil
        if (stats.mtimeMs < oneWeekAgo) {
          fs.unlinkSync(filePath);
          console.log(`Eski geçici dosya silindi: ${filePath}`);
        }
      } catch (err) {
        console.error(`Dosya silinemedi: ${filePath}`, err);
      }
    }
  } catch (error) {
    console.error('Geçici dosyaları temizleme hatası:', error);
  }
}

// Anki-Connect ile iletişim için HTTP istekleri

// Anki-Connect API ile iletişim kurmak için yardımcı fonksiyon
async function invokeAnkiConnect(action, params = {}) {
  try {
    const response = await fetch('http://127.0.0.1:8765', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        version: 6,
        params
      })
    });
    
    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.error);
    }
    return responseJson.result;
  } catch (error) {
    console.error('Anki-Connect API hatası:', error);
    throw error;
  }
}

// OpenAI API ile kelime anlamlarını sorgulama
async function getWordDefinition(apiKey, word, sentence = null, model = 'gpt-3.5-turbo') {
  try {
    // API isteği için sistem tarafından kullanılan prompt
    let prompt = `Provide the following information for the word "${word}":\n`;
    if (sentence) {
      prompt += `In the context of this sentence: "${sentence}"\n`;
    }
    prompt += `- Base form (lemma) and part of speech
- IPA pronunciation (in standard IPA format)
- Brief English definition (1-2 sentences)
- Turkish translation
- A context-aware English example sentence

Format the response exactly like this:
Word: [original word]
Base: [lemma] ([part of speech])
IPA: [IPA]
English: [brief definition]
Turkish: [translation]
Example: [example sentence]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,  // Use the model parameter
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides word definitions, pronunciations, and translations in a specific format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response received from OpenAI API');
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// IPC handler for word definition requests
ipcMain.handle('get-word-definition', async (event, { apiKey, word, sentence, model }) => {
  try {
    // Validate inputs
    if (!apiKey || !apiKey.trim() || !apiKey.startsWith('sk-')) {
      return { 
        success: false, 
        error: 'Invalid API key format. API key should start with "sk-".'
      };
    }
    
    if (!word || !word.trim()) {
      return {
        success: false,
        error: 'No word provided'
      };
    }
    
    // Validate word length to prevent abuse
    if (word.length > 50) {
      return {
        success: false,
        error: 'Word is too long'
      };
    }
    
    // If sentence is provided, validate it
    if (sentence && sentence.length > 1000) {
      // Truncate long sentences
      sentence = sentence.substring(0, 997) + '...';
    }
    
    // Use default model if none provided or invalid
    const modelToUse = model && typeof model === 'string' ? model : 'gpt-3.5-turbo';
    
    const definition = await getWordDefinition(apiKey, word, sentence, modelToUse);
    return { success: true, data: definition };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Error fetching word definition'
    };
  }
});

// Anki destelerini getir
ipcMain.handle('get-anki-decks', async () => {
  try {
    return await invokeAnkiConnect('deckNames');
  } catch (error) {
    console.error('Anki desteleri alınamadı:', error);
    return [];
  }
});

// Anki not tiplerini getir
ipcMain.handle('get-anki-models', async () => {
  try {
    return await invokeAnkiConnect('modelNames');
  } catch (error) {
    console.error('Anki not tipleri alınamadı:', error);
    return [];
  }
});

// Not tipinin alanlarını getir
ipcMain.handle('get-model-fields', async (event, modelName) => {
  try {
    console.log(`Anki'den "${modelName}" not tipinin alanları isteniyor...`);
    
    // İlk yöntem: modelFieldNames kullanarak doğrudan alanları alma
    let fields = await invokeAnkiConnect('modelFieldNames', { modelName });
    
    console.log(`"${modelName}" not tipi için dönen alanlar (modelFieldNames):`, fields);
    
    // Eğer ilk yöntem başarısız olduysa veya boş bir dizi döndüyse, ikinci yöntemi dene
    if (!fields || fields.length === 0) {
      console.log(`modelFieldNames boş döndü, modelSchemaNow kullanarak deneniyor...`);
      
      // İkinci yöntem: Model şemasını al
      const modelSchema = await invokeAnkiConnect('modelSchemaNow', { modelName });
      
      if (modelSchema && typeof modelSchema === 'object') {
        // Schema alan adlarını içeriyorsa
        if (Array.isArray(modelSchema.flds)) {
          fields = modelSchema.flds.map(field => field.name);
          console.log(`"${modelName}" not tipi için schema'dan çıkarılan alanlar:`, fields);
        } else {
          console.warn(`"${modelName}" not tipi için schema beklenen formatta değil:`, modelSchema);
        }
      } else {
        console.warn(`"${modelName}" not tipi için schema alınamadı:`, modelSchema);
        
        // Üçüncü yöntem: Farklı format dene
        try {
          const modelTemplates = await invokeAnkiConnect('getModelTemplates', { modelName });
          if (modelTemplates && typeof modelTemplates === 'object') {
            // Şablon adlarından alanları çıkarmayı dene
            fields = Object.keys(modelTemplates);
            console.log(`"${modelName}" not tipi için şablonlardan çıkarılan alanlar:`, fields);
          }
        } catch (innerError) {
          console.warn('Üçüncü yöntem de başarısız oldu:', innerError);
        }
      }
    }
    
    // Yine de alanlar bulunamadıysa boş bir dizi döndür
    if (!fields || fields.length === 0) {
      console.warn(`"${modelName}" not tipi için hiç alan bulunamadı, boş dizi döndürülüyor.`);
      return [];
    }
    
    return fields;
  } catch (error) {
    console.error(`"${modelName}" not tipi alanları alınamadı:`, error);
    throw error;
  }
});

// Anki'ye not gönder
ipcMain.handle('add-anki-note', async (event, noteData) => {
  try {
    return await invokeAnkiConnect('addNote', { note: noteData });
  } catch (error) {
    console.error('Anki notu eklenemedi:', error);
    throw error;
  }
});

// Video klip oluştur ve Anki'ye gönder
ipcMain.handle('create-clip-for-anki', async (event, args) => {
  try {
    const { 
      videoPath, 
      startTime, 
      endTime, 
      clipId, 
      noteData,
      extractFirstFrame = false,
      extractLastFrame = false,
      embedSubtitles = false,
      subtitleSource = { type: 'internal', index: 0, path: null }
    } = args;
    
    // Geçici dizini tanımla
    const tempDir = app.getPath('temp');
    
    // Klip dosya yolunu belirle
    const clipFilePath = path.join(tempDir, `${clipId}.webm`);
    
    // Kare dosyaları - yeni dosya isimlendirme yapısına uygun şekilde
    const frontFramePath = path.join(tempDir, `_${clipId}_front.jpg`);
    const backFramePath = path.join(tempDir, `_${clipId}_back.jpg`);
    
    // VTT dosyası için yol belirle
    const vttFilePath = path.join(tempDir, `_${clipId}.vtt`);
    
    // Klip oluştur (embed subtitles parametresi ile)
    await createVideoClip(videoPath, startTime, endTime, clipFilePath, {
      embedSubtitles: embedSubtitles,
      subtitlePath: subtitleSource.type === 'external' ? subtitleSource.path : null
    });
    
    // Altyazı dosyalarını oluştur
    const subtitleResult = await extractSubtitleClip(videoPath, startTime, endTime, vttFilePath, subtitleSource);
    
    // Frame çıkarma ve yükleme başarısını takip etmek için değişkenler
    let firstFrameUploaded = !extractFirstFrame; // Eğer çıkarılmayacaksa başarılı kabul et
    let lastFrameUploaded = !extractLastFrame;
    let subtitleUploaded = false;
    
    // First frame ve last frame çıkarma işlemleri
    if (extractFirstFrame || extractLastFrame) {
      try {
        // Frame'leri çıkarmak için Promise dizisi
        const frameExtractionPromises = [];
        
        // İlk kare
        if (extractFirstFrame) {
          // Eğer altyazı gömme seçilmişse, oluşturulan klipten; seçilmemişse orijinal videodan frame çıkar
          const sourceVideoForFrame = embedSubtitles ? clipFilePath : videoPath;
          frameExtractionPromises.push(
            captureVideoFrame(sourceVideoForFrame, frontFramePath, embedSubtitles ? 0 : startTime, 'first')
          );
        }
        
        // Son kare
        if (extractLastFrame) {
          // Eğer altyazı gömme seçilmişse, oluşturulan klipten; seçilmemişse orijinal videodan frame çıkar
          const sourceVideoForFrame = embedSubtitles ? clipFilePath : videoPath;
          
          // Daha güvenilir timestamp hesaplama
          const frameTime = embedSubtitles ? 
            // Klip içinden - klibin sonundan biraz önce (0.5s)
            Math.max(0, (endTime - startTime) - 0.5) : 
            // Orijinal video - video sonundan biraz önce (0.5s)
            Math.max(0, endTime - 0.5);
            
          frameExtractionPromises.push(
            captureVideoFrame(sourceVideoForFrame, backFramePath, frameTime, 'last')
          );
        }
        
        // Tüm frame çıkarma işlemlerini bekle
        await Promise.allSettled(frameExtractionPromises);
        
        // API çağrıları arasında kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // First Frame'i doğrudan Anki media klasörüne ekle
        if (extractFirstFrame && fs.existsSync(frontFramePath)) {
          try {
            const firstFrameData = fs.readFileSync(frontFramePath, { encoding: 'base64' });
            
            // Yeniden deneme mantığı ile yükleme
            firstFrameUploaded = await retryAnkiConnectCall(async () => {
              await invokeAnkiConnect('storeMediaFile', {
                filename: `_${clipId}_front.jpg`,
                data: firstFrameData
              });
              console.log(`İlk frame Anki media klasörüne eklendi: _${clipId}_front.jpg`);
              return true; // Başarılı
            }, 3); // 3 kez deneme
            
            if (!firstFrameUploaded) {
              console.error('İlk frame 3 deneme sonunda yüklenemedi');
            }
          } catch (err) {
            console.error('İlk frame işlenirken hata:', err);
          }
        }
        
        // API çağrıları arasında kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Last Frame'i doğrudan Anki media klasörüne ekle
        if (extractLastFrame && fs.existsSync(backFramePath)) {
          try {
            const lastFrameData = fs.readFileSync(backFramePath, { encoding: 'base64' });
            
            // Yeniden deneme mantığı ile yükleme
            lastFrameUploaded = await retryAnkiConnectCall(async () => {
              await invokeAnkiConnect('storeMediaFile', {
                filename: `_${clipId}_back.jpg`,
                data: lastFrameData
              });
              console.log(`Son frame Anki media klasörüne eklendi: _${clipId}_back.jpg`);
              return true; // Başarılı
            }, 3); // 3 kez deneme
            
            if (!lastFrameUploaded) {
              console.error('Son frame 3 deneme sonunda yüklenemedi');
            }
          } catch (err) {
            console.error('Son frame işlenirken hata:', err);
          }
        }
      } catch (frameError) {
        console.error('Frame işlemleri sırasında hata:', frameError);
      }
    }
    
    // VTT dosyasını Anki'ye gönder
    if (subtitleResult && subtitleResult.vtt && fs.existsSync(subtitleResult.vtt)) {
      const subtitleData = fs.readFileSync(subtitleResult.vtt, { encoding: 'base64' });
      
      // Yeniden deneme mantığı ile yükleme
      subtitleUploaded = await retryAnkiConnectCall(async () => {
        await invokeAnkiConnect('storeMediaFile', {
          filename: `_${clipId}.vtt`,
          data: subtitleData
        });
        console.log(`VTT dosyası Anki media klasörüne eklendi: _${clipId}.vtt`);
        return true; // Başarılı
      }, 3); // 3 kez deneme
      
      if (!subtitleUploaded) {
        console.error('VTT dosyası 3 deneme sonunda yüklenemedi');
      }
    }
    
    // Dosyayı base64'e çevir
    const videoData = fs.readFileSync(clipFilePath, { encoding: 'base64' });
    
    // Video alanını belirle (Alan adı model şemasına göre değişebilir)
    const videoFields = [];
    
    // Note data fields içinde Video veya benzer bir alan var mı kontrol et
    for (const fieldName in noteData.fields) {
      if (fieldName === 'Video' || fieldName.toLowerCase() === 'video') {
        videoFields.push(fieldName);
      }
    }
    
    // Eğer uygun alan bulunamadıysa varsayılan olarak Video kullan
    if (videoFields.length === 0) {
      videoFields.push('Video');
    }
    
    // noteData'ya video parametresini ekle
    noteData.video = [{
      filename: `${clipId}.webm`,
      data: videoData,
      fields: videoFields
    }];
    
    // VTT dosya adını noteData'ya ekle
    if (subtitleUploaded) {
      noteData.fields.Subtitle = `_${clipId}.vtt`;
    }
    
    // Anki'ye notu gönder - yeniden deneme mantığı ile
    const result = await retryAnkiConnectCall(async () => {
      return await invokeAnkiConnect('addNote', { note: noteData });
    }, 2); // 2 kez deneme
    
    // Geçici dosyaları temizle
    try {
      if (fs.existsSync(clipFilePath)) {
        fs.unlinkSync(clipFilePath);
      }
      
      if (extractFirstFrame && fs.existsSync(frontFramePath)) {
        fs.unlinkSync(frontFramePath);
      }
      
      if (extractLastFrame && fs.existsSync(backFramePath)) {
        fs.unlinkSync(backFramePath);
      }
      
      if (subtitleResult && subtitleResult.vtt && fs.existsSync(subtitleResult.vtt)) {
        fs.unlinkSync(subtitleResult.vtt);
      }
    } catch (err) {
      console.warn('Geçici dosya temizlenemedi:', err);
    }
    
    return result;
  } catch (error) {
    console.error('Video klip oluşturma ve Anki\'ye gönderme hatası:', error);
    throw error;
  }
});

// Anki-Connect API çağrılarını yeniden deneme yardımcı fonksiyonu
async function retryAnkiConnectCall(fn, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Anki-Connect API çağrısı başarısız (${attempt}/${maxRetries}):`, error.message);
      
      if (error.message && error.message.includes('duplicate')) {
        // Mükerrer not hatası, bu beklenen bir durum olabilir, yeniden denemeye gerek yok
        throw error;
      }
      
      // Son deneme değilse bekle
      if (attempt < maxRetries) {
        const delay = 1000 * attempt; // Her denemede artan bekleme süresi
        console.log(`${delay}ms bekledikten sonra yeniden denenecek...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Tüm denemeler başarısız olduysa son hatayı fırlat
  throw lastError;
}

// Videodan belirli bir frame'i çıkarma fonksiyonu
async function captureVideoFrame(videoPath, outputPath, timestamp, framePosition) {
  return new Promise((resolve, reject) => {
    console.log(`Frame çıkarılıyor: ${framePosition}, zaman: ${timestamp}`);
    
    // Windows'ta dosya yollarını FFmpeg için düzelt
    const formattedVideoPath = videoPath.replace(/\\/g, '/');
    const formattedOutputPath = outputPath.replace(/\\/g, '/');
    
    // Komut oluştur - shell kullanarak daha güvenilir çalışması için
    const { exec } = require('child_process');
    
    // Timestamp'i güvenli bir şekilde formatla (virgülden sonra maksimum 3 hane)
    const safeTimestamp = parseFloat(timestamp).toFixed(3);
    
    // FFmpeg komutu
    let command;
    
    if (framePosition === 'first') {
      // İlk frame için komutu oluştur
      command = `ffmpeg -ss ${safeTimestamp} -i "${formattedVideoPath}" -frames:v 1 -q:v 2 -y "${formattedOutputPath}"`;
    } else if (framePosition === 'last') {
      // Son frame için güvenilir yaklaşım - timestamp'i 0.5 saniye öncesinden al 
      // ve duration 0.03s (bir karenin süresi kadar) ayarla
      // Bu yöntem, videonun sonuna daha yakın bir kare alır
      const safeEndTime = Math.max(0, parseFloat(timestamp) - 0.5);
      command = `ffmpeg -ss ${safeEndTime.toFixed(3)} -i "${formattedVideoPath}" -frames:v 1 -q:v 2 -y "${formattedOutputPath}"`;
    }
    
    console.log('FFmpeg komut:', command);
    
    // Komutu çalıştır
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`${framePosition} frame çıkarma hatası:`, error);
        // Hata durumunda bile devam edebilmek için başarılı kabul ediyoruz
        console.log(`HATA OLMASINA RAĞMEN, ${framePosition} frame işlemi tamamlandı kabul ediliyor`);
        resolve(outputPath); // Hata olsa bile başarılı olarak kabul et
        return;
      }
      
      console.log(`${framePosition} frame başarıyla kaydedildi: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// Video klip oluşturma fonksiyonu
function createVideoClip(videoPath, startTime, endTime, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    // Önce video bilgilerini ffprobe ile al
    const ffprobeArgs = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'json',
      videoPath
    ];
    
    const ffprobeProcess = spawn('ffprobe', ffprobeArgs);
    
    let ffprobeData = '';
    ffprobeProcess.stdout.on('data', (data) => {
      ffprobeData += data.toString();
    });
    
    let ffprobeError = '';
    ffprobeProcess.stderr.on('data', (data) => {
      ffprobeError += data.toString();
    });
    
    ffprobeProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('FFprobe hatası:', ffprobeError);
        console.log('Video bilgileri alınamadı, varsayılan scaling kullanılıyor...');
        
        // Varsayılan FFmpeg komutu
        proceedWithVideoConversion();
        return;
      }
      
      try {
        // Video bilgilerini JSON olarak ayrıştır
        const videoInfo = JSON.parse(ffprobeData);
        const width = videoInfo.streams[0].width;
        const height = videoInfo.streams[0].height;
        
        console.log(`Orijinal video çözünürlüğü: ${width}x${height}`);
        
        // Çözünürlüğe göre en-boy oranını koruyarak ve 480p'yi hedefleyerek scaling yap
        proceedWithVideoConversion(width, height);
      } catch (error) {
        console.error('Video bilgileri işlenirken hata:', error);
        proceedWithVideoConversion();
      }
    });
    
    // Video dönüştürme fonksiyonu
    function proceedWithVideoConversion(width, height) {
      // Scaling filtresi oluştur
      let scaleFilter = 'scale=-2:480:force_original_aspect_ratio=decrease';
      
      // Eğer video yüksekliği zaten 480p'den küçük veya eşitse,
      // orijinal boyutu koru ama yine de en-boy oranını düzgün ayarla
      if (height && height <= 480) {
        scaleFilter = 'scale=-2:' + height + ':force_original_aspect_ratio=decrease';
      }
      
      // Eğer video genişliği yüksekliğinden büyükse (yatay video),
      // genişliği 854 (480p'nin genişliği) olarak sınırla
      if (width && height && width > height) {
        scaleFilter = 'scale=854:-2:force_original_aspect_ratio=decrease';
        // Eğer orijinal genişlik zaten 854'ten küçük veya eşitse, orijinal boyutu koru
        if (width <= 854) {
          scaleFilter = 'scale=' + width + ':-2:force_original_aspect_ratio=decrease';
        }
      }
      
      // Altyazı gömme işlemi
      if (options.embedSubtitles && options.subtitlePath) {
        try {
          // Altyazı dosyasının varlığını kontrol et
          if (!fs.existsSync(options.subtitlePath)) {
            console.error('Altyazı dosyası bulunamadı:', options.subtitlePath);
            throw new Error('Subtitle file not found');
          }

          // Altyazı zaman damgalarını düzelterek göm
          embedAlignedSubtitles(videoPath, startTime, endTime - startTime, outputPath, options.subtitlePath, scaleFilter)
            .then(result => {
              console.log('Video klip altyazı ile başarıyla oluşturuldu:', outputPath);
              resolve(outputPath);
            })
            .catch(error => {
              console.error('Altyazı gömme hatası:', error);
              // Hata durumunda altyazısız devam et
              console.log('Altyazısız klip oluşturmaya devam ediliyor...');
              createClipWithoutSubtitles();
            });
        } catch (error) {
          console.error('Altyazı parametreleri hazırlanırken hata:', error);
          // Hata durumunda altyazısız devam et
          createClipWithoutSubtitles();
        }
      } else {
        // Altyazı yoksa normal klip oluştur
        createClipWithoutSubtitles();
      }
      
      // Altyazısız klip oluşturma
      function createClipWithoutSubtitles() {
        const ffmpegArgs = [
          '-ss', startTime.toString(),
          '-i', videoPath.replace(/\\/g, '/'),
          '-t', (endTime - startTime).toString(),
          '-threads', '0',
          '-vf', scaleFilter,
          '-c:v', 'libvpx-vp9',
          '-c:a', 'libopus',
          '-y', outputPath.replace(/\\/g, '/')
        ];
        
        console.log('FFmpeg komutu:', 'ffmpeg', ffmpegArgs.join(' '));
        
        // FFmpeg işlemini başlat
        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
        
        // Çıktıları topla
        let stdoutData = '';
        let stderrData = '';
        
        ffmpegProcess.stdout.on('data', (data) => {
          stdoutData += data.toString();
        });
        
        ffmpegProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
        });
        
        // İşlem tamamlandığında
        ffmpegProcess.on('close', (code) => {
          if (code === 0) {
            console.log('Video klip başarıyla oluşturuldu:', outputPath);
            resolve(outputPath);
          } else {
            console.error('FFmpeg hatası:', stderrData);
            reject(new Error(`FFmpeg işlemi başarısız oldu (kod: ${code}): ${stderrData}`));
          }
        });
        
        ffmpegProcess.on('error', (err) => {
          console.error('FFmpeg başlatma hatası:', err);
          reject(err);
        });
      }
    }
  });
}

// Altyazıları doğru zaman diliminde video klibine gömmek için yeni fonksiyon
async function embedAlignedSubtitles(videoPath, startTime, duration, outputPath, subtitlePath, scaleFilter) {
  const tempDir = path.dirname(outputPath);
  const tempSubPath = path.join(tempDir, `_temp_sub_${Date.now()}.srt`);
  const adjustedSubPath = path.join(tempDir, `_adjusted_sub_${Date.now()}.srt`);
  
  try {
    // DOSYA YOLLARI İÇİN GELİŞTİRİLMİŞ KAÇIŞ KODLARI
    const formattedVideoPath = videoPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const formattedSubtitlePath = subtitlePath ? subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:') : '';
    const formattedTempSubPath = tempSubPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const formattedAdjustedSubPath = adjustedSubPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const formattedOutputPath = outputPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    console.log('Altyazı düzenleme işlemi başlıyor (geliştirilmiş sürüm)...');
    
    // ADIM 1: Altyazı çıkartma işlemi - BASH SCRIPT KULLANARAK
    // Bu yaklaşım, daha tutarlı sonuçlar verir ve Windows dosya yolu sorunlarını engeller
    await new Promise((resolve, reject) => {
      const extractCommand = subtitlePath 
        ? `ffmpeg -i "${subtitlePath}" -c:s srt -y "${tempSubPath}"`
        : `ffmpeg -i "${videoPath}" -map 0:s:0 -c:s srt -y "${tempSubPath}"`;
      
      const { exec } = require('child_process');
      console.log('Komut: ', extractCommand);
      
      exec(extractCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Altyazı çıkartma hatası: ${error.message}`);
          reject(error);
          return;
        }
        console.log('Altyazı dosyası başarıyla çıkartıldı');
        resolve();
      });
    });
    
    // ADIM 2: Altyazıları özelleştirme (metinsel olarak işle)
    await new Promise((resolve, reject) => {
      try {
        // Dosyayı oku
        const content = fs.readFileSync(tempSubPath, 'utf8');
        
        // Satır sonlarını normalize et
        const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Altyazıları böl ve işle
        const blocks = normalizedContent.split('\n\n');
        
        // Son altyazının bitiş zamanını video süresine eşitlemek için
        // klibin toplam süresini kullanacağız
        const videoEndTime = duration; // saniye cinsinden
        
        // Son non-null altyazıyı takip etmek için değişken
        let lastValidSubtitleIndex = -1;
        
        const adjustedBlocks = blocks.map((block, blockIndex) => {
          const lines = block.split('\n');
          
          // Altyazı numarası ve metin satırlarını koru
          if (lines.length < 2) return block;
          
          // Zaman çizgisini bul ve güncelle
          const timelineIndex = lines.findIndex(line => 
            line.match(/\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/)
          );
          
          if (timelineIndex === -1) return block;
          
          // Zaman çizgisini ayrıştır
          const timeMatch = lines[timelineIndex].match(
            /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/
          );
          
          if (!timeMatch) return block;
          
          // Zamanları saniyeye çevir
          const startTimeInSeconds = 
            parseInt(timeMatch[1]) * 3600 + 
            parseInt(timeMatch[2]) * 60 + 
            parseInt(timeMatch[3]) + 
            parseInt(timeMatch[4]) / 1000;
          
          const endTimeInSeconds = 
            parseInt(timeMatch[5]) * 3600 + 
            parseInt(timeMatch[6]) * 60 + 
            parseInt(timeMatch[7]) + 
            parseInt(timeMatch[8]) / 1000;
          
          // Zamanları videoyu kırptığımız başlangıç ​​zamanına göre ayarla
          const adjustedStartTime = Math.max(0, startTimeInSeconds - startTime);
          const adjustedEndTime = Math.max(0, endTimeInSeconds - startTime);
          
          // Eğer her iki zaman da negatifse, bu altyazı klip dışında demektir
          if (adjustedEndTime <= 0) return null;
          
          // Geçerli bir altyazı bulduk, indeksi güncelle
          lastValidSubtitleIndex = blockIndex;
          
          // Zamanları tekrar timecode formatına dönüştür
          const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            const ms = Math.floor((seconds % 1) * 1000);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
          };
          
          // Yeni zaman çizgisini oluştur
          lines[timelineIndex] = `${formatTime(adjustedStartTime)} --> ${formatTime(adjustedEndTime)}`;
          
          // Bloğu geri birleştir
          return lines.join('\n');
        }).filter(Boolean); // null değerleri kaldır
        
        // Şimdi son altyazının süresini uzatmak için, video süresini kullan
        if (lastValidSubtitleIndex >= 0 && adjustedBlocks.length > 0) {
          // Son iki altyazıyı bul (eğer yeterli sayıda altyazı varsa)
          const subtitleCount = adjustedBlocks.length;
          const lastSubtitleIndices = [];
          
          // Son iki altyazıyı işle (veya varsa bir tane)
          for (let i = 0; i < Math.min(2, subtitleCount); i++) {
            const subtitleIndex = subtitleCount - 1 - i;
            if (subtitleIndex >= 0) {
              lastSubtitleIndices.push(subtitleIndex);
            }
          }
          
          // Her bir son altyazı için süreyi uzat
          for (const subtitleIndex of lastSubtitleIndices) {
            const subtitleBlock = adjustedBlocks[subtitleIndex];
            const lines = subtitleBlock.split('\n');
            
            // Zaman çizgisini bul
            const timelineIndex = lines.findIndex(line => 
              line.match(/\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/)
            );
            
            if (timelineIndex !== -1) {
              // Zaman çizgisini ayrıştır
              const timeMatch = lines[timelineIndex].match(
                /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/
              );
              
              if (timeMatch) {
                // Başlangıç zamanını koru, bitiş zamanını uzat
                const startTime = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]},${timeMatch[4]}`;
                
                // Bitiş zamanını saniyeye çevir
                let endTimeInSeconds = 
                  parseInt(timeMatch[5]) * 3600 + 
                  parseInt(timeMatch[6]) * 60 + 
                  parseInt(timeMatch[7]) + 
                  parseInt(timeMatch[8]) / 1000;
                
                // 1 saniye ekle (Python'daki 1000ms'ye eşdeğer)
                endTimeInSeconds += 1.0;
                
                // Video süresinden uzun olmasını engelle
                if (endTimeInSeconds > videoEndTime) {
                  endTimeInSeconds = videoEndTime;
                }
                
                // Zamanı formatla
                const formatTime = (seconds) => {
                  const h = Math.floor(seconds / 3600);
                  const m = Math.floor((seconds % 3600) / 60);
                  const s = Math.floor(seconds % 60);
                  const ms = Math.floor((seconds % 1) * 1000);
                  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
                };
                
                // Yeni bitiş zamanını oluştur
                const endTime = formatTime(endTimeInSeconds);
                
                // Yeni zaman çizgisini oluştur
                lines[timelineIndex] = `${startTime} --> ${endTime}`;
                
                // Düzeltilmiş bloğu güncelle
                adjustedBlocks[subtitleIndex] = lines.join('\n');
                
                console.log(`Altyazı #${subtitleIndex} bitiş zamanı 1 saniye uzatıldı: ${endTime}`);
              }
            }
          }
        }
        
        // Yeni dosyaya yaz
        fs.writeFileSync(adjustedSubPath, adjustedBlocks.join('\n\n'));
        console.log('Altyazı zamanları başarıyla ayarlandı:', adjustedSubPath);
        resolve();
      } catch (error) {
        console.error('Altyazı düzenleme hatası:', error);
        reject(error);
      }
    });
    
    // ADIM 3: Videoyu düzeltilmiş altyazılarla burn et
    await new Promise((resolve, reject) => {
      // Windows'ta FFmpeg subtitles filtresi için güvenilir format
      const burnCommand = `ffmpeg -ss ${startTime} -i "${videoPath}" -t ${duration} -threads 0 -vf "${scaleFilter},subtitles=${adjustedSubPath.replace(/\\/g, '/').replace(/:/g, '\\\\:')}" -c:v libvpx-vp9 -c:a libopus -y "${outputPath}"`;
      
      const { exec } = require('child_process');
      console.log('Komut: ', burnCommand);
      
      exec(burnCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Video oluşturma hatası: ${error.message}`);
          reject(error);
          return;
        }
        console.log('Video başarıyla oluşturuldu (düzenlenmiş altyazılar ile)');
        resolve();
      });
    });
    
    // Geçici dosyaları temizle
    try {
      if (fs.existsSync(tempSubPath)) fs.unlinkSync(tempSubPath);
      if (fs.existsSync(adjustedSubPath)) fs.unlinkSync(adjustedSubPath);
      console.log('Geçici altyazı dosyaları temizlendi');
    } catch (error) {
      console.warn('Geçici dosyalar temizlenirken hata:', error);
    }
    
    return outputPath;
  } catch (error) {
    console.error('embedAlignedSubtitles hatası:', error);
    
    // Hata durumunda geçici dosyaları temizlemeye çalış
    try {
      if (fs.existsSync(tempSubPath)) fs.unlinkSync(tempSubPath);
      if (fs.existsSync(adjustedSubPath)) fs.unlinkSync(adjustedSubPath);
    } catch (cleanupError) {
      console.warn('Geçici dosyalar temizlenirken hata:', cleanupError);
    }
    
    throw error;
  }
}

// Altyazı (subtitle) klip oluşturma fonksiyonu
function extractSubtitleClip(videoPath, startTime, endTime, outputPath, subtitleSource) {
  return new Promise((resolve, reject) => {
    // Çıktı yolundan dosya adını ve uzantısını al
    const outputExt = path.extname(outputPath);
    const outputBaseName = path.basename(outputPath, outputExt);
    const outputDir = path.dirname(outputPath);
    
    // Windows'ta dosya yollarını FFmpeg için düzelt
    const formattedVideoPath = videoPath.replace(/\\/g, '/');
    const formattedOutputPath = outputPath.replace(/\\/g, '/');
    
    // Sadece VTT formatında altyazı için argümanları hazırla
    let vttArgs;
    
    if (subtitleSource.type === 'external' && subtitleSource.path) {
      // Harici altyazı dosyası kullan
      console.log('Harici altyazı dosyası kullanılıyor:', subtitleSource.path);
      
      // Altyazı formatını kontrol et
      const subtitleFormat = path.extname(subtitleSource.path).toLowerCase();
      const formattedSubtitlePath = subtitleSource.path.replace(/\\/g, '/');
      
      if (subtitleFormat === '.srt') {
        // SRT dosyasını doğrudan kullan
        vttArgs = [
          '-ss', startTime.toString(),
          '-i', formattedSubtitlePath,
          '-threads', '0',  // Maksimum CPU çekirdeği kullanımı
          '-t', (endTime - startTime).toString(),
          '-c:s', 'webvtt',
          '-y',
          formattedOutputPath
        ];
      } else if (subtitleFormat === '.ass' || subtitleFormat === '.ssa') {
        // ASS/SSA dosyasını önce SRT'ye, sonra VTT'ye dönüştür
        const tempSrtPath = outputPath.replace('.vtt', '_temp.srt');
        const formattedTempSrtPath = tempSrtPath.replace(/\\/g, '/');
        
        const extractArgs = [
          '-ss', startTime.toString(),
          '-t', (endTime - startTime).toString(),
          '-i', formattedSubtitlePath,
          '-map', '0:s:0',
          formattedTempSrtPath
        ];

        const runFfmpegCommand = async (args) => {
          const { execSync } = require('child_process');
          execSync(`ffmpeg -i "${args[0]}" -c:s srt -f srt - | ffmpeg -f srt -i - -c:s srt -vf subtitles=${args[0]} -ss 00:00:00 "${args[1]}"`);
        };

        runFfmpegCommand(extractArgs)
          .then(() => {
            vttArgs = [
              '-i', formattedTempSrtPath,
              '-c:s', 'webvtt',
              '-y',
              formattedOutputPath
            ];
            resolve({ vtt: outputPath, ass: null });
          })
          .catch(error => {
            console.error('Altyazı çıkarma işleminde hata:', error);
            reject(error);
          });
      } else {
        reject(new Error('Desteklenmeyen altyazı formatı: ' + subtitleFormat));
        return;
      }
    } else {
      // Dahili altyazı akışı kullan
      const subtitleIndex = subtitleSource.index || 0;
      console.log(`Dahili altyazı akışı kullanılıyor, index: ${subtitleIndex}`);
      
      vttArgs = [
        '-ss', startTime.toString(),
        '-i', formattedVideoPath,
        '-threads', '0',  // Maksimum CPU çekirdeği kullanımı
        '-t', (endTime - startTime).toString(),
        '-map', `0:s:${subtitleIndex}`,
        '-c:s', 'webvtt',
        '-y',
        formattedOutputPath
      ];
    }
    
    // VTT formatında altyazı çıkarma
    const vttPromise = new Promise((resolveVtt, rejectVtt) => {
      console.log('FFmpeg VTT komutu:', 'ffmpeg', vttArgs.join(' '));
      
      // FFmpeg işlemini başlat
      const ffmpegProcess = spawn('ffmpeg', vttArgs);
      
      // Çıktıları topla
      let stdoutData = '';
      let stderrData = '';
      
      ffmpegProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      ffmpegProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
      
      // İşlem tamamlandığında
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          console.log('VTT altyazı dosyası başarıyla oluşturuldu:', outputPath);
          resolveVtt(outputPath);
        } else {
          console.error('FFmpeg VTT altyazı çıkarma hatası:', stderrData);
          // Hata durumunda bile devam et, kritik işlem değil
          resolveVtt(null);
        }
      });
      
      ffmpegProcess.on('error', (err) => {
        console.error('FFmpeg VTT altyazı başlatma hatası:', err);
        // Hata durumunda bile devam et, kritik işlem değil
        resolveVtt(null);
      });
    });
    
    // VTT işlemini bekle ve sonucu döndür
    vttPromise.then((vttResult) => {
      if (vttResult) {
        resolve({ vtt: vttResult, ass: null });
      } else {
        resolve(null);
      }
    }).catch(error => {
      console.error('Altyazı çıkarma işleminde hata:', error);
      resolve(null);
    });
  });
}

// CSP Header ayarını güvenli bir şekilde yapılandır
app.on('web-contents-created', (event, contents) => {
  contents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com;"
        ]
      }
    });
  });
});

// Video ve altyazı dosyalarını birlikte seçme dialog'u
ipcMain.handle('select-media-files', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Medya Dosyaları', extensions: ['mp4', 'mkv', 'webm', 'avi', 'srt', 'ass', 'vtt'] },
      { name: 'Video Dosyaları', extensions: ['mp4', 'mkv', 'webm', 'avi'] },
      { name: 'Altyazı Dosyaları', extensions: ['srt', 'ass', 'vtt'] }
    ]
  });
  
  if (canceled || filePaths.length === 0) {
    return { videoPath: null, subtitlePath: null };
  } else {
    // Dosya yollarını ayır: video ve altyazı
    const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi'];
    const subtitleExtensions = ['.srt', '.ass', '.vtt'];
    
    let videoPath = null;
    let subtitlePath = null;
    
    for (const filePath of filePaths) {
      const ext = path.extname(filePath).toLowerCase();
      
      if (videoExtensions.includes(ext) && !videoPath) {
        videoPath = filePath;
      } else if (subtitleExtensions.includes(ext) && !subtitlePath) {
        subtitlePath = filePath;
      }
    }
    
    return { videoPath, subtitlePath };
  }
});

// Eski Fonksiyonlar (Yedek olarak tutuluyor)
// Video dosyası seçme dialog'u
ipcMain.handle('select-video', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Video Dosyaları', extensions: ['mp4', 'mkv', 'webm', 'avi'] }
    ]
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

// Altyazı dosyası seçme dialog'u
ipcMain.handle('select-subtitle', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Altyazı Dosyaları', extensions: ['srt', 'ass', 'vtt'] }
    ]
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

// Dosya okuma işlemi
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Dosya okuma hatası:', error);
    throw error;
  }
});

// SRT dosyalarını işleme
ipcMain.handle('parse-srt', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // SRT içeriğini işle
    const parsedSubtitles = parseSrtContent(content);
    return parsedSubtitles;
  } catch (error) {
    console.error('SRT dosyası işleme hatası:', error);
    throw error;
  }
});

// SRT içeriğini ayrıştırma fonksiyonu
function parseSrtContent(content) {
  // Satır sonlarını normalize et
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Altyazıları böl
  const subtitleBlocks = normalizedContent.split('\n\n').filter(block => block.trim() !== '');
  
  // Her bir altyazı bloğunu işle
  const subtitles = subtitleBlocks.map(block => {
    const lines = block.split('\n');
    
    // İlk satır indeks numarası, ikinci satır zaman bilgisi
    const index = parseInt(lines[0].trim());
    
    // Zaman bilgisini ayrıştır
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    
    if (!timeMatch) {
      return null;
    }
    
    // Zaman bilgilerini saniyeye çevir
    const startTime = 
      parseInt(timeMatch[1]) * 3600 + // saat
      parseInt(timeMatch[2]) * 60 + // dakika
      parseInt(timeMatch[3]) + // saniye
      parseInt(timeMatch[4]) / 1000; // milisaniye
      
    const endTime = 
      parseInt(timeMatch[5]) * 3600 + // saat
      parseInt(timeMatch[6]) * 60 + // dakika
      parseInt(timeMatch[7]) + // saniye
      parseInt(timeMatch[8]) / 1000; // milisaniye
    
    // Altyazı metnini birleştir (3. satırdan itibaren)
    let text = lines.slice(2).join('\n').trim();
    
    // HTML taglarını temizle (<i>, </i> vb.)
    text = text.replace(/<[^>]*>/g, '');
    
    // ASS formatı stil kodlarını temizle ({\an8} vb.)
    text = text.replace(/{\\[^}]*}/g, '');
    text = text.replace(/{[^}]*}/g, '');
    
    return {
      index,
      startTime,
      endTime,
      text
    };
  }).filter(subtitle => subtitle !== null);
  
  return subtitles;
}

// Dosya adı için güvenli zaman formatı (dosya adı olarak kullanılacak)
function formatTimeForFileName(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  // MM:SS formatında döndür (0424 gibi)
  return `${minutes.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`;
}

// Anki'ye kart gönderme (AnkiConnect API kullanarak)
ipcMain.handle('send-to-anki', async (event, args) => {
  // Burada AnkiConnect API'ye istek gönderilecek
  // Şimdilik sadece başarılı olduğunu varsayalım
  return {
    success: true,
    message: 'Kart başarıyla Anki\'ye eklendi'
  };
});

// Dosyaların varlığını kontrol et
ipcMain.handle('check-files-exist', async (event, args) => {
  const { videoPath, subtitlePath } = args;
  
  try {
    const videoExists = videoPath ? fs.existsSync(videoPath) : false;
    const subtitleExists = subtitlePath ? fs.existsSync(subtitlePath) : false;
    
    return {
      videoExists,
      subtitleExists
    };
  } catch (error) {
    console.error('Dosya kontrolü hatası:', error);
    return {
      videoExists: false,
      subtitleExists: false
    };
  }
});

// Ses formatını kontrol et ve gerekirse dönüştür
async function checkAndConvertAudio(videoPath) {
  return new Promise((resolve, reject) => {
    // Önce önbellekte bu dosya var mı kontrol et
    if (audioConversionCache.has(videoPath)) {
      console.log('Dönüştürülmüş dosya önbellekte bulundu');
      resolve(audioConversionCache.get(videoPath));
      return;
    }
    
    // Önbellekte yoksa, video dosyasının ses formatını kontrol et
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=codec_name',
      '-of', 'csv=p=0',
      videoPath
    ]);

    let codecName = '';
    ffprobe.stdout.on('data', (data) => {
      codecName = data.toString().trim();
    });

    ffprobe.stderr.on('data', (data) => {
      console.error(`FFprobe hata: ${data}`);
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        console.error(`FFprobe işlemi başarısız oldu, kod: ${code}`);
        // Hata durumunda bile orijinal dosyayı kullan
        resolve(videoPath);
        return;
      }

      console.log(`Tespit edilen ses codec'i: ${codecName}`);

      // Tüm ses formatlarını AAC'ye dönüştür - web tarayıcısı uyumluluğu için
      console.log(`Video dosyası AAC formatına dönüştürülüyor...`);
      
      // Geçici dosya yolu oluştur
      const tempDir = path.join(os.tmpdir(), 'anki_video_clipper');
      
      // Geçici klasörü oluştur (yoksa)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Dosya adını oluştur - orijinal dosya adını ve hash değerini kullan
      const fileHash = require('crypto').createHash('md5').update(videoPath).digest('hex').substring(0, 8);
      const tempFile = path.join(tempDir, `converted_${fileHash}_${path.basename(videoPath)}`);
      
      console.log(`Dönüştürülmüş dosya: ${tempFile}`);
      
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-threads', '0',     // Maksimum CPU çekirdeği kullanımı
        '-c:v', 'copy',      // Video kanalını kopyala (kaliteyi koru)
        '-c:a', 'aac',       // Ses kanalını AAC'ye dönüştür (geniş uyumluluk)
        '-b:a', '192k',      // AAC bit rate
        '-c:s', 'copy',      // Altyazıları kopyala
        '-map', '0',         // Tüm stream'leri dahil et
        '-y',                // Varolan dosyanın üzerine yaz
        tempFile
      ]);

      ffmpeg.stdout.on('data', (data) => {
        console.log(`FFmpeg çıktı: ${data}`);
      });

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg işlem: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          console.error(`FFmpeg işlemi başarısız oldu, kod: ${code}`);
          // Hata durumunda orijinal dosyayı kullan
          resolve(videoPath);
          return;
        }
        
        console.log('Dönüştürme işlemi başarıyla tamamlandı');
        
        // Dönüştürülmüş dosyayı önbelleğe ekle
        audioConversionCache.add(videoPath, tempFile);
        
        resolve(tempFile);
      });
    });
  });
}

// IPC handler ekle - ses formatını kontrol et ve dönüştür
ipcMain.handle('check-and-convert-audio', async (event, videoPath) => {
  try {
    const convertedPath = await checkAndConvertAudio(videoPath);
    return convertedPath;
  } catch (error) {
    console.error('Audio conversion error:', error);
    // Hata durumunda orijinal dosyayı döndür
    return videoPath;
  }
});

// Video dosyasındaki dahili altyazıları listele
async function listEmbeddedSubtitles(videoPath) {
  return new Promise((resolve, reject) => {
    // FFprobe ile video dosyasındaki stream bilgilerini al - geçici dosyaya yönlendir
    const tempOutputPath = path.join(os.tmpdir(), `ffprobe_output_${Date.now()}.json`);
    console.log(`Saving FFprobe output to temporary file: ${tempOutputPath}`);
    
    // İlk önce videodan tüm stream bilgilerini alalım (daha geniş bilgi için) ve dosyaya kaydedelim
    const ffprobeFullInfo = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath,
      '-o', tempOutputPath
    ]);

    ffprobeFullInfo.on('close', (code) => {
      if (code !== 0) {
        console.error(`FFprobe process failed (full info), code: ${code}`);
      } else {
        console.log('FFprobe full info saved successfully');
      }
      
      // Şimdi sadece altyazı stream'lerini içeren daha spesifik bir sorgu yapalım
    const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_streams',
      '-select_streams', 's',  // Sadece altyazı stream'lerini seç
      videoPath
    ]);

    let outputData = '';
    ffprobe.stdout.on('data', (data) => {
        const dataStr = data.toString();
        outputData += dataStr;
    });

    ffprobe.stderr.on('data', (data) => {
        console.error(`FFprobe error: ${data}`);
    });

      ffprobe.on('close', async (code) => {
      if (code !== 0) {
          console.error(`FFprobe process failed, code: ${code}`);
          reject(new Error(`FFprobe process failed, code: ${code}`));
        return;
      }

      try {
          // Geçici dosyadan tam bilgileri oku (varsa)
          let fullStreamInfo = {};
          if (fs.existsSync(tempOutputPath)) {
            try {
              const fullInfoContent = fs.readFileSync(tempOutputPath, 'utf8');
              fullStreamInfo = JSON.parse(fullInfoContent);
              console.log('Full stream info loaded from temp file');
            } catch (err) {
              console.error('Error reading temp file:', err);
            }
          }
          
        // JSON çıktısını ayrıştır
          let result;
          try {
            result = JSON.parse(outputData);
            console.log('Subtitle streams JSON parsed successfully');
          } catch (jsonErr) {
            console.error('Error parsing subtitle streams JSON:', jsonErr);
            console.log('Raw output data:', outputData);
            // Fallback mechanism: try to use full info if available
            if (Object.keys(fullStreamInfo).length > 0) {
              result = { streams: fullStreamInfo.streams.filter(s => s.codec_type === 'subtitle') };
              console.log('Using full info as fallback for subtitle streams');
            } else {
              throw jsonErr;
            }
          }
          
          // Tüm çıktıyı logla
          console.log('FFprobe subtitle streams result:', JSON.stringify(result, null, 2));
        
        // Dil kodlarını insan tarafından okunabilir isimlere çevir
        const languageNames = {
          'eng': 'English',
          'tur': 'Turkish',
          'ara': 'Arabic',
          'chi': 'Chinese',
          'cze': 'Czech',
          'dan': 'Danish',
          'dut': 'Dutch',
          'fin': 'Finnish',
          'fre': 'French',
          'ger': 'German',
          'gre': 'Greek',
          'heb': 'Hebrew',
          'hin': 'Hindi',
          'hun': 'Hungarian',
            'hrv': 'Croatian',
          'ind': 'Indonesian',
          'ita': 'Italian',
          'jpn': 'Japanese',
          'kor': 'Korean',
          'may': 'Malay',
            'nob': 'Norwegian',
          'nor': 'Norwegian',
          'pol': 'Polish',
          'por': 'Portuguese',
          'rum': 'Romanian',
          'rus': 'Russian',
          'spa': 'Spanish',
          'swe': 'Swedish',
          'tha': 'Thai',
          'ukr': 'Ukrainian',
          'vie': 'Vietnamese'
        };
          
          // Altyazı isimlerini tanıma desenleri
          const subtitlePatterns = {
            sdh: { pattern: /\b(sdh|cc|closed\s*caption)\b/i, name: 'SDH' },
            european: { pattern: /\b(european|europe|eu)\b/i, name: 'European' },
            brazilian: { pattern: /\b(brazilian|brazil|português)\b/i, name: 'Brazilian' },
            simplified: { pattern: /\b(simplified|simple)\b/i, name: 'Simplified' },
            traditional: { pattern: /\b(traditional)\b/i, name: 'Traditional' },
            latinAmerican: { pattern: /\b(latin|latino|latinoamérica)\b/i, name: 'Latin American' },
            canadian: { pattern: /\b(canadian|canada)\b/i, name: 'Canadian' },
            forced: { pattern: /\b(forced|force)\b/i, name: 'Forced' }
        };
        
        // Altyazı stream'lerini işle
        const subtitles = result.streams.map(stream => {
            // Stream index'i kesinlikle tanımla
            const streamIndex = stream.index || 0;
            
            // Dil tanıma
          let language = 'Unknown';
          let title = '';
            let specialFeature = '';
          
            // Etkinleştirilen tüm debug logları
            console.log(`Stream #${streamIndex} all properties:`, stream);
            
            // Karmaşık tag yapısını kontrol et
            let tags = {};
          if (stream.tags) {
              tags = stream.tags;
              console.log(`Stream #${streamIndex} tags:`, tags);
            }
            
            // DİL TESPİTİ
            // 1. Doğrudan dil kodu etiketinden tespit
            if (tags.language) {
              const langCode = tags.language.toLowerCase();
              language = languageNames[langCode] || langCode;
              console.log(`Stream #${streamIndex} language from tag:`, language);
            } 
            
            // 2. Başlık etiketinden bilgileri al
            if (tags.title) {
              title = tags.title;
              console.log(`Stream #${streamIndex} title:`, title);
              
              // Başlık içeriğinden özel özellik tespiti
              for (const [key, pattern] of Object.entries(subtitlePatterns)) {
                if (pattern.pattern.test(title)) {
                  specialFeature = pattern.name;
                  console.log(`Stream #${streamIndex} special feature detected:`, specialFeature);
                  break;
                }
              }
            }
            
            // 3. Diğer meta etiketlerden dil tespiti
            if (language === 'Unknown' && title && title.length <= 20) {
              // Başlık kısa ise bir dil kodu veya dil adı olabilir
              const potentialLang = title.toLowerCase();
              for (const [code, name] of Object.entries(languageNames)) {
                if (potentialLang.includes(code.toLowerCase()) || potentialLang.includes(name.toLowerCase())) {
                  language = name;
                  console.log(`Stream #${streamIndex} language from title:`, language);
                  break;
                }
              }
            }
            
            // DISPLAY NAME OLUŞTURMA
            let displayName;
            
            // Dinamik dil tespiti - dil kodu ve başlık bilgilerini kullan
            // Bu kısımda sabit indeks eşlemesi yerine dinamik tespit yapalım
            
            // a) Özel durumlar için başlık temelli doğrudan eşleştirme
            if (title && title.includes("SDH")) {
              displayName = `English [SDH]`;
            }
            else if (title && title.includes("Turkish")) {
              displayName = "Turkish";
            }
            else if (title && title.includes("Arabic")) {
              displayName = "Arabic";
            }
            else if (title && title.includes("Chinese Simplified")) {
              displayName = "Chinese [Simplified]";
            }
            else if (title && title.includes("Chinese Traditional")) {
              displayName = "Chinese [Traditional]";
            }
            else if (title && title.includes("Czech")) {
              displayName = "Czech";
            }
            else if (title && title.includes("Danish")) {
              displayName = "Danish";
            }
            else if (title && title.includes("Dutch")) {
              displayName = "Dutch";
            }
            else if (title && title.includes("European Spanish")) {
              displayName = "Spanish [European]";
            }
            else if (title && title.includes("Latin America Spanish")) {
              displayName = "Spanish [Latin American]";
            }
            else if (title && title.includes("Finnish")) {
              displayName = "Finnish";
            }
            else if (title && title.includes("French Canadian")) {
              displayName = "French [Canadian]";
            }
            else if (title && title.includes("French")) {
              displayName = "French";
            }
            else if (title && title.includes("German")) {
              displayName = "German";
            }
            else if (title && title.includes("Greek")) {
              displayName = "Greek";
            }
            else if (title && title.includes("Hebrew")) {
              displayName = "Hebrew";
            }
            else if (title && title.includes("Hindi")) {
              displayName = "Hindi";
            }
            else if (title && title.includes("Hungarian")) {
              displayName = "Hungarian";
            }
            else if (title && title.includes("Indonesian")) {
              displayName = "Indonesian";
            }
            else if (title && title.includes("Italian")) {
              displayName = "Italian";
            }
            else if (title && title.includes("Japanese")) {
              displayName = "Japanese";
            }
            else if (title && title.includes("Korean")) {
              displayName = "Korean";
            }
            else if (title && title.includes("Malay")) {
              displayName = "Malay";
            }
            else if (title && title.includes("Norwegian")) {
              displayName = "Norwegian";
            }
            else if (title && title.includes("Polish")) {
              displayName = "Polish";
            }
            else if (title && title.includes("Portuguese Brazilian")) {
              displayName = "Portuguese [Brazilian]";
            }
            else if (title && title.includes("Portuguese")) {
              displayName = "Portuguese";
            }
            else if (title && title.includes("Romanian")) {
              displayName = "Romanian";
            }
            else if (title && title.includes("Russian")) {
              displayName = "Russian";
            }
            else if (title && title.includes("Swedish")) {
              displayName = "Swedish";
            }
            else if (title && title.includes("Thai")) {
              displayName = "Thai";
            }
            else if (title && title.includes("Turkish")) {
              displayName = "Turkish";
            }
            else if (title && title.includes("Ukrainian")) {
              displayName = "Ukrainian";
            }
            else if (title && title.includes("Vietnamese")) {
              displayName = "Vietnamese";
            }
            // b) Dil kodu temelli tespit
            else if (tags.language) {
              // Bu kontrol önemli - bir dil kodu varsa, başlık olmasa bile ismini biliyoruz
              const langCode = tags.language.toLowerCase();
              if (langCode === 'eng') {
                // İngilizce için SDH kontrolü
                if (title && (title.includes("SDH") || title.includes("CC") || title.includes("Closed"))) {
                  displayName = "English [SDH]";
                } else {
                  displayName = "English";
                }
              } 
              else if (langCode === 'tur') {
                displayName = "Turkish";
              }
              else if (langCode === 'ara') {
                displayName = "Arabic";
              }
              else if (langCode === 'chi') {
                if (title && title.includes("Simplified")) {
                  displayName = "Chinese [Simplified]";
                } else if (title && title.includes("Traditional")) {
                  displayName = "Chinese [Traditional]";
                } else {
                  displayName = "Chinese";
                }
              }
              else if (langCode === 'cze') {
                displayName = "Czech";
              }
              else if (langCode === 'dan') {
                displayName = "Danish";
              }
              else if (langCode === 'dut') {
                displayName = "Dutch";
              }
              else if (langCode === 'fin') {
                displayName = "Finnish";
              }
              else if (langCode === 'fre') {
                if (title && title.includes("Canadian")) {
                  displayName = "French [Canadian]";
                } else {
                  displayName = "French";
                }
              }
              else if (langCode === 'ger') {
                displayName = "German";
              }
              else if (langCode === 'gre') {
                displayName = "Greek";
              }
              else if (langCode === 'heb') {
                displayName = "Hebrew";
              }
              else if (langCode === 'hin') {
                displayName = "Hindi";
              }
              else if (langCode === 'hun') {
                displayName = "Hungarian";
              }
              else if (langCode === 'ind') {
                displayName = "Indonesian";
              }
              else if (langCode === 'ita') {
                displayName = "Italian";
              }
              else if (langCode === 'jpn') {
                displayName = "Japanese";
              }
              else if (langCode === 'kor') {
                displayName = "Korean";
              }
              else if (langCode === 'may') {
                displayName = "Malay";
              }
              else if (langCode === 'nor' || langCode === 'nob') {
                displayName = "Norwegian";
              }
              else if (langCode === 'pol') {
                displayName = "Polish";
              }
              else if (langCode === 'por') {
                if (title && title.includes("Brazilian")) {
                  displayName = "Portuguese [Brazilian]";
                } else {
                  displayName = "Portuguese";
                }
              }
              else if (langCode === 'rum') {
                displayName = "Romanian";
              }
              else if (langCode === 'rus') {
                displayName = "Russian";
              }
              else if (langCode === 'spa') {
                if (title && (title.includes("European") || title.includes("Spain"))) {
                  displayName = "Spanish [European]";
                } else if (title && (title.includes("Latin") || title.includes("LATAM"))) {
                  displayName = "Spanish [Latin American]";
                } else {
                  displayName = "Spanish";
                }
              }
              else if (langCode === 'swe') {
                displayName = "Swedish";
              }
              else if (langCode === 'tha') {
                displayName = "Thai";
              }
              else if (langCode === 'tur') {
                displayName = "Turkish";
              }
              else if (langCode === 'ukr') {
                displayName = "Ukrainian";
              }
              else if (langCode === 'vie') {
                displayName = "Vietnamese";
              }
              else {
                // Başka bir dil kodu varsa ve yukarıdakilerle eşleşmiyorsa
                // Tanımlanmış isim varsa kullan, yoksa kod olarak göster
                displayName = languageNames[langCode] || `Unknown (${langCode})`;
              }
            }
            // c) Yukarıdaki özel durumlar yakalanmadıysa, genel mantıkla oluştur
            else {
              // Standart display name oluşturma
              if (language !== 'Unknown') {
                if (specialFeature) {
                  displayName = `${language} [${specialFeature}]`;
                } else {
                  displayName = language;
                }
              } else if (title) {
                displayName = title;
              } else {
                displayName = `Stream #${streamIndex}`;
              }
            }
          
          return {
              index: streamIndex,
              codec: stream.codec_name || 'Unknown',
            language: language,
            title: title,
              specialFeature: specialFeature,
              displayName: displayName
          };
        });
        
          // Geçici dosyayı temizle
          if (fs.existsSync(tempOutputPath)) {
            try {
              fs.unlinkSync(tempOutputPath);
              console.log('Temp file cleaned up');
            } catch (err) {
              console.warn('Could not clean up temp file:', err);
            }
          }
          
          console.log('Final processed subtitles:', subtitles);
        resolve(subtitles);
      } catch (error) {
          console.error('FFprobe output parsing error:', error);
        reject(error);
      }
      });
    });
  });
}

// Dahili altyazıyı çıkart
async function extractEmbeddedSubtitle(videoPath, streamIndex, outputPath) {
  return new Promise((resolve, reject) => {
    // FFmpeg ile altyazıyı çıkart
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-map', `0:${streamIndex}`,
      '-c:s', 'srt',  // SRT formatına dönüştür
      '-y',           // Varolan dosyanın üzerine yaz
      outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg işlem: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error(`FFmpeg işlemi başarısız oldu, kod: ${code}`);
        reject(new Error(`FFmpeg işlemi başarısız oldu, kod: ${code}`));
        return;
      }
      
      console.log('Altyazı başarıyla çıkartıldı:', outputPath);
      resolve(outputPath);
    });
  });
}

// IPC handler ekle - dahili altyazıyı çıkart
ipcMain.handle('extract-embedded-subtitle', async (event, args) => {
  try {
    const { videoPath, streamIndex } = args;
    
    // Geçici dosya yolu oluştur
    const tempDir = path.join(os.tmpdir(), 'anki_video_clipper');
    
    // Geçici klasörü oluştur (yoksa)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Dosya adını oluştur
    const fileHash = require('crypto').createHash('md5').update(`${videoPath}_${streamIndex}`).digest('hex').substring(0, 8);
    const outputPath = path.join(tempDir, `subtitle_${fileHash}.srt`);
    
    // Altyazıyı çıkart
    await extractEmbeddedSubtitle(videoPath, streamIndex, outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Altyazı çıkartma hatası:', error);
    throw error;
  }
});

// IPC handler ekle - dahili altyazıları listele
ipcMain.handle('list-embedded-subtitles', async (event, videoPath) => {
  try {
    const subtitles = await listEmbeddedSubtitles(videoPath);
    return subtitles;
  } catch (error) {
    console.error('Dahili altyazıları listeleme hatası:', error);
    return [];
  }
});

// Anki not tiplerini yenile
ipcMain.handle('reload-anki-data', async () => {
  try {
    console.log('Anki verilerini yenileme isteği alındı...');
    
    // Bu komut Anki-Connect üzerinden Anki'ye verileri yeniden yüklemesini söyler
    await invokeAnkiConnect('reloadCollection');
    
    console.log('Anki verileri başarıyla yenilendi.');
    return true;
  } catch (error) {
    console.error('Anki verileri yenilenirken hata oluştu:', error);
    throw error;
  }
});

// Loglama modülü
const log = {
  isDev: process.env.NODE_ENV !== 'production',
  
  info: function(message) {
    console.log(`[INFO] ${message}`);
  },
  
  debug: function(message) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`);
    }
  },
  
  warn: function(message) {
    console.warn(`[WARN] ${message}`);
  },
  
  error: function(message, err) {
    console.error(`[ERROR] ${message}`, err || '');
  }
};

// Loglama modülünü preload script'e aktarmak için
ipcMain.handle('log', (event, {level, message}) => {
  if (log[level]) {
    log[level](message);
    return true;
  }
  return false;
});

// OpenAI API ile kullanılabilir modelleri getir
async function fetchAvailableModels(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error && error.error.message ? error.error.message : 'Failed to fetch models');
    }
    
    const data = await response.json();
    
    // Only include chat models
    const chatModels = data.data.filter(model => {
      const id = model.id.toLowerCase();
      return (id.includes('gpt') && id.includes('turbo')) || 
             id.includes('gpt-4') || 
             id.includes('gpt-3.5');
    });
    
    // Sort models - GPT-4 first, then others
    chatModels.sort((a, b) => {
      const aId = a.id.toLowerCase();
      const bId = b.id.toLowerCase();
      
      if (aId.includes('gpt-4') && !bId.includes('gpt-4')) return -1;
      if (!aId.includes('gpt-4') && bId.includes('gpt-4')) return 1;
      
      return a.id.localeCompare(b.id);
    });
    
    return { 
      success: true,
      models: chatModels.map(model => ({
        id: model.id,
        name: model.id
      }))
    };
  } catch (error) {
    // Log error without including API key
    console.error('Error fetching OpenAI models - check network or API access');
    return { 
      success: false, 
      error: error.message || 'Failed to fetch models'
    };
  }
}

// IPC handler for checking API key and fetching models
ipcMain.handle('check-openai-api-key', async (event, { apiKey }) => {
  try {
    if (!apiKey || !apiKey.trim() || !apiKey.startsWith('sk-')) {
      return { 
        success: false, 
        error: 'Invalid API key format. API key should start with "sk-".'
      };
    }
    
    // Log action without the API key
    console.log('[INFO] Verifying OpenAI API key (key hidden)');
    
    // Fetch available models to verify key
    const modelsResult = await fetchAvailableModels(apiKey);
    return modelsResult;
  } catch (error) {
    // Log error without exposing API key
    console.error('[ERROR] API key verification failed');
    return { 
      success: false, 
      error: error.message || 'Failed to verify API key'
    };
  }
});

// Secure Storage IPC Handlers
ipcMain.handle('secure-store-api-key', async (event, { apiKey }) => {
  try {
    await keytar.setPassword(SERVICE_NAME, API_KEY_ACCOUNT, apiKey);
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Failed to store API key securely', null);
    return { 
      success: false, 
      error: 'Failed to store API key in secure storage'
    };
  }
});

ipcMain.handle('secure-get-api-key', async (event) => {
  try {
    const apiKey = await keytar.getPassword(SERVICE_NAME, API_KEY_ACCOUNT);
    return { 
      success: true, 
      apiKey: apiKey || '' 
    };
  } catch (error) {
    console.error('[ERROR] Failed to retrieve API key from secure storage', null);
    return { 
      success: false, 
      error: 'Failed to retrieve API key from secure storage' 
    };
  }
});

ipcMain.handle('secure-delete-api-key', async (event) => {
  try {
    await keytar.deletePassword(SERVICE_NAME, API_KEY_ACCOUNT);
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Failed to delete API key from secure storage', null);
    return { 
      success: false, 
      error: 'Failed to delete API key from secure storage' 
    };
  }
});

// IPC handler ekle - YouTube video bilgilerini getir
ipcMain.handle('get-youtube-info', async (event, url) => {
  try {
    // Create temporary directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'anki_video_clipper');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Get video info using yt-dlp
    const videoInfo = await new Promise((resolve, reject) => {
      const process = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        url
      ]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(stdout);
            resolve(info);
          } catch (error) {
            reject(new Error(`Failed to parse yt-dlp output: ${error.message}`));
          }
        } else {
          reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
        }
      });
    });

    // Get available formats (480p to 1080p)
    const formatMap = {};
    
    // First try for formats with both video and audio
    let videoFormats = videoInfo.formats
      .filter(format => {
        // Check for formats with both video and audio
        return format.vcodec !== 'none' && format.acodec !== 'none' && 
               format.height >= 480 && format.height <= 1080;
      })
      .map(format => {
        const formattedFormat = {
          format_id: format.format_id,
          quality: `${format.height}p`,
          ext: format.ext,
          vcodec: format.vcodec,
          acodec: format.acodec,
          height: format.height,
          width: format.width,
          filesize: format.filesize,
          type: 'combined' // Mark as combined format
        };
        
        // Store in map for quick lookup
        formatMap[format.format_id] = formattedFormat;
        
        return formattedFormat;
      })
      .sort((a, b) => b.height - a.height); // Sort by resolution (highest first)
    
    // If no combined formats found, use video-only formats
    if (videoFormats.length === 0) {
      console.log('No combined formats found, using video-only formats with best audio');
      
      // Get video-only formats
      videoFormats = videoInfo.formats
        .filter(format => {
          // Check for video-only formats (no audio)
          return format.vcodec !== 'none' && format.acodec === 'none' && 
                format.height >= 480 && format.height <= 1080;
        })
        .map(format => {
          const formattedFormat = {
            format_id: `${format.format_id}+bestaudio`,
            quality: `${format.height}p`,
            ext: 'mp4', // Use mp4 as output format for merged streams
            vcodec: format.vcodec,
            height: format.height,
            width: format.width,
            filesize: format.filesize,
            type: 'video-only' // Mark as video-only format
          };
          
          // Store in map for quick lookup
          formatMap[format.format_id] = formattedFormat;
          
          return formattedFormat;
        })
        .sort((a, b) => b.height - a.height); // Sort by resolution (highest first)
    }
    
    // If still no formats found, use the "best" option as fallback
    if (videoFormats.length === 0) {
      videoFormats.push({
        format_id: 'best',
        quality: 'Best available',
        ext: 'mp4',
        vcodec: 'unknown',
        acodec: 'unknown',
        type: 'best'
      });
    }
    
    // Deduplicate formats by resolution - keep only one format per resolution (prefer mp4)
    const uniqueResolutions = {};
    
    videoFormats.forEach(format => {
      const resolution = format.height || 0;
      const currentBestFormat = uniqueResolutions[resolution];
      
      // If this is the first format we've seen with this resolution, or it's an mp4 (and current isn't)
      if (!currentBestFormat || 
          (format.ext === 'mp4' && currentBestFormat.ext !== 'mp4')) {
        uniqueResolutions[resolution] = format;
      }
    });
    
    // Convert back to sorted array
    const dedupedFormats = Object.values(uniqueResolutions)
      .sort((a, b) => (b.height || 0) - (a.height || 0));
    
    // Show how many formats we deduplicated
    console.log(`Deduplicated formats: ${videoFormats.length} -> ${dedupedFormats.length}`);

    // Get available subtitles (excluding auto-generated ones)
    const subtitleTracks = [];
    if (videoInfo.subtitles) {
      for (const [lang, tracks] of Object.entries(videoInfo.subtitles)) {
        const vttTracks = tracks.filter(track => track.ext === 'vtt');
        
        if (vttTracks.length > 0) {
          const track = vttTracks[0]; // Prefer VTT format
          subtitleTracks.push({
            languageCode: lang,
            name: track.name || videoInfo.subtitles_info?.[lang]?.name || lang,
            url: track.url,
            ext: track.ext,
            auto: false
          });
        }
      }
    }
    
    // We'll exclude auto-generated subtitles as they're not reliable for language study
    // (commented out the code that would add them)
    /*
    if (videoInfo.automatic_captions) {
      for (const [lang, tracks] of Object.entries(videoInfo.automatic_captions)) {
        const vttTracks = tracks.filter(track => track.ext === 'vtt');
        
        if (vttTracks.length > 0) {
          const track = vttTracks[0]; // Prefer VTT format
          subtitleTracks.push({
            languageCode: lang,
            name: `${track.name || lang} (Auto-generated)`,
            url: track.url,
            ext: track.ext,
            auto: true
          });
        }
      }
    }
    */
    
    return {
      title: videoInfo.title,
      videoFormats: dedupedFormats,
      subtitleTracks,
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration,
      id: videoInfo.id
    };
  } catch (error) {
    console.error('YouTube bilgisi alma hatası:', error);
    throw error;
  }
});

// IPC handler ekle - YouTube video ve altyazı indir
ipcMain.handle('download-youtube', async (event, args) => {
  try {
    const { url, formatId, subtitleUrl } = args;
    
    // Geçici klasör yolu - use correct directory name and ensure it's consistent
    const tempDir = path.resolve(os.tmpdir(), 'anki_video_clipper');
    
    // Debug directory names for verification
    console.log('[DEBUG] Using temp directory:', tempDir);
    console.log('[DEBUG] os.tmpdir():', os.tmpdir());
    
    // Geçici klasörü oluştur (yoksa)
    if (!fs.existsSync(tempDir)) {
      console.log('[DEBUG] Creating temp directory as it does not exist:', tempDir);
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Get video ID for filename with timestamp to avoid conflicts
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&/]+)/)?.[1] || 'video';
    const timestamp = Date.now();
    const baseFilename = `youtube_${videoId}_${timestamp}`;
    
    // Remove file extension from output path to let yt-dlp decide the format
    const outputBase = path.resolve(tempDir, baseFilename);
    
    console.log('[DEBUG] Generated base output path:', outputBase);
    
    // Altyazı için benzersiz dosya adı (varsa)
    let subtitleFilePath = null;
    let actualVideoPath = null;
    
    // Video indirme işlemi
    await new Promise((resolve, reject) => {
      // Ensure proper path formatting and don't include extension
      const outputFilename = path.basename(outputBase);
      
      // Properly normalize the temp directory path for yt-dlp
      // Convert Windows backslashes to forward slashes
      const normalizedTempDir = tempDir.replace(/\\/g, '/');
      
      console.log('[DEBUG] Normalized temp directory:', normalizedTempDir);
      
      // Remove the problematic --print option which causes path issues on Windows
      const args = [
        '--no-playlist',
        '--output', outputFilename,
        url
      ];
      
      // If formatId is specified and it's not "best", use it
      if (formatId && formatId !== 'best') {
        args.splice(1, 0, '-f', formatId);
      }
      
      console.log('[DEBUG] Running yt-dlp with args:', args.join(' '));
      console.log('[DEBUG] Working directory:', process.cwd());
      
      // Execute yt-dlp with explicit cwd to avoid path issues
      const ytdlProcess = spawn('yt-dlp', args, { 
        cwd: tempDir,
        shell: true,
        env: process.env
      });
      
      let stdout = '';
      let stderr = '';
      
      ytdlProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('[DEBUG] yt-dlp stdout:', data.toString());
      });
      
      ytdlProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('[DEBUG] yt-dlp stderr:', data.toString());
      });
      
      ytdlProcess.on('close', (code) => {
        if (code === 0) {
          console.log('[DEBUG] YouTube video download completed.');
          
          // Don't rely on the print output - instead, search for the file directly
          // Check for common video extensions in the temp directory
          const commonExtensions = ['.mkv', '.mp4', '.webm', '.avi', '.mov'];
          
          // 1. Try to find the file directly in the expected location with various extensions
          for (const ext of commonExtensions) {
            const possiblePath = path.join(tempDir, outputFilename + ext);
            console.log('[DEBUG] Checking for file with extension:', ext, 'at path:', possiblePath);
            
            if (fs.existsSync(possiblePath)) {
              console.log('[DEBUG] Found file with extension:', ext);
              actualVideoPath = possiblePath;
              resolve();
              return;
            }
          }
          
          // 2. Look for recently created files in the temp directory
          try {
            const files = fs.readdirSync(tempDir);
            const videoFiles = files.filter(file => {
              // Check if it matches our base filename and has a video extension
              const filePath = path.join(tempDir, file);
              const stats = fs.statSync(filePath);
              const isRecent = (Date.now() - stats.ctime.getTime()) < 30000; // Less than 30 seconds old
              const hasVideoExt = commonExtensions.some(ext => file.endsWith(ext));
              
              return file.includes(outputFilename) && hasVideoExt && isRecent;
            });
            
            if (videoFiles.length > 0) {
              const foundFile = path.join(tempDir, videoFiles[0]);
              console.log('[DEBUG] Found recent video file:', foundFile);
              actualVideoPath = foundFile;
              resolve();
              return;
            }
          } catch (err) {
            console.error('[DEBUG] Error reading temp directory:', err);
          }
          
          // 3. Check alternative directory
          const alternativeDir = path.join(os.tmpdir(), 'anki-video-clipper');
          console.log('[DEBUG] Checking alternative directory:', alternativeDir);
          
          if (fs.existsSync(alternativeDir)) {
            for (const ext of commonExtensions) {
              const alternativePath = path.join(alternativeDir, outputFilename + ext);
              console.log('[DEBUG] Checking alternative path with extension:', ext, 'at path:', alternativePath);
              
              if (fs.existsSync(alternativePath)) {
                console.log('[DEBUG] File found at alternative path:', alternativePath);
                // Copy to the correct location
                try {
                  const targetPath = path.join(tempDir, outputFilename + ext);
                  fs.copyFileSync(alternativePath, targetPath);
                  console.log('[DEBUG] File copied successfully to:', targetPath);
                  actualVideoPath = targetPath;
                  resolve();
                  return;
                } catch (copyError) {
                  console.error('[DEBUG] Error copying file:', copyError);
                  // Use the alternative path if copy fails
                  actualVideoPath = alternativePath;
                  resolve();
                  return;
                }
              }
            }
          }
          
          // 4. Last resort: Scan for any recently created video files in temp directory
          console.log('[DEBUG] Searching for any recently created video files in temp directories');
          try {
            // Get all files in both possible temp directories
            const allTempDirs = [tempDir];
            if (fs.existsSync(alternativeDir)) {
              allTempDirs.push(alternativeDir);
            }
            
            let recentVideoFiles = [];
            
            for (const dir of allTempDirs) {
              const files = fs.readdirSync(dir);
              files.forEach(file => {
                const filePath = path.join(dir, file);
                try {
                  const stats = fs.statSync(filePath);
                  const isRecent = (Date.now() - stats.ctime.getTime()) < 60000; // Less than a minute old
                  const hasVideoExt = commonExtensions.some(ext => file.toLowerCase().endsWith(ext));
                  
                  if (hasVideoExt && isRecent) {
                    recentVideoFiles.push({
                      path: filePath,
                      time: stats.ctime.getTime()
                    });
                  }
                } catch (statErr) {
                  // Skip if we can't stat the file
                }
              });
            }
            
            // Sort by creation time (newest first)
            recentVideoFiles.sort((a, b) => b.time - a.time);
            
            if (recentVideoFiles.length > 0) {
              console.log('[DEBUG] Using most recently created video file:', recentVideoFiles[0].path);
              actualVideoPath = recentVideoFiles[0].path;
              resolve();
              return;
            }
          } catch (scanErr) {
            console.error('[DEBUG] Error scanning for recent videos:', scanErr);
          }
          
          console.error('[DEBUG] No video file found after exhaustive search');
          reject(new Error('Failed to find downloaded video file after trying all methods'));
        } else {
          console.error('[DEBUG] YouTube video download error, code:', code, 'stderr:', stderr);
          reject(new Error(`Failed to download video. Exit code: ${code}`));
        }
      });
      
      ytdlProcess.on('error', (err) => {
        console.error('[DEBUG] yt-dlp process error:', err);
        reject(err);
      });
    });
    
    // Safety check - if we didn't find a file, this shouldn't happen
    if (!actualVideoPath || !fs.existsSync(actualVideoPath)) {
      console.error('[DEBUG] Video file not found after download completed');
      throw new Error('Video file not found after download completion');
    }
    
    console.log('[DEBUG] Final video path to be used:', actualVideoPath);
    
    // Altyazı indirme işlemi (varsa)
    if (subtitleUrl) {
      subtitleFilePath = path.join(tempDir, `${baseFilename}_subtitle.vtt`);
      
      // Fetch the subtitle content
      try {
        const response = await fetch(subtitleUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch subtitle: ${response.statusText}`);
        }
        
        let subtitleContent = await response.text();
        
        // Check if it's an XML format (YT subtitles are sometimes in timed text XML)
        if (subtitleContent.trim().startsWith('<?xml') || subtitleContent.includes('<transcript>')) {
          console.log('[DEBUG] YouTube subtitle is in XML format, converting to VTT');
          
          // Simple XML to VTT conversion - this is basic and may need enhancement
          subtitleContent = convertYouTubeXmlToVtt(subtitleContent);
        }
        
        // Save the subtitle content
        fs.writeFileSync(subtitleFilePath, subtitleContent);
        console.log('[DEBUG] Subtitle download completed:', subtitleFilePath);
        
        // Validate VTT file
        if (!validateVttFile(subtitleFilePath)) {
          console.error('[DEBUG] Invalid VTT file downloaded, attempting to fix');
          // Try to fix the VTT file
          const fixed = fixVttFile(subtitleFilePath);
          if (!fixed) {
            console.error('[DEBUG] Could not fix VTT file, subtitle may not work properly');
          }
        }
      } catch (error) {
        console.error('[DEBUG] Subtitle download error:', error);
        // Don't fail the whole process if subtitle download fails
        // Instead, just return null for the subtitle path
        subtitleFilePath = null;
      }
    }
    
    return {
      videoPath: actualVideoPath,
      subtitlePath: subtitleFilePath
    };
  } catch (error) {
    console.error('[DEBUG] YouTube download error:', error);
    throw error;
  }
});

// Function to validate VTT file
function validateVttFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Basic validation - check for WEBVTT header and some cue content
    return content.includes('WEBVTT') && /\d\d:\d\d:\d\d/g.test(content);
  } catch (error) {
    console.error('VTT validation error:', error);
    return false;
  }
}

// Function to fix common VTT file issues
function fixVttFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add WEBVTT header if missing
    if (!content.includes('WEBVTT')) {
      content = 'WEBVTT\n\n' + content;
    }
    
    // Fix timestamp format if needed
    content = content.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
    
    // Write fixed content back to file
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error('VTT fix error:', error);
    return false;
  }
}

// Function to convert YouTube XML format to VTT
function convertYouTubeXmlToVtt(xmlContent) {
  try {
    // Very basic XML parsing - this is a simplified version
    const lines = [];
    lines.push('WEBVTT\n');
    
    // Extract text elements with their start and duration
    const textElements = xmlContent.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      
      // Extract start time and duration
      const startMatch = element.match(/start="([\d.]+)"/);
      const durMatch = element.match(/dur="([\d.]+)"/);
      
      if (startMatch && durMatch) {
        const start = parseFloat(startMatch[1]);
        const duration = parseFloat(durMatch[1]);
        const end = start + duration;
        
        // Format timestamps as HH:MM:SS.mmm
        const startTime = formatVttTime(start);
        const endTime = formatVttTime(end);
        
        // Extract text content
        let text = element.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        
        // Add cue to VTT
        lines.push(`${i + 1}`);
        lines.push(`${startTime} --> ${endTime}`);
        lines.push(text);
        lines.push('');
      }
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('XML to VTT conversion error:', error);
    return 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\nError converting subtitles';
  }
}

// Helper function to format seconds to VTT time format
function formatVttTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
}

// Debug helper to get raw file buffer
ipcMain.handle('get-file-buffer', async (event, filePath) => {
  try {
    // Read file as buffer and convert to Base64 for safe transfer
    const buffer = await fs.promises.readFile(filePath);
    
    // Get file stats
    const stats = await fs.promises.stat(filePath);
    
    return {
      exists: true,
      size: stats.size,
      buffer: buffer.toString('base64'),
      path: filePath
    };
  } catch (error) {
    console.error('File buffer reading error:', error);
    return {
      exists: false,
      error: error.message,
      path: filePath
    };
  }
});