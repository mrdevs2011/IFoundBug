import { Project, Bug, BugComment } from "@/types";

export const INITIAL_PROJECTS: Project[] = [
  {
    "id": "b0000000-0000-0000-0000-000000000001",
    "name": "Barbershop Mobile App",
    "slug": "barbershop",
    "description": "Professional hair salon & barbershop booking mobile application for Android & iOS.",
    "icon": "scissors",
    "color": "#10b981",
    "is_public": true,
    "allow_guest_reports": true,
    "tech_stack": [
      "React Native",
      "Expo",
      "TypeScript",
      "Supabase"
    ],
    "github_repo_url": "https://github.com/mrdevs2011/bor1BUGS",
    "created_at": "2026-11-04T09:24:58.065Z"
  },
  {
    "id": "b0000000-0000-0000-0000-000000000002",
    "name": "IFoundBug Platform",
    "slug": "ifoundbug",
    "description": "Next-gen bug tracking and collaborative debugging platform for developers.",
    "icon": "bug",
    "color": "#6366f1",
    "is_public": true,
    "allow_guest_reports": true,
    "tech_stack": [
      "Next.js",
      "TailwindCSS",
      "Supabase Realtime"
    ],
    "github_repo_url": "https://github.com/mrdevs2011/ifoundbug",
    "created_at": "2026-11-04T09:24:58.065Z"
  }
];

