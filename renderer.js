// DOM Elementleri
const videoPlayer = document.getElementById('video-player');
const videoSubtitle = document.getElementById('video-subtitle');
const selectMediaFilesBtn = document.getElementById('select-video-btn');
const subtitleSettingsBtn = document.getElementById('subtitle-settings-btn');
const embeddedSubtitlesBtn = document.getElementById('embedded-subtitles-btn');
const videoPathDisplay = document.getElementById('video-path');
const subtitlePathDisplay = document.getElementById('subtitle-path');
const subtitleList = document.getElementById('subtitle-list');
const subtitleSearch = document.getElementById('subtitle-search');
const clearSearchBtn = document.getElementById('clear-search-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const welcomeSelectBtn = document.getElementById('welcome-select-btn');
const welcomeContent = document.querySelector('.welcome-content');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const startTimeUpBtn = document.getElementById('start-time-up');
const startTimeDownBtn = document.getElementById('start-time-down');
const endTimeUpBtn = document.getElementById('end-time-up');
const endTimeDownBtn = document.getElementById('end-time-down');
const previewClipBtn = document.getElementById('preview-clip-btn');
const sendToAnkiBtn = document.getElementById('send-to-anki-btn');
const timelineTrack = document.getElementById('timeline-track');
const timelineCursor = document.getElementById('timeline-cursor');
const timelineTooltip = document.getElementById('timeline-tooltip');
const prevSceneAddBtn = document.getElementById('prev-scene-add-btn');
const prevSceneRemoveBtn = document.getElementById('prev-scene-remove-btn');
const nextSceneAddBtn = document.getElementById('next-scene-add-btn');
const nextSceneRemoveBtn = document.getElementById('next-scene-remove-btn');
const currentSceneInfo = document.getElementById('current-scene-info');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomLevelDisplay = document.getElementById('zoom-level');

// Altyazı ayarları modal penceresi
const subtitleSettingsModal = document.getElementById('subtitle-settings-modal');
const closeModalBtn = document.querySelector('.close-modal');
const saveSettingsBtn = document.getElementById('save-subtitle-settings');
const resetSettingsBtn = document.getElementById('reset-subtitle-settings');

// Anki kart modal penceresi
const ankiCardModal = document.getElementById('anki-card-modal');
const closeAnkiModalBtn = document.getElementById('close-anki-modal');
const ankiCancelBtn = document.getElementById('anki-cancel-btn');
const ankiSendBtn = document.getElementById('anki-send-btn');
const ankiIdInput = document.getElementById('anki-id');
const ankiVideoInput = document.getElementById('anki-video');
const ankiFirstFrameInput = document.getElementById('anki-first-frame');
const ankiLastFrameInput = document.getElementById('anki-last-frame');
const ankiSubtitleInput = document.getElementById('anki-subtitle');
const ankiWordInput = document.getElementById('anki-word');
const ankiEnInput = document.getElementById('anki-en');
const ankiTrInput = document.getElementById('anki-tr');
const ankiExtraInput = document.getElementById('anki-extra');
const ankiTagsInput = document.getElementById('anki-tags');
const ankiDeckSelect = document.getElementById('anki-deck');
const ankiModelSelect = document.getElementById('anki-model');
const ankiStatus = document.getElementById('anki-status');
const ankiStatusIcon = document.getElementById('anki-status-icon');
const ankiStatusText = document.getElementById('anki-status-text');

// Ayar kontrolleri
const fontSizeInput = document.getElementById('subtitle-font-size');
const fontSizeValue = document.getElementById('subtitle-font-size-value');
const fontFamilySelect = document.getElementById('subtitle-font-family');
const fontBoldCheckbox = document.getElementById('subtitle-font-bold');
const fontItalicCheckbox = document.getElementById('subtitle-font-italic');
const fontColorInput = document.getElementById('subtitle-font-color');
const bgColorInput = document.getElementById('subtitle-bg-color');
const bgOpacityInput = document.getElementById('subtitle-bg-opacity');
const bgOpacityValue = document.getElementById('subtitle-bg-opacity-value');
const bgWidthSelect = document.getElementById('subtitle-bg-width');
const verticalPositionInput = document.getElementById('subtitle-vertical-position');
const verticalPositionValue = document.getElementById('subtitle-vertical-position-value');
const autoScrollCheckbox = document.getElementById('subtitle-auto-scroll');
const highlightCheckbox = document.getElementById('subtitle-highlight');
const subtitlePreview = document.getElementById('subtitle-preview');

// Panel Resizer
const panelResizer = document.getElementById('panel-resizer');
const leftPanel = document.querySelector('.left-panel');
const rightPanel = document.querySelector('.right-panel');

// Sürüklenebilir ayırıcı işlevselliği
let isResizing = false;
let lastDownX = 0;
let resizeTooltip = null;

// Boyut bilgisi gösterecek tooltip oluştur
function createResizeTooltip() {
  if (!resizeTooltip) {
    resizeTooltip = document.createElement('div');
    resizeTooltip.className = 'resize-tooltip';
    document.body.appendChild(resizeTooltip);
  }
}

panelResizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  lastDownX = e.clientX;
  panelResizer.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  // Tooltip oluştur
  createResizeTooltip();
  
  // Fare hareketlerini yakalamak için event listener'ları ekle
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  
  // Tarayıcı penceresinin dışına çıkıldığında da işlemi sonlandır
  document.addEventListener('mouseleave', onMouseUp);
});

function onMouseMove(e) {
  if (!isResizing) return;
  
  const container = document.querySelector('.container');
  const containerWidth = container.offsetWidth;
  const resizerWidth = panelResizer.offsetWidth;
  
  // Fare pozisyonunu container içindeki pozisyona çevir
  const containerRect = container.getBoundingClientRect();
  const mouseX = e.clientX - containerRect.left;
  
  // Minimum genişlik kontrolü (piksel olarak)
  const minWidth = 300;
  
  // Fare pozisyonuna göre panel genişliklerini hesapla
  if (mouseX < minWidth || mouseX > containerWidth - minWidth - resizerWidth) return;
  
  // Yüzde olarak genişlikleri hesapla
  const leftPercent = (mouseX / containerWidth) * 100;
  const rightPercent = 100 - leftPercent - (resizerWidth / containerWidth * 100);
  
  // Panellerin genişliklerini ayarla
  leftPanel.style.width = `${leftPercent}%`;
  rightPanel.style.width = `${rightPercent}%`;
  
  // Tooltip içeriğini güncelle ve göster
  if (resizeTooltip) {
    resizeTooltip.textContent = `Sol: ${Math.round(leftPercent)}% - Sağ: ${Math.round(rightPercent)}%`;
    resizeTooltip.style.display = 'block';
    resizeTooltip.style.left = `${e.pageX + 10}px`;
    resizeTooltip.style.top = `${e.pageY + 10}px`;
  }
  
  // Video container ve oynatıcının alanı düzgünce doldurmalarını sağla
  const videoContainer = document.querySelector('.video-container');
  const videoPlayer = document.getElementById('video-player');
  
  // Boyut değişimlerinin sorunsuz çalışması için
  videoContainer.style.height = 'auto';
  videoContainer.style.maxHeight = '100%';
  
  // Zaman çizelgesini yeniden render et
  if (typeof renderTimeline === 'function') {
    renderTimeline();
  }
}

function onMouseUp() {
  if (!isResizing) return;
  
  isResizing = false;
  panelResizer.classList.remove('active');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // Tooltip'i gizle
  if (resizeTooltip) {
    resizeTooltip.style.display = 'none';
  }
  
  // Event listener'ları kaldır
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mouseleave', onMouseUp);
}

// Sayfa yüklendiğinde panel genişliklerini yükle
function loadPanelWidths() {
  // Varsayılan değerleri 80 - 20 olarak ayarla
  leftPanel.style.width = '80%';
  rightPanel.style.width = '20%';
}

// Uygulama durumu
let appState = {
  videoPath: null,
  subtitlePath: null,
  subtitles: [],
  currentSubtitleIndex: -1,
  activeSubtitleIndex: -1,
  timelineSegments: [], // Zaman çizelgesi segmentleri
  zoomLevel: 1, // Zoom seviyesi (1x varsayılan)
  lastUsedTags: '', // Son kullanılan etiketleri saklamak için
  // İndeks takibi için özellikler
  selectedStartIndex: null, // Başlangıç indeksi
  selectedEndIndex: null, // Bitiş indeksi
  selectedClip: {
    startTime: 0,
    endTime: 0,
    text: '',
    includePrev: 0,
    includeNext: 0
  },
  subtitleSettings: {
    fontSize: 18,
    fontFamily: 'Arial, sans-serif',
    fontBold: false,
    fontItalic: false,
    fontColor: '#ffffff',
    bgColor: '#000000',
    bgOpacity: 0.5,
    bgWidth: 'auto', // Varsayılan olarak metin genişliğine uygun
    verticalPosition: 90, // 0: en üst, 100: en alt (2'şer adım ile ilerliyor)
    autoScroll: true,
    highlight: true
  },
  lastUsedDeck: null,
  convertedVideoPath: null,
  embeddedSubtitles: [], // Dahili altyazıları saklamak için
  embedSubtitles: true // Altyazı gömme durumu - varsayılan olarak aktif
};

// Sayfa yüklendiğinde son kullanılan dosyaları ve ayarları yükle
document.addEventListener('DOMContentLoaded', () => {
  // LocalStorage'dan son kullanılan dosya bilgilerini temizle
  localStorage.removeItem('lastVideoPath');
  localStorage.removeItem('lastSubtitlePath');
  
  // Panel genişliklerini önce yükle (diğer işlemlerden önce)
  loadPanelWidths();
  
  // Hoş geldiniz ekranını kontrol et
  checkIfShouldShowWelcome();
  
  // Diğer yüklemeleri yap
  // loadLastUsedFiles(); // Son kullanılan dosyaları hatırlama özelliği kapatıldı
  loadSubtitleSettings();
  
  // Değerleri başlangıçta göster
  const bgOpacity = bgOpacityInput.value;
  const percentage = Math.round(bgOpacity * 100);
  bgOpacityValue.textContent = `${percentage}%`;
  
  const verticalPos = verticalPositionInput.value;
  verticalPositionValue.textContent = `${verticalPos}%`;
  
  // Pencere boyutu değiştiğinde panel genişliklerini korumak için
  window.addEventListener('resize', () => {
    // Zaman çizelgesini yeniden render et
    if (typeof renderTimeline === 'function') {
      renderTimeline();
    }
  });
});

// Hoş geldiniz ekranı işlevleri
function hideWelcomeScreen() {
  welcomeScreen.style.display = 'none';
}

function showWelcomeScreen() {
  welcomeScreen.style.display = 'flex';
}

// Video ve altyazı yüklendiğinde hoş geldiniz ekranını gizle
function checkIfShouldShowWelcome() {
  if (appState.videoPath) {
    hideWelcomeScreen();
  } else {
    showWelcomeScreen();
  }
}

// Welcome Select butonu için olay dinleyicisi
welcomeSelectBtn.addEventListener('click', () => {
  selectMediaFilesBtn.click();
});

// Sürükle-bırak işlemleri için olay dinleyicileri
welcomeScreen.addEventListener('dragover', (e) => {
  e.preventDefault();
  welcomeContent.classList.add('drag-over');
});

welcomeScreen.addEventListener('dragleave', () => {
  welcomeContent.classList.remove('drag-over');
});

welcomeScreen.addEventListener('drop', async (e) => {
  e.preventDefault();
  welcomeContent.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length === 0) return;
  
  // Elektron API'yi kullanarak dosyaları işle
  const paths = Array.from(files).map(file => file.path);
  
  const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi'];
  const subtitleExtensions = ['.srt', '.ass', '.vtt'];
  
  let videoPath = null;
  let subtitlePath = null;
  
  for (const filePath of paths) {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    
    if (videoExtensions.includes(ext) && !videoPath) {
      videoPath = filePath;
    } else if (subtitleExtensions.includes(ext) && !subtitlePath) {
      subtitlePath = filePath;
    }
  }
  
  if (videoPath) {
    appState.videoPath = videoPath;
    videoPathDisplay.textContent = `Video: ${getFileName(videoPath)}`;
    
    try {
      // Yükleme göstergesi göster
      showLoadingIndicator("Video hazırlanıyor...");
      
      // Video oynatıcıya yükle
      videoPlayer.src = `file://${videoPath}`;
      
      // Yükleme göstergesini gizle
      hideLoadingIndicator();
      
      // Video yüklendikten sonra otomatik oynat
      videoPlayer.onloadeddata = function() {
        videoPlayer.play();
      };
      
      // Dahili altyazıları kontrol et
      checkEmbeddedSubtitles(videoPath);
    } catch (error) {
      console.error("Video hazırlama hatası:", error);
      hideLoadingIndicator();
    }
  }
  
  if (subtitlePath) {
    appState.subtitlePath = subtitlePath;
    subtitlePathDisplay.textContent = `Subtitles: ${getFileName(subtitlePath)}`;
    
    // Altyazıları yükle ve listele
    await loadSubtitles(subtitlePath);
  }
  
  // Hoş geldiniz ekranını gizle
  checkIfShouldShowWelcome();
});

// Son kullanılan dosyaları localStorage'dan yükle
async function loadLastUsedFiles() {
  try {
    const lastVideoPath = localStorage.getItem('lastVideoPath');
    const lastSubtitlePath = localStorage.getItem('lastSubtitlePath');
    
    if (lastVideoPath && lastSubtitlePath) {
      // Dosyaların hala mevcut olup olmadığını kontrol et
      const filesExist = await window.electronAPI.checkFilesExist({
        videoPath: lastVideoPath,
        subtitlePath: lastSubtitlePath
      });
      
      if (filesExist.videoExists && filesExist.subtitleExists) {
        appState.videoPath = lastVideoPath;
        appState.subtitlePath = lastSubtitlePath;
        
        // Arayüzü güncelle
        videoPathDisplay.textContent = `Video: ${getFileName(lastVideoPath)}`;
        subtitlePathDisplay.textContent = `Subtitles: ${getFileName(lastSubtitlePath)}`;
        
        // Video oynatıcıya yükle
        videoPlayer.src = `file://${lastVideoPath}`;
        
        // Altyazıları yükle ve listele
        await loadSubtitles(lastSubtitlePath);
        
        console.log('Last used files loaded');
        
        // Kullanıcıya bilgi ver
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = 'Last used files automatically loaded.';
        document.body.appendChild(notification);
        
        // 3 saniye sonra bildirimi kaldır
        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 500);
        }, 3000);
      } else {
        console.log('Last used files no longer exist');
        // localStorage'dan eski kayıtları temizle
        localStorage.removeItem('lastVideoPath');
        localStorage.removeItem('lastSubtitlePath');
      }
    }
  } catch (error) {
    console.error('Error loading last used files:', error);
  }
}

// Son kullanılan dosyaları localStorage'a kaydet
function saveLastUsedFiles(videoPath, subtitlePath) {
  // Dosya yollarını kaydetme özelliği kapatıldı
  return;
  
  /*
  if (videoPath) {
    localStorage.setItem('lastVideoPath', videoPath);
  }
  
  if (subtitlePath) {
    localStorage.setItem('lastSubtitlePath', subtitlePath);
  }
  */
}

// Video ve Altyazı seçme işlemi - güncellendi
selectMediaFilesBtn.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.selectMediaFiles();
    
    if (result.videoPath) {
      appState.videoPath = result.videoPath;
      videoPathDisplay.textContent = `Video: ${getFileName(result.videoPath)}`;
      
      // Yükleme göstergesi göster
      showLoadingIndicator("Video hazırlanıyor...");
      
      try {
        // Ses formatını kontrol et ve gerekirse dönüştür
        window.logger.debug('Ses formatı kontrol ediliyor...');
        const convertedPath = await window.electronAPI.checkAndConvertAudio(result.videoPath);
        window.logger.info('Dönüştürme işlemi tamamlandı');
        
        // Dönüştürülmüş dosya yolunu sakla
        appState.convertedVideoPath = convertedPath;
        
        // Video oynatıcıya yükle
        if (convertedPath.includes('converted_') && convertedPath.includes('anki_video_clipper')) {
          // Geçici dosya ise doğrudan yükle
          videoPlayer.src = convertedPath;
        } else {
          // Normal dosya ise file:// protokolü kullan
          videoPlayer.src = `file://${convertedPath}`;
        }
        
        // Video yüklendikten sonra otomatik oynat
        videoPlayer.onloadeddata = function() {
          videoPlayer.play();
        };
        
        // Yükleme göstergesini gizle
        hideLoadingIndicator();
        
        // Dahili altyazıları kontrol et
        checkEmbeddedSubtitles(result.videoPath);
      } catch (error) {
        console.error("Video hazırlama hatası:", error);
        // Hata durumunda orijinal dosyayı kullan
        videoPlayer.src = `file://${result.videoPath}`;
        
        // Video yüklendikten sonra otomatik oynat
        videoPlayer.onloadeddata = function() {
          videoPlayer.play();
        };
        
        hideLoadingIndicator();
      }
    }
    
    if (result.subtitlePath) {
      appState.subtitlePath = result.subtitlePath;
      subtitlePathDisplay.textContent = `Subtitles: ${getFileName(result.subtitlePath)}`;
      
      // Altyazıları yükle ve listele
      await loadSubtitles(result.subtitlePath);
    }
    
    // Hoş geldiniz ekranını gizle eğer video yüklendiyse
    checkIfShouldShowWelcome();
    
    // Son kullanılan dosyaları kaydet - özellik şu an kapalı
    // saveLastUsedFiles(appState.videoPath, appState.subtitlePath);
  } catch (error) {
    console.error('Error selecting media files:', error);
  }
});

// Yükleme göstergesi fonksiyonları
function showLoadingIndicator(message) {
  // Eğer yükleme göstergesi elementi yoksa oluştur
  let loadingIndicator = document.getElementById('loading-indicator');
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'loading-indicator';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'loading-message';
    messageElement.textContent = message || 'Yükleniyor...';
    
    loadingIndicator.appendChild(spinner);
    loadingIndicator.appendChild(messageElement);
    
    document.body.appendChild(loadingIndicator);
  } else {
    const messageElement = loadingIndicator.querySelector('.loading-message');
    if (messageElement) {
      messageElement.textContent = message || 'Yükleniyor...';
    }
    loadingIndicator.style.display = 'flex';
  }
}

function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}

