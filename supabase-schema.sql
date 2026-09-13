-- ═══════════════════════════════════════════════════════════
-- VOSKHOD Orbit — схема Supabase
-- Вставь весь файл в Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

create table if not exists users (
  id        text primary key,
  login     text unique not null,
  pass_hash text not null,
  salt      text not null,
  role      text not null check (role in ('admin','teacher','student')),
  name      text not null,
  subject   text,
  group_id  text,
  active    boolean not null default true,
  xp        int not null default 0,
  streak    int not null default 0,
  last_active_day text,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id          text primary key,
  name        text not null,
  teacher_ids jsonb not null default '[]',
  student_ids jsonb not null default '[]'
);

create table if not exists lessons (
  id         text primary key,
  group_id   text,
  teacher_id text,
  subject    text,
  topic      text,
  date       text,
  start_time text,
  dur_min    int default 90,
  room       text,
  materials  jsonb default '[]',
  created_at timestamptz not null default now()
);

create table if not exists homework (
  id        text primary key,
  group_id  text,
  lesson_id text,
  title     text not null,
  descr     text,
  due       text,
  done_by   jsonb default '[]'
);

create table if not exists payments (
  id         text primary key,
  student_id text,
  month      text,            -- YYYY-MM
  amount     numeric,
  currency   text default 'UZS',
  method     text,            -- cash | click | payme | transfer
  status     text default 'paid',  -- paid | awaiting
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists attempts (
  id         text primary key,
  test_id    text,
  custom     boolean default false,
  student_id text,
  score      int,
  max        int,
  date       text,
  dur_sec    int,
  answers    jsonb default '[]',
  created_at timestamptz not null default now()
);

create table if not exists custom_tests (
  id              text primary key,
  title           text not null,
  subject         text,
  author_id       text,
  time_min        int default 10,
  assigned_groups jsonb default '[]',
  questions       jsonb default '[]',
  created_at      timestamptz not null default now()
);

-- Быстрая выборка попыток
create index if not exists attempts_student_idx on attempts (student_id);
create index if not exists attempts_test_idx    on attempts (test_id);
create index if not exists lessons_date_idx     on lessons (date);
create index if not exists payments_student_idx on payments (student_id);