export const INITIAL_BUGS: Bug[] = [
  {
    "id": "bug-b01",
    "code": "B01",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Pastki panel (bottom bar) oʻzbekcha emas",
    "summary": "Oʻzbek tili tanlangan, lekin pastki panelda Home, Explore, Message, Account yozuvlari turibdi.",
    "section": "lokalizatsiya",
    "screen": "Barcha asosiy ekranlar — pastki navigatsiya",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "FIXED",
    "environment": "PRODUCTION",
    "actual_behavior": "Oʻzbek tili tanlangan, lekin pastki panelda Home, Explore, Message, Account yozuvlari turibdi.",
    "expected_behavior": "Uy, Qidirish, Xabarlar, Hisob. (Chatda 'Habarlar' deb yozilgan — adabiy imlo 'Xabarlar'.)",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: Uy / Qidirish / Xabarlar / Hisob",
        "checked": true
      },
      {
        "id": "ac-1",
        "text": "en: Home / Explore / Messages / Account",
        "checked": true
      },
      {
        "id": "ac-2",
        "text": "ru: Главная / Поиск / Сообщения / Профиль",
        "checked": true
      },
      {
        "id": "ac-3",
        "text": "Til oʻzgarganda ilovani qayta ishga tushirmasdan yozuvlar yangilanadi",
        "checked": true
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Tab nomlarini i18n kalitlariga oʻtkazing: `nav.home`, `nav.explore`, `nav.messages`, `nav.account`. Til almashganda navigator qayta render boʻlsin (tab label’lari koʻpincha navigator yaratilganda bir marta hisoblanadi — `tabBarLabel` ni funksiya qilib bering).\n\nDev Steps:\n1. Tab navigator konfiguratsiyasidan qattiq yozilgan 'Home', 'Explore', 'Message', 'Account' satrlarini toping\n2. Ularni `t('nav.home')` kabi chaqiruvlar bilan almashtiring, label’ni til holatiga bogʻlang\n3. uz/en/ru lugʻatlariga kalitlarni qoʻshing",
    "search_keys": [
      "Home",
      "Explore",
      "Message",
      "Account",
      "tabBarLabel",
      "BottomTab"
    ],
    "evidence_urls": [
      "/evidence/B01-01.jpg",
      "/evidence/B09-01.jpg",
      "/evidence/B04-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 6,
    "reproduced_count": 2,
    "views_count": 101,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B01] Pastki panel (bottom bar) oʻzbekcha emas\n\n**Ekran:** Barcha asosiy ekranlar — pastki navigatsiya\n**Jiddiylik:** Oʻrta\n\n### Muammo\nOʻzbek tili tanlangan, lekin pastki panelda Home, Explore, Message, Account yozuvlari turibdi.\n\n### Kutilgan natija\nUy, Qidirish, Xabarlar, Hisob. (Chatda 'Habarlar' deb yozilgan — adabiy imlo 'Xabarlar'.)\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B01-01.jpg (1000010904.jpg), B09-01.jpg (1000010910.jpg), B04-01.jpg (1000010905.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Home`, `Explore`, `Message`, `Account`, `tabBarLabel`, `BottomTab`).\n2. Tab navigator konfiguratsiyasidan qattiq yozilgan 'Home', 'Explore', 'Message', 'Account' satrlarini toping\n3. Ularni `t('nav.home')` kabi chaqiruvlar bilan almashtiring, label’ni til holatiga bogʻlang\n4. uz/en/ru lugʻatlariga kalitlarni qoʻshing\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nTab nomlarini i18n kalitlariga oʻtkazing: `nav.home`, `nav.explore`, `nav.messages`, `nav.account`. Til almashganda navigator qayta render boʻlsin (tab label’lari koʻpincha navigator yaratilganda bir marta hisoblanadi — `tabBarLabel` ni funksiya qilib bering).\n\n### Qabul mezonlari\n- [ ] uz: Uy / Qidirish / Xabarlar / Hisob\n- [ ] en: Home / Explore / Messages / Account\n- [ ] ru: Главная / Поиск / Сообщения / Профиль\n- [ ] Til oʻzgarganda ilovani qayta ishga tushirmasdan yozuvlar yangilanadi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-10-31T17:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b02",
    "code": "B02",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Splash ekranda 'design by addbrain' yozuvi",
    "summary": "Splash ekranda 'design by addbrain' yozuvi chiqadi.",
    "section": "mahsulot",
    "screen": "Splash (yuklanish ekrani)",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Splash ekranda 'design by addbrain' yozuvi chiqadi.",
    "expected_behavior": "Yozuv butunlay olib tashlansin; logotip markazda qoladi, boʻsh joy qolmaydi.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Splash’da 'addbrain' soʻzi umuman yoʻq",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Native va JS splash ikkalasida ham",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Logotip joyi siljimagan, ortiqcha boʻsh joy yoʻq",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Splash komponentidan matn/rasmni oʻchiring. Native splash (Android `launch_background`, iOS LaunchScreen) va JS splash — ikkalasini ham tekshiring.\n\nDev Steps:\n1. Loyihada 'addbrain' soʻzini qidiring (kod, rasm nomlari, native resurslar)\n2. Topilgan matn/rasmni olib tashlang\n3. Logotip vertikal markazda qolishini tekshiring",
    "search_keys": [
      "addbrain",
      "design by",
      "Splash",
      "LaunchScreen",
      "launch_background"
    ],
    "evidence_urls": [],
    "is_sensitive": true,
    "upvotes_count": 10,
    "reproduced_count": 7,
    "views_count": 93,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B02] Splash ekranda 'design by addbrain' yozuvi\n\n**Ekran:** Splash (yuklanish ekrani)\n**Jiddiylik:** Past\n\n### Muammo\nSplash ekranda 'design by addbrain' yozuvi chiqadi.\n\n### Kutilgan natija\nYozuv butunlay olib tashlansin; logotip markazda qoladi, boʻsh joy qolmaydi.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: Dalil skrinshoti hali qoʻshilmagan — muammo test qiluvchining yozma xabari asosida.\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `addbrain`, `design by`, `Splash`, `LaunchScreen`, `launch_background`).\n2. Loyihada 'addbrain' soʻzini qidiring (kod, rasm nomlari, native resurslar)\n3. Topilgan matn/rasmni olib tashlang\n4. Logotip vertikal markazda qolishini tekshiring\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nSplash komponentidan matn/rasmni oʻchiring. Native splash (Android `launch_background`, iOS LaunchScreen) va JS splash — ikkalasini ham tekshiring.\n\n### Qabul mezonlari\n- [ ] Splash’da 'addbrain' soʻzi umuman yoʻq\n- [ ] Native va JS splash ikkalasida ham\n- [ ] Logotip joyi siljimagan, ortiqcha boʻsh joy yoʻq\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-10-31T21:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b03",
    "code": "B03",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Uchrashuvlar sahifasi boshqa sahifalardek ochilmaydi, orqaga surish Uy’ga olib ketadi",
    "summary": "Sahifa boshqa ichki sahifalardan farqli ochiladi. Ekran chetidan surib orqaga qaytilganda Hisob emas, Uy sahifasiga qaytadi. Header’da ← yoʻq.",
    "section": "navigatsiya",
    "screen": "Hisob → Uchrashuvlar",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Sahifa boshqa ichki sahifalardan farqli ochiladi. Ekran chetidan surib orqaga qaytilganda Hisob emas, Uy sahifasiga qaytadi. Header’da ← yoʻq.",
    "expected_behavior": "Boshqa sahifalar kabi stack navigatsiya: swipe-back → Hisob; header chap tomonida ← (chevron-left).",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Hisob → Uchrashuvlar → swipe-back → Hisob",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Header’da ← bor va bosilganda Hisob’ga qaytaradi",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Android tizim 'Orqaga' tugmasi ham Hisob’ga qaytaradi",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Uchrashuvlar ehtimol tab’ga `jumpTo`/`navigate(tab)` orqali ochilmoqda. Uni Hisob stack’iga `push` qiling. Umumiy `PageHeader` da `showBack` standart yoqilgan boʻlsin.\n\nDev Steps:\n1. Hisob ekranidagi Uchrashuvlar qatorining onPress handler’ini toping\n2. Tab almashtirish oʻrniga Hisob stack’iga push qiling\n3. Header’ga umumiy back tugmasini qoʻshing",
    "search_keys": [
      "Uchrashuvlar",
      "Appointments",
      "navigate(",
      "jumpTo",
      "PageHeader",
      "showBack"
    ],
    "evidence_urls": [],
    "is_sensitive": true,
    "upvotes_count": 7,
    "reproduced_count": 5,
    "views_count": 77,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B03] Uchrashuvlar sahifasi boshqa sahifalardek ochilmaydi, orqaga surish Uy’ga olib ketadi\n\n**Ekran:** Hisob → Uchrashuvlar\n**Jiddiylik:** Kritik\n\n### Muammo\nSahifa boshqa ichki sahifalardan farqli ochiladi. Ekran chetidan surib orqaga qaytilganda Hisob emas, Uy sahifasiga qaytadi. Header’da ← yoʻq.\n\n### Kutilgan natija\nBoshqa sahifalar kabi stack navigatsiya: swipe-back → Hisob; header chap tomonida ← (chevron-left).\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: Dalil skrinshoti hali qoʻshilmagan — muammo test qiluvchining yozma xabari asosida.\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Uchrashuvlar`, `Appointments`, `navigate(`, `jumpTo`, `PageHeader`, `showBack`).\n2. Hisob ekranidagi Uchrashuvlar qatorining onPress handler’ini toping\n3. Tab almashtirish oʻrniga Hisob stack’iga push qiling\n4. Header’ga umumiy back tugmasini qoʻshing\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nUchrashuvlar ehtimol tab’ga `jumpTo`/`navigate(tab)` orqali ochilmoqda. Uni Hisob stack’iga `push` qiling. Umumiy `PageHeader` da `showBack` standart yoqilgan boʻlsin.\n\n### Qabul mezonlari\n- [ ] Hisob → Uchrashuvlar → swipe-back → Hisob\n- [ ] Header’da ← bor va bosilganda Hisob’ga qaytaradi\n- [ ] Android tizim 'Orqaga' tugmasi ham Hisob’ga qaytaradi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-01T01:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b04",
    "code": "B04",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Hisob sahifasi juda uzun — Sozlamalar va Yordam alohida sahifaga",
    "summary": "Profil, tashriflar, toʻlov, sozlamalar, yordam, chiqish va hisobni oʻchirish — hammasi bitta uzun sahifada.",
    "section": "navigatsiya",
    "screen": "Hisob",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "IN_PROGRESS",
    "environment": "PRODUCTION",
    "actual_behavior": "Profil, tashriflar, toʻlov, sozlamalar, yordam, chiqish va hisobni oʻchirish — hammasi bitta uzun sahifada.",
    "expected_behavior": "Hisob: Profil, Uchrashuvlar, Saqlangan, Toʻlov, Sozlamalar (qator), Yordam (qator), Chiqish. Sozlamalar sahifasi: Bildirishnomalar, Tashqi koʻrinish, Til, Hisobni oʻchirish. Yordam sahifasi: FAQ, Foydalanish shartlari, Maxfiylik siyosati, Haqida. Yangi sahifalarda ←.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Hisob’da 7 tadan ortiq qator yoʻq",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Sozlamalar va Yordam alohida ekran, ← bilan",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Hamma eski funksiyalar yangi joyda ishlaydi",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Ikki yangi stack ekran yarating (`SettingsScreen`, `HelpScreen`) va mavjud qatorlarni ularga koʻchiring. Hisobni oʻchirish Sozlamalar ichida boʻlsin (xavfli amal — pastda, qizil).\n\nDev Steps:\n1. Hisob ekranidagi SOZLAMALAR va QOʻLLAB-QUVVATLASH guruhlarini alohida ekranlarga koʻchiring\n2. Hisob’da ularning oʻrniga ikkita navigatsion qator qoldiring\n3. Yangi ekranlar header’ida ← boʻlsin (B03 bilan bir xil komponent)",
    "search_keys": [
      "SOZLAMALAR",
      "QO'LLAB-QUVVATLASH",
      "Hisobni o'chirish",
      "AccountScreen",
      "ProfileScreen"
    ],
    "evidence_urls": [
      "/evidence/B04-01.jpg",
      "/evidence/B09-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 6,
    "reproduced_count": 6,
    "views_count": 32,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B04] Hisob sahifasi juda uzun — Sozlamalar va Yordam alohida sahifaga\n\n**Ekran:** Hisob\n**Jiddiylik:** Oʻrta\n\n### Muammo\nProfil, tashriflar, toʻlov, sozlamalar, yordam, chiqish va hisobni oʻchirish — hammasi bitta uzun sahifada.\n\n### Kutilgan natija\nHisob: Profil, Uchrashuvlar, Saqlangan, Toʻlov, Sozlamalar (qator), Yordam (qator), Chiqish. Sozlamalar sahifasi: Bildirishnomalar, Tashqi koʻrinish, Til, Hisobni oʻchirish. Yordam sahifasi: FAQ, Foydalanish shartlari, Maxfiylik siyosati, Haqida. Yangi sahifalarda ←.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B04-01.jpg (1000010905.jpg), B09-01.jpg (1000010910.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `SOZLAMALAR`, `QO'LLAB-QUVVATLASH`, `Hisobni o'chirish`, `AccountScreen`, `ProfileScreen`).\n2. Hisob ekranidagi SOZLAMALAR va QOʻLLAB-QUVVATLASH guruhlarini alohida ekranlarga koʻchiring\n3. Hisob’da ularning oʻrniga ikkita navigatsion qator qoldiring\n4. Yangi ekranlar header’ida ← boʻlsin (B03 bilan bir xil komponent)\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nIkki yangi stack ekran yarating (`SettingsScreen`, `HelpScreen`) va mavjud qatorlarni ularga koʻchiring. Hisobni oʻchirish Sozlamalar ichida boʻlsin (xavfli amal — pastda, qizil).\n\n### Qabul mezonlari\n- [ ] Hisob’da 7 tadan ortiq qator yoʻq\n- [ ] Sozlamalar va Yordam alohida ekran, ← bilan\n- [ ] Hamma eski funksiyalar yangi joyda ishlaydi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-01T05:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b05",
    "code": "B05",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Filtr oynasida inglizcha yozuvlar",
    "summary": "Xizmat chip’lari Hair, Beard, Extras; masofa chip’lari Within 1 km … Within 10 km — inglizcha. Qoʻshimcha: 'Mirzo Ulugbek' apostrofsiz.",
    "section": "lokalizatsiya",
    "screen": "Qidirish → Filtr",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Xizmat chip’lari Hair, Beard, Extras; masofa chip’lari Within 1 km … Within 10 km — inglizcha. Qoʻshimcha: 'Mirzo Ulugbek' apostrofsiz.",
    "expected_behavior": "Xizmat: Soch, Soqol, Qoʻshimcha. Masofa: 1 km gacha, 3 km gacha, 5 km gacha, 10 km gacha.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: Soch / Soqol / Qoʻshimcha",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "uz: 1 km gacha … 10 km gacha",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "en va ru da ham toʻgʻri",
        "checked": false
      },
      {
        "id": "ac-3",
        "text": "'Qoʻllash' tugmasida apostrof boʻshligʻi yoʻq (B14)",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Masofa uchun parametrli kalit: `filter.within` = \"{{km}} km gacha\" (uz), \"Within {{km}} km\" (en), \"В пределах {{km}} км\" (ru). Kategoriya nomlari B06 dagi bilan bir xil manbadan olinsin.\n\nDev Steps:\n1. Filtr komponentidagi qattiq yozilgan chip matnlarini toping\n2. Kategoriyalarni umumiy kategoriya tarjimasiga, masofani `filter.within` ga ulang\n3. Tuman nomlarini ham tekshiring (B22)",
    "search_keys": [
      "Within",
      "Hair",
      "Beard",
      "Extras",
      "Filtr",
      "FilterSheet"
    ],
    "evidence_urls": [
      "/evidence/B05-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 11,
    "reproduced_count": 1,
    "views_count": 104,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B05] Filtr oynasida inglizcha yozuvlar\n\n**Ekran:** Qidirish → Filtr\n**Jiddiylik:** Oʻrta\n\n### Muammo\nXizmat chip’lari Hair, Beard, Extras; masofa chip’lari Within 1 km … Within 10 km — inglizcha. Qoʻshimcha: 'Mirzo Ulugbek' apostrofsiz.\n\n### Kutilgan natija\nXizmat: Soch, Soqol, Qoʻshimcha. Masofa: 1 km gacha, 3 km gacha, 5 km gacha, 10 km gacha.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B05-01.jpg (1000010907.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Within`, `Hair`, `Beard`, `Extras`, `Filtr`, `FilterSheet`).\n2. Filtr komponentidagi qattiq yozilgan chip matnlarini toping\n3. Kategoriyalarni umumiy kategoriya tarjimasiga, masofani `filter.within` ga ulang\n4. Tuman nomlarini ham tekshiring (B22)\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nMasofa uchun parametrli kalit: `filter.within` = \"{{km}} km gacha\" (uz), \"Within {{km}} km\" (en), \"В пределах {{km}} км\" (ru). Kategoriya nomlari B06 dagi bilan bir xil manbadan olinsin.\n\n### Qabul mezonlari\n- [ ] uz: Soch / Soqol / Qoʻshimcha\n- [ ] uz: 1 km gacha … 10 km gacha\n- [ ] en va ru da ham toʻgʻri\n- [ ] 'Qoʻllash' tugmasida apostrof boʻshligʻi yoʻq (B14)\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-01T09:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b06",
    "code": "B06",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Xizmat tanlash (1/3 qadam) ingliz tilida qolgan",
    "summary": "'Step 1 of 3 · Service', kategoriyalar Hair/Beard/Extras, xizmatlar Classic Haircut, Beard Trim, Hair Wash, Styling — inglizcha.",
    "section": "lokalizatsiya",
    "screen": "Band qilish → 1-qadam",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "FIXED",
    "environment": "PRODUCTION",
    "actual_behavior": "'Step 1 of 3 · Service', kategoriyalar Hair/Beard/Extras, xizmatlar Classic Haircut, Beard Trim, Hair Wash, Styling — inglizcha.",
    "expected_behavior": "'1/3 qadam · Xizmat'; Soch, Soqol, Qoʻshimcha; Klassik soch olish, Soqol tarash, Soch yuvish, Soch turmaklash (brief taklifi: 'Ukladka' — ruscha oʻzlashma, adabiy variant tavsiya etiladi).",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz tanlanganda 1-qadamda inglizcha soʻz qolmaydi",
        "checked": true
      },
      {
        "id": "ac-1",
        "text": "Bazada har xizmatga uz/en/ru nom",
        "checked": true
      },
      {
        "id": "ac-2",
        "text": "Tarjima yoʻq boʻlsa en ga fallback, boʻsh joy chiqmaydi",
        "checked": true
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Xizmat nomlari bazada: `service_translations(service_id, lang, name)` jadvali; API `Accept-Language` yoki `?lang=` boʻyicha tarjimani qaytarsin, tarjima yoʻq boʻlsa `en` ga fallback. 'Step X of Y' — kodda: `booking.step` = \"{{n}}/{{total}} qadam\".\n\nDev Steps:\n1. Stepper komponentidagi 'Step', 'of', 'Service', 'Time', 'Confirm' satrlarini i18n ga oʻtkazing (B18, B19 bilan bir yoʻla)\n2. Bazaga `service_translations` va `service_category_translations` qoʻshing, mavjud nomlarni migratsiya qiling\n3. API javobida til boʻyicha nom qaytaring",
    "search_keys": [
      "Step",
      "of 3",
      "Service",
      "Classic Haircut",
      "Beard Trim",
      "service_translations"
    ],
    "evidence_urls": [
      "/evidence/B06-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 11,
    "reproduced_count": 1,
    "views_count": 83,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B06] Xizmat tanlash (1/3 qadam) ingliz tilida qolgan\n\n**Ekran:** Band qilish → 1-qadam\n**Jiddiylik:** Kritik\n\n### Muammo\n'Step 1 of 3 · Service', kategoriyalar Hair/Beard/Extras, xizmatlar Classic Haircut, Beard Trim, Hair Wash, Styling — inglizcha.\n\n### Kutilgan natija\n'1/3 qadam · Xizmat'; Soch, Soqol, Qoʻshimcha; Klassik soch olish, Soqol tarash, Soch yuvish, Soch turmaklash (brief taklifi: 'Ukladka' — ruscha oʻzlashma, adabiy variant tavsiya etiladi).\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B06-01.jpg (1000010908.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Step`, `of 3`, `Service`, `Classic Haircut`, `Beard Trim`, `service_translations`).\n2. Stepper komponentidagi 'Step', 'of', 'Service', 'Time', 'Confirm' satrlarini i18n ga oʻtkazing (B18, B19 bilan bir yoʻla)\n3. Bazaga `service_translations` va `service_category_translations` qoʻshing, mavjud nomlarni migratsiya qiling\n4. API javobida til boʻyicha nom qaytaring\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nXizmat nomlari bazada: `service_translations(service_id, lang, name)` jadvali; API `Accept-Language` yoki `?lang=` boʻyicha tarjimani qaytarsin, tarjima yoʻq boʻlsa `en` ga fallback. 'Step X of Y' — kodda: `booking.step` = \"{{n}}/{{total}} qadam\".\n\n### Qabul mezonlari\n- [ ] uz tanlanganda 1-qadamda inglizcha soʻz qolmaydi\n- [ ] Bazada har xizmatga uz/en/ru nom\n- [ ] Tarjima yoʻq boʻlsa en ga fallback, boʻsh joy chiqmaydi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-01T13:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b07",
    "code": "B07",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Barber profili: inglizcha bio va xizmatlar, 'Anonymous', boʻsh sharh joyi",
    "summary": "Haqida: \"Timur Nazarov has been cutting hair for 2 years.\" Xizmatlar inglizcha. Sharh muallifi 'Anonymous'. Matni yoʻq 5 yulduzli sharh kartasida boʻsh joy qolgan.",
    "section": "lokalizatsiya",
    "screen": "Barber profili",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "IN_PROGRESS",
    "environment": "PRODUCTION",
    "actual_behavior": "Haqida: \"Timur Nazarov has been cutting hair for 2 years.\" Xizmatlar inglizcha. Sharh muallifi 'Anonymous'. Matni yoʻq 5 yulduzli sharh kartasida boʻsh joy qolgan.",
    "expected_behavior": "Bio va xizmat nomlari bazadan til boʻyicha; 'Anonim' (uz) / 'Anonymous' (en) / 'Аноним' (ru); matnsiz sharhda faqat yulduz va sana, boʻsh qator yoʻq. Sharh matnlari (\"Great cut…\") tarjima qilinmaydi — bu foydalanuvchi kontenti.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: bio va xizmatlar oʻzbekcha",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "uz: 'Anonim'",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Matnsiz sharh kartasi ixcham, ortiqcha boʻsh joysiz",
        "checked": false
      },
      {
        "id": "ac-3",
        "text": "Sharh matnlari oʻzgarmagan holda qoladi",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "`barber_translations(barber_id, lang, bio)`; xizmat nomlari B06 dagi `service_translations` dan. Sharh kartasida `text` boʻsh boʻlsa matn bloki umuman render qilinmasin (marginlar ham). Avtomatik bio shabloni boʻlsa ('has been cutting hair for N years') — i18n kalit: `barber.experience` = \"{{name}} {{years}} yildan beri soch oladi\".\n\nDev Steps:\n1. Bio va xizmat nomlarini til boʻyicha olish\n2. 'Anonymous' ni `review.anonymous` kalitiga oʻtkazish\n3. ReviewCard’da boʻsh matn uchun shartli render",
    "search_keys": [
      "Anonymous",
      "has been cutting hair",
      "ReviewCard",
      "bio"
    ],
    "evidence_urls": [
      "/evidence/B07-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 2,
    "reproduced_count": 1,
    "views_count": 65,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B07] Barber profili: inglizcha bio va xizmatlar, 'Anonymous', boʻsh sharh joyi\n\n**Ekran:** Barber profili\n**Jiddiylik:** Oʻrta\n\n### Muammo\nHaqida: \"Timur Nazarov has been cutting hair for 2 years.\" Xizmatlar inglizcha. Sharh muallifi 'Anonymous'. Matni yoʻq 5 yulduzli sharh kartasida boʻsh joy qolgan.\n\n### Kutilgan natija\nBio va xizmat nomlari bazadan til boʻyicha; 'Anonim' (uz) / 'Anonymous' (en) / 'Аноним' (ru); matnsiz sharhda faqat yulduz va sana, boʻsh qator yoʻq. Sharh matnlari (\"Great cut…\") tarjima qilinmaydi — bu foydalanuvchi kontenti.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B07-01.jpg (1000010909.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Anonymous`, `has been cutting hair`, `ReviewCard`, `bio`).\n2. Bio va xizmat nomlarini til boʻyicha olish\n3. 'Anonymous' ni `review.anonymous` kalitiga oʻtkazish\n4. ReviewCard’da boʻsh matn uchun shartli render\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\n`barber_translations(barber_id, lang, bio)`; xizmat nomlari B06 dagi `service_translations` dan. Sharh kartasida `text` boʻsh boʻlsa matn bloki umuman render qilinmasin (marginlar ham). Avtomatik bio shabloni boʻlsa ('has been cutting hair for N years') — i18n kalit: `barber.experience` = \"{{name}} {{years}} yildan beri soch oladi\".\n\n### Qabul mezonlari\n- [ ] uz: bio va xizmatlar oʻzbekcha\n- [ ] uz: 'Anonim'\n- [ ] Matnsiz sharh kartasi ixcham, ortiqcha boʻsh joysiz\n- [ ] Sharh matnlari oʻzgarmagan holda qoladi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-01T17:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b08",
    "code": "B08",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Toʻlov usullarida Apple Pay",
    "summary": "Toʻlov usullari qatorida 'Apple Pay' koʻrsatilgan (standart usul sifatida).",
    "section": "mahsulot",
    "screen": "Hisob → Toʻlov usullari",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Toʻlov usullari qatorida 'Apple Pay' koʻrsatilgan (standart usul sifatida).",
    "expected_behavior": "Apple Pay butunlay olib tashlansin (UI, kod, konfiguratsiya).",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Hisob va Toʻlov usullari sahifasida Apple Pay yoʻq",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Kodda Apple Pay qoldigʻi yoʻq",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Apple Pay — Android’da ham koʻrinmoqda, bu qattiq yozilgan standart qiymatni koʻrsatadi. Toʻlov provayderlari roʻyxatidan, standart qiymatdan va bogʻliq SDK konfiguratsiyasidan olib tashlang.\n\nDev Steps:\n1. 'Apple Pay' / 'applePay' ni loyiha boʻylab qidiring\n2. Roʻyxat, standart qiymat va konfiguratsiyadan olib tashlang\n3. Standart usul boʻlmasa qatorda mos oʻzbekcha holat chiqsin (masalan 'Qoʻshilmagan')",
    "search_keys": [
      "Apple Pay",
      "applePay",
      "PaymentMethods"
    ],
    "evidence_urls": [
      "/evidence/B09-01.jpg",
      "/evidence/B04-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 2,
    "reproduced_count": 2,
    "views_count": 64,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B08] Toʻlov usullarida Apple Pay\n\n**Ekran:** Hisob → Toʻlov usullari\n**Jiddiylik:** Past\n\n### Muammo\nToʻlov usullari qatorida 'Apple Pay' koʻrsatilgan (standart usul sifatida).\n\n### Kutilgan natija\nApple Pay butunlay olib tashlansin (UI, kod, konfiguratsiya).\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B09-01.jpg (1000010910.jpg), B04-01.jpg (1000010905.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Apple Pay`, `applePay`, `PaymentMethods`).\n2. 'Apple Pay' / 'applePay' ni loyiha boʻylab qidiring\n3. Roʻyxat, standart qiymat va konfiguratsiyadan olib tashlang\n4. Standart usul boʻlmasa qatorda mos oʻzbekcha holat chiqsin (masalan 'Qoʻshilmagan')\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nApple Pay — Android’da ham koʻrinmoqda, bu qattiq yozilgan standart qiymatni koʻrsatadi. Toʻlov provayderlari roʻyxatidan, standart qiymatdan va bogʻliq SDK konfiguratsiyasidan olib tashlang.\n\n### Qabul mezonlari\n- [ ] Hisob va Toʻlov usullari sahifasida Apple Pay yoʻq\n- [ ] Kodda Apple Pay qoldigʻi yoʻq\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-01T21:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b09",
    "code": "B09",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Hisob sahifasidagi statistika inglizcha",
    "summary": "Statistika kartasida Visits, Upcoming, Saved.",
    "section": "lokalizatsiya",
    "screen": "Hisob",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Statistika kartasida Visits, Upcoming, Saved.",
    "expected_behavior": "Tashriflar, Kelgusi, Saqlangan.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: Tashriflar / Kelgusi / Saqlangan",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "en/ru toʻgʻri",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Kalitlar: `account.stats.visits`, `account.stats.upcoming`, `account.stats.saved`.\n\nDev Steps:\n1. Statistika komponentidagi uch yozuvni i18n ga oʻtkazing\n2. uz/en/ru tarjimalarini qoʻshing",
    "search_keys": [
      "Visits",
      "Upcoming",
      "Saved"
    ],
    "evidence_urls": [
      "/evidence/B09-01.jpg",
      "/evidence/B04-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 9,
    "reproduced_count": 6,
    "views_count": 59,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B09] Hisob sahifasidagi statistika inglizcha\n\n**Ekran:** Hisob\n**Jiddiylik:** Oʻrta\n\n### Muammo\nStatistika kartasida Visits, Upcoming, Saved.\n\n### Kutilgan natija\nTashriflar, Kelgusi, Saqlangan.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B09-01.jpg (1000010910.jpg), B04-01.jpg (1000010905.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Visits`, `Upcoming`, `Saved`).\n2. Statistika komponentidagi uch yozuvni i18n ga oʻtkazing\n3. uz/en/ru tarjimalarini qoʻshing\n4. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nKalitlar: `account.stats.visits`, `account.stats.upcoming`, `account.stats.saved`.\n\n### Qabul mezonlari\n- [ ] uz: Tashriflar / Kelgusi / Saqlangan\n- [ ] en/ru toʻgʻri\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-02T01:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b10",
    "code": "B10",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Hisobni oʻchirish sahifasida inglizcha tasdiqlash",
    "summary": "'Type DELETE to confirm', 'Confirmation' sarlavhasi, input ichida 'DELETE'.",
    "section": "lokalizatsiya",
    "screen": "Sozlamalar → Hisobni oʻchirish",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "IN_PROGRESS",
    "environment": "PRODUCTION",
    "actual_behavior": "'Type DELETE to confirm', 'Confirmation' sarlavhasi, input ichida 'DELETE'.",
    "expected_behavior": "'Tasdiqlash uchun OʻCHIRISH deb yozing', sarlavha 'Tasdiqlash', placeholder 'OʻCHIRISH'.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: matn, sarlavha va placeholder oʻzbekcha",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "OʻCHIRISH, OʻCHIRISH, ochirish — hammasi qabul qilinadi",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "en da DELETE, ru da УДАЛИТЬ ishlaydi",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Tasdiqlovchi soʻz lokalizatsiyalangan boʻlsin (uz: OʻCHIRISH, en: DELETE, ru: УДАЛИТЬ). Tekshiruv shu tildagi soʻz boʻyicha; katta-kichik harf va apostrof variantlari (`'`, `ʻ`, `’`, `‘`) normalizatsiya qilinsin. Foydalanuvchi chatda 'OCHIRISH' deb yozgan — toʻgʻri imlo OʻCHIRISH, apostrofsiz kiritish ham qabul qilinsin.\n\nDev Steps:\n1. Matnlarni i18n ga oʻtkazing\n2. Tasdiqlash soʻzini `account.delete.keyword` kalitidan oling\n3. Solishtirishdan oldin ikkala tomonni normalizatsiya qiling: katta harf + apostroflarni olib tashlash",
    "search_keys": [
      "Type DELETE",
      "Confirmation",
      "DELETE",
      "DeleteAccount"
    ],
    "evidence_urls": [
      "/evidence/B10-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 9,
    "reproduced_count": 6,
    "views_count": 37,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B10] Hisobni oʻchirish sahifasida inglizcha tasdiqlash\n\n**Ekran:** Sozlamalar → Hisobni oʻchirish\n**Jiddiylik:** Oʻrta\n\n### Muammo\n'Type DELETE to confirm', 'Confirmation' sarlavhasi, input ichida 'DELETE'.\n\n### Kutilgan natija\n'Tasdiqlash uchun OʻCHIRISH deb yozing', sarlavha 'Tasdiqlash', placeholder 'OʻCHIRISH'.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B10-01.jpg (1000010911.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Type DELETE`, `Confirmation`, `DELETE`, `DeleteAccount`).\n2. Matnlarni i18n ga oʻtkazing\n3. Tasdiqlash soʻzini `account.delete.keyword` kalitidan oling\n4. Solishtirishdan oldin ikkala tomonni normalizatsiya qiling: katta harf + apostroflarni olib tashlash\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nTasdiqlovchi soʻz lokalizatsiyalangan boʻlsin (uz: OʻCHIRISH, en: DELETE, ru: УДАЛИТЬ). Tekshiruv shu tildagi soʻz boʻyicha; katta-kichik harf va apostrof variantlari (`'`, `ʻ`, `’`, `‘`) normalizatsiya qilinsin. Foydalanuvchi chatda 'OCHIRISH' deb yozgan — toʻgʻri imlo OʻCHIRISH, apostrofsiz kiritish ham qabul qilinsin.\n\n### Qabul mezonlari\n- [ ] uz: matn, sarlavha va placeholder oʻzbekcha\n- [ ] OʻCHIRISH, OʻCHIRISH, ochirish — hammasi qabul qilinadi\n- [ ] en da DELETE, ru da УДАЛИТЬ ishlaydi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-02T05:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b11",
    "code": "B11",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Yordam va FAQ: 7 ta savol inglizcha",
    "summary": "Sarlavha va pastki blok oʻzbekcha, lekin 7 ta savolning hammasi (va javoblari) inglizcha.",
    "section": "lokalizatsiya",
    "screen": "Hisob → Yordam va FAQ",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "FIXED",
    "environment": "PRODUCTION",
    "actual_behavior": "Sarlavha va pastki blok oʻzbekcha, lekin 7 ta savolning hammasi (va javoblari) inglizcha.",
    "expected_behavior": "Savollar va javoblar uz/en/ru da. Taklif: (1) Bekor qilish yoki vaqtni oʻzgartirish uchun eng oxirgi muddat qachon? (2) Barber bronni bekor qilsa nima boʻladi? (3) Barber bronni koʻchirishni soʻrasa, rozi boʻlishim shartmi? (4) Bir vaqtda bir nechta xizmatni band qila olamanmi? (5) Toʻlov qachon yechiladi? (6) Sharhni qachon qoldirish mumkin? (7) Telefon raqamimni qanday oʻzgartiraman?",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: 7 ta savol va javob oʻzbekcha",
        "checked": true
      },
      {
        "id": "ac-1",
        "text": "en/ru da ham toʻliq",
        "checked": true
      },
      {
        "id": "ac-2",
        "text": "Pastki karta izohi toʻliq oʻqiladi",
        "checked": true
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "FAQ kontentini i18n JSON yoki `faq_translations(faq_id, lang, question, answer)` jadvaliga koʻchiring. Pastki kartadagi izoh satri ('…eng tezkor yoʻl') oʻng chetda kesilgan koʻrinadi — koʻp qatorga ruxsat bering.\n\nDev Steps:\n1. FAQ manbasini toping (statik massiv yoki API)\n2. Har savolga question+answer × 3 til\n3. Izoh satrida `numberOfLines` cheklovini olib tashlang",
    "search_keys": [
      "How late can I cancel",
      "When am I charged",
      "faq",
      "FAQ"
    ],
    "evidence_urls": [
      "/evidence/B11-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 6,
    "reproduced_count": 1,
    "views_count": 86,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B11] Yordam va FAQ: 7 ta savol inglizcha\n\n**Ekran:** Hisob → Yordam va FAQ\n**Jiddiylik:** Oʻrta\n\n### Muammo\nSarlavha va pastki blok oʻzbekcha, lekin 7 ta savolning hammasi (va javoblari) inglizcha.\n\n### Kutilgan natija\nSavollar va javoblar uz/en/ru da. Taklif: (1) Bekor qilish yoki vaqtni oʻzgartirish uchun eng oxirgi muddat qachon? (2) Barber bronni bekor qilsa nima boʻladi? (3) Barber bronni koʻchirishni soʻrasa, rozi boʻlishim shartmi? (4) Bir vaqtda bir nechta xizmatni band qila olamanmi? (5) Toʻlov qachon yechiladi? (6) Sharhni qachon qoldirish mumkin? (7) Telefon raqamimni qanday oʻzgartiraman?\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B11-01.jpg (1000010912.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `How late can I cancel`, `When am I charged`, `faq`, `FAQ`).\n2. FAQ manbasini toping (statik massiv yoki API)\n3. Har savolga question+answer × 3 til\n4. Izoh satrida `numberOfLines` cheklovini olib tashlang\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nFAQ kontentini i18n JSON yoki `faq_translations(faq_id, lang, question, answer)` jadvaliga koʻchiring. Pastki kartadagi izoh satri ('…eng tezkor yoʻl') oʻng chetda kesilgan koʻrinadi — koʻp qatorga ruxsat bering.\n\n### Qabul mezonlari\n- [ ] uz: 7 ta savol va javob oʻzbekcha\n- [ ] en/ru da ham toʻliq\n- [ ] Pastki karta izohi toʻliq oʻqiladi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-02T09:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b12",
    "code": "B12",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Profilni tahrirlash: avatar tepadan kesilgan",
    "summary": "Avatar doirasining yuqori qismi header chizigʻida tekis kesilgan.",
    "section": "ui",
    "screen": "Profilni tahrirlash",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Avatar doirasining yuqori qismi header chizigʻida tekis kesilgan.",
    "expected_behavior": "Avatar toʻliq doira boʻlib koʻrinsin.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Avatar doirasi toʻliq koʻrinadi",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Rasm yuklanganda ham yuz kesilmaydi",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Kichik ekranlarda ham",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Odatda ScrollView/konteynerga `overflow: hidden` + avatarga manfiy `marginTop` sabab boʻladi. Konteynerga yetarli `paddingTop` bering yoki manfiy marginni olib tashlang; rasm boʻlsa `object-fit: cover`, `object-position: center top`.\n\nDev Steps:\n1. EditProfile ekranidagi avatar konteynerini toping\n2. Manfiy margin / overflow sababini aniqlang\n3. Kichik (360px) va katta ekranda tekshiring",
    "search_keys": [
      "EditProfile",
      "Rasm qo'shish",
      "avatar",
      "marginTop"
    ],
    "evidence_urls": [
      "/evidence/B12-01.jpg",
      "/evidence/B16-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 8,
    "reproduced_count": 2,
    "views_count": 19,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B12] Profilni tahrirlash: avatar tepadan kesilgan\n\n**Ekran:** Profilni tahrirlash\n**Jiddiylik:** Oʻrta\n\n### Muammo\nAvatar doirasining yuqori qismi header chizigʻida tekis kesilgan.\n\n### Kutilgan natija\nAvatar toʻliq doira boʻlib koʻrinsin.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B12-01.jpg (1000010913.jpg), B16-01.jpg (1000010914.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `EditProfile`, `Rasm qo'shish`, `avatar`, `marginTop`).\n2. EditProfile ekranidagi avatar konteynerini toping\n3. Manfiy margin / overflow sababini aniqlang\n4. Kichik (360px) va katta ekranda tekshiring\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nOdatda ScrollView/konteynerga `overflow: hidden` + avatarga manfiy `marginTop` sabab boʻladi. Konteynerga yetarli `paddingTop` bering yoki manfiy marginni olib tashlang; rasm boʻlsa `object-fit: cover`, `object-position: center top`.\n\n### Qabul mezonlari\n- [ ] Avatar doirasi toʻliq koʻrinadi\n- [ ] Rasm yuklanganda ham yuz kesilmaydi\n- [ ] Kichik ekranlarda ham\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-02T13:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b13",
    "code": "B13",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Profilni tahrirlash: 'Telefon raqami' kartasi saqlash tugmasi tagida qolgan",
    "summary": "'Telefon raqami' kartasining pastki qismi sticky 'Oʻzgarishlarni saqlash' paneli tagida yashiringan.",
    "section": "ui",
    "screen": "Profilni tahrirlash (pastki qism)",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "IN_PROGRESS",
    "environment": "PRODUCTION",
    "actual_behavior": "'Telefon raqami' kartasining pastki qismi sticky 'Oʻzgarishlarni saqlash' paneli tagida yashiringan.",
    "expected_behavior": "Kontent oxiri tugma ustida toʻliq koʻrinsin; klaviatura ochilganda ham.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Telefon kartasi toʻliq koʻrinadi va bosiladi",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Klaviatura ochilganda ham kontent yopilmaydi",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Gesture-navigation va 3-tugmali Android’da tekshirilgan",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "ScrollView `contentContainerStyle.paddingBottom` = tugma balandligi + safe-area inset (+16). Klaviatura uchun `KeyboardAvoidingView` / `adjustResize`.\n\nDev Steps:\n1. Sticky tugma balandligini oʻlchang\n2. ScrollView kontentiga mos paddingBottom bering\n3. Klaviatura ochiq holatda tekshiring",
    "search_keys": [
      "O'zgarishlarni saqlash",
      "Telefon raqami",
      "contentContainerStyle",
      "paddingBottom"
    ],
    "evidence_urls": [
      "/evidence/B12-01.jpg",
      "/evidence/B16-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 13,
    "reproduced_count": 5,
    "views_count": 34,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B13] Profilni tahrirlash: 'Telefon raqami' kartasi saqlash tugmasi tagida qolgan\n\n**Ekran:** Profilni tahrirlash (pastki qism)\n**Jiddiylik:** Kritik\n\n### Muammo\n'Telefon raqami' kartasining pastki qismi sticky 'Oʻzgarishlarni saqlash' paneli tagida yashiringan.\n\n### Kutilgan natija\nKontent oxiri tugma ustida toʻliq koʻrinsin; klaviatura ochilganda ham.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B12-01.jpg (1000010913.jpg), B16-01.jpg (1000010914.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `O'zgarishlarni saqlash`, `Telefon raqami`, `contentContainerStyle`, `paddingBottom`).\n2. Sticky tugma balandligini oʻlchang\n3. ScrollView kontentiga mos paddingBottom bering\n4. Klaviatura ochiq holatda tekshiring\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nScrollView `contentContainerStyle.paddingBottom` = tugma balandligi + safe-area inset (+16). Klaviatura uchun `KeyboardAvoidingView` / `adjustResize`.\n\n### Qabul mezonlari\n- [ ] Telefon kartasi toʻliq koʻrinadi va bosiladi\n- [ ] Klaviatura ochilganda ham kontent yopilmaydi\n- [ ] Gesture-navigation va 3-tugmali Android’da tekshirilgan\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-02T17:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b14",
    "code": "B14",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Apostrof atrofida boʻshliq (butun ilova boʻylab)",
    "summary": "Oʻzbekcha matnlarda apostrof harflardan alohida turadi: \"To' liq\", \"Tug' ilgan\", \"to' g' rimi\", \"Qo' llash\". Bazadan kelgan '14 Mahtumquli koʻchasi' (oddiy ' U+0027) esa toʻgʻri chiqadi.",
    "section": "lokalizatsiya",
    "screen": "Barcha ekranlar",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Oʻzbekcha matnlarda apostrof harflardan alohida turadi: \"To' liq\", \"Tug' ilgan\", \"to' g' rimi\", \"Qo' llash\". Bazadan kelgan '14 Mahtumquli koʻchasi' (oddiy ' U+0027) esa toʻgʻri chiqadi.",
    "expected_behavior": "Toʻliq, Tugʻilgan, toʻgʻrimi, Qoʻllash — boʻshliqsiz, butun ilovada bitta apostrof belgisi.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Hech bir uz satrda apostrof atrofida boʻshliq koʻrinmaydi",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Butun loyihada bitta apostrof belgisi",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "CI’da regex tekshiruvi",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Gipoteza (dalil asosida): UI matnlari U+02BB (ʻ) yoki U+2018 bilan yozilgan va ilova shriftida bu glif yoʻq → tizim zaxira shriftiga oʻtadi, kenglik/side-bearing boshqa boʻlib boʻshliq paydo boʻladi. U+0027 bilan yozilgan manzil toʻgʻri koʻrinishi shuni tasdiqlaydi. Avval matnda haqiqiy boʻshliq bormi — regex bilan tekshiring: `\\s['ʻʼ’‘]\\s|[a-zA-Z]['ʻʼ’‘]\\s[a-z]`. Soʻng: (a) shriftga U+02BB glifini qoʻshing / glifi bor shriftga oʻting, yoki (b) butun loyihada bitta belgiga (U+02BB yoki U+2019) oʻting.\n\nDev Steps:\n1. uz lugʻatida va bazada apostrof atrofidagi boʻshliqni regex bilan qidiring va tozalang\n2. Ishlatilayotgan apostrof belgisini aniqlang (U+02BB / U+2018 / U+2019 / U+0027)\n3. Shriftda shu glif borligini tekshiring; boʻlmasa glifi bor belgiga yoki shriftga oʻting\n4. Barcha satrlarni bitta standart belgiga keltiring va lint qoidasi qoʻshing",
    "search_keys": [
      "ʻ",
      "‘",
      "’",
      "uz.json",
      "fontFamily"
    ],
    "evidence_urls": [
      "/evidence/B14-01.jpg",
      "/evidence/B14-02.jpg",
      "/evidence/B14-03.jpg",
      "/evidence/B12-01.jpg",
      "/evidence/B19-02.jpg",
      "/evidence/B19-03.jpg",
      "/evidence/B05-01.jpg",
      "/evidence/B01-01.jpg",
      "/evidence/B04-01.jpg",
      "/evidence/B09-01.jpg",
      "/evidence/B18-01.jpg",
      "/evidence/B19-01.jpg",
      "/evidence/B10-01.jpg",
      "/evidence/B11-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 3,
    "reproduced_count": 5,
    "views_count": 84,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B14] Apostrof atrofida boʻshliq (butun ilova boʻylab)\n\n**Ekran:** Barcha ekranlar\n**Jiddiylik:** Oʻrta\n\n### Muammo\nOʻzbekcha matnlarda apostrof harflardan alohida turadi: \"To' liq\", \"Tug' ilgan\", \"to' g' rimi\", \"Qo' llash\". Bazadan kelgan '14 Mahtumquli koʻchasi' (oddiy ' U+0027) esa toʻgʻri chiqadi.\n\n### Kutilgan natija\nToʻliq, Tugʻilgan, toʻgʻrimi, Qoʻllash — boʻshliqsiz, butun ilovada bitta apostrof belgisi.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B14-01.jpg (1000010920.jpg), B14-02.jpg (1000010922.jpg), B14-03.jpg (1000010924.jpg), B12-01.jpg (1000010913.jpg), B19-02.jpg (1000010917.jpg), B19-03.jpg (1000010918.jpg), B05-01.jpg (1000010907.jpg), B01-01.jpg (1000010904.jpg), B04-01.jpg (1000010905.jpg), B09-01.jpg (1000010910.jpg), B18-01.jpg (1000010915.jpg), B19-01.jpg (1000010916.jpg), B10-01.jpg (1000010911.jpg), B11-01.jpg (1000010912.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `ʻ`, `‘`, `’`, `uz.json`, `fontFamily`).\n2. uz lugʻatida va bazada apostrof atrofidagi boʻshliqni regex bilan qidiring va tozalang\n3. Ishlatilayotgan apostrof belgisini aniqlang (U+02BB / U+2018 / U+2019 / U+0027)\n4. Shriftda shu glif borligini tekshiring; boʻlmasa glifi bor belgiga yoki shriftga oʻting\n5. Barcha satrlarni bitta standart belgiga keltiring va lint qoidasi qoʻshing\n6. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nGipoteza (dalil asosida): UI matnlari U+02BB (ʻ) yoki U+2018 bilan yozilgan va ilova shriftida bu glif yoʻq → tizim zaxira shriftiga oʻtadi, kenglik/side-bearing boshqa boʻlib boʻshliq paydo boʻladi. U+0027 bilan yozilgan manzil toʻgʻri koʻrinishi shuni tasdiqlaydi. Avval matnda haqiqiy boʻshliq bormi — regex bilan tekshiring: `\\s['ʻʼ’‘]\\s|[a-zA-Z]['ʻʼ’‘]\\s[a-z]`. Soʻng: (a) shriftga U+02BB glifini qoʻshing / glifi bor shriftga oʻting, yoki (b) butun loyihada bitta belgiga (U+02BB yoki U+2019) oʻting.\n\n### Qabul mezonlari\n- [ ] Hech bir uz satrda apostrof atrofida boʻshliq koʻrinmaydi\n- [ ] Butun loyihada bitta apostrof belgisi\n- [ ] CI’da regex tekshiruvi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-02T21:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b15",
    "code": "B15",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Email maydoni placeholder’i inglizcha (you@example.com)",
    "summary": "Elektron pochta maydonida 'you@example.com'.",
    "section": "lokalizatsiya",
    "screen": "Profilni tahrirlash",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Elektron pochta maydonida 'you@example.com'.",
    "expected_behavior": "uz: 'ism@misol.uz'; en: 'you@example.com'; ru: 'you@example.com'.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz da 'ism@misol.uz'",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "en/ru da mos namuna",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Placeholder’ni `profile.email.placeholder` kalitiga oʻtkazing.\n\nDev Steps:\n1. Placeholder satrini toping\n2. i18n kalitiga oʻtkazing",
    "search_keys": [
      "you@example.com",
      "placeholder"
    ],
    "evidence_urls": [
      "/evidence/B12-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 6,
    "reproduced_count": 7,
    "views_count": 48,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B15] Email maydoni placeholder’i inglizcha (you@example.com)\n\n**Ekran:** Profilni tahrirlash\n**Jiddiylik:** Past\n\n### Muammo\nElektron pochta maydonida 'you@example.com'.\n\n### Kutilgan natija\nuz: 'ism@misol.uz'; en: 'you@example.com'; ru: 'you@example.com'.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B12-01.jpg (1000010913.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `you@example.com`, `placeholder`).\n2. Placeholder satrini toping\n3. i18n kalitiga oʻtkazing\n4. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nPlaceholder’ni `profile.email.placeholder` kalitiga oʻtkazing.\n\n### Qabul mezonlari\n- [ ] uz da 'ism@misol.uz'\n- [ ] en/ru da mos namuna\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-03T01:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b16",
    "code": "B16",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Tugʻilgan sana: tizim kalendari ochiladi (inglizcha, yashil)",
    "summary": "Telefonning standart kalendari ochiladi: inglizcha ('Sat, Jan 1', 'January 2000', CANCEL/OK), yashil rang, qurilmaga qarab turlicha; yil tanlash noqulay (2000 dan orqaga uzoq varaqlash).",
    "section": "komponent",
    "screen": "Profilni tahrirlash → Tugʻilgan sana",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "FIXED",
    "environment": "PRODUCTION",
    "actual_behavior": "Telefonning standart kalendari ochiladi: inglizcha ('Sat, Jan 1', 'January 2000', CANCEL/OK), yashil rang, qurilmaga qarab turlicha; yil tanlash noqulay (2000 dan orqaga uzoq varaqlash).",
    "expected_behavior": "Maxsus date picker: qora fon, sariq accent; oʻzbekcha oylar (Yanvar … Dekabr) va kunlar (Du Se Ch Pa Ju Sh Ya); tugmalar 'Bekor qilish' / 'Tasdiqlash'; yil bosilganda yillar toʻri yoki gʻildirak; barcha qurilmada bir xil.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Picker qora/sariq, oʻzbekcha",
        "checked": true
      },
      {
        "id": "ac-1",
        "text": "Bekor qilish / Tasdiqlash",
        "checked": true
      },
      {
        "id": "ac-2",
        "text": "Istalgan yilni 3 ta bosishdan ko‘p bo‘lmagan holda tanlash mumkin",
        "checked": true
      },
      {
        "id": "ac-3",
        "text": "Android va iOS da bir xil",
        "checked": true
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Native `DateTimePicker` oʻrniga oʻz komponentingiz (bottom sheet). Hafta Dushanbadan boshlansin. Yil koʻrinishi: 12 yillik toʻr + oʻn yillik sakrash; maksimal sana — bugun, minimal — 1920. Saqlash formati ISO (`YYYY-MM-DD`), koʻrsatish — `5-noyabr, 2026`.\n\nDev Steps:\n1. Tugʻilgan sana maydonining onPress’ida native picker chaqiruvini toping\n2. Ilova uslubidagi maxsus picker komponentini yarating (saytdagi namunaga qarang)\n3. Oy/kun nomlarini i18n dan oling\n4. Yil tanlash koʻrinishini qoʻshing",
    "search_keys": [
      "DateTimePicker",
      "Tug'ilgan sana",
      "birthDate",
      "showDatePicker"
    ],
    "evidence_urls": [
      "/evidence/B16-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 7,
    "reproduced_count": 2,
    "views_count": 35,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B16] Tugʻilgan sana: tizim kalendari ochiladi (inglizcha, yashil)\n\n**Ekran:** Profilni tahrirlash → Tugʻilgan sana\n**Jiddiylik:** Kritik\n\n### Muammo\nTelefonning standart kalendari ochiladi: inglizcha ('Sat, Jan 1', 'January 2000', CANCEL/OK), yashil rang, qurilmaga qarab turlicha; yil tanlash noqulay (2000 dan orqaga uzoq varaqlash).\n\n### Kutilgan natija\nMaxsus date picker: qora fon, sariq accent; oʻzbekcha oylar (Yanvar … Dekabr) va kunlar (Du Se Ch Pa Ju Sh Ya); tugmalar 'Bekor qilish' / 'Tasdiqlash'; yil bosilganda yillar toʻri yoki gʻildirak; barcha qurilmada bir xil.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B16-01.jpg (1000010914.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `DateTimePicker`, `Tug'ilgan sana`, `birthDate`, `showDatePicker`).\n2. Tugʻilgan sana maydonining onPress’ida native picker chaqiruvini toping\n3. Ilova uslubidagi maxsus picker komponentini yarating (saytdagi namunaga qarang)\n4. Oy/kun nomlarini i18n dan oling\n5. Yil tanlash koʻrinishini qoʻshing\n6. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nNative `DateTimePicker` oʻrniga oʻz komponentingiz (bottom sheet). Hafta Dushanbadan boshlansin. Yil koʻrinishi: 12 yillik toʻr + oʻn yillik sakrash; maksimal sana — bugun, minimal — 1920. Saqlash formati ISO (`YYYY-MM-DD`), koʻrsatish — `5-noyabr, 2026`.\n\n### Qabul mezonlari\n- [ ] Picker qora/sariq, oʻzbekcha\n- [ ] Bekor qilish / Tasdiqlash\n- [ ] Istalgan yilni 3 ta bosishdan ko‘p bo‘lmagan holda tanlash mumkin\n- [ ] Android va iOS da bir xil\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-03T05:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b17",
    "code": "B17",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Barcha sharhlar sahifasida '31 reviews' inglizcha",
    "summary": "Profilda 'N ta sharh' toʻgʻri, lekin roʻyxat sahifasida 'N reviews'.",
    "section": "lokalizatsiya",
    "screen": "Barber profili → Barchasi → Sharhlar",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "Profilda 'N ta sharh' toʻgʻri, lekin roʻyxat sahifasida 'N reviews'.",
    "expected_behavior": "'N ta sharh' — i18n pluralization orqali.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: '31 ta sharh'",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "ru: '31 отзыв', '32 отзыва', '35 отзывов'",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "`reviews.count` kaliti, plural shakllari: uz (bitta shakl: '{{count}} ta sharh'), en (one/other), ru (one/few/many). Profil sahifasidagi sharhlar bloki toʻgʻri ishlaydi — faqat ichki sahifa.\n\nDev Steps:\n1. Sharhlar roʻyxati sahifasida 'reviews' satrini toping\n2. Profil sahifasidagi kalitdan foydalaning",
    "search_keys": [
      "reviews",
      "ta sharh",
      "AllReviews"
    ],
    "evidence_urls": [],
    "is_sensitive": true,
    "upvotes_count": 7,
    "reproduced_count": 3,
    "views_count": 92,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B17] Barcha sharhlar sahifasida '31 reviews' inglizcha\n\n**Ekran:** Barber profili → Barchasi → Sharhlar\n**Jiddiylik:** Past\n\n### Muammo\nProfilda 'N ta sharh' toʻgʻri, lekin roʻyxat sahifasida 'N reviews'.\n\n### Kutilgan natija\n'N ta sharh' — i18n pluralization orqali.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: Dalil skrinshoti hali qoʻshilmagan — muammo test qiluvchining yozma xabari asosida.\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `reviews`, `ta sharh`, `AllReviews`).\n2. Sharhlar roʻyxati sahifasida 'reviews' satrini toping\n3. Profil sahifasidagi kalitdan foydalaning\n4. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\n`reviews.count` kaliti, plural shakllari: uz (bitta shakl: '{{count}} ta sharh'), en (one/other), ru (one/few/many). Profil sahifasidagi sharhlar bloki toʻgʻri ishlaydi — faqat ichki sahifa.\n\n### Qabul mezonlari\n- [ ] uz: '31 ta sharh'\n- [ ] ru: '31 отзыв', '32 отзыва', '35 отзывов'\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-03T09:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b18",
    "code": "B18",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Vaqtni tanlash (2/3 qadam): til, 24 soat, 'Hali erta', tugma holati",
    "summary": "'Step 2 of 3 · Time'; sana qatorida 'Today' inglizcha (qolganlari Pa/Ju/Sh); vaqtlar 12 soatlik (2:00 PM); 'Ishlamaydi · 9:00 AM – 10:30 AM' va 'Hali erta · 11:00 AM – 1:30 PM' — skrinshot 13:22 da olingan, ya’ni 'Hali erta' deb koʻrsatilgan vaqtlar aslida oʻtib ketgan; pastdagi 'Vaqtni tanlang' tugmasi xira va sarlavha bilan bir xil matnda.",
    "section": "lokalizatsiya",
    "screen": "Band qilish → 2-qadam",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "'Step 2 of 3 · Time'; sana qatorida 'Today' inglizcha (qolganlari Pa/Ju/Sh); vaqtlar 12 soatlik (2:00 PM); 'Ishlamaydi · 9:00 AM – 10:30 AM' va 'Hali erta · 11:00 AM – 1:30 PM' — skrinshot 13:22 da olingan, ya’ni 'Hali erta' deb koʻrsatilgan vaqtlar aslida oʻtib ketgan; pastdagi 'Vaqtni tanlang' tugmasi xira va sarlavha bilan bir xil matnda.",
    "expected_behavior": "'2/3 qadam · Vaqt'; 'Bugun'; 24 soatlik (14:00, 17:30); oʻtgan vaqtlar 'Oʻtib ketgan' (kulrang) yoki yashirilgan; nofaol tugma aniq farqlanadi va boshqa matnda (masalan 'Avval vaqtni tanlang'), faol holatda 'Davom etish'.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Ekranda inglizcha soʻz yoʻq",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Barcha vaqtlar 24 soatlik",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Oʻtgan vaqtlar 'Hali erta' deb koʻrsatilmaydi",
        "checked": false
      },
      {
        "id": "ac-3",
        "text": "Nofaol va faol tugma aniq farq qiladi",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "`Intl.DateTimeFormat('uz', {hour:'2-digit', minute:'2-digit', hour12:false})` yoki markaziy `formatTime`. 'Hali erta' guruhi mantiqini tekshiring: hozirgi vaqtdan oldingi slotlar 'past' deb belgilansin. Nofaol tugma WCAG AA kontrastda.\n\nDev Steps:\n1. Stepper matnlarini i18n ga oʻtkazing (B06 bilan birga)\n2. 'Today' ni `common.today` ga oʻtkazing\n3. Markaziy 24 soatlik vaqt formatlash util’iga oʻting\n4. Slot guruhlash mantiqida 'early' va 'past' holatlarini ajrating\n5. Tugma matni va disabled stilini yangilang",
    "search_keys": [
      "Step 2 of 3",
      "Today",
      "Hali erta",
      "Ishlamaydi",
      "AM",
      "PM",
      "hour12"
    ],
    "evidence_urls": [
      "/evidence/B18-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 5,
    "reproduced_count": 6,
    "views_count": 64,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B18] Vaqtni tanlash (2/3 qadam): til, 24 soat, 'Hali erta', tugma holati\n\n**Ekran:** Band qilish → 2-qadam\n**Jiddiylik:** Kritik\n\n### Muammo\n'Step 2 of 3 · Time'; sana qatorida 'Today' inglizcha (qolganlari Pa/Ju/Sh); vaqtlar 12 soatlik (2:00 PM); 'Ishlamaydi · 9:00 AM – 10:30 AM' va 'Hali erta · 11:00 AM – 1:30 PM' — skrinshot 13:22 da olingan, ya’ni 'Hali erta' deb koʻrsatilgan vaqtlar aslida oʻtib ketgan; pastdagi 'Vaqtni tanlang' tugmasi xira va sarlavha bilan bir xil matnda.\n\n### Kutilgan natija\n'2/3 qadam · Vaqt'; 'Bugun'; 24 soatlik (14:00, 17:30); oʻtgan vaqtlar 'Oʻtib ketgan' (kulrang) yoki yashirilgan; nofaol tugma aniq farqlanadi va boshqa matnda (masalan 'Avval vaqtni tanlang'), faol holatda 'Davom etish'.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B18-01.jpg (1000010915.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Step 2 of 3`, `Today`, `Hali erta`, `Ishlamaydi`, `AM`, `PM`, `hour12`).\n2. Stepper matnlarini i18n ga oʻtkazing (B06 bilan birga)\n3. 'Today' ni `common.today` ga oʻtkazing\n4. Markaziy 24 soatlik vaqt formatlash util’iga oʻting\n5. Slot guruhlash mantiqida 'early' va 'past' holatlarini ajrating\n6. Tugma matni va disabled stilini yangilang\n7. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\n`Intl.DateTimeFormat('uz', {hour:'2-digit', minute:'2-digit', hour12:false})` yoki markaziy `formatTime`. 'Hali erta' guruhi mantiqini tekshiring: hozirgi vaqtdan oldingi slotlar 'past' deb belgilansin. Nofaol tugma WCAG AA kontrastda.\n\n### Qabul mezonlari\n- [ ] Ekranda inglizcha soʻz yoʻq\n- [ ] Barcha vaqtlar 24 soatlik\n- [ ] Oʻtgan vaqtlar 'Hali erta' deb koʻrsatilmaydi\n- [ ] Nofaol va faol tugma aniq farq qiladi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-03T13:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b19",
    "code": "B19",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "Band qilish tafsilotlari (3/3 qadam) inglizcha",
    "summary": "'Step 3 of 3 · Confirm'; sana 'November 5, 2026'; vaqt '1:00 PM – 2:05 PM'; xizmatlar 'Skin Fade', 'Hair Wash'; davomiylik '50 min', '15 min'. Qoʻshimcha: 'Tanlagan xizmatlaringiz' — grammatik jihatdan 'Tanlangan xizmatlaringiz'.",
    "section": "lokalizatsiya",
    "screen": "Band qilish → 3-qadam (Tasdiqlash)",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "IN_PROGRESS",
    "environment": "PRODUCTION",
    "actual_behavior": "'Step 3 of 3 · Confirm'; sana 'November 5, 2026'; vaqt '1:00 PM – 2:05 PM'; xizmatlar 'Skin Fade', 'Hair Wash'; davomiylik '50 min', '15 min'. Qoʻshimcha: 'Tanlagan xizmatlaringiz' — grammatik jihatdan 'Tanlangan xizmatlaringiz'.",
    "expected_behavior": "'3/3 qadam · Tasdiqlash'; '5-noyabr, 2026'; '13:00 – 14:05'; oʻzbekcha xizmat nomlari; '50 daqiqa', '15 daqiqa'; 'Tanlangan xizmatlaringiz'.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Ekranda inglizcha soʻz yoʻq",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Sana '5-noyabr, 2026', vaqt 24 soatlik",
        "checked": false
      },
      {
        "id": "ac-2",
        "text": "Davomiylik 'daqiqa' bilan",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Markaziy util: `formatDate(date, locale)` → '5-noyabr, 2026'; `formatTime(date)` → 24 soat; `formatDuration(min, locale)` → '50 daqiqa'. Xizmat nomlari B06 dagi manbadan.\n\nDev Steps:\n1. Stepper matnlari (B06/B18 bilan bir yoʻla)\n2. Sana/vaqt/davomiylikni markaziy util’larga oʻtkazing\n3. Xizmat nomlarini til boʻyicha oling\n4. 'Tanlagan' → 'Tanlangan'",
    "search_keys": [
      "Step 3 of 3",
      "Confirm",
      "min",
      "Skin Fade",
      "toLocaleDateString",
      "Tanlagan xizmatlaringiz"
    ],
    "evidence_urls": [
      "/evidence/B19-02.jpg",
      "/evidence/B19-03.jpg",
      "/evidence/B19-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 13,
    "reproduced_count": 7,
    "views_count": 86,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B19] Band qilish tafsilotlari (3/3 qadam) inglizcha\n\n**Ekran:** Band qilish → 3-qadam (Tasdiqlash)\n**Jiddiylik:** Kritik\n\n### Muammo\n'Step 3 of 3 · Confirm'; sana 'November 5, 2026'; vaqt '1:00 PM – 2:05 PM'; xizmatlar 'Skin Fade', 'Hair Wash'; davomiylik '50 min', '15 min'. Qoʻshimcha: 'Tanlagan xizmatlaringiz' — grammatik jihatdan 'Tanlangan xizmatlaringiz'.\n\n### Kutilgan natija\n'3/3 qadam · Tasdiqlash'; '5-noyabr, 2026'; '13:00 – 14:05'; oʻzbekcha xizmat nomlari; '50 daqiqa', '15 daqiqa'; 'Tanlangan xizmatlaringiz'.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B19-02.jpg (1000010917.jpg), B19-03.jpg (1000010918.jpg), B19-01.jpg (1000010916.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Step 3 of 3`, `Confirm`, `min`, `Skin Fade`, `toLocaleDateString`, `Tanlagan xizmatlaringiz`).\n2. Stepper matnlari (B06/B18 bilan bir yoʻla)\n3. Sana/vaqt/davomiylikni markaziy util’larga oʻtkazing\n4. Xizmat nomlarini til boʻyicha oling\n5. 'Tanlagan' → 'Tanlangan'\n6. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nMarkaziy util: `formatDate(date, locale)` → '5-noyabr, 2026'; `formatTime(date)` → 24 soat; `formatDuration(min, locale)` → '50 daqiqa'. Xizmat nomlari B06 dagi manbadan.\n\n### Qabul mezonlari\n- [ ] Ekranda inglizcha soʻz yoʻq\n- [ ] Sana '5-noyabr, 2026', vaqt 24 soatlik\n- [ ] Davomiylik 'daqiqa' bilan\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-03T17:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b20",
    "code": "B20",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "YANGI: Narx 2- va 3-qadam orasida oʻzgaradi (Band qilish haqi 2 UZS)",
    "summary": "2-qadamda Jami 125 000 UZS. 3-qadamda kutilmaganda 'Band qilish haqi 2 UZS' qatori paydo boʻladi va Jami 125 002 UZS boʻladi. 3-qadam sarlavhasi esa 'Quyidagi narx yakuniy' deydi.",
    "section": "mahsulot",
    "screen": "Band qilish → 2-qadam / 3-qadam",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "REPORTED",
    "environment": "PRODUCTION",
    "actual_behavior": "2-qadamda Jami 125 000 UZS. 3-qadamda kutilmaganda 'Band qilish haqi 2 UZS' qatori paydo boʻladi va Jami 125 002 UZS boʻladi. 3-qadam sarlavhasi esa 'Quyidagi narx yakuniy' deydi.",
    "expected_behavior": "Agar band qilish haqi bor boʻlsa, u 2-qadamdagi jamida ham koʻrinsin (yoki xizmat kartasida oldindan aytilsin). 2 UZS — test konfiguratsiyasi qolgan boʻlishi mumkin; mahsulot jamoasi haqiqiy summani tasdiqlasin.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "2- va 3-qadamdagi Jami bir xil yoki farq oldindan aniq aytilgan",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "Fee summasi tasdiqlangan qiymatda",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Narx hisoblash bitta joyda boʻlsin (masalan `calcBookingTotal(services, fees)`), 2- va 3-qadam shu funksiyani chaqirsin. Booking fee konfiguratsiyasini (2 UZS) tekshiring. Ishonch 88% — bu ataylab qilingan qaror boʻlishi mumkin, shuning uchun 'TEKSHIRILSIN'.\n\nDev Steps:\n1. Booking fee qayerda qoʻshilishini toping\n2. 2-qadam jamisini ham shu funksiyadan hisoblang\n3. Fee summasini mahsulot jamoasi bilan tasdiqlang",
    "search_keys": [
      "Band qilish haqi",
      "bookingFee",
      "fee",
      "Jami"
    ],
    "evidence_urls": [
      "/evidence/B19-01.jpg",
      "/evidence/B18-01.jpg",
      "/evidence/B19-02.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 2,
    "reproduced_count": 7,
    "views_count": 72,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B20] YANGI: Narx 2- va 3-qadam orasida oʻzgaradi (Band qilish haqi 2 UZS)\n\n**Ekran:** Band qilish → 2-qadam / 3-qadam\n**Jiddiylik:** Oʻrta\n\n### Muammo\n2-qadamda Jami 125 000 UZS. 3-qadamda kutilmaganda 'Band qilish haqi 2 UZS' qatori paydo boʻladi va Jami 125 002 UZS boʻladi. 3-qadam sarlavhasi esa 'Quyidagi narx yakuniy' deydi.\n\n### Kutilgan natija\nAgar band qilish haqi bor boʻlsa, u 2-qadamdagi jamida ham koʻrinsin (yoki xizmat kartasida oldindan aytilsin). 2 UZS — test konfiguratsiyasi qolgan boʻlishi mumkin; mahsulot jamoasi haqiqiy summani tasdiqlasin.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B19-01.jpg (1000010916.jpg), B18-01.jpg (1000010915.jpg), B19-02.jpg (1000010917.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Band qilish haqi`, `bookingFee`, `fee`, `Jami`).\n2. Booking fee qayerda qoʻshilishini toping\n3. 2-qadam jamisini ham shu funksiyadan hisoblang\n4. Fee summasini mahsulot jamoasi bilan tasdiqlang\n5. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nNarx hisoblash bitta joyda boʻlsin (masalan `calcBookingTotal(services, fees)`), 2- va 3-qadam shu funksiyani chaqirsin. Booking fee konfiguratsiyasini (2 UZS) tekshiring. Ishonch 88% — bu ataylab qilingan qaror boʻlishi mumkin, shuning uchun 'TEKSHIRILSIN'.\n\n### Qabul mezonlari\n- [ ] 2- va 3-qadamdagi Jami bir xil yoki farq oldindan aniq aytilgan\n- [ ] Fee summasi tasdiqlangan qiymatda\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-03T21:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b21",
    "code": "B21",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "YANGI: Uy sahifasi headeridagi avatar boʻsh",
    "summary": "Oʻng yuqoridagi profil doirasi ichi boʻsh qora doira. Hisob sahifasida esa xuddi shu foydalanuvchi uchun 'R' bosh harfi chiqadi.",
    "section": "ui",
    "screen": "Bosh sahifa (Uy)",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "FIXED",
    "environment": "PRODUCTION",
    "actual_behavior": "Oʻng yuqoridagi profil doirasi ichi boʻsh qora doira. Hisob sahifasida esa xuddi shu foydalanuvchi uchun 'R' bosh harfi chiqadi.",
    "expected_behavior": "Rasm boʻlmasa — Hisob’dagi kabi bosh harf (R) koʻrsatilsin.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "Rasm yoʻq boʻlsa bosh harf koʻrinadi",
        "checked": true
      },
      {
        "id": "ac-1",
        "text": "Rasm bor boʻlsa rasm koʻrinadi",
        "checked": true
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Header avatar komponenti fallback (initials) holatini qoʻllamaydi yoki ism yuklanmasdan render boʻlgan. Hisob’dagi avatar komponentini qayta ishlating. Ishonch 65% — skrinshot yuklanish paytida olingan boʻlishi mumkin.\n\nDev Steps:\n1. Uy header’idagi avatar komponentini toping\n2. Hisob’dagi `Avatar` (initials fallback bilan) komponentiga almashtiring",
    "search_keys": [
      "HomeHeader",
      "Avatar",
      "initials"
    ],
    "evidence_urls": [
      "/evidence/B01-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 5,
    "reproduced_count": 6,
    "views_count": 18,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B21] YANGI: Uy sahifasi headeridagi avatar boʻsh\n\n**Ekran:** Bosh sahifa (Uy)\n**Jiddiylik:** Past\n\n### Muammo\nOʻng yuqoridagi profil doirasi ichi boʻsh qora doira. Hisob sahifasida esa xuddi shu foydalanuvchi uchun 'R' bosh harfi chiqadi.\n\n### Kutilgan natija\nRasm boʻlmasa — Hisob’dagi kabi bosh harf (R) koʻrsatilsin.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B01-01.jpg (1000010904.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `HomeHeader`, `Avatar`, `initials`).\n2. Uy header’idagi avatar komponentini toping\n3. Hisob’dagi `Avatar` (initials fallback bilan) komponentiga almashtiring\n4. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nHeader avatar komponenti fallback (initials) holatini qoʻllamaydi yoki ism yuklanmasdan render boʻlgan. Hisob’dagi avatar komponentini qayta ishlating. Ishonch 65% — skrinshot yuklanish paytida olingan boʻlishi mumkin.\n\n### Qabul mezonlari\n- [ ] Rasm yoʻq boʻlsa bosh harf koʻrinadi\n- [ ] Rasm bor boʻlsa rasm koʻrinadi\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-04T01:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  },
  {
    "id": "bug-b22",
    "code": "B22",
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "title": "YANGI: Joy nomlari imlosi ('Tashkent', 'Mirzo Ulugbek')",
    "summary": "Joylashuv tanlagichda 'Chilonzor, Tashkent' (inglizcha imlo); Filtrda 'Mirzo Ulugbek' (apostrof tushib qolgan).",
    "section": "lokalizatsiya",
    "screen": "Uy (joylashuv) va Filtr (Hudud)",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "IN_PROGRESS",
    "environment": "PRODUCTION",
    "actual_behavior": "Joylashuv tanlagichda 'Chilonzor, Tashkent' (inglizcha imlo); Filtrda 'Mirzo Ulugbek' (apostrof tushib qolgan).",
    "expected_behavior": "uz: 'Chilonzor, Toshkent', 'Mirzo Ulugʻbek'; en: 'Tashkent', 'Mirzo Ulugbek'; ru: 'Ташкент', 'Мирзо-Улугбек'.",
    "steps_to_reproduce": [],
    "acceptance_criteria": [
      {
        "id": "ac-0",
        "text": "uz: Toshkent, Mirzo Ulugʻbek",
        "checked": false
      },
      {
        "id": "ac-1",
        "text": "en/ru mos",
        "checked": false
      }
    ],
    "device_telemetry": {
      "browser": "Chrome Mobile 128",
      "os": "Android 14 (HyperOS)",
      "resolution": "1080x2400",
      "viewport": "393x873",
      "language": "uz-UZ",
      "connection": "4G LTE"
    },
    "dev_notes": "Shahar va tuman nomlari ham `district_translations` / i18n orqali. B14 dagi bitta apostrof belgisi qoidasiga amal qiling.\n\nDev Steps:\n1. Shahar/tuman nomlari manbasini toping\n2. uz/en/ru variantlarini qoʻshing",
    "search_keys": [
      "Tashkent",
      "Mirzo Ulugbek",
      "districts"
    ],
    "evidence_urls": [
      "/evidence/B05-01.jpg",
      "/evidence/B01-01.jpg"
    ],
    "is_sensitive": true,
    "upvotes_count": 6,
    "reproduced_count": 2,
    "views_count": 102,
    "reporter_name": "Sarvar Tester",
    "claude_code_prompt": "## Vazifa: [B22] YANGI: Joy nomlari imlosi ('Tashkent', 'Mirzo Ulugbek')\n\n**Ekran:** Uy (joylashuv) va Filtr (Hudud)\n**Jiddiylik:** Past\n\n### Muammo\nJoylashuv tanlagichda 'Chilonzor, Tashkent' (inglizcha imlo); Filtrda 'Mirzo Ulugbek' (apostrof tushib qolgan).\n\n### Kutilgan natija\nuz: 'Chilonzor, Toshkent', 'Mirzo Ulugʻbek'; en: 'Tashkent', 'Mirzo Ulugbek'; ru: 'Ташкент', 'Мирзо-Улугбек'.\n\n### Dalil\nBu bug quyidagi skrinshotlarda koʻrinadi: B05-01.jpg (1000010907.jpg), B01-01.jpg (1000010904.jpg)\n(Rasmlar shu loyiha papkasida: assets/evidence/)\n\n### Nima qilish kerak\n1. Tegishli fayllarni top (qidiruv kalitlari: `Tashkent`, `Mirzo Ulugbek`, `districts`).\n2. Shahar/tuman nomlari manbasini toping\n3. uz/en/ru variantlarini qoʻshing\n4. Barcha 3 til (uz/en/ru) uchun tekshir.\n\n### Texnik izoh\nShahar va tuman nomlari ham `district_translations` / i18n orqali. B14 dagi bitta apostrof belgisi qoidasiga amal qiling.\n\n### Qabul mezonlari\n- [ ] uz: Toshkent, Mirzo Ulugʻbek\n- [ ] en/ru mos\n\n### Cheklovlar\n- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.\n- i18n kalitlarini yangi hard-code qilma.\n- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.\n",
    "created_at": "2026-11-04T05:24:58.066Z",
    "updated_at": "2026-11-04T09:24:58.066Z"
  }
];

