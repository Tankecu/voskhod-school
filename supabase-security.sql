-- ═══════════════════════════════════════════════════════════
-- VOSKHOD — безопасность: хэши паролей уходят в приватную
-- таблицу, вход/создание/сброс — только через RPC.
-- После выполнения этой функцииНИКТО с anon-ключом не сможет
-- прочитать хэши паролей.
-- Вставь в Supabase → SQL Editor → Run (один раз).
-- ═══════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- 1. приватное хранилище хэшей
create table if not exists private_auth (
  user_id   text primary key references users(id) on delete cascade,
  pass_hash text not null,
  salt      text not null
);

insert into private_auth (user_id, pass_hash, salt)
select id, pass_hash, salt from users
where pass_hash is not null and salt is not null
on conflict (user_id) do nothing;

alter table users drop column if exists pass_hash;
alter table users drop column if exists salt;

revoke all on private_auth from anon, authenticated;

-- 2. гранты на users: читать можно, менять — только безопасные поля
revoke insert, delete on users from anon;
revoke update on users from anon;
grant select on users to anon;
grant update (name, subject, rate, group_id, active, xp, streak, last_active_day) on users to anon;

-- 3. RPC: вход
create or replace function voskhod_login(p_login text, p_password text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  u users;
  a private_auth;
begin
  select * into u from users where login = lower(p_login) limit 1;
  if not found then
    return json_build_object('error', 'Пользователь с таким логином не найден');
  end if;
  if u.active = false then
    return json_build_object('error', 'Аккаунт отключён администратором');
  end if;
  select * into a from private_auth where user_id = u.id;
  if a.user_id is null then
    return json_build_object('error', 'Аккаунт не инициализирован');
  end if;
  if a.pass_hash <> encode(digest(a.salt || ':' || p_password, 'sha256'), 'hex') then
    return json_build_object('error', 'Неверный пароль');
  end if;
  return to_json(u);
end $$;

-- 4. RPC: смена пароля самим пользователем
create or replace function voskhod_change_password(p_login text, p_old text, p_new text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  a private_auth;
  new_hash text;
begin
  if length(p_new) < 6 then
    return json_build_object('error', 'Новый пароль: минимум 6 символов');
  end if;
  select * into a from private_auth where user_id = (select id from users where login = lower(p_login) limit 1);
  if a.user_id is null then
    return json_build_object('error', 'Пользователь не найден');
  end if;
  if a.pass_hash <> encode(digest(a.salt || ':' || p_old, 'sha256'), 'hex') then
    return json_build_object('error', 'Текущий пароль неверный');
  end if;
  new_hash := encode(digest(a.salt || ':' || p_new, 'sha256'), 'hex');
  update private_auth set pass_hash = new_hash where user_id = a.user_id;
  return json_build_object('ok', true);
end $$;

-- 5. RPC: создание пользователя (только админ — проверка его пароля внутри)
create or replace function voskhod_create_user(
  p_admin_login text, p_admin_pass text,
  p_id text, p_login text, p_password text,
  p_role text, p_name text,
  p_subject text default null,
  p_group_id text default null,
  p_rate int default null
) returns json
language plpgsql security definer set search_path = public as $$
declare
  admin users; aa private_auth; new_salt text; new_hash text; grp groups;
begin
  select * into admin from users where login = lower(p_admin_login) limit 1;
  if not found or admin.role <> 'admin' or admin.active = false then
    return json_build_object('error', 'Действие доступно только администратору');
  end if;
  select * into aa from private_auth where user_id = admin.id;
  if aa.pass_hash <> encode(digest(aa.salt || ':' || p_admin_pass, 'sha256'), 'hex') then
    return json_build_object('error', 'Пароль администратора неверный');
  end if;
  if exists (select 1 from users where login = lower(p_login)) then
    return json_build_object('error', 'Логин уже занят');
  end if;
  if length(p_password) < 6 then
    return json_build_object('error', 'Пароль: минимум 6 символов');
  end if;
  new_salt := substr(encode(gen_random_bytes(8), 'hex'), 1, 16);
  new_hash := encode(digest(new_salt || ':' || p_password, 'sha256'), 'hex');
  insert into users (id, login, role, name, subject, group_id, rate, active, xp, streak, created_at)
  values (p_id, lower(p_login), p_role, p_name,
    case when p_role = 'teacher' then p_subject when p_role = 'admin' then 'Администратор' end,
    case when p_role = 'student' then p_group_id end,
    case when p_role = 'teacher' then p_rate end,
    true, 0, 0, now());
  if p_role = 'admin' then
    update users set subject = 'Администратор' where id = p_id;
  end if;
  insert into private_auth (user_id, pass_hash, salt) values (p_id, new_hash, new_salt);
  if p_group_id is not null and p_role = 'student' then
    select * into grp from groups where id = p_group_id;
    if found and not (p_id = any(grp.student_ids)) then
      update groups set student_ids = student_ids || to_jsonb(p_id) where id = p_group_id;
    end if;
  end if;
  return json_build_object('ok', true, 'id', p_id);
end $$;

-- 6. RPC: сброс пароля ученику (админ подтверждает своим паролем)
create or replace function voskhod_set_password(
  p_admin_login text, p_admin_pass text,
  p_target_id text, p_new text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  admin users; aa private_auth; new_salt text; new_hash text;
begin
  select * into admin from users where login = lower(p_admin_login) limit 1;
  if not found or admin.role <> 'admin' or admin.active = false then
    return json_build_object('error', 'Действие доступно только администратору');
  end if;
  select * into aa from private_auth where user_id = admin.id;
  if aa.pass_hash <> encode(digest(aa.salt || ':' || p_admin_pass, 'sha256'), 'hex') then
    return json_build_object('error', 'Пароль администратора неверный');
  end if;
  if length(p_new) < 6 then
    return json_build_object('error', 'Пароль: минимум 6 символов');
  end if;
  new_salt := substr(encode(gen_random_bytes(8), 'hex'), 1, 16);
  new_hash := encode(digest(new_salt || ':' || p_new, 'sha256'), 'hex');
  update private_auth set pass_hash = new_hash, salt = new_salt where user_id = p_target_id;
  return json_build_object('ok', true);
end $$;

-- 7. RPC: удаление пользователя (админ)
create or replace function voskhod_delete_user(
  p_admin_login text, p_admin_pass text, p_target_id text
) returns json
language plpgsql security definer set search_path = public as $$
declare admin users; aa private_auth;
begin
  select * into admin from users where login = lower(p_admin_login) limit 1;
  if not found or admin.role <> 'admin' then
    return json_build_object('error', 'Действие доступно только администратору');
  end if;
  select * into aa from private_auth where user_id = admin.id;
  if aa.pass_hash <> encode(digest(aa.salt || ':' || p_admin_pass, 'sha256'), 'hex') then
    return json_build_object('error', 'Пароль администратора неверный');
  end if;
  if p_target_id = admin.id then
    return json_build_object('error', 'Нельзя удалить свой аккаунт');
  end if;
  delete from users where id = p_target_id;
  return json_build_object('ok', true);
end $$;

-- 8. RPC: начисление XP (не даём anon менять login/role напрямую)
create or replace function voskhod_add_xp(p_user_id text, p_amount int)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update users set
    xp = greatest(0, xp + p_amount),
    last_active_day = case
      when last_active_day = to_char(now(), 'YYYY-MM-DD') then last_active_day
      when last_active_day = to_char(now() - interval '1 day', 'YYYY-MM-DD') then to_char(now(), 'YYYY-MM-DD')
      else to_char(now(), 'YYYY-MM-DD') end,
    streak = case
      when last_active_day = to_char(now(), 'YYYY-MM-DD') then streak
      when last_active_day = to_char(now() - interval '1 day', 'YYYY-MM-DD') then streak + 1
      else 1 end
  where id = p_user_id;
end $$;

-- 9. политика UPDATE на users — разрешаем только безопасные поля
--    (RLS-политика уже есть, грант выше ограничивает колонки)
