-- ═══════════════════════════════════════════════════════════
-- VOSKHOD Orbit 4.0 — система обучения: мастерство, зачёты,
-- уровни блоков, размещение, маршруты, звёздная пыль, планы.
-- Вставь в Supabase → SQL Editor → Run (один раз).
-- ═══════════════════════════════════════════════════════════

-- ставка преподавателя ($/час), задаёт админ
alter table users add column if not exists rate int default 0;

-- мастерство по темам: 1-100 (скрыто от ученика), зачёт 25 задач
create table if not exists mastery (
  id         text primary key,
  student_id text not null,
  topic_id   text not null,
  score      int not null default 0,
  attempts   int not null default 0,
  correct    int not null default 0,
  gate_passed boolean not null default false,
  gate_attempts int not null default 0,
  gate_best  int not null default 0,
  updated_at timestamptz not null default now()
);

-- состояние блока: уровень bronze/silver/gold/platinum + экзамены
create table if not exists block_state (
  id         text primary key,
  student_id text not null,
  block_id   text not null,
  level      text not null default 'bronze',
  score      int not null default 0,
  exams      jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- результаты вводного тестирования (placement)
create table if not exists placement (
  id          text primary key,
  student_id  text not null,
  date        text,
  answers     jsonb default '[]',
  topics      jsonb default '{}',   -- {topicId: начальное мастерство}
  block_starts jsonb default '{}',  -- {blockId: 'bronze'|'silver'}
  created_at  timestamptz not null default now()
);

-- маршруты обучения (составляет учитель с помощью системы)
create table if not exists plans_study (
  id         text primary key,
  student_id text not null,
  teacher_id text,
  topics     jsonb default '[]',    -- упорядоченный список topic_id
  status     text default 'draft',  -- draft | approved
  created_at timestamptz not null default now()
);

-- звёздная пыль: ledger начислений
create table if not exists stardust (
  id         text primary key,
  student_id text not null,
  amount     int not null,
  reason     text,
  created_at timestamptz not null default now()
);

-- тарифный план ученика (частота × длительность × ставка)
create table if not exists student_plans (
  id           text primary key,
  student_id   text not null,
  teacher_id   text,
  per_week     int not null default 2,
  duration_min int not null default 60,
  monthly      int not null default 0,  -- расчётная цена в месяц
  currency     text default 'USD',
  status       text default 'active',
  created_at   timestamptz not null default now()
);

create index if not exists mastery_student_idx on mastery (student_id);
create index if not exists mastery_topic_idx   on mastery (topic_id);
create index if not exists block_student_idx   on block_state (student_id);
create index if not exists stardust_student_idx on stardust (student_id);
create index if not exists plans_student_idx   on plans_study (student_id);
create index if not exists splans_student_idx  on student_plans (student_id);

-- RLS + политики (новые проекты Supabase включают RLS по умолчанию)
alter table mastery        enable row level security;
alter table block_state    enable row level security;
alter table placement      enable row level security;
alter table plans_study    enable row level security;
alter table stardust       enable row level security;
alter table student_plans  enable row level security;

drop policy if exists "voskhod_anon_all" on mastery;
create policy "voskhod_anon_all" on mastery for all to anon, authenticated using (true) with check (true);
drop policy if exists "voskhod_anon_all" on block_state;
create policy "voskhod_anon_all" on block_state for all to anon, authenticated using (true) with check (true);
drop policy if exists "voskhod_anon_all" on placement;
create policy "voskhod_anon_all" on placement for all to anon, authenticated using (true) with check (true);
drop policy if exists "voskhod_anon_all" on plans_study;
create policy "voskhod_anon_all" on plans_study for all to anon, authenticated using (true) with check (true);
drop policy if exists "voskhod_anon_all" on stardust;
create policy "voskhod_anon_all" on stardust for all to anon, authenticated using (true) with check (true);
drop policy if exists "voskhod_anon_all" on student_plans;
create policy "voskhod_anon_all" on student_plans for all to anon, authenticated using (true) with check (true);
