# IFoundBug — Egasi uchun to'liq qo'llanma

Oxirgi yangilanish: 2026-11-05. Bu hujjat loyiha egasi uchun yozilgan: ilova nima, qanday ishlaydi,
qanday boshqariladi va nima hali tayyor emas.

---

## 1. IFoundBug nima

IFoundBug (IFB) — dasturiy jamoalar uchun bug va issue kuzatish tizimi. Tashqi ko'rinishi GitHub Issues'ga
o'xshaydi, lekin u Git hosting emas: kod bu yerda saqlanmaydi, faqat buglar, muhokamalar va jamoa ishi.

Asosiy tushunchalar:

| Tushuncha | Ma'nosi |
|---|---|
| **Repository** (project) | Bitta ilova yoki xizmat uchun buglar to'plami. Public yoki private. |
| **Issue** (bug) | Bitta muammo. Kodi bor (masalan `BRB-12`), status, severity, priority, assignee. |
| **Organization** | Bir nechta repository va jamoani birlashtiradi. A'zolar barcha repo'larga avtomatik kiradi. |
| **Rol** | Kim nima qila olishini belgilaydi (pastda jadval). |
| **MCP / API token** | AI agentlar va boshqa dasturlar uchun kalit (`ifbm_...`). |
| **Integratsiya** | Telegram yoki webhook — voqealar haqida avtomatik xabar. |

---

## 2. Arxitektura (qisqa)

```
Brauzer / AI agent / boshqa dastur
        │
        ▼
Vercel (Next.js ilova)  ── https://i-found-bug.vercel.app
  ├─ Sahifalar (UI)
  ├─ /api/mcp        → AI agentlar (MCP protokoli)
  ├─ /api/v1/...     → REST API (xuddi shu tool'lar)
  ├─ /api/attachments, /api/upload, /api/profile/avatar, /api/telegram/chats
        │
        ▼
Supabase (loyiha: ynbiumxtfgcaezatxnbz)
  ├─ Postgres: jadvallar + RLS (kim nimani ko'ra oladi — bazaning o'zida)
  ├─ Auth: login/parol (username → ichki email)
  ├─ Storage: bug-attachments (private), avatars (public)
  ├─ Realtime: sahifalar o'zi yangilanadi
  └─ pg_net: Telegram/webhook xabarlarini bazaning o'zi yuboradi
        │
        ▼
GitHub: mrdevs2011/IFoundBug (main) → har push'da Vercel avtomatik deploy qiladi
```

Muhim tamoyil: **xavfsizlik bazada**. Brauzer to'g'ridan-to'g'ri Supabase bilan gaplashadi, lekin
RLS va himoyalangan funksiyalar har bir so'rovni tekshiradi. Server tomonidagi MCP/API esa
`service_role` kaliti bilan ishlaydi va ruxsatlarni kodda va bazadagi funksiyalarda alohida tekshiradi.

---

## 3. Rollar va ruxsatlar

### Repository rollari
| Rol | Ko'rish | Bug yozish | Status/severity/assign | Kommentlar | A'zolar/sozlamalar |
|---|---|---|---|---|---|
| owner | ✅ | ✅ | ✅ | ✅ (+ichki) | ✅ (hammasi) |
| admin | ✅ | ✅ | ✅ | ✅ (+ichki) | ✅ (admin bera olmaydi) |
| developer, qa_tester, team_lead, product_manager | ✅ | ✅ | ✅ | ✅ (+ichki) | ❌ |
| hunter, viewer | ✅ | ✅ | ❌ | ✅ | ❌ |

- **Private repo**: faqat a'zolar ko'radi.
- **Public repo**: login qilgan hamma o'qiy oladi; begonalar faqat "guest reports" yoqilgan bo'lsa bug yoza oladi.
- **Private link** bilan yashirilgan bug ro'yxatlarda ko'rinmaydi, faqat havola orqali ochiladi.
- **Developer notes** va **ichki kommentlar** faqat jamoaga ko'rinadi va hech qachon Telegram/webhook'ga ketmaydi.

### Organization rollari
| Org roli | Repo'larda beriladigan rol |
|---|---|
| owner | admin (+ tashkilotni o'chira oladi) |
| admin | admin |
| member | developer |

Qo'lda berilgan repo roli har doim ustun (org uni o'zgartirmaydi). Oxirgi owner'ni olib tashlab bo'lmaydi.

---

## 4. Har kungi foydalanish (web)