// Altyazıları yükle ve listele
async function loadSubtitles(filePath) {
  try {
    // Debug: Check if file exists and log path
    console.log('[DEBUG] Loading subtitles from:', filePath);
    
    // Check if file exists via electron API
    const fileExists = await window.electronAPI.checkFilesExist({
      videoPath: null,
      subtitlePath: filePath
    });
    
    console.log('[DEBUG] File exists check:', fileExists.subtitleExists);
    
    if (!fileExists.subtitleExists) {
      console.error('[DEBUG] Subtitle file does not exist');
      alert(`Subtitle file not found: ${filePath}`);
      return;
    }
    
    // Get raw file buffer for deep debugging
    try {
      const fileBuffer = await window.electronAPI.getFileBuffer(filePath);
      console.log('[DEBUG] File buffer info:', {
        exists: fileBuffer.exists,
        size: fileBuffer.size,
        path: fileBuffer.path
      });
      
      // Log the first 100 bytes as hex for debugging
      if (fileBuffer.exists && fileBuffer.buffer) {
        const buffer = atob(fileBuffer.buffer);
        let hexView = '';
        for (let i = 0; i < Math.min(100, buffer.length); i++) {
          hexView += buffer.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
        }
        console.log('[DEBUG] First 100 bytes (hex):', hexView);
      }
    } catch (bufferError) {
      console.error('[DEBUG] Error getting file buffer:', bufferError);
    }
    
    let subtitles = [];
    let subtitleContent = '';
    
    // Debug: Log file extension
    const fileExt = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    console.log('[DEBUG] Subtitle file extension:', fileExt);
    
    if (fileExt === '.srt') {
      // SRT dosyalarını doğrudan main process'te işle
      console.log('[DEBUG] Parsing SRT file via main process');
      try {
        subtitles = await window.electronAPI.parseSrtFile(filePath);
      } catch (parseError) {
        console.error('[DEBUG] SRT parsing error:', parseError);
        throw parseError;
      }
    } else if (fileExt === '.ass' || fileExt === '.ssa') {
      // Diğer formatlar için mevcut işleme yöntemini kullan
      console.log('[DEBUG] Reading and parsing ASS/SSA file');
      try {
        subtitleContent = await window.electronAPI.readFile(filePath);
        console.log('[DEBUG] ASS/SSA content length:', subtitleContent.length);
        console.log('[DEBUG] First 100 chars:', subtitleContent.substring(0, 100));
        subtitles = parseASS(subtitleContent);
      } catch (parseError) {
        console.error('[DEBUG] ASS/SSA parsing error:', parseError);
        throw parseError;
      }
    } else if (fileExt === '.vtt') {
      console.log('[DEBUG] Reading and parsing VTT file');
      try {
        subtitleContent = await window.electronAPI.readFile(filePath);
        
        // Debug: Log content stats
        console.log('[DEBUG] VTT content length:', subtitleContent.length);
        console.log('[DEBUG] First 100 chars:', subtitleContent.substring(0, 100));
        
        // Debug: Validate VTT format basics
        const hasWebVTT = subtitleContent.includes('WEBVTT');
        const hasTimestamps = subtitleContent.includes('-->');
        console.log('[DEBUG] VTT contains WEBVTT header:', hasWebVTT);
        console.log('[DEBUG] VTT contains timestamps:', hasTimestamps);
        
        subtitles = parseVTT(subtitleContent);
        console.log('[DEBUG] VTT parsing complete, subtitles count:', subtitles.length);
      } catch (parseError) {
        console.error('[DEBUG] VTT parsing error:', parseError);
        throw parseError;
      }
    }
    
    if (subtitles.length > 0) {
      appState.subtitles = subtitles;
      // Altyazıları listele
      renderSubtitleList();
      
      // Video player için altyazı takip olayını ekle
      setupSubtitleTracking();
      
      // Başlangıçta altyazı gösterme alanını temizle
      videoSubtitle.textContent = '';
      videoSubtitle.style.display = 'none';
      
      // Altyazıların yüklendiğini bildir
      console.log(`${subtitles.length} subtitles loaded`);
    } else {
      console.error('[DEBUG] No subtitles were parsed from the file');
      console.error('[DEBUG] Subtitle content sample:', subtitleContent.substring(0, 200));
      alert('Subtitle file could not be read or unsupported format.');
    }
  } catch (error) {
    console.error('[DEBUG] loadSubtitles error:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    alert(`Error loading subtitles: ${error.message}`);
  }
}

// SRT formatı için basit bir parser
function parseSRT(content) {
  const subtitles = [];
  const blocks = content.trim().split(/\r?\n\r?\n/);
  
  blocks.forEach(block => {
    const lines = block.split(/\r?\n/);
    if (lines.length >= 3) {
      // İlk satır indeks, ikinci satır zaman damgaları
      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      
      if (timeMatch) {
        const startHours = parseInt(timeMatch[1]);
        const startMinutes = parseInt(timeMatch[2]);
        const startSeconds = parseInt(timeMatch[3]);
        const startMilliseconds = parseInt(timeMatch[4]);
        
        const endHours = parseInt(timeMatch[5]);
        const endMinutes = parseInt(timeMatch[6]);
        const endSeconds = parseInt(timeMatch[7]);
        const endMilliseconds = parseInt(timeMatch[8]);
        
        const startTime = startHours * 3600 + startMinutes * 60 + startSeconds + startMilliseconds / 1000;
        const endTime = endHours * 3600 + endMinutes * 60 + endSeconds + endMilliseconds / 1000;
        
        // Metin kısmını birleştir
        let text = lines.slice(2).join('\n');
        
        // HTML taglarını temizle (<i>, </i> vb.)
        text = text.replace(/<[^>]*>/g, '');
        
        // ASS formatı stil kodlarını temizle ({\an8} vb.)
        text = text.replace(/{\\[^}]*}/g, '');
        text = text.replace(/{[^}]*}/g, '');
        
        subtitles.push({
          id: subtitles.length + 1,
          startTime,
          endTime,
          text
        });
      }
    }
  });
  
  return subtitles;
}

// ASS formatı için basit bir parser
function parseASS(content) {
  const subtitles = [];
  const lines = content.split(/\r?\n/);
  let inEvents = false;
  let formatLine = null;
  let formatColumns = [];
  
  for (const line of lines) {
    // [Events] bölümünü bul
    if (line.trim() === '[Events]') {
      inEvents = true;
      continue;
    }
    
    if (inEvents) {
      // Format satırını bul
      if (line.startsWith('Format:')) {
        formatLine = line.substring(7).trim();
        formatColumns = formatLine.split(',').map(col => col.trim());
        continue;
      }
      
      // Dialogue satırlarını parse et
      if (line.startsWith('Dialogue:')) {
        const parts = line.substring(9).trim().split(',');
        
        if (parts.length >= formatColumns.length) {
          // Zaman değerlerini bul
          const startCol = formatColumns.indexOf('Start');
          const endCol = formatColumns.indexOf('End');
          const textCol = formatColumns.indexOf('Text');
          
          if (startCol !== -1 && endCol !== -1 && textCol !== -1) {
            const startTime = parseASSTime(parts[startCol].trim());
            const endTime = parseASSTime(parts[endCol].trim());
            
            // Metni al, özel ASS formatlamalarını temizle
            let text = parts.slice(textCol).join(',').trim();
            text = text.replace(/{\\[^}]*}/g, ''); // Stil kodlarını kaldır
            text = text.replace(/\\N/g, '\n'); // Satır sonlarını düzelt
            text = text.replace(/m \d+[^\n]*/g, ''); // "m" ile başlayan stil kodlarını kaldır
            
            // Sadece boş olmayan metinleri ekle
            if (text.trim() !== '') {
              subtitles.push({
                id: subtitles.length + 1,
                startTime,
                endTime,
                text
              });
            }
          }
        }
      }
    }
  }
  
  return subtitles;
}

// ASS zaman formatını saniyeye çevir (H:MM:SS.cc)
function parseASSTime(timeStr) {
  const match = timeStr.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const centiseconds = parseInt(match[4]);
    
    return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
  }
  return 0;
}

// VTT formatı için basit bir parser
function parseVTT(content) {
  console.log('[DEBUG] Starting VTT parsing');
  
  const subtitles = [];
  // Split content into blocks by blank lines
  const blocks = content.trim().split(/\r?\n\r?\n/);
  
  console.log('[DEBUG] VTT blocks count:', blocks.length);
  
  // İlk blok WEBVTT başlığı olabilir, atla
  const startIndex = blocks[0].trim().startsWith('WEBVTT') ? 1 : 0;
  
  console.log('[DEBUG] VTT parsing starting from block:', startIndex);
  
  for (let i = startIndex; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split(/\r?\n/);
    
    if (lines.length >= 2) {
      // Zaman damgalarını içeren satırı bul
      let timeLineIndex = 0;
      while (timeLineIndex < lines.length && !lines[timeLineIndex].includes('-->')) {
        timeLineIndex++;
      }
      
      if (timeLineIndex < lines.length) {
        const timeLine = lines[timeLineIndex];
        console.log('[DEBUG] Processing timestamp line:', timeLine);
        
        // Try to match both HH:MM:SS.mmm and MM:SS.mmm formats
        const timeMatchHours = timeLine.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
        const timeMatchMinutes = timeLine.match(/(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2})\.(\d{3})/);
        
        let startTime = 0;
        let endTime = 0;
        
        if (timeMatchHours) {
          // Format with hours: HH:MM:SS.mmm
          const startHours = parseInt(timeMatchHours[1]);
          const startMinutes = parseInt(timeMatchHours[2]);
          const startSeconds = parseInt(timeMatchHours[3]);
          const startMilliseconds = parseInt(timeMatchHours[4]);
          
          const endHours = parseInt(timeMatchHours[5]);
          const endMinutes = parseInt(timeMatchHours[6]);
          const endSeconds = parseInt(timeMatchHours[7]);
          const endMilliseconds = parseInt(timeMatchHours[8]);
          
          startTime = startHours * 3600 + startMinutes * 60 + startSeconds + startMilliseconds / 1000;
          endTime = endHours * 3600 + endMinutes * 60 + endSeconds + endMilliseconds / 1000;
          
          console.log('[DEBUG] Parsed HH:MM:SS format, start:', startTime, 'end:', endTime);
        } else if (timeMatchMinutes) {
          // Format without hours: MM:SS.mmm
          const startMinutes = parseInt(timeMatchMinutes[1]);
          const startSeconds = parseInt(timeMatchMinutes[2]);
          const startMilliseconds = parseInt(timeMatchMinutes[3]);
          
          const endMinutes = parseInt(timeMatchMinutes[4]);
          const endSeconds = parseInt(timeMatchMinutes[5]);
          const endMilliseconds = parseInt(timeMatchMinutes[6]);
          
          startTime = startMinutes * 60 + startSeconds + startMilliseconds / 1000;
          endTime = endMinutes * 60 + endSeconds + endMilliseconds / 1000;
          
          console.log('[DEBUG] Parsed MM:SS format, start:', startTime, 'end:', endTime);
        } else {
          // Try a more flexible regex for other formats
          console.log('[DEBUG] Standard timestamp formats failed, trying alternative parsing');
          
          // This regex tries to match timestamps in various formats
          const flexMatch = timeLine.match(/(\d+):(\d+)[:\.](\d+)?\s*-->\s*(\d+):(\d+)[:\.](\d+)?/);
          
          if (flexMatch) {
            const startMin = parseInt(flexMatch[1]);
            const startSec = parseInt(flexMatch[2]);
            const startMs = flexMatch[3] ? parseInt(flexMatch[3]) : 0;
            
            const endMin = parseInt(flexMatch[4]);
            const endSec = parseInt(flexMatch[5]);
            const endMs = flexMatch[6] ? parseInt(flexMatch[6]) : 0;
            
            startTime = startMin * 60 + startSec + startMs / 1000;
            endTime = endMin * 60 + endSec + endMs / 1000;
            
            console.log('[DEBUG] Used flexible timestamp parsing, start:', startTime, 'end:', endTime);
          } else {
            console.log('[DEBUG] Could not parse timestamp line:', timeLine);
            continue; // Skip this block if we can't parse the timestamp
          }
        }
        
        // Metin kısmını birleştir
        let text = lines.slice(timeLineIndex + 1).join('\n');
        
        // HTML taglarını temizle (<i>, </i> vb.)
        text = text.replace(/<[^>]*>/g, '');
        
        // ASS formatı stil kodlarını temizle ({\an8} vb.)
        text = text.replace(/{\\[^}]*}/g, '');
        text = text.replace(/{[^}]*}/g, '');
        
        subtitles.push({
          id: subtitles.length + 1,
          startTime,
          endTime,
          text
        });
      }
    }
  }
  
  console.log('[DEBUG] VTT parsing complete, found subtitles:', subtitles.length);
  return subtitles;
}

// Altyazı takip sistemi
function setupSubtitleTracking() {
  // Önce mevcut event listener'ı kaldır (eğer varsa)
  videoPlayer.removeEventListener('timeupdate', updateActiveSubtitle);
  
  // Aktif altyazıyı izleyen event listener ekle
  videoPlayer.addEventListener('timeupdate', updateActiveSubtitle);
}

