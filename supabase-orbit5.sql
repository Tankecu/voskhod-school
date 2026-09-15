-- ═══════════════════════════════════════════════════════════
-- VOSKHOD Orbit 5.0 — письменные работы (эссе) + магазин.
-- Вставь в Supabase → SQL Editor → Run (один раз).
-- ═══════════════════════════════════════════════════════════

create table if not exists writings (
  id         text primary key,
  student_id text not null,
  topic_id   text not null,
  title      text,
  text_body  text not null default '',
  word_count int default 0,
  status     text not null default 'draft',  -- draft | submitted | reviewed
  score      int,                             -- 0-100 от преподавателя
  feedback   text,
  reviewed_by text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists writings_student_idx on writings (student_id);
create index if not exists writings_status_idx on writings (status);

alter table writings enable row level security;

drop policy if exists "voskhod_anon_all" on writings;
create policy "voskhod_anon_all" on writings for all to anon, authenticated using (true) with check (true);