1. **Kirish**: `Sign up` → username + parol (kamida 8 belgi).
2. **Repository**: `+` menyu → *New repository*.
3. **Jamoa**: repo → *People* → taklif havolasi (rol tanlanadi) → havolani yuboring.
4. **Bug yozish**: *New issue* → sarlavha, qadamlar, natija/kutilgan natija, screenshot.
5. **Qidiruv**: `/` tugmasi. Masalan: `login status:in_progress assignee:me severity:high created:>2026-11-01`.
6. **Issue sahifasi**: komment, *Close issue / Reopen*, o'ngda status/severity, AI prompt, Markdown nusxa.
7. **Insights** tab: ochiq/yopiq, o'rtacha va median yopilish vaqti, haftalik grafik, kim nechta ishda.
8. **Settings** tab (owner/admin): Telegram va webhook integratsiyalari.
9. **Profil**: avatar → *Your profile* → rasm va ism.
10. **Tashkilotlar**: avatar menyu → *Your organizations*.
11. **Telefon/kompyuterga o'rnatish**: Chrome/Edge'da manzil satridagi o'rnatish belgisi yoki brauzer menyusi → *Install IFoundBug*; Android Chrome: menyu → *Add to Home screen*; iPhone Safari: Share → *Add to Home Screen*. Yangi versiya chiqsa pastda "Reload" taklifi chiqadi.

Status oqimi: `REPORTED (Open) → TRIAGED → IN_PROGRESS → READY_FOR_QA → VERIFIED → FIXED → CLOSED`
(yoki `WONT_FIX`). Oxirgi to'rttasi "yopilgan" hisoblanadi.

---

## 5. Telegram'ga ulash (qadam-baqadam)

