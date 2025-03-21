const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');

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
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Dosya okuma için güvenlik ayarı
      webSecurity: true
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
              message: 'Anki Video Clipper',
              detail: 'An Electron-based application for creating Anki cards while watching films.\n\nVersion: 1.0.0'
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
    
    // ASS dosyası için yol belirle
    const assFilePath = path.join(tempDir, `_${clipId}.ass`);
    
    // Klip oluştur
    await createVideoClip(videoPath, startTime, endTime, clipFilePath);
    
    // Altyazı dosyalarını oluştur
    const subtitleResult = await extractSubtitleClip(videoPath, startTime, endTime, vttFilePath, subtitleSource);
    
    // Frame çıkarma ve yükleme başarısını takip etmek için değişkenler
    let firstFrameUploaded = !extractFirstFrame; // Eğer çıkarılmayacaksa başarılı kabul et
    let lastFrameUploaded = !extractLastFrame;
    let subtitleUploaded = false;
    let assUploaded = false;
    
    // First frame ve last frame çıkarma işlemleri
    if (extractFirstFrame || extractLastFrame) {
      // Frame'leri çıkarmak için Promise dizisi
      const frameExtractionPromises = [];
      
      // İlk kare
      if (extractFirstFrame) {
        frameExtractionPromises.push(
          captureVideoFrame(videoPath, frontFramePath, startTime, 'first')
        );
      }
      
      // Son kare
      if (extractLastFrame) {
        frameExtractionPromises.push(
          captureVideoFrame(videoPath, backFramePath, endTime, 'last')
        );
      }
      
      // Tüm frame çıkarma işlemlerini bekle
      await Promise.all(frameExtractionPromises);
      
      // First Frame'i doğrudan Anki media klasörüne ekle
      if (extractFirstFrame && fs.existsSync(frontFramePath)) {
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
      }
      
      // API çağrıları arasında kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Last Frame'i doğrudan Anki media klasörüne ekle
      if (extractLastFrame && fs.existsSync(backFramePath)) {
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
      }
      
      // Frame'lerin yüklenmesi başarısız olduysa kullanıcıya bildirmek için kontrol
      if ((extractFirstFrame && !firstFrameUploaded) || (extractLastFrame && !lastFrameUploaded)) {
        console.warn('Bazı frame dosyaları Anki media klasörüne yüklenemedi.');
        // Kullanıcıya bir şekilde bildirilebilir (optional)
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
    
    // ASS dosyasını Anki'ye gönder
    if (subtitleResult && subtitleResult.ass && fs.existsSync(subtitleResult.ass)) {
      const assSubtitleData = fs.readFileSync(subtitleResult.ass, { encoding: 'base64' });
      
      // Yeniden deneme mantığı ile yükleme
      assUploaded = await retryAnkiConnectCall(async () => {
        await invokeAnkiConnect('storeMediaFile', {
          filename: `_${clipId}.ass`,
          data: assSubtitleData
        });
        console.log(`ASS dosyası Anki media klasörüne eklendi: _${clipId}.ass`);
        return true; // Başarılı
      }, 3); // 3 kez deneme
      
      if (!assUploaded) {
        console.error('ASS dosyası 3 deneme sonunda yüklenemedi');
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
    
    // SRT dosya adını noteData'ya ekle
    if (subtitleUploaded) {
      noteData.fields.Subtitle = `_${clipId}.vtt`;
    }
    
    // ASS dosya adını noteData'ya ekle
    if (assUploaded) {
      noteData.fields.SubtitleAss = `_${clipId}.ass`;
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
      
      if (subtitleResult && subtitleResult.ass && fs.existsSync(subtitleResult.ass)) {
        fs.unlinkSync(subtitleResult.ass);
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
    
    // Komut ve argümanları hazırla
    let ffmpegCommand = ffmpeg(videoPath);
    
    if (framePosition === 'first') {
      // İlk frame için genellikle tam başlangıç noktasını kullanıyoruz
      ffmpegCommand
        .seekInput(timestamp)  // Belirtilen zamana git
        .frames(1)            // Sadece 1 frame al
        .output(outputPath)
        .outputOptions(['-q:v', '1']) // En yüksek kalitede JPEG
        .on('end', () => {
          console.log(`İlk frame başarıyla kaydedildi: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error(`İlk frame çıkarma hatası:`, err);
          reject(err);
        });
    } else if (framePosition === 'last') {
      // Son frame için, belirtilen bitiş zamanından hemen önceki frame'i almaya çalışıyoruz
      // Küçük bir mikrosaniye geri gidelim (ancak çok küçük olmalı)
      const adjustedTime = Math.max(0, timestamp - 0.001); 
      
      ffmpegCommand
        .seekInput(adjustedTime)  // Son zamandan biraz önce
        .frames(1)                // Sadece 1 frame al
        .output(outputPath)
        .outputOptions(['-q:v', '1']) // En yüksek kalitede JPEG
        .on('end', () => {
          console.log(`Son frame başarıyla kaydedildi: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error(`Son frame çıkarma hatası:`, err);
          reject(err);
        });
    }
    
    // İşlemi başlat
    ffmpegCommand.run();
  });
}

// FFmpeg ile video klip oluşturma fonksiyonu
function createVideoClip(videoPath, startTime, endTime, outputPath) {
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
      
      // FFmpeg komutu
      const ffmpegArgs = [
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-i', videoPath,
        '-c:v', 'libvpx-vp9',
        '-crf', '28',        // Kalite değerini biraz düşürerek dosya boyutunu küçült (23'ten 28'e)
        '-b:v', '0',         // CRF modu için bit hızını 0 olarak ayarla
        '-c:a', 'libopus',  
        '-b:a', '64k',       // Ses bit hızını 64k'ya düşür (varsayılan 128k'dan)
        '-vf', scaleFilter,  // Dinamik olarak oluşturulan scaling filtresi
        '-sn',              // Altyazıları dahil etme
        '-y',               // Varolan dosyanın üzerine yaz
        outputPath
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
  });
}

// Altyazı (subtitle) klip oluşturma fonksiyonu
function extractSubtitleClip(videoPath, startTime, endTime, outputPath, subtitleSource) {
  return new Promise((resolve, reject) => {
    // Çıktı yolundan dosya adını ve uzantısını al
    const outputExt = path.extname(outputPath);
    const outputBaseName = path.basename(outputPath, outputExt);
    const outputDir = path.dirname(outputPath);
    
    // ASS çıktı yolunu oluştur
    const assOutputPath = path.join(outputDir, `${outputBaseName}.ass`);
    
    // Aşağıdaki iki durum için FFmpeg argümanlarını hazırla:
    // 1. Harici altyazı dosyası varsa (type='external')
    // 2. Dahili altyazı akışı seçiliyse (type='internal')
    let vttArgs, assArgs;
    
    if (subtitleSource.type === 'external' && subtitleSource.path) {
      // Harici altyazı dosyası kullan
      console.log(`Harici altyazı dosyası kullanılıyor: ${subtitleSource.path}`);
      
      vttArgs = [
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-i', subtitleSource.path, // Harici altyazı dosyası
        '-c:s', 'webvtt',
        '-y',
        outputPath
      ];
      
      assArgs = [
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-i', subtitleSource.path, // Harici altyazı dosyası
        '-c:s', 'ass',
        '-y',
        assOutputPath
      ];
    } else {
      // Dahili altyazı akışı kullan
      const subtitleIndex = subtitleSource.index || 0;
      console.log(`Dahili altyazı akışı kullanılıyor, index: ${subtitleIndex}`);
      
      vttArgs = [
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-i', videoPath,
        '-map', `0:s:${subtitleIndex}`, // Kullanıcının seçtiği altyazı akışı
        '-c:s', 'webvtt',
        '-y',
        outputPath
      ];
      
      assArgs = [
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-i', videoPath,
        '-map', `0:s:${subtitleIndex}`, // Kullanıcının seçtiği altyazı akışı
        '-c:s', 'ass',
        '-y',
        assOutputPath
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
    
    // ASS formatında altyazı çıkarma
    const assPromise = new Promise((resolveAss, rejectAss) => {
      console.log('FFmpeg ASS komutu:', 'ffmpeg', assArgs.join(' '));
      
      // FFmpeg işlemini başlat
      const ffmpegProcess = spawn('ffmpeg', assArgs);
      
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
          console.log('ASS altyazı dosyası başarıyla oluşturuldu:', assOutputPath);
          resolveAss(assOutputPath);
        } else {
          console.error('FFmpeg ASS altyazı çıkarma hatası:', stderrData);
          // Hata durumunda bile devam et, kritik işlem değil
          resolveAss(null);
        }
      });
      
      ffmpegProcess.on('error', (err) => {
        console.error('FFmpeg ASS altyazı başlatma hatası:', err);
        // Hata durumunda bile devam et, kritik işlem değil
        resolveAss(null);
      });
    });
    
    // Her iki altyazı çıkarma işlemini de bekle
    Promise.all([vttPromise, assPromise])
      .then(([vttResult, assResult]) => {
        // En az bir sonuç başarılı ise başarı kabul et
        if (vttResult || assResult) {
          resolve({ vtt: vttResult, ass: assResult });
        } else {
          // Her iki çıkarma işlemi de başarısız olduysa hatayı bildir
          resolve(null);
        }
      })
      .catch(error => {
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
          "default-src 'self'; script-src 'self'; media-src 'self' file:; style-src 'self' 'unsafe-inline';"
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
    let text = lines.slice(2).join(' ').trim();
    
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

      // eac3 formatı ise dönüştür
      if (codecName === 'eac3') {
        console.log('eac3 formatı tespit edildi, AAC formatına dönüştürülüyor...');
        
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
          '-c:v', 'copy',        // Video kanalını kopyala (kaliteyi koru)
          '-c:a', 'aac',         // Ses kanalını AAC'ye dönüştür
          '-b:a', '192k',        // Ses bit hızı
          '-c:s', 'copy',        // Altyazıları kopyala
          '-map', '0',           // Tüm stream'leri dahil et
          '-y',                  // Varolan dosyanın üzerine yaz
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
      } else {
        // Dönüştürme gerekmiyorsa orijinal dosyayı kullan
        console.log('Dönüştürme gerekmiyor, orijinal dosya kullanılacak');
        resolve(videoPath);
      }
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