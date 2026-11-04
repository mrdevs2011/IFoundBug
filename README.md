# 🐛 IFoundBug (IFB) — Apex Collaborative Bug Tracking Platform

> **"Find Bugs. Fix Faster. Ship Better Software."**

IFoundBug — dasturchilar, QA testerlar va loyiha yetakchilari uchun maxsus yaratilgan, ko'p loyihali, real vaqtda ishlaydigan va AI (Claude Code, Cursor, Codex) bilan to'liq integratsiya qilingan eng zamonaviy bug tracking platformasi.

---

## 🌟 Asosiy imkoniyatlar

1. **Tartibli bug tracking**:
   - Har bir bug noyob kod, jiddiylik darajasi, telemetriya va interaktiv qabul mezonlari bilan boshqariladi.

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

### 3. Supabase Database
Supabase Dashboard → SQL Editor ichida faqat `sql/IFOUNDBUG_UNIVERSAL.sql` faylini to‘liq ishga tushiring. U barcha jadvallar, RLS, triggerlar, RPC, Storage va Realtime sozlamalarini yaratadi. Demo/seed qatorlari yo‘q.

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
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker offline kesh
│   └── widget.js          # Tashqi saytlar uchun suzuvchi Report Bug vidjeti
├── sql/
│   ├── IFOUNDBUG_UNIVERSAL.sql
│   └── README.md
├── src/
│   ├── app/
│   │   ├── api/bugs/route.ts   # Bug qabul qilish API
│   │   ├── globals.css         # Tailwind v4 dizayn qoidalari
│   │   ├── layout.tsx          # PWA & meta sozlamalari
│   │   └── page.tsx            # Boshqaruv paneli, ro'yxat, statistika
│   ├── components/
│   │   ├── AIPromptModal.tsx   # Claude Code / Cursor prompt generatori
│   │   ├── BugDetailModal.tsx  # Bug tafsilotlari, qabul mezonlari, izohlar
│   │   ├── ImageAnnotator.tsx  # Brauzerda skrinshotga chizish & PII blur
│   │   ├── KanbanBoard.tsx     # Kanban ustunlari
│   │   ├── ReportBugModal.tsx  # Yangi bug kiritish & avto-telemetriya
│   │   ├── ShareInviteModal.tsx# Invite linklar va widget sozlamalari
│   │   └── icons.tsx           # Yengil SVG ikonalar to'plami
│   ├── lib/
│   │   └── supabase/client.ts  # Supabase klienti
│   └── types/
│       └── index.ts            # TypeScript interfeyslari
├── .env.example
├── .env.local
├── package.json
└── tsconfig.json
```


## MCP Server for AI agents

IFoundBug exposes an account-scoped MCP Streamable HTTP endpoint at `/api/mcp`. Open **Settings → MCP** to create a Bearer token, select granular scopes, set expiry and revoke tokens. Supported tools include account identity, project create/update/discovery, public-space discovery, bug search/read/create/update and activity history, comments, notifications, project-member lookup and role-limited invitation management. Private spaces require membership; public bug submissions require guest reports to be enabled.

Set `SUPABASE_SERVICE_ROLE_KEY` as a server-only Vercel environment variable and `NEXT_PUBLIC_APP_URL` to the canonical site origin. Never expose the service key or bearer token in client code, commits or public prompts. Run the complete `sql/IFOUNDBUG_UNIVERSAL.sql` in Supabase SQL Editor before using MCP.

## Data architecture

All application records (profiles, projects, bugs, comments, votes, audit events, invites and notifications) are read from and written to Supabase PostgreSQL. The browser does not cache or seed business records in localStorage, and there is no mock/demo dataset. PostgreSQL owns generated IDs, project slugs, bug codes, timestamps, reporter/comment authorship, status audit records and notifications. If the database is unavailable, the UI reports the database error instead of substituting local data. UI copy, visual styles and enum definitions remain application code; they are presentation/schema definitions, not user records.