// Aktif altyazıyı güncelleme (videodan aktif altyazıyı bulma)
function updateActiveSubtitle() {
  // Sahne operasyonu sırasında altyazı güncellemesini atlayalım
  if (isSceneOperation) {
    return;
  }
  
  // Video ve altyazı mevcutsa işlemi gerçekleştir
  if (videoPlayer && appState.subtitles && appState.subtitles.length > 0) {
    const currentTime = videoPlayer.currentTime;
    let activeIndex = -1;
    
    // Klip düzenleme modunda mıyız kontrol et
    const isInClipEditMode = document.querySelector('.scene-edit-active') !== null;
    
    if (isInClipEditMode && appState.originalCenterIndex !== undefined) {
      // Klip düzenleme modundayız, sadece seçili merkez altyazıyı göster
      const centerIndex = appState.originalCenterIndex;
      const centerSubtitle = appState.subtitles[centerIndex];
      
      // Eğer şu anki video zamanı merkez sahnenin zamanı içindeyse
      if (currentTime >= centerSubtitle.startTime && currentTime <= centerSubtitle.endTime) {
        activeIndex = centerIndex;
      } else {
        // Merkez sahne dışında olduğumuzda altyazıyı gösterme
        activeIndex = -1;
      }
    } else {
      // Normal izleme modundayız, tüm altyazıları kontrol et
      for (let i = 0; i < appState.subtitles.length; i++) {
        const subtitle = appState.subtitles[i];
        if (currentTime >= subtitle.startTime && currentTime <= subtitle.endTime) {
          activeIndex = i;
          break;
        }
      }
    }
    
    // Aktif altyazı değiştiyse güncelle
    if (activeIndex !== appState.activeSubtitleIndex) {
      appState.activeSubtitleIndex = activeIndex;
      
      // Altyazı listesini ve video üzerindeki altyazıyı güncelle
      updateSubtitleDisplay(activeIndex);
      
      // Altyazı yükseltme özelliği aktifse, listedeki o altyazıyı vurgula
      if (appState.subtitleSettings.highlight) {
        const subtitleItems = document.querySelectorAll('.subtitle-item');
        subtitleItems.forEach(item => {
          item.classList.remove('active');
        });
        
        if (activeIndex !== -1) {
          const activeItem = document.querySelector(`.subtitle-item[data-index="${activeIndex}"]`);
          if (activeItem) {
            activeItem.classList.add('active');
            
            // Otomatik kaydırma açıksa, aktif altyazıya kaydır
            if (appState.subtitleSettings.autoScroll) {
              activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    }
  }
  
  // Zaman çizelgesi imlecini güncelle
  updateTimelineCursor();
}

// Altyazı görüntüleme güncellemesi
function updateSubtitleDisplay(activeIndex) {
  if (activeIndex === -1) {
    // Aktif altyazı yoksa, video üzerindeki altyazıyı gizle
    videoSubtitle.textContent = '';
    videoSubtitle.style.display = 'none';
  } else {
    // Altyazıyı video üzerinde göster
    const subtitleText = appState.subtitles[activeIndex].text;
    
    // Vocabulary tooltip etkinse kelimeler için işlem yap
    if (vocabTooltipState.enabled) {
      videoSubtitle.innerHTML = processSubtitleText(subtitleText);
      
      // Add event listeners to word spans
      const wordSpans = videoSubtitle.querySelectorAll('.subtitle-word');
      wordSpans.forEach(wordSpan => {
        wordSpan.addEventListener('mouseenter', handleWordInteraction);
        wordSpan.addEventListener('mouseleave', () => {
          // Delay hiding to allow moving to the tooltip
          closeVocabTooltip();
        });
      });
    } else {
      // Just set the text content if not enabled
      videoSubtitle.textContent = subtitleText;
    }
    
    videoSubtitle.style.display = 'block';
    
    // Altyazı stillerini uygula
    applySubtitleStyles();
  }
}

// Önizlemeyi güncelle
function updateSubtitlePreview() {
  // Seçili sahne varmı kontrol et
  if (appState.originalCenterIndex === undefined) return;
  
  // Burada yalnızca merkez sahnedeki altyazı önizlemesini göster
  const centerIndex = appState.originalCenterIndex;
  const centerSubtitle = appState.subtitles[centerIndex];
  
  // Önizleme olarak yalnızca merkez sahnedeki metni göster
  const previewText = centerSubtitle.text || "Altyazı önizleme metni";
  
  // Video ve önizleme altyazılarını güncelle
  videoSubtitle.textContent = previewText;
  videoSubtitle.style.display = 'block';
  
  subtitlePreview.textContent = previewText;
  
  // Altyazı stillerini uygula
  applySubtitleStyles();
  
  // Önizleme stillerini de güncelle
  subtitlePreview.style.fontSize = `${appState.subtitleSettings.fontSize}px`;
  subtitlePreview.style.fontFamily = appState.subtitleSettings.fontFamily;
  subtitlePreview.style.fontWeight = appState.subtitleSettings.fontBold ? 'bold' : 'normal';
  subtitlePreview.style.fontStyle = appState.subtitleSettings.fontItalic ? 'italic' : 'normal';
  subtitlePreview.style.color = appState.subtitleSettings.fontColor;
  subtitlePreview.style.backgroundColor = hexToRgba(
    appState.subtitleSettings.bgColor, 
    appState.subtitleSettings.bgOpacity
  );
  
  // Arka plan genişliği ayarını önizlemeye de uygula
  const bgWidth = appState.subtitleSettings.bgWidth || 'auto';
  
  if (bgWidth === 'auto') {
    // Otomatik genişlik - metin genişliğine uyum sağlar
    subtitlePreview.style.width = 'auto';
    subtitlePreview.style.display = 'inline-block';
  } else {
    // Sabit genişlik - tüm genişliği kaplar
    subtitlePreview.style.width = '90%';
    subtitlePreview.style.display = 'block';
  }
}

// Zaman çizelgesi imlecini güncelle
function updateTimelineCursor() {
  const currentTime = videoPlayer.currentTime;
  const currentStartTime = parseTimeToSeconds(startTimeInput.value);
  const currentEndTime = parseTimeToSeconds(endTimeInput.value);
  
  // Zoom seviyesine göre görüntülenecek zaman aralığını hesapla
  const zoomFactor = appState.zoomLevel;
  const paddingTime = 2 / zoomFactor;
  const timelineStartTime = Math.max(0, currentStartTime - paddingTime);
  const timelineEndTime = currentEndTime + paddingTime;
  const timelineDuration = timelineEndTime - timelineStartTime;
  
  // İmlecin konumunu hesapla
  if (currentTime >= timelineStartTime && currentTime <= timelineEndTime) {
    const cursorPosition = ((currentTime - timelineStartTime) / timelineDuration) * 100;
    timelineCursor.style.left = `${cursorPosition}%`;
    timelineCursor.style.display = 'block';
    timelineCursor.style.backgroundColor = '#ff9800'; // Kırmızı yerine turuncu
  } else {
    timelineCursor.style.display = 'none';
  }
}

// Altyazı listesini render et
function renderSubtitleList(searchTerm = '') {
  subtitleList.innerHTML = '';
  
  appState.subtitles.forEach((subtitle, index) => {
    const subtitleItem = document.createElement('div');
    subtitleItem.className = 'subtitle-item';
    subtitleItem.setAttribute('data-index', index);
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'subtitle-time';
    timeSpan.textContent = `${formatTimeWithMs(subtitle.startTime)} - ${formatTimeWithMs(subtitle.endTime)}`;
    
    const textSpan = document.createElement('span');
    textSpan.className = 'subtitle-text';
    textSpan.style.whiteSpace = 'pre-line';
    
    // Arama terimi varsa, eşleşen metni vurgula
    if (searchTerm && subtitle.text.toLowerCase().includes(searchTerm.toLowerCase())) {
      const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
      textSpan.innerHTML = subtitle.text.replace(regex, '<span class="highlight">$1</span>');
      
      // Arama terimiyle eşleşen öğeleri göster
      subtitleItem.classList.remove('hidden');
    } else if (searchTerm) {
      // Arama terimiyle eşleşmeyen öğeleri gizle
      subtitleItem.classList.add('hidden');
      textSpan.textContent = subtitle.text;
    } else {
      // Arama terimi yoksa normal metni göster
      textSpan.textContent = subtitle.text;
    }
    
    const clipBtn = document.createElement('button');
    clipBtn.className = 'clip-btn';
    clipBtn.textContent = 'Create Clip';
    clipBtn.addEventListener('click', () => selectSubtitleForClip(index));
    
    // Altyazıya tıklama işlevi ekle
    subtitleItem.addEventListener('click', (e) => {
      // Eğer klip butonuna tıklanmadıysa
      if (e.target !== clipBtn) {
        // Videoyu bu altyazı zamanına atla
        videoPlayer.currentTime = subtitle.startTime;
      }
    });
    
    subtitleItem.appendChild(timeSpan);
    subtitleItem.appendChild(textSpan);
    subtitleItem.appendChild(clipBtn);
    
    subtitleList.appendChild(subtitleItem);
    
    // Eğer bu altyazı aktifse ve vurgulama ayarı açıksa, active sınıfını ekle
    if (index === appState.activeSubtitleIndex && appState.subtitleSettings.highlight) {
      subtitleItem.classList.add('active');
    }
    
    // Eğer bu altyazı seçiliyse, selected sınıfını ekle
    if (index === appState.currentSubtitleIndex) {
      subtitleItem.classList.add('selected');
    }
  });
}

// Regex karakterlerini escape et
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Zaman çizelgesini render et
function renderTimeline() {
  // Zaman çizelgesi içeriğini temizle
  timelineTrack.innerHTML = '';
  
  // Eğer altyazı yoksa veya seçili altyazı yoksa, çizelgeyi boş bırak
  if (appState.subtitles.length === 0 || appState.currentSubtitleIndex === -1) {
    return;
  }
  
  // Butonların durumlarını güncelle
  updateButtonStates();
  
  // Seçili altyazı (merkez sahne)
  const currentIndex = appState.currentSubtitleIndex;
  const currentSubtitle = appState.subtitles[currentIndex];
  
  // Mevcut başlangıç ve bitiş zamanlarını al
  const currentStartTime = parseTimeToSeconds(startTimeInput.value);
  const currentEndTime = parseTimeToSeconds(endTimeInput.value);
  
  // Zaman çizelgesi segmentlerini oluştur
  appState.timelineSegments = [];
  
  // Tüm altyazıları zaman sırasına göre sırala
  const sortedSubtitles = [...appState.subtitles].sort((a, b) => a.startTime - b.startTime);
  
  // Çizelgede gösterilecek zaman aralığını belirle
  // Seçilen klibin başlangıç ve bitiş zamanlarını kapsayan bir aralık olmalı
  const clipDuration = currentEndTime - currentStartTime;
  const zoomFactor = appState.zoomLevel;
  const paddingTime = 2 / zoomFactor; // Zoom seviyesine göre padding zamanını ayarla
  
  // Zoom seviyesine göre görüntülenecek zaman aralığını hesapla
  const timelineStartTime = Math.max(0, currentStartTime - paddingTime);
  const timelineEndTime = currentEndTime + paddingTime;
  const timelineDuration = timelineEndTime - timelineStartTime;
  
  // Zaman çizelgesi arka planını oluştur
  const timelineBackground = document.createElement('div');
  timelineBackground.className = 'timeline-background';
  timelineBackground.style.position = 'absolute';
  timelineBackground.style.top = '0';
  timelineBackground.style.left = '0';
  timelineBackground.style.width = '100%';
  timelineBackground.style.height = '100%';
  timelineBackground.style.backgroundColor = '#2a2a2a';
  timelineTrack.appendChild(timelineBackground);
  
  // Zaman işaretlerini ekle (zoom seviyesine göre aralık ayarla)
  let timeMarkerInterval = 1; // Varsayılan 1 saniye
  
  // Zoom seviyesine göre işaret aralığını ayarla
  if (zoomFactor >= 3) {
    timeMarkerInterval = 0.5; // Yüksek zoom seviyesinde daha sık işaretler
  } else if (zoomFactor <= 0.5) {
    timeMarkerInterval = 5; // Düşük zoom seviyesinde daha seyrek işaretler
  }
  
  for (let time = Math.ceil(timelineStartTime / timeMarkerInterval) * timeMarkerInterval; 
       time <= timelineEndTime; 
       time += timeMarkerInterval) {
    const markerPosition = ((time - timelineStartTime) / timelineDuration) * 100;
    
    const timeMarker = document.createElement('div');
    timeMarker.className = 'timeline-marker';
    timeMarker.style.position = 'absolute';
    timeMarker.style.top = '0';
    timeMarker.style.left = `${markerPosition}%`;
    timeMarker.style.width = '1px';
    timeMarker.style.height = '100%';
    timeMarker.style.backgroundColor = '#555';
    timeMarker.style.zIndex = '1';
    
    // Her 5 saniyede bir (veya ayarlanan aralığın 5 katında) daha belirgin işaret
    const majorInterval = timeMarkerInterval * 5;
    if (Math.abs(Math.round(time / majorInterval) * majorInterval - time) < timeMarkerInterval / 10) {
      timeMarker.style.backgroundColor = '#777';
      timeMarker.style.width = '2px';
      
      // Zaman etiketi ekle
      const timeLabel = document.createElement('div');
      timeLabel.className = 'timeline-label';
      timeLabel.textContent = formatTimeWithMs(time);
      timeLabel.style.position = 'absolute';
      timeLabel.style.bottom = '-20px';
      timeLabel.style.left = '50%';
      timeLabel.style.transform = 'translateX(-50%)';
      timeLabel.style.fontSize = '10px';
      timeLabel.style.color = '#999';
      timeMarker.appendChild(timeLabel);
    }
    
    timelineTrack.appendChild(timeMarker);
  }
  
  // Altyazıları çizelgeye ekle
  for (const subtitle of sortedSubtitles) {
    // Altyazı zaman aralığı çizelge aralığı içinde mi?
    if (subtitle.endTime < timelineStartTime || subtitle.startTime > timelineEndTime) {
      continue; // Çizelge aralığı dışında, atla
    }
    
    // Altyazı segmentinin konumunu ve genişliğini hesapla
    const startPosition = Math.max(0, ((subtitle.startTime - timelineStartTime) / timelineDuration) * 100);
    const endPosition = Math.min(100, ((subtitle.endTime - timelineStartTime) / timelineDuration) * 100);
    const width = endPosition - startPosition;
    
    // Segment tipini belirle
    let type = 'other';
    if (appState.subtitles.indexOf(subtitle) === currentIndex) {
      type = 'current';
    }
    
    // Segment elementi oluştur
    const segmentElement = document.createElement('div');
    segmentElement.className = `timeline-segment ${type}`;
    segmentElement.style.position = 'absolute';
    segmentElement.style.top = '5px';
    segmentElement.style.left = `${startPosition}%`;
    segmentElement.style.width = `${width}%`;
    segmentElement.style.height = '24px';
    segmentElement.style.backgroundColor = type === 'current' ? '#0078d7' : '#555';
    segmentElement.style.borderRadius = '2px';
    segmentElement.style.zIndex = '2';
    segmentElement.style.overflow = 'hidden'; // Taşan metni gizle
    segmentElement.style.display = 'flex'; // Flex kullan
    segmentElement.style.alignItems = 'center'; // Dikey ortala
    segmentElement.style.padding = '0 4px'; // Yatay dolgu ekle
    segmentElement.setAttribute('data-index', appState.subtitles.indexOf(subtitle));
    segmentElement.setAttribute('title', `${formatTimeWithMs(subtitle.startTime)} - ${formatTimeWithMs(subtitle.endTime)}: ${subtitle.text}`);
    
    // Altyazı metni önizlemesi ekle
    const textPreview = document.createElement('span');
    textPreview.className = 'timeline-segment-text';
    textPreview.textContent = subtitle.text;
    textPreview.style.fontSize = '10px';
    textPreview.style.color = '#fff';
    textPreview.style.whiteSpace = 'nowrap'; // Tek satırda göster
    textPreview.style.overflow = 'hidden';
    textPreview.style.textOverflow = 'ellipsis'; // Taşan metni ... ile göster
    segmentElement.appendChild(textPreview);
    
    // Segmente tıklama işlevi ekle
    segmentElement.addEventListener('click', () => {
      // Segmente tıklandığında o sahneyi seç
      selectSubtitleForClip(appState.subtitles.indexOf(subtitle));
    });
    
    timelineTrack.appendChild(segmentElement);
    
    // Segment bilgisini kaydet
    appState.timelineSegments.push({
      index: appState.subtitles.indexOf(subtitle),
      element: segmentElement,
      startTime: subtitle.startTime,
      endTime: subtitle.endTime
    });
  }
  
  // Seçilen klibin başlangıç ve bitiş işaretlerini ekle
  const startMarker = document.createElement('div');
  startMarker.className = 'timeline-start-marker';
  startMarker.style.position = 'absolute';
  startMarker.style.top = '0';
  startMarker.style.left = `${((currentStartTime - timelineStartTime) / timelineDuration) * 100}%`;
  startMarker.style.width = '2px';
  startMarker.style.height = '100%';
  startMarker.style.backgroundColor = '#26a69a'; // Yeşil yerine turkuaz
  startMarker.style.zIndex = '3';
  startMarker.setAttribute('title', `Start: ${formatTimeWithMs(currentStartTime)}`);
  timelineTrack.appendChild(startMarker);
  
  const endMarker = document.createElement('div');
  endMarker.className = 'timeline-end-marker';
  endMarker.style.position = 'absolute';
  endMarker.style.top = '0';
  endMarker.style.left = `${((currentEndTime - timelineStartTime) / timelineDuration) * 100}%`;
  endMarker.style.width = '2px';
  endMarker.style.height = '100%';
  endMarker.style.backgroundColor = '#5c6bc0'; // Kırmızı yerine indigo
  endMarker.style.zIndex = '3';
  endMarker.setAttribute('title', `End: ${formatTimeWithMs(currentEndTime)}`);
  timelineTrack.appendChild(endMarker);
  
  // Seçilen klip aralığını vurgula
  const selectedRange = document.createElement('div');
  selectedRange.className = 'timeline-selected-range';
  selectedRange.style.position = 'absolute';
  selectedRange.style.top = '0';
  selectedRange.style.left = `${((currentStartTime - timelineStartTime) / timelineDuration) * 100}%`;
  selectedRange.style.width = `${((currentEndTime - currentStartTime) / timelineDuration) * 100}%`;
  selectedRange.style.height = '100%';
  selectedRange.style.backgroundColor = 'rgba(0, 120, 215, 0.2)';
  selectedRange.style.zIndex = '1';
  selectedRange.setAttribute('title', `Selected Clip: ${formatTimeWithMs(currentStartTime)} - ${formatTimeWithMs(currentEndTime)}`);
  timelineTrack.appendChild(selectedRange);
}

// Klip oluşturmak için altyazı seç
function selectSubtitleForClip(index) {
  console.log('Klip İçin Altyazı Seçiliyor:', index);
  
  const subtitle = appState.subtitles[index];
  if (!subtitle) return;
  
  // Seçilen altyazı ve merkez sahne indekslerini kaydet
  appState.currentSubtitleIndex = index;
  appState.originalCenterIndex = index; // Önemli: Merkez sahne indeksini kaydet
  
  // İlk seçimde başlangıç ve bitiş indeksleri ayarla
  appState.selectedStartIndex = index;
  appState.selectedEndIndex = index;
  
  // Zaman kontrollerini güncelle
  startTimeInput.value = formatTimeWithMs(subtitle.startTime);
  endTimeInput.value = formatTimeWithMs(subtitle.endTime);
  
  // Videoyu sahne başlangıcına getir
  videoPlayer.currentTime = subtitle.startTime;
  
  // Videoyu oynat
  videoPlayer.play();
  
  // Sahnenin sonunda durdur
  const endTime = subtitle.endTime;
  
  const stopAtEnd = () => {
    if (videoPlayer.currentTime >= endTime) {
      videoPlayer.pause();
      videoPlayer.removeEventListener('timeupdate', stopAtEnd);
      console.log('Sahne oynatma tamamlandı ve durduruldu');
    }
  };
  
  // Videoyu bitiş noktasında durdurmak için event listener ekle
  videoPlayer.removeEventListener('timeupdate', stopAtEnd); // Önceki listener'ı kaldır
  videoPlayer.addEventListener('timeupdate', stopAtEnd);
  
  // Seçimi vurgula
  const subtitleItems = document.querySelectorAll('.subtitle-item');
  subtitleItems.forEach(item => {
    item.classList.remove('selected');
  });
  
  const selectedItem = document.querySelector(`.subtitle-item[data-index="${index}"]`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
  }
  
  // Klip özelliklerini ayarla
  appState.selectedClip = {
    text: subtitle.text,
    startTime: subtitle.startTime,
    endTime: subtitle.endTime,
    includePrev: false,
    includeNext: false
  };
  
  // Zaman çizelgesini güncelle
  renderTimeline();
  
  // Butonların durumlarını güncelle
  updateButtonStates();
  
  // Merkez sahnedeki altyazıyı göster
  updateSubtitlePreview();
  
  console.log('selectSubtitleForClip - Tamamlandı');
}

// Önceki sahne ekleme butonu
prevSceneAddBtn.addEventListener('click', () => {
  console.log('----------- ÖNCEKI SAHNE EKLEME TIKLANDI -----------');
  
  // Sahne işlemi bayrağını ayarla ve mevcut indeksi kaydet
  isSceneOperation = true;
  savedCurrentSubtitleIndex = appState.currentSubtitleIndex;
  
  console.log('İŞLEM ÖNCESİ DURUM:');
  console.log('> currentSubtitleIndex (Kaydedilen):', savedCurrentSubtitleIndex);
  console.log('> originalCenterIndex:', appState.originalCenterIndex);
  console.log('> selectedStartIndex:', appState.selectedStartIndex);
  console.log('> selectedEndIndex:', appState.selectedEndIndex);
  
  // Merkez referans indeksini kullan
  const centerIndex = appState.originalCenterIndex !== undefined ? appState.originalCenterIndex : savedCurrentSubtitleIndex;
  
  if (centerIndex === -1 || !appState.subtitles || appState.subtitles.length === 0) {
    console.log('İŞLEM İPTAL: Geçerli altyazı bulunamadı');
    isSceneOperation = false;
    return;
  }
  
  // Başlangıç indeksi - eğer tanımlanmamışsa merkez indeksi kullan
  let startIndex = appState.selectedStartIndex !== undefined ? appState.selectedStartIndex : centerIndex;
  console.log('> Kullanılan başlangıç indeksi:', startIndex);
  
  // Eğer ilk altyazıya ulaşmadıysak önceki sahneyi ekleyebiliriz
  if (startIndex > 0) {
    // İşlemden önce mevcut sahne bilgilerini kaydet
    const oldStartText = appState.subtitles[startIndex].text;
    
    // Bir önceki sahneyi ekle
    startIndex -= 1;
    
    // Yeni sahne bilgilerini al
    const newStartText = appState.subtitles[startIndex].text;
    
    // Yeni başlangıç zamanını güncelle
    startTimeInput.value = formatTimeWithMs(appState.subtitles[startIndex].startTime);
    
    // Altyazı indeksini kaydet
    appState.selectedStartIndex = startIndex;
    
    // İndekslerin değişmediğinden emin ol
    appState.currentSubtitleIndex = savedCurrentSubtitleIndex;
    
    // Timeline ve buton durumlarını güncelle
    renderTimeline();
    updateButtonStates();
    
    // Merkez sahnedeki altyazıyı göster
    updateSubtitlePreview();
    
    console.log('İŞLEM SONRASI DURUM:');
    console.log('> Önceki sahne eklendi - ESKİ metin:', oldStartText);
    console.log('> Önceki sahne eklendi - YENİ metin:', newStartText);
    console.log('> Yeni başlangıç indeksi:', startIndex);
    console.log('> currentSubtitleIndex (Korunan):', appState.currentSubtitleIndex);
    console.log('> originalCenterIndex:', appState.originalCenterIndex);
    console.log('> Referans merkez sahne indeksi sabit kalmalı:', centerIndex);
  } else {
    console.log('İŞLEM İPTAL: Daha önceki sahne yok (indeks 0\'a ulaşıldı)');
  }
  
  isSceneOperation = false;
  console.log('----------- ÖNCEKI SAHNE EKLEME TAMAMLANDI -----------');
});

// Önceki sahne çıkarma butonu
prevSceneRemoveBtn.addEventListener('click', () => {
  console.log('----------- ÖNCEKI SAHNE ÇIKARMA TIKLANDI -----------');
  
  // Sahne işlemi bayrağını ayarla ve mevcut indeksi kaydet
  isSceneOperation = true;
  savedCurrentSubtitleIndex = appState.currentSubtitleIndex;
  
  console.log('İŞLEM ÖNCESİ DURUM:');
  console.log('> currentSubtitleIndex (Kaydedilen):', savedCurrentSubtitleIndex);
  console.log('> originalCenterIndex:', appState.originalCenterIndex);
  console.log('> selectedStartIndex:', appState.selectedStartIndex);
  console.log('> selectedEndIndex:', appState.selectedEndIndex);
  
  // Merkez referans indeksini kullan
  const centerIndex = appState.originalCenterIndex !== undefined ? appState.originalCenterIndex : savedCurrentSubtitleIndex;
  
  if (centerIndex === -1 || !appState.subtitles || appState.subtitles.length === 0) {
    console.log('İŞLEM İPTAL: Geçerli altyazı bulunamadı');
    isSceneOperation = false;
    return;
  }
  
  // Başlangıç indeksi - eğer tanımlanmamışsa merkez indeksi kullan
  let startIndex = appState.selectedStartIndex !== undefined ? appState.selectedStartIndex : centerIndex;
  console.log('> Kullanılan başlangıç indeksi:', startIndex);
  
  // Eğer başlangıç indeksi merkez indeksten küçükse (yani önceki sahneler eklenmiş)
  if (startIndex < centerIndex) {
    // İşlemden önce mevcut sahne bilgilerini kaydet
    const oldStartText = appState.subtitles[startIndex].text;
    
    // En son eklenen önceki sahneyi çıkar
    startIndex += 1;
    
    // Yeni sahne bilgilerini al
    const newStartText = appState.subtitles[startIndex].text;
    
    // Yeni başlangıç zamanını güncelle
    startTimeInput.value = formatTimeWithMs(appState.subtitles[startIndex].startTime);
    
    // Altyazı indeksini kaydet
    appState.selectedStartIndex = startIndex;
    
    // İndekslerin değişmediğinden emin ol
    appState.currentSubtitleIndex = savedCurrentSubtitleIndex;
    
    // Timeline ve buton durumlarını güncelle
    renderTimeline();
    updateButtonStates();
    
    // Merkez sahnedeki altyazıyı göster
    updateSubtitlePreview();
    
    console.log('İŞLEM SONRASI DURUM:');
    console.log('> Önceki sahne çıkarıldı - ESKİ metin:', oldStartText);
    console.log('> Önceki sahne çıkarıldı - YENİ metin:', newStartText);
    console.log('> Yeni başlangıç indeksi:', startIndex);
    console.log('> currentSubtitleIndex (Korunan):', appState.currentSubtitleIndex);
    console.log('> originalCenterIndex:', appState.originalCenterIndex);
    console.log('> Referans merkez sahne indeksi sabit kalmalı:', centerIndex);
  } else {
    console.log('İŞLEM İPTAL: Çıkarılacak önceki sahne yok');
  }
  
  isSceneOperation = false;
  console.log('----------- ÖNCEKI SAHNE ÇIKARMA TAMAMLANDI -----------');
});

// Sonraki sahne ekleme butonu
nextSceneAddBtn.addEventListener('click', () => {
  console.log('----------- SONRAKI SAHNE EKLEME TIKLANDI -----------');
  
  // Sahne işlemi bayrağını ayarla ve mevcut indeksi kaydet
  isSceneOperation = true;
  savedCurrentSubtitleIndex = appState.currentSubtitleIndex;
  
  console.log('İŞLEM ÖNCESİ DURUM:');
  console.log('> currentSubtitleIndex (Kaydedilen):', savedCurrentSubtitleIndex);
  console.log('> originalCenterIndex:', appState.originalCenterIndex);
  console.log('> selectedStartIndex:', appState.selectedStartIndex);
  console.log('> selectedEndIndex:', appState.selectedEndIndex);
  
  // Merkez referans indeksini kullan
  const centerIndex = appState.originalCenterIndex !== undefined ? appState.originalCenterIndex : savedCurrentSubtitleIndex;
  
  if (centerIndex === -1 || !appState.subtitles || appState.subtitles.length === 0) {
    console.log('İŞLEM İPTAL: Geçerli altyazı bulunamadı');
    isSceneOperation = false;
    return;
  }
  
  // Bitiş indeksi - eğer tanımlanmamışsa merkez indeksi kullan
  let endIndex = appState.selectedEndIndex !== undefined ? appState.selectedEndIndex : centerIndex;
  console.log('> Kullanılan bitiş indeksi:', endIndex);
  
  // Eğer son altyazıya ulaşmadıysak sonraki sahneyi ekleyebiliriz
  if (endIndex < appState.subtitles.length - 1) {
    // İşlemden önce mevcut sahne bilgilerini kaydet
    const oldEndText = appState.subtitles[endIndex].text;
    
    // Bir sonraki sahneyi ekle
    endIndex += 1;
    
    // Yeni sahne bilgilerini al
    const newEndText = appState.subtitles[endIndex].text;
    
    // Yeni bitiş zamanını güncelle
    endTimeInput.value = formatTimeWithMs(appState.subtitles[endIndex].endTime);
    
    // Altyazı indeksini kaydet
    appState.selectedEndIndex = endIndex;
    
    // İndekslerin değişmediğinden emin ol
    appState.currentSubtitleIndex = savedCurrentSubtitleIndex;
    
    // Timeline ve buton durumlarını güncelle
    renderTimeline();
    updateButtonStates();
    
    // Merkez sahnedeki altyazıyı göster
    updateSubtitlePreview();
    
    console.log('İŞLEM SONRASI DURUM:');
    console.log('> Sonraki sahne eklendi - ESKİ metin:', oldEndText);
    console.log('> Sonraki sahne eklendi - YENİ metin:', newEndText);
    console.log('> Yeni bitiş indeksi:', endIndex);
    console.log('> currentSubtitleIndex (Korunan):', appState.currentSubtitleIndex);
    console.log('> originalCenterIndex:', appState.originalCenterIndex);
    console.log('> Referans merkez sahne indeksi sabit kalmalı:', centerIndex);
  } else {
    console.log('İŞLEM İPTAL: Daha sonraki sahne yok (son indekse ulaşıldı)');
  }
  
  isSceneOperation = false;
  console.log('----------- SONRAKI SAHNE EKLEME TAMAMLANDI -----------');
});

// Sonraki sahne çıkarma butonu
nextSceneRemoveBtn.addEventListener('click', () => {
  console.log('----------- SONRAKI SAHNE ÇIKARMA TIKLANDI -----------');
  
  // Sahne işlemi bayrağını ayarla ve mevcut indeksi kaydet
  isSceneOperation = true;
  savedCurrentSubtitleIndex = appState.currentSubtitleIndex;
  
  console.log('İŞLEM ÖNCESİ DURUM:');
  console.log('> currentSubtitleIndex (Kaydedilen):', savedCurrentSubtitleIndex);
  console.log('> originalCenterIndex:', appState.originalCenterIndex);
  console.log('> selectedStartIndex:', appState.selectedStartIndex);
  console.log('> selectedEndIndex:', appState.selectedEndIndex);
  
  // Merkez referans indeksini kullan
  const centerIndex = appState.originalCenterIndex !== undefined ? appState.originalCenterIndex : savedCurrentSubtitleIndex;
  
  if (centerIndex === -1 || !appState.subtitles || appState.subtitles.length === 0) {
    console.log('İŞLEM İPTAL: Geçerli altyazı bulunamadı');
    isSceneOperation = false;
    return;
  }
  
  // Bitiş indeksi - eğer tanımlanmamışsa merkez indeksi kullan
  let endIndex = appState.selectedEndIndex !== undefined ? appState.selectedEndIndex : centerIndex;
  console.log('> Kullanılan bitiş indeksi:', endIndex);
  
  // Eğer bitiş indeksi merkez indeksten büyükse (yani sonraki sahneler eklenmiş)
  if (endIndex > centerIndex) {
    // İşlemden önce mevcut sahne bilgilerini kaydet
    const oldEndText = appState.subtitles[endIndex].text;
    
    // En son eklenen sonraki sahneyi çıkar
    endIndex -= 1;
    
    // Yeni sahne bilgilerini al
    const newEndText = appState.subtitles[endIndex].text;
    
    // Yeni bitiş zamanını güncelle
    endTimeInput.value = formatTimeWithMs(appState.subtitles[endIndex].endTime);
    
    // Altyazı indeksini kaydet
    appState.selectedEndIndex = endIndex;
    
    // İndekslerin değişmediğinden emin ol
    appState.currentSubtitleIndex = savedCurrentSubtitleIndex;
    
    // Timeline ve buton durumlarını güncelle
    renderTimeline();
    updateButtonStates();
    
    // Merkez sahnedeki altyazıyı göster
    updateSubtitlePreview();
    
    console.log('İŞLEM SONRASI DURUM:');
    console.log('> Sonraki sahne çıkarıldı - ESKİ metin:', oldEndText);
    console.log('> Sonraki sahne çıkarıldı - YENİ metin:', newEndText);
    console.log('> Yeni bitiş indeksi:', endIndex);
    console.log('> currentSubtitleIndex (Korunan):', appState.currentSubtitleIndex);
    console.log('> originalCenterIndex:', appState.originalCenterIndex);
    console.log('> Referans merkez sahne indeksi sabit kalmalı:', centerIndex);
  } else {
    console.log('İŞLEM İPTAL: Çıkarılacak sonraki sahne yok');
  }
  
  isSceneOperation = false;
  console.log('----------- SONRAKI SAHNE ÇIKARMA TAMAMLANDI -----------');
});

// Butonların durumunu güncelleme
function updateButtonStates() {
  // Merkez referans indeksini kullan
  const centerIndex = appState.originalCenterIndex !== undefined ? appState.originalCenterIndex : appState.currentSubtitleIndex;
  
  console.log('updateButtonStates - Başlangıç:');
  console.log('centerIndex:', centerIndex);
  console.log('appState.originalCenterIndex:', appState.originalCenterIndex);
  console.log('appState.selectedStartIndex:', appState.selectedStartIndex);
  console.log('appState.selectedEndIndex:', appState.selectedEndIndex);
  
  if (centerIndex === -1 || !appState.subtitles || appState.subtitles.length === 0) {
    prevSceneAddBtn.disabled = true;
    prevSceneRemoveBtn.disabled = true;
    nextSceneAddBtn.disabled = true;
    nextSceneRemoveBtn.disabled = true;
    prevSceneAddBtn.classList.add('disabled');
    prevSceneRemoveBtn.classList.add('disabled');
    nextSceneAddBtn.classList.add('disabled');
    nextSceneRemoveBtn.classList.add('disabled');
    console.log('İşlem yapılmadı: Geçerli altyazı yok');
    return;
  }
  
  // Kullanıcının seçtiği indeksleri takip ediyoruz
  const startIndex = appState.selectedStartIndex !== undefined ? appState.selectedStartIndex : centerIndex;
  const endIndex = appState.selectedEndIndex !== undefined ? appState.selectedEndIndex : centerIndex;
  
  console.log('İşlenecek değerler:');
  console.log('startIndex:', startIndex);
  console.log('endIndex:', endIndex);
  
  // Önceki sahne ekleme butonu
  if (startIndex > 0) {
    prevSceneAddBtn.disabled = false;
    prevSceneAddBtn.classList.remove('disabled');
    console.log('prevSceneAddBtn: Aktif');
  } else {
    prevSceneAddBtn.disabled = true;
    prevSceneAddBtn.classList.add('disabled');
    console.log('prevSceneAddBtn: Devre dışı');
  }
  
  // Önceki sahne çıkarma butonu - önceki sahneler eklendiyse aktif
  if (startIndex < centerIndex) {
    prevSceneRemoveBtn.disabled = false;
    prevSceneRemoveBtn.classList.remove('disabled');
    console.log('prevSceneRemoveBtn: Aktif');
  } else {
    prevSceneRemoveBtn.disabled = true;
    prevSceneRemoveBtn.classList.add('disabled');
    console.log('prevSceneRemoveBtn: Devre dışı');
  }
  
  // Sonraki sahne ekleme butonu
  if (endIndex < appState.subtitles.length - 1) {
    nextSceneAddBtn.disabled = false;
    nextSceneAddBtn.classList.remove('disabled');
    console.log('nextSceneAddBtn: Aktif');
  } else {
    nextSceneAddBtn.disabled = true;
    nextSceneAddBtn.classList.add('disabled');
    console.log('nextSceneAddBtn: Devre dışı');
  }
  
  // Sonraki sahne çıkarma butonu - sonraki sahneler eklendiyse aktif
  if (endIndex > centerIndex) {
    nextSceneRemoveBtn.disabled = false;
    nextSceneRemoveBtn.classList.remove('disabled');
    console.log('nextSceneRemoveBtn: Aktif');
  } else {
    nextSceneRemoveBtn.disabled = true;
    nextSceneRemoveBtn.classList.add('disabled');
    console.log('nextSceneRemoveBtn: Devre dışı');
  }
  
  console.log('updateButtonStates - Tamamlandı');
}

// Klip önizleme
previewClipBtn.addEventListener('click', () => {
  if (appState.currentSubtitleIndex === -1) return;
  
  const startTime = parseTimeToSeconds(startTimeInput.value);
  const endTime = parseTimeToSeconds(endTimeInput.value);
  
  // Videoyu başlangıç noktasına getir
  videoPlayer.currentTime = startTime;
  
  // Videoyu oynat
  videoPlayer.play();
  
  // Bitiş noktasında durdur
  const stopPlayback = () => {
    if (videoPlayer.currentTime >= endTime) {
      videoPlayer.pause();
      videoPlayer.removeEventListener('timeupdate', stopPlayback);
    }
  };
  
  videoPlayer.addEventListener('timeupdate', stopPlayback);
});

// Send to Anki butonuna tıklandığında (eski kodun yerine)
sendToAnkiBtn.addEventListener('click', () => {
  if (!appState.videoPath || !appState.subtitlePath || appState.currentSubtitleIndex === -1) {
    alert('Lütfen önce bir video, altyazı ve bir sahne seçin!');
    return;
  }
  
  // Modal'ı açmadan önce sıfırla
  resetAnkiCardModal();
  
  // Seçilen altyazı indeks bilgilerini al
  const currentIndex = appState.currentSubtitleIndex;
  const startIndex = appState.selectedStartIndex || currentIndex;
  const endIndex = appState.selectedEndIndex || currentIndex;
  
  // Video dosya adını al
  const videoName = getFileName(appState.videoPath).replace(/\.[^/.]+$/, ""); // Uzantıyı kaldır
  
  // Altyazı segment numarasını oluştur
  const subtitleSegment = `${startIndex.toString().padStart(4, '0')}-${endIndex.toString().padStart(4, '0')}`;
  
  // Dosya ID'sini oluştur
  const clipId = `${subtitleSegment}_${videoName}`;
  
  // Video alanı için [sound:xxx.webm] formatında değer oluştur
  const videoField = `[sound:${clipId}.webm]`;
  
  // İlk ve son kareler için dosya adları
  const firstFrameField = `_${clipId}_front.jpg`;
  const lastFrameField = `_${clipId}_back.jpg`;
  const subtitleField = `_${clipId}.vtt`;
  
  // Form alanlarını doldur
  ankiIdInput.value = clipId;
  ankiVideoInput.value = videoField;
  ankiFirstFrameInput.value = firstFrameField;
  ankiLastFrameInput.value = lastFrameField;
  ankiSubtitleInput.value = subtitleField;
  
  // Eski word ve diğer alanlar artık dinamik olarak yüklenecek
  
  // Son kullanılan etiketleri kullan
  ankiTagsInput.value = appState.lastUsedTags;
  
  // Anki destelerini ve not tiplerini yükle
  fetchAnkiDecks();
  fetchAnkiModels();
  
  // Modal penceresini göster
  ankiCardModal.style.display = 'block';
});

// Anki'ye gönder
ankiSendBtn.addEventListener('click', async () => {
  try {
    // Son kullanılan bilgileri sakla
    appState.lastUsedTags = ankiTagsInput.value;
    appState.lastUsedDeck = ankiDeckSelect.value;
    appState.lastUsedModel = ankiModelSelect.value;
    
    // Zaman bilgilerini al
    const startTime = parseTimeToSeconds(startTimeInput.value);
    const endTime = parseTimeToSeconds(endTimeInput.value);
    const clipId = ankiIdInput.value;
    
    // Kullanılacak video dosyası yolunu belirle
    const videoPath = appState.convertedVideoPath || appState.videoPath;
    
    // Dinamik alanları toplayalım
    const fields = {};
    
    // Temel alanları ekle
    fields.Id = ankiIdInput.value;
    fields.Video = ankiVideoInput.value; // Bu alan daha sonra video ile değiştirilecek
    
    // Dinamik alanları topla
    const contentInputs = document.querySelectorAll('#content-tab .form-group input');
    contentInputs.forEach(input => {
      if (input.dataset.field) {
        fields[input.dataset.field] = input.value;
      }
    });
    
    // Anki'ye gönderilecek not verilerini hazırla
    const noteData = {
      deckName: ankiDeckSelect.value,
      modelName: ankiModelSelect.value,
      fields: fields,
      tags: ankiTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    // Butonları devre dışı bırak
    ankiSendBtn.disabled = true;
    ankiCancelBtn.disabled = true;
    
    // Durum göstergesini göster
    showAnkiStatus('loading', 'Kart hazırlanıyor...');
    
    try {
      // Klip oluştur ve Anki'ye gönder
      const result = await window.electronAPI.createClipForAnki({
        videoPath: videoPath,
        startTime: startTime,
        endTime: endTime,
        clipId: clipId,
        noteData: noteData,
        extractFirstFrame: true,
        extractLastFrame: true,
        embedSubtitles: appState.embedSubtitles,
        subtitleSource: {
          type: appState.subtitlePath ? 'external' : 'internal',
          path: appState.subtitlePath || null, // Yol yoksa null olarak gönder
          index: appState.currentSubtitleIndex
        }
      });
      
      // Başarı mesajı göster
      showAnkiStatus('success', 'Kart başarıyla eklendi!');
      
      // Modal penceresini kapat
      setTimeout(() => {
        ankiCardModal.style.display = 'none';
        resetAnkiCardModal();
        showNotification('Kart başarıyla Anki\'ye eklendi!');
      }, 1000);
      
    } catch (error) {
      // Hata mesajını düzenle - uzun FFmpeg hata mesajı yerine daha anlaşılır bir mesaj göster
      let errorMessage = error.message;
      
      // FFmpeg hatalarını daha kısa ve anlaşılır hale getir
      if (errorMessage.includes('FFmpeg')) {
        errorMessage = 'Video işleme hatası oluştu. Lütfen tekrar deneyin.';
      } else if (errorMessage.includes('No such file or directory')) {
        errorMessage = 'Dosya bulunamadı. Lütfen tekrar deneyin.';
      } else if (errorMessage.length > 100) {
        // Uzun hata mesajlarını kısalt
        errorMessage = errorMessage.substring(0, 100) + '...';
      }
      
      // Hata durumunu göster
      showAnkiStatus('error', `Hata: ${errorMessage}`);
      
      // Butonları tekrar aktif et
      ankiSendBtn.disabled = false;
      ankiCancelBtn.disabled = false;
      
      // Orijinal hatayı konsola kaydet
      console.error('Anki\'ye gönderme hatası:', error);
    }
  } catch (error) {
    console.error('Anki form işleme hatası:', error);
    alert(`Anki form işleme hatası: ${error.message}`);
  }
});

// Sessiz bildirim gösterme fonksiyonu
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // 3 saniye sonra bildirimi kaldır
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

// Yardımcı fonksiyonlar
function getFileName(filePath) {
  if (!filePath) return "Not Selected";
  
  // Dosya yolundan sadece adını ayıkla
  return filePath.split('\\').pop().split('/').pop();
  
  // NOT: Dosya adı kısaltma işlemi kaldırıldı - tam dosya adları görüntüleniyor
}

// Standart zaman formatı (Altyazı listesi için)
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Milisaniye gösteren zaman formatı (Klip düzenleyici için)
function formatTimeWithMs(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Zaman dizesini saniyeye çevir (milisaniyeleri de destekler)
function parseTimeToSeconds(timeStr) {
  // HH:MM:SS.MS formatı için
  const parts = timeStr.split('.');
  const [hours, minutes, seconds] = parts[0].split(':').map(Number);
  const ms = parts.length > 1 ? Number(parts[1]) / 1000 : 0;
  
  return hours * 3600 + minutes * 60 + seconds + ms;
}

// Butonların durumlarını güncelle
function updateButtonStates() {
  const currentStartTime = parseTimeToSeconds(startTimeInput.value);
  const currentEndTime = parseTimeToSeconds(endTimeInput.value);
  const currentIndex = appState.currentSubtitleIndex;
  
  if (currentIndex === -1) return;
  
  const currentSubtitle = appState.subtitles[currentIndex];
  
  // Önceki sahne çıkarma butonu
  // Eğer başlangıç zamanı merkez sahnenin başlangıç zamanından küçükse,
  // önceki sahneler eklenmiş demektir ve buton aktif olmalı
  if (currentStartTime < currentSubtitle.startTime) {
    prevSceneRemoveBtn.disabled = false;
    prevSceneRemoveBtn.classList.remove('disabled');
  } else {
    // Önceki sahne yoksa buton devre dışı
    prevSceneRemoveBtn.disabled = true;
    prevSceneRemoveBtn.classList.add('disabled');
  }
  
  // Sonraki sahne çıkarma butonu
  // Eğer bitiş zamanı merkez sahnenin bitiş zamanından büyükse,
  // sonraki sahneler eklenmiş demektir ve buton aktif olmalı
  if (currentEndTime > currentSubtitle.endTime) {
    nextSceneRemoveBtn.disabled = false;
    nextSceneRemoveBtn.classList.remove('disabled');
  } else {
    // Sonraki sahne yoksa buton devre dışı
    nextSceneRemoveBtn.disabled = true;
    nextSceneRemoveBtn.classList.add('disabled');
  }
  
  // Önceki sahne ekleme butonu
  // Daha önceki bir sahne varsa aktif olmalı
  let hasPrevScene = false;
  for (let i = 0; i < appState.subtitles.length; i++) {
    const subtitle = appState.subtitles[i];
    if (subtitle.endTime < currentStartTime) {
      hasPrevScene = true;
      break;
    }
  }
  
  if (hasPrevScene) {
    prevSceneAddBtn.disabled = false;
    prevSceneAddBtn.classList.remove('disabled');
  } else {
    prevSceneAddBtn.disabled = true;
    prevSceneAddBtn.classList.add('disabled');
  }
  
  // Sonraki sahne ekleme butonu
  // Daha sonraki bir sahne varsa aktif olmalı
  let hasNextScene = false;
  for (let i = 0; i < appState.subtitles.length; i++) {
    const subtitle = appState.subtitles[i];
    if (subtitle.startTime > currentEndTime) {
      hasNextScene = true;
      break;
    }
  }
  
  if (hasNextScene) {
    nextSceneAddBtn.disabled = false;
    nextSceneAddBtn.classList.remove('disabled');
  } else {
    nextSceneAddBtn.disabled = true;
    nextSceneAddBtn.classList.add('disabled');
  }
}

// Fare tekerleği ile zoom yapma
timelineTrack.addEventListener('wheel', (event) => {
  // Ctrl tuşuna basılıyken fare tekerleği ile zoom yapma
  if (event.ctrlKey) {
    event.preventDefault(); // Sayfanın kaydırılmasını engelle
    
    // Fare tekerleği yukarı = zoom in, aşağı = zoom out
    if (event.deltaY < 0) {
      // Zoom in
      appState.zoomLevel = Math.min(5, appState.zoomLevel + 0.5);
    } else {
      // Zoom out
      appState.zoomLevel = Math.max(0.1, appState.zoomLevel - 0.5);
    }
    
    // Ondalık hassasiyeti sınırla
    appState.zoomLevel = Number(appState.zoomLevel.toFixed(1));
    
    // Zoom seviyesi göstergesini güncelle
    zoomLevelDisplay.textContent = `${appState.zoomLevel}x`;
    
    // Zaman çizelgesini yeniden render et
    renderTimeline();
  }
});

// Zoom butonları işlevleri
zoomInBtn.addEventListener('click', () => {
  // Zoom seviyesini artır (maksimum 5x)
  appState.zoomLevel = Math.min(5, appState.zoomLevel + 0.5);
  // Ondalık hassasiyeti sınırla
  appState.zoomLevel = Number(appState.zoomLevel.toFixed(1));
  zoomLevelDisplay.textContent = `${appState.zoomLevel}x`;
  renderTimeline();
});

zoomOutBtn.addEventListener('click', () => {
  // Zoom seviyesini azalt (minimum 0.1x)
  appState.zoomLevel = Math.max(0.1, appState.zoomLevel - 0.5);
  // Ondalık hassasiyeti sınırla
  appState.zoomLevel = Number(appState.zoomLevel.toFixed(1));
  zoomLevelDisplay.textContent = `${appState.zoomLevel}x`;
  renderTimeline();
});

// Zaman çizelgesine tıklama ile video süresini değiştirme
timelineTrack.addEventListener('click', (event) => {
  // Eğer altyazı yoksa veya seçili altyazı yoksa işlem yapma
  if (appState.subtitles.length === 0 || appState.currentSubtitleIndex === -1) return;
  
  // Tıklanan konumu hesapla
  const trackRect = timelineTrack.getBoundingClientRect();
  const clickPosition = (event.clientX - trackRect.left) / trackRect.width;
  
  // Zoom seviyesine göre görüntülenen zaman aralığını hesapla
  const currentStartTime = parseTimeToSeconds(startTimeInput.value);
  const currentEndTime = parseTimeToSeconds(endTimeInput.value);
  const zoomFactor = appState.zoomLevel;
  const paddingTime = 2 / zoomFactor;
  const timelineStartTime = Math.max(0, currentStartTime - paddingTime);
  const timelineEndTime = currentEndTime + paddingTime;
  const timelineDuration = timelineEndTime - timelineStartTime;
  
  // Tıklanan zamanı hesapla
  const clickedTime = timelineStartTime + (clickPosition * timelineDuration);
  
  // Videoyu tıklanan zamana getir
  videoPlayer.currentTime = clickedTime;
  
  // İmlecin konumunu güncelle
  const cursorPosition = clickPosition * 100;
  timelineCursor.style.left = `${cursorPosition}%`;
  timelineCursor.style.display = 'block';
});

// Zaman çizelgesi üzerinde fare hareketi için tooltip
timelineTrack.addEventListener('mousemove', (e) => {
  const rect = timelineTrack.getBoundingClientRect();
  const position = e.clientX - rect.left;
  const percentage = position / rect.width;
  
  // Mevcut zaman aralığını al
  const startTime = parseFloat(startTimeInput.value);
  const endTime = parseFloat(endTimeInput.value);
  const duration = endTime - startTime;
  
  // Zoom faktörünü hesapla
  const zoomFactor = parseFloat(timelineTrack.getAttribute('data-zoom') || 1);
  
  // Fare pozisyonuna karşılık gelen zamanı hesapla
  const padding = duration * 0.1; // %10 dolgu
  const totalDuration = duration + (2 * padding);
  const adjustedStartTime = startTime - padding;
  
  const hoverTime = adjustedStartTime + (percentage * totalDuration / zoomFactor);
  
  // Zamanı biçimlendir (ss.ms)
  const formattedTime = hoverTime.toFixed(2);
  
  // Tooltip'i güncelle ve göster
  timelineTooltip.textContent = formattedTime;
  timelineTooltip.style.display = 'block';
  timelineTooltip.style.left = `${position}px`;
});

timelineTrack.addEventListener('mouseleave', () => {
  timelineTooltip.style.display = 'none';
});

// Altyazı ayarları butonuna tıklama
subtitleSettingsBtn.addEventListener('click', () => {
  // Modal pencereyi aç
  subtitleSettingsModal.style.display = 'block';
  
  // Geçerli ayarları geçici nesneye kopyala
  tempSubtitleSettings = JSON.parse(JSON.stringify(appState.subtitleSettings));
  
  // Mevcut ayarları form elemanlarına yükle
  loadCurrentSettings();
  
  // Önizlemeyi güncelle
  updateSubtitlePreview();
});

// Modal penceresini kapatma
closeModalBtn.addEventListener('click', () => {
  // Modal'ı kapat ve orijinal ayarlara geri dön
  subtitleSettingsModal.style.display = 'none';
  
  // Geçici değişiklikleri iptal et, orijinal ayarları geri yükle
  applySubtitleStyles();
});

// Modal dışına tıklama ile kapatma
window.addEventListener('click', (event) => {
  if (event.target === subtitleSettingsModal) {
    // Modal'ı kapat ve orijinal ayarlara geri dön
    subtitleSettingsModal.style.display = 'none';
    
    // Geçici değişiklikleri iptal et, orijinal ayarları geri yükle
    applySubtitleStyles();
  }
});

// Ayarları kaydetme
saveSettingsBtn.addEventListener('click', () => {
  // Form değerlerini al ve appState'e kaydet
  appState.subtitleSettings.fontSize = parseInt(fontSizeInput.value);
  appState.subtitleSettings.fontFamily = fontFamilySelect.value;
  appState.subtitleSettings.fontBold = fontBoldCheckbox.checked;
  appState.subtitleSettings.fontItalic = fontItalicCheckbox.checked;
  appState.subtitleSettings.fontColor = fontColorInput.value;
  appState.subtitleSettings.bgColor = bgColorInput.value;
  appState.subtitleSettings.bgOpacity = parseFloat(bgOpacityInput.value);
  appState.subtitleSettings.bgWidth = bgWidthSelect.value;
  appState.subtitleSettings.verticalPosition = parseInt(verticalPositionInput.value);
  appState.subtitleSettings.autoScroll = autoScrollCheckbox.checked;
  appState.subtitleSettings.highlight = highlightCheckbox.checked;
  
  // Ayarları localStorage'a kaydet
  saveSubtitleSettings();
  
  // Altyazı stillerini uygula
  applySubtitleStyles();
  
  // Modal pencereyi kapat
  subtitleSettingsModal.style.display = 'none';
});

// Ayarları sıfırlama
resetSettingsBtn.addEventListener('click', () => {
  // Varsayılan ayarları yükle
  const defaultSettings = {
    fontSize: 18,
    fontFamily: 'Arial, sans-serif',
    fontBold: false,
    fontItalic: false,
    fontColor: '#ffffff',
    bgColor: '#000000',
    bgOpacity: 0.5,
    bgWidth: 'auto', // Varsayılan olarak metin genişliğine uygun
    verticalPosition: 90, // 0: en üst, 100: en alt (2'şer adım ile ilerliyor)
    autoScroll: true,
    highlight: true
  };
  
  // Varsayılan değerleri geçici ayarlara uygula (appState'e değil)
  tempSubtitleSettings = defaultSettings;
  
  // Form elemanlarını varsayılan değerlerle güncelle
  loadTempSettings();
  
  // Önizlemeyi güncelle
  updateSubtitlePreview();
});

// Ayar değişikliklerinde önizlemeyi güncelle
fontSizeInput.addEventListener('input', updateSubtitlePreview);
fontFamilySelect.addEventListener('change', updateSubtitlePreview);
fontBoldCheckbox.addEventListener('change', updateSubtitlePreview);
fontItalicCheckbox.addEventListener('change', updateSubtitlePreview);
fontColorInput.addEventListener('input', updateSubtitlePreview);
bgColorInput.addEventListener('input', updateSubtitlePreview);
bgOpacityInput.addEventListener('input', updateSubtitlePreview);
bgWidthSelect.addEventListener('change', updateSubtitlePreview);
verticalPositionInput.addEventListener('input', updateSubtitlePreview);

// Yazı boyutu değerini göster
fontSizeInput.addEventListener('input', () => {
  fontSizeValue.textContent = `${fontSizeInput.value}px`;
});

// Font Size slideri üzerinde mouse tekerleği ile ince ayar
fontSizeInput.addEventListener('wheel', (e) => {
  e.preventDefault(); // Sayfanın scroll etmesini engelle
  
  // Tekerlek yönüne göre değeri artır veya azalt
  // Tekerlek aşağı = değeri azalt, tekerlek yukarı = değeri artır
  const direction = e.deltaY > 0 ? -1 : 1; // Font size için adım değeri: 1
  
  // Yeni değeri hesapla (sınırlar içinde)
  const currentValue = parseInt(fontSizeInput.value);
  const newValue = Math.max(parseInt(fontSizeInput.min), Math.min(parseInt(fontSizeInput.max), currentValue + direction));
  
  // Değeri güncelle
  fontSizeInput.value = newValue;
  fontSizeValue.textContent = `${newValue}px`;
  
  // Önizlemeyi güncelle
  updateSubtitlePreview();
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  // Kodu kaldırdık, çünkü artık Save butonuna basıldığında değişiklikler uygulanacak
});

// Arkaplan opaklık değerini göster
bgOpacityInput.addEventListener('input', () => {
  const opacity = bgOpacityInput.value;
  const percent = Math.round(opacity * 100);
  bgOpacityValue.textContent = `${percent}%`;
  updateSubtitlePreview();
});

// Background Opacity slideri üzerinde mouse tekerleği ile ince ayar
bgOpacityInput.addEventListener('wheel', (e) => {
  e.preventDefault(); // Sayfanın scroll etmesini engelle
  
  // Tekerlek yönüne göre değeri artır veya azalt
  // Tekerlek aşağı = değeri azalt, tekerlek yukarı = değeri artır
  const direction = e.deltaY > 0 ? -0.1 : 0.1; // Opacity için adım değeri: 0.1
  
  // Yeni değeri hesapla (sınırlar içinde)
  const currentValue = parseFloat(bgOpacityInput.value);
  const newValue = Math.max(parseFloat(bgOpacityInput.min), Math.min(parseFloat(bgOpacityInput.max), currentValue + direction));
  const roundedValue = Math.round(newValue * 10) / 10; // 0.1 adımlarla yuvarla
  
  // Değeri güncelle
  bgOpacityInput.value = roundedValue;
  const percent = Math.round(roundedValue * 100);
  bgOpacityValue.textContent = `${percent}%`;
  
  // Önizlemeyi güncelle
  updateSubtitlePreview();
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  // Kodu kaldırdık, çünkü artık Save butonuna basıldığında değişiklikler uygulanacak
});

// Mevcut ayarları form elemanlarına yükle
function loadCurrentSettings() {
  // Geçici ayarlara appState'den değerleri kopyala
  tempSubtitleSettings = JSON.parse(JSON.stringify(appState.subtitleSettings));
  
  // Form elemanlarını güncelle
  loadTempSettings();
}

// Geçici ayarları form elemanlarına yükle
function loadTempSettings() {
  fontSizeInput.value = tempSubtitleSettings.fontSize;
  fontSizeValue.textContent = `${tempSubtitleSettings.fontSize}px`;
  
  fontFamilySelect.value = tempSubtitleSettings.fontFamily;
  fontBoldCheckbox.checked = tempSubtitleSettings.fontBold;
  fontItalicCheckbox.checked = tempSubtitleSettings.fontItalic;
  fontColorInput.value = tempSubtitleSettings.fontColor;
  bgColorInput.value = tempSubtitleSettings.bgColor;
  
  bgOpacityInput.value = tempSubtitleSettings.bgOpacity;
  const opacityPercent = Math.round(tempSubtitleSettings.bgOpacity * 100);
  bgOpacityValue.textContent = `${opacityPercent}%`;
  
  // Background width (otomatik veya sabit)
  if (tempSubtitleSettings.bgWidth) {
    bgWidthSelect.value = tempSubtitleSettings.bgWidth;
  } else {
    // Eski sürümlerde bu ayar olmayabilir, varsayılan olarak auto ayarla
    bgWidthSelect.value = 'auto';
    tempSubtitleSettings.bgWidth = 'auto';
  }
  
  verticalPositionInput.value = tempSubtitleSettings.verticalPosition;
  verticalPositionValue.textContent = `${tempSubtitleSettings.verticalPosition}%`;
  
  autoScrollCheckbox.checked = tempSubtitleSettings.autoScroll;
  highlightCheckbox.checked = tempSubtitleSettings.highlight;
}

// Önizlemeyi güncelle
function updateSubtitlePreview() {
  // Seçili sahne varmı kontrol et
  if (appState.originalCenterIndex === undefined) return;
  
  // Form değerlerini geçici ayarlar nesnesine aktar
  tempSubtitleSettings.fontSize = parseInt(fontSizeInput.value);
  tempSubtitleSettings.fontFamily = fontFamilySelect.value;
  tempSubtitleSettings.fontBold = fontBoldCheckbox.checked;
  tempSubtitleSettings.fontItalic = fontItalicCheckbox.checked;
  tempSubtitleSettings.fontColor = fontColorInput.value;
  tempSubtitleSettings.bgColor = bgColorInput.value;
  tempSubtitleSettings.bgOpacity = parseFloat(bgOpacityInput.value);
  tempSubtitleSettings.bgWidth = bgWidthSelect.value;
  tempSubtitleSettings.verticalPosition = parseInt(verticalPositionInput.value);
  
  // Burada yalnızca merkez sahnedeki altyazı önizlemesini göster
  const centerIndex = appState.originalCenterIndex;
  const centerSubtitle = appState.subtitles[centerIndex];
  
  // Önizleme olarak yalnızca merkez sahnedeki metni göster
  const previewText = centerSubtitle.text || "Altyazı önizleme metni";
  
  // Video ve önizleme altyazılarını güncelle
  videoSubtitle.textContent = previewText;
  videoSubtitle.style.display = 'block';
  
  subtitlePreview.textContent = previewText;
  
  // Geçici ayarlarla altyazı önizleme stillerini uygula
  applyPreviewStyles();
}

// Önizleme için stilleri uygula (modal içinde)
function applyPreviewStyles() {
  if (!videoSubtitle || !subtitlePreview) return;
  
  // Önizleme stili
  subtitlePreview.style.fontSize = `${tempSubtitleSettings.fontSize}px`;
  subtitlePreview.style.fontFamily = tempSubtitleSettings.fontFamily;
  subtitlePreview.style.fontWeight = tempSubtitleSettings.fontBold ? 'bold' : 'normal';
  subtitlePreview.style.fontStyle = tempSubtitleSettings.fontItalic ? 'italic' : 'normal';
  subtitlePreview.style.color = tempSubtitleSettings.fontColor;
  subtitlePreview.style.backgroundColor = hexToRgba(
    tempSubtitleSettings.bgColor, 
    tempSubtitleSettings.bgOpacity
  );
  
  // Arka plan genişliği ayarını önizlemeye de uygula
  if (tempSubtitleSettings.bgWidth === 'auto') {
    // Otomatik genişlik - metin genişliğine uyum sağlar
    subtitlePreview.style.width = 'auto';
    subtitlePreview.style.display = 'inline-block';
  } else {
    // Sabit genişlik - tüm genişliği kaplar
    subtitlePreview.style.width = '90%';
    subtitlePreview.style.display = 'block';
  }
  
  // Modal açıkken ana video alanındaki önizleme için de geçici stilleri uygula
  if (subtitleSettingsModal.style.display === 'block') {
    videoSubtitle.style.fontSize = `${tempSubtitleSettings.fontSize}px`;
    videoSubtitle.style.fontFamily = tempSubtitleSettings.fontFamily;
    videoSubtitle.style.fontWeight = tempSubtitleSettings.fontBold ? 'bold' : 'normal';
    videoSubtitle.style.fontStyle = tempSubtitleSettings.fontItalic ? 'italic' : 'normal';
    videoSubtitle.style.color = tempSubtitleSettings.fontColor;
    videoSubtitle.style.backgroundColor = hexToRgba(
      tempSubtitleSettings.bgColor, 
      tempSubtitleSettings.bgOpacity
    );
    
    // Arka plan genişliği ayarını videoya da uygula
    if (tempSubtitleSettings.bgWidth === 'auto') {
      videoSubtitle.style.width = 'auto';
      videoSubtitle.style.left = '50%';
      videoSubtitle.style.transform = 'translateX(-50%)';
      videoSubtitle.style.right = 'auto';
      videoSubtitle.style.maxWidth = '80%';
    } else {
      videoSubtitle.style.width = '80%';
      videoSubtitle.style.left = '10%';
      videoSubtitle.style.right = '10%';
      videoSubtitle.style.transform = 'none';
    }
    
    videoSubtitle.style.top = `${tempSubtitleSettings.verticalPosition}%`;
    videoSubtitle.style.bottom = 'auto';
  }
}

// Altyazı stillerini uygula
function applySubtitleStyles() {
  if (!videoSubtitle) return;
  
  // Check if subtitle is empty (text content or inner HTML if it has spans)
  const isEmpty = !videoSubtitle.textContent.trim() && !videoSubtitle.innerHTML.trim();
  
  // Eğer altyazı içeriği boşsa, arka planı gösterme
  if (isEmpty) {
    videoSubtitle.style.display = 'none';
    return;
  }
  
  // İçerik varsa göster
  videoSubtitle.style.display = 'block';
  
  // Altyazı elementine stilleri uygula
  videoSubtitle.style.fontSize = `${appState.subtitleSettings.fontSize}px`;
  videoSubtitle.style.fontFamily = appState.subtitleSettings.fontFamily;
  videoSubtitle.style.fontWeight = appState.subtitleSettings.fontBold ? 'bold' : 'normal';
  videoSubtitle.style.fontStyle = appState.subtitleSettings.fontItalic ? 'italic' : 'normal';
  videoSubtitle.style.color = appState.subtitleSettings.fontColor;
  videoSubtitle.style.backgroundColor = hexToRgba(
    appState.subtitleSettings.bgColor, 
    appState.subtitleSettings.bgOpacity
  );
  videoSubtitle.style.whiteSpace = 'pre-line';
  
  // Arka plan genişliği ayarı - otomatik veya sabit genişlik
  const bgWidth = appState.subtitleSettings.bgWidth || 'auto';
  
  if (bgWidth === 'auto') {
    // Otomatik genişlik - metin genişliğine uyum sağlar
    videoSubtitle.style.width = 'auto';
    videoSubtitle.style.left = '50%';
    videoSubtitle.style.transform = 'translateX(-50%)';
    videoSubtitle.style.right = 'auto';
    videoSubtitle.style.maxWidth = '80%'; // Çok uzun metinler için sınırlama
  } else {
    // Sabit genişlik - tüm genişliği kaplar
    videoSubtitle.style.width = '80%';
    videoSubtitle.style.left = '10%';
    videoSubtitle.style.right = '10%';
    videoSubtitle.style.transform = 'none';
  }
  
  // Dikey konum - 0% = en üst, 100% = en alt
  const verticalPosition = appState.subtitleSettings.verticalPosition;
  
  // Konumu serbestçe ayarla (0-100% aralığında doğrudan)
  // Video container yüksekliğine göre oranla
  videoSubtitle.style.top = `${verticalPosition}%`;
  videoSubtitle.style.bottom = 'auto';
  
  // If vocabulary tooltip is enabled, make sure the word styles are applied
  if (vocabTooltipState && vocabTooltipState.enabled) {
    const wordSpans = videoSubtitle.querySelectorAll('.subtitle-word');
    wordSpans.forEach(span => {
      span.style.cursor = 'pointer';
      span.style.transition = 'background-color 0.2s';
    });
  }
}

// Ayarları localStorage'a kaydet
function saveSubtitleSettings() {
  localStorage.setItem('subtitleSettings', JSON.stringify(appState.subtitleSettings));
}

// Altyazı arama işlevi
subtitleSearch.addEventListener('input', () => {
  const searchTerm = subtitleSearch.value.trim();
  renderSubtitleList(searchTerm);
  
  // Arama kutusu boş değilse temizleme butonunu göster
  if (searchTerm) {
    clearSearchBtn.style.display = 'flex';
  } else {
    clearSearchBtn.style.display = 'none';
  }
});

// Arama kutusunu temizleme butonu
clearSearchBtn.addEventListener('click', () => {
  subtitleSearch.value = '';
  renderSubtitleList();
  clearSearchBtn.style.display = 'none';
});

// Sayfa yüklendiğinde temizleme butonunu gizle
clearSearchBtn.style.display = 'none';

// Ayarları localStorage'dan yükle
function loadSubtitleSettings() {
  const savedSettings = localStorage.getItem('subtitleSettings');
  if (savedSettings) {
    appState.subtitleSettings = JSON.parse(savedSettings);
    applySubtitleStyles();
  }
}

// Hex renk kodunu rgba formatına dönüştür
function hexToRgba(hex, opacity) {
  // Hex kodunu rgb değerlerine dönüştür
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // rgba formatında döndür
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
} 

// Dahili altyazı modal penceresi
const embeddedSubtitlesModal = document.getElementById('embedded-subtitles-modal');
const closeEmbeddedSubtitlesModalBtn = document.getElementById('close-embedded-subtitles-modal');
const embeddedSubtitlesCancelBtn = document.getElementById('embedded-subtitles-cancel-btn');
const embeddedSubtitlesList = document.getElementById('embedded-subtitles-list');

// Dahili altyazıları kontrol et
async function checkEmbeddedSubtitles(videoPath) {
  try {
    // Dahili altyazıları listele
    const subtitles = await window.electronAPI.listEmbeddedSubtitles(videoPath);
    
    // Dahili altyazı varsa, işle
    if (subtitles && subtitles.length > 0) {
      console.log(`${subtitles.length} embedded subtitles found`);
      
      // Dahili altyazıları sakla
      appState.embeddedSubtitles = subtitles;
      
      // Eğer harici altyazı seçilmemişse, ilk altyazıyı otomatik olarak seç
      if (!appState.subtitlePath) {
        // İlk altyazı akışını seç
        await selectEmbeddedSubtitle(videoPath, subtitles[0].index);
        
        // Bildirim göster
        showNotification(`${subtitles.length} embedded subtitles found. Default subtitle loaded.`);
      } else {
        // Harici altyazı zaten seçilmiş, sadece bilgi ver
        showNotification(`${subtitles.length} embedded subtitles found. You can access them from the Embedded Subtitles button.`);
      }
    } else {
      console.log('No embedded subtitles found');
    }
  } catch (error) {
    console.error('Embedded subtitle check error:', error);
  }
}

// Dahili altyazı modal penceresini göster
function showEmbeddedSubtitlesModal(videoPath, subtitles) {
  // Debug için subtitle içeriğini logla
  console.log('Displaying embedded subtitles:', subtitles);
  
  // Modal içeriğini temizle
  embeddedSubtitlesList.innerHTML = '';
  
  // Altyazı sayısı için bilgi göster
  const totalSubtitles = subtitles.length;
  const infoEl = document.createElement('div');
  infoEl.className = 'embedded-subtitles-info';
  infoEl.textContent = `${totalSubtitles} embedded subtitles found`;
  embeddedSubtitlesList.appendChild(infoEl);
  
  // Her bir altyazı için bir öğe oluştur
  subtitles.forEach(subtitle => {
    // Debug: Her altyazıyı detaylıca logla
    console.log(`Creating UI element for subtitle [Stream #${subtitle.index}]:`, subtitle);
    console.log(`  - Display Name: ${subtitle.displayName}`);
    console.log(`  - Language: ${subtitle.language}`);
    console.log(`  - Title: ${subtitle.title}`);
    console.log(`  - Codec: ${subtitle.codec}`);
    
    const subtitleItem = document.createElement('div');
    subtitleItem.className = 'embedded-subtitle-item';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'embedded-subtitle-info';
    
    // Ana dil ve başlık bilgisi
    const languageDiv = document.createElement('div');
    languageDiv.className = 'embedded-subtitle-language';
    
    // displayName değişkenini kullan. Ana dil görünümünü oluştur
    let displayText = subtitle.displayName || `Stream #${subtitle.index}`;
    
    // Dilde özel durum (SDH/Simplified vb) varsa, vurgulama efekti ekle
    if (displayText.includes('[') && displayText.includes(']')) {
      const parts = displayText.split('[');
      const language = parts[0].trim();
      const special = parts[1].replace(']', '').trim();
      
      // Özel formatlı display name oluştur
      languageDiv.innerHTML = `${language} <span style="color: #29b6f6; font-weight: bold;">[${special}]</span>`;
    } else {
      languageDiv.textContent = displayText;
    }
    
    // Başlık bilgisi varsa ve display name'de olmayan bir içerik ise göster
    if (subtitle.title && !displayText.includes(subtitle.title) && subtitle.title !== subtitle.language) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'embedded-subtitle-title';
      titleDiv.textContent = subtitle.title;
      infoDiv.appendChild(titleDiv);
    }
    
    // Ek bilgiler
    const codecDiv = document.createElement('div');
    codecDiv.className = 'embedded-subtitle-codec';
    codecDiv.textContent = `Stream #${subtitle.index} • Codec: ${subtitle.codec}`;
    
    // Öğeleri ekle
    infoDiv.appendChild(languageDiv);
    infoDiv.appendChild(codecDiv);
    
    // Seçim butonu
    const selectBtn = document.createElement('button');
    selectBtn.className = 'embedded-subtitle-select-btn';
    selectBtn.textContent = 'Select';
    selectBtn.addEventListener('click', () => selectEmbeddedSubtitle(videoPath, subtitle.index));
    
    subtitleItem.appendChild(infoDiv);
    subtitleItem.appendChild(selectBtn);
    
    embeddedSubtitlesList.appendChild(subtitleItem);
  });
  
  // Bilgilendirme notu ekle
  const noteEl = document.createElement('div');
  noteEl.className = 'embedded-subtitles-note';
  noteEl.innerHTML = 'Note: Subtitle language information is derived from video metadata and may not always be accurate.';
  embeddedSubtitlesList.appendChild(noteEl);
  
  // Modal penceresini göster
  embeddedSubtitlesModal.style.display = 'block';
}

// Dahili altyazıyı seç
async function selectEmbeddedSubtitle(videoPath, streamIndex) {
  try {
    // Yükleme göstergesi göster
    showLoadingIndicator("Extracting subtitle...");
    
    // Modal penceresini kapat
    embeddedSubtitlesModal.style.display = 'none';
    
    // Altyazıyı çıkart
    const subtitlePath = await window.electronAPI.extractEmbeddedSubtitle({
      videoPath: videoPath,
      streamIndex: streamIndex
    });
    
    // Altyazı yolunu güncelle
    appState.subtitlePath = subtitlePath;
    subtitlePathDisplay.textContent = `Subtitles: Embedded Subtitle (Stream ${streamIndex})`;
    
    // Altyazıları yükle ve listele
    await loadSubtitles(subtitlePath);
    
    // Yükleme göstergesini gizle
    hideLoadingIndicator();
    
    // Bildirim göster
    showNotification("Embedded subtitle successfully loaded");
  } catch (error) {
    hideLoadingIndicator();
    console.error('Embedded subtitle selection error:', error);
    alert(`Embedded subtitle selection error: ${error.message}`);
  }
}

// Modal penceresini kapat (X butonuna tıklandığında)
closeEmbeddedSubtitlesModalBtn.addEventListener('click', () => {
  embeddedSubtitlesModal.style.display = 'none';
});

// Modal penceresini kapat (Cancel butonuna tıklandığında)
embeddedSubtitlesCancelBtn.addEventListener('click', () => {
  embeddedSubtitlesModal.style.display = 'none';
});

// Modal penceresini kapat (modal dışına tıklandığında)
window.addEventListener('click', (event) => {
  if (event.target === embeddedSubtitlesModal) {
    embeddedSubtitlesModal.style.display = 'none';
  }
});

// Dahili altyazılar butonuna tıklandığında
embeddedSubtitlesBtn.addEventListener('click', () => {
  if (appState.videoPath && appState.embeddedSubtitles && appState.embeddedSubtitles.length > 0) {
    showEmbeddedSubtitlesModal(appState.videoPath, appState.embeddedSubtitles);
  } else {
    alert('No embedded subtitles found in this video file.');
  }
});

// Opasiteyi göster
bgOpacityInput.addEventListener('input', () => {
  const opacity = bgOpacityInput.value;
  const percent = Math.round(opacity * 100);
  bgOpacityValue.textContent = `${percent}%`;
  updateSubtitlePreview();
});

// Dikey konumu göster
verticalPositionInput.addEventListener('input', () => {
  const position = verticalPositionInput.value;
  verticalPositionValue.textContent = `${position}%`;
  updateSubtitlePreview();
  
  // Aşağıdaki kodları kaldırıyoruz, çünkü artık Save butonuna basıldığında değişiklikler uygulanacak
  // Gerçek zamanlı olarak altyazı konumunu da güncelle
  // appState.subtitleSettings.verticalPosition = parseInt(position);
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  // Aktif altyazı yoksa hiçbir şey gösterme
  // if (videoSubtitle && videoSubtitle.textContent.trim()) {
  //   applySubtitleStyles();
  // }
});

// Dikey konum slideri üzerinde mouse tekerleği ile ince ayar
verticalPositionInput.addEventListener('wheel', (e) => {
  e.preventDefault(); // Sayfanın scroll etmesini engelle
  
  // Tekerlek yönüne göre değeri artır veya azalt
  // Tekerlek aşağı = değeri azalt, tekerlek yukarı = değeri artır
  const direction = e.deltaY > 0 ? -2 : 2; // Standart artım değeri ile uyumlu (step=2)
  
  // Yeni değeri hesapla (sınırlar içinde)
  const currentValue = parseInt(verticalPositionInput.value);
  const newValue = Math.max(0, Math.min(100, currentValue + direction));
  
  // Değeri güncelle
  verticalPositionInput.value = newValue;
  verticalPositionValue.textContent = `${newValue}%`;
  
  // Önizlemeyi güncelle
  updateSubtitlePreview();
  
  // Aşağıdaki kodları kaldırıyoruz, çünkü artık Save butonuna basıldığında değişiklikler uygulanacak
  // Gerçek zamanlı olarak altyazı konumunu da güncelle
  // appState.subtitleSettings.verticalPosition = newValue;
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  // if (videoSubtitle && videoSubtitle.textContent.trim()) {
  //   applySubtitleStyles();
  // }
});

// Zaman ayarlama butonları işlevleri
// Zaman ayarlama miktarı (saniye)
const TIME_ADJUST_STEP = 0.1; // 100ms

// Başlangıç zamanı için ayarlama butonları
startTimeUpBtn.addEventListener('click', () => adjustTime(startTimeInput, TIME_ADJUST_STEP));
startTimeDownBtn.addEventListener('click', () => adjustTime(startTimeInput, -TIME_ADJUST_STEP));

// Bitiş zamanı için ayarlama butonları
endTimeUpBtn.addEventListener('click', () => adjustTime(endTimeInput, TIME_ADJUST_STEP));
endTimeDownBtn.addEventListener('click', () => adjustTime(endTimeInput, -TIME_ADJUST_STEP));

// Zamanı ayarlama fonksiyonu
function adjustTime(inputElement, seconds) {
  const currentTime = parseTimeToSeconds(inputElement.value);
  const newTime = Math.max(0, currentTime + seconds);
  inputElement.value = formatTimeWithMs(newTime);
  
  // Eğer başlangıç zamanını değiştiriyorsak ve videoyu başlangıç noktasına getir
  if (inputElement === startTimeInput) {
    videoPlayer.currentTime = newTime;
  }
  
  // Zaman çizelgesini güncelle
  renderTimeline();
  
  // Butonların durumlarını güncelle
  updateButtonStates();
}

// Anki Card Modal: Sekme değiştirme işlevselliği
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    // Aktif sekme butonunu güncelle
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Aktif sekme içeriğini güncelle
    const tabId = button.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
  });
});

// Anki Card Modal: Durum göstergesi fonksiyonları
function showAnkiStatus(type, message) {
  ankiStatus.classList.add('visible');
  ankiStatusIcon.className = '';
  ankiStatusText.textContent = message;
  
  if (type === 'loading') {
    ankiStatusIcon.classList.add('loading');
  } else if (type === 'success') {
    ankiStatusIcon.classList.add('success');
  } else if (type === 'error') {
    ankiStatusIcon.classList.add('error');
  }
}

function hideAnkiStatus() {
  ankiStatus.classList.remove('visible');
  ankiStatusIcon.className = '';
  ankiStatusText.textContent = '';
}

// Anki Card Modal'ı sıfırlama fonksiyonu
function resetAnkiCardModal() {
  // Durum göstergesini sıfırla
  hideAnkiStatus();
  
  // Butonları etkinleştir
  ankiSendBtn.disabled = false;
  ankiCancelBtn.disabled = false;
  
  // Altyazı butonlarını varsayılan duruma getir - "Embed Subtitles" seçeneği aktif olsun
  subtitleOffBtn.classList.remove('active');
  subtitleOnBtn.classList.add('active');
  appState.embedSubtitles = true;
  
  // İlk sekmeyi aktif yap
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector('.tab-button[data-tab="content-tab"]').classList.add('active');
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('content-tab').classList.add('active');
}

// Anki modal penceresini kapatma (eski kodun yerine)
closeAnkiModalBtn.addEventListener('click', () => {
  ankiCardModal.style.display = 'none';
  resetAnkiCardModal();
});

// Anki modal penceresini iptal etme (eski kodun yerine)
ankiCancelBtn.addEventListener('click', () => {
  ankiCardModal.style.display = 'none';
  resetAnkiCardModal();
});

// Anki not tiplerini çek ve dropdown'a ekle
async function fetchAnkiModels() {
  try {
    // Dropdown'ı temizle ve yükleniyor mesajını göster
    ankiModelSelect.innerHTML = '<option value="">Loading models...</option>';
    
    // Anki Connect API'den not tiplerini çek (IPC üzerinden)
    const models = await window.electronAPI.getAnkiModels();
    
    // Id ve Video alanlarına sahip uygun modelleri bulmak için
    const modelFields = {};
    const suitableModels = [];
    
    // Tüm modeller için alanları çek ve kontrol et
    for (const model of models) {
      try {
        const fields = await window.electronAPI.getModelFields(model);
        modelFields[model] = fields;
        
        // Id ve Video alanlarına sahip mi kontrol et
        if (fields.includes('Id') && fields.includes('Video')) {
          suitableModels.push(model);
          console.log(`Uygun model bulundu: ${model} (Id ve Video alanlarına sahip)`);
        }
      } catch (error) {
        console.warn(`${model} not tipinin alanları çekilirken hata:`, error);
      }
    }
    
    // Dropdown'ı doldur
    ankiModelSelect.innerHTML = '';
    models.sort().forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      
      // Uygun modelleri işaretle
      if (suitableModels.includes(model)) {
        option.textContent = `${model} ✓`;
        option.dataset.isSuitable = 'true';
      }
      
      ankiModelSelect.appendChild(option);
    });
    
    // Uygun model varsa ve daha önce seçilmiş uygun bir model yoksa, ilk uygun modeli seç
    let selectedModel = null;
    
    if (appState.lastUsedModel && models.includes(appState.lastUsedModel)) {
      // Daha önce kullanılan model varsa kontrol et
      if (suitableModels.includes(appState.lastUsedModel)) {
        // Daha önce kullanılan model uygun ise onu seç
        selectedModel = appState.lastUsedModel;
      } else if (suitableModels.length > 0) {
        // Değilse, uygun bir model seç
        selectedModel = suitableModels[0];
      } else {
        // Uygun model yoksa, en son kullandığı modeli seç
        selectedModel = appState.lastUsedModel;
      }
    } else if (suitableModels.length > 0) {
      // Uygun model varsa ilk uygun modeli seç
      selectedModel = suitableModels[0];
    } else if (models.length > 0) {
      // Uygun model yoksa ilk modeli seç
      selectedModel = models[0];
    }
    
    // Seçilen modeli ayarla
    if (selectedModel) {
      ankiModelSelect.value = selectedModel;
      appState.lastUsedModel = selectedModel;
      
      // Eğer uygun bir model seçilmişse bilgi mesajı göster
      if (!suitableModels.includes(selectedModel)) {
        console.warn(`Seçilen model (${selectedModel}) Id ve Video alanlarına sahip değil.`);
      }
    }
    
    // Değişiklik olayını tetikle (change event listener kullanılacak)
    ankiModelSelect.dispatchEvent(new Event('change'));
  } catch (error) {
    console.error('Anki not tiplerini çekerken hata oluştu:', error);
    ankiModelSelect.innerHTML = '<option value="">Anki bağlantısı kurulamadı</option>';
    
    // Hata durumunda kullanıcıya Anki'yi yeniden başlatma önerisi gösterme
    showAnkiReloadSuggestion();
  }
}

