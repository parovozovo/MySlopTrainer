# MySlopTrainer — RPG To-Do & Self-Development System

Веб-додаток для управління задачами, звичками, самоконтролем та фокус-сесіями (Pomodoro) з RPG-механіками прокачки характеристик (`STR`, `INT`, `DEX`, `WIL`, `CHA`).

## Стек технологій
- **Next.js 15** (App Router) + **TypeScript**
- **Prisma ORM** + **SQLite**
- **Hallmark (`Console` theme)** + **Tailwind CSS**
- **Web Audio API** (процедурні звукові ефекти + генератор Brown Noise / 14Hz Binaural для глибокого фокусу)

## Швидкий старт

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Відкрийте `http://localhost:3000` у браузері.
