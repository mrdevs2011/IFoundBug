-- ====================================================================
-- IFoundBug (IFB) - Migration: 004_seed_data.sql
-- Description: Pre-seeded real Barbershop App & SaaS projects and bugs
-- ====================================================================

-- 1. Insert Initial Profiles
INSERT INTO public.ifb_profiles (id, username, full_name, avatar_url, role, reputation_score)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'mrdevs', 'Muhamad R.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'owner', 420),
  ('a0000000-0000-0000-0000-000000000002', 'alisher', 'Alisher Qodirov', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'developer', 280),
  ('a0000000-0000-0000-0000-000000000003', 'sarvar_qa', 'Sarvar Tester', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'qa_tester', 150)
ON CONFLICT (username) DO NOTHING;

-- 2. Insert Showcase Projects
INSERT INTO public.ifb_projects (id, name, slug, description, icon, color, is_public, allow_guest_reports, tech_stack, github_repo_url, created_by)
VALUES 
  (
    'b0000000-0000-0000-0000-000000000001',
    'Barbershop Mobile App',
    'barbershop',
    'Professional hair salon & barbershop booking mobile application for Android & iOS.',
    'scissors',
    '#10b981',
    true,
    true,
    ARRAY['React Native', 'Expo', 'TypeScript', 'Supabase'],
    'https://github.com/mrdevs2011/bor1BUGS',
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'IFoundBug Cloud Platform',
    'ifoundbug',
    'Next-generation developer bug tracking and collaborative debugging platform.',
    'bug',
    '#6366f1',
    true,
    true,
    ARRAY['Next.js', 'TailwindCSS', 'Supabase Realtime'],
    'https://github.com/mrdevs2011/ifoundbug',
    'a0000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Project Members & Invites
INSERT INTO public.ifb_project_members (project_id, user_id, role)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'developer'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'qa_tester')
ON CONFLICT DO NOTHING;

INSERT INTO public.ifb_project_invites (project_id, token, role, max_uses, uses_count)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'barber-dev-invite-2026', 'developer', 50, 4),
  ('b0000000-0000-0000-0000-000000000001', 'barber-qa-public-invite', 'qa_tester', 200, 12)
ON CONFLICT (token) DO NOTHING;

INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B01',
    'b0000000-0000-0000-0000-000000000001',
    'Pastki panel (bottom bar) oʻzbekcha emas',
    'Oʻzbek tili tanlangan, lekin pastki panelda Home, Explore, Message, Account yozuvlari turibdi.',
    'lokalizatsiya',
    'Barcha asosiy ekranlar — pastki navigatsiya',
    'MEDIUM',
    'P2',
    'FIXED',
    'PRODUCTION',
    'Oʻzbek tili tanlangan, lekin pastki panelda Home, Explore, Message, Account yozuvlari turibdi.',
    'Uy, Qidirish, Xabarlar, Hisob. (Chatda ''Habarlar'' deb yozilgan — adabiy imlo ''Xabarlar''.)',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: Uy / Qidirish / Xabarlar / Hisob","checked":true},{"id":"ac-1","text":"en: Home / Explore / Messages / Account","checked":true},{"id":"ac-2","text":"ru: Главная / Поиск / Сообщения / Профиль","checked":true},{"id":"ac-3","text":"Til oʻzgarganda ilovani qayta ishga tushirmasdan yozuvlar yangilanadi","checked":true}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Tab nomlarini i18n kalitlariga oʻtkazing: `nav.home`, `nav.explore`, `nav.messages`, `nav.account`. Til almashganda navigator qayta render boʻlsin (tab label’lari koʻpincha navigator yaratilganda bir marta hisoblanadi — `tabBarLabel` ni funksiya qilib bering).\n\nDev Steps: Tab navigator konfiguratsiyasidan qattiq yozilgan ''Home'', ''Explore'', ''Message'', ''Account'' satrlarini toping; Ularni `t(''nav.home'')` kabi chaqiruvlar bilan almashtiring, label’ni til holatiga bogʻlang; uz/en/ru lugʻatlariga kalitlarni qoʻshing',
    ARRAY['Home','Explore','Message','Account','tabBarLabel','BottomTab'],
    ARRAY['/evidence/B01-01.jpg','/evidence/B09-01.jpg','/evidence/B04-01.jpg'],
    true,
    11,
    68,
    'Sarvar Tester',
    '## Vazifa: [B01] Pastki panel (bottom bar) oʻzbekcha emas

**Ekran:** Barcha asosiy ekranlar — pastki navigatsiya
**Jiddiylik:** Oʻrta

### Muammo
Oʻzbek tili tanlangan, lekin pastki panelda Home, Explore, Message, Account yozuvlari turibdi.

### Kutilgan natija
Uy, Qidirish, Xabarlar, Hisob. (Chatda ''Habarlar'' deb yozilgan — adabiy imlo ''Xabarlar''.)

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B01-01.jpg (1000010904.jpg), B09-01.jpg (1000010910.jpg), B04-01.jpg (1000010905.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Home`, `Explore`, `Message`, `Account`, `tabBarLabel`, `BottomTab`).
2. Tab navigator konfiguratsiyasidan qattiq yozilgan ''Home'', ''Explore'', ''Message'', ''Account'' satrlarini toping
3. Ularni `t(''nav.home'')` kabi chaqiruvlar bilan almashtiring, label’ni til holatiga bogʻlang
4. uz/en/ru lugʻatlariga kalitlarni qoʻshing
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Tab nomlarini i18n kalitlariga oʻtkazing: `nav.home`, `nav.explore`, `nav.messages`, `nav.account`. Til almashganda navigator qayta render boʻlsin (tab label’lari koʻpincha navigator yaratilganda bir marta hisoblanadi — `tabBarLabel` ni funksiya qilib bering).

### Qabul mezonlari
- [ ] uz: Uy / Qidirish / Xabarlar / Hisob
- [ ] en: Home / Explore / Messages / Account
- [ ] ru: Главная / Поиск / Сообщения / Профиль
- [ ] Til oʻzgarganda ilovani qayta ishga tushirmasdan yozuvlar yangilanadi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B02',
    'b0000000-0000-0000-0000-000000000001',
    'Splash ekranda ''design by addbrain'' yozuvi',
    'Splash ekranda ''design by addbrain'' yozuvi chiqadi.',
    'mahsulot',
    'Splash (yuklanish ekrani)',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Splash ekranda ''design by addbrain'' yozuvi chiqadi.',
    'Yozuv butunlay olib tashlansin; logotip markazda qoladi, boʻsh joy qolmaydi.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Splash’da ''addbrain'' soʻzi umuman yoʻq","checked":false},{"id":"ac-1","text":"Native va JS splash ikkalasida ham","checked":false},{"id":"ac-2","text":"Logotip joyi siljimagan, ortiqcha boʻsh joy yoʻq","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Splash komponentidan matn/rasmni oʻchiring. Native splash (Android `launch_background`, iOS LaunchScreen) va JS splash — ikkalasini ham tekshiring.\n\nDev Steps: Loyihada ''addbrain'' soʻzini qidiring (kod, rasm nomlari, native resurslar); Topilgan matn/rasmni olib tashlang; Logotip vertikal markazda qolishini tekshiring',
    ARRAY['addbrain','design by','Splash','LaunchScreen','launch_background'],
    ARRAY[]::text[],
    true,
    7,
    97,
    'Sarvar Tester',
    '## Vazifa: [B02] Splash ekranda ''design by addbrain'' yozuvi

**Ekran:** Splash (yuklanish ekrani)
**Jiddiylik:** Past

### Muammo
Splash ekranda ''design by addbrain'' yozuvi chiqadi.

### Kutilgan natija
Yozuv butunlay olib tashlansin; logotip markazda qoladi, boʻsh joy qolmaydi.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: Dalil skrinshoti hali qoʻshilmagan — muammo test qiluvchining yozma xabari asosida.
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `addbrain`, `design by`, `Splash`, `LaunchScreen`, `launch_background`).
2. Loyihada ''addbrain'' soʻzini qidiring (kod, rasm nomlari, native resurslar)
3. Topilgan matn/rasmni olib tashlang
4. Logotip vertikal markazda qolishini tekshiring
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Splash komponentidan matn/rasmni oʻchiring. Native splash (Android `launch_background`, iOS LaunchScreen) va JS splash — ikkalasini ham tekshiring.

### Qabul mezonlari
- [ ] Splash’da ''addbrain'' soʻzi umuman yoʻq
- [ ] Native va JS splash ikkalasida ham
- [ ] Logotip joyi siljimagan, ortiqcha boʻsh joy yoʻq

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B03',
    'b0000000-0000-0000-0000-000000000001',
    'Uchrashuvlar sahifasi boshqa sahifalardek ochilmaydi, orqaga surish Uy’ga olib ketadi',
    'Sahifa boshqa ichki sahifalardan farqli ochiladi. Ekran chetidan surib orqaga qaytilganda Hisob emas, Uy sahifasiga qaytadi. Header’da ← yoʻq.',
    'navigatsiya',
    'Hisob → Uchrashuvlar',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Sahifa boshqa ichki sahifalardan farqli ochiladi. Ekran chetidan surib orqaga qaytilganda Hisob emas, Uy sahifasiga qaytadi. Header’da ← yoʻq.',
    'Boshqa sahifalar kabi stack navigatsiya: swipe-back → Hisob; header chap tomonida ← (chevron-left).',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Hisob → Uchrashuvlar → swipe-back → Hisob","checked":false},{"id":"ac-1","text":"Header’da ← bor va bosilganda Hisob’ga qaytaradi","checked":false},{"id":"ac-2","text":"Android tizim ''Orqaga'' tugmasi ham Hisob’ga qaytaradi","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Uchrashuvlar ehtimol tab’ga `jumpTo`/`navigate(tab)` orqali ochilmoqda. Uni Hisob stack’iga `push` qiling. Umumiy `PageHeader` da `showBack` standart yoqilgan boʻlsin.\n\nDev Steps: Hisob ekranidagi Uchrashuvlar qatorining onPress handler’ini toping; Tab almashtirish oʻrniga Hisob stack’iga push qiling; Header’ga umumiy back tugmasini qoʻshing',
    ARRAY['Uchrashuvlar','Appointments','navigate(','jumpTo','PageHeader','showBack'],
    ARRAY[]::text[],
    true,
    8,
    58,
    'Sarvar Tester',
    '## Vazifa: [B03] Uchrashuvlar sahifasi boshqa sahifalardek ochilmaydi, orqaga surish Uy’ga olib ketadi

**Ekran:** Hisob → Uchrashuvlar
**Jiddiylik:** Kritik

### Muammo
Sahifa boshqa ichki sahifalardan farqli ochiladi. Ekran chetidan surib orqaga qaytilganda Hisob emas, Uy sahifasiga qaytadi. Header’da ← yoʻq.

### Kutilgan natija
Boshqa sahifalar kabi stack navigatsiya: swipe-back → Hisob; header chap tomonida ← (chevron-left).

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: Dalil skrinshoti hali qoʻshilmagan — muammo test qiluvchining yozma xabari asosida.
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Uchrashuvlar`, `Appointments`, `navigate(`, `jumpTo`, `PageHeader`, `showBack`).
2. Hisob ekranidagi Uchrashuvlar qatorining onPress handler’ini toping
3. Tab almashtirish oʻrniga Hisob stack’iga push qiling
4. Header’ga umumiy back tugmasini qoʻshing
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Uchrashuvlar ehtimol tab’ga `jumpTo`/`navigate(tab)` orqali ochilmoqda. Uni Hisob stack’iga `push` qiling. Umumiy `PageHeader` da `showBack` standart yoqilgan boʻlsin.

