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

panelResizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  lastDownX = e.clientX;
  panelResizer.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
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
  
  // Event listener'ları kaldır
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mouseleave', onMouseUp);
}

// Sayfa yüklendiğinde panel genişliklerini yükle
function loadPanelWidths() {
  // Her zaman varsayılan değerleri kullan
  leftPanel.style.width = '65%';
  rightPanel.style.width = '35%';
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

// Video ve Altyazı seçme işlemi - yeni birleşik işlev
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
        
        // Yükleme göstergesini gizle
        hideLoadingIndicator();
        
        // Dahili altyazıları kontrol et
        checkEmbeddedSubtitles(result.videoPath);
      } catch (error) {
        console.error("Video hazırlama hatası:", error);
        // Hata durumunda orijinal dosyayı kullan
        videoPlayer.src = `file://${result.videoPath}`;
        hideLoadingIndicator();
      }
    }
    
    if (result.subtitlePath) {
      appState.subtitlePath = result.subtitlePath;
      subtitlePathDisplay.textContent = `Subtitles: ${getFileName(result.subtitlePath)}`;
      
      // Altyazıları yükle ve listele
      await loadSubtitles(result.subtitlePath);
    }
    
    // Her iki dosya da seçildiyse ikisini birden kaydet
    if (result.videoPath && result.subtitlePath) {
      saveLastUsedFiles(result.videoPath, result.subtitlePath);
    } else if (result.videoPath) {
      saveLastUsedFiles(result.videoPath, null);
    } else if (result.subtitlePath) {
      saveLastUsedFiles(null, result.subtitlePath);
    }
    
  } catch (error) {
    console.error('File selection error:', error);
    alert('An error occurred while selecting files. Please try again.');
    hideLoadingIndicator();
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
    let subtitles = [];
    
    if (filePath.toLowerCase().endsWith('.srt')) {
      // SRT dosyalarını doğrudan main process'te işle
      subtitles = await window.electronAPI.parseSrtFile(filePath);
    } else if (filePath.toLowerCase().endsWith('.ass') || filePath.toLowerCase().endsWith('.ssa')) {
      // Diğer formatlar için mevcut işleme yöntemini kullan
      const subtitleContent = await window.electronAPI.readFile(filePath);
      subtitles = parseASS(subtitleContent);
    } else if (filePath.toLowerCase().endsWith('.vtt')) {
      const subtitleContent = await window.electronAPI.readFile(filePath);
      subtitles = parseVTT(subtitleContent);
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
      alert('Subtitle file could not be read or unsupported format.');
    }
  } catch (error) {
    console.error('Error loading subtitles:', error);
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
  const subtitles = [];
  const blocks = content.trim().split(/\r?\n\r?\n/);
  
  // İlk blok WEBVTT başlığı olabilir, atla
  const startIndex = blocks[0].trim().startsWith('WEBVTT') ? 1 : 0;
  
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
        const timeMatch = timeLine.match(/(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2})\.(\d{3})/);
        
        if (timeMatch) {
          const startMinutes = parseInt(timeMatch[1]);
          const startSeconds = parseInt(timeMatch[2]);
          const startMilliseconds = parseInt(timeMatch[3]);
          
          const endMinutes = parseInt(timeMatch[4]);
          const endSeconds = parseInt(timeMatch[5]);
          const endMilliseconds = parseInt(timeMatch[6]);
          
          const startTime = startMinutes * 60 + startSeconds + startMilliseconds / 1000;
          const endTime = endMinutes * 60 + endSeconds + endMilliseconds / 1000;
          
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
  }
  
  return subtitles;
}

// Altyazı takip sistemi
function setupSubtitleTracking() {
  // Önceki izleyiciyi temizle
  videoPlayer.removeEventListener('timeupdate', updateActiveSubtitle);
  // Yeni izleyici ekle
  videoPlayer.addEventListener('timeupdate', updateActiveSubtitle);
}

