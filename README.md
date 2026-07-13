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