### Qabul mezonlari
- [ ] Hisob → Uchrashuvlar → swipe-back → Hisob
- [ ] Header’da ← bor va bosilganda Hisob’ga qaytaradi
- [ ] Android tizim ''Orqaga'' tugmasi ham Hisob’ga qaytaradi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B04',
    'b0000000-0000-0000-0000-000000000001',
    'Hisob sahifasi juda uzun — Sozlamalar va Yordam alohida sahifaga',
    'Profil, tashriflar, toʻlov, sozlamalar, yordam, chiqish va hisobni oʻchirish — hammasi bitta uzun sahifada.',
    'navigatsiya',
    'Hisob',
    'MEDIUM',
    'P2',
    'IN_PROGRESS',
    'PRODUCTION',
    'Profil, tashriflar, toʻlov, sozlamalar, yordam, chiqish va hisobni oʻchirish — hammasi bitta uzun sahifada.',
    'Hisob: Profil, Uchrashuvlar, Saqlangan, Toʻlov, Sozlamalar (qator), Yordam (qator), Chiqish. Sozlamalar sahifasi: Bildirishnomalar, Tashqi koʻrinish, Til, Hisobni oʻchirish. Yordam sahifasi: FAQ, Foydalanish shartlari, Maxfiylik siyosati, Haqida. Yangi sahifalarda ←.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Hisob’da 7 tadan ortiq qator yoʻq","checked":false},{"id":"ac-1","text":"Sozlamalar va Yordam alohida ekran, ← bilan","checked":false},{"id":"ac-2","text":"Hamma eski funksiyalar yangi joyda ishlaydi","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Ikki yangi stack ekran yarating (`SettingsScreen`, `HelpScreen`) va mavjud qatorlarni ularga koʻchiring. Hisobni oʻchirish Sozlamalar ichida boʻlsin (xavfli amal — pastda, qizil).\n\nDev Steps: Hisob ekranidagi SOZLAMALAR va QOʻLLAB-QUVVATLASH guruhlarini alohida ekranlarga koʻchiring; Hisob’da ularning oʻrniga ikkita navigatsion qator qoldiring; Yangi ekranlar header’ida ← boʻlsin (B03 bilan bir xil komponent)',
    ARRAY['SOZLAMALAR','QO''LLAB-QUVVATLASH','Hisobni o''chirish','AccountScreen','ProfileScreen'],
    ARRAY['/evidence/B04-01.jpg','/evidence/B09-01.jpg'],
    true,
    7,
    32,
    'Sarvar Tester',
    '## Vazifa: [B04] Hisob sahifasi juda uzun — Sozlamalar va Yordam alohida sahifaga

**Ekran:** Hisob
**Jiddiylik:** Oʻrta

### Muammo
Profil, tashriflar, toʻlov, sozlamalar, yordam, chiqish va hisobni oʻchirish — hammasi bitta uzun sahifada.

### Kutilgan natija
Hisob: Profil, Uchrashuvlar, Saqlangan, Toʻlov, Sozlamalar (qator), Yordam (qator), Chiqish. Sozlamalar sahifasi: Bildirishnomalar, Tashqi koʻrinish, Til, Hisobni oʻchirish. Yordam sahifasi: FAQ, Foydalanish shartlari, Maxfiylik siyosati, Haqida. Yangi sahifalarda ←.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B04-01.jpg (1000010905.jpg), B09-01.jpg (1000010910.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `SOZLAMALAR`, `QO''LLAB-QUVVATLASH`, `Hisobni o''chirish`, `AccountScreen`, `ProfileScreen`).
2. Hisob ekranidagi SOZLAMALAR va QOʻLLAB-QUVVATLASH guruhlarini alohida ekranlarga koʻchiring
3. Hisob’da ularning oʻrniga ikkita navigatsion qator qoldiring
4. Yangi ekranlar header’ida ← boʻlsin (B03 bilan bir xil komponent)
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Ikki yangi stack ekran yarating (`SettingsScreen`, `HelpScreen`) va mavjud qatorlarni ularga koʻchiring. Hisobni oʻchirish Sozlamalar ichida boʻlsin (xavfli amal — pastda, qizil).

### Qabul mezonlari
- [ ] Hisob’da 7 tadan ortiq qator yoʻq
- [ ] Sozlamalar va Yordam alohida ekran, ← bilan
- [ ] Hamma eski funksiyalar yangi joyda ishlaydi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B05',
    'b0000000-0000-0000-0000-000000000001',
    'Filtr oynasida inglizcha yozuvlar',
    'Xizmat chip’lari Hair, Beard, Extras; masofa chip’lari Within 1 km … Within 10 km — inglizcha. Qoʻshimcha: ''Mirzo Ulugbek'' apostrofsiz.',
    'lokalizatsiya',
    'Qidirish → Filtr',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Xizmat chip’lari Hair, Beard, Extras; masofa chip’lari Within 1 km … Within 10 km — inglizcha. Qoʻshimcha: ''Mirzo Ulugbek'' apostrofsiz.',
    'Xizmat: Soch, Soqol, Qoʻshimcha. Masofa: 1 km gacha, 3 km gacha, 5 km gacha, 10 km gacha.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: Soch / Soqol / Qoʻshimcha","checked":false},{"id":"ac-1","text":"uz: 1 km gacha … 10 km gacha","checked":false},{"id":"ac-2","text":"en va ru da ham toʻgʻri","checked":false},{"id":"ac-3","text":"''Qoʻllash'' tugmasida apostrof boʻshligʻi yoʻq (B14)","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Masofa uchun parametrli kalit: `filter.within` = "{{km}} km gacha" (uz), "Within {{km}} km" (en), "В пределах {{km}} км" (ru). Kategoriya nomlari B06 dagi bilan bir xil manbadan olinsin.\n\nDev Steps: Filtr komponentidagi qattiq yozilgan chip matnlarini toping; Kategoriyalarni umumiy kategoriya tarjimasiga, masofani `filter.within` ga ulang; Tuman nomlarini ham tekshiring (B22)',
    ARRAY['Within','Hair','Beard','Extras','Filtr','FilterSheet'],
    ARRAY['/evidence/B05-01.jpg'],
    true,
    12,
    33,
    'Sarvar Tester',
    '## Vazifa: [B05] Filtr oynasida inglizcha yozuvlar

**Ekran:** Qidirish → Filtr
**Jiddiylik:** Oʻrta

### Muammo
Xizmat chip’lari Hair, Beard, Extras; masofa chip’lari Within 1 km … Within 10 km — inglizcha. Qoʻshimcha: ''Mirzo Ulugbek'' apostrofsiz.

