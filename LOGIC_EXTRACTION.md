# PHYSICS & LOGIC ENGINE SPECIFICATIONS

## 1. Malzeme Sabitleri
- **Çelik Elastisite Modülü ($E$):** $200,000$ MPa
- **Çelik Akma Sınırı ($YS$):** $235$ MPa
- **Isı İletim Katsayıları:**
  - Çelik: $45$ W/mK
  - PU Köpük: $0.025$ W/mK

## 2. Termodinamik Formüller
- **Sıcaklık Farkı ($\Delta T$):** $|T_{dış} - T_{iç}|$
- **Isı Kaybı ($Q_{total}$):** $Q_{panel} + Q_{köşe}$
- **Paralel Isı Yolları:**
  - Saf Köpük Yolu: $U_{pu} \cdot A_{pu} \cdot \Delta T$
  - İskelet Yolu: Köpük boşluğu ve çelik web seri direnç toplamı.

## 3. Statik Formüller
- **Atalet Momenti ($I_x$):** Kutu veya C-Profil geometrisine göre hesaplanır.
- **Sehim ($maxD$):** - Ankastre (Fixed) Durumu: $\frac{1 \cdot q \cdot L^4}{384 \cdot E \cdot I}$
  - Mafsallı (Pinned) Durumu: $\frac{5 \cdot q \cdot L^4}{384 \cdot E \cdot I}$
- **Gerilme ($\sigma$):** Moment ve kesit modülüne bağlı birleşik gerilme.

## 4. Kritik Uyarı Eşikleri
- Gerilme > $235$ MPa ise "Kritik" uyarısı verilir.
- Isı köprüsü tespiti: Profil derinliği ($d$) panel kalınlığının ($th$) $\%70$'inden büyükse tetiklenir ($d \ge th \cdot 0.7$).