// Anki yeniden başlatma önerisi göster
function showAnkiReloadSuggestion() {
  const contentTab = document.getElementById('content-tab');
  
  // Eğer zaten bir öneri mesajı varsa tekrar ekleme
  if (contentTab.querySelector('.anki-reload-suggestion')) return;
  
  // Öneri mesajı oluştur
  const suggestionDiv = document.createElement('div');
  suggestionDiv.className = 'anki-reload-suggestion';
  suggestionDiv.innerHTML = `
    <strong>Not Tipi alanları yüklenirken sorun oluştu!</strong>
    <p>Bu sorun şu nedenlerden kaynaklanabilir:</p>
    <ul>
      <li>Anki çalışmıyor olabilir.</li>
      <li>Anki-Connect eklentisi aktif değil.</li>
      <li>Not tipinde yeni yaptığınız değişiklikler Anki'de henüz yenilenmemiş olabilir.</li>
    </ul>
    <p>Önerilen çözümler:</p>
    <ol>
      <li>Anki'nin açık olduğundan emin olun.</li>
      <li>Anki'yi yeniden başlatın.</li>
      <li>Anki'de Araçlar > Not Türlerini Yönet menüsünden not tipinin alanlarını kontrol edin.</li>
    </ol>
    <button id="reload-anki-data-btn" class="reload-anki-btn">Anki Verilerini Yenile</button>
  `;
  
  // Mesajı content tab'a ekle
  contentTab.appendChild(suggestionDiv);
  
  // Yenileme butonuna tıklandığında
  const reloadAnkiDataBtn = document.getElementById('reload-anki-data-btn');
  reloadAnkiDataBtn.addEventListener('click', async () => {
    try {
      reloadAnkiDataBtn.disabled = true;
      reloadAnkiDataBtn.textContent = 'Yenileniyor...';
      
      // Anki verilerini yenile
      await window.electronAPI.reloadAnkiData();
      
      // Not tiplerini ve alanlarını tekrar yükle
      await fetchAnkiModels();
      
      // Başarı mesajı göster
      showNotification('Anki verileri başarıyla yenilendi!');
    } catch (error) {
      console.error('Anki verilerini yenileme hatası:', error);
      alert('Anki verilerini yenilerken bir hata oluştu. Lütfen Anki\'nin açık olduğundan emin olun.');
    } finally {
      reloadAnkiDataBtn.disabled = false;
      reloadAnkiDataBtn.textContent = 'Anki Verilerini Yenile';
    }
  });
}