// Geçerli aktif altyazıyı güncelle
function updateActiveSubtitle() {
  const currentTime = videoPlayer.currentTime;
  
  // Şu anki zaman damgasına göre aktif altyazıyı bul
  const activeIndex = appState.subtitles.findIndex(
    subtitle => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
  );
  
  // Aktif altyazı değiştiyse güncelle
  if (activeIndex !== appState.currentSubtitleIndex) {
    appState.currentSubtitleIndex = activeIndex;
    
    // Tüm altyazılardan active sınıfını kaldır
    const subtitleItems = document.querySelectorAll('.subtitle-item');
    subtitleItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Aktif altyazıya active sınıfını ekle
    if (activeIndex !== -1) {
      const activeItem = document.querySelector(`.subtitle-item[data-index="${activeIndex}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
        
        // Otomatik kaydırma ayarı açıksa, aktif altyazıyı görünür hale getir
        if (appState.subtitleSettings.autoScroll) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
        
        // Altyazıyı video üzerinde göster
        videoSubtitle.textContent = appState.subtitles[activeIndex].text;
        videoSubtitle.style.display = 'block';
        
        // Altyazı stillerini uygula
        applySubtitleStyles();
      }
    } else {
      // Aktif altyazı yoksa, video üzerindeki altyazıyı gizle
      videoSubtitle.textContent = '';
      videoSubtitle.style.display = 'none';
    }
  }
  
  // Zaman çizelgesi imlecini güncelle
  updateTimelineCursor();
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
    timeSpan.textContent = `${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)}`;
    
    const textSpan = document.createElement('span');
    textSpan.className = 'subtitle-text';
    
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
      timeLabel.textContent = formatTime(time);
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
    segmentElement.setAttribute('title', `${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)}: ${subtitle.text}`);
    
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
  if (index < 0 || index >= appState.subtitles.length) return;
  
  console.log('selectSubtitleForClip - Başlangıç:');
  console.log('Seçilen indeks:', index);
  
  // Seçilen altyazı indeksini ve süreleri güncelle
  appState.currentSubtitleIndex = index;
  appState.originalCenterIndex = index; // Merkez referans indeksi olarak kaydet
  const subtitle = appState.subtitles[index];
  
  // Başlangıç ve bitiş indekslerini seçilen altyazı için ayarla
  appState.selectedStartIndex = index;
  appState.selectedEndIndex = index;
  
  console.log('Ayarlanan değerler:');
  console.log('appState.currentSubtitleIndex:', appState.currentSubtitleIndex);
  console.log('appState.originalCenterIndex:', appState.originalCenterIndex);
  console.log('appState.selectedStartIndex:', appState.selectedStartIndex);
  console.log('appState.selectedEndIndex:', appState.selectedEndIndex);
  
  // Başlangıç ve bitiş zamanlarını ayarla
  startTimeInput.value = formatTimeWithMs(subtitle.startTime);
  endTimeInput.value = formatTimeWithMs(subtitle.endTime);
  
  // Seçili altyazı metnini göster
  subtitlePreview.textContent = subtitle.text;
  
  // Videoyu ilgili konuma getir
  videoPlayer.currentTime = subtitle.startTime;
  
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
  
  console.log('selectSubtitleForClip - Tamamlandı');
}

// Önceki sahne ekleme butonu - tamamen yeniden yazıldı
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
    updateSubtitlePreview(); // Altyazı önizlemesini güncelle
    
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

// Önceki sahne çıkarma butonu - tamamen yeniden yazıldı
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
    updateSubtitlePreview(); // Altyazı önizlemesini güncelle
    
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

// Sonraki sahne ekleme butonu - tamamen yeniden yazıldı
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
    updateSubtitlePreview(); // Altyazı önizlemesini güncelle
    
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

// Sonraki sahne çıkarma butonu - tamamen yeniden yazıldı
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
    updateSubtitlePreview(); // Altyazı önizlemesini güncelle
    
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
  const currentStartTime = parseTimeToSeconds(startTimeInput.value);
  const currentEndTime = parseTimeToSeconds(endTimeInput.value);
  const currentIndex = appState.currentSubtitleIndex;
  const centerIndex = appState.originalCenterIndex !== undefined ? appState.originalCenterIndex : currentIndex;
  
  if (currentIndex === -1) return;
  
  const currentSubtitle = appState.subtitles[currentIndex];
  const centerSubtitle = appState.subtitles[centerIndex];
  
  // Seçili başlangıç ve bitiş indekslerini kontrol et
  const selectedStartIndex = appState.selectedStartIndex !== undefined ? appState.selectedStartIndex : centerIndex;
  const selectedEndIndex = appState.selectedEndIndex !== undefined ? appState.selectedEndIndex : centerIndex;
  
  // Önceki sahne çıkarma butonu
  // Eğer seçili başlangıç indeksi merkez indeksten küçükse (yani önceki sahneler eklenmiş)
  // o zaman buton aktif olmalı
  if (selectedStartIndex < centerIndex) {
    prevSceneRemoveBtn.disabled = false;
    prevSceneRemoveBtn.classList.remove('disabled');
  } else {
    // Önceki sahne yoksa buton devre dışı
    prevSceneRemoveBtn.disabled = true;
    prevSceneRemoveBtn.classList.add('disabled');
  }
  
  // Sonraki sahne çıkarma butonu
  // Eğer seçili bitiş indeksi merkez indeksten büyükse (yani sonraki sahneler eklenmiş)
  // o zaman buton aktif olmalı
  if (selectedEndIndex > centerIndex) {
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
  if (selectedStartIndex > 0) {
    hasPrevScene = true;
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
  if (selectedEndIndex < appState.subtitles.length - 1) {
    hasNextScene = true;
  }
  
  if (hasNextScene) {
    nextSceneAddBtn.disabled = false;
    nextSceneAddBtn.classList.remove('disabled');
  } else {
    nextSceneAddBtn.disabled = true;
    nextSceneAddBtn.classList.add('disabled');
  }
  
  // DEBUG - Buton durumlarını logla
  console.log("Buton durumları:", {
    centerIndex,
    selectedStartIndex,
    selectedEndIndex,
    prevRemoveActive: !prevSceneRemoveBtn.disabled,
    nextRemoveActive: !nextSceneRemoveBtn.disabled,
    prevAddActive: !prevSceneAddBtn.disabled,
    nextAddActive: !nextSceneAddBtn.disabled
  });
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
function getFileName(path) {
  return path.split('\\').pop().split('/').pop();
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
  const centerIndex = appState.originalCenterIndex !== undefined ? appState.originalCenterIndex : currentIndex;
  
  if (currentIndex === -1) return;
  
  const currentSubtitle = appState.subtitles[currentIndex];
  const centerSubtitle = appState.subtitles[centerIndex];
  
  // Seçili başlangıç ve bitiş indekslerini kontrol et
  const selectedStartIndex = appState.selectedStartIndex !== undefined ? appState.selectedStartIndex : centerIndex;
  const selectedEndIndex = appState.selectedEndIndex !== undefined ? appState.selectedEndIndex : centerIndex;
  
  // Önceki sahne çıkarma butonu
  // Eğer seçili başlangıç indeksi merkez indeksten küçükse (yani önceki sahneler eklenmiş)
  // o zaman buton aktif olmalı
  if (selectedStartIndex < centerIndex) {
    prevSceneRemoveBtn.disabled = false;
    prevSceneRemoveBtn.classList.remove('disabled');
  } else {
    // Önceki sahne yoksa buton devre dışı
    prevSceneRemoveBtn.disabled = true;
    prevSceneRemoveBtn.classList.add('disabled');
  }
  
  // Sonraki sahne çıkarma butonu
  // Eğer seçili bitiş indeksi merkez indeksten büyükse (yani sonraki sahneler eklenmiş)
  // o zaman buton aktif olmalı
  if (selectedEndIndex > centerIndex) {
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
  if (selectedStartIndex > 0) {
    hasPrevScene = true;
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
  if (selectedEndIndex < appState.subtitles.length - 1) {
    hasNextScene = true;
  }
  
  if (hasNextScene) {
    nextSceneAddBtn.disabled = false;
    nextSceneAddBtn.classList.remove('disabled');
  } else {
    nextSceneAddBtn.disabled = true;
    nextSceneAddBtn.classList.add('disabled');
  }
  
  // DEBUG - Buton durumlarını logla
  console.log("Buton durumları:", {
    centerIndex,
    selectedStartIndex,
    selectedEndIndex,
    prevRemoveActive: !prevSceneRemoveBtn.disabled,
    nextRemoveActive: !nextSceneRemoveBtn.disabled,
    prevAddActive: !prevSceneAddBtn.disabled,
    nextAddActive: !nextSceneAddBtn.disabled
  });
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
  
  // Mevcut ayarları form elemanlarına yükle
  loadCurrentSettings();
  
  // Önizlemeyi güncelle
  updateSubtitlePreview();
});

// Modal penceresini kapatma
closeModalBtn.addEventListener('click', () => {
  subtitleSettingsModal.style.display = 'none';
});

// Modal dışına tıklama ile kapatma
window.addEventListener('click', (event) => {
  if (event.target === subtitleSettingsModal) {
    subtitleSettingsModal.style.display = 'none';
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
  appState.subtitleSettings.verticalPosition = parseInt(verticalPositionInput.value);
  appState.subtitleSettings.autoScroll = autoScrollCheckbox.checked;
  appState.subtitleSettings.highlight = highlightCheckbox.checked;
  
  // Ayarları localStorage'a kaydet
  saveSubtitleSettings();
  
  // Altyazı stillerini güncelle
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
    verticalPosition: 90, // 0: en üst, 100: en alt (2'şer adım ile ilerliyor)
    autoScroll: true,
    highlight: true
  };
  
  appState.subtitleSettings = defaultSettings;
  
  // Form elemanlarını güncelle
  loadCurrentSettings();
  
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
  
  // Gerçek zamanlı olarak font boyutunu da güncelle
  appState.subtitleSettings.fontSize = newValue;
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  if (videoSubtitle && videoSubtitle.textContent.trim()) {
    applySubtitleStyles();
  }
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
  
  // Gerçek zamanlı olarak arkaplan opaklığını da güncelle
  appState.subtitleSettings.bgOpacity = roundedValue;
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  if (videoSubtitle && videoSubtitle.textContent.trim()) {
    applySubtitleStyles();
  }
});

// Mevcut ayarları form elemanlarına yükle
function loadCurrentSettings() {
  fontSizeInput.value = appState.subtitleSettings.fontSize;
  fontSizeValue.textContent = `${appState.subtitleSettings.fontSize}px`;
  
  fontFamilySelect.value = appState.subtitleSettings.fontFamily;
  fontBoldCheckbox.checked = appState.subtitleSettings.fontBold;
  fontItalicCheckbox.checked = appState.subtitleSettings.fontItalic;
  fontColorInput.value = appState.subtitleSettings.fontColor;
  bgColorInput.value = appState.subtitleSettings.bgColor;
  
  bgOpacityInput.value = appState.subtitleSettings.bgOpacity;
  const opacityPercent = Math.round(appState.subtitleSettings.bgOpacity * 100);
  bgOpacityValue.textContent = `${opacityPercent}%`;
  
  verticalPositionInput.value = appState.subtitleSettings.verticalPosition;
  verticalPositionValue.textContent = `${appState.subtitleSettings.verticalPosition}%`;
  
  autoScrollCheckbox.checked = appState.subtitleSettings.autoScroll;
  highlightCheckbox.checked = appState.subtitleSettings.highlight;
}

// Önizlemeyi güncelle
function updateSubtitlePreview() {
  if (appState.selectedStartIndex === undefined || appState.selectedEndIndex === undefined) {
    return;
  }
  
  // Seçilen altyazılar arasındaki metni görüntüle
  let previewText = '';
  for (let i = appState.selectedStartIndex; i <= appState.selectedEndIndex; i++) {
    if (appState.subtitles[i]) {
      previewText += appState.subtitles[i].text + ' ';
    }
  }
  
  // Önizleme alanını güncelle (eğer mevcutsa)
  const previewElement = document.getElementById('subtitle-preview');
  if (previewElement) {
    previewElement.textContent = previewText.trim();
  }
  
  // Video üzerindeki altyazıyı da güncelle
  if (videoSubtitle) {
    videoSubtitle.textContent = previewText.trim();
    videoSubtitle.style.display = previewText.trim() ? 'block' : 'none';
    applySubtitleStyles();
  }
}

// Altyazı stillerini uygula
function applySubtitleStyles() {
  if (!videoSubtitle) return;
  
  // Eğer altyazı içeriği boşsa, arka planı gösterme
  if (!videoSubtitle.textContent.trim()) {
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
  
  // Dikey konum - 0% = en üst, 100% = en alt
  const verticalPosition = appState.subtitleSettings.verticalPosition;
  
  // Konumu serbestçe ayarla (0-100% aralığında doğrudan)
  // Video container yüksekliğine göre oranla
  videoSubtitle.style.transform = 'none';
  videoSubtitle.style.top = `${verticalPosition}%`;
  videoSubtitle.style.bottom = 'auto';
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
  
  // Gerçek zamanlı olarak altyazı konumunu da güncelle
  appState.subtitleSettings.verticalPosition = parseInt(position);
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  // Aktif altyazı yoksa hiçbir şey gösterme
  if (videoSubtitle && videoSubtitle.textContent.trim()) {
    applySubtitleStyles();
  }
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
  
  // Gerçek zamanlı olarak altyazı konumunu da güncelle
  appState.subtitleSettings.verticalPosition = newValue;
  
  // Eğer aktif bir altyazı varsa stilini güncelle
  if (videoSubtitle && videoSubtitle.textContent.trim()) {
    applySubtitleStyles();
  }
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
  document.querySelector('.tab-button[data-tab="media-tab"]').classList.add('active');
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('media-tab').classList.add('active');
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

// Sahne ekleme/çıkarma olaylarındaki geçici değişkenleri tanımla
let isSceneOperation = false;
let savedCurrentSubtitleIndex = -1;