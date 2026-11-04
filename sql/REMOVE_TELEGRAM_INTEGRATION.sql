-- Remove legacy Telegram integration settings from existing IFoundBug databases.
-- Safe to run repeatedly; no project, bug, user, or other application data is deleted.
begin;
alter table if exists public.ifb_projects
  drop column if exists telegram_webhook_enabled,
  drop column if exists telegram_bot_token,
  drop column if exists telegram_chat_id;
commit;
