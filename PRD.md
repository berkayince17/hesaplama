# PRODUCT REQUIREMENTS DOCUMENT (PRD) - Thermodynamic Core v60

## 1. Vizyon ve Amaç
Bu uygulama, endüstriyel soğutma kasalarının termal verimliliğini ve yapısal bütünlüğünü analiz eden profesyonel bir mühendislik aracıdır. Mevcut "tek dosyalık HTML" yapısını, ölçeklenebilir bir SaaS mimarisine taşımayı hedefler.

## 2. Ana Fonksiyonel Gereksinimler
- **Termal Analiz:** Kasa panellerindeki ısı kaybını (Watt) ve ısı köprülerini (Thermal Bridge) hesaplar.
- **Statik Analiz:** Rüzgar yükü altında profil sehimini (deflection) ve birleşik gerilmeyi (stress) hesaplar.
- **Dinamik Görselleştirme:** Isı akışını simüle eden bir Canvas ve teknik kesitleri gösteren SVG çizimleri sunar.
- **Ağırlık Yönetimi:** Kullanılan çelik ve sac miktarına göre toplam kasa ağırlığını tahmin eder.

## 3. Hedef Kullanıcı Kitlesi
- Makine Mühendisleri
- Soğutma Kasası Üretim Ekipleri
- Ar-Ge Departmanları

## 4. Başarı Kriterleri
- Hesaplamaların orijinal HTML motoru ile %100 uyumlu olması.
- Dashboard'un 60 FPS akıcılıkta çalışması.
- Mobil ve Masaüstü tam uyumluluk (Responsive).