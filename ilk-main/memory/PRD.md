# Kørselsrapport (Sürüş Raporu) PRD

## Proje Özeti
Danimarka nakliye/lojistik şirketleri için profesyonel bir şoför ve tur takip sistemi.

## Orijinal Problem
Kullanıcı mevcut bir HTML dosyasından (Uden.html) daha basit ve profesyonel bir sayfa yapılmasını istedi.

## Teknoloji Stack
- **Frontend**: React 19 + Tailwind CSS + Lucide Icons + jsPDF
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **UI**: Sonner (toast notifications)

## Kullanıcı Personaları
1. **Şoför**: Günlük turlarını takip eder, ağırlık/zaman girer
2. **Yönetici**: Tüm şoförleri ve turları yönetir, PDF rapor oluşturur

## Temel Gereksinimler
- [x] Şoför yönetimi (CRUD)
- [x] Mail'den tur parse etme (TSV format - tab-separated)
- [x] Manuel tur ekleme
- [x] Tur takibi (ağırlık, zaman, tamamlandı durumu)
- [x] Plads/Område (alan/bölge) seçimi
- [x] İstatistik kartları (toplam tur, tamamlanan, kg, saat)
- [x] Notlar bölümü
- [x] PDF oluşturma (jsPDF + autotable)

## Uygulanan Özellikler (12 Mart 2026)

### v1.0 - Temel MVP
- Şoför yönetimi (12 varsayılan şoför)
- Mail parse (tab-separated format)
- Manuel tur ekleme
- Tur durumu takibi

### v1.1 - Akıllı Sıralama ve PDF
- **På vej butonu**: Satır en başa gider (sarı), otomatik saat yazılır
- **Kilo girilince**: Satır en sona gider (yeşil - tamamlandı)
- **Şoför ismi görünür**: "Dennis kører" (på vej durumunda)
- **PDF oluşturma**: Tam çalışan PDF export
- **HASTER/Senere etiketleri**: Kırmızı/turuncu badge'ler
- **Facility gruplama**: Aynı modtageanlæg olanlar "3x" badge ile gösterilir

### Backend API Endpoints
- `GET/POST/DELETE /api/drivers`
- `GET/POST/PUT/DELETE /api/tours`
- `POST /api/tours/bulk`
- `POST /api/tours/pause`
- `POST /api/parse-mail`
- `GET/POST/PUT/DELETE /api/reports`
- `POST /api/seed`

### Sıralama Mantığı
1. **På vej** (sarı) → En üstte
2. **HASTER** → Öncelikli
3. **Normal** → Ortada (facility'ye göre gruplu)
4. **Completed** (yeşil) → En altta

## Öncelikli Backlog (Sıradaki)

### P0 - Kritik
- [x] PDF oluşturma ✅

### P1 - Yüksek
- [ ] Dark mode toggle
- [ ] Turları sürükle-bırak sıralama
- [ ] Şoför düzenleme özelliği

### P2 - Orta
- [ ] Mail parse geçmişi
- [ ] Şoför performans istatistikleri
- [ ] Veri dışa aktarma (Excel)

## Sonraki Adımlar
1. Dark mode ekle
2. Turları sürükle-bırak ile sıralama
3. Rota optimizasyonu özelliği