### Kutilgan natija
Xizmat: Soch, Soqol, Qoʻshimcha. Masofa: 1 km gacha, 3 km gacha, 5 km gacha, 10 km gacha.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B05-01.jpg (1000010907.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Within`, `Hair`, `Beard`, `Extras`, `Filtr`, `FilterSheet`).
2. Filtr komponentidagi qattiq yozilgan chip matnlarini toping
3. Kategoriyalarni umumiy kategoriya tarjimasiga, masofani `filter.within` ga ulang
4. Tuman nomlarini ham tekshiring (B22)
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Masofa uchun parametrli kalit: `filter.within` = "{{km}} km gacha" (uz), "Within {{km}} km" (en), "В пределах {{km}} км" (ru). Kategoriya nomlari B06 dagi bilan bir xil manbadan olinsin.

### Qabul mezonlari
- [ ] uz: Soch / Soqol / Qoʻshimcha
- [ ] uz: 1 km gacha … 10 km gacha
- [ ] en va ru da ham toʻgʻri
- [ ] ''Qoʻllash'' tugmasida apostrof boʻshligʻi yoʻq (B14)

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B06',
    'b0000000-0000-0000-0000-000000000001',
    'Xizmat tanlash (1/3 qadam) ingliz tilida qolgan',
    '''Step 1 of 3 · Service'', kategoriyalar Hair/Beard/Extras, xizmatlar Classic Haircut, Beard Trim, Hair Wash, Styling — inglizcha.',
    'lokalizatsiya',
    'Band qilish → 1-qadam',
    'MEDIUM',
    'P2',
    'FIXED',
    'PRODUCTION',
    '''Step 1 of 3 · Service'', kategoriyalar Hair/Beard/Extras, xizmatlar Classic Haircut, Beard Trim, Hair Wash, Styling — inglizcha.',
    '''1/3 qadam · Xizmat''; Soch, Soqol, Qoʻshimcha; Klassik soch olish, Soqol tarash, Soch yuvish, Soch turmaklash (brief taklifi: ''Ukladka'' — ruscha oʻzlashma, adabiy variant tavsiya etiladi).',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz tanlanganda 1-qadamda inglizcha soʻz qolmaydi","checked":true},{"id":"ac-1","text":"Bazada har xizmatga uz/en/ru nom","checked":true},{"id":"ac-2","text":"Tarjima yoʻq boʻlsa en ga fallback, boʻsh joy chiqmaydi","checked":true}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Xizmat nomlari bazada: `service_translations(service_id, lang, name)` jadvali; API `Accept-Language` yoki `?lang=` boʻyicha tarjimani qaytarsin, tarjima yoʻq boʻlsa `en` ga fallback. ''Step X of Y'' — kodda: `booking.step` = "{{n}}/{{total}} qadam".\n\nDev Steps: Stepper komponentidagi ''Step'', ''of'', ''Service'', ''Time'', ''Confirm'' satrlarini i18n ga oʻtkazing (B18, B19 bilan bir yoʻla); Bazaga `service_translations` va `service_category_translations` qoʻshing, mavjud nomlarni migratsiya qiling; API javobida til boʻyicha nom qaytaring',
    ARRAY['Step','of 3','Service','Classic Haircut','Beard Trim','service_translations'],
    ARRAY['/evidence/B06-01.jpg'],
    true,
    8,
    91,
    'Sarvar Tester',
    '## Vazifa: [B06] Xizmat tanlash (1/3 qadam) ingliz tilida qolgan

**Ekran:** Band qilish → 1-qadam
**Jiddiylik:** Kritik

### Muammo
''Step 1 of 3 · Service'', kategoriyalar Hair/Beard/Extras, xizmatlar Classic Haircut, Beard Trim, Hair Wash, Styling — inglizcha.

### Kutilgan natija
''1/3 qadam · Xizmat''; Soch, Soqol, Qoʻshimcha; Klassik soch olish, Soqol tarash, Soch yuvish, Soch turmaklash (brief taklifi: ''Ukladka'' — ruscha oʻzlashma, adabiy variant tavsiya etiladi).

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B06-01.jpg (1000010908.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Step`, `of 3`, `Service`, `Classic Haircut`, `Beard Trim`, `service_translations`).
2. Stepper komponentidagi ''Step'', ''of'', ''Service'', ''Time'', ''Confirm'' satrlarini i18n ga oʻtkazing (B18, B19 bilan bir yoʻla)
3. Bazaga `service_translations` va `service_category_translations` qoʻshing, mavjud nomlarni migratsiya qiling
4. API javobida til boʻyicha nom qaytaring
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Xizmat nomlari bazada: `service_translations(service_id, lang, name)` jadvali; API `Accept-Language` yoki `?lang=` boʻyicha tarjimani qaytarsin, tarjima yoʻq boʻlsa `en` ga fallback. ''Step X of Y'' — kodda: `booking.step` = "{{n}}/{{total}} qadam".

### Qabul mezonlari
- [ ] uz tanlanganda 1-qadamda inglizcha soʻz qolmaydi
- [ ] Bazada har xizmatga uz/en/ru nom
- [ ] Tarjima yoʻq boʻlsa en ga fallback, boʻsh joy chiqmaydi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B07',
    'b0000000-0000-0000-0000-000000000001',
    'Barber profili: inglizcha bio va xizmatlar, ''Anonymous'', boʻsh sharh joyi',
    'Haqida: "Timur Nazarov has been cutting hair for 2 years." Xizmatlar inglizcha. Sharh muallifi ''Anonymous''. Matni yoʻq 5 yulduzli sharh kartasida boʻsh joy qolgan.',
    'lokalizatsiya',
    'Barber profili',
    'MEDIUM',
    'P2',
    'IN_PROGRESS',
    'PRODUCTION',
    'Haqida: "Timur Nazarov has been cutting hair for 2 years." Xizmatlar inglizcha. Sharh muallifi ''Anonymous''. Matni yoʻq 5 yulduzli sharh kartasida boʻsh joy qolgan.',
    'Bio va xizmat nomlari bazadan til boʻyicha; ''Anonim'' (uz) / ''Anonymous'' (en) / ''Аноним'' (ru); matnsiz sharhda faqat yulduz va sana, boʻsh qator yoʻq. Sharh matnlari ("Great cut…") tarjima qilinmaydi — bu foydalanuvchi kontenti.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: bio va xizmatlar oʻzbekcha","checked":false},{"id":"ac-1","text":"uz: ''Anonim''","checked":false},{"id":"ac-2","text":"Matnsiz sharh kartasi ixcham, ortiqcha boʻsh joysiz","checked":false},{"id":"ac-3","text":"Sharh matnlari oʻzgarmagan holda qoladi","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    '`barber_translations(barber_id, lang, bio)`; xizmat nomlari B06 dagi `service_translations` dan. Sharh kartasida `text` boʻsh boʻlsa matn bloki umuman render qilinmasin (marginlar ham). Avtomatik bio shabloni boʻlsa (''has been cutting hair for N years'') — i18n kalit: `barber.experience` = "{{name}} {{years}} yildan beri soch oladi".\n\nDev Steps: Bio va xizmat nomlarini til boʻyicha olish; ''Anonymous'' ni `review.anonymous` kalitiga oʻtkazish; ReviewCard’da boʻsh matn uchun shartli render',
    ARRAY['Anonymous','has been cutting hair','ReviewCard','bio'],
    ARRAY['/evidence/B07-01.jpg'],
    true,
    3,
    37,
    'Sarvar Tester',
    '## Vazifa: [B07] Barber profili: inglizcha bio va xizmatlar, ''Anonymous'', boʻsh sharh joyi

**Ekran:** Barber profili
**Jiddiylik:** Oʻrta

### Muammo
Haqida: "Timur Nazarov has been cutting hair for 2 years." Xizmatlar inglizcha. Sharh muallifi ''Anonymous''. Matni yoʻq 5 yulduzli sharh kartasida boʻsh joy qolgan.

### Kutilgan natija
Bio va xizmat nomlari bazadan til boʻyicha; ''Anonim'' (uz) / ''Anonymous'' (en) / ''Аноним'' (ru); matnsiz sharhda faqat yulduz va sana, boʻsh qator yoʻq. Sharh matnlari ("Great cut…") tarjima qilinmaydi — bu foydalanuvchi kontenti.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B07-01.jpg (1000010909.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Anonymous`, `has been cutting hair`, `ReviewCard`, `bio`).
2. Bio va xizmat nomlarini til boʻyicha olish
3. ''Anonymous'' ni `review.anonymous` kalitiga oʻtkazish
4. ReviewCard’da boʻsh matn uchun shartli render
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
`barber_translations(barber_id, lang, bio)`; xizmat nomlari B06 dagi `service_translations` dan. Sharh kartasida `text` boʻsh boʻlsa matn bloki umuman render qilinmasin (marginlar ham). Avtomatik bio shabloni boʻlsa (''has been cutting hair for N years'') — i18n kalit: `barber.experience` = "{{name}} {{years}} yildan beri soch oladi".

### Qabul mezonlari
- [ ] uz: bio va xizmatlar oʻzbekcha
- [ ] uz: ''Anonim''
- [ ] Matnsiz sharh kartasi ixcham, ortiqcha boʻsh joysiz
- [ ] Sharh matnlari oʻzgarmagan holda qoladi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B08',
    'b0000000-0000-0000-0000-000000000001',
    'Toʻlov usullarida Apple Pay',
    'Toʻlov usullari qatorida ''Apple Pay'' koʻrsatilgan (standart usul sifatida).',
    'mahsulot',
    'Hisob → Toʻlov usullari',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Toʻlov usullari qatorida ''Apple Pay'' koʻrsatilgan (standart usul sifatida).',
    'Apple Pay butunlay olib tashlansin (UI, kod, konfiguratsiya).',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Hisob va Toʻlov usullari sahifasida Apple Pay yoʻq","checked":false},{"id":"ac-1","text":"Kodda Apple Pay qoldigʻi yoʻq","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Apple Pay — Android’da ham koʻrinmoqda, bu qattiq yozilgan standart qiymatni koʻrsatadi. Toʻlov provayderlari roʻyxatidan, standart qiymatdan va bogʻliq SDK konfiguratsiyasidan olib tashlang.\n\nDev Steps: ''Apple Pay'' / ''applePay'' ni loyiha boʻylab qidiring; Roʻyxat, standart qiymat va konfiguratsiyadan olib tashlang; Standart usul boʻlmasa qatorda mos oʻzbekcha holat chiqsin (masalan ''Qoʻshilmagan'')',
    ARRAY['Apple Pay','applePay','PaymentMethods'],
    ARRAY['/evidence/B09-01.jpg','/evidence/B04-01.jpg'],
    true,
    16,
    51,
    'Sarvar Tester',
    '## Vazifa: [B08] Toʻlov usullarida Apple Pay

**Ekran:** Hisob → Toʻlov usullari
**Jiddiylik:** Past

### Muammo
Toʻlov usullari qatorida ''Apple Pay'' koʻrsatilgan (standart usul sifatida).

### Kutilgan natija
Apple Pay butunlay olib tashlansin (UI, kod, konfiguratsiya).

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B09-01.jpg (1000010910.jpg), B04-01.jpg (1000010905.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Apple Pay`, `applePay`, `PaymentMethods`).
2. ''Apple Pay'' / ''applePay'' ni loyiha boʻylab qidiring
3. Roʻyxat, standart qiymat va konfiguratsiyadan olib tashlang
4. Standart usul boʻlmasa qatorda mos oʻzbekcha holat chiqsin (masalan ''Qoʻshilmagan'')
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Apple Pay — Android’da ham koʻrinmoqda, bu qattiq yozilgan standart qiymatni koʻrsatadi. Toʻlov provayderlari roʻyxatidan, standart qiymatdan va bogʻliq SDK konfiguratsiyasidan olib tashlang.

