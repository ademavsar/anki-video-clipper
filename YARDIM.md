# Anki Video Clipper - Kullanım Kılavuzu

Bu uygulama, film izlerken Anki kartları oluşturmanızı kolaylaştırmak için tasarlanmıştır. İzlediğiniz filmlerden altyazılı klipler oluşturabilir ve bunları Anki'ye ekleyebilirsiniz.

## Başlangıç

1. **Video Seç** butonu ile bir video dosyası seçin
2. **Altyazı Seç** butonu ile filme ait altyazı dosyasını seçin
   - Desteklenen altyazı formatları: .srt, .ass, .vtt

## Altyazı Listesi

- Altyazı dosyası yüklendikten sonra, tüm altyazılar sağ üst panelde listelenecektir
- Video oynatılırken, şu anda görüntülenen altyazı mavi bir çizgiyle vurgulanacaktır
- Herhangi bir altyazıya tıklayarak videoyu o noktaya atlayabilirsiniz
- **Klip Oluştur** butonuna tıklayarak ilgili altyazıyı klip düzenleyicide açabilirsiniz

## Klip Düzenleme

Bir altyazı seçtikten sonra, şu ayarlamaları yapabilirsiniz:

1. **Altyazı Metni**: Altyazı metnini düzenleyebilirsiniz
2. **Başlangıç ve Bitiş Zamanları**: Klip süresini ayarlayabilirsiniz
3. **Önceki/Sonraki Sahneler**: Kaç adet önceki/sonraki sahnenin dahil edileceğini seçebilirsiniz
4. **Süre Ayarı**: Klip sonunu uzatmak/kısaltmak için milisaniye değeri girebilirsiniz

## Klip Oluşturma ve Anki Entegrasyonu

1. **Önizle** butonuna tıklayarak klibi videodan önizleyebilirsiniz
2. **Klip Oluştur** butonuna tıklayarak klibi oluşturabilirsiniz
   - Oluşturulan klipler, video dosyasının adıyla aynı isimde bir klasöre kaydedilir
3. **Anki'ye Gönder** butonuna tıklayarak kartı Anki'ye gönderebilirsiniz (AnkiConnect eklentisi gereklidir)

## Tuş Kısayolları

- **Space**: Video oynatma/durdurma
- **Left/Right Arrow**: 5 saniye geri/ileri
- **Ctrl+Left/Right Arrow**: Önceki/sonraki altyazıya atlama

## İpuçları

- Altyazı listesinde seçilen altyazı turuncu renkte vurgulanır
- Şu anda oynatılan altyazı mavi renkte vurgulanır
- Video oynatılırken liste otomatik olarak geçerli altyazıyı gösterecek şekilde kayar
- Altyazılara tıklayarak anında ilgili sahneye atlayabilirsiniz
- Klip süresini istediğiniz gibi ayarlayabilirsiniz, seçtiğiniz altyazı sadece başlangıç noktasıdır

## Sorun Giderme

- **Altyazı Yüklenmiyor**: Altyazı formatının desteklendiğinden emin olun (SRT, ASS, VTT)
- **Video Oynatılmıyor**: Video formatının desteklendiğinden emin olun (MP4, MKV, WebM, AVI)
- **Klip Oluşturulmuyor**: FFmpeg'in sisteminizde kurulu olduğundan emin olun
- **Anki'ye Gönderilmiyor**: AnkiConnect eklentisinin kurulu ve çalışır durumda olduğundan emin olun 