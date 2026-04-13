# UI/UX DESIGN GUIDELINES

## 1. Tema ve Renk Paleti
- **Arka Plan:** Dark Mode (Slate 950 / #020617)
- **Kartlar:** Glassmorphism (Slate 900 / %50 Opacity / Backdrop Blur 10px)
- **Aksan Renkler:**
  - Ana İşlem: Cyan 500 (#06b6d4)
  - Tehlike/Hata: Rose 500 (#f43f5e)
  - Başarı/Güvenli: Emerald 500 (#10b981)
  - Isı/Sıcaklık: Orange 500 (#f59e0b)

## 2. Layout (Düzen)
- **Sidebar:** Sol tarafta 320px genişliğinde, tüm parametre girişleri (Slider ve Select) burada yer alır.
- **Main:** Sağ tarafta KPI kartları üstte, simülasyon ve SVG çizimleri altta olacak şekilde grid yapısı.

## 3. Etkileşimler
- Slider değerleri değiştiğinde KPI kartlarındaki sayılar "counter" animasyonu ile değişmeli.
- Isı köprüsü (Thermal Bridge) oluştuğunda ilgili kartın border'ı kırmızı neon "pulse" efekti yapmalı.

## 4. Responsive Davranış
- 1024px altındaki ekranlarda Sidebar "Drawer" moduna geçmeli veya ekranın en üstüne taşınmalı.