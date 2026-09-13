-- ═══════════════════════════════════════════════════════════
-- VOSKHOD Orbit — патч RLS: разрешает приложению писать в базу.
-- Supabase по умолчанию включает RLS на новые таблицы, поэтому
-- без политик все INSERT/UPDATE/DELETE блокируются.
-- Вставь в Supabase → SQL Editor → Run (один раз).
-- ═══════════════════════════════════════════════════════════

alter table users        enable row level security;
alter table groups       enable row level security;
alter table lessons      enable row level security;
alter table homework     enable row level security;
alter table payments     enable row level security;
alter table attempts     enable row level security;
alter table custom_tests enable row level security;

drop policy if exists "voskhod_anon_all" on users;
create policy "voskhod_anon_all" on users for all to anon, authenticated using (true) with check (true);

drop policy if exists "voskhod_anon_all" on groups;
create policy "voskhod_anon_all" on groups for all to anon, authenticated using (true) with check (true);

drop policy if exists "voskhod_anon_all" on lessons;
create policy "voskhod_anon_all" on lessons for all to anon, authenticated using (true) with check (true);

drop policy if exists "voskhod_anon_all" on homework;
create policy "voskhod_anon_all" on homework for all to anon, authenticated using (true) with check (true);

drop policy if exists "voskhod_anon_all" on payments;
create policy "voskhod_anon_all" on payments for all to anon, authenticated using (true) with check (true);

drop policy if exists "voskhod_anon_all" on attempts;
create policy "voskhod_anon_all" on attempts for all to anon, authenticated using (true) with check (true);

drop policy if exists "voskhod_anon_all" on custom_tests;
create policy "voskhod_anon_all" on custom_tests for all to anon, authenticated using (true) with check (true);
