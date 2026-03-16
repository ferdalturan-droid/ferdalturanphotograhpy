# KORKMAN2 - Netlify Deployment Guide

## Gereksinimler
1. **Netlify hesabı** (ücretsiz: netlify.com)
2. **MongoDB Atlas hesabı** (ücretsiz: mongodb.com/atlas)

## Adım 1: MongoDB Atlas Kurulumu
1. https://www.mongodb.com/atlas adresine git
2. Ücretsiz bir cluster oluştur
3. Database Access → Yeni kullanıcı oluştur (username/password)
4. Network Access → "Allow Access from Anywhere" (0.0.0.0/0) ekle
5. Connect → "Connect your application" → Connection string'i kopyala
   - Örnek: `mongodb+srv://kullanici:sifre@cluster0.xxxxx.mongodb.net/korkman2?retryWrites=true&w=majority`

## Adım 2: Projeyi GitHub'a Yükle
1. Bu projenin tüm dosyalarını GitHub'a pushla
2. Proje yapısı:
   ```
   /
   ├── netlify.toml          ← Netlify config
   ├── netlify/
   │   └── functions/
   │       ├── api.js         ← Backend (serverless)
   │       └── package.json
   └── frontend/
       ├── src/
       ├── public/
       └── package.json
   ```

## Adım 3: Netlify'da Deploy
1. Netlify'a giriş yap → "Add new site" → "Import an existing project"
2. GitHub repo'nu seç
3. Build ayarları (otomatik olarak netlify.toml'dan okunur):
   - **Base directory**: `frontend`
   - **Build command**: `yarn build`
   - **Publish directory**: `frontend/build`
   - **Functions directory**: `netlify/functions`

4. **Environment Variables** ekle (Site settings → Environment variables):
   - `MONGO_URL` = MongoDB Atlas connection string (Adım 1'den)
   - `DB_NAME` = `korkman2`
   - `REACT_APP_BACKEND_URL` = (boş bırak veya silme)

5. "Deploy site" tıkla

## Adım 4: Test Et
- Site açılınca otomatik olarak seed data oluşturulur
- Admin kodu: `1234`
- Şoför isim girişi yapıp başlayabilirsin

## Sorun Giderme
- **API çalışmıyor**: Netlify → Functions → api.js loglarını kontrol et
- **MongoDB bağlantı hatası**: MONGO_URL environment variable'ı doğru mu kontrol et
- **Boş sayfa**: Build loglarını kontrol et, `yarn build` başarılı mı?

## Notlar
- Netlify Functions ücretsiz planda 125.000 istek/ay
- MongoDB Atlas ücretsiz planda 512MB depolama
- Her ikisi de küçük-orta ölçekli kullanım için yeterli