export const INITIAL_COMMENTS: BugComment[] = [
  {
    id: "c1",
    bug_id: "bug-b01",
    author_name: "Alisher Qodirov (Dev)",
    author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    content: "O‘zbekcha tarjima kalitlarini tekshirib chiqdim. navigation.json da tab nomlari inglizcha qolib ketgan ekan. Bugun pull request tayyorlayman.",
    is_internal: false,
    reactions: { "👍": ["Muhamad R.", "Sarvar Tester"], "🚀": ["Muhamad R."] },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "c2",
    bug_id: "bug-b01",
    author_name: "Sarvar Tester",
    author_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    content: "Ajoyib! Pastki navigatsiyadan tashqari profil sozlamalaridagi ba'zi yorliqlar ham inglizcha ko‘rinayotganini payqadim (#B04 ga qarang).",
    is_internal: false,
    reactions: { "👀": ["Alisher Qodirov (Dev)"] },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "c3",
    bug_id: "bug-b14",
    author_name: "Muhamad R. (Lead)",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    content: "Apostrof masalasida butun ilovada U+02BB yoki U+2019 glifini standart qilamiz. Regex qoidasini CI lint tekshiruviga kiritib qo‘yamiz.",
    is_internal: true,
    reactions: { "🔥": ["Alisher Qodirov (Dev)"] },
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];