### Qabul mezonlari
- [ ] Hisob va Toʻlov usullari sahifasida Apple Pay yoʻq
- [ ] Kodda Apple Pay qoldigʻi yoʻq

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B09',
    'b0000000-0000-0000-0000-000000000001',
    'Hisob sahifasidagi statistika inglizcha',
    'Statistika kartasida Visits, Upcoming, Saved.',
    'lokalizatsiya',
    'Hisob',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Statistika kartasida Visits, Upcoming, Saved.',
    'Tashriflar, Kelgusi, Saqlangan.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: Tashriflar / Kelgusi / Saqlangan","checked":false},{"id":"ac-1","text":"en/ru toʻgʻri","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Kalitlar: `account.stats.visits`, `account.stats.upcoming`, `account.stats.saved`.\n\nDev Steps: Statistika komponentidagi uch yozuvni i18n ga oʻtkazing; uz/en/ru tarjimalarini qoʻshing',
    ARRAY['Visits','Upcoming','Saved'],
    ARRAY['/evidence/B09-01.jpg','/evidence/B04-01.jpg'],
    true,
    8,
    26,
    'Sarvar Tester',
    '## Vazifa: [B09] Hisob sahifasidagi statistika inglizcha

**Ekran:** Hisob
**Jiddiylik:** Oʻrta

### Muammo
Statistika kartasida Visits, Upcoming, Saved.

### Kutilgan natija
Tashriflar, Kelgusi, Saqlangan.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B09-01.jpg (1000010910.jpg), B04-01.jpg (1000010905.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Visits`, `Upcoming`, `Saved`).
2. Statistika komponentidagi uch yozuvni i18n ga oʻtkazing
3. uz/en/ru tarjimalarini qoʻshing
4. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Kalitlar: `account.stats.visits`, `account.stats.upcoming`, `account.stats.saved`.

### Qabul mezonlari
- [ ] uz: Tashriflar / Kelgusi / Saqlangan
- [ ] en/ru toʻgʻri

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B10',
    'b0000000-0000-0000-0000-000000000001',
    'Hisobni oʻchirish sahifasida inglizcha tasdiqlash',
    '''Type DELETE to confirm'', ''Confirmation'' sarlavhasi, input ichida ''DELETE''.',
    'lokalizatsiya',
    'Sozlamalar → Hisobni oʻchirish',
    'MEDIUM',
    'P2',
    'IN_PROGRESS',
    'PRODUCTION',
    '''Type DELETE to confirm'', ''Confirmation'' sarlavhasi, input ichida ''DELETE''.',
    '''Tasdiqlash uchun OʻCHIRISH deb yozing'', sarlavha ''Tasdiqlash'', placeholder ''OʻCHIRISH''.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: matn, sarlavha va placeholder oʻzbekcha","checked":false},{"id":"ac-1","text":"OʻCHIRISH, OʻCHIRISH, ochirish — hammasi qabul qilinadi","checked":false},{"id":"ac-2","text":"en da DELETE, ru da УДАЛИТЬ ishlaydi","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Tasdiqlovchi soʻz lokalizatsiyalangan boʻlsin (uz: OʻCHIRISH, en: DELETE, ru: УДАЛИТЬ). Tekshiruv shu tildagi soʻz boʻyicha; katta-kichik harf va apostrof variantlari (`''`, `ʻ`, `’`, `‘`) normalizatsiya qilinsin. Foydalanuvchi chatda ''OCHIRISH'' deb yozgan — toʻgʻri imlo OʻCHIRISH, apostrofsiz kiritish ham qabul qilinsin.\n\nDev Steps: Matnlarni i18n ga oʻtkazing; Tasdiqlash soʻzini `account.delete.keyword` kalitidan oling; Solishtirishdan oldin ikkala tomonni normalizatsiya qiling: katta harf + apostroflarni olib tashlash',
    ARRAY['Type DELETE','Confirmation','DELETE','DeleteAccount'],
    ARRAY['/evidence/B10-01.jpg'],
    true,
    3,
    20,
    'Sarvar Tester',
    '## Vazifa: [B10] Hisobni oʻchirish sahifasida inglizcha tasdiqlash

**Ekran:** Sozlamalar → Hisobni oʻchirish
**Jiddiylik:** Oʻrta

### Muammo
''Type DELETE to confirm'', ''Confirmation'' sarlavhasi, input ichida ''DELETE''.

### Kutilgan natija
''Tasdiqlash uchun OʻCHIRISH deb yozing'', sarlavha ''Tasdiqlash'', placeholder ''OʻCHIRISH''.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B10-01.jpg (1000010911.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Type DELETE`, `Confirmation`, `DELETE`, `DeleteAccount`).
2. Matnlarni i18n ga oʻtkazing
3. Tasdiqlash soʻzini `account.delete.keyword` kalitidan oling
4. Solishtirishdan oldin ikkala tomonni normalizatsiya qiling: katta harf + apostroflarni olib tashlash
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Tasdiqlovchi soʻz lokalizatsiyalangan boʻlsin (uz: OʻCHIRISH, en: DELETE, ru: УДАЛИТЬ). Tekshiruv shu tildagi soʻz boʻyicha; katta-kichik harf va apostrof variantlari (`''`, `ʻ`, `’`, `‘`) normalizatsiya qilinsin. Foydalanuvchi chatda ''OCHIRISH'' deb yozgan — toʻgʻri imlo OʻCHIRISH, apostrofsiz kiritish ham qabul qilinsin.

### Qabul mezonlari
- [ ] uz: matn, sarlavha va placeholder oʻzbekcha
- [ ] OʻCHIRISH, OʻCHIRISH, ochirish — hammasi qabul qilinadi
- [ ] en da DELETE, ru da УДАЛИТЬ ishlaydi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B11',
    'b0000000-0000-0000-0000-000000000001',
    'Yordam va FAQ: 7 ta savol inglizcha',
    'Sarlavha va pastki blok oʻzbekcha, lekin 7 ta savolning hammasi (va javoblari) inglizcha.',
    'lokalizatsiya',
    'Hisob → Yordam va FAQ',
    'MEDIUM',
    'P2',
    'FIXED',
    'PRODUCTION',
    'Sarlavha va pastki blok oʻzbekcha, lekin 7 ta savolning hammasi (va javoblari) inglizcha.',
    'Savollar va javoblar uz/en/ru da. Taklif: (1) Bekor qilish yoki vaqtni oʻzgartirish uchun eng oxirgi muddat qachon? (2) Barber bronni bekor qilsa nima boʻladi? (3) Barber bronni koʻchirishni soʻrasa, rozi boʻlishim shartmi? (4) Bir vaqtda bir nechta xizmatni band qila olamanmi? (5) Toʻlov qachon yechiladi? (6) Sharhni qachon qoldirish mumkin? (7) Telefon raqamimni qanday oʻzgartiraman?',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: 7 ta savol va javob oʻzbekcha","checked":true},{"id":"ac-1","text":"en/ru da ham toʻliq","checked":true},{"id":"ac-2","text":"Pastki karta izohi toʻliq oʻqiladi","checked":true}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'FAQ kontentini i18n JSON yoki `faq_translations(faq_id, lang, question, answer)` jadvaliga koʻchiring. Pastki kartadagi izoh satri (''…eng tezkor yoʻl'') oʻng chetda kesilgan koʻrinadi — koʻp qatorga ruxsat bering.\n\nDev Steps: FAQ manbasini toping (statik massiv yoki API); Har savolga question+answer × 3 til; Izoh satrida `numberOfLines` cheklovini olib tashlang',
    ARRAY['How late can I cancel','When am I charged','faq','FAQ'],
    ARRAY['/evidence/B11-01.jpg'],
    true,
    14,
    38,
    'Sarvar Tester',
    '## Vazifa: [B11] Yordam va FAQ: 7 ta savol inglizcha

**Ekran:** Hisob → Yordam va FAQ
**Jiddiylik:** Oʻrta

### Muammo
Sarlavha va pastki blok oʻzbekcha, lekin 7 ta savolning hammasi (va javoblari) inglizcha.

### Kutilgan natija
Savollar va javoblar uz/en/ru da. Taklif: (1) Bekor qilish yoki vaqtni oʻzgartirish uchun eng oxirgi muddat qachon? (2) Barber bronni bekor qilsa nima boʻladi? (3) Barber bronni koʻchirishni soʻrasa, rozi boʻlishim shartmi? (4) Bir vaqtda bir nechta xizmatni band qila olamanmi? (5) Toʻlov qachon yechiladi? (6) Sharhni qachon qoldirish mumkin? (7) Telefon raqamimni qanday oʻzgartiraman?

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B11-01.jpg (1000010912.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `How late can I cancel`, `When am I charged`, `faq`, `FAQ`).
2. FAQ manbasini toping (statik massiv yoki API)
3. Har savolga question+answer × 3 til
4. Izoh satrida `numberOfLines` cheklovini olib tashlang
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
FAQ kontentini i18n JSON yoki `faq_translations(faq_id, lang, question, answer)` jadvaliga koʻchiring. Pastki kartadagi izoh satri (''…eng tezkor yoʻl'') oʻng chetda kesilgan koʻrinadi — koʻp qatorga ruxsat bering.

