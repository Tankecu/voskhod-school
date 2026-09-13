/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit — слой данных (localStorage, демо-режим).
   Весь доступ к данным — только через этот модуль, чтобы
   потом можно было пересадить на реальный бэкенд.
   ═══════════════════════════════════════════════════════════ */

window.DB = (function () {
  'use strict';

  var KEY = 'voskhod-orbit-db-v1';
  var SESSION_KEY = 'voskhod-orbit-session';
  var data = null;

  /* ── утилиты дат ── */

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function mondayOf(d) {
    var x = new Date(d); x.setHours(0, 0, 0, 0);
    var wd = (x.getDay() + 6) % 7; /* пн=0 */
    return addDays(x, -wd);
  }
  function todayIso() { return iso(new Date()); }

  function minutesNow() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function toMinutes(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }

  /* ── сиды ── */

  function seed() {
    var mon = mondayOf(new Date());
    var d = function (n) { return iso(addDays(mon, n)); };

    var teachers = [
      { id: 't1', role: 'teacher', name: 'Елена Смирнова', subject: 'SAT Math · Математика', tg: '@voskhod_placeholder' },
      { id: 't2', role: 'teacher', name: 'Джахонгир Рахимов', subject: 'Milliy Sertifikat · Математика', tg: '@voskhod_placeholder' },
      { id: 't3', role: 'teacher', name: 'Анна Ким', subject: 'English · SAT R/W · TOEFL', tg: '@voskhod_placeholder' },
    ];

    var students = [
      { id: 's1', role: 'student', name: 'Азиз Каримов', groupId: 'g1', xp: 340, streak: 4, lastActiveDay: todayIso() },
      { id: 's2', role: 'student', name: 'Диана Ким', groupId: 'g1', xp: 610, streak: 11, lastActiveDay: todayIso() },
      { id: 's3', role: 'student', name: 'Тимур Абдуллаев', groupId: 'g1', xp: 520, streak: 6, lastActiveDay: todayIso() },
      { id: 's4', role: 'student', name: 'Мадина Юсупова', groupId: 'g1', xp: 265, streak: 2, lastActiveDay: todayIso() },
      { id: 's5', role: 'student', name: 'Сардор Назаров', groupId: 'g1', xp: 180, streak: 1, lastActiveDay: todayIso() },
      { id: 's6', role: 'student', name: 'Камила Эргашева', groupId: 'g1', xp: 75, streak: 3, lastActiveDay: todayIso() },
      { id: 's7', role: 'student', name: 'Никита Волков', groupId: 'g1', xp: 430, streak: 5, lastActiveDay: todayIso() },
      { id: 's8', role: 'student', name: 'Дилноза Саидова', groupId: 'g1', xp: 120, streak: 2, lastActiveDay: todayIso() },
    ];

    var groups = [
      { id: 'g1', name: 'SAT 2026 · поток A', teacherIds: ['t1', 't2', 't3'], studentIds: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] },
      { id: 'g2', name: 'TOEFL Intensive', teacherIds: ['t3'], studentIds: ['s2', 's4', 's6'] },
    ];

    var lessons = [
      /* прошлая неделя — история */
      { id: 'lp1', groupId: 'g1', teacherId: 't1', subject: 'SAT Math', topic: 'Линейные уравнения и системы', date: d(-6), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'lp2', groupId: 'g1', teacherId: 't3', subject: 'SAT Reading', topic: 'Command of Evidence: разбор', date: d(-4), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },

      /* текущая неделя */
      { id: 'l1', groupId: 'g1', teacherId: 't1', subject: 'SAT Math', topic: 'Проценты, пропорции и масштаб', date: d(0), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo',
        materials: [{ name: 'Конспект: проценты', url: '#demo' }, { name: 'Задачник SAT Math, гл. 4', url: '#demo' }] },
      { id: 'l2', groupId: 'g1', teacherId: 't3', subject: 'SAT Reading & Writing', topic: 'Vocabulary in Context', date: d(1), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'l3', groupId: 'g2', teacherId: 't3', subject: 'TOEFL Speaking', topic: 'Independent Task: шаблон 45 секунд', date: d(1), start: '18:30', durMin: 60, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'l4', groupId: 'g1', teacherId: 't2', subject: 'Milliy Sertifikat', topic: 'Grammar: Present Perfect vs Past Simple', date: d(2), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'l5', groupId: 'g1', teacherId: 't1', subject: 'SAT Math', topic: 'Неравенства и модули', date: d(3), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'l6', groupId: 'g2', teacherId: 't3', subject: 'TOEFL Writing', topic: 'Integrated Essay: структура', date: d(3), start: '18:30', durMin: 60, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'l7', groupId: 'g1', teacherId: 't3', subject: 'SAT Reading & Writing', topic: 'Transitions и логика текста', date: d(4), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'l8', groupId: 'g1', teacherId: 't2', subject: 'Пробник SAT', topic: 'Полный пробник · модуль Math', date: d(5), start: '11:00', durMin: 120, room: 'https://meet.google.com/voskhod-demo' },

      /* следующая неделя */
      { id: 'ln1', groupId: 'g1', teacherId: 't1', subject: 'SAT Math', topic: 'Функции и графики', date: d(7), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },
      { id: 'ln2', groupId: 'g1', teacherId: 't3', subject: 'SAT Reading & Writing', topic: 'Expression of Ideas', date: d(8), start: '16:00', durMin: 90, room: 'https://meet.google.com/voskhod-demo' },
    ];

    var homework = [
      { id: 'h1', groupId: 'g1', lessonId: 'l1', title: 'Проценты: 12 задач из задачника', desc: 'Задачи 4.1–4.12, с полным решением', due: d(2), doneBy: ['s2', 's3', 's7'] },
      { id: 'h2', groupId: 'g1', lessonId: 'lp2', title: 'Reading: разбор passage 3', desc: 'Вопросы 21–30 с обоснованием ответов', due: d(-2), doneBy: ['s1', 's2', 's3', 's4', 's7'] },
      { id: 'h3', groupId: 'g1', lessonId: 'l4', title: 'Grammar: 20 предложений', desc: 'Present Perfect vs Past Simple, worksheet 7', due: d(4), doneBy: [] },
      { id: 'h4', groupId: 'g1', lessonId: 'l7', title: 'Эссе: Argumentative Task', desc: 'Черновик на 400–500 слов', due: d(6), doneBy: [] },
    ];

    /* попытки за прошлую неделю, чтобы прогресс не был пустым */
    var attempts = [
      { id: 'a1', testId: 'q1', studentId: 's1', score: 6, max: 8, date: d(-3), durSec: 620 },
      { id: 'a2', testId: 'q2', studentId: 's1', score: 4, max: 6, date: d(-5), durSec: 380 },
      { id: 'a3', testId: 'q1', studentId: 's2', score: 8, max: 8, date: d(-3), durSec: 540 },
      { id: 'a4', testId: 'q1', studentId: 's3', score: 7, max: 8, date: d(-3), durSec: 660 },
      { id: 'a5', testId: 'q3', studentId: 's2', score: 6, max: 6, date: d(-4), durSec: 300 },
    ];

    return {
      users: teachers.concat(students),
      groups: groups,
      lessons: lessons,
      homework: homework,
      tests: seedTests(),
      attempts: attempts,
    };
  }

  function seedTests() {
    return [
      {
        id: 'q1', title: 'SAT Math · Проценты и пропорции', subject: 'SAT Math', authorId: 't1',
        assignedGroups: ['g1'], timeMin: 12, created: 1,
        questions: [
          { q: 'В магазине куртка стоила $180. Сначала цену снизили на 25%, а потом новую цену повысили на 20%. Сколько теперь стоит куртка?', options: ['$180', '$172', '$162', '$168'], correct: 2, explain: '180 · 0,75 = 135; 135 · 1,2 = 162. Повышение на 20% от новой базы, поэтому цена не вернулась к исходной.' },
          { q: 'Если 3 ручки стоят столько же, сколько 2 блокнота, а блокнот стоит 90 cents, сколько стоит ручка (в центах)?', options: ['45', '60', '72', '75'], correct: 1, explain: '2 блокнота = 180 cents → ручка = 180 / 3 = 60.' },
          { q: 'Рецепт рассчитан на 6 порций и требует 2,5 стакана муки. Сколько муки нужно на 9 порций?', options: ['3 стакана', '3,25 стакана', '3,5 стакана', '3,75 стакана'], correct: 3, explain: 'На 1 порцию: 2,5/6. На 9 порций: 2,5 · 9/6 = 3,75.' },
          { q: 'Число x увеличили на 40%, затем уменьшили на 40%. В итоге получилось 588. Чему равно x?', options: ['588', '620', '700', '750'], correct: 2, explain: 'x · 1,4 · 0,6 = 0,84x = 588 → x = 700. Фокус в том, что +40% и −40% не возвращают исходное число: база после повышения другая.' },
          { q: 'Масштаб карты: 1 см = 5 км. Расстояние на карте 4,6 см. Каково реальное расстояние?', options: ['20,3 км', '23 км', '25 км', '46 км'], correct: 1, explain: '4,6 · 5 = 23 км.' },
          { q: 'Автомобиль проехал 30% пути в первый день, 25% во второй, а оставшиеся 135 км — в третий. Какова длина всего пути?', options: ['270 км', '300 км', '320 км', '360 км'], correct: 1, explain: 'Осталось 100% − 55% = 45% → 0,45x = 135 → x = 300.' },
          { q: 'Значение y пропорционально x. При x = 4, y = 14. Чему равно y при x = 10?', options: ['28', '32', '35', '40'], correct: 2, explain: 'k = 14/4 = 3,5 → y = 3,5 · 10 = 35.' },
          { q: 'Цена подписки выросла с $48 до $60. На сколько процентов выросла цена?', options: ['20%', '25%', '80%', '125%'], correct: 1, explain: '(60 − 48)/48 = 0,25 → 25%.' },
        ],
      },
      {
        id: 'q2', title: 'English · Vocabulary in Context', subject: 'SAT R/W', authorId: 't3',
        assignedGroups: ['g1'], timeMin: 8, created: 1,
        questions: [
          { q: 'The scientist’s claims were ___ by decades of careful research, so few colleagues dared to challenge them.', options: ['undermined', 'buttressed', 'obscured', 'dispersed'], correct: 1, explain: 'Buttressed = «подкреплены». Логика: раз десятилетия исследований — коллеги не решаются спорить.' },
          { q: 'Rather than ___ the problem, the committee postponed any real discussion until next year.', options: ['addressing', 'addressed', 'to address', 'address'], correct: 0, explain: 'Rather than + gerund в этой конструкции: rather than addressing.' },
          { q: 'Choose the word closest in meaning to “meticulous”:', options: ['careless', 'thorough', 'hostile', 'rapid'], correct: 1, explain: 'Meticulous = крайне тщательный, дотошный.' },
          { q: 'The novel’s plot is ___, but its characters make it unforgettable.', options: ['compelling', 'conventional', 'lucid', 'profound'], correct: 1, explain: 'Контраст: сюжет обычный (conventional), но персонажи запоминаются.' },
          { q: '“The results corroborate the hypothesis” means the results ___ it.', options: ['contradict', 'confirm', 'complicate', 'question'], correct: 1, explain: 'Corroborate = подтверждать.' },
          { q: 'The professor is known for ___ explanations: even complex ideas become simple.', options: ['lucid', 'verbose', 'obscure', 'tedious'], correct: 0, explain: 'Lucid = ясный. Подсказка: «даже сложные идеи становятся простыми».' },
        ],
      },
      {
        id: 'q3', title: 'Milliy Sertifikat · Grammar', subject: 'Milliy Sertifikat', authorId: 't2',
        assignedGroups: ['g1'], timeMin: 8, created: 1,
        questions: [
          { q: 'I ___ my homework already, so I can go for a walk.', options: ['did', 'have done', 'was doing', 'do'], correct: 1, explain: '«Already» — маркер Present Perfect: have done.' },
          { q: 'She ___ in Tashkent since 2019.', options: ['lives', 'lived', 'has lived', 'is living'], correct: 2, explain: '«Since 2019» — период до настоящего момента → Present Perfect.' },
          { q: 'If it ___ tomorrow, we will stay at home.', options: ['will rain', 'rains', 'would rain', 'rained'], correct: 1, explain: 'First Conditional: if + Present Simple, will + V.' },
          { q: 'This is the book ___ I was telling you about.', options: ['what', 'who', 'that', 'whose'], correct: 2, explain: 'Относительное местоимение для неодушевлённых — that/which.' },
          { q: 'By the time we arrived, the lecture ___.', options: ['already started', 'has already started', 'had already started', 'was already starting'], correct: 2, explain: 'Действие завершилось до другого прошлого → Past Perfect.' },
          { q: 'You ___ smoke here — it’s forbidden.', options: ['mustn’t', 'don’t have to', 'shouldn’t have', 'needn’t'], correct: 0, explain: 'Запрет — mustn’t. «Don’t have to» = «не обязательно».' },
        ],
      },
      {
        id: 'q4', title: 'SAT Math · Чек-точка: уравнения', subject: 'SAT Math', authorId: 't1',
        assignedGroups: ['g1'], timeMin: 10, created: 1,
        questions: [
          { q: 'Если 2x + 5 = 3x − 8, чему равно x?', options: ['−13', '−3', '3', '13'], correct: 3, explain: '5 + 8 = 3x − 2x → x = 13.' },
          { q: 'Система: x + y = 10, x − y = 4. Чему равно xy?', options: ['21', '24', '25', '30'], correct: 0, explain: 'x = 7, y = 3 → xy = 21.' },
          { q: 'Чему равен наклон прямой 3y = 6x + 12?', options: ['2', '3', '4', '6'], correct: 0, explain: 'y = 2x + 4 → наклон 2.' },
          { q: 'При каком значении a уравнение ax + 3 = 5x + 3 имеет бесконечно много решений?', options: ['0', '3', '5', 'любом'], correct: 2, explain: 'Тождество при a = 5: 5x + 3 = 5x + 3 для всех x.' },
          { q: '|2x − 6| ≤ 4. Какой промежуток содержит все решения?', options: ['[1; 5]', '[−5; −1]', '[2; 4]', '(−∞; 1]'], correct: 0, explain: '−4 ≤ 2x − 6 ≤ 4 → 2 ≤ 2x ≤ 10 → 1 ≤ x ≤ 5.' },
        ],
      },
    ];
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

  /* ── хранилище ── */

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { data = JSON.parse(raw); return; }
    } catch (e) { /* повреждённый кэш — пересеем */ }
    data = seed();
    save();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.warn('db: save failed', e); }
  }

  /* ── публичный API ── */

  var api = {
    ready: function () { if (!data) load(); return data; },
    reset: function () { data = seed(); save(); },
    levels: LEVELS,

    /* сессия */
    session: function () { return localStorage.getItem(SESSION_KEY) || null; },
    login: function (userId) { localStorage.setItem(SESSION_KEY, userId); },
    logout: function () { localStorage.removeItem(SESSION_KEY); },

    user: function (id) { return api.ready().users.find(function (u) { return u.id === id; }) || null; },
    currentUser: function () { var s = api.session(); return s ? api.user(s) : null; },

    /* создание своего ученика */
    createStudent: function (name, groupId) {
      var id = 's' + Date.now().toString(36);
      var u = { id: id, role: 'student', name: name, groupId: groupId || 'g1', xp: 0, streak: 0, lastActiveDay: null };
      api.ready().users.push(u);
      var g = api.ready().groups.find(function (x) { return x.id === (groupId || 'g1'); });
      if (g) g.studentIds.push(id);
      save();
      return u;
    },

    group: function (id) { return api.ready().groups.find(function (g) { return g.id === id; }) || null; },
    groupsFor: function (user) {
      if (user.role === 'teacher') return api.ready().groups.filter(function (g) { return g.teacherIds.indexOf(user.id) !== -1; });
      return api.ready().groups.filter(function (g) { return user.groupIds ? user.groupIds.indexOf(g.id) !== -1 : g.id === user.groupId; });
    },

    lesson: function (id) { return api.ready().lessons.find(function (l) { return l.id === id; }) || null; },
    lessonsFor: function (user) {
      var groupIds = api.groupsFor(user).map(function (g) { return g.id; });
      return api.ready().lessons
        .filter(function (l) { return groupIds.indexOf(l.groupId) !== -1; })
        .sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
    },
    lessonStatus: function (l) {
      var start = toMinutes(l.start), end = start + l.durMin, now = minutesNow();
      if (l.date < todayIso()) return 'past';
      if (l.date > todayIso()) return 'upcoming';
      if (now >= start && now < end) return 'live';
      return now < start ? 'today' : 'past';
    },
    nextLesson: function (user) {
      var ls = api.lessonsFor(user);
      for (var i = 0; i < ls.length; i++) {
        var st = api.lessonStatus(ls[i]);
        if (st === 'live') return ls[i];
        if (st === 'today' || st === 'upcoming') return ls[i];
      }
      return null;
    },

    homework: function (id) { return api.ready().homework.find(function (h) { return h.id === id; }) || null; },
    hwFor: function (user) {
      var groupIds = api.groupsFor(user).map(function (g) { return g.id; });
      return api.ready().homework.filter(function (h) { return groupIds.indexOf(h.groupId) !== -1; })
        .sort(function (a, b) { return a.due.localeCompare(b.due); });
    },
    toggleHwDone: function (hwId, studentId) {
      var hw = api.homework(hwId);
      if (!hw) return;
      var i = hw.doneBy.indexOf(studentId);
      if (i === -1) hw.doneBy.push(studentId); else hw.doneBy.splice(i, 1);
      save();
    },

    test: function (id) { return api.ready().tests.find(function (t) { return t.id === id; }) || null; },
    testsFor: function (user) {
      var groupIds = api.groupsFor(user).map(function (g) { return g.id; });
      return api.ready().tests.filter(function (t) {
        if (user.role === 'teacher') return true;
        return t.assignedGroups.some(function (g) { return groupIds.indexOf(g) !== -1; });
      });
    },
    saveTest: function (test) {
      var i = api.ready().tests.findIndex(function (t) { return t.id === test.id; });
      if (i === -1) api.ready().tests.push(test); else api.ready().tests[i] = test;
      save();
    },
    removeTest: function (id) {
      var d = api.ready();
      d.tests = d.tests.filter(function (t) { return t.id !== id; });
      d.attempts = d.attempts.filter(function (a) { return a.testId !== id; });
      save();
    },

    attempt: function (id) { return api.ready().attempts.find(function (a) { return a.id === id; }) || null; },
    addAttempt: function (attempt) { api.ready().attempts.push(attempt); save(); },
    attemptsForTest: function (testId) {
      return api.ready().attempts.filter(function (a) { return a.testId === testId; });
    },
    attemptsBy: function (studentId) {
      return api.ready().attempts.filter(function (a) { return a.studentId === studentId; })
        .sort(function (a, b) { return b.date.localeCompare(a.date); });
    },

    addXp: function (studentId, amount) {
      var u = api.user(studentId);
      if (!u) return;
      u.xp = Math.max(0, (u.xp || 0) + amount);
      var today = todayIso();
      if (u.lastActiveDay !== today) {
        var yesterday = iso(addDays(new Date(), -1));
        u.streak = (u.lastActiveDay === yesterday) ? (u.streak || 0) + 1 : 1;
        u.lastActiveDay = today;
      }
      save();
    },
    levelOf: function (xp) {
      var cur = LEVELS[0], next = null;
      for (var i = 0; i < LEVELS.length; i++) {
        if (xp >= LEVELS[i].min) cur = LEVELS[i];
      }
      var idx = LEVELS.indexOf(cur);
      next = LEVELS[idx + 1] || null;
      return { level: cur, next: next, index: idx };
    },

    studentCount: function (groupId) {
      var g = api.group(groupId);
      return g ? g.studentIds.length : 0;
    },
  };

  return api;
})();