1. Telegram'da **@BotFather** → `/newbot` → nom va username bering → **token**ni nusxalang
   (`123456789:AA...` ko'rinishida). Token — parol kabi, hech kimga bermang.
2. Botni jamoa guruhingizga qo'shing (yoki botni ochib *Start* bosing) va u yerda **istalgan xabar yozing**
   (bu bot chatni "ko'rishi" uchun kerak).
3. IFB → repository → **Settings** → **Add Telegram**.
4. Tokenni joylang → **Find chats** → ro'yxatdan guruhni tanlang.
5. Qaysi voqealar kelishini belgilang: yangi issue, status o'zgarishi, tayinlash, yangi komment.
6. **Connect Telegram** → guruhga "✅ IFoundBug is connected" xabari keladi.

Holatni tekshirish: Settings ro'yxatida har integratsiya yonida oxirgi 5 yuborish nuqtasi bor:
🟢 yetkazildi · 🔴 xato (ustiga olib boring — sababi chiqadi) · ⚪ kutilmoqda. *Send test* qayta sinaydi.

Ko'p uchraydigan muammolar:
- "No chats found" → guruhga botni qo'shib, u yerda xabar yozing va qayta *Find chats*.
- Guruhda bot xabar yubormasa → @BotFather → `/setprivacy` → *Disable* (yoki botni admin qiling).
- 🔴 `403 bot was kicked` → bot guruhdan chiqarilgan, qayta qo'shing.

Har repo uchun alohida Telegram ulash mumkin (masalan har jamoa o'z guruhiga). Bir repo'da 10 tagacha integratsiya.

---

## 6. Webhook (o'z serveringizga)

Settings → **Add webhook** → `https://...` manzil. IFB har voqeada JSON `POST` yuboradi:

```json
{ "id": "<delivery id>", "event": "issue.created", "created_at": "...",
  "data": { "repository": {...}, "issue": { "code": "BRB-12", "title": "...", "status": "...", "url": "..." } } }
```

Sarlavhalar: `X-IFB-Event`, `X-IFB-Delivery`, `X-IFB-Signature: sha256=<HMAC-SHA256(secret, body)>`.
Secret faqat yaratilganda **bir marta** ko'rsatiladi. Imzoni tekshirish (Node.js):

```js
const crypto = require('crypto');
const ok = req.headers['x-ifb-signature'] === 'sha256=' +
  crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
```

Voqealar: `issue.created`, `issue.status_changed`, `issue.assigned`, `comment.created`, test uchun `ping`.
Xavfsizlik: faqat `https://`, ichki manzillar (localhost, IP, supabase) rad etiladi.

---

## 7. AI agentlar (Claude va boshqalar) — MCP

1. Token: avatar → *MCP settings* → token yarating, kerakli scope'larni belgilang. Token bir marta ko'rsatiladi.
2. Claude Code'ga ulash:
   ```
   claude mcp add --transport http ifb https://i-found-bug.vercel.app/api/mcp --header "Authorization: Bearer ifbm_TOKEN"
   ```
3. AI'ga oddiy tilda ayting. AI avval `ifb_help` ni o'qiydi (to'liq qo'llanma bazada).

| Siz aytasiz | AI ishlatadi |
|---|---|
| "Ilovadan buglarni top va Barbershop repo'ga qo'sh" | `create_bugs` (takrorlarni o'tkazib yuboradi) |
| "Oxirgi 24 soatda nima keldi?" | `whats_new` |
| "BRB-12 ni In progress qil, menga biriktir" | `update_bug` |
| "Hamma reported'larni triage qil" | `search_bugs` + `bulk_update_bugs` (avval tasdiq so'raydi) |
| "Loyiha qanday ketyapti?" | `get_insights` |
| "Screenshotni qo'sh" | GitHub repo'ga push + `import_github_images` |

Cheklovlar: token boshiga 1 daqiqada 120 so'rov; har bir chaqiruv audit jurnaliga yoziladi.

---

## 8. REST API

Xuddi shu token va ruxsatlar bilan: `GET https://i-found-bug.vercel.app/api/v1` — barcha endpoint'lar ro'yxati.

```bash
curl -H "Authorization: Bearer ifbm_TOKEN" https://i-found-bug.vercel.app/api/v1/repos
curl -H "Authorization: Bearer ifbm_TOKEN" "https://i-found-bug.vercel.app/api/v1/inbox?since=24h"
curl -X POST -H "Authorization: Bearer ifbm_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Checkout crashes","severity":"HIGH"}' \
  https://i-found-bug.vercel.app/api/v1/repos/barbershop/issues
curl -X PATCH -H "Authorization: Bearer ifbm_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS","assigned_to":"me"}' https://i-found-bug.vercel.app/api/v1/issues/BRB-12
```

Xatolar: `{ "error": "..." }` va 400/401/403/404/429 kodlari.

---

## 9. Texnik boshqaruv (owner uchun)

### Joylar
| Narsa | Qayerda |
|---|---|
| Kod | GitHub `mrdevs2011/IFoundBug`, branch `main` |
| Deploy | Vercel `mrdev1/i-found-bug` — `main` ga push = production deploy |
| Baza | Supabase `ynbiumxtfgcaezatxnbz` (ap-southeast-1) |
| Migratsiyalar | `sql/` papkasi, tartibi `sql/README.md` da |

### Vercel muhit o'zgaruvchilari
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`,
`SUPABASE_SERVICE_ROLE_KEY` (maxfiy!), ixtiyoriy `GITHUB_TOKEN` (private GitHub rasm importi uchun).

### Lokal ishga tushirish
```bash
npm install
cp .env.example .env.local   # qiymatlarni to'ldiring
npm run dev                  # http://localhost:3000
npm test && npx tsc --noEmit && npx eslint . && npm run build
```

### Bazaga migratsiya qo'llash
```bash
supabase link --project-ref ynbiumxtfgcaezatxnbz
supabase db query --linked -f sql/VX_....sql
```
Har doim avval Supabase Dashboard → Database → Backups'dan zaxira borligini tekshiring.

### Domen o'zgarsa
1. Vercel'da `NEXT_PUBLIC_APP_URL` ni yangilang.
2. Bazada `public.ifb_app_url()` funksiyasini yangi domen bilan qayta yarating (Telegram havolalari uchun).

### Muammolar
| Belgi | Sabab / yechim |
|---|---|
| Login'da "Cannot reach the server" | Internet/VPN/DNS. Supabase ishlayotganini tekshiring: `/auth/v1/health`. |
| Sahifa eski ko'rinadi | "A new version is available → Reload" chiqadi; bo'lmasa Ctrl+Shift+R. |
| MCP "Permission denied: missing X" | Token'da X scope yo'q — yangi token yarating. |
| Telegram jim | Settings'dagi 🔴 nuqta sababini ko'rsatadi. |

---

## 10. 2026-11-05 da topilgan va tuzatilgan xavfsizlik muammolari

1. Login qilgan istalgan foydalanuvchi **istalgan** bug statusini o'zgartira olardi → tuzatildi (V5).
2. Acceptance criteria'ni ham begona o'zgartira olardi → tuzatildi (V5).
3. Storage siyosati barcha bug rasmlarini (private'lar ham) anonim yuklab olishga ruxsat berardi → yopildi (V4).
4. "Sensitive" belgili buglar ko'rinardi; reaksiya/ko'rishlar yashirin buglarda ishlardi → tuzatildi (V5).
5. MCP orqali private repo'ga a'zo bo'lmagan token kira olardi → tuzatildi.

---

## 11. Hali tayyor emas / tekshirilmagan (halol ro'yxat)

- **Production'da haqiqiy login bilan to'liq sinov**: men production'ga test token/akkaunt yarata olmadim
  (ruxsat cheklovi). Har yangi funksiyani o'zingiz bir marta sinab ko'ring: profil rasmi, Insights,
  Telegram ulash, tashkilot yaratish, MCP token bilan `whats_new`.
- **Telegram haqiqiy botga yuborish**: `pg_net` orqali tashqi HTTP yuborish production'da tasdiqlangan,
  lekin haqiqiy bot bilan sinalmagan.
- **Webhook qayta urinish**: muvaffaqiyatsiz yuborish qayta urinilmaydi (faqat jurnalda ko'rinadi, *Send test* bor).
- **Light mode**: hozircha faqat qorong'i rejim.
- **Anonim tashrifchi public repo'ni ko'ra olmaydi** (login talab qilinadi).
- **E2E (brauzer) avtomatik testlari** yo'q; 32 ta unit/statik test bor.
- **Web push** bildirishnomalar yo'q (o'rniga Telegram).
- Label, milestone, kanban, sub-issue — keyingi bosqich.
