-- ═══════════════════════════════════════════════════════════
-- VOSKHOD Orbit — таблица результатов пробников SAT.
-- Вставь в Supabase → SQL Editor → Run (один раз).
-- ═══════════════════════════════════════════════════════════

create table if not exists mock_results (
  id         text primary key,
  student_id text,
  mock_id    text,
  total      int,
  rw         int,
  math       int,
  rw_raw     int,
  math_raw   int,
  dur_sec    int,
  date       text,
  answers    jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists mock_student_idx on mock_results (student_id);

alter table mock_results enable row level security;

drop policy if exists "voskhod_anon_all" on mock_results;
create policy "voskhod_anon_all" on mock_results for all to anon, authenticated using (true) with check (true);
