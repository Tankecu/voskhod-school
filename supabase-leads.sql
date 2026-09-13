-- ═══════════════════════════════════════════════════════════
-- VOSKHOD — таблица заявок с лендинга.
-- Вставь в Supabase → SQL Editor → Run (один раз).
-- ═══════════════════════════════════════════════════════════

create table if not exists leads (
  id         text primary key,
  name       text not null,
  contact    text not null,
  program    text,
  status     text not null default 'new',  -- new | done
  source     text default 'landing',
  created_at timestamptz not null default now()
);

alter table leads enable row level security;

drop policy if exists "voskhod_anon_insert" on leads;
create policy "voskhod_anon_insert" on leads for insert to anon, authenticated with check (true);

drop policy if exists "voskhod_anon_select" on leads;
create policy "voskhod_anon_select" on leads for select to anon, authenticated using (true);

drop policy if exists "voskhod_anon_update" on leads;
create policy "voskhod_anon_update" on leads for update to anon, authenticated using (true) with check (true);

drop policy if exists "voskhod_anon_delete" on leads;
create policy "voskhod_anon_delete" on leads for delete to anon, authenticated using (true);
