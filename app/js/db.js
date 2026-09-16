/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit 2.0 — слой данных с аутентификацией.
   Два адаптера за одним интерфейсом:
   • Local    — localStorage, работает сразу (одно устройство)
   • Supabase — общая база на все устройства (нужны ключи в config.js)
   Пароли хранятся только хэшем (SHA-256 + соль).
   UI читает из синхронного кэша, записи уходят в адаптер асинхронно.
   ═══════════════════════════════════════════════════════════ */

window.DB = (function () {
  'use strict';

  var TABLES = ['users', 'groups', 'lessons', 'homework', 'payments', 'attempts', 'custom_tests', 'mock_results', 'leads', 'writings', 'mastery', 'block_state', 'placement', 'plans_study', 'stardust', 'student_plans', 'vocab_progress', 'tg_links'];
  var LS_KEY = 'vo-db-v2';
  var SESSION_KEY = 'vo-session';

  var state = emptyState();
  var adapter = null;
  var initPromise = null;

  function emptyState() {
    return { users: [], groups: [], lessons: [], homework: [], payments: [], attempts: [], custom_tests: [], mock_results: [], leads: [], writings: [], mastery: [], block_state: [], placement: [], plans_study: [], stardust: [], student_plans: [], vocab_progress: [], tg_links: [] };
  }

  /* ── camelCase ↔ snake_case (для Supabase) ── */

  function toSnake(o) {
    if (!o || typeof o !== 'object') return o;
    var m = {};
    Object.keys(o).forEach(function (k) {
      m[k.replace(/[A-Z]/g, function (c) { return '_' + c.toLowerCase(); })] = o[k];
    });
    return m;
  }
  function toCamel(o) {
    if (!o || typeof o !== 'object') return o;
    var m = {};
    Object.keys(o).forEach(function (k) {
      m[k.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); })] = o[k];
    });
    return m;
  }

  /* ── адаптеры ── */

  var LocalAdapter = {
    name: 'local',
    pullAll: function () {
      try {
        var raw = localStorage.getItem(LS_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          TABLES.forEach(function (t) { if (Array.isArray(parsed[t])) state[t] = parsed[t]; });
        }
      } catch (e) { console.warn('db: local load failed', e); }
      return Promise.resolve();
    },
    upsert: function (table, record) {
      var i = state[table].findIndex(function (r) { return r.id === record.id; });
      if (i === -1) state[table].push(record); else state[table][i] = record;
      persistLocal();
      return Promise.resolve();
    },
    remove: function (table, id) {
      state[table] = state[table].filter(function (r) { return r.id !== id; });
      persistLocal();
      return Promise.resolve();
    },
  };

  function persistLocal() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('db: local save failed', e); }
  }

  var SupabaseAdapter = {
    name: 'supabase',
    headers: function (extra) {
      return Object.assign({
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }, extra || {});
    },
    pullAll: function () {
      return Promise.all(TABLES.map(function (t) {
        var table = t === 'custom_tests' ? 'custom_tests' : t;
        return fetch(CONFIG.SUPABASE_URL + '/rest/v1/' + table + '?select=*', { headers: this.headers() })
          .then(function (r) { if (!r.ok) throw new Error(table + ': ' + r.status); return r.json(); })
          .then(function (rows) { state[t] = (rows || []).map(toCamel); })
          .catch(function (e) { console.warn('db: pull ' + t, e.message); });
      }, this)).then(function () {});
    },
    upsert: function (table, record) {
      var i = state[table].findIndex(function (r) { return r.id === record.id; });
      if (i === -1) state[table].push(record); else state[table][i] = record;
      return fetch(CONFIG.SUPABASE_URL + '/rest/v1/' + table, {
        method: 'POST',
        headers: this.headers({ Prefer: 'resolution=merge-duplicates' }),
        body: JSON.stringify([toSnake(record)]),
      }).then(function (r) {
        if (!r.ok) console.warn('db: upsert ' + table, r.status);
      }).catch(function (e) { console.warn('db: upsert ' + table, e.message); });
    },
    remove: function (table, id) {
      state[table] = state[table].filter(function (r) { return r.id !== id; });
      return fetch(CONFIG.SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: this.headers(),
      }).catch(function (e) { console.warn('db: delete ' + table, e.message); });
    },
  };

  /* ── инициализация ── */

  function init() {
    if (initPromise) return initPromise;
    adapter = (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) ? SupabaseAdapter : LocalAdapter;
    initPromise = adapter.pullAll();
    return initPromise;
  }

  /* ── пароли (только хэш) ── */

  function sha256Hex(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }
  function randomSalt() {
    var a = new Uint8Array(8);
    crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function hashPassword(password, salt) { return sha256Hex(salt + ':' + password); }

  /* ── сессия ── */

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function setSession(uid) {
    if (uid) localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: uid, t: Date.now() }));
    else localStorage.removeItem(SESSION_KEY);
  }

  /* ── уровни-орбиты ── */

  var LEVELS = [
    { name: 'Стартовая площадка', min: 0 },
    { name: 'Выход на связь', min: 100 },
    { name: 'Разгон', min: 250 },
    { name: 'Невесомость', min: 450 },
    { name: 'Орбита', min: 700 },
    { name: 'Луна', min: 1000 },
    { name: 'Марс', min: 1400 },
    { name: 'Глубокий космос', min: 2000 },
  ];

  /* ── вспомогательные даты ── */

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function minutesNow() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function toMinutes(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }

  /* ═══════════ публичный API ═══════════ */

  var api = {
    init: init,
    refresh: function () { return adapter.pullAll(); },
    adapterName: function () { return adapter ? adapter.name : 'local'; },
    levels: LEVELS,

    /* ── аутентификация ── */

    needsSetup: function () { return state.users.length === 0; },

    createAdmin: function (name, login, password) {
      var salt = randomSalt();
      var self = this;
      return hashPassword(password, salt).then(function (hash) {
        var u = {
          id: 'u' + Date.now().toString(36), login: login.toLowerCase(), passHash: hash, salt: salt,
          role: 'admin', name: name, subject: 'Администратор', active: true,
          xp: 0, streak: 0, createdAt: todayIso(),
        };
        return adapter.upsert('users', u).then(function () { setSession(u.id); return u; });
      });
    },

    authLogin: function (login, password) {
      var self = this;
      var u = state.users.find(function (x) { return x.login === String(login).toLowerCase(); });
      if (!u) return Promise.resolve({ error: 'Пользователь с таким логином не найден' });
      if (u.active === false) return Promise.resolve({ error: 'Аккаунт отключён администратором' });
      /* Supabase: вход через серверный RPC — пароли и хэши недоступны клиенту.
         Если RPC ещё не создан (PGRST202) — откат на локальную проверку. */
      if (adapter.name === 'supabase') {
        return fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/voskhod_login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
          body: JSON.stringify({ p_login: String(login).toLowerCase(), p_password: password }),
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res && res.error) return { error: res.error };
          if (!res || !res.id) return self._legacyLogin(u, password); /* RPC не установлен */
          var fresh = toCamel(res);
          var i = state.users.findIndex(function (x) { return x.id === fresh.id; });
          if (i === -1) state.users.push(fresh); else state.users[i] = fresh;
          setSession(fresh.id);
          return { user: fresh };
        }).catch(function (e) {
          console.warn('db: rpc login', e.message);
          return self._legacyLogin(u, password);
        });
      }
      return self._legacyLogin(u, password);
    },

    _legacyLogin: function (u, password) {
      return hashPassword(password, u.salt).then(function (hash) {
        if (hash !== u.passHash) return { error: 'Неверный пароль' };
        setSession(u.id);
        return { user: u };
      });
    },

    authChangePassword: function (userId, oldPassword, newPassword) {
      var u = api.user(userId);
      if (!u) return Promise.resolve({ error: 'Нет пользователя' });
      if (adapter.name === 'supabase') {
        return fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/voskhod_change_password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
          body: JSON.stringify({ p_login: u.login, p_old: oldPassword, p_new: newPassword }),
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res && res.ok) return { ok: true };
          if (res && res.error) return res;
          /* RPC не установлен — локальная проверка через passHash из кэша */
          return hashPassword(oldPassword, u.salt).then(function (h) {
            if (h !== u.passHash) return { error: 'Текущий пароль неверный' };
            var salt = randomSalt();
            return hashPassword(newPassword, salt).then(function (hash) {
              u.salt = salt; u.passHash = hash;
              return adapter.upsert('users', u).then(function () { return { ok: true }; });
            });
          });
        }).catch(function () {
          return { error: 'Сервис недоступен, попробуй позже' };
        });
      }
      return hashPassword(oldPassword, u.salt).then(function (h) {
        if (h !== u.passHash) return { error: 'Текущий пароль неверный' };
        var salt = randomSalt();
        return hashPassword(newPassword, salt).then(function (hash) {
          u.salt = salt; u.passHash = hash;
          return adapter.upsert('users', u).then(function () { return { ok: true }; });
        });
      });
    },

    logout: function () { setSession(null); },
    session: function () { var s = getSession(); return s ? s.uid : null; },
    currentUser: function () { return api.user(api.session()); },

    /* ── пользователи (админ) ── */

    user: function (id) { return state.users.find(function (u) { return u.id === id; }) || null; },
    allUsers: function () { return state.users.slice(); },
    saveUser: function (u) {
      var exists = state.users.some(function (x) { return x.id === u.id; });
      if (state.users.some(function (x) { return x.login === u.login && x.id !== u.id; })) {
        return Promise.resolve({ error: 'Логин уже занят' });
      }
      if (u.role === 'student' && u.groupId) {
        var g = api.group(u.groupId);
        if (g && g.studentIds.indexOf(u.id) === -1) g.studentIds.push(u.id);
        state.groups.forEach(function (gr) {
          if (gr.id !== u.groupId) gr.studentIds = gr.studentIds.filter(function (s) { return s !== u.id; });
        });
        if (g) adapter.upsert('groups', g);
      }
      return adapter.upsert('users', u).then(function () { return { ok: true }; });
    },
    setUserActive: function (userId, active) {
      var u = api.user(userId);
      if (u) { u.active = active; return adapter.upsert('users', u); }
      return Promise.resolve();
    },
    resetPassword: function (userId, newPassword, adminLogin, adminPass) {
      var u = api.user(userId);
      if (!u) return Promise.resolve({ error: 'Нет пользователя' });
      /* Supabase: сброс только через RPC с подтверждением админа */
      if (adapter.name === 'supabase') {
        return fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/voskhod_set_password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
          body: JSON.stringify({ p_admin_login: adminLogin, p_admin_pass: adminPass, p_target_id: userId, p_new: newPassword }),
        }).then(function (r) { return r.json(); });
      }
      /* локальный адаптер: хэш на устройстве */
      var salt = randomSalt();
      return hashPassword(newPassword, salt).then(function (hash) {
        u.salt = salt; u.passHash = hash;
        return adapter.upsert('users', u).then(function () { return { ok: true }; });
      });
    },
    deleteUser: function (userId, adminLogin, adminPass) {
      state.groups.forEach(function (g) {
        g.studentIds = g.studentIds.filter(function (s) { return s !== userId; });
        g.teacherIds = g.teacherIds.filter(function (t) { return t !== userId; });
        adapter.upsert('groups', g);
      });
      /* Supabase: удаление через RPC с подтверждением админа */
      if (adapter.name === 'supabase') {
        return fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/voskhod_delete_user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
          body: JSON.stringify({ p_admin_login: adminLogin, p_admin_pass: adminPass, p_target_id: userId }),
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res && res.ok) state.users = state.users.filter(function (x) { return x.id !== userId; });
          return res;
        });
      }
      state.users = state.users.filter(function (x) { return x.id !== userId; });
      return Promise.resolve({ ok: true });
    },

    /* Supabase RPC: создать пользователя (хэш делает сервер, anon хэшей не владеет) */
    rpcCreateUser: function (adminLogin, adminPass, record, password) {
      return fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/voskhod_create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
        body: JSON.stringify({
          p_admin_login: adminLogin, p_admin_pass: adminPass,
          p_id: record.id, p_login: record.login, p_password: password,
          p_role: record.role, p_name: record.name,
          p_subject: record.subject || null, p_group_id: record.groupId || null, p_rate: record.rate || null,
        }),
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.error) return res;
        /* кладём копию без секретов в локальный кэш (passHash неизвестен) */
        var cached = Object.assign({}, record, { active: true, xp: 0, streak: 0, createdAt: api.todayIso() });
        var i = state.users.findIndex(function (x) { return x.id === cached.id; });
        if (i === -1) state.users.push(cached); else state.users[i] = cached;
        return { ok: true };
      });
    },

    /* Supabase RPC: начисление XP без правки служебных полей напрямую */
    rpcAddXp: function (studentId, amount) {
      return fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/voskhod_add_xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
        body: JSON.stringify({ p_user_id: studentId, p_amount: amount }),
      }).catch(function (e) { console.warn('db: add_xp', e.message); });
    },

    /* ── группы ── */

    group: function (id) { return state.groups.find(function (g) { return g.id === id; }) || null; },
    allGroups: function () { return state.groups.slice(); },
    groupsFor: function (user) {
      if (!user) return [];
      if (user.role === 'admin') return state.groups.slice();
      if (user.role === 'teacher') return state.groups.filter(function (g) { return g.teacherIds.indexOf(user.id) !== -1; });
      return state.groups.filter(function (g) { return g.studentIds.indexOf(user.id) !== -1; });
    },
    saveGroup: function (g) { return adapter.upsert('groups', g); },
    removeGroup: function (id) { return adapter.remove('groups', id); },

    /* ── уроки ── */

    lesson: function (id) { return state.lessons.find(function (l) { return l.id === id; }) || null; },
    lessonsFor: function (user) {
      var groupIds = api.groupsFor(user).map(function (g) { return g.id; });
      return state.lessons
        .filter(function (l) { return groupIds.indexOf(l.groupId) !== -1; })
        .sort(function (a, b) { return (a.date + ' ' + a.startTime).localeCompare(b.date + ' ' + b.startTime); });
    },
    lessonStatus: function (l) {
      var start = toMinutes(l.startTime), end = start + l.durMin, now = minutesNow();
      if (l.date < todayIso()) return 'past';
      if (l.date > todayIso()) return 'upcoming';
      if (now >= start && now < end) return 'live';
      return now < start ? 'today' : 'past';
    },
    nextLesson: function (user) {
      var ls = api.lessonsFor(user);
      for (var i = 0; i < ls.length; i++) {
        var st = api.lessonStatus(ls[i]);
        if (st === 'live' || st === 'today' || st === 'upcoming') return ls[i];
      }
      return null;
    },
    saveLesson: function (l) { return adapter.upsert('lessons', l); },
    removeLesson: function (id) {
      var hw = state.homework.filter(function (h) { return h.lessonId === id; });
      hw.forEach(function (h) { adapter.remove('homework', h.id); });
      state.homework = state.homework.filter(function (h) { return h.lessonId !== id; });
      return adapter.remove('lessons', id);
    },

    /* ── домашка ── */

    homework: function (id) { return state.homework.find(function (h) { return h.id === id; }) || null; },
    hwFor: function (user) {
      var groupIds = api.groupsFor(user).map(function (g) { return g.id; });
      return state.homework.filter(function (h) { return groupIds.indexOf(h.groupId) !== -1; })
        .sort(function (a, b) { return a.due.localeCompare(b.due); });
    },
    toggleHwDone: function (hwId, studentId) {
      var hw = api.homework(hwId);
      if (!hw) return Promise.resolve();
      var i = hw.doneBy.indexOf(studentId);
      if (i === -1) hw.doneBy.push(studentId); else hw.doneBy.splice(i, 1);
      return adapter.upsert('homework', hw);
    },
    saveHomework: function (h) { return adapter.upsert('homework', h); },
    removeHomework: function (id) { return adapter.remove('homework', id); },

    /* ── оплаты ── */

    allPayments: function () {
      return state.payments.slice().sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    },
    paymentsFor: function (studentId) {
      return state.payments.filter(function (p) { return p.studentId === studentId; })
        .sort(function (a, b) { return (b.month || '').localeCompare(a.month || ''); });
    },
    paymentStatusFor: function (studentId) {
      var now = new Date();
      var month = now.getFullYear() + '-' + pad(now.getMonth() + 1);
      var p = state.payments.find(function (x) { return x.studentId === studentId && x.month === month; });
      if (!p) return { month: month, status: 'none' };
      return { month: month, status: p.status, amount: p.amount, currency: p.currency, method: p.method };
    },
    savePayment: function (p) { return adapter.upsert('payments', p); },
    removePayment: function (id) { return adapter.remove('payments', id); },

    /* ── тесты: банк (статический) + созданные ── */

    test: function (id) {
      var b = (window.TEST_BANK || []).find(function (t) { return t.id === id; });
      if (b) return b;
      return state.custom_tests.find(function (t) { return t.id === id; }) || null;
    },
    testsFor: function (user) {
      var bank = (window.TEST_BANK || []);
      var custom = state.custom_tests.slice();
      if (user.role === 'admin' || user.role === 'teacher') return custom.concat(bank);
      var groupIds = api.groupsFor(user).map(function (g) { return g.id; });
      var okCustom = custom.filter(function (t) {
        return t.assignedGroups.some(function (g) { return groupIds.indexOf(g) !== -1; });
      });
      /* банк школы ('*') виден каждому ученику — даже без группы */
      var okBank = bank.filter(function (t) {
        return t.assignedGroups.indexOf('*') !== -1 ||
          t.assignedGroups.some(function (g) { return groupIds.indexOf(g) !== -1; });
      });
      return okCustom.concat(okBank);
    },
    saveTest: function (t) { return adapter.upsert('custom_tests', t); },
    removeTest: function (id) { return adapter.remove('custom_tests', id); },
    isCustomTest: function (id) { return id.indexOf('q') === 0 && !!state.custom_tests.find(function (t) { return t.id === id; }); },

    /* ── попытки ── */

    attempt: function (id) { return state.attempts.find(function (a) { return a.id === id; }) || null; },
    addAttempt: function (a) { return adapter.upsert('attempts', a); },
    attemptsForTest: function (testId) {
      return state.attempts.filter(function (a) { return a.testId === testId; });
    },
    attemptsBy: function (studentId) {
      return state.attempts.filter(function (a) { return a.studentId === studentId; })
        .sort(function (a, b) { return (b.date + (b.id || '')).localeCompare(a.date + (a.id || '')); });
    },
    allAttempts: function () {
      return state.attempts.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    },

    /* ── пробники SAT ── */

    saveMockResult: function (r) { return adapter.upsert('mock_results', r); },
    mockResultsBy: function (studentId) {
      return state.mock_results.filter(function (r) { return r.studentId === studentId; })
        .sort(function (a, b) { return (a.date + (a.id || '')).localeCompare(b.date + (b.id || '')); });
    },
    allMockResults: function () {
      return state.mock_results.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    },
    mockResult: function (id) { return state.mock_results.find(function (r) { return r.id === id; }) || null; },

    /* ── заявки с лендинга ── */

    saveLead: function (l) { return adapter.upsert('leads', l); },
    allLeads: function () {
      return state.leads.slice().sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    },
    newLeadsCount: function () {
      return state.leads.filter(function (l) { return l.status === 'new'; }).length;
    },
    setLeadStatus: function (id, status) {
      var l = state.leads.find(function (x) { return x.id === id; });
      if (l) { l.status = status; return adapter.upsert('leads', l); }
      return Promise.resolve();
    },
    deleteLead: function (id) { return adapter.remove('leads', id); },

    /* ── система обучения: мастерство, блоки, размещение, ★, планы ── */

    masteryFor: function (studentId) {
      return state.mastery.filter(function (m) { return m.studentId === studentId; });
    },
    masteryOf: function (studentId, topicId) {
      return state.mastery.find(function (m) { return m.studentId === studentId && m.topicId === topicId; }) || null;
    },
    saveMastery: function (m) { return adapter.upsert('mastery', m); },

    blockStates: function (studentId) {
      return state.block_state.filter(function (b) { return b.studentId === studentId; });
    },
    blockStateOf: function (studentId, blockId) {
      return state.block_state.find(function (b) { return b.studentId === studentId && b.blockId === blockId; }) || null;
    },
    saveBlockState: function (b) { return adapter.upsert('block_state', b); },

    placementOf: function (studentId) {
      var rows = state.placement.filter(function (p) { return p.studentId === studentId; });
      return rows.length ? rows[rows.length - 1] : null;
    },
    savePlacement: function (p) { return adapter.upsert('placement', p); },

    planStudyOf: function (studentId) {
      var rows = state.plans_study.filter(function (p) { return p.studentId === studentId; });
      return rows.length ? rows[rows.length - 1] : null;
    },
    savePlanStudy: function (p) { return adapter.upsert('plans_study', p); },

    stardustBalance: function (studentId) {
      return state.stardust.reduce(function (acc, s) {
        return acc + (s.studentId === studentId ? s.amount : 0);
      }, 0);
    },
    stardustLedger: function (studentId) {
      return state.stardust.filter(function (s) { return s.studentId === studentId; })
        .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    },
    saveWriting: function (w) { return adapter.upsert('writings', w); },
    writingsFor: function (studentId) {
      return state.writings.filter(function (w) { return w.studentId === studentId; })
        .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    },
    writingsForReview: function () {
      return state.writings.filter(function (w) { return w.status === 'submitted'; });
    },
    writing: function (id) { return state.writings.find(function (w) { return w.id === id; }) || null; },
    vocabProgressFor: function (studentId) {
      return state.vocab_progress.filter(function (v) { return v.studentId === studentId; });
    },
    vocabOf: function (studentId, wordId) {
      return state.vocab_progress.find(function (v) { return v.studentId === studentId && v.wordId === wordId; }) || null;
    },
    saveVocabProgress: function (v) { return adapter.upsert('vocab_progress', v); },
    tgLinkOf: function (login) {
      return state.tg_links.find(function (t) { return t.login === login; }) || null;
    },
    saveTgLink: function (t) { return adapter.upsert('tg_links', t); },
    addStardust: function (studentId, amount, reason) {
      var row = { id: api.newId('st'), studentId: studentId, amount: amount, reason: reason || '', createdAt: new Date().toISOString() };
      state.stardust.push(row);
      return adapter.upsert('stardust', row).then(function () { return row; });
    },

    studentPlanOf: function (studentId) {
      var rows = state.student_plans.filter(function (p) { return p.studentId === studentId; });
      return rows.length ? rows[rows.length - 1] : null;
    },
    saveStudentPlan: function (p) { return adapter.upsert('student_plans', p); },

    addXp: function (studentId, amount) {
      var u = api.user(studentId);
      if (!u) return Promise.resolve();
      u.xp = Math.max(0, (u.xp || 0) + amount);
      var today = todayIso();
      if (u.lastActiveDay !== today) {
        var yesterday = (function () { var d = addDays(new Date(), -1); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); })();
        u.streak = (u.lastActiveDay === yesterday) ? (u.streak || 0) + 1 : 1;
        u.lastActiveDay = today;
      }
      if (adapter.name === 'supabase') return api.rpcAddXp(studentId, amount);
      return adapter.upsert('users', u);
    },
    levelOf: function (xp) {
      xp = xp || 0;
      var cur = LEVELS[0];
      for (var i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) cur = LEVELS[i];
      return { level: cur, next: LEVELS[LEVELS.indexOf(cur) + 1] || null, index: LEVELS.indexOf(cur) };
    },

    /* утилиты для UI */
    newId: function (prefix) { return (prefix || 'x') + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); },
    todayIso: todayIso,
    hashPassword: hashPassword,
    randomSalt: randomSalt,
  };

  return api;
})();
