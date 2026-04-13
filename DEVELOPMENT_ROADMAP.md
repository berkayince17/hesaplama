# DEVELOPMENT ROADMAP

## Faz 1: Proje Kurulumu
1. `npx create-next-app@latest` komutu ile projeyi başlat.
2. `shadcn/ui` bileşenlerini (Slider, Card, Progress, Select, Input, Label) kur.

## Faz 2: Logic Katmanı
1. `LOGIC_EXTRACTION.md` dosyasındaki formülleri kullanarak `/lib/physics-engine.ts` dosyasını oluştur.
2. Unit testler ile formüllerin doğruluğunu eski HTML ile kıyasla.

## Faz 3: UI Bileşenleri
1. Sidebar ve KPI kartlarını tasarla.
2. HTML5 Canvas simülasyonunu React bileşenine (`SimulationCanvas.tsx`) dönüştür.
3. SVG Teknik Çizim motorunu dinamik hale getir.

## Faz 4: Entegrasyon ve Optimizasyon
1. State'leri bağla (Slider değişince hesaplama anında güncellensin).
2. PDF raporlama özelliğini ekle.
3. Vercel üzerinden yayına al.