// Not tipi değiştiğinde alanları güncelle
ankiModelSelect.addEventListener('change', () => {
  const selectedModel = ankiModelSelect.value;
  appState.lastUsedModel = selectedModel;
  
  // Seçilen model değiştiğinde önceki hata/öneri mesajlarını temizle
  const contentTab = document.getElementById('content-tab');
  contentTab.innerHTML = '';
  
  // Yükleniyor mesajı göster
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'loading-message';
  loadingMessage.textContent = 'Alanlar yükleniyor...';
  contentTab.appendChild(loadingMessage);
  
  // Alanları güncelle
  updateModelFields(selectedModel);
});

// Not tipinin alanlarını yükle
async function updateModelFields(modelName) {
  if (!modelName) return;
  
  try {
    console.log(`${modelName} not tipinin alanları getiriliyor...`);
    
    // Not tipinin alanlarını çek
    const fields = await window.electronAPI.getModelFields(modelName);
    
    console.log(`${modelName} not tipi için dönen alanlar:`, fields);
    
    // Alanlar dizisi boşsa veya undefined ise hata fırlat
    if (!fields || fields.length === 0) {
      throw new Error(`${modelName} not tipi için hiç alan bulunamadı!`);
    }
    
    // Id ve Video alanlarının varlığını kontrol et
    const hasIdField = fields.includes('Id');
    const hasVideoField = fields.includes('Video');
    const isSuitableModel = hasIdField && hasVideoField;
    
    // Şu an content tabında manuel olarak düzenlenebilen alanları izliyoruz
    const contentTab = document.getElementById('content-tab');
    contentTab.innerHTML = '';
    
    // Eğer model uygun değilse uyarı mesajı göster
    if (!isSuitableModel) {
      const warningDiv = document.createElement('div');
      warningDiv.className = 'warning-message';
      
      let missingFields = [];
      if (!hasIdField) missingFields.push('Id');
      if (!hasVideoField) missingFields.push('Video');
      
      warningDiv.innerHTML = `
        <strong>Uyarı: Not tipi eksik alanlar içeriyor!</strong>
        <p>Seçilen "${modelName}" not tipinde şu zorunlu alanlar eksik: ${missingFields.join(', ')}</p>
        <p>Bu not tipiyle kart oluşturmak için, Anki'de bu not tipine eksik alanları eklemeniz gerekir.</p>
        <p>Alternatif olarak, ✓ işaretli başka bir not tipi seçebilirsiniz.</p>
      `;
      
      contentTab.appendChild(warningDiv);
      
      // Send to Anki butonunu devre dışı bırak
      ankiSendBtn.disabled = true;
      ankiSendBtn.title = `Not tipi "${modelName}" gerekli alanları içermiyor: ${missingFields.join(', ')}`;
    } else {
      // Send to Anki butonunu etkinleştir
      ankiSendBtn.disabled = false;
      ankiSendBtn.title = 'Kartı Anki\'ye gönder';
    }
    
    // Temel alanları her zaman media sekmesinde tut
    const mediaFields = ['Id', 'Video', 'FirstFrame', 'LastFrame'];
    
    // Her alan için form elemanı oluştur (Temel alanlar hariç)
    for (const field of fields) {
      // Anki API'sinden gelen alan adını kontrol et
      if (!field) {
        console.warn('Boş alan adı atlandı.');
        continue;
      }
      
      // Temel alanları atla, onlar zaten media sekmesinde
      if (mediaFields.includes(field)) {
        console.log(`Media alanı atlandı: ${field}`);
        continue;
      }
      
      console.log(`Content alanı oluşturuluyor: ${field}`);
      
      // Alan için form-group oluştur
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';
      
      // Label oluştur
      const label = document.createElement('label');
      label.setAttribute('for', `anki-${field.toLowerCase()}`);
      label.textContent = `${field}:`;
      
      // Input oluştur
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `anki-${field.toLowerCase()}`;
      input.placeholder = `Enter ${field.toLowerCase()}...`;
      input.dataset.field = field; // Gerçek alan adını dataset'te sakla
      
      // Input'u form grubuna ekle
      formGroup.appendChild(label);
      formGroup.appendChild(input);
      
      // Form grubunu tab-content'e ekle
      contentTab.appendChild(formGroup);
    }
    
    // Herhangi bir alan oluşturulup oluşturulmadığını kontrol et
    const formGroups = contentTab.querySelectorAll('.form-group');
    if (formGroups.length === 0 && isSuitableModel) {
      // Hiç alan oluşturulmadıysa bir mesaj göster (sadece uygun model ise)
      const noFieldsMessage = document.createElement('div');
      noFieldsMessage.className = 'no-fields-message';
      noFieldsMessage.textContent = `${modelName} not tipinde gösterilecek içerik alanı bulunamadı.`;
      contentTab.appendChild(noFieldsMessage);
    }
    
  } catch (error) {
    console.error(`Not tipi alanları çekilirken hata oluştu (${modelName}):`, error);
    
    // Hata mesajını kullanıcıya göster
    const contentTab = document.getElementById('content-tab');
    contentTab.innerHTML = '';
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = `Not tipi alanları yüklenirken bir hata oluştu: ${error.message}`;
    contentTab.appendChild(errorMessage);
    
    // Hata durumunda Send to Anki butonunu devre dışı bırak
    ankiSendBtn.disabled = true;
    ankiSendBtn.title = 'Not tipi alanları yüklenemediği için devre dışı';
  }
}

