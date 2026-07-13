# MIZAAM

MIZAAM — HR, CRM, marketing, davomat, vazifalar, hisobotlar va moliyaviy boshqaruvni bitta panelga yig'adigan platforma.

## Lokal ishga tushirish

```bash
npm install
npm run dev
```

Build tekshirish:

```bash
npm run build
```

## Loginlar

- Super admin: `admin / admin123`
- Demo HR: `demo-company / demo12345`

## Vercel deploy

Repo Vercelga frontend sifatida tayyor:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrite: `vercel.json` ichida sozlangan

Vercelda `/admin`, `/employees`, `/finance` kabi route'lar refresh qilinganda ham `index.html` orqali ochiladi.

## Backend va Telegram bot

`server.js` doimiy Node server va Telegram webhook/polling uchun ishlaydi. Vercel frontend deployida `/api/state` mavjud bo'lmasa, ilova demo ma'lumotlar bilan ishlaydi.

Telegram botni productionda ishlatish uchun `server.js` ni Render, Railway, Fly.io yoki VPS kabi doimiy Node hostingga joylash tavsiya qilinadi.

Kerakli environment variables:

- `PORT`
- `PUBLIC_URL`
- `TELEGRAM_BOT_TOKEN`

Webhook ulash:

```bash
curl -X POST https://your-domain.com/api/telegram/set-webhook
```

## Vercel deploy report

Holat: loyiha Vercel frontend deploy uchun tayyor.

Tekshiruv sanasi: 2026-07-13

Git holati:

- Branch: `main`
- Remote: `origin https://github.com/mrstxt/yourHR.git`
- Vercel moslash va admin panel soddalashtirish commit: `30b3469 Prepare MIZAAM admin panel for Vercel`
- `git status` tekshiruvida commit qilinmagan fayl qolmagan edi

Build tekshiruvi:

```bash
npm run build
```

Natija: build muvaffaqiyatli yakunlandi.

Vite faqat bundle hajmi bo'yicha warning berdi. Bu warning deployni to'xtatmaydi, lekin keyingi optimizatsiyada lazy loading yoki manual chunks orqali kamaytirish mumkin.

Vercel sozlamalari:

- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Node version: default Vercel Node versiyasi yetarli
- Environment variables: frontend demo deploy uchun majburiy emas

Repo ichida `vercel.json` bor:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Bu sozlama React Router ishlatadigan sahifalar uchun kerak. Masalan, `/admin`, `/employees`, `/finance` sahifalarini refresh qilganda Vercel 404 bermaydi, hammasi `index.html` orqali ochiladi.

Vercelda deploy qilish tartibi:

1. Vercel dashboardga kiring.
2. `Add New Project` ni bosing.
3. GitHubdan `mrstxt/yourHR` reposini tanlang.
4. Framework sifatida `Vite` tanlanganini tekshiring.
5. Build command `npm run build`, output directory `dist` ekanini tekshiring.
6. `Deploy` tugmasini bosing.
7. Deploy tugagandan keyin `/login`, `/admin`, `/hr/login` route'larini ochib tekshiring.

Muhim cheklov:

Vercel deploy hozir frontend uchun tayyor. `server.js` esa doimiy Node server, faylga yoziladigan data va Telegram webhook/polling bilan ishlaydi. Shu sabab Telegram bot va real backend state uchun Render, Railway, Fly.io yoki VPS kabi alohida Node hosting kerak bo'ladi.

Frontend Vercelda backend topilmasa demo ma'lumotlar bilan ishlaydi. Bu demo, prezentatsiya va frontend preview uchun yetarli.

## Loyiha maqsadi

MIZAAM kichik va o'rta bizneslar uchun HR, CRM, moliya, davomat, vazifalar va ichki aloqa jarayonlarini bitta boshqaruv paneliga yig'adi.

Asosiy maqsadlar:

- kompaniya xodimlarini yagona bazada yuritish
- davomat, kechikish va kelmaganlarni kuzatish
- vazifalar, muddatlar, bonuslar va statuslarni boshqarish
- xodimlardan kunlik hisobot olish va tasdiqlash
- oylik, bonus, KPI, jarima va xarajatlarni ko'rish
- support va ichki chat orqali aloqa qilish
- Telegram bot orqali xodimlarga qulay kanal berish
- CRM va marketing avtomatizatsiyasini keyingi bosqichlarda kengaytirish

## Texnik tarkib

Frontend:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui komponentlari
- React Router
- Recharts
- Sonner toast

Backend:

- `server.js` Node HTTP server
- local JSON data saqlash
- Telegram bot webhook/polling endpointlari
- statik `dist` fayllarni serve qilish imkoniyati

Deploy:

- Vercel: frontend static deploy
- Render/Railway/Fly.io/VPS: backend va Telegram bot uchun tavsiya qilinadi

