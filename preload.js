const { contextBridge, ipcRenderer } = require('electron');

// Ana işlem ve işleyici arasında güvenli bir API köprüsü oluştur
contextBridge.exposeInMainWorld('electronAPI', {
  // Yeni birleşik dosya seçme işlemi
  selectMediaFiles: () => ipcRenderer.invoke('select-media-files'),
  
  // Eski dosya seçme işlemleri (yedek)
  selectVideo: () => ipcRenderer.invoke('select-video'),
  selectSubtitle: () => ipcRenderer.invoke('select-subtitle'),
  
  // Video oynatma kontrolleri
  playVideo: (videoElement, path) => {
    videoElement.src = path;
    return videoElement.play();
  },
  pauseVideo: (videoElement) => videoElement.pause(),
  seekVideo: (videoElement, time) => {
    videoElement.currentTime = time;
  },
  
  // Ses formatı kontrolü ve dönüştürme
  checkAndConvertAudio: (videoPath) => ipcRenderer.invoke('check-and-convert-audio', videoPath),
  
  // Dahili altyazı işlemleri
  listEmbeddedSubtitles: (videoPath) => ipcRenderer.invoke('list-embedded-subtitles', videoPath),
  extractEmbeddedSubtitle: (args) => ipcRenderer.invoke('extract-embedded-subtitle', args),
  
  // Altyazı işlemleri - güvenli şekilde düzenlendi
  parseSubtitles: async (path) => {
    try {
      // Dosya okuma işlemini main process'e devret
      return await ipcRenderer.invoke('read-file', path);
    } catch (error) {
      console.error('Altyazı okuma hatası:', error);
      throw error;
    }
  },
  
  // SRT dosyalarını doğrudan işleme
  parseSrtFile: async (path) => {
    try {
      // SRT dosyasını işleme işlemini main process'e devret
      return await ipcRenderer.invoke('parse-srt', path);
    } catch (error) {
      console.error('SRT dosyası işleme hatası:', error);
      throw error;
    }
  },
  
  // YouTube işlemleri
  getYoutubeInfo: (url) => ipcRenderer.invoke('get-youtube-info', url),
  downloadYoutube: (args) => ipcRenderer.invoke('download-youtube', args),
  
  // Dosya işlemleri - güvenli şekilde düzenlendi
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Debug helper to get raw file content
  getFileBuffer: (filePath) => ipcRenderer.invoke('get-file-buffer', filePath),
  
  // Dosyaların varlığını kontrol et
  checkFilesExist: (args) => ipcRenderer.invoke('check-files-exist', args),
  
  // Anki entegrasyonu
  sendToAnki: (args) => ipcRenderer.invoke('send-to-anki', args),
  
  // Anki-Connect API entegrasyonu
  getAnkiDecks: () => ipcRenderer.invoke('get-anki-decks'),
  getAnkiModels: () => ipcRenderer.invoke('get-anki-models'),
  getModelFields: (modelName) => ipcRenderer.invoke('get-model-fields', modelName),
  addAnkiNote: (noteData) => ipcRenderer.invoke('add-anki-note', noteData),
  createClipForAnki: (args) => ipcRenderer.invoke('create-clip-for-anki', args),
  reloadAnkiData: () => ipcRenderer.invoke('reload-anki-data'),
  
  // Kelime anlamları için OpenAI API entegrasyonu
  getWordDefinition: (args) => ipcRenderer.invoke('get-word-definition', args),
  
  // OpenAI API key doğrulama ve model listesi
  checkOpenAIApiKey: (args) => ipcRenderer.invoke('check-openai-api-key', args),
  
  // Secure storage for API keys
  secureStoreApiKey: (args) => ipcRenderer.invoke('secure-store-api-key', args),
  secureGetApiKey: () => ipcRenderer.invoke('secure-get-api-key'),
  secureDeleteApiKey: () => ipcRenderer.invoke('secure-delete-api-key')
});

// Loglama işlevi
contextBridge.exposeInMainWorld('logger', {
  debug: (message) => ipcRenderer.invoke('log', {level: 'debug', message}),
  info: (message) => ipcRenderer.invoke('log', {level: 'info', message}),
  warn: (message) => ipcRenderer.invoke('log', {level: 'warn', message}),
  error: (message) => ipcRenderer.invoke('log', {level: 'error', message})
}); 