// Anki destelerini çek ve dropdown'a ekle
async function fetchAnkiDecks() {
  try {
    // Dropdown'ı temizle ve yükleniyor mesajını göster
    ankiDeckSelect.innerHTML = '<option value="">Loading decks...</option>';
    
    // Anki Connect API'den desteleri çek (IPC üzerinden)
    const decks = await window.electronAPI.getAnkiDecks();
    
    // Dropdown'ı doldur
    ankiDeckSelect.innerHTML = '';
    decks.sort().forEach(deck => {
      const option = document.createElement('option');
      option.value = deck;
      option.textContent = deck;
      ankiDeckSelect.appendChild(option);
    });
    
    // Eğer daha önce seçilmiş bir deste varsa, onu seç
    if (appState.lastUsedDeck && decks.includes(appState.lastUsedDeck)) {
      ankiDeckSelect.value = appState.lastUsedDeck;
    } else if (decks.length > 0) {
      // İlk desteyi seç
      ankiDeckSelect.value = decks[0];
      appState.lastUsedDeck = decks[0];
    }
  } catch (error) {
    console.error('Anki destelerini çekerken hata oluştu:', error);
    ankiDeckSelect.innerHTML = '<option value="">Anki bağlantısı kurulamadı</option>';
  }
}

// Not tipi değiştiğinde alanları güncelle
ankiModelSelect.addEventListener('change', () => {
  const selectedModel = ankiModelSelect.value;
  appState.lastUsedModel = selectedModel;
  updateModelFields(selectedModel);
});

