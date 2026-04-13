# ARCHITECTURE & TECH STACK

## 1. Frontend Framework
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Mode)

## 2. UI & Styling
- **CSS:** Tailwind CSS
- **Component Library:** Shadcn/UI (Radix UI tabanlı)
- **Icons:** Lucide React
- **Animations:** Framer Motion

## 3. Core Logic (Physics Engine)
- Tüm hesaplamalar `/lib/physics-engine.ts` içinde saf TypeScript fonksiyonları olarak tutulacaktır.
- UI bileşenleri (React) sadece bu kütüphaneden gelen verileri tüketecektir.

## 4. Veri Yönetimi
- **State Management:** React `useState` ve `useContext` (veya büyük projeler için Zustand).
- **Persistence:** LocalStorage (Kullanıcı ayarlarını saklamak için).

## 5. Deployment
- **Platform:** Vercel
- **CI/CD:** GitHub Actions