### Qabul mezonlari
- [ ] uz: 7 ta savol va javob oʻzbekcha
- [ ] en/ru da ham toʻliq
- [ ] Pastki karta izohi toʻliq oʻqiladi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B12',
    'b0000000-0000-0000-0000-000000000001',
    'Profilni tahrirlash: avatar tepadan kesilgan',
    'Avatar doirasining yuqori qismi header chizigʻida tekis kesilgan.',
    'ui',
    'Profilni tahrirlash',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Avatar doirasining yuqori qismi header chizigʻida tekis kesilgan.',
    'Avatar toʻliq doira boʻlib koʻrinsin.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Avatar doirasi toʻliq koʻrinadi","checked":false},{"id":"ac-1","text":"Rasm yuklanganda ham yuz kesilmaydi","checked":false},{"id":"ac-2","text":"Kichik ekranlarda ham","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Odatda ScrollView/konteynerga `overflow: hidden` + avatarga manfiy `marginTop` sabab boʻladi. Konteynerga yetarli `paddingTop` bering yoki manfiy marginni olib tashlang; rasm boʻlsa `object-fit: cover`, `object-position: center top`.\n\nDev Steps: EditProfile ekranidagi avatar konteynerini toping; Manfiy margin / overflow sababini aniqlang; Kichik (360px) va katta ekranda tekshiring',
    ARRAY['EditProfile','Rasm qo''shish','avatar','marginTop'],
    ARRAY['/evidence/B12-01.jpg','/evidence/B16-01.jpg'],
    true,
    11,
    58,
    'Sarvar Tester',
    '## Vazifa: [B12] Profilni tahrirlash: avatar tepadan kesilgan

**Ekran:** Profilni tahrirlash
**Jiddiylik:** Oʻrta

### Muammo
Avatar doirasining yuqori qismi header chizigʻida tekis kesilgan.

### Kutilgan natija
Avatar toʻliq doira boʻlib koʻrinsin.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B12-01.jpg (1000010913.jpg), B16-01.jpg (1000010914.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `EditProfile`, `Rasm qo''shish`, `avatar`, `marginTop`).
2. EditProfile ekranidagi avatar konteynerini toping
3. Manfiy margin / overflow sababini aniqlang
4. Kichik (360px) va katta ekranda tekshiring
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Odatda ScrollView/konteynerga `overflow: hidden` + avatarga manfiy `marginTop` sabab boʻladi. Konteynerga yetarli `paddingTop` bering yoki manfiy marginni olib tashlang; rasm boʻlsa `object-fit: cover`, `object-position: center top`.

### Qabul mezonlari
- [ ] Avatar doirasi toʻliq koʻrinadi
- [ ] Rasm yuklanganda ham yuz kesilmaydi
- [ ] Kichik ekranlarda ham

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B13',
    'b0000000-0000-0000-0000-000000000001',
    'Profilni tahrirlash: ''Telefon raqami'' kartasi saqlash tugmasi tagida qolgan',
    '''Telefon raqami'' kartasining pastki qismi sticky ''Oʻzgarishlarni saqlash'' paneli tagida yashiringan.',
    'ui',
    'Profilni tahrirlash (pastki qism)',
    'MEDIUM',
    'P2',
    'IN_PROGRESS',
    'PRODUCTION',
    '''Telefon raqami'' kartasining pastki qismi sticky ''Oʻzgarishlarni saqlash'' paneli tagida yashiringan.',
    'Kontent oxiri tugma ustida toʻliq koʻrinsin; klaviatura ochilganda ham.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Telefon kartasi toʻliq koʻrinadi va bosiladi","checked":false},{"id":"ac-1","text":"Klaviatura ochilganda ham kontent yopilmaydi","checked":false},{"id":"ac-2","text":"Gesture-navigation va 3-tugmali Android’da tekshirilgan","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'ScrollView `contentContainerStyle.paddingBottom` = tugma balandligi + safe-area inset (+16). Klaviatura uchun `KeyboardAvoidingView` / `adjustResize`.\n\nDev Steps: Sticky tugma balandligini oʻlchang; ScrollView kontentiga mos paddingBottom bering; Klaviatura ochiq holatda tekshiring',
    ARRAY['O''zgarishlarni saqlash','Telefon raqami','contentContainerStyle','paddingBottom'],
    ARRAY['/evidence/B12-01.jpg','/evidence/B16-01.jpg'],
    true,
    7,
    57,
    'Sarvar Tester',
    '## Vazifa: [B13] Profilni tahrirlash: ''Telefon raqami'' kartasi saqlash tugmasi tagida qolgan

**Ekran:** Profilni tahrirlash (pastki qism)
**Jiddiylik:** Kritik

### Muammo
''Telefon raqami'' kartasining pastki qismi sticky ''Oʻzgarishlarni saqlash'' paneli tagida yashiringan.

### Kutilgan natija
Kontent oxiri tugma ustida toʻliq koʻrinsin; klaviatura ochilganda ham.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B12-01.jpg (1000010913.jpg), B16-01.jpg (1000010914.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `O''zgarishlarni saqlash`, `Telefon raqami`, `contentContainerStyle`, `paddingBottom`).
2. Sticky tugma balandligini oʻlchang
3. ScrollView kontentiga mos paddingBottom bering
4. Klaviatura ochiq holatda tekshiring
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
ScrollView `contentContainerStyle.paddingBottom` = tugma balandligi + safe-area inset (+16). Klaviatura uchun `KeyboardAvoidingView` / `adjustResize`.

### Qabul mezonlari
- [ ] Telefon kartasi toʻliq koʻrinadi va bosiladi
- [ ] Klaviatura ochilganda ham kontent yopilmaydi
- [ ] Gesture-navigation va 3-tugmali Android’da tekshirilgan

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B14',
    'b0000000-0000-0000-0000-000000000001',
    'Apostrof atrofida boʻshliq (butun ilova boʻylab)',
    'Oʻzbekcha matnlarda apostrof harflardan alohida turadi: "To'' liq", "Tug'' ilgan", "to'' g'' rimi", "Qo'' llash". Bazadan kelgan ''14 Mahtumquli koʻchasi'' (oddiy '' U+0027) esa toʻgʻri chiqadi.',
    'lokalizatsiya',
    'Barcha ekranlar',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Oʻzbekcha matnlarda apostrof harflardan alohida turadi: "To'' liq", "Tug'' ilgan", "to'' g'' rimi", "Qo'' llash". Bazadan kelgan ''14 Mahtumquli koʻchasi'' (oddiy '' U+0027) esa toʻgʻri chiqadi.',
    'Toʻliq, Tugʻilgan, toʻgʻrimi, Qoʻllash — boʻshliqsiz, butun ilovada bitta apostrof belgisi.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Hech bir uz satrda apostrof atrofida boʻshliq koʻrinmaydi","checked":false},{"id":"ac-1","text":"Butun loyihada bitta apostrof belgisi","checked":false},{"id":"ac-2","text":"CI’da regex tekshiruvi","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Gipoteza (dalil asosida): UI matnlari U+02BB (ʻ) yoki U+2018 bilan yozilgan va ilova shriftida bu glif yoʻq → tizim zaxira shriftiga oʻtadi, kenglik/side-bearing boshqa boʻlib boʻshliq paydo boʻladi. U+0027 bilan yozilgan manzil toʻgʻri koʻrinishi shuni tasdiqlaydi. Avval matnda haqiqiy boʻshliq bormi — regex bilan tekshiring: `\s[''ʻʼ’‘]\s|[a-zA-Z][''ʻʼ’‘]\s[a-z]`. Soʻng: (a) shriftga U+02BB glifini qoʻshing / glifi bor shriftga oʻting, yoki (b) butun loyihada bitta belgiga (U+02BB yoki U+2019) oʻting.\n\nDev Steps: uz lugʻatida va bazada apostrof atrofidagi boʻshliqni regex bilan qidiring va tozalang; Ishlatilayotgan apostrof belgisini aniqlang (U+02BB / U+2018 / U+2019 / U+0027); Shriftda shu glif borligini tekshiring; boʻlmasa glifi bor belgiga yoki shriftga oʻting; Barcha satrlarni bitta standart belgiga keltiring va lint qoidasi qoʻshing',
    ARRAY['ʻ','‘','’','uz.json','fontFamily'],
    ARRAY['/evidence/B14-01.jpg','/evidence/B14-02.jpg','/evidence/B14-03.jpg','/evidence/B12-01.jpg','/evidence/B19-02.jpg','/evidence/B19-03.jpg','/evidence/B05-01.jpg','/evidence/B01-01.jpg','/evidence/B04-01.jpg','/evidence/B09-01.jpg','/evidence/B18-01.jpg','/evidence/B19-01.jpg','/evidence/B10-01.jpg','/evidence/B11-01.jpg'],
    true,
    7,
    53,
    'Sarvar Tester',
    '## Vazifa: [B14] Apostrof atrofida boʻshliq (butun ilova boʻylab)

**Ekran:** Barcha ekranlar
**Jiddiylik:** Oʻrta

### Muammo
Oʻzbekcha matnlarda apostrof harflardan alohida turadi: "To'' liq", "Tug'' ilgan", "to'' g'' rimi", "Qo'' llash". Bazadan kelgan ''14 Mahtumquli koʻchasi'' (oddiy '' U+0027) esa toʻgʻri chiqadi.

### Kutilgan natija
Toʻliq, Tugʻilgan, toʻgʻrimi, Qoʻllash — boʻshliqsiz, butun ilovada bitta apostrof belgisi.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B14-01.jpg (1000010920.jpg), B14-02.jpg (1000010922.jpg), B14-03.jpg (1000010924.jpg), B12-01.jpg (1000010913.jpg), B19-02.jpg (1000010917.jpg), B19-03.jpg (1000010918.jpg), B05-01.jpg (1000010907.jpg), B01-01.jpg (1000010904.jpg), B04-01.jpg (1000010905.jpg), B09-01.jpg (1000010910.jpg), B18-01.jpg (1000010915.jpg), B19-01.jpg (1000010916.jpg), B10-01.jpg (1000010911.jpg), B11-01.jpg (1000010912.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `ʻ`, `‘`, `’`, `uz.json`, `fontFamily`).
2. uz lugʻatida va bazada apostrof atrofidagi boʻshliqni regex bilan qidiring va tozalang
3. Ishlatilayotgan apostrof belgisini aniqlang (U+02BB / U+2018 / U+2019 / U+0027)
4. Shriftda shu glif borligini tekshiring; boʻlmasa glifi bor belgiga yoki shriftga oʻting
5. Barcha satrlarni bitta standart belgiga keltiring va lint qoidasi qoʻshing
6. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Gipoteza (dalil asosida): UI matnlari U+02BB (ʻ) yoki U+2018 bilan yozilgan va ilova shriftida bu glif yoʻq → tizim zaxira shriftiga oʻtadi, kenglik/side-bearing boshqa boʻlib boʻshliq paydo boʻladi. U+0027 bilan yozilgan manzil toʻgʻri koʻrinishi shuni tasdiqlaydi. Avval matnda haqiqiy boʻshliq bormi — regex bilan tekshiring: `\s[''ʻʼ’‘]\s|[a-zA-Z][''ʻʼ’‘]\s[a-z]`. Soʻng: (a) shriftga U+02BB glifini qoʻshing / glifi bor shriftga oʻting, yoki (b) butun loyihada bitta belgiga (U+02BB yoki U+2019) oʻting.