// Dosya adı için zaman formatı
function formatTimeForFileName(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  // MM:SS formatında döndür (0424 gibi)
  return `${minutes.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`;
}

// Altyazı seçenekleri butonları
const subtitleOffBtn = document.getElementById('subtitle-off-btn');
const subtitleOnBtn = document.getElementById('subtitle-on-btn');

// Altyazı seçenekleri butonları event listeners
subtitleOffBtn.addEventListener('click', () => {
  subtitleOffBtn.classList.add('active');
  subtitleOnBtn.classList.remove('active');
  appState.embedSubtitles = false;
});

subtitleOnBtn.addEventListener('click', () => {
  subtitleOnBtn.classList.add('active');
  subtitleOffBtn.classList.remove('active');
  appState.embedSubtitles = true;
});

// Sahne işlemlerini izlemek için bayrak ve kaydetmek için değişkenler
let isSceneOperation = false;
let savedCurrentSubtitleIndex = -1;

// ===== Vocabulary Tooltip Feature =====
// DOM Elements - declare variables
let vocabTooltip;
let vocabTooltipContent;
let vocabWordInfo;
let closeVocabTooltipBtn;
let vocabTooltipToggleBtn;
let vocabTooltipSettingsBtn;

// Modal Elements - declare variables
let vocabTooltipSettingsModal;
let vocabTooltipEnableCheckbox;
let vocabApiKeyInput;
let vocabModelSelect;
let vocabShowIpaCheckbox;
let vocabShowTurkishCheckbox;
let vocabShowExampleCheckbox;
let vocabAutoPauseCheckbox;
let testApiKeyBtn;
let clearApiKeyBtn;
let apiKeyStatus;
let saveVocabTooltipSettingsBtn;
let resetVocabTooltipSettingsBtn;
let closeVocabTooltipModalBtn;

// Variables for tooltip timing
let showTooltipTimeout = null;
let hideTooltipTimeout = null;

// API key verification - debounce and cache
let apiKeyCheckTimeout = null;
let lastCheckedApiKey = '';
let apiKeyCheckInProgress = false;

// Vocabulary tooltip state
let vocabTooltipState = {
  enabled: true,
  apiKey: '',
  model: '',
  showIpa: true,
  showTurkish: true,
  showExample: true,
  autoPause: false,
  activeWord: null,
  videoWasPlaying: false,
  models: [],
  showDelay: 150,  // ms delay before showing tooltip
  hideDelay: 400   // ms delay before hiding tooltip
};

// Initialize vocabulary tooltip settings and DOM elements
async function initVocabTooltipSettings() {
  // Initialize DOM elements
  vocabTooltip = document.getElementById('vocab-tooltip');
  vocabTooltipContent = document.querySelector('.vocab-tooltip-content');
  vocabWordInfo = document.querySelector('.vocab-word-info');
  closeVocabTooltipBtn = document.getElementById('close-vocab-tooltip');
  vocabTooltipToggleBtn = document.getElementById('vocab-tooltip-toggle-btn');
  vocabTooltipSettingsBtn = document.getElementById('vocab-tooltip-settings-btn');
  
  // Initialize Modal Elements
  vocabTooltipSettingsModal = document.getElementById('vocab-tooltip-settings-modal');
  vocabTooltipEnableCheckbox = document.getElementById('vocab-tooltip-enable');
  vocabApiKeyInput = document.getElementById('vocab-tooltip-api-key');
  vocabModelSelect = document.getElementById('vocab-model-select');
  vocabShowIpaCheckbox = document.getElementById('vocab-show-ipa');
  vocabShowTurkishCheckbox = document.getElementById('vocab-show-turkish');
  vocabShowExampleCheckbox = document.getElementById('vocab-show-example');
  vocabAutoPauseCheckbox = document.getElementById('vocab-auto-pause');
  testApiKeyBtn = document.getElementById('test-api-key-btn');
  clearApiKeyBtn = document.getElementById('clear-api-key-btn');
  apiKeyStatus = document.getElementById('api-key-status');
  saveVocabTooltipSettingsBtn = document.getElementById('save-vocab-tooltip-settings');
  resetVocabTooltipSettingsBtn = document.getElementById('reset-vocab-tooltip-settings');
  closeVocabTooltipModalBtn = vocabTooltipSettingsModal.querySelector('.close-modal');
  
  // Debug initialization
  console.log('Initializing vocabulary tooltip settings');
  
  // Setup event listeners
  vocabTooltipToggleBtn.addEventListener('click', toggleVocabTooltip);
  closeVocabTooltipBtn.addEventListener('click', closeVocabTooltip);
  
  // Add special handler for auto-pause checkbox to log changes
  vocabAutoPauseCheckbox.addEventListener('change', (e) => {
    console.log(`Auto-pause set to: ${e.target.checked}`);
  });
  
  // Open settings modal
  vocabTooltipSettingsBtn.addEventListener('click', () => {
    // Update form values
    updateVocabTooltipUI();
    
    // Show modal
    vocabTooltipSettingsModal.style.display = 'block';
  });
  
  // Close settings modal
  closeVocabTooltipModalBtn.addEventListener('click', () => {
    vocabTooltipSettingsModal.style.display = 'none';
  });
  
  // Save settings
  saveVocabTooltipSettingsBtn.addEventListener('click', saveVocabTooltipSettings);
  
  // Reset settings
  resetVocabTooltipSettingsBtn.addEventListener('click', resetVocabTooltipSettings);
  
  // Clear API Key button
  clearApiKeyBtn.addEventListener('click', clearApiKey);
  
  // Allow hovering over the tooltip to keep it open
  vocabTooltip.addEventListener('mouseenter', () => {
    if (hideTooltipTimeout) {
      clearTimeout(hideTooltipTimeout);
      hideTooltipTimeout = null;
    }
  });
  
  vocabTooltip.addEventListener('mouseleave', () => {
    closeVocabTooltip();
  });
  
  // API key testing
  testApiKeyBtn.addEventListener('click', () => {
    const apiKey = vocabApiKeyInput.value.trim();
    if (apiKey) {
      verifyApiKey(apiKey);
    }
  });
  
  // API key input event with debounce
  vocabApiKeyInput.addEventListener('input', handleApiKeyInput);
  
  // Try to load settings from localStorage
  try {
    const savedSettings = localStorage.getItem('vocabTooltipSettings');
    if (savedSettings) {
      vocabTooltipState = JSON.parse(savedSettings);
      
      // API key should be loaded from secure storage not localStorage
      vocabTooltipState.apiKey = '';
      
      // Add missing properties if needed
      if (vocabTooltipState.model === undefined) {
        vocabTooltipState.model = 'gpt-3.5-turbo';
      }
      
      if (vocabTooltipState.models === undefined) {
        vocabTooltipState.models = [];
      }
      
      // Add delay properties if missing
      if (vocabTooltipState.showDelay === undefined) {
        vocabTooltipState.showDelay = 150;
      }
      
      if (vocabTooltipState.hideDelay === undefined) {
        vocabTooltipState.hideDelay = 400;
      }
    }
  } catch (error) {
    console.error('Error loading vocabulary tooltip settings:', error);
  }
  
  // Load API key from secure storage
  try {
    const result = await window.electronAPI.secureGetApiKey();
    if (result.success && result.apiKey) {
      vocabTooltipState.apiKey = result.apiKey;
      console.log('API key loaded from secure storage');
    }
  } catch (error) {
    console.error('Error loading API key from secure storage');
  }
  
  // Update UI based on loaded settings
  updateVocabTooltipUI();
  
  // If API key is already set, try to verify and fetch models
  if (vocabTooltipState.apiKey) {
    verifyApiKey(vocabTooltipState.apiKey, false);
  }
}

// Clear API key function
async function clearApiKey() {
  try {
    // Clear API key from secure storage
    const result = await window.electronAPI.secureDeleteApiKey();
    if (!result.success) {
      showNotification('Error clearing API key: ' + result.error);
      return;
    }
    
    // Clear API key from state
    vocabTooltipState.apiKey = '';
    
    // Update UI
    vocabApiKeyInput.value = '';
    apiKeyStatus.innerHTML = '';
    apiKeyStatus.className = 'api-key-status';
    
    // Reset model select
    updateModelSelect();
    
    // Create a copy of the state without the API key for localStorage
    const stateForStorage = { ...vocabTooltipState };
    delete stateForStorage.apiKey;
    
    // Save to localStorage (without API key)
    localStorage.setItem('vocabTooltipSettings', JSON.stringify(stateForStorage));
    
    // Show notification
    showNotification('API key cleared successfully.');
  } catch (error) {
    console.error('Error clearing API key:', error);
    showNotification('Failed to clear API key.');
  }
}

// Update UI based on settings
function updateVocabTooltipUI() {
  // Update toggle button state
  if (vocabTooltipState.enabled) {
    vocabTooltipToggleBtn.classList.remove('disabled');
  } else {
    vocabTooltipToggleBtn.classList.add('disabled');
  }
  
  // Ensure all settings are properly initialized
  if (vocabTooltipState.autoPause === undefined) {
    vocabTooltipState.autoPause = false;
  }
  
  // Update settings modal
  vocabTooltipEnableCheckbox.checked = vocabTooltipState.enabled;
  vocabApiKeyInput.value = vocabTooltipState.apiKey || '';
  vocabShowIpaCheckbox.checked = vocabTooltipState.showIpa;
  vocabShowTurkishCheckbox.checked = vocabTooltipState.showTurkish;
  vocabShowExampleCheckbox.checked = vocabTooltipState.showExample;
  vocabAutoPauseCheckbox.checked = vocabTooltipState.autoPause;
  
  // Update model select dropdown
  updateModelSelect();
}

// Update model selection dropdown based on available models
function updateModelSelect() {
  // Clear existing options
  vocabModelSelect.innerHTML = '';
  
  // If API key is not verified or no models available, show placeholder
  if (!vocabTooltipState.apiKey || !vocabTooltipState.models || vocabTooltipState.models.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Enter API key to see available models';
    vocabModelSelect.appendChild(option);
    return;
  }
  
  // Add models from API
  vocabTooltipState.models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    vocabModelSelect.appendChild(option);
  });
  
  // Select current model
  if (vocabTooltipState.model) {
    // Check if the model exists in options
    let modelExists = false;
    for (let i = 0; i < vocabModelSelect.options.length; i++) {
      if (vocabModelSelect.options[i].value === vocabTooltipState.model) {
        vocabModelSelect.selectedIndex = i;
        modelExists = true;
        break;
      }
    }
    
    // If the model doesn't exist, add it
    if (!modelExists && vocabTooltipState.model) {
      const option = document.createElement('option');
      option.value = vocabTooltipState.model;
      option.textContent = vocabTooltipState.model;
      vocabModelSelect.appendChild(option);
      vocabModelSelect.value = vocabTooltipState.model;
    }
  }
}