## Qilingan ishlar

MIZAAMga moslangan o'zgarishlar:

- loyiha nomi va meta ma'lumotlar MIZAAMga almashtirildi
- login sahifasida MIZAAM branding qo'yildi
- sidebar branding MIZAAMga moslandi
- Admin panel kodi soddalashtirildi
- Admin panelda kompaniya qo'shish, login-parol berish, status o'zgartirish va supportga javob berish qoldirildi
- Vercel uchun `vercel.json` qo'shildi
- backend bo'lmagan frontend deployda demo ma'lumotlar chiqishi uchun fallback yoqildi
- README Vercel deploy va backend cheklovlari bilan yangilandi

## Mavjud sahifalar va funksiyalar

Super admin:

- kompaniyalar ro'yxatini ko'rish
- kompaniya uchun HR login/parol yaratish
- HR panel linkini nusxalash
- kompaniyani faol/bloklangan qilish
- super admin login/parolini yangilash
- support ticketlarga javob berish

HR panel:

- Dashboard
- Xodimlar
- Davomat
- Vazifalar
- Kunlik hisobotlar
- Moliyaviy holat
- Analitika
- Chat
- Support
- Bildirishnomalar
- Qoidalar

Dashboard:

- jami xodimlar
- faol vazifalar
- bugun kelganlar
- kutilayotgan hisobotlar
- HR holati
- KPI grafiklari
- davomat trendi
- top xodimlar
- so'nggi faoliyat
- bugungi davomat jadvali

Xodimlar:

- xodim qo'shish
- ism, lavozim, maosh, KPI/bonus turi
- telefon, email, manzil, ta'lim
- karta raqami
- Telegram login/parol
- qidirish, filtr, saralash
- eksport

Davomat:

- kelganlar
- kechikkanlar
- kelmaganlar
- davomat foizi
- to'liq ro'yxat
- tahlil va tavsiyalar

Vazifalar:

- vazifa yaratish
- xodimga biriktirish
- muhimlik
- muddat
- bonus
- statusni yangilash

Kunlik hisobotlar:

- xodimlardan kelgan hisobotlar
- kutilmoqda, tasdiqlangan, rad etilgan statuslari
- tasdiqlash va rad etish

Moliya:

- kompaniya daromadi
- oylik fondi
- xarajatlar
- sof foyda
- oylik tarqatish hisoboti
- bonus/KPI/jarima tahlili

Analitika:

- umumiy jarimalar
- eng yaxshi xodim
- KPI taqsimoti
- davomat sifati
- xodimlar reytingi

Chat:

- HR va xodimlar o'rtasida ichki yozishma

Support:

- tizim ishlab chiquvchilariga support so'rovi yuborish
- super admindan javob olish

Bildirishnomalar:

- hozir yuborilishi kerak bo'lgan bildirishnomalar
- rejalashtirilgan bildirishnomalar

Qoidalar:

- kechikish jarimasi
- vazifa kechiktirish jarimasi
- KPI chegaralari
- erta tugatish bonusi
- ish vaqti
- ichki qoidalar matni

Telegram bot:

- xodim login/parol orqali botga ulanadi
- kelganini belgilaydi
- ketganini belgilaydi
- kunlik hisobot yuboradi
- vazifalarini ko'radi
- HR bilan chat qiladi

## Rejalashtirilgan kengaytmalar

CRM:

- lid kartochkalari
- sotuv voronkasi
- SLA nazorati
- dublikat lid nazorati
- g'olib bitimni KPI/bonusga bog'lash
- konversiya tahlili

Marketing:

- yangi lidga avtomatik salomlashish
- harakatsiz lid bo'yicha ichki eslatma
- bitim yopilganda mijozga tasdiq xabari
- segmentlangan broadcast

Xavfsizlik:

- RBAC ruxsatlar tizimi
- karta va bot parollarini shifrlab saqlash
- audit tarixi
- moliya sahifasini direktor/buxgalter rollari bilan cheklash

Premium modullar:

- Face ID orqali davomat
- anonim tashrif hisoblagichi
- video saqlamasdan yuz embeddingi asosida ishlash

Keyingi versiyalar:

- SOP kutubxonasi
- Kaizen takliflar tizimi
- sotuv suhbatlari tahlili
- ishga olishda fikrlash testi

## Production tavsiyalar

Vercel frontend deploydan keyin quyidagilar tavsiya qilinadi:

- backendni doimiy Node hostingga chiqarish
- data saqlashni JSON fayldan databasega ko'chirish
- auth token/session xavfsizligini kuchaytirish
- Telegram bot tokenini faqat environment variable orqali saqlash
- sensitive ma'lumotlarni shifrlash
- role-based access control qo'shish
- real production domen va HTTPS bilan webhook ulash