### Qabul mezonlari
- [ ] Hech bir uz satrda apostrof atrofida boʻshliq koʻrinmaydi
- [ ] Butun loyihada bitta apostrof belgisi
- [ ] CI’da regex tekshiruvi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B15',
    'b0000000-0000-0000-0000-000000000001',
    'Email maydoni placeholder’i inglizcha (you@example.com)',
    'Elektron pochta maydonida ''you@example.com''.',
    'lokalizatsiya',
    'Profilni tahrirlash',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Elektron pochta maydonida ''you@example.com''.',
    'uz: ''ism@misol.uz''; en: ''you@example.com''; ru: ''you@example.com''.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz da ''ism@misol.uz''","checked":false},{"id":"ac-1","text":"en/ru da mos namuna","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Placeholder’ni `profile.email.placeholder` kalitiga oʻtkazing.\n\nDev Steps: Placeholder satrini toping; i18n kalitiga oʻtkazing',
    ARRAY['you@example.com','placeholder'],
    ARRAY['/evidence/B12-01.jpg'],
    true,
    14,
    42,
    'Sarvar Tester',
    '## Vazifa: [B15] Email maydoni placeholder’i inglizcha (you@example.com)

**Ekran:** Profilni tahrirlash
**Jiddiylik:** Past

### Muammo
Elektron pochta maydonida ''you@example.com''.

### Kutilgan natija
uz: ''ism@misol.uz''; en: ''you@example.com''; ru: ''you@example.com''.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B12-01.jpg (1000010913.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `you@example.com`, `placeholder`).
2. Placeholder satrini toping
3. i18n kalitiga oʻtkazing
4. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Placeholder’ni `profile.email.placeholder` kalitiga oʻtkazing.

### Qabul mezonlari
- [ ] uz da ''ism@misol.uz''
- [ ] en/ru da mos namuna

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B16',
    'b0000000-0000-0000-0000-000000000001',
    'Tugʻilgan sana: tizim kalendari ochiladi (inglizcha, yashil)',
    'Telefonning standart kalendari ochiladi: inglizcha (''Sat, Jan 1'', ''January 2000'', CANCEL/OK), yashil rang, qurilmaga qarab turlicha; yil tanlash noqulay (2000 dan orqaga uzoq varaqlash).',
    'komponent',
    'Profilni tahrirlash → Tugʻilgan sana',
    'MEDIUM',
    'P2',
    'FIXED',
    'PRODUCTION',
    'Telefonning standart kalendari ochiladi: inglizcha (''Sat, Jan 1'', ''January 2000'', CANCEL/OK), yashil rang, qurilmaga qarab turlicha; yil tanlash noqulay (2000 dan orqaga uzoq varaqlash).',
    'Maxsus date picker: qora fon, sariq accent; oʻzbekcha oylar (Yanvar … Dekabr) va kunlar (Du Se Ch Pa Ju Sh Ya); tugmalar ''Bekor qilish'' / ''Tasdiqlash''; yil bosilganda yillar toʻri yoki gʻildirak; barcha qurilmada bir xil.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Picker qora/sariq, oʻzbekcha","checked":true},{"id":"ac-1","text":"Bekor qilish / Tasdiqlash","checked":true},{"id":"ac-2","text":"Istalgan yilni 3 ta bosishdan ko‘p bo‘lmagan holda tanlash mumkin","checked":true},{"id":"ac-3","text":"Android va iOS da bir xil","checked":true}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Native `DateTimePicker` oʻrniga oʻz komponentingiz (bottom sheet). Hafta Dushanbadan boshlansin. Yil koʻrinishi: 12 yillik toʻr + oʻn yillik sakrash; maksimal sana — bugun, minimal — 1920. Saqlash formati ISO (`YYYY-MM-DD`), koʻrsatish — `5-noyabr, 2026`.\n\nDev Steps: Tugʻilgan sana maydonining onPress’ida native picker chaqiruvini toping; Ilova uslubidagi maxsus picker komponentini yarating (saytdagi namunaga qarang); Oy/kun nomlarini i18n dan oling; Yil tanlash koʻrinishini qoʻshing',
    ARRAY['DateTimePicker','Tug''ilgan sana','birthDate','showDatePicker'],
    ARRAY['/evidence/B16-01.jpg'],
    true,
    16,
    52,
    'Sarvar Tester',
    '## Vazifa: [B16] Tugʻilgan sana: tizim kalendari ochiladi (inglizcha, yashil)

**Ekran:** Profilni tahrirlash → Tugʻilgan sana
**Jiddiylik:** Kritik

### Muammo
Telefonning standart kalendari ochiladi: inglizcha (''Sat, Jan 1'', ''January 2000'', CANCEL/OK), yashil rang, qurilmaga qarab turlicha; yil tanlash noqulay (2000 dan orqaga uzoq varaqlash).

### Kutilgan natija
Maxsus date picker: qora fon, sariq accent; oʻzbekcha oylar (Yanvar … Dekabr) va kunlar (Du Se Ch Pa Ju Sh Ya); tugmalar ''Bekor qilish'' / ''Tasdiqlash''; yil bosilganda yillar toʻri yoki gʻildirak; barcha qurilmada bir xil.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B16-01.jpg (1000010914.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `DateTimePicker`, `Tug''ilgan sana`, `birthDate`, `showDatePicker`).
2. Tugʻilgan sana maydonining onPress’ida native picker chaqiruvini toping
3. Ilova uslubidagi maxsus picker komponentini yarating (saytdagi namunaga qarang)
4. Oy/kun nomlarini i18n dan oling
5. Yil tanlash koʻrinishini qoʻshing
6. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Native `DateTimePicker` oʻrniga oʻz komponentingiz (bottom sheet). Hafta Dushanbadan boshlansin. Yil koʻrinishi: 12 yillik toʻr + oʻn yillik sakrash; maksimal sana — bugun, minimal — 1920. Saqlash formati ISO (`YYYY-MM-DD`), koʻrsatish — `5-noyabr, 2026`.

### Qabul mezonlari
- [ ] Picker qora/sariq, oʻzbekcha
- [ ] Bekor qilish / Tasdiqlash
- [ ] Istalgan yilni 3 ta bosishdan ko‘p bo‘lmagan holda tanlash mumkin
- [ ] Android va iOS da bir xil

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B17',
    'b0000000-0000-0000-0000-000000000001',
    'Barcha sharhlar sahifasida ''31 reviews'' inglizcha',
    'Profilda ''N ta sharh'' toʻgʻri, lekin roʻyxat sahifasida ''N reviews''.',
    'lokalizatsiya',
    'Barber profili → Barchasi → Sharhlar',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    'Profilda ''N ta sharh'' toʻgʻri, lekin roʻyxat sahifasida ''N reviews''.',
    '''N ta sharh'' — i18n pluralization orqali.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: ''31 ta sharh''","checked":false},{"id":"ac-1","text":"ru: ''31 отзыв'', ''32 отзыва'', ''35 отзывов''","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    '`reviews.count` kaliti, plural shakllari: uz (bitta shakl: ''{{count}} ta sharh''), en (one/other), ru (one/few/many). Profil sahifasidagi sharhlar bloki toʻgʻri ishlaydi — faqat ichki sahifa.\n\nDev Steps: Sharhlar roʻyxati sahifasida ''reviews'' satrini toping; Profil sahifasidagi kalitdan foydalaning',
    ARRAY['reviews','ta sharh','AllReviews'],
    ARRAY[]::text[],
    true,
    4,
    69,
    'Sarvar Tester',
    '## Vazifa: [B17] Barcha sharhlar sahifasida ''31 reviews'' inglizcha

**Ekran:** Barber profili → Barchasi → Sharhlar
**Jiddiylik:** Past

### Muammo
Profilda ''N ta sharh'' toʻgʻri, lekin roʻyxat sahifasida ''N reviews''.

### Kutilgan natija
''N ta sharh'' — i18n pluralization orqali.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: Dalil skrinshoti hali qoʻshilmagan — muammo test qiluvchining yozma xabari asosida.
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `reviews`, `ta sharh`, `AllReviews`).
2. Sharhlar roʻyxati sahifasida ''reviews'' satrini toping
3. Profil sahifasidagi kalitdan foydalaning
4. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
`reviews.count` kaliti, plural shakllari: uz (bitta shakl: ''{{count}} ta sharh''), en (one/other), ru (one/few/many). Profil sahifasidagi sharhlar bloki toʻgʻri ishlaydi — faqat ichki sahifa.

### Qabul mezonlari
- [ ] uz: ''31 ta sharh''
- [ ] ru: ''31 отзыв'', ''32 отзыва'', ''35 отзывов''

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B18',
    'b0000000-0000-0000-0000-000000000001',
    'Vaqtni tanlash (2/3 qadam): til, 24 soat, ''Hali erta'', tugma holati',
    '''Step 2 of 3 · Time''; sana qatorida ''Today'' inglizcha (qolganlari Pa/Ju/Sh); vaqtlar 12 soatlik (2:00 PM); ''Ishlamaydi · 9:00 AM – 10:30 AM'' va ''Hali erta · 11:00 AM – 1:30 PM'' — skrinshot 13:22 da olingan, ya’ni ''Hali erta'' deb koʻrsatilgan vaqtlar aslida oʻtib ketgan; pastdagi ''Vaqtni tanlang'' tugmasi xira va sarlavha bilan bir xil matnda.',
    'lokalizatsiya',
    'Band qilish → 2-qadam',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    '''Step 2 of 3 · Time''; sana qatorida ''Today'' inglizcha (qolganlari Pa/Ju/Sh); vaqtlar 12 soatlik (2:00 PM); ''Ishlamaydi · 9:00 AM – 10:30 AM'' va ''Hali erta · 11:00 AM – 1:30 PM'' — skrinshot 13:22 da olingan, ya’ni ''Hali erta'' deb koʻrsatilgan vaqtlar aslida oʻtib ketgan; pastdagi ''Vaqtni tanlang'' tugmasi xira va sarlavha bilan bir xil matnda.',
    '''2/3 qadam · Vaqt''; ''Bugun''; 24 soatlik (14:00, 17:30); oʻtgan vaqtlar ''Oʻtib ketgan'' (kulrang) yoki yashirilgan; nofaol tugma aniq farqlanadi va boshqa matnda (masalan ''Avval vaqtni tanlang''), faol holatda ''Davom etish''.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Ekranda inglizcha soʻz yoʻq","checked":false},{"id":"ac-1","text":"Barcha vaqtlar 24 soatlik","checked":false},{"id":"ac-2","text":"Oʻtgan vaqtlar ''Hali erta'' deb koʻrsatilmaydi","checked":false},{"id":"ac-3","text":"Nofaol va faol tugma aniq farq qiladi","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    '`Intl.DateTimeFormat(''uz'', {hour:''2-digit'', minute:''2-digit'', hour12:false})` yoki markaziy `formatTime`. ''Hali erta'' guruhi mantiqini tekshiring: hozirgi vaqtdan oldingi slotlar ''past'' deb belgilansin. Nofaol tugma WCAG AA kontrastda.\n\nDev Steps: Stepper matnlarini i18n ga oʻtkazing (B06 bilan birga); ''Today'' ni `common.today` ga oʻtkazing; Markaziy 24 soatlik vaqt formatlash util’iga oʻting; Slot guruhlash mantiqida ''early'' va ''past'' holatlarini ajrating; Tugma matni va disabled stilini yangilang',
    ARRAY['Step 2 of 3','Today','Hali erta','Ishlamaydi','AM','PM','hour12'],
    ARRAY['/evidence/B18-01.jpg'],
    true,
    10,
    21,
    'Sarvar Tester',
    '## Vazifa: [B18] Vaqtni tanlash (2/3 qadam): til, 24 soat, ''Hali erta'', tugma holati