// Save settings
async function saveVocabTooltipSettings() {
  // Get the API key from the input
  const apiKey = vocabApiKeyInput.value.trim();
  
  // Update settings from form values
  vocabTooltipState.enabled = vocabTooltipEnableCheckbox.checked;
  vocabTooltipState.model = vocabModelSelect.value;
  vocabTooltipState.showIpa = vocabShowIpaCheckbox.checked;
  vocabTooltipState.showTurkish = vocabShowTurkishCheckbox.checked;
  vocabTooltipState.showExample = vocabShowExampleCheckbox.checked;
  vocabTooltipState.autoPause = vocabAutoPauseCheckbox.checked;
  
  // Check if API key changed
  const apiKeyChanged = apiKey !== vocabTooltipState.apiKey;
  
  // Store the API key securely if it has changed and is not empty
  if (apiKeyChanged && apiKey) {
    try {
      const result = await window.electronAPI.secureStoreApiKey({ apiKey });
      if (result.success) {
        vocabTooltipState.apiKey = apiKey;
        console.log('API key saved to secure storage');
      } else {
        showNotification('Failed to securely store API key: ' + result.error);
        return;
      }
    } catch (error) {
      console.error('Error saving API key to secure storage');
      showNotification('Failed to securely store API key');
      return;
    }
  } else if (apiKeyChanged && !apiKey) {
    // If the key was cleared, delete it from secure storage
    try {
      await window.electronAPI.secureDeleteApiKey();
      vocabTooltipState.apiKey = '';
      console.log('API key deleted from secure storage');
    } catch (error) {
      console.error('Error deleting API key from secure storage');
    }
  }
  
  // Log settings (without sensitive information)
  console.log('Saving vocabulary tooltip settings (API key hidden)');
  
  // Ensure delay properties are preserved
  vocabTooltipState.showDelay = vocabTooltipState.showDelay || 150;
  vocabTooltipState.hideDelay = vocabTooltipState.hideDelay || 400;
  
  // Create a copy of the state without the API key for localStorage
  const stateForStorage = { ...vocabTooltipState };
  delete stateForStorage.apiKey;
  
  // Save to localStorage (without API key)
  localStorage.setItem('vocabTooltipSettings', JSON.stringify(stateForStorage));
  
  // Update UI
  updateVocabTooltipUI();
  
  // Close modal
  vocabTooltipSettingsModal.style.display = 'none';
  
  // Show notification
  showNotification('Vocabulary tooltip settings saved successfully.');
}

// Reset settings to default
function resetVocabTooltipSettings() {
  // Preserve the API key
  const currentApiKey = vocabTooltipState.apiKey;
  const currentModels = vocabTooltipState.models;
  
  // Reset other settings
  vocabTooltipState = {
    enabled: true,
    apiKey: currentApiKey, // Keep the API key
    model: 'gpt-3.5-turbo',
    showIpa: true,
    showTurkish: true,
    showExample: true,
    autoPause: false,
    activeWord: null,
    videoWasPlaying: false,
    models: currentModels,  // Keep the available models
    showDelay: 150,  // Default delay
    hideDelay: 400   // Default delay
  };
  
  // Update UI
  updateVocabTooltipUI();
  
  // Create a copy of the state without the API key for localStorage
  const stateForStorage = { ...vocabTooltipState };
  delete stateForStorage.apiKey;
  
  // Save to localStorage (without API key)
  localStorage.setItem('vocabTooltipSettings', JSON.stringify(stateForStorage));
  
  // Show notification
  showNotification('Vocabulary tooltip settings reset to default.');
}

// Verify OpenAI API key and fetch available models
async function verifyApiKey(apiKey, showResultInUI = true) {
  // Skip if already checking or if key is the same as last checked
  if (apiKeyCheckInProgress || (lastCheckedApiKey === apiKey && vocabTooltipState.models.length > 0)) {
    return;
  }
  
  // Update UI to show checking status
  if (showResultInUI) {
    apiKeyStatus.className = 'api-key-status loading';
    apiKeyStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying API key...';
  }
  
  apiKeyCheckInProgress = true;
  lastCheckedApiKey = apiKey;
  
  try {
    // Never log the API key
    console.log('Verifying API key (key hidden for security)');
    
    const result = await window.electronAPI.checkOpenAIApiKey({ apiKey });
    
    if (result.success) {
      // API key is valid, update available models
      vocabTooltipState.models = result.models;
      
      // Update model select dropdown
      updateModelSelect();
      
      // Show success message if UI update is requested
      if (showResultInUI) {
        apiKeyStatus.className = 'api-key-status success';
        apiKeyStatus.innerHTML = `<i class="fas fa-check-circle"></i> API key valid! ${result.models.length} models available.`;
      }
    } else {
      // API key is invalid
      if (showResultInUI) {
        apiKeyStatus.className = 'api-key-status error';
        apiKeyStatus.innerHTML = `<i class="fas fa-times-circle"></i> ${result.error}`;
      }
    }
  } catch (error) {
    console.error('Error verifying API key - check network connection');
    if (showResultInUI) {
      apiKeyStatus.className = 'api-key-status error';
      apiKeyStatus.innerHTML = '<i class="fas fa-times-circle"></i> Error verifying API key. Check console for details.';
    }
  } finally {
    apiKeyCheckInProgress = false;
  }
}

// Handle API key input with debounce
function handleApiKeyInput() {
  const apiKey = vocabApiKeyInput.value.trim();
  
  // Clear previous timeout
  if (apiKeyCheckTimeout) {
    clearTimeout(apiKeyCheckTimeout);
  }
  
  // Clear status
  apiKeyStatus.innerHTML = '';
  apiKeyStatus.className = 'api-key-status';
  
  // Set new timeout
  if (apiKey && apiKey.startsWith('sk-')) {
    apiKeyCheckTimeout = setTimeout(() => {
      verifyApiKey(apiKey);
    }, 1000); // 1 second debounce
  } else if (apiKey) {
    apiKeyStatus.className = 'api-key-status error';
    apiKeyStatus.innerHTML = '<i class="fas fa-times-circle"></i> Invalid API key format. API key should start with "sk-".';
  }
}

// Process subtitle text to make words interactive
function processSubtitleText(text) {
  if (!text) return '';
  
  // Skip processing if tooltip is disabled
  if (!vocabTooltipState.enabled) {
    return text;
  }
  
  // Split text into words while preserving spacing and punctuation
  // This regex matches words while preserving spacing and punctuation
  const wordRegex = /\b(\w+)\b/g;
  
  // Replace each word with a span element
  return text.replace(wordRegex, '<span class="subtitle-word" data-word="$1">$1</span>');
}

// Show tooltip with loading indicator
function showTooltipLoading() {
  // Clear any existing hide timeout
  if (hideTooltipTimeout) {
    clearTimeout(hideTooltipTimeout);
    hideTooltipTimeout = null;
  }
  
  // Set loading content
  vocabTooltipContent.innerHTML = `
    <div class="tooltip-loading">
      <div class="tooltip-loading-spinner"></div>
    </div>
  `;
  
  // Show with delay
  if (showTooltipTimeout) {
    clearTimeout(showTooltipTimeout);
  }
  
  showTooltipTimeout = setTimeout(() => {
    vocabTooltip.style.display = 'block';
    // Add visible class after a small delay for the animation
    setTimeout(() => vocabTooltip.classList.add('visible'), 10);
  }, vocabTooltipState.showDelay);
}

// Show error in tooltip
function showTooltipError(error) {
  vocabTooltipContent.innerHTML = `
    <div class="vocab-row">
      <span style="color: #e74c3c;">Error: ${error}</span>
    </div>
  `;
}

// Parse the definition text from OpenAI into a structured format
function parseDefinition(definitionText) {
  const lines = definitionText.split('\n');
  const result = {};
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  
  return result;
}

// Display word definition in tooltip
function displayWordDefinition(word, definition) {
  // Parse the definition
  const parsedDef = parseDefinition(definition);
  
  // Set header
  vocabWordInfo.textContent = parsedDef.Word || word;
  
  // Build content HTML
  let html = '';
  
  // Base form and part of speech
  if (parsedDef.Base) {
    html += `
      <div class="vocab-row">
        <div class="vocab-label">Base:</div>
        <div class="vocab-value">${parsedDef.Base}</div>
      </div>
    `;
  }
  
  // IPA
  if (parsedDef.IPA && vocabTooltipState.showIpa) {
    html += `
      <div class="vocab-row">
        <div class="vocab-label">IPA:</div>
        <div class="vocab-value">${parsedDef.IPA}</div>
      </div>
    `;
  }
  
  // English definition
  if (parsedDef.English) {
    html += `
      <div class="vocab-row">
        <div class="vocab-label">English:</div>
        <div class="vocab-value">${parsedDef.English}</div>
      </div>
    `;
  }
  
  // Turkish translation
  if (parsedDef.Turkish && vocabTooltipState.showTurkish) {
    html += `
      <div class="vocab-row">
        <div class="vocab-label">Turkish:</div>
        <div class="vocab-value">${parsedDef.Turkish}</div>
      </div>
    `;
  }
  
  // Example sentence
  if (parsedDef.Example && vocabTooltipState.showExample) {
    html += `<div class="vocab-example">${parsedDef.Example}</div>`;
  }
  
  // Set content
  vocabTooltipContent.innerHTML = html;
}

// Fetch and display word definition using the selected model
async function fetchWordDefinition(word, sentence) {
  // Skip if no API key is set
  if (!vocabTooltipState.apiKey) {
    showTooltipError('No API key set. Please set your OpenAI API key in Vocab Settings.');
    return;
  }
  
  // Show loading state
  showTooltipLoading();
  
  try {
    // Log the action without exposing sensitive information
    console.log(`Fetching definition for word: ${word} (API key hidden)`);
    
    // Call API via IPC
    const result = await window.electronAPI.getWordDefinition({
      apiKey: vocabTooltipState.apiKey,
      model: vocabTooltipState.model,
      word: word,
      sentence: sentence
    });
    
    if (result.success) {
      // Display the definition
      displayWordDefinition(word, result.data);
    } else {
      // Show error
      showTooltipError(result.error);
    }
  } catch (error) {
    // Log error without exposing API key
    console.error('Error fetching definition - network or API issue');
    showTooltipError('Failed to fetch word definition. Check console for details.');
  }
}

// Handle word hover/click
function handleWordInteraction(event) {
  // Skip if tooltip is disabled
  if (!vocabTooltipState.enabled) {
    return;
  }
  
  // Ensure autoPause setting is initialized
  if (vocabTooltipState.autoPause === undefined) {
    console.log('Auto-pause was undefined, initializing to false');
    vocabTooltipState.autoPause = false;
  }
  
  const wordElement = event.target;
  const word = wordElement.getAttribute('data-word');
  
  if (!word) {
    return;
  }
  
  // Clear any existing hide timeout
  if (hideTooltipTimeout) {
    clearTimeout(hideTooltipTimeout);
    hideTooltipTimeout = null;
  }
  
  // Close any existing tooltip first to ensure clean state
  if (vocabTooltip.style.display === 'block') {
    // If there's already a tooltip open, just update it with the new word
    // but don't change video play state again
    vocabTooltipState.activeWord = word;
    
    // Get the full subtitle text as context
    let sentence = '';
    if (appState.activeSubtitleIndex !== -1) {
      sentence = appState.subtitles[appState.activeSubtitleIndex].text;
    }
    
    // Fetch and display definition without affecting video playback
    fetchWordDefinition(word, sentence);
    return;
  }
  
  // Get the full subtitle text as context
  let sentence = '';
  if (appState.activeSubtitleIndex !== -1) {
    sentence = appState.subtitles[appState.activeSubtitleIndex].text;
  }
  
  // Set active word
  vocabTooltipState.activeWord = word;
  
  // Check if video was playing and store state
  vocabTooltipState.videoWasPlaying = !videoPlayer.paused;

  // Log for debugging
  console.log('autoPause enabled:', vocabTooltipState.autoPause);
  console.log('video was playing before hover:', vocabTooltipState.videoWasPlaying);
  console.log('video is currently paused:', videoPlayer.paused);
  
  // Auto-pause video if enabled and video is currently playing
  if (vocabTooltipState.autoPause && vocabTooltipState.videoWasPlaying) {
    videoPlayer.pause();
    console.log('Video paused due to tooltip hover');
  }
  
  // Fetch and display definition
  fetchWordDefinition(word, sentence);
}

// Close tooltip
function closeVocabTooltip() {
  // If tooltip is not visible or hiding, no need to proceed
  if (vocabTooltip.style.display !== 'block' || hideTooltipTimeout) {
    return;
  }
  
  // Clear any existing show timeout
  if (showTooltipTimeout) {
    clearTimeout(showTooltipTimeout);
    showTooltipTimeout = null;
  }
  
  // Start hide timeout if not already hiding
  hideTooltipTimeout = setTimeout(() => {
    vocabTooltip.classList.remove('visible');
    // Wait for fade out animation to complete before hiding
    setTimeout(() => {
      vocabTooltip.style.display = 'none';
      vocabTooltipState.activeWord = null;
      
      // Resume video if it was playing and auto-pause is enabled
      if (vocabTooltipState.autoPause && vocabTooltipState.videoWasPlaying) {
        videoPlayer.play().then(() => {
          console.log('Video resumed after tooltip closed');
        }).catch(err => {
          console.error('Error resuming video:', err);
        });
        vocabTooltipState.videoWasPlaying = false;
      }
    }, 200); // Match the CSS transition duration
  }, vocabTooltipState.hideDelay);
}

// Toggle vocabulary tooltip feature
function toggleVocabTooltip() {
  vocabTooltipState.enabled = !vocabTooltipState.enabled;
  updateVocabTooltipUI();
  
  // Save settings - create a safe copy without the API key
  const stateForStorage = { ...vocabTooltipState };
  delete stateForStorage.apiKey;
  localStorage.setItem('vocabTooltipSettings', JSON.stringify(stateForStorage));
  
  // Close tooltip if it's open
  closeVocabTooltip();
  
  // Update subtitle display to add/remove word spans
  if (appState.activeSubtitleIndex !== -1) {
    updateSubtitleDisplay(appState.activeSubtitleIndex);
  }
  
  // Show notification
  showNotification(`Vocabulary tooltip ${vocabTooltipState.enabled ? 'enabled' : 'disabled'}.`);
}

// Initialize vocabulary tooltip settings
document.addEventListener('DOMContentLoaded', initVocabTooltipSettings);

// API key input event

// YouTube UI Elements
const youtubeUrlInput = document.getElementById('youtube-url-input');
const youtubeUrlSubmit = document.getElementById('youtube-url-submit');
const youtubeOptionsModal = document.getElementById('youtube-options-modal');
const youtubeResolutionSelect = document.getElementById('youtube-resolution');
const youtubeSubtitleSelect = document.getElementById('youtube-subtitle-language');
const youtubeDownloadBtn = document.getElementById('youtube-download-btn');
const youtubeLoading = document.getElementById('youtube-loading');

// Close Modal for YouTube Options
youtubeOptionsModal.querySelector('.close-modal').addEventListener('click', () => {
  youtubeOptionsModal.style.display = 'none';
});

// YouTube URL submit handler
youtubeUrlSubmit.addEventListener('click', async () => {
  const url = youtubeUrlInput.value.trim();
  
  if (!url) {
    alert('Please enter a valid YouTube URL');
    return;
  }
  
  try {
    // Yükleme göstergesini göster
    showModal(youtubeOptionsModal);
    youtubeLoading.style.display = 'flex';
    youtubeResolutionSelect.disabled = true;
    youtubeSubtitleSelect.disabled = true;
    youtubeDownloadBtn.disabled = true;
    
    // YouTube bilgilerini al
    const info = await window.electronAPI.getYoutubeInfo(url);
    
    // Yükleme göstergesini gizle
    youtubeLoading.style.display = 'none';
    
    // Çözünürlük seçeneklerini doldur
    youtubeResolutionSelect.innerHTML = '';
    info.videoFormats.forEach(format => {
      const option = document.createElement('option');
      option.value = format.format_id;
      option.textContent = `${format.quality} (${format.ext})`;
      youtubeResolutionSelect.appendChild(option);
    });
    
    // Altyazı seçeneklerini doldur
    youtubeSubtitleSelect.innerHTML = '';
    
    if (info.subtitleTracks.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No subtitles available';
      youtubeSubtitleSelect.appendChild(option);
    } else {
      info.subtitleTracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.url;
        option.textContent = track.name;
        option.dataset.languageCode = track.languageCode;
        option.dataset.auto = track.auto ? 'true' : 'false';
        youtubeSubtitleSelect.appendChild(option);
      });
    }
    
    // Kontrolleri etkinleştir
    youtubeResolutionSelect.disabled = false;
    youtubeSubtitleSelect.disabled = false;
    youtubeDownloadBtn.disabled = false;
    
  } catch (error) {
    youtubeLoading.style.display = 'none';
    alert(`Error getting YouTube video information: ${error.message}`);
    youtubeOptionsModal.style.display = 'none';
  }
});

// YouTube Download ve oynatma
youtubeDownloadBtn.addEventListener('click', async () => {
  const url = youtubeUrlInput.value.trim();
  const formatId = youtubeResolutionSelect.value;
  const subtitleUrl = youtubeSubtitleSelect.value;
  
  // Altyazı kontrolü
  if (!subtitleUrl) {
    alert('This video does not have subtitles. Please select a video with subtitles.');
    return;
  }
  
  try {
    // Yükleme göstergesini göster
    youtubeLoading.style.display = 'flex';
    youtubeResolutionSelect.disabled = true;
    youtubeSubtitleSelect.disabled = true;
    youtubeDownloadBtn.disabled = true;
    youtubeDownloadBtn.textContent = 'Downloading...';
    
    // Video ve altyazıyı indir
    const result = await window.electronAPI.downloadYoutube({
      url,
      formatId,
      subtitleUrl
    });
    
    // İndirme tamamlandığında videoyu yükle
    if (result.videoPath) {
      appState.videoPath = result.videoPath;
      videoPathDisplay.textContent = `Video: YouTube Video`;
      
      // Check if the video file exists before loading
      const fileCheck = await window.electronAPI.checkFilesExist({
        videoPath: result.videoPath,
        subtitlePath: null
      });
      
      console.log('[DEBUG] Video file exists check:', fileCheck.videoExists, 'Path:', result.videoPath);
      
      if (fileCheck.videoExists) {
        // Small delay to ensure file is fully written and available
        setTimeout(() => {
          // Video oynatıcıya yükle - add file:// protocol
          console.log('[DEBUG] Loading video with path:', `file://${result.videoPath}`);
          videoPlayer.src = `file://${result.videoPath}`;
          
          // Video yüklendikten sonra otomatik oynat
          videoPlayer.onloadeddata = function() {
            videoPlayer.play();
          };
          
          // Handle load error
          videoPlayer.onerror = function(e) {
            console.error('[DEBUG] Video load error:', e, videoPlayer.error);
            alert(`Error loading video: ${videoPlayer.error ? videoPlayer.error.message : 'Unknown error'}`);
          };
        }, 500); // 500ms delay
      } else {
        console.error('[DEBUG] Video file does not exist after download:', result.videoPath);
        alert('Error: Video file not found after download. Please try again.');
      }
    }
    
    // Altyazı yükleme
    if (result.subtitlePath) {
      appState.subtitlePath = result.subtitlePath;
      subtitlePathDisplay.textContent = `Subtitles: YouTube Subtitles`;
      
      // Altyazıları yükle ve listele
      await loadSubtitles(result.subtitlePath);
    } else {
      alert('Warning: Subtitles could not be loaded. The video will play without subtitles.');
    }
    
    // Modalı kapat
    youtubeOptionsModal.style.display = 'none';
    
    // Hoş geldiniz ekranını gizle
    checkIfShouldShowWelcome();
    
  } catch (error) {
    console.error('YouTube download error:', error);
    alert(`Error downloading YouTube video: ${error.message}\n\nPlease try again or use a different video.`);
  } finally {
    // Yükleme göstergesini gizle
    youtubeLoading.style.display = 'none';
    youtubeResolutionSelect.disabled = false;
    youtubeSubtitleSelect.disabled = false;
    youtubeDownloadBtn.disabled = false;
    youtubeDownloadBtn.textContent = 'Download and Play';
  }
});

// Genel yardımcı fonksiyonlar
// ... existing code ...

// Modalı göster
function showModal(modal) {
  modal.style.display = 'block';
}

// ... existing code ...