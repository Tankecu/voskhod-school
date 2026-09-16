-- ═══════════════════════════════════════════════════════════
-- VOSKHOD Orbit 5.5 — слова (spaced repetition) + Telegram.
-- Вставь в Supabase → SQL Editor → Run (один раз).
-- ═══════════════════════════════════════════════════════════

-- прогресс слов (spaced repetition)
create table if not exists vocab_progress (
  id         text primary key,
  student_id text not null,
  word_id    text not null,
  interval_days int not null default 1,
  next_review text not null default to_char(now(), 'YYYY-MM-DD'),
  streak     int not null default 0,
  seen       int not null default 0,
  correct    int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists vp_student_idx on vocab_progress (student_id);
create index if not exists vp_review_idx on vocab_progress (student_id, next_review);

-- связка логин ↔ telegram chat_id
create table if not exists tg_links (
  login    text primary key,
  chat_id  text not null,
  linked_at timestamptz not null default now()
);

alter table vocab_progress enable row level security;
alter table tg_links       enable row level security;

drop policy if exists "voskhod_anon_all" on vocab_progress;
create policy "voskhod_anon_all" on vocab_progress for all to anon, authenticated using (true) with check (true);
drop policy if exists "voskhod_anon_all" on tg_links;
create policy "voskhod_anon_all" on tg_links for all to anon, authenticated using (true) with check (true);
