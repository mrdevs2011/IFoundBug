# IFoundBug (IFB) — Supabase SQL Migrations

Bu papkadagi SQL fayllar **IFoundBug** platformasining butun ma'lumotlar bazasi, RLS xavfsizlik qoidalari, Realtime sozlamalari, Storage bucketlari va dastlabki loyihalar ma'lumotlarini o'z ichiga oladi.

## Fayllar ketma-ketligi:
1. `001_initial_schema.sql` — Barcha jadvallar (`ifb_profiles`, `ifb_projects`, `ifb_project_members`, `ifb_project_invites`, `ifb_bugs`, `ifb_bug_comments`, `ifb_bug_audit_logs`, `ifb_bug_upvotes`).
2. `002_row_level_security.sql` — To'liq Row Level Security (RLS) xavfsizlik siyosatlari.
3. `003_realtime_and_triggers.sql` — Supabase Realtime xabarlashuv, avtomatik `updated_at` triggerlari va atomik upvote/view funksiyalari.
4. `004_seed_data.sql` — Dastlabki haqiqiy loyihalar va **bor1BUGS** dagi haqiqiy ilova buglari, ularning skrinshotlari, AI promptlari va qabul mezonlari.
5. `005_permissions_and_grants.sql` — PostgREST API uchun schema huquqlari va schema cache yangilash (`NOTIFY pgrst, 'reload schema'`).
6. `006_storage_buckets.sql` — `bug-attachments` storage bucket va skrinshotlar uchun public yuklash/o'qish RLS siyosati.

## Qanday ishga tushirish:
Supabase Dashboard -> **SQL Editor** bo'limiga kiring va fayllarni ketma-ketlikda yurgizing.
Agar PostgREST schema xatosi (PGRST205) kuzatilsa, `005_permissions_and_grants.sql` ni yurgizish orqali barcha huquqlarni bir zumda tiklash mumkin.