**Ekran:** Band qilish → 2-qadam
**Jiddiylik:** Kritik

### Muammo
''Step 2 of 3 · Time''; sana qatorida ''Today'' inglizcha (qolganlari Pa/Ju/Sh); vaqtlar 12 soatlik (2:00 PM); ''Ishlamaydi · 9:00 AM – 10:30 AM'' va ''Hali erta · 11:00 AM – 1:30 PM'' — skrinshot 13:22 da olingan, ya’ni ''Hali erta'' deb koʻrsatilgan vaqtlar aslida oʻtib ketgan; pastdagi ''Vaqtni tanlang'' tugmasi xira va sarlavha bilan bir xil matnda.

### Kutilgan natija
''2/3 qadam · Vaqt''; ''Bugun''; 24 soatlik (14:00, 17:30); oʻtgan vaqtlar ''Oʻtib ketgan'' (kulrang) yoki yashirilgan; nofaol tugma aniq farqlanadi va boshqa matnda (masalan ''Avval vaqtni tanlang''), faol holatda ''Davom etish''.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B18-01.jpg (1000010915.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Step 2 of 3`, `Today`, `Hali erta`, `Ishlamaydi`, `AM`, `PM`, `hour12`).
2. Stepper matnlarini i18n ga oʻtkazing (B06 bilan birga)
3. ''Today'' ni `common.today` ga oʻtkazing
4. Markaziy 24 soatlik vaqt formatlash util’iga oʻting
5. Slot guruhlash mantiqida ''early'' va ''past'' holatlarini ajrating
6. Tugma matni va disabled stilini yangilang
7. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
`Intl.DateTimeFormat(''uz'', {hour:''2-digit'', minute:''2-digit'', hour12:false})` yoki markaziy `formatTime`. ''Hali erta'' guruhi mantiqini tekshiring: hozirgi vaqtdan oldingi slotlar ''past'' deb belgilansin. Nofaol tugma WCAG AA kontrastda.

### Qabul mezonlari
- [ ] Ekranda inglizcha soʻz yoʻq
- [ ] Barcha vaqtlar 24 soatlik
- [ ] Oʻtgan vaqtlar ''Hali erta'' deb koʻrsatilmaydi
- [ ] Nofaol va faol tugma aniq farq qiladi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B19',
    'b0000000-0000-0000-0000-000000000001',
    'Band qilish tafsilotlari (3/3 qadam) inglizcha',
    '''Step 3 of 3 · Confirm''; sana ''November 5, 2026''; vaqt ''1:00 PM – 2:05 PM''; xizmatlar ''Skin Fade'', ''Hair Wash''; davomiylik ''50 min'', ''15 min''. Qoʻshimcha: ''Tanlagan xizmatlaringiz'' — grammatik jihatdan ''Tanlangan xizmatlaringiz''.',
    'lokalizatsiya',
    'Band qilish → 3-qadam (Tasdiqlash)',
    'MEDIUM',
    'P2',
    'IN_PROGRESS',
    'PRODUCTION',
    '''Step 3 of 3 · Confirm''; sana ''November 5, 2026''; vaqt ''1:00 PM – 2:05 PM''; xizmatlar ''Skin Fade'', ''Hair Wash''; davomiylik ''50 min'', ''15 min''. Qoʻshimcha: ''Tanlagan xizmatlaringiz'' — grammatik jihatdan ''Tanlangan xizmatlaringiz''.',
    '''3/3 qadam · Tasdiqlash''; ''5-noyabr, 2026''; ''13:00 – 14:05''; oʻzbekcha xizmat nomlari; ''50 daqiqa'', ''15 daqiqa''; ''Tanlangan xizmatlaringiz''.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Ekranda inglizcha soʻz yoʻq","checked":false},{"id":"ac-1","text":"Sana ''5-noyabr, 2026'', vaqt 24 soatlik","checked":false},{"id":"ac-2","text":"Davomiylik ''daqiqa'' bilan","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Markaziy util: `formatDate(date, locale)` → ''5-noyabr, 2026''; `formatTime(date)` → 24 soat; `formatDuration(min, locale)` → ''50 daqiqa''. Xizmat nomlari B06 dagi manbadan.\n\nDev Steps: Stepper matnlari (B06/B18 bilan bir yoʻla); Sana/vaqt/davomiylikni markaziy util’larga oʻtkazing; Xizmat nomlarini til boʻyicha oling; ''Tanlagan'' → ''Tanlangan''',
    ARRAY['Step 3 of 3','Confirm','min','Skin Fade','toLocaleDateString','Tanlagan xizmatlaringiz'],
    ARRAY['/evidence/B19-02.jpg','/evidence/B19-03.jpg','/evidence/B19-01.jpg'],
    true,
    3,
    69,
    'Sarvar Tester',
    '## Vazifa: [B19] Band qilish tafsilotlari (3/3 qadam) inglizcha

**Ekran:** Band qilish → 3-qadam (Tasdiqlash)
**Jiddiylik:** Kritik

### Muammo
''Step 3 of 3 · Confirm''; sana ''November 5, 2026''; vaqt ''1:00 PM – 2:05 PM''; xizmatlar ''Skin Fade'', ''Hair Wash''; davomiylik ''50 min'', ''15 min''. Qoʻshimcha: ''Tanlagan xizmatlaringiz'' — grammatik jihatdan ''Tanlangan xizmatlaringiz''.

### Kutilgan natija
''3/3 qadam · Tasdiqlash''; ''5-noyabr, 2026''; ''13:00 – 14:05''; oʻzbekcha xizmat nomlari; ''50 daqiqa'', ''15 daqiqa''; ''Tanlangan xizmatlaringiz''.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B19-02.jpg (1000010917.jpg), B19-03.jpg (1000010918.jpg), B19-01.jpg (1000010916.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Step 3 of 3`, `Confirm`, `min`, `Skin Fade`, `toLocaleDateString`, `Tanlagan xizmatlaringiz`).
2. Stepper matnlari (B06/B18 bilan bir yoʻla)
3. Sana/vaqt/davomiylikni markaziy util’larga oʻtkazing
4. Xizmat nomlarini til boʻyicha oling
5. ''Tanlagan'' → ''Tanlangan''
6. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Markaziy util: `formatDate(date, locale)` → ''5-noyabr, 2026''; `formatTime(date)` → 24 soat; `formatDuration(min, locale)` → ''50 daqiqa''. Xizmat nomlari B06 dagi manbadan.

