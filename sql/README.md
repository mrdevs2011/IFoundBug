# IFoundBug (IFB) — Supabase SQL Migrations

Bu papkadagi SQL fayllar **IFoundBug** platformasining butun ma'lumotlar bazasi, RLS xavfsizlik qoidalari, Realtime sozlamalari va dastlabki haqiqiy loyiha buglarini o'z ichiga oladi.

## Fayllar ketma-ketligi:
1. `001_initial_schema.sql` — Barcha jadvallar (`ifb_profiles`, `ifb_projects`, `ifb_project_members`, `ifb_project_invites`, `ifb_bugs`, `ifb_bug_comments`, `ifb_bug_audit_logs`, `ifb_bug_upvotes`).
2. `002_row_level_security.sql` — To'liq Row Level Security (RLS) xavfsizlik siyosatlari.
3. `003_realtime_and_triggers.sql` — Supabase Realtime xabarlashuv, avtomatik `updated_at` triggerlari va atomik upvote/view funksiyalari.
4. `004_seed_data.sql` — Dastlabki demo loyihalar va **bor1BUGS** dagi 22 ta haqiqiy Barbershop ilovasi buglari, ularning skrinshotlari, AI promptlari va qabul mezonlari.

## Qanday ishga tushirish:
Supabase Dashboard -> **SQL Editor** bo'limiga kiring va fayllarni 1 dan 4 gacha ketma-ketlikda yurgizing.
