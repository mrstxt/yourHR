# yourHR Pro

Super admin, HR panel va Telegram bot integratsiyasi bor HR boshqaruv tizimi.

## Ishga tushirish

```bash
npm install
npm run build
npm start
```

Local URL: `http://localhost:3000`

## Loginlar

- Super admin: `admin / admin123`
- Demo HR: `demo-company / demo12345`

## Telegram bot

1. BotFather orqali bot yarating va token oling.
2. `.env.example` asosida env sozlang:

```bash
PORT=3000
PUBLIC_URL=https://your-domain.com
TELEGRAM_BOT_TOKEN=token
```

3. Server ishga tushgandan keyin webhook ulang:

```bash
curl -X POST https://your-domain.com/api/telegram/set-webhook
```

4. HR panelda xodim qo'shganda Telegram login/parol bering. Xodim botda `/start` bosadi, bot avval loginni, keyin parolni so'raydi.

```text
Login: bekzod
Parol: bekzod123
```

Xodim bot orqali:
- `✅ Keldim` bilan kelgan vaqtini saqlaydi
- `🏁 Ketdim` bilan ketgan vaqtini saqlaydi va kunlik hisobot so'raladi
- `📋 Mening vazifalarim` bilan vazifalarini ko'radi
- inline tugmalar bilan vazifa statusini yangilaydi
- `📝 Kunlik hisobot` bilan hisobot yuboradi
- `💬 HR bilan chat` orqali HR paneldagi chatga xabar yuboradi

## Deploy

Bu loyiha doimiy backend va Telegram webhook talab qiladi. Render, Railway, Fly.io yoki VPS tavsiya qilinadi.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Environment variables:

- `PORT`
- `PUBLIC_URL`
- `TELEGRAM_BOT_TOKEN`
