# 🐛 IFoundBug (IFB) — Apex Collaborative Bug Tracking Platform

> **"Stop Debugging in Telegram. Ship Flawless Software."**

IFoundBug — dasturchilar, QA testerlar va loyiha yetakchilari uchun maxsus yaratilgan, ko'p loyihali, real vaqtda ishlaydigan va AI (Claude Code, Cursor, Codex) bilan to'liq integratsiya qilingan eng zamonaviy bug tracking platformasi.

---

## 🌟 Asosiy Afzalliklari (Nima uchun Telegram va oddiy saytlardan 1,000,000 marta ustun?)

1. **Telegram Tartibsizligiga Chek Qo'yadi**:
   - Skrinshotlar va audiolarni guruhga pala-partish tashlash o'rniga: har bir bug o'zining noyob kodi (`B01`, `IFB-101`), jiddiylik darajasi (`CRITICAL (P0)`, `HIGH (P1)`), telemetriyasi va interaktiv qabul mezonlari bilan tizimlashtiriladi.
   - **Telegram Webhook Bot**: Yangi bug kiritilganda yoki holat o'zgarganda guruhga avtomatik tarzda chiroyli va qulay formatdagi kartochka yuboradi.

2. **Avtomatlashgan Qurilma & Telemetriya Tahlili**:
   - Bug yozilayotgan paytda foydalanuvchining **Operatsion tizimi (OS)**, **Brauzeri**, **Ekran o'lchami**, **Viewport kengligi** va tili avtomatik aniqlanadi va bug kartasiga biriktiriladi.

3. **In-Browser Screenshot Annotation Studio (Brauzerda Rasmga Chizish)**:
   - Skrinshotni yuklagandan so'ng dasturdan chiqmasdan turib: qizil to'rtburchaklar, strelkalar, matnlar chizish va **Maxfiy PII Blur** (telefon raqam va parollarni xiralashtirish) imkoniyati.

4. **AI Coding Fix Prompt Synthesizer**:
   - Har bir bug yoki butun sprint uchun 1 bosish bilan **Claude Code**, **Cursor**, **Copilot** yoki **Codex** ga to'g'ridan-to'g'ri tashlanadigan to'liq, mukammal tuzilgan prompt yaratadi yoki `.md` fayl qilib yuklab beradi.

5. **Tokenli Invite Havolalari va Ochiq/Yopiq Rejim**:
   - Har bir loyiha uchun alohida tokenli taklif linki (`/join?token=...`), a'zolarga rollar berish (`developer`, `qa_tester`, `viewer`).

6. **Embeddable Bug Reporter Widget**:
   - Istalgan tashqi sayt (React, Vue, WordPress yoki HTML) kodiga 1 qator skript qo'shish orqali suzuvchi "Report Bug" tugmasini chiqarish va buglarni IFoundBug'ga to'plash.

7. **Universal Moslashuvchanlik & PWA**:
   - Mobil, planshet va katta monitorlarda to'liq moslashuvchan.
   - PWA (Progressive Web App): offline rejim, tezkor keshlash, kompyuter va telefonga ilova sifatida o'rnatish.

8. **Vim / Linear Tezkor Tugmalar (Keyboard Shortcuts)**:
   - `/` — Qidiruv
   - `C` — Yangi bug qo'shish
   - `P` — Maxfiy rejim (PII Blur toggle)
   - `J` / `K` — Ro'yxat bo'ylab keyingi/oldingi bugga o'tish
   - `Enter` — Bugni ochish
   - `Esc` — Yopish

---

## 🛠 Texnologiyalar Staki
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (Cyberpunk OLED Dark & Minimal Light)
- **Backend & Realtime Database**: Supabase (PostgreSQL, Realtime, RLS Policies)
- **Deployment**: Vercel (Production-Ready)

---

## 🚀 O'rnatish va Ishga Tushirish

### 1. Loyihani yuklash va kutubxonalarni o'rnatish:
```bash
cd /home/muhamad/MR/ifoundbug
pnpm install # yoki npm install
```

### 2. Muhit o'zgaruvchilari (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3333
```

### 3. Supabase Migratsiyalari:
Supabase boshqaruv panelidagi **SQL Editor** ga kiring va `sql/` papkasidagi skriptlarni ketma-ket ishga tushiring:
1. `sql/001_initial_schema.sql` — Barcha jadvallar
2. `sql/002_row_level_security.sql` — RLS xavfsizlik siyosatlari
3. `sql/003_realtime_and_triggers.sql` — Realtime va triggerlar
4. `sql/004_seed_data.sql` — 22 ta haqiqiy Barbershop ilovasi buglari va demo loyihalar

### 4. Dasturni ishga tushirish:
```bash
npm run dev
# yoki
npm run build && npm run start
```
Brauzerda oching: `http://localhost:3333`

---

## 📂 Papkalar Tuzilishi
```text
ifoundbug/
├── public/
│   ├── evidence/          # Haqiqiy bug skrinshotlari (B01-01.jpg, ...)
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker offline kesh
│   └── widget.js          # Tashqi saytlar uchun suzuvchi Report Bug vidjeti
├── sql/
│   ├── 001_initial_schema.sql
│   ├── 002_row_level_security.sql
│   ├── 003_realtime_and_triggers.sql
│   ├── 004_seed_data.sql
│   └── README.md
├── src/
│   ├── app/
│   │   ├── api/bugs/route.ts   # Bug qabul qilish va Telegram webhook API
│   │   ├── globals.css         # Tailwind v4 dizayn qoidalari
│   │   ├── layout.tsx          # PWA & meta sozlamalari
│   │   └── page.tsx            # Boshqaruv paneli, ro'yxat, statistika
│   ├── components/
│   │   ├── AIPromptModal.tsx   # Claude Code / Cursor prompt generatori
│   │   ├── BugDetailModal.tsx  # Bug tafsilotlari, qabul mezonlari, izohlar
│   │   ├── ImageAnnotator.tsx  # Brauzerda skrinshotga chizish & PII blur
│   │   ├── KanbanBoard.tsx     # Kanban ustunlari
│   │   ├── ReportBugModal.tsx  # Yangi bug kiritish & avto-telemetriya
│   │   ├── ShareInviteModal.tsx# Invite linklar va Telegram sozlamalari
│   │   └── icons.tsx           # Yengil SVG ikonalar to'plami
│   ├── lib/
│   │   ├── mock-data.ts        # 22 ta haqiqiy bug va demo loyihalar
│   │   └── supabase/client.ts  # Supabase klienti
│   └── types/
│       └── index.ts            # TypeScript interfeyslari
├── .env.example
├── .env.local
├── package.json
└── tsconfig.json
```