### Qabul mezonlari
- [ ] Ekranda inglizcha soʻz yoʻq
- [ ] Sana ''5-noyabr, 2026'', vaqt 24 soatlik
- [ ] Davomiylik ''daqiqa'' bilan

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B20',
    'b0000000-0000-0000-0000-000000000001',
    'YANGI: Narx 2- va 3-qadam orasida oʻzgaradi (Band qilish haqi 2 UZS)',
    '2-qadamda Jami 125 000 UZS. 3-qadamda kutilmaganda ''Band qilish haqi 2 UZS'' qatori paydo boʻladi va Jami 125 002 UZS boʻladi. 3-qadam sarlavhasi esa ''Quyidagi narx yakuniy'' deydi.',
    'mahsulot',
    'Band qilish → 2-qadam / 3-qadam',
    'MEDIUM',
    'P2',
    'REPORTED',
    'PRODUCTION',
    '2-qadamda Jami 125 000 UZS. 3-qadamda kutilmaganda ''Band qilish haqi 2 UZS'' qatori paydo boʻladi va Jami 125 002 UZS boʻladi. 3-qadam sarlavhasi esa ''Quyidagi narx yakuniy'' deydi.',
    'Agar band qilish haqi bor boʻlsa, u 2-qadamdagi jamida ham koʻrinsin (yoki xizmat kartasida oldindan aytilsin). 2 UZS — test konfiguratsiyasi qolgan boʻlishi mumkin; mahsulot jamoasi haqiqiy summani tasdiqlasin.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"2- va 3-qadamdagi Jami bir xil yoki farq oldindan aniq aytilgan","checked":false},{"id":"ac-1","text":"Fee summasi tasdiqlangan qiymatda","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Narx hisoblash bitta joyda boʻlsin (masalan `calcBookingTotal(services, fees)`), 2- va 3-qadam shu funksiyani chaqirsin. Booking fee konfiguratsiyasini (2 UZS) tekshiring. Ishonch 88% — bu ataylab qilingan qaror boʻlishi mumkin, shuning uchun ''TEKSHIRILSIN''.\n\nDev Steps: Booking fee qayerda qoʻshilishini toping; 2-qadam jamisini ham shu funksiyadan hisoblang; Fee summasini mahsulot jamoasi bilan tasdiqlang',
    ARRAY['Band qilish haqi','bookingFee','fee','Jami'],
    ARRAY['/evidence/B19-01.jpg','/evidence/B18-01.jpg','/evidence/B19-02.jpg'],
    true,
    17,
    48,
    'Sarvar Tester',
    '## Vazifa: [B20] YANGI: Narx 2- va 3-qadam orasida oʻzgaradi (Band qilish haqi 2 UZS)

**Ekran:** Band qilish → 2-qadam / 3-qadam
**Jiddiylik:** Oʻrta

### Muammo
2-qadamda Jami 125 000 UZS. 3-qadamda kutilmaganda ''Band qilish haqi 2 UZS'' qatori paydo boʻladi va Jami 125 002 UZS boʻladi. 3-qadam sarlavhasi esa ''Quyidagi narx yakuniy'' deydi.

### Kutilgan natija
Agar band qilish haqi bor boʻlsa, u 2-qadamdagi jamida ham koʻrinsin (yoki xizmat kartasida oldindan aytilsin). 2 UZS — test konfiguratsiyasi qolgan boʻlishi mumkin; mahsulot jamoasi haqiqiy summani tasdiqlasin.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B19-01.jpg (1000010916.jpg), B18-01.jpg (1000010915.jpg), B19-02.jpg (1000010917.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Band qilish haqi`, `bookingFee`, `fee`, `Jami`).
2. Booking fee qayerda qoʻshilishini toping
3. 2-qadam jamisini ham shu funksiyadan hisoblang
4. Fee summasini mahsulot jamoasi bilan tasdiqlang
5. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Narx hisoblash bitta joyda boʻlsin (masalan `calcBookingTotal(services, fees)`), 2- va 3-qadam shu funksiyani chaqirsin. Booking fee konfiguratsiyasini (2 UZS) tekshiring. Ishonch 88% — bu ataylab qilingan qaror boʻlishi mumkin, shuning uchun ''TEKSHIRILSIN''.

### Qabul mezonlari
- [ ] 2- va 3-qadamdagi Jami bir xil yoki farq oldindan aniq aytilgan
- [ ] Fee summasi tasdiqlangan qiymatda

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B21',
    'b0000000-0000-0000-0000-000000000001',
    'YANGI: Uy sahifasi headeridagi avatar boʻsh',
    'Oʻng yuqoridagi profil doirasi ichi boʻsh qora doira. Hisob sahifasida esa xuddi shu foydalanuvchi uchun ''R'' bosh harfi chiqadi.',
    'ui',
    'Bosh sahifa (Uy)',
    'MEDIUM',
    'P2',
    'FIXED',
    'PRODUCTION',
    'Oʻng yuqoridagi profil doirasi ichi boʻsh qora doira. Hisob sahifasida esa xuddi shu foydalanuvchi uchun ''R'' bosh harfi chiqadi.',
    'Rasm boʻlmasa — Hisob’dagi kabi bosh harf (R) koʻrsatilsin.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"Rasm yoʻq boʻlsa bosh harf koʻrinadi","checked":true},{"id":"ac-1","text":"Rasm bor boʻlsa rasm koʻrinadi","checked":true}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Header avatar komponenti fallback (initials) holatini qoʻllamaydi yoki ism yuklanmasdan render boʻlgan. Hisob’dagi avatar komponentini qayta ishlating. Ishonch 65% — skrinshot yuklanish paytida olingan boʻlishi mumkin.\n\nDev Steps: Uy header’idagi avatar komponentini toping; Hisob’dagi `Avatar` (initials fallback bilan) komponentiga almashtiring',
    ARRAY['HomeHeader','Avatar','initials'],
    ARRAY['/evidence/B01-01.jpg'],
    true,
    11,
    23,
    'Sarvar Tester',
    '## Vazifa: [B21] YANGI: Uy sahifasi headeridagi avatar boʻsh

**Ekran:** Bosh sahifa (Uy)
**Jiddiylik:** Past

### Muammo
Oʻng yuqoridagi profil doirasi ichi boʻsh qora doira. Hisob sahifasida esa xuddi shu foydalanuvchi uchun ''R'' bosh harfi chiqadi.

### Kutilgan natija
Rasm boʻlmasa — Hisob’dagi kabi bosh harf (R) koʻrsatilsin.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B01-01.jpg (1000010904.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `HomeHeader`, `Avatar`, `initials`).
2. Uy header’idagi avatar komponentini toping
3. Hisob’dagi `Avatar` (initials fallback bilan) komponentiga almashtiring
4. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Header avatar komponenti fallback (initials) holatini qoʻllamaydi yoki ism yuklanmasdan render boʻlgan. Hisob’dagi avatar komponentini qayta ishlating. Ishonch 65% — skrinshot yuklanish paytida olingan boʻlishi mumkin.

### Qabul mezonlari
- [ ] Rasm yoʻq boʻlsa bosh harf koʻrinadi
- [ ] Rasm bor boʻlsa rasm koʻrinadi

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
INSERT INTO public.ifb_bugs (
    code, project_id, title, summary, section, screen, severity, priority, status,
    environment, actual_behavior, expected_behavior, steps_to_reproduce, acceptance_criteria,
    device_telemetry, dev_notes, search_keys, evidence_urls, is_sensitive,
    upvotes_count, views_count, reporter_name, claude_code_prompt
  ) VALUES (
    'B22',
    'b0000000-0000-0000-0000-000000000001',
    'YANGI: Joy nomlari imlosi (''Tashkent'', ''Mirzo Ulugbek'')',
    'Joylashuv tanlagichda ''Chilonzor, Tashkent'' (inglizcha imlo); Filtrda ''Mirzo Ulugbek'' (apostrof tushib qolgan).',
    'lokalizatsiya',
    'Uy (joylashuv) va Filtr (Hudud)',
    'MEDIUM',
    'P2',
    'IN_PROGRESS',
    'PRODUCTION',
    'Joylashuv tanlagichda ''Chilonzor, Tashkent'' (inglizcha imlo); Filtrda ''Mirzo Ulugbek'' (apostrof tushib qolgan).',
    'uz: ''Chilonzor, Toshkent'', ''Mirzo Ulugʻbek''; en: ''Tashkent'', ''Mirzo Ulugbek''; ru: ''Ташкент'', ''Мирзо-Улугбек''.',
    '[]'::jsonb,
    '[{"id":"ac-0","text":"uz: Toshkent, Mirzo Ulugʻbek","checked":false},{"id":"ac-1","text":"en/ru mos","checked":false}]'::jsonb,
    '{"browser": "Chrome Mobile 128", "os": "Android 14", "resolution": "1080x2400", "viewport": "393x873"}'::jsonb,
    'Shahar va tuman nomlari ham `district_translations` / i18n orqali. B14 dagi bitta apostrof belgisi qoidasiga amal qiling.\n\nDev Steps: Shahar/tuman nomlari manbasini toping; uz/en/ru variantlarini qoʻshing',
    ARRAY['Tashkent','Mirzo Ulugbek','districts'],
    ARRAY['/evidence/B05-01.jpg','/evidence/B01-01.jpg'],
    true,
    11,
    56,
    'Sarvar Tester',
    '## Vazifa: [B22] YANGI: Joy nomlari imlosi (''Tashkent'', ''Mirzo Ulugbek'')

**Ekran:** Uy (joylashuv) va Filtr (Hudud)
**Jiddiylik:** Past

### Muammo
Joylashuv tanlagichda ''Chilonzor, Tashkent'' (inglizcha imlo); Filtrda ''Mirzo Ulugbek'' (apostrof tushib qolgan).

### Kutilgan natija
uz: ''Chilonzor, Toshkent'', ''Mirzo Ulugʻbek''; en: ''Tashkent'', ''Mirzo Ulugbek''; ru: ''Ташкент'', ''Мирзо-Улугбек''.

### Dalil
Bu bug quyidagi skrinshotlarda koʻrinadi: B05-01.jpg (1000010907.jpg), B01-01.jpg (1000010904.jpg)
(Rasmlar shu loyiha papkasida: assets/evidence/)

### Nima qilish kerak
1. Tegishli fayllarni top (qidiruv kalitlari: `Tashkent`, `Mirzo Ulugbek`, `districts`).
2. Shahar/tuman nomlari manbasini toping
3. uz/en/ru variantlarini qoʻshing
4. Barcha 3 til (uz/en/ru) uchun tekshir.

### Texnik izoh
Shahar va tuman nomlari ham `district_translations` / i18n orqali. B14 dagi bitta apostrof belgisi qoidasiga amal qiling.

### Qabul mezonlari
- [ ] uz: Toshkent, Mirzo Ulugʻbek
- [ ] en/ru mos

### Cheklovlar
- Boshqa ekranlarni buzma. Oʻzgarishni minimal tut.
- i18n kalitlarini yangi hard-code qilma.
- Tugatgach: oʻzgargan fayllar roʻyxati va qanday tekshirganingni yoz.
'
  );
