/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit 2.0 — роутер и экраны (admin / teacher / student)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var esc = UI.esc, ic = UI.ic, toast = UI.toast;
  var app = document.getElementById('app');
  var deferredInstall = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
  });
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  var LOGO = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
    '<circle cx="16" cy="16" r="13" stroke="url(#lgo)" stroke-width="1.5" stroke-dasharray="3 5"/>' +
    '<path d="M16 7 L18.2 13.8 L25 16 L18.2 18.2 L16 25 L13.8 18.2 L7 16 L13.8 13.8 Z" fill="#F5C24B"/>' +
    '<defs><linearGradient id="lgo" x1="0" y1="0" x2="32" y2="32">' +
    '<stop stop-color="#67E8F9"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs></svg>';

  /* ═══════════ ВСПОМОГАТЕЛЬНОЕ ═══════════ */

  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function lessonStart(l) {
    var d = parseIso(l.date), p = l.startTime.split(':');
    d.setHours(+p[0], +p[1], 0, 0);
    return d;
  }
  function untilLabel(l) {
    var st = DB.lessonStatus(l);
    if (st === 'live') return { chip: 'live', text: 'идёт прямо сейчас' };
    var diffMin = Math.round((lessonStart(l) - Date.now()) / 60000);
    var sameDay = l.date === DB.todayIso();
    var when;
    if (sameDay && diffMin < 90) when = 'через ' + Math.max(1, diffMin) + ' ' + UI.plural(diffMin, 'минуту', 'минуты', 'минут');
    else if (diffMin < 60 * 26) when = 'завтра в ' + l.startTime;
    else when = UI.fmtDate(l.date) + ' в ' + l.startTime;
    return { chip: st === 'today' ? 'today' : 'upcoming', text: when };
  }
  function subjectTag(subject) {
    var s = subject || '';
    var cls = 'subject-tag';
    if (/Math|матем|Milliy/i.test(s)) cls += ' subject-tag--math';
    else if (/English|Reading|TOEFL|Writing|Grammar|Vocabulary|Milliy/i.test(s)) cls += ' subject-tag--eng';
    if (/Diagnostic|пробник|mock/i.test(s)) cls += ' subject-tag--mock';
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }
  function statusChip(l) {
    var st = DB.lessonStatus(l);
    if (st === 'live') return '<span class="chip chip--live">в эфире</span>';
    if (st === 'today') return '<span class="chip chip--today">сегодня</span>';
    if (st === 'upcoming') return '<span class="chip chip--upcoming">впереди</span>';
    return '<span class="chip chip--past">прошёл</span>';
  }
  function roleChip(role) {
    return role === 'admin' ? '<span class="chip chip--gold">админ</span>'
      : role === 'teacher' ? '<span class="chip chip--ion">преподаватель</span>'
      : '<span class="chip">ученик</span>';
  }
  function emptyBox(icon, title, text) {
    return '<div class="empty">' + ic(icon) + '<b>' + esc(title) + '</b><p>' + esc(text) + '</p></div>';
  }
  function readMarks() {
    try { return JSON.parse(localStorage.getItem('vo-read') || '[]'); } catch (e) { return []; }
  }
  function markRead(key) {
    var m = readMarks();
    if (m.indexOf(key) === -1) { m.push(key); localStorage.setItem('vo-read', JSON.stringify(m)); }
  }

  /* ═══════════ ОБОЛОЧКА ═══════════ */

  function navFor(user) {
    if (user.role === 'admin') return [
      { id: 'today', label: 'Обзор', icon: 'home' },
      { id: 'admin-users', label: 'Люди', icon: 'users' },
      { id: 'admin-payments', label: 'Оплаты', icon: 'clipboard' },
      { id: 'schedule', label: 'Расписание', icon: 'calendar' },
      { id: 'more', label: 'Ещё', icon: 'dots' },
    ];
    if (user.role === 'teacher') return [
      { id: 'today', label: 'Сегодня', icon: 'home' },
      { id: 'schedule', label: 'Расписание', icon: 'calendar' },
      { id: 'tests', label: 'Тесты', icon: 'clipboard' },
      { id: 'students', label: 'Ученики', icon: 'users' },
      { id: 'more', label: 'Ещё', icon: 'dots' },
    ];
    return [
      { id: 'today', label: 'Сегодня', icon: 'home' },
      { id: 'schedule', label: 'Расписание', icon: 'calendar' },
      { id: 'trainer', label: 'Тренажёр', icon: 'star' },
      { id: 'mock', label: 'Пробник', icon: 'clipboard' },
      { id: 'more', label: 'Ещё', icon: 'dots' },
    ];
  }

  function sideNav(user, route) {
    return '<aside class="side">' +
      '<a class="side__logo" href="#/today">' + LOGO + '<div><b>VOSKHOD</b><i>ORBIT · ' + user.role + '</i></div></a>' +
      '<nav class="side__nav">' +
      navFor(user).map(function (n) {
        return '<a class="side__item' + (route === n.id ? ' side__item--on' : '') + '" href="#/' + n.id + '">' + ic(n.icon) + n.label + '</a>';
      }).join('') +
      (user.role === 'teacher' ? '<a class="side__item' + (route === 'builder' ? ' side__item--on' : '') + '" href="#/builder">' + ic('edit') + 'Конструктор</a>' : '') +
      '</nav>' +
      '<div class="side__foot"><a class="side__item" href="#/settings">' + UI.avatar(user, 'sm') + '<span>' + esc(user.name.split(' ')[0]) + '</span></a></div>' +
      '</aside>';
  }

  function tabbar(user, route) {
    return '<nav class="tabbar">' +
      navFor(user).map(function (n) {
        return '<a class="tabbar__item' + (route === n.id ? ' tabbar__item--on' : '') + '" href="#/' + n.id + '">' +
          ic(n.icon) + '<span>' + n.label + '</span></a>';
      }).join('') +
      '</nav>';
  }

  function shell(user, route, contentHtml, opts) {
    opts = opts || {};
    app.innerHTML =
      sideNav(user, route) +
      '<div class="shell" style="flex:1;min-width:0;display:flex;flex-direction:column">' +
        '<header class="topbar">' +
          '<a class="topbar__logo" href="#/today">' + LOGO + '<b>VOSKHOD</b>' +
            '<i>' + user.role.toUpperCase() + '</i></a>' +
          '<a class="topbar__ava" href="#/settings">' +
            '<span class="topbar__name">' + esc(user.name.split(' ')[0]) +
            '<i>' + esc(user.role === 'teacher' ? (user.subject || 'Преподаватель') : user.role === 'admin' ? 'администратор' : 'ученик') + '</i></span>' +
            UI.avatar(user) + '</a>' +
        '</header>' +
        '<main class="page' + (opts.wide ? ' page--wide' : '') + '" id="page">' + contentHtml + '</main>' +
      '</div>' +
      tabbar(user, route);
  }

  /* ═══════════ ВХОД / МАСТЕР НАСТРОЙКИ ═══════════ */

  function renderLogin() {
    DB.logout();
    if (DB.needsSetup()) { renderSetup(); return; }

    app.innerHTML =
      '<div class="login"><div class="login__box">' +
        '<div class="login__mark">' + LOGO + '</div>' +
        '<p class="login__eyebrow">[ orbit · вход в систему ]</p>' +
        '<h1 class="login__title">VOSKHOD <span>Orbit</span></h1>' +
        '<p class="login__sub">Аккаунты создаёт администратор школы.<br>Войди с твоим логином и паролем.</p>' +
        '<form id="loginForm" style="display:grid;gap:12px;text-align:left">' +
          '<label class="field"><span class="field__label">логин</span>' +
            '<input class="input" id="loginName" autocomplete="username" required></label>' +
          '<label class="field"><span class="field__label">пароль</span>' +
            '<input class="input" id="loginPass" type="password" autocomplete="current-password" required></label>' +
          '<p id="loginErr" class="mono" style="color:var(--red);font-size:12px;display:none"></p>' +
          '<button class="btn btn--gold btn--full" type="submit" id="loginBtn">Войти на борт ✦</button>' +
        '</form>' +
        '<p class="login__foot"><a href="https://tankecu.github.io/voskhod-school/" target="_blank" rel="noopener">О школе ↗</a>' +
        ' · <span class="mono" style="font-size:11px">' + (DB.adapterName() === 'supabase' ? 'база: supabase' : 'база: это устройство') + '</span></p>' +
      '</div></div>';

    app.querySelector('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = app.querySelector('#loginBtn');
      btn.disabled = true;
      btn.textContent = 'Проверяем…';
      DB.authLogin(app.querySelector('#loginName').value.trim(), app.querySelector('#loginPass').value)
        .then(function (res) {
          if (res.error) {
            var err = app.querySelector('#loginErr');
            err.style.display = '';
            err.textContent = '✕ ' + res.error;
            btn.disabled = false;
            btn.textContent = 'Войти на борт ✦';
            return;
          }
          toast('С возвращением, ' + res.user.name.split(' ')[0] + ' ✦');
          location.hash = '#/today';
        });
    });
  }

  function renderSetup() {
    app.innerHTML =
      '<div class="login"><div class="login__box">' +
        '<div class="login__mark">' + LOGO + '</div>' +
        '<p class="login__eyebrow">[ первый запуск · инициализация ]</p>' +
        '<h1 class="login__title">Создай <span>админа</span></h1>' +
        '<p class="login__sub">Это первый запуск системы. Аккаунт администратора<br>создаётся один раз — дальше он управляет школой.</p>' +
        '<form id="setupForm" style="display:grid;gap:12px;text-align:left">' +
          '<label class="field"><span class="field__label">твоё имя</span>' +
            '<input class="input" id="suName" maxlength="40" required></label>' +
          '<label class="field"><span class="field__label">логин</span>' +
            '<input class="input" id="suLogin" autocomplete="username" pattern="[a-zA-Z0-9_.]{3,20}" title="3–20 символов: латиница, цифры, _ ." required></label>' +
          '<label class="field"><span class="field__label">пароль (мин. 6 символов)</span>' +
            '<input class="input" id="suPass" type="password" minlength="6" autocomplete="new-password" required></label>' +
          '<label class="field"><span class="field__label">повтори пароль</span>' +
            '<input class="input" id="suPass2" type="password" autocomplete="new-password" required></label>' +
          '<p id="suErr" class="mono" style="color:var(--red);font-size:12px;display:none"></p>' +
          '<button class="btn btn--gold btn--full" type="submit" id="suBtn">Инициализировать систему ✦</button>' +
        '</form>' +
        '<p class="login__foot mono" style="font-size:11px">база: ' + (DB.adapterName() === 'supabase' ? 'supabase (общая)' : 'это устройство · подключи supabase в js/config.js') + '</p>' +
      '</div></div>';

    app.querySelector('#setupForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = app.querySelector('#suErr');
      var pass = app.querySelector('#suPass').value;
      if (pass !== app.querySelector('#suPass2').value) {
        err.style.display = ''; err.textContent = '✕ Пароли не совпадают';
        return;
      }
      var btn = app.querySelector('#suBtn');
      btn.disabled = true; btn.textContent = 'Создаём…';
      DB.createAdmin(
        app.querySelector('#suName').value.trim(),
        app.querySelector('#suLogin').value.trim(),
        pass
      ).then(function (u) {
        if (u && u.error) { err.style.display = ''; err.textContent = '✕ ' + u.error; btn.disabled = false; btn.textContent = 'Инициализировать систему ✦'; return; }
        toast('Система инициализирована. Добро пожаловать, ' + u.name.split(' ')[0] + ' ✦');
        location.hash = '#/today';
      });
    });
  }

  /* ═══════════ ОПЛАТА: виджеты ═══════════ */

  function payStatusWidget(user) {
    var st = DB.paymentStatusFor(user.id);
    if (st.status === 'paid') {
      return '<div class="glass card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
        '<span class="dot dot--green"></span><span style="flex:1;font-size:13.5px">Оплата за ' + esc(st.month) + ' — <b style="color:var(--green)">всё чисто</b>' +
        (st.amount ? ' · ' + esc(String(st.amount)) + ' ' + esc(st.currency) : '') + '</span>' +
        '<a class="btn btn--ghost btn--sm" href="#/payments">история</a></div>';
    }
    if (st.status === 'awaiting') {
      return '<div class="glass card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px;border:1px solid rgba(245,194,75,.4)">' +
        '<span class="dot dot--gold"></span><span style="flex:1;font-size:13.5px">Оплата за ' + esc(st.month) + ' — ожидается' +
        (st.amount ? ' · ' + esc(String(st.amount)) + ' ' + esc(st.currency) : '') + '</span>' +
        '<a class="btn btn--ghost btn--sm" href="#/payments">история</a></div>';
    }
    return '<div class="glass card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
      '<span class="dot" style="background:var(--red)"></span><span style="flex:1;font-size:13.5px">Оплата за ' + esc(st.month) + ' — <b style="color:var(--red)">не найдена</b>. Загляни в историю или свяжись с админом.</span>' +
      '<a class="btn btn--ghost btn--sm" href="#/payments">история</a></div>';
  }

  /* ═══════════ СЕГОДНЯ ═══════════ */

  function renderToday(user) {
    var lessons = DB.lessonsFor(user);
    var today = DB.todayIso();
    var todays = lessons.filter(function (l) { return l.date === today; });
    var next = DB.nextLesson(user);
    var now = new Date();
    var mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
    var weekCount = lessons.filter(function (l) {
      var d = parseIso(l.date);
      return d >= mon && d < new Date(mon.getTime() + 7 * 86400000);
    }).length;

    var html = '<div class="page-head"><p class="eyebrow">[ сегодня · ' + esc(UI.fmtDate(today)).toUpperCase() + ' ]</p>' +
      '<h1>Привет, ' + esc(user.name.split(' ')[0]) + ' ✦</h1></div>';
    var bindHW = false;

    if (user.role === 'student') {
      var xp = user.xp || 0;
      var lvl = DB.levelOf(xp);
      var pct = lvl.next ? Math.min(100, Math.round((xp - lvl.level.min) / (lvl.next.min - lvl.level.min) * 100)) : 100;
      var hwPending = DB.hwFor(user).filter(function (h) { return h.doneBy.indexOf(user.id) === -1; }).length;

      html += orbitCard(xp, pct) + payStatusWidget(user) + trainerCard(user) + planCard(user) +
        '<div class="stat-row" style="margin-bottom:18px">' +
          '<div class="stat-tile glass">' + ic('fire') + '<b>' + (user.streak || 0) + '</b><span>' + UI.plural(user.streak || 0, 'день серии', 'дня серии', 'дней серии') + '</span></div>' +
          '<div class="stat-tile glass">' + ic('calendar') + '<b>' + weekCount + '</b><span>уроков на неделе</span></div>' +
          '<div class="stat-tile glass">' + ic('clipboard') + '<b>' + hwPending + '</b><span>домашки ждёт</span></div>' +
        '</div>';

      if (next) {
        var until = untilLabel(next);
        var t = DB.user(next.teacherId);
        html += '<p class="section-label"><span>ближайший урок</span></p>' +
          '<div class="hero-lesson glass">' +
            '<div class="hero-lesson__label"><span>' + (DB.lessonStatus(next) === 'live' ? '◉ сейчас идёт' : 'следующий · ' + until.text) + '</span>' + statusChip(next) + '</div>' +
            '<div class="hero-lesson__subject">' + esc(next.subject) + '</div>' +
            '<p class="hero-lesson__topic">' + esc(next.topic || '') + '</p>' +
            '<div class="hero-lesson__meta">' +
              '<span>' + ic('clock') + UI.dayLabel(next.date) + ', ' + esc(next.startTime) + '</span>' +
              (t ? '<span>' + UI.avatar(t, 'sm') + esc(t.name) + '</span>' : '') +
              '<span>' + ic('users') + esc((DB.user(next.studentId) || {}).name || '') + '</span>' +
            '</div>' +
            '<div class="hero-lesson__actions">' +
              '<a class="btn btn--gold btn--sm" href="#/room/' + next.id + '">' + ic('play') + ' Комната занятия</a>' +
              '<button class="btn btn--ghost btn--sm" data-details="' + next.id + '">Подробнее</button>' +
            '</div></div>';
      } else {
        html += '<p class="section-label"><span>ближайший урок</span></p>' +
          emptyBox('calendar', 'Уроков пока нет', 'Как только админ или преподаватель создаст уроки, они появятся здесь');
      }

      var hw = DB.hwFor(user);
      var hwOpen = hw.filter(function (h) { return h.doneBy.indexOf(user.id) === -1; }).slice(0, 3);
      html += '<p class="section-label"><span>домашка</span><a href="#/homework">вся →</a></p>';
      html += hwOpen.length
        ? '<div class="stack">' + hwOpen.map(function (h) { return hwItem(h, user); }).join('') + '</div>'
        : emptyBox('check', 'Всё сдано', 'Новых заданий нет');
      bindHW = true;

      /* продолжить теорию */
      var nextTopic = nextUnreadTopic();
      if (nextTopic) {
        html += '<p class="section-label"><span>теория</span><a href="#/theory">вся →</a></p>' +
          '<a class="test-card glass" href="#/theory/' + nextTopic.course.id + '/' + nextTopic.topic.id + '">' +
          '<div class="test-card__top"><h3>' + esc(nextTopic.topic.title) + '</h3>' + subjectTag(nextTopic.course.title) + '</div>' +
          '<div class="test-card__foot"><span class="test-card__score mono" style="font-size:11px;color:var(--dust-2)">' +
          nextTopic.topic.minutes + ' мин чтения</span><span class="btn btn--gold btn--sm">Читать ✦</span></div></a>';
      }
    } else if (user.role === 'teacher') {
      var myGroups = DB.groupsFor(user);
      var studentCount = myGroups.reduce(function (acc, g) { return acc + g.studentIds.length; }, 0);
      html +=
        '<div class="stat-row" style="margin-bottom:18px">' +
          '<div class="stat-tile glass">' + ic('calendar') + '<b>' + todays.length + '</b><span>уроков сегодня</span></div>' +
          '<div class="stat-tile glass">' + ic('users') + '<b>' + myGroups.length + '</b><span>' + UI.plural(myGroups.length, 'группа', 'группы', 'групп') + '</span></div>' +
          '<div class="stat-tile glass">' + ic('home') + '<b>' + studentCount + '</b><span>учеников на борту</span></div>' +
        '</div>' +
        '<p class="section-label"><span>уроки сегодня</span><button class="btn btn--gold btn--sm" data-add-lesson>+ Урок</button></p>';
      html += todays.length
        ? '<div class="stack">' + todays.map(function (l) { return lessonRow(l, user); }).join('') + '</div>'
        : emptyBox('calendar', 'Сегодня уроков нет', 'Создай урок кнопкой «+ Урок»');

      var recent = DB.allAttempts().slice(0, 5);
      if (recent.length) {
        html += '<p class="section-label"><span>свежие результаты</span></p><div class="stack">';
        recent.forEach(function (a) {
          var u2 = DB.user(a.studentId), t2 = DB.test(a.testId);
          if (!u2 || !t2) return;
          var p = Math.round(a.score / a.max * 100);
          html += '<div class="attempt glass">' +
            '<span class="attempt__score ' + (p >= 70 ? 'attempt__score--good' : p < 50 ? 'attempt__score--bad' : '') + '">' + a.score + '/' + a.max + '</span>' +
            '<div class="attempt__main"><b>' + esc(u2.name) + '</b><span>' + esc(t2.title) + ' · ' + UI.dayLabel(a.date) + '</span></div></div>';
        });
        html += '</div>';
      }
    } else {
      /* ── АДМИН: обзор системы ── */
      var users = DB.allUsers();
      var students = users.filter(function (u) { return u.role === 'student'; });
      var teachers = users.filter(function (u) { return u.role === 'teacher'; });
      var groups = [];
      var month = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
      var paidThis = DB.allPayments().filter(function (p) { return p.month === month && p.status === 'paid'; });
      var revenueUZS = paidThis.filter(function (p) { return p.currency === 'UZS'; }).reduce(function (a, p) { return a + Number(p.amount || 0); }, 0);
      var revenueUSD = paidThis.filter(function (p) { return p.currency === 'USD'; }).reduce(function (a, p) { return a + Number(p.amount || 0); }, 0);
      var unpaid = students.filter(function (s) { return DB.paymentStatusFor(s.id).status !== 'paid'; }).length;

      html +=
        '<div class="stat-row" style="margin-bottom:10px">' +
          '<div class="stat-tile glass">' + ic('users') + '<b>' + students.length + '</b><span>учеников</span></div>' +
          '<div class="stat-tile glass">' + ic('home') + '<b>' + teachers.length + '</b><span>преподавателей</span></div>' +
          '<div class="stat-tile glass">' + ic('grid') + '<b>' + groups.length + '</b><span>групп</span></div>' +
        '</div>' +
        '<div class="stat-row" style="grid-template-columns:1fr 1fr;margin-bottom:18px">' +
          '<div class="stat-tile glass">' + ic('star') + '<b style="font-size:clamp(15px,3.4vw,20px)">' + revenueUZS.toLocaleString('ru-RU') + ' UZS</b><span>собрано за ' + esc(month) + (revenueUSD ? ' · $' + revenueUSD : '') + '</span></div>' +
          '<div class="stat-tile glass">' + ic('clock') + '<b>' + unpaid + '</b><span>без оплаты в этом месяце</span></div>' +
        '</div>' +

        '<p class="section-label"><span>быстрые действия</span></p>' +
        '<div class="stack" style="margin-bottom:8px">' +
          '<a class="login__card glass" href="#/admin-users"><span>' + ic('plus') + '</span><span><b>Создать аккаунт</b><i>ученик, преподаватель или админ</i></span><span class="login__go">' + ic('back') + '</span></a>' +
          '<a class="login__card glass" href="#/admin-payments"><span>' + ic('clipboard') + '</span><span><b>Отметить оплату</b><i>журнал платежей школы</i></span><span class="login__go">' + ic('back') + '</span></a>' +
        '</div>' +

        '<p class="section-label"><span>последние попытки тестов</span></p>';
      var recentA = DB.allAttempts().slice(0, 5);
      html += recentA.length ? '<div class="stack">' : emptyBox('chart', 'Пока тихо', 'Как только ученики начнут решать тесты, результаты появятся здесь');
      recentA.forEach(function (a) {
        var u2 = DB.user(a.studentId), t2 = DB.test(a.testId);
        if (!u2) return;
        var p = Math.round(a.score / a.max * 100);
        html += '<div class="attempt glass">' +
          '<span class="attempt__score ' + (p >= 70 ? 'attempt__score--good' : p < 50 ? 'attempt__score--bad' : '') + '">' + a.score + '/' + a.max + '</span>' +
          '<div class="attempt__main"><b>' + esc(u2.name) + '</b><span>' + esc(t2 ? t2.title : a.testId) + ' · ' + UI.dayLabel(a.date) + '</span></div></div>';
      });
      if (recentA.length) html += '</div>';

      /* последние пробники */
      var recentM = DB.allMockResults().slice(-5).reverse();
      if (recentM.length) {
        html += '<p class="section-label"><span>последние пробники SAT</span></p><div class="stack">';
        recentM.forEach(function (m) {
          var u2 = DB.user(m.studentId);
          if (!u2) return;
          html += '<div class="attempt glass">' +
            '<span class="attempt__score ' + (m.total >= 1200 ? 'attempt__score--good' : '') + '">' + m.total + '</span>' +
            '<div class="attempt__main"><b>' + esc(u2.name) + '</b><span>SAT · RW ' + m.rw + ' · Math ' + m.math + ' · ' + UI.dayLabel(m.date) + '</span></div></div>';
        });
        html += '</div>';
      }

      /* заявки с лендинга */
      var newLeads = DB.newLeadsCount();
      html += '<p class="section-label"><span>заявки с сайта</span><a href="#/admin-leads">все →</a></p>';
      var recentL = DB.allLeads().slice(0, 3);
      html += recentL.length ? '<div class="stack">' : emptyBox('link', 'Заявок пока нет', 'Как только кто-то заполнит форму на сайте, она появится здесь');
      recentL.forEach(function (l) {
        html += '<div class="attempt glass">' +
          '<span class="attempt__score ' + (l.status === 'new' ? 'attempt__score--bad' : 'attempt__score--good') + '">' + (l.status === 'new' ? 'новая' : 'обработана') + '</span>' +
          '<div class="attempt__main"><b>' + esc(l.name) + '</b><span>' + esc(l.contact) + ' · ' + esc(l.program || '') + '</span></div></div>';
      });
      if (recentL.length) html += '</div>';
    }

    shell(user, 'today', html);
    bindLessonDetails(user);
    bindHwChecks(user);
    bindAddLesson(user);
  }

  function orbitCard(xp, pct) {
    var lvl = DB.levelOf(xp);
    return '<div class="glass orbit-wrap" style="margin-bottom:12px">' +
      '<div class="orbit" style="--pct:' + pct + '"><b>' + xp + '</b></div>' +
      '<div class="orbit-wrap__info" style="flex:1">' +
        '<b>' + esc(lvl.level.name) + '</b>' +
        '<span>' + (lvl.next ? 'до уровня «' + esc(lvl.next.name) + '» — ' + (lvl.next.min - xp) + ' XP' : 'максимальная орбита достигнута') + '</span>' +
        '<div class="orbit-wrap__bar"><i style="width:' + pct + '%"></i></div>' +
      '</div></div>';
  }

  function trainerCard(user) {
    var placement = DB.placementOf(user.id);
    if (!placement) {
      return '<div class="glass card" style="display:flex;gap:12px;align-items:center;margin-bottom:12px;border:1px solid rgba(245,194,75,.45)">' +
        '<span class="dot dot--gold"></span><span style="flex:1;font-size:13.5px"><b>Вводное тестирование не пройдено</b>' +
        '<span style="display:block;font-size:12.5px;color:var(--dust)">24 темы SAT Math — система построит твою траекторию</span></span>' +
        '<a class="btn btn--gold btn--sm" href="#/trainer">Начать</a></div>';
    }
    var plan = DB.planStudyOf(user.id);
    return '<div class="glass card" style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' +
      '<span class="dot dot--green"></span><span style="flex:1;font-size:13.5px"><b>Тренажёр</b>' +
      '<span style="display:block;font-size:12.5px;color:var(--dust)">блоки · зачёты · экзамены уровней' +
      (plan && plan.status === 'approved' ? ' · маршрут утверждён' : '') + '</span></span>' +
      '<a class="btn btn--gold btn--sm" href="#/trainer">Открыть</a></div>';
  }

  function planCard(user) {
    var p = DB.studentPlanOf(user.id);
    if (!p) return '';
    var t = p.teacherId ? DB.user(p.teacherId) : null;
    return '<div class="glass card" style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' + ic('calendar') +
      '<span style="flex:1;font-size:13.5px"><b>' + p.perWeek + ' × ' + p.durationMin + ' мин в неделю</b>' +
      '<span style="display:block;font-size:12.5px;color:var(--dust)">' + (t ? esc(t.name) + ' · ' : '') + 'индивидуальные занятия' +
      (p.monthly ? ' · <b style="color:var(--ion)">$' + Number(p.monthly).toLocaleString('ru-RU') + '/мес</b>' : '') + '</span></span></div>';
  }

  function nextUnreadTopic() {
    var read = readMarks();
    for (var c = 0; c < (window.THEORY || []).length; c++) {
      var course = window.THEORY[c];
      for (var t = 0; t < course.topics.length; t++) {
        var key = course.id + '/' + course.topics[t].id;
        if (read.indexOf(key) === -1) return { course: course, topic: course.topics[t] };
      }
    }
    return null;
  }

  /* ═══════════ РАСПИСАНИЕ ═══════════ */

  function renderSchedule(user) {
    var lessons = DB.lessonsFor(user);
    var now = new Date();
    var mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
    var week = [];
    for (var i = 0; i < 7; i++) week.push(new Date(mon.getTime() + i * 86400000));
    var todayIso = DB.todayIso();
    var byDay = {};
    lessons.forEach(function (l) { (byDay[l.date] = byDay[l.date] || []).push(l); });

    var canEdit = user.role === 'admin' || user.role === 'teacher';

    var strip = '<div class="week-strip">' + week.map(function (d) {
      var iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      var has = (byDay[iso] || []).length > 0;
      return '<button class="week-strip__day' + (iso === todayIso ? ' week-strip__day--today' : '') + (has ? ' week-strip__day--has' : '') +
        '" data-jump="' + iso + '"><i>' + UI.WD_SHORT[(d.getDay() + 6) % 7] + '</i><b>' + d.getDate() + '</b><em></em></button>';
    }).join('') + '</div>';

    var daysWithLessons = week.filter(function (d) {
      var iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      return (byDay[iso] || []).length;
    });
    var list = daysWithLessons.length
      ? daysWithLessons.map(function (d) {
          var iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
          var label = UI.dayLabel(iso);
          if (label === UI.fmtDate(iso)) label = UI.WD[(d.getDay() + 6) % 7];
          return '<div class="day-head" id="day-' + iso + '"><b>' + esc(label) + '</b><span>' + UI.fmtDate(iso) + '</span></div>' +
            '<div class="stack">' + byDay[iso].map(function (l) { return lessonRow(l, user); }).join('') + '</div>';
        }).join('')
      : emptyBox('calendar', 'На этой неделе пусто', canEdit ? 'Создай первый урок кнопкой «+ Урок»' : 'Уроки появятся, когда их назначат');

    var head = '<div class="page-head"><p class="eyebrow">[ расписание · неделя ]</p>' +
      '<div class="page-head__row"><h1>Расписание</h1>' +
      (canEdit ? '<button class="btn btn--gold btn--sm" data-add-lesson>' + ic('plus') + ' Урок</button>' : '') +
      '</div><p>' + (user.role === 'student' ? 'Уроки твоих групп: время, тема и преподаватель' : 'Уроки по всем твоим группам') + '</p></div>';

    shell(user, 'schedule', head + strip + list, { wide: true });
    bindLessonDetails(user);
    bindAddLesson(user);
    app.querySelectorAll('[data-jump]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById('day-' + btn.dataset.jump);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function lessonRow(l, user) {
    var t = DB.user(l.teacherId);
    var st = DB.lessonStatus(l);
    return '<div class="lesson glass' + (st === 'live' ? ' lesson--live' : '') + '">' +
      '<div class="lesson__time"><b>' + esc(l.startTime) + '</b><span>' + l.durMin + ' мин</span></div>' +
      '<div class="lesson__main">' +
        '<div class="lesson__subject">' + subjectTag(l.subject) +
          (l.club ? '<span class="chip chip--gold">🗣 Speaking Club</span>' : '') +
          '<span>' + esc(l.topic || '') + '</span></div>' +
        (t ? '<div class="lesson__teacher">' + UI.avatar(t, 'sm') + esc(t.name) + '</div>' : '') +
      '</div>' +
      '<div class="lesson__side">' + statusChip(l) +
        '<button class="btn btn--ghost btn--sm" data-details="' + l.id + '">Детали</button>' +
      '</div>' +
    '</div>';
  }

  function bindLessonDetails(user) {
    app.querySelectorAll('[data-details]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var l = DB.lesson(btn.dataset.details);
        if (!l) return;
        var t = DB.user(l.teacherId);
        var hwList = DB.hwFor(user).filter(function (h) { return h.lessonId === l.id; });
        var mats = (l.materials || []).map(function (m) {
          return '<a class="btn btn--ghost btn--sm" href="' + esc(m.url || '#demo') + '" target="_blank" rel="noopener" data-demo-link>' + ic('book') + ' ' + esc(m.name) + '</a>';
        }).join('');
        var hwHtml = hwList.map(function (h) {
          var done = user.role === 'student' && h.doneBy.indexOf(user.id) !== -1;
          return '<div class="hw glass hw--' + (done ? 'done' : 'todo') + '" style="padding:12px 14px">' +
            '<div class="hw__main"><div class="hw__title">' + esc(h.title) + '</div>' +
            '<div class="hw__desc">до ' + UI.fmtDate(h.due) + '</div></div>' +
            (done ? '<span class="chip chip--ion">сдано</span>' : '') + '</div>';
        }).join('');
        var canEdit = user.role === 'admin' || (user.role === 'teacher' && DB.groupsFor(user).some(function (g2) { return g2.id === l.groupId; }));

        UI.modal(
          '<div class="modal__head"><h3>' + esc(l.subject) + '</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
          '<div class="modal__body">' +
            '<p style="color:var(--dust)">' + esc(l.topic || '') + '</p>' +
            '<div style="display:flex;flex-wrap:wrap;gap:8px">' + statusChip(l) + '<span class="chip">' + esc(UI.fmtDateFull(l.date)) + ' · ' + esc(l.startTime) + '</span>' +
            '</div>' +
            (t ? '<div class="lesson__teacher" style="font-size:14px">' + UI.avatar(t, 'md').replace('ava"', 'ava ava--gold"') + '<span><b style="color:var(--stardust)">' + esc(t.name) + '</b><br><span style="font-size:12px;color:var(--dust)">' + esc(t.subject || '') + '</span></span></div>' : '') +
            '<a class="btn btn--ion btn--full" href="#/room/' + l.id + '">' + ic('play') + ' Комната занятия</a>' +
            (mats ? '<div><p class="section-label" style="margin:6px 0 8px"><span>материалы</span></p><div style="display:flex;flex-wrap:wrap;gap:8px">' + mats + '</div></div>' : '') +
            (hwHtml ? '<div><p class="section-label" style="margin:6px 0 8px"><span>домашка</span></p><div class="stack">' + hwHtml + '</div></div>' : '') +
            (canEdit ? '<div style="display:flex;gap:10px"><button class="btn btn--ghost btn--full" data-edit-lesson="' + l.id + '">' + ic('edit') + ' Редактировать</button>' +
              '<button class="btn btn--danger btn--full" data-del-lesson="' + l.id + '">' + ic('trash') + ' Удалить</button></div>' : '') +
          '</div>'
        );

        document.querySelectorAll('[data-demo-link]').forEach(function (a) {
          a.addEventListener('click', function (e) {
            if (a.getAttribute('href') === '#demo') { e.preventDefault(); toast('Ссылка на материал не указана', 'warn'); }
          });
        });
        var editBtn = document.querySelector('[data-edit-lesson]');
        if (editBtn) editBtn.addEventListener('click', function () { lessonEditor(user, l); });
        var delBtn = document.querySelector('[data-del-lesson]');
        if (delBtn) delBtn.addEventListener('click', function () {
          var m = UI.modal(
            '<div class="modal__head"><h3>Удалить урок?</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
            '<p style="color:var(--dust);font-size:14px">Урок и связанная домашка исчезнут у группы.</p>' +
            '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Отмена</button>' +
            '<button class="btn btn--danger btn--full" id="delYes">Удалить</button></div>');
          m.el.querySelector('#delYes').addEventListener('click', function () {
            DB.removeLesson(l.id).then(function () { m.close(); toast('Урок удалён', 'warn'); rerender(); });
          });
        });
      });
    });
  }

  /* ═══════════ РЕДАКТОР УРОКА ═══════════ */

  function bindAddLesson(user) {
    app.querySelectorAll('[data-add-lesson]').forEach(function (btn) {
      btn.addEventListener('click', function () { lessonEditor(user, null); });
    });
  }

  function lessonEditor(user, existing) {
    var students = DB.myStudents ? DB.myStudents(user) : [];
    var teachers = user.role === 'admin'
      ? DB.allUsers().filter(function (u) { return u.role === 'teacher'; })
      : [user];
    if (!groups.length) { toast('Сначала создай группу (админ → Группы)', 'warn'); return; }

    var l = existing || {
      id: DB.newId('l'), studentId: students[0] ? students[0].id : '',
      teacherId: user.role === 'teacher' ? user.id : (teachers[0] ? teachers[0].id : ''),
      subject: '', topic: '', date: DB.todayIso(), startTime: '16:00', durMin: 90,
      room: 'https://meet.google.com/', materials: [],
    };
    var existingHw = DB.hwFor(user).filter(function (h) { return h.lessonId === l.id; })[0] || null;

    function optList(arr, sel) {
      return arr.map(function (x) { return '<option value="' + esc(x.v) + '" ' + (x.v === sel ? 'selected' : '') + '>' + esc(x.t) + '</option>'; }).join('');
    }

    UI.modal(
      '<div class="modal__head"><h3>' + (existing ? 'Редактировать урок' : 'Новый урок') + '</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
      '<div class="modal__body">' +
        '<label class="field"><span class="field__label">группа</span><select class="input" id="leGroup">' + optList(groups.map(function (g) { return { v: g.id, t: g.name }; }), l.groupId) + '</select></label>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
          '<label class="field"><span class="field__label">предмет</span><input class="input" id="leSubject" value="' + esc(l.subject) + '" placeholder="SAT Math"></label>' +
          '<label class="field"><span class="field__label">преподаватель</span><select class="input" id="leTeacher">' + optList(teachers.map(function (t) { return { v: t.id, t: t.name }; }), l.teacherId) + '</select></label>' +
        '</div>' +
        '<label class="field"><span class="field__label">тема урока</span><input class="input" id="leTopic" value="' + esc(l.topic) + '" placeholder="Проценты и пропорции"></label>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' +
          '<label class="field"><span class="field__label">дата</span><input class="input" id="leDate" type="date" value="' + esc(l.date) + '"></label>' +
          '<label class="field"><span class="field__label">начало</span><input class="input" id="leStart" type="time" value="' + esc(l.startTime) + '"></label>' +
          '<label class="field"><span class="field__label">минут</span><input class="input" id="leDur" type="number" min="15" max="240" value="' + l.durMin + '"></label>' +
        '</div>' +
        '<label class="field"><span class="field__label">ссылка на класс (meet/zoom)</span><input class="input" id="leRoom" value="' + esc(l.room) + '"></label>' +
        '<label class="opt-row' + (l.club ? ' opt-row--right' : '') + '" style="padding:6px 0;cursor:pointer">' +
          '<input type="checkbox" id="leClub" ' + (l.club ? 'checked' : '') + ' style="display:none">' +
          '<span class="opt-row__radio"></span><span>Speaking Club — групповая разговорная практика</span></label>' +
        '<label class="field"><span class="field__label">материалы — по строке на каждое: название | ссылка</span>' +
          '<textarea class="input" id="leMats" placeholder="Конспект: проценты | https://…">' + esc((l.materials || []).map(function (m) { return m.name + ' | ' + (m.url || ''); }).join('\n')) + '</textarea></label>' +
        '<div style="border-top:1px solid var(--line);padding-top:12px">' +
          '<p class="section-label" style="margin:0 0 10px"><span>домашка к уроку</span></p>' +
          '<label class="field"><span class="field__label">название</span><input class="input" id="leHwTitle" value="' + esc(existingHw ? existingHw.title : '') + '" placeholder="необязательно"></label>' +
          '<div style="display:grid;grid-template-columns:1fr 120px;gap:10px;margin-top:10px">' +
            '<label class="field"><span class="field__label">описание</span><input class="input" id="leHwDesc" value="' + esc(existingHw ? existingHw.descr || '' : '') + '"></label>' +
            '<label class="field"><span class="field__label">сдать до</span><input class="input" id="leHwDue" type="date" value="' + esc(existingHw ? existingHw.due : l.date) + '"></label>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn--gold btn--full" id="leSave">' + (existing ? 'Сохранить' : 'Создать урок ✦') + '</button>' +
      '</div>'
    );

    document.getElementById('leSave').addEventListener('click', function () {
      var v = function (id) { return document.getElementById(id).value.trim(); };
      var subject = v('leSubject'), date = v('leDate'), start = v('leStart');
      if (!subject || !date || !start) { toast('Заполни предмет, дату и время', 'warn'); return; }
      var mats = v('leMats').split('\n').map(function (line) {
        var p = line.split('|');
        return p[0].trim() ? { name: p[0].trim(), url: (p[1] || '').trim() } : null;
      }).filter(Boolean);

      var lesson = {
        id: l.id, groupId: v('leGroup'), teacherId: v('leTeacher'),
        subject: subject, topic: v('leTopic'), date: date,
        startTime: start, durMin: Math.max(15, +v('leDur') || 90),
        room: v('leRoom'), materials: mats,
        club: document.getElementById('leClub').checked,
      };
      DB.saveLesson(lesson).then(function () {
        var hwTitle = v('leHwTitle');
        if (hwTitle) {
          var record = existingHw || { id: DB.newId('h'), studentId: lesson.studentId, lessonId: lesson.id, doneBy: [] };
          record.title = hwTitle; record.descr = v('leHwDesc'); record.due = v('leHwDue') || date; record.studentId = lesson.studentId;
          return DB.saveHomework ? DB.saveHomework(record) : saveHw(record);
        } else if (existingHw) {
          return DB.removeHomework(existingHw.id);
        }
      }).then(function () {
        toast(existing ? 'Урок обновлён' : 'Урок создан ✦');
        location.hash = '#/schedule';
        rerender();
      });
    });
  }

  /* ═══════════ ДОМАШКА ═══════════ */

  function hwItem(h, user) {
    var done = h.doneBy.indexOf(user.id) !== -1;
    var late = h.due < DB.todayIso() && !done;
    var lesson = DB.lesson(h.lessonId);
    return '<div class="hw glass hw--' + (done ? 'done' : 'todo') + '">' +
      '<button class="hw__check" data-hw="' + h.id + '" aria-label="Отметить выполненным">' + ic('check') + '</button>' +
      '<div class="hw__main"><div class="hw__title">' + esc(h.title) + '</div>' +
        '<div class="hw__desc">' + esc(h.descr || '') + (lesson ? ' · ' + esc(lesson.subject) : '') + '</div></div>' +
      '<div class="hw__due' + (late ? ' hw__due--late' : '') + '"><span>' + (done ? 'сдано' : 'до ' + UI.fmtDate(h.due)) + '</span>' +
        (late ? '<span>просрочено</span>' : '') + '</div>' +
    '</div>';
  }

  function renderHomework(user) {
    var hw = DB.hwFor(user);
    var body = hw.length
      ? '<div class="stack">' + hw.map(function (h) { return hwItem(h, user); }).join('') + '</div>'
      : emptyBox('check', 'Домашки нет', 'Задания появятся после уроков');
    shell(user, 'more',
      '<div class="page-head"><p class="eyebrow">[ домашка ]</p><h1>Домашние задания</h1>' +
      '<p>Отмечай выполненное — преподаватель увидит сразу</p></div>' + body);
    bindHwChecks(user);
  }

  function bindHwChecks(user) {
    if (user.role !== 'student') return;
    app.querySelectorAll('[data-hw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var hw = DB.homework(btn.dataset.hw);
        var wasDone = hw.doneBy.indexOf(user.id) !== -1;
        DB.toggleHwDone(hw.id, user.id).then(function () {
          if (!wasDone) { DB.addXp(user.id, 5).then(function () { toast('Сдано! +5 XP ✦'); rerender(); }); }
          else { toast('Возвращено в работу', 'warn'); rerender(); }
        });
      });
    });
  }

  /* ═══════════ ТЕСТЫ: СПИСОК ═══════════ */

  function bestAttempt(studentId, testId) {
    var all = DB.attemptsForTest(testId).filter(function (a) { return a.studentId === studentId; });
    if (!all.length) return null;
    return all.reduce(function (best, a) { return (a.score / a.max > best.score / best.max) ? a : best; });
  }

  function theoryLink(t) {
    if (!t.theory) return '';
    return '<a class="chip chip--gold" href="#/theory/' + t.theory.course + '/' + t.theory.topic + '">⌁ повторить теорию</a>';
  }

  function testCard(t, user, best) {
    var author = t.authorId ? DB.user(t.authorId) : null;
    return '<div class="test-card glass">' +
      '<div class="test-card__top"><h3>' + esc(t.title) + '</h3>' + subjectTag(t.subject) + '</div>' +
      '<div class="test-card__meta">' +
        '<span class="chip">' + ic('clipboard') + ' ' + t.questions.length + ' ' + UI.plural(t.questions.length, 'вопрос', 'вопроса', 'вопросов') + '</span>' +
        '<span class="chip">' + ic('clock') + ' ' + t.timeMin + ' min</span>' +
        (author ? '<span class="chip">' + esc(author.name) + '</span>' : '') +
        (user.role === 'student' ? theoryLink(t) : '') +
      '</div>' +
      '<div class="test-card__foot">' +
        (best
          ? '<span class="test-card__score">best: <b>' + best.score + '/' + best.max + '</b></span>' +
            '<a class="btn btn--ghost btn--sm" href="#/test/' + t.id + '">Пройти снова</a>'
          : '<span class="test-card__score mono" style="font-size:11px;color:var(--dust-2)">не пройден</span>' +
            '<a class="btn btn--gold btn--sm" href="#/test/' + t.id + '">' + ic('play') + ' Начать</a>') +
      '</div>' +
    '</div>';
  }

  function renderTests(user) {
    var tests = DB.testsFor(user);
    var body = '';

    if (user.role === 'teacher' || user.role === 'admin') {
      var mine = tests.filter(function (t) { return t.authorId === user.id; });
      var bank = tests.filter(function (t) { return !t.authorId; });
      var others = tests.filter(function (t) { return t.authorId && t.authorId !== user.id; });

      body = '<div class="page-head"><p class="eyebrow">[ тесты · база и конструктор ]</p>' +
        '<div class="page-head__row"><h1>Тесты</h1>' +
        '<a class="btn btn--gold btn--sm" href="#/builder">' + ic('plus') + ' Новый</a></div>' +
        '<p>Банк школы на английском + твои собственные тесты. Результаты — по кнопке</p></div>';

      body += mine.length
        ? '<div class="stack">' + mine.map(function (t) {
            var attempts = DB.attemptsForTest(t.id);
            return '<div class="test-card glass">' +
              '<div class="test-card__top"><h3>' + esc(t.title) + '</h3>' + subjectTag(t.subject) + '</div>' +
              '<div class="test-card__meta">' +
                '<span class="chip">' + t.questions.length + ' вопр.</span>' +
                '<span class="chip">' + t.timeMin + ' min</span>' +
                '<span class="chip chip--ion">' + t.assignedGroups.map(function (g) { var x = DB.group(g); return x ? x.name : g; }).join(', ') + '</span>' +
                '<span class="chip">' + attempts.length + ' попыток</span>' +
              '</div>' +
              '<div class="test-card__foot">' +
                '<button class="btn btn--ghost btn--sm" data-results="' + t.id + '">Результаты</button>' +
                '<div style="display:flex;gap:8px">' +
                  '<a class="icon-btn" href="#/builder/' + t.id + '" aria-label="Редактировать">' + ic('edit') + '</a>' +
                  '<button class="icon-btn icon-btn--danger" data-del="' + t.id + '" aria-label="Удалить">' + ic('trash') + '</button>' +
                '</div></div></div>';
          }).join('') + '</div>'
        : emptyBox('clipboard', 'Своих тестов пока нет', 'Создай первый — он сразу появится у учеников выбранных групп');

      if (bank.length) {
        body += '<p class="section-label"><span>банк школы · english</span></p><div class="stack">' + bank.map(function (t) {
          var attempts = DB.attemptsForTest(t.id);
          return '<div class="test-card glass">' +
            '<div class="test-card__top"><h3>' + esc(t.title) + '</h3>' + subjectTag(t.subject) + '</div>' +
            '<div class="test-card__meta"><span class="chip">' + t.questions.length + ' вопр.</span>' +
            '<span class="chip">' + t.timeMin + ' min</span><span class="chip">' + attempts.length + ' попыток</span></div>' +
            '<div class="test-card__foot"><button class="btn btn--ghost btn--sm" data-results="' + t.id + '">Результаты</button>' +
            (t.theory ? '<a class="chip chip--gold" href="#/theory/' + t.theory.course + '/' + t.theory.topic + '">⌁ теория</a>' : '') + '</div></div>';
        }).join('') + '</div>';
      }
      if (others.length) {
        body += '<p class="section-label"><span>тесты коллег</span></p><div class="stack">' + others.map(function (t) {
          var attempts = DB.attemptsForTest(t.id);
          return '<div class="test-card glass"><div class="test-card__top"><h3>' + esc(t.title) + '</h3>' + subjectTag(t.subject) + '</div>' +
            '<div class="test-card__meta"><span class="chip">' + attempts.length + ' попыток</span></div>' +
            '<div class="test-card__foot"><button class="btn btn--ghost btn--sm" data-results="' + t.id + '">Результаты</button></div></div>';
        }).join('') + '</div>';
      }

      shell(user, 'tests', body, { wide: true });
      app.querySelectorAll('[data-results]').forEach(function (b) {
        b.addEventListener('click', function () { Tests.showAttempts(b.dataset.results); });
      });
      app.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var m = UI.modal(
            '<div class="modal__head"><h3>Удалить тест?</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
            '<p style="color:var(--dust);font-size:14px">Тест исчезнет у учеников вместе с результатами.</p>' +
            '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Отмена</button>' +
            '<button class="btn btn--danger btn--full" id="delYes">Удалить</button></div>');
          m.el.querySelector('#delYes').addEventListener('click', function () {
            DB.removeTest(b.dataset.del).then(function () { m.close(); toast('Тест удалён', 'warn'); rerender(); });
          });
        });
      });
      return;
    }

    /* ученик */
    body = '<div class="page-head"><p class="eyebrow">[ тесты · тренировки · english ]</p><h1>Тесты</h1>' +
      '<p>Every question is in English — as on the real exam. +10 XP за верный ответ</p></div>';
    body += tests.length
      ? '<div class="stack">' + tests.map(function (t) { return testCard(t, user, bestAttempt(user.id, t.id)); }).join('') + '</div>'
      : emptyBox('clipboard', 'Тестов пока нет', 'Твоему учителю нужно назначить группу');
    shell(user, 'tests', body);
  }

  /* ═══════════ ТЕОРИЯ ═══════════ */

  function renderTheory(user) {
    var read = readMarks();
    var cards = (window.THEORY || []).map(function (c) {
      var done = c.topics.filter(function (t) { return read.indexOf(c.id + '/' + t.id) !== -1; }).length;
      var pct = Math.round(done / c.topics.length * 100);
      return '<a class="test-card glass" href="#/theory/' + c.id + '">' +
        '<div class="test-card__top"><h3><span class="card__icon" style="display:inline-grid;place-items:center;width:38px;height:38px;border-radius:11px;background:rgba(103,232,249,.08);border:1px solid rgba(103,232,249,.25);color:var(--ion);font-size:17px;margin-right:10px">' + (c.icon || '✦') + '</span>' + esc(c.title) + '</h3></div>' +
        '<div class="test-card__meta"><span class="chip">' + c.topics.length + ' тем</span><span class="chip chip--ion">' + done + ' прочитано</span></div>' +
        '<div class="orbit-wrap__bar"><i style="width:' + pct + '%"></i></div>' +
        '</a>';
    }).join('');

    shell(user, 'theory',
      '<div class="page-head"><p class="eyebrow">[ теория · библиотека ]</p><h1>Теория</h1>' +
      '<p>Concise theory in Russian with English terms — читай перед тестом</p></div>' +
      '<div class="stack">' + cards + '</div>');
  }

  function renderTheoryCourse(user, courseId) {
    var c = (window.THEORY || []).find(function (x) { return x.id === courseId; });
    if (!c) { location.hash = '#/theory'; return; }
    var read = readMarks();
    var list = c.topics.map(function (t, i) {
      var isRead = read.indexOf(c.id + '/' + t.id) !== -1;
      return '<a class="test-card glass" href="#/theory/' + c.id + '/' + t.id + '">' +
        '<div class="test-card__top"><h3>' + (i + 1) + '. ' + esc(t.title) + '</h3>' + (isRead ? '<span class="chip chip--ion">✓ прочитано</span>' : '') + '</div>' +
        '<div class="test-card__foot"><span class="test-card__score mono" style="font-size:11px;color:var(--dust-2)">' + t.minutes + ' мин' +
        (t.test ? ' · есть тест' : '') + '</span><span class="btn btn--ghost btn--sm">Открыть</span></div></a>';
    }).join('');

    shell(user, 'theory',
      '<div class="page-head"><p class="eyebrow">[ теория · ' + esc(c.title) + ' ]</p>' +
      '<div class="page-head__row"><h1>' + esc(c.title) + '</h1><a class="icon-btn" href="#/theory" aria-label="Назад">' + ic('back') + '</a></div></div>' +
      '<div class="stack">' + list + '</div>');
  }

  function renderTheoryTopic(user, courseId, topicId) {
    var c = (window.THEORY || []).find(function (x) { return x.id === courseId; });
    var t = c && c.topics.find(function (x) { return x.id === topicId; });
    if (!t) { location.hash = '#/theory'; return; }
    markRead(c.id + '/' + t.id);

    var idx = c.topics.indexOf(t);
    var nextT = c.topics[idx + 1];

    shell(user, 'theory',
      '<div class="page-head"><p class="eyebrow">[ теория · ' + esc(c.title) + ' ]</p>' +
      '<div class="page-head__row"><h1>' + esc(t.title) + '</h1><a class="icon-btn" href="#/theory/' + c.id + '" aria-label="Назад">' + ic('back') + '</a></div>' +
      '<p class="mono" style="font-size:11px;color:var(--dust-2);margin-top:6px">' + t.minutes + ' мин · отмечено как прочитано ✓</p></div>' +
      '<div class="glass card theory-body">' + t.body + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">' +
        (t.test ? '<a class="btn btn--gold" href="#/test/' + t.test + '">' + ic('play') + ' Решить тест по теме</a>' : '') +
        (nextT ? '<a class="btn btn--ghost" href="#/theory/' + c.id + '/' + nextT.id + '">Следующая тема →</a>' : '') +
      '</div>');
  }

  /* ═══════════ ПРОГРЕСС (ученик) ═══════════ */

  function renderProgress(user) {
    var xp = user.xp || 0;
    var lvl = DB.levelOf(xp);
    var pct = lvl.next ? Math.min(100, Math.round((xp - lvl.level.min) / (lvl.next.min - lvl.level.min) * 100)) : 100;
    var attempts = DB.attemptsBy(user.id);
    var mocks = DB.mockResultsBy(user.id);

    var badges = [
      { on: attempts.length >= 1, icon: 'play', label: 'Первый запуск' },
      { on: (user.streak || 0) >= 3, icon: 'fire', label: 'Серия 3+' },
      { on: attempts.some(function (a) { return a.score === a.max; }), icon: 'star', label: '100% сгорание' },
      { on: attempts.length >= 5, icon: 'rocket', label: '5 тренировок' },
      { on: mocks.length >= 1, icon: 'clipboard', label: 'Первый пробник' },
      { on: mocks.some(function (m) { return m.total >= 1200; }), icon: 'chart', label: 'SAT 1200+' },
      { on: mocks.some(function (m) { return m.total >= 1400; }), icon: 'star', label: 'SAT 1400+' },
    ];

    var levels = DB.levels.map(function (l) {
      var cls = xp >= l.min ? (lvl.level === l ? 'level-row--cur' : 'level-row--done') : '';
      return '<div class="level-row ' + cls + '"><span class="level-row__dot"></span><b>' + esc(l.name) + '</b><span>' + l.min + '+ XP</span></div>';
    }).join('');

    var history = attempts.map(function (a) {
      var t = DB.test(a.testId);
      var p = Math.round(a.score / a.max * 100);
      return '<a class="attempt glass" href="#/review/' + a.id + '">' +
        '<span class="attempt__score ' + (p >= 70 ? 'attempt__score--good' : p < 50 ? 'attempt__score--bad' : '') + '">' + a.score + '/' + a.max + '</span>' +
        '<div class="attempt__main"><b>' + esc(t ? t.title : a.testId) + '</b><span>' + UI.dayLabel(a.date) + ' · ' + Math.round(a.durSec / 60) + ' min · тапни для разбора</span></div>' +
        '</a>';
    }).join('');

    shell(user, 'more',
      '<div class="page-head"><p class="eyebrow">[ прогресс · телеметрия ]</p><h1>Твоя орбита</h1></div>' +
      orbitCard(xp, pct) +
      '<p class="section-label"><span>значки</span></p>' +
      '<div class="badges">' + badges.map(function (b) {
        return '<span class="badge' + (b.on ? ' badge--on' : '') + '">' + ic(b.icon) + ' ' + esc(b.label) + '</span>';
      }).join('') + '</div>' +
      '<p class="section-label"><span>карта уровней</span></p>' +
      '<div class="glass card"><div class="levels-track" style="position:relative">' + levels + '</div></div>' +
      '<p class="section-label"><span>история попыток</span></p>' +
      (history ? '<div class="stack">' + history + '</div>' : emptyBox('chart', 'Попыток пока нет', 'Пройди первый тест — и здесь появится телеметрия')) +
      '<p class="section-label"><span>динамика пробников SAT</span></p>' +
      (mocks.length >= 2 ? mockTrendChart(mocks) : mocks.length === 1
        ? emptyBox('chart', 'Нужен второй пробник', 'Сдай ещё один — и появится график динамики')
        : emptyBox('chart', 'Пробников пока нет', 'Раздел «Пробник» ждёт тебя')));
  }

  function mockTrendChart(mocks) {
    var w = 640, h = 160, pad = 30;
    var pts = mocks.map(function (m, i) {
      return {
        x: pad + (i * (w - pad * 2)) / Math.max(1, mocks.length - 1),
        y: h - pad - ((m.total - 400) / 1200) * (h - pad * 2),
        total: m.total,
        date: m.date,
      };
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
    var dots = pts.map(function (p) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="5" fill="#F5C24B"/>' +
        '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 12).toFixed(1) + '" text-anchor="middle" fill="#EDEBFF" font-size="13" font-family="JetBrains Mono">' + p.total + '</text>';
    }).join('');
    return '<div class="glass card"><svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:auto">' +
      '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + (w - pad) + '" y2="' + (h - pad) + '" stroke="rgba(237,235,255,.15)"/>' +
      '<path d="' + line + '" fill="none" stroke="#67E8F9" stroke-width="2.5"/>' + dots + '</svg></div>';
  }

  /* ═══════════ ОПЛАТЫ (ученик) ═══════════ */

  function renderPaymentsStudent(user) {
    var list = DB.paymentsFor(user.id);
    var rows = list.map(function (p) {
      return '<div class="attempt glass">' +
        '<span class="attempt__score ' + (p.status === 'paid' ? 'attempt__score--good' : 'attempt__score--bad') + '">' +
        (p.status === 'paid' ? 'оплачено' : 'ожидается') + '</span>' +
        '<div class="attempt__main"><b>' + esc(p.month) + ' · ' + esc(String(p.amount)) + ' ' + esc(p.currency) + '</b>' +
        '<span>' + esc(p.method || '') + (p.note ? ' · ' + esc(p.note) : '') + '</span></div></div>';
    }).join('');
    shell(user, 'more',
      '<div class="page-head"><p class="eyebrow">[ оплаты · история ]</p><h1>Мои оплаты</h1></div>' +
      (rows || emptyBox('clipboard', 'Платежей пока нет', 'Админ добавит записи — они появятся здесь')));
  }

  /* ═══════════ УЧЕНИКИ (учитель) ═══════════ */

  function renderStudents(user) {
    var students = DB.myStudents ? DB.myStudents(user) : [];
    var body = '<div class="page-head"><p class="eyebrow">[ ученики · экипаж ]</p><h1>Ученики</h1></div>';
    var rows = students.map(function (s) {
      var lvl = DB.levelOf(s.xp || 0);
      var at = DB.attemptsBy(s.id);
      var avg = at.length ? Math.round(at.reduce(function (acc, a) { return acc + a.score / a.max; }, 0) / at.length * 100) : null;
      return '<a class="student-row" href="#/student/' + s.id + '">' +
        UI.avatar(s, 'md') +
        '<div class="student-row__main"><b>' + esc(s.name) + '</b><span>' + esc(lvl.level.name) + ' · серия ' + (s.streak || 0) + '</span></div>' +
        '<div class="student-row__stats"><b>' + (avg === null ? '—' : avg + '%') + '</b><span>' + (s.xp || 0) + ' XP</span></div>' +
        '</a>';
    }).join('');
    body += '<div class="glass" style="padding:6px 0">' + (rows || emptyBox('users', 'Пусто', 'Создай учеников в админ-панели')) + '</div>';
    shell(user, 'students', body, { wide: true });
  }

  function renderStudentCard(user, studentId) {
    var s = DB.user(studentId);
    if (!s || s.role !== 'student') { location.hash = '#/students'; return; }
    var lvl = DB.levelOf(s.xp || 0);
    var attempts = DB.attemptsBy(studentId);
    var hw = DB.hwFor(s);
    var hwDone = hw.filter(function (h) { return h.doneBy.indexOf(studentId) !== -1; }).length;
    var pays = DB.paymentsFor(studentId);
    var lastPay = pays[0];
    var mocks = DB.mockResultsBy(studentId);
    var lastMock = mocks[mocks.length - 1];

    var history = attempts.map(function (a) {
      var t = DB.test(a.testId);
      var p = Math.round(a.score / a.max * 100);
      return '<div class="attempt glass">' +
        '<span class="attempt__score ' + (p >= 70 ? 'attempt__score--good' : p < 50 ? 'attempt__score--bad' : '') + '">' + a.score + '/' + a.max + '</span>' +
        '<div class="attempt__main"><b>' + esc(t ? t.title : a.testId) + '</b><span>' + UI.dayLabel(a.date) + ' · ' + Math.round(a.durSec / 60) + ' мин</span></div></div>';
    }).join('');

    shell(user, 'students',
      '<div class="page-head"><p class="eyebrow">[ карточка ученика ]</p>' +
      '<div class="page-head__row"><h1>' + esc(s.name) + '</h1>' +
      '<div style="display:flex;gap:8px">' +
      '<a class="btn btn--ghost btn--sm" href="#/route/' + s.id + '">🧭 Маршрут</a>' +
      '<a class="icon-btn" href="#/students" aria-label="Назад">' + ic('back') + '</a></div></div></div>' +
      '<div class="glass orbit-wrap" style="margin-bottom:12px">' + UI.avatar(s, 'lg') +
        '<div class="orbit-wrap__info" style="flex:1"><b>' + esc(lvl.level.name) + '</b>' +
        '<span>' + (s.xp || 0) + ' XP · серия ' + (s.streak || 0) + ' · домашка ' + hwDone + '/' + hw.length +
        (lastPay ? ' · оплата ' + esc(lastPay.month) + ': ' + (lastPay.status === 'paid' ? '✓' : 'ждётся') : '') + '</span>' +
        (lastMock ? '<span style="display:block;color:var(--ion);font-size:13px">SAT пробник: <b>' + lastMock.total + '</b> (RW ' + lastMock.rw + ' · Math ' + lastMock.math + ')</span>' : '') +
        '</div></div>' +
      '<p class="section-label"><span>попытки тестов</span></p>' +
      (history || emptyBox('clipboard', 'Ещё не решал', 'Как только ученик пройдёт тест, результаты появятся здесь')));
  }

  /* ═══════════ АДМИН: ПОЛЬЗОВАТЕЛИ ═══════════ */

  function renderAdminUsers(user) {
    var users = DB.allUsers();
    var state = { q: '', role: 'all' };

    function draw() {
      var list = users.filter(function (u) {
        if (state.role !== 'all' && u.role !== state.role) return false;
        var q = state.q.toLowerCase();
        return !q || u.name.toLowerCase().indexOf(q) !== -1 || u.login.toLowerCase().indexOf(q) !== -1;
      }).sort(function (a, b) { return a.role.localeCompare(b.role) || a.name.localeCompare(b.name); });

      var rows = list.map(function (u) {
        var g = u.groupId ? DB.group(u.groupId) : null;
        return '<div class="student-row glass" style="margin-bottom:8px;padding:13px 16px">' +
          UI.avatar(u, 'md').replace('ava--md', u.role === 'teacher' || u.role === 'admin' ? 'ava ava--md ava--gold' : 'ava ava--md') +
          '<div class="student-row__main"><b>' + esc(u.name) + (u.active === false ? ' <span class="chip chip--past">отключён</span>' : '') + '</b>' +
          '<span class="mono" style="font-size:11px">' + esc(u.login) + ' · ' + esc(g ? g.name : (u.subject || '')) + '</span></div>' +
          '<div style="display:flex;align-items:center;gap:8px">' + roleChip(u.role) +
          '<button class="icon-btn" data-edit="' + u.id + '" aria-label="Редактировать">' + ic('edit') + '</button>' +
          '<button class="icon-btn" data-pass="' + u.id + '" aria-label="Сбросить пароль" title="Сбросить пароль">' + ic('clock') + '</button>' +
          '<button class="icon-btn icon-btn--danger" data-del="' + u.id + '" aria-label="Удалить">' + ic('trash') + '</button>' +
          '</div></div>';
      }).join('');

      shell(user, 'admin-users',
        '<div class="page-head"><p class="eyebrow">[ люди · управление ]</p>' +
        '<div class="page-head__row"><h1>Пользователи</h1>' +
        '<button class="btn btn--gold btn--sm" id="addUser">' + ic('plus') + ' Создать</button></div>' +
        '<p>Аккаунты создаёт только админ. Пароли хранятся хэшем — сбрасывай при необходимости</p></div>' +
        '<input class="input" id="uq" placeholder="Поиск по имени или логину…" style="margin-bottom:10px" value="' + esc(state.q) + '">' +
        '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">' +
          ['all:Все', 'student:Ученики', 'teacher:Преподаватели', 'admin:Админы'].map(function (x) {
            var p = x.split(':');
            return '<button class="chip' + (state.role === p[0] ? ' chip--ion' : '') + '" data-role="' + p[0] + '" style="cursor:pointer">' + p[1] + '</button>';
          }).join('') + '</div>' +
        (rows || emptyBox('users', 'Никого не найдено', 'Измени фильтр или создай аккаунт')));

      var qInput = document.getElementById('uq');
      qInput.addEventListener('input', function () {
        state.q = qInput.value;
        draw();
        var fresh = document.getElementById('uq');
        fresh.focus();
        fresh.setSelectionRange(fresh.value.length, fresh.value.length);
      });
      app.querySelectorAll('[data-role]').forEach(function (b) {
        b.addEventListener('click', function () { state.role = b.dataset.role; draw(); });
      });
      document.getElementById('addUser').addEventListener('click', function () { userModal(null); });
      app.querySelectorAll('[data-edit]').forEach(function (b) {
        b.addEventListener('click', function () { userModal(DB.user(b.dataset.edit)); });
      });
      function genPass() {
        var chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        var out = '';
        for (var i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
      }
      app.querySelectorAll('[data-pass]').forEach(function (b) {
        b.addEventListener('click', function () {
          var target = DB.user(b.dataset.pass);
          var m = UI.modal(
            '<div class="modal__head"><h3>Сброс пароля · ' + esc(target.name) + '</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
            '<div class="modal__body">' +
            '<label class="field"><span class="field__label">новый пароль для ' + esc(target.name.split(' ')[0]) + ' (можно поменять)</span>' +
            '<input class="input" id="npPass" type="text" minlength="6" value="' + genPass() + '" style="font-family:var(--font-mono);font-size:15px"></label>' +
            '<label class="field"><span class="field__label">подтверди своим паролем админа</span>' +
            '<input class="input" id="npAdmin" type="password" placeholder="твой пароль" autocomplete="current-password"></label>' +
            '<p style="font-size:12px;color:var(--dust)">Скопируй пароль и отправь ученику. Он сможет сменить его в настройках.</p></div>' +
            '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Отмена</button>' +
            '<button class="btn btn--gold btn--full" id="npSave">Сбросить</button></div>');
          m.el.querySelector('#npSave').addEventListener('click', function () {
            var v = m.el.querySelector('#npPass').value;
            var ap = m.el.querySelector('#npAdmin').value;
            if (v.length < 6) { toast('Минимум 6 символов', 'warn'); return; }
            if (!ap) { toast('Введи свой пароль администратора', 'warn'); return; }
            DB.resetPassword(target.id, v, user.login, ap).then(function (r) {
              if (r.error) { toast(r.error, 'warn'); return; }
              m.close(); toast('Пароль обновлён ✦');
            });
          });
        });
      });
      app.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var target = DB.user(b.dataset.del);
          if (target.id === user.id) { toast('Нельзя удалить свой аккаунт', 'warn'); return; }
          var m = UI.modal(
            '<div class="modal__head"><h3>Удалить ' + esc(target.name) + '?</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
            '<p style="color:var(--dust);font-size:14px">Аккаунт исчезнет из групп. Попытки и оплаты останутся в архиве.</p>' +
            '<label class="field" style="margin-top:10px"><span class="field__label">твой пароль администратора</span>' +
            '<input class="input" id="delAdmin" type="password" autocomplete="current-password"></label>' +
            '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Отмена</button>' +
            '<button class="btn btn--danger btn--full" id="delYes">Удалить</button></div>');
          m.el.querySelector('#delYes').addEventListener('click', function () {
            var ap = m.el.querySelector('#delAdmin').value;
            if (!ap) { toast('Введи пароль администратора', 'warn'); return; }
            DB.deleteUser(target.id, user.login, ap).then(function (r) {
              if (r && r.error) { toast(r.error, 'warn'); return; }
              m.close(); toast('Аккаунт удалён', 'warn'); draw();
            });
          });
        });
      });
    }

    function userModal(existing) {
      var groups = [];
      var isEdit = !!existing;
      var u = existing || { id: DB.newId('u'), role: 'student', name: '', login: '', subject: '', groupId: (groups[0] || {}).id || '', active: true };
      UI.modal(
        '<div class="modal__head"><h3>' + (isEdit ? 'Редактировать аккаунт' : 'Новый аккаунт') + '</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
        '<div class="modal__body">' +
          '<label class="field"><span class="field__label">имя</span><input class="input" id="umName" value="' + esc(u.name) + '" maxlength="40"></label>' +
          '<label class="field"><span class="field__label">логин (латиница)</span><input class="input" id="umLogin" value="' + esc(u.login) + '" pattern="[a-zA-Z0-9_.]{3,20}"></label>' +
          '<label class="field"><span class="field__label">роль</span><select class="input" id="umRole">' +
            [['student', 'ученик'], ['teacher', 'преподаватель'], ['admin', 'администратор']].map(function (p) {
              return '<option value="' + p[0] + '" ' + (u.role === p[0] ? 'selected' : '') + '>' + p[1] + '</option>';
            }).join('') + '</select></label>' +
          '<label class="field" id="umSubjectWrap" style="display:none"><span class="field__label">предмет преподавателя</span><input class="input" id="umSubject" value="' + esc(u.subject || '') + '" placeholder="SAT Math · Математика"></label>' +
          '<label class="field" id="umRateWrap" style="display:none"><span class="field__label">ставка, $/час (для цены обучения)</span><input class="input" id="umRate" type="number" min="0" value="' + esc(u.rate || 0) + '"></label>' +
          '<label class="field" id="umGroupWrap" style="display:none"><span class="field__label">преподаватель ученика</span><select class="input" id="umTeacher">' +
            DB.allUsers().filter(function (t) { return t.role === 'teacher'; }).map(function (t) { return '<option value="' + t.id + '" ' + (u.teacherId === t.id ? 'selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
          (isEdit ? '' : '<label class="field"><span class="field__label">начальный пароль</span><input class="input" id="umPass" type="text" minlength="6" placeholder="минимум 6 символов"></label>') +
          (isEdit ? '<label class="field"><span class="field__label">статус</span><select class="input" id="umActive">' +
            '<option value="on" ' + (u.active !== false ? 'selected' : '') + '>активен</option>' +
            '<option value="off" ' + (u.active === false ? 'selected' : '') + '>отключён (вход запрещён)</option></select></label>' : '') +
          (isEdit ? '' : '<label class="field"><span class="field__label">твой пароль администратора (подтверждение)</span><input class="input" id="umSudo" type="password" autocomplete="current-password"></label>') +
          '<button class="btn btn--gold btn--full" id="umSave">' + (isEdit ? 'Сохранить' : 'Создать аккаунт ✦') + '</button>' +
        '</div>'
      );
      var roleSel = document.getElementById('umRole');
      function syncRole() {
        document.getElementById('umSubjectWrap').style.display = roleSel.value === 'teacher' ? '' : 'none';
        document.getElementById('umRateWrap').style.display = roleSel.value === 'teacher' ? '' : 'none';
        document.getElementById('umGroupWrap').style.display = roleSel.value === 'student' ? '' : 'none';
      }
      roleSel.addEventListener('change', syncRole); syncRole();

      document.getElementById('umSave').addEventListener('click', function () {
        var v = function (id) { return document.getElementById(id).value.trim(); };
        var name = v('umName'), login = v('umLogin').toLowerCase();
        if (!name || !login) { toast('Заполни имя и логин', 'warn'); return; }
        var role = roleSel.value;
        var record = Object.assign({}, u, {
          name: name, login: login, role: role,
          subject: role === 'teacher' ? v('umSubject') : (role === 'admin' ? 'Администратор' : ''),
          rate: role === 'teacher' ? (+document.getElementById('umRate').value || 0) : (u.rate || 0),
          teacherId: role === 'student' ? v('umTeacher') : '',
        });
        if (isEdit) {
          record.active = document.getElementById('umActive').value === 'on';
          DB.saveUser(record).then(function (r) {
            if (r && r.error) { toast(r.error, 'warn'); return; }
            toast('Сохранено ✦'); rerender();
          });
        } else {
          var pass = document.getElementById('umPass').value;
          if (pass.length < 6) { toast('Пароль: минимум 6 символов', 'warn'); return; }
          var sudo = document.getElementById('umSudo').value;
          if (!sudo) { toast('Введи свой пароль администратора', 'warn'); return; }
          if (DB.adapterName() === 'supabase') {
            /* хэш создаёт сервер (pgcrypto), клиент паролей не касается */
            DB.rpcCreateUser(user.login, sudo, record, pass).then(function (r) {
              if (r && r.error) { toast(r.error, 'warn'); return; }
              toast('Аккаунт создан. Передай логин и пароль ученику ✦'); rerender();
            });
            return;
          }
          var salt = DB.randomSalt();
          DB.hashPassword(pass, salt).then(function (hash) {
            record.passHash = hash; record.salt = salt; record.active = true;
            record.xp = 0; record.streak = 0; record.createdAt = DB.todayIso();
            return DB.saveUser(record);
          }).then(function (r) {
            if (r && r.error) { toast(r.error, 'warn'); return; }
            toast('Аккаунт создан. Передай логин и пароль ученику ✦'); rerender();
          });
        }
      });
    }

    draw();
  }

  /* ═══════════ АДМИН: ОПЛАТЫ ═══════════ */

  function renderAdminPayments(user) {
    function draw() {
      var payments = DB.allPayments();
      var students = DB.allUsers().filter(function (u) { return u.role === 'student' && u.active !== false; });
      var now = new Date();
      var month = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
      var paidM = payments.filter(function (p) { return p.month === month && p.status === 'paid'; });
      var uz = paidM.filter(function (p) { return p.currency === 'UZS'; }).reduce(function (a, p) { return a + Number(p.amount || 0); }, 0);
      var usd = paidM.filter(function (p) { return p.currency === 'USD'; }).reduce(function (a, p) { return a + Number(p.amount || 0); }, 0);

      var rows = payments.map(function (p) {
        var s = DB.user(p.studentId);
        return '<div class="attempt glass">' +
          '<span class="attempt__score ' + (p.status === 'paid' ? 'attempt__score--good' : 'attempt__score--bad') + '">' +
          (p.status === 'paid' ? 'оплачено' : 'ждётся') + '</span>' +
          '<div class="attempt__main"><b>' + esc(s ? s.name : '?') + ' · ' + esc(String(p.amount)) + ' ' + esc(p.currency) + '</b>' +
          '<span>' + esc(p.month) + ' · ' + esc(p.method || '—') + (p.note ? ' · ' + esc(p.note) : '') + '</span></div>' +
          '<button class="icon-btn icon-btn--danger" data-delpay="' + p.id + '" aria-label="Удалить">' + ic('trash') + '</button>' +
          '</div>';
      }).join('');

      shell(user, 'admin-payments',
        '<div class="page-head"><p class="eyebrow">[ оплаты · журнал ]</p><h1>Оплаты</h1>' +
        '<p>Собрано за ' + esc(month) + ': <b style="color:var(--green)">' + uz.toLocaleString('ru-RU') + ' UZS</b>' + (usd ? ' · $' + usd : '') + '</p></div>' +
        '<div class="glass card stack" style="margin-bottom:16px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
            '<label class="field"><span class="field__label">ученик</span><select class="input" id="payStudent">' +
              students.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select></label>' +
            '<label class="field"><span class="field__label">месяц</span><input class="input" id="payMonth" type="month" value="' + esc(month) + '"></label>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 100px 1fr 1fr;gap:10px">' +
            '<label class="field"><span class="field__label">сумма</span><input class="input" id="payAmount" type="number" min="0" placeholder="500000"></label>' +
            '<label class="field"><span class="field__label">валюта</span><select class="input" id="payCurrency"><option>UZS</option><option>USD</option></select></label>' +
            '<label class="field"><span class="field__label">способ</span><select class="input" id="payMethod"><option value="cash">нал</option><option value="click">Click</option><option value="payme">Payme</option><option value="transfer">перевод</option></select></label>' +
            '<label class="field"><span class="field__label">статус</span><select class="input" id="payStatus"><option value="paid">оплачено</option><option value="awaiting">ожидается</option></select></label>' +
          '</div>' +
          '<button class="btn btn--gold btn--full" id="payAdd">' + ic('plus') + ' Добавить запись</button>' +
        '</div>' +
        (rows || emptyBox('clipboard', 'Записей пока нет', 'Добавь первую оплату формой выше')));

      document.getElementById('payAdd').addEventListener('click', function () {
        var amount = document.getElementById('payAmount').value;
        if (!amount) { toast('Укажи сумму', 'warn'); return; }
        DB.savePayment({
          id: DB.newId('p'), studentId: document.getElementById('payStudent').value,
          month: document.getElementById('payMonth').value || month,
          amount: Number(amount), currency: document.getElementById('payCurrency').value,
          method: document.getElementById('payMethod').value, status: document.getElementById('payStatus').value,
          note: '', createdAt: new Date().toISOString(),
        }).then(function () { toast('Запись добавлена ✦'); draw(); });
      });
      app.querySelectorAll('[data-delpay]').forEach(function (b) {
        b.addEventListener('click', function () {
          DB.removePayment(b.dataset.delpay).then(function () { toast('Запись удалена', 'warn'); draw(); });
        });
      });
    }
    draw();
  }

  /* ═══════════ ЗАЯВКИ (админ) ═══════════ */

  function renderAdminLeads(user) {
    function draw() {
      var leads = DB.allLeads();
      var newCount = DB.newLeadsCount();
      var rows = leads.map(function (l) {
        return '<div class="attempt glass">' +
          '<span class="attempt__score ' + (l.status === 'new' ? 'attempt__score--bad' : 'attempt__score--good') + '">' +
          (l.status === 'new' ? 'новая' : 'обработана') + '</span>' +
          '<div class="attempt__main"><b>' + esc(l.name) + ' · ' + esc(l.contact) + '</b>' +
          '<span>' + esc(l.program || '—') + ' · ' + UI.dayLabel((l.createdAt || '').slice(0, 10) || DB.todayIso()) + '</span></div>' +
          '<div style="display:flex;gap:8px">' +
          '<button class="btn btn--ghost btn--sm" data-toggle="' + l.id + '">' + (l.status === 'new' ? '✓ Обработана' : '↺ Вернуть') + '</button>' +
          '<button class="icon-btn icon-btn--danger" data-dellead="' + l.id + '" aria-label="Удалить">' + ic('trash') + '</button>' +
          '</div></div>';
      }).join('');

      shell(user, 'admin-leads',
        '<div class="page-head"><p class="eyebrow">[ заявки · с лендинга ]</p><h1>Заявки</h1>' +
        '<p>Всего: ' + leads.length + ' · новых: <b style="color:var(--solar)">' + newCount + '</b></p></div>' +
        (rows || emptyBox('link', 'Заявок пока нет', 'Форма на лендинге складывает их прямо сюда')));

      app.querySelectorAll('[data-toggle]').forEach(function (b) {
        b.addEventListener('click', function () {
          var lead = DB.allLeads().find(function (x) { return x.id === b.dataset.toggle; });
          DB.setLeadStatus(b.dataset.toggle, lead && lead.status === 'new' ? 'done' : 'new').then(draw);
        });
      });
      app.querySelectorAll('[data-dellead]').forEach(function (b) {
        b.addEventListener('click', function () {
          DB.deleteLead(b.dataset.dellead).then(function () { toast('Заявка удалена', 'warn'); draw(); });
        });
      });
    }
    draw();
  }

  /* ═══════════ РЕЙТИНГ ГРУПП ═══════════ */

  function renderLeaderboard(user, scope) {
    var allStudents = DB.allUsers().filter(function (u) { return u.role === 'student'; });
    function groupNameOf(studentId) {
      var s = DB.user(studentId);
      return s && s.teacherId ? (DB.user(s.teacherId) || {}).name || '—' : '—';
    }

    var groupStudents = DB.myStudents(user);

    /* у ученика без группы дефолт — вся школа */
    if (!scope) scope = (user.role === 'student' && groupStudents.length) ? 'group' : 'school';

    function drawRows(students) {
      var sorted = students.slice().sort(function (a, b) { return (b.xp || 0) - (a.xp || 0); });
      var medals = ['🥇', '🥈', '🥉'];
      if (!sorted.length) return emptyBox('users', 'Пока пусто', 'Как только появятся ученики с XP, здесь будет рейтинг');
      return sorted.map(function (s, i) {
        var lvl = DB.levelOf(s.xp || 0);
        return '<div class="student-row glass' + (s.id === user.id ? ' side__item--on' : '') + '" style="margin-bottom:8px;padding:13px 16px">' +
          '<b class="mono" style="width:34px;text-align:center;font-size:15px;color:' + (i < 3 ? 'var(--solar)' : 'var(--dust-2)') + '">' + (medals[i] || (i + 1)) + '</b>' +
          UI.avatar(s, 'md') +
          '<div class="student-row__main"><b>' + esc(s.name) + '</b><span>' + esc(lvl.level.name) + ' · ' + groupNameOf(s.id) + '</span></div>' +
          '<div class="student-row__stats"><b>' + (s.xp || 0) + ' XP</b><span>серия ' + (s.streak || 0) + '</span></div>' +
          '</div>';
      }).join('');
    }

    var groupStudents = DB.myStudents(user);


    var tabs = '';
    if (user.role === 'student' && groupStudents.length) {
      tabs = '<div style="display:flex;gap:8px;margin-bottom:16px">' +
        '<button class="chip' + (scope === 'group' ? ' chip--ion' : '') + '" data-scope="group" style="cursor:pointer">Моя группа</button>' +
        '<button class="chip' + (scope === 'school' ? ' chip--ion' : '') + '" data-scope="school" style="cursor:pointer">Вся школа</button></div>';
    } else if (user.role === 'student') {
      tabs = '<div style="display:flex;gap:8px;margin-bottom:16px">' +
        '<button class="chip chip--ion" data-scope="school" style="cursor:pointer">Вся школа</button></div>';
    } else {
      tabs = '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">' +
        '<button class="chip' + (scope === 'school' ? ' chip--ion' : '') + '" data-scope="school" style="cursor:pointer">Вся школа</button>' +
        myGroups.map(function (g) {
          return '<button class="chip' + (scope === 'g:' + g.id ? ' chip--ion' : '') + '" data-scope="g:' + g.id + '" style="cursor:pointer">' + esc(g.name) + '</button>';
        }).join('') + '</div>';
    }

    var rows;
    if (scope === 'school') rows = drawRows(allStudents);
    else if (scope === 'group') rows = drawRows(groupStudents);
    else {
      var gid = scope.slice(2);
      var g = DB.group(gid);
      rows = drawRows(g ? g.studentIds.map(function (sid) { return DB.user(sid); }).filter(Boolean) : []);
    }

    shell(user, 'leaderboard',
      '<div class="page-head"><p class="eyebrow">[ рейтинг · XP ]</p><h1>Рейтинг</h1>' +
      '<p>Кто больше всех летает: XP за тесты, домашку и пробники</p></div>' + tabs +
      '<div>' + rows + '</div>');

    app.querySelectorAll('[data-scope]').forEach(function (b) {
      b.addEventListener('click', function () { renderLeaderboard(user, b.dataset.scope); });
    });
  }

  /* ═══════════ МАРШРУТ ОБУЧЕНИЯ (учитель/админ) ═══════════ */

  function renderRoutePlanner(user, studentId) {
    var s = DB.user(studentId);
    if (!s || s.role !== 'student') { location.hash = '#/students'; return; }
    var rec = MASTERY.recommend(studentId);
    var plan = DB.planStudyOf(studentId);
    var tName = function (id) { var t = MASTERY.topicById(id); return t ? t.title : id; };

    var blocksHtml = window.CURRICULUM.blocks.map(function (b) {
      var level = MASTERY.blockLevel(studentId, b.id);
      var score = MASTERY.blockScore(studentId, b.id);
      var rows = b.topics.map(function (t) {
        var row = DB.masteryOf(studentId, t.id);
        var scoreV = row ? row.score || 0 : 0;
        var hue = scoreV >= 70 ? 'rgba(124,232,181,' : scoreV >= 40 ? 'rgba(245,194,75,' : 'rgba(245,140,140,';
        return '<div class="hm-cell" style="background:' + hue + (0.12 + scoreV / 300) + ')' + '">' +
          '<b>' + scoreV + '</b><span>' + esc(t.title) + '</span>' +
          (row && row.gatePassed ? '<i>зачёт ✓</i>' : '<i>без зачёта</i>') +
          '</div>';
      }).join('');
      return '<div class="glass card" style="margin-bottom:12px">' +
        '<div class="tr-block__head">' +
          '<span class="card__icon">' + (b.icon || '∑') + '</span>' +
          '<div style="flex:1"><b>' + esc(b.title) + '</b>' +
          '<span style="display:block;font-size:12px;color:var(--dust)">балл блока: <b style="color:var(--ion)">' + score + '</b>/100</span></div>' +
          '<span class="chip chip--gold">' + MASTERY.LEVEL_ICON[level] + ' ' + MASTERY.LEVEL_RU[level] + '</span>' +
        '</div>' +
        '<div class="hm-grid">' + rows + '</div>' +
        '</div>';
    }).join('');

    var recHtml = [];
    if (rec.examReady) recHtml.push('Экзамен готов: блок ' + rec.examReady + ' — все темы зачтены');
    if (rec.weakest) recHtml.push('Слабое звено: ' + tName(rec.weakest) + ' — стоит повторить');
    if (rec.nextByRoute) recHtml.push('Следующая по маршруту: ' + tName(rec.nextByRoute));

    var planApproved = plan && plan.status === 'approved';

    shell(user, 'students',
      '<div class="page-head"><p class="eyebrow">[ маршрут обучения · ' + esc(s.name) + ' ]</p>' +
      '<div class="page-head__row"><h1>Маршрут</h1>' +
      '<a class="icon-btn" href="#/students" aria-label="Назад">' + ic('back') + '</a></div>' +
      '<p>Тепловая карта мастерства (1–100, скрыто от ученика) и рекомендации системы</p></div>' +

      '<div class="glass card" style="margin-bottom:14px">' +
        '<b style="font-family:var(--font-display);font-size:14.5px">Рекомендации системы</b>' +
        '<div class="stack" style="margin-top:10px">' +
        recHtml.map(function (r) {
          return '<div class="hw" style="padding:10px 12px"><span class="dot dot--gold"></span><span style="font-size:14px">' + esc(r) + '</span></div>';
        }).join('') + '</div>' +
        (planApproved
          ? '<div class="th-tip" style="margin-top:12px">Маршрут утверждён: ' + plan.topics.slice(0, 5).map(function (id) { return esc(tName(id)); }).join(' → ') + (plan.topics.length > 5 ? ' → …' : '') + '</div>'
          : '<button class="btn btn--gold btn--full" id="approvePlan" style="margin-top:12px">' + ic('check') + ' Утвердить маршрут системы</button>') +
      '</div>' +

      '<p class="section-label"><span>тариф ученика</span></p>' +
      '<div class="glass card stack" id="planBlock"></div>' +

      '<p class="section-label"><span>мастерство по темам</span></p>' + blocksHtml);

    var approveBtn = document.getElementById('approvePlan');
    if (approveBtn) approveBtn.addEventListener('click', function () {
      var topics = MASTERY.allTopics().map(function (p) { return p.topic.id; });
      DB.savePlanStudy({
        id: DB.newId('rt'), studentId: studentId, teacherId: user.id,
        topics: topics, status: 'approved', createdAt: new Date().toISOString(),
      }).then(function () { toast('Маршрут утверждён — ученик увидит его в тренажёре ✦'); rerender(); });
    });

    renderPlanEditor(user, s, document.getElementById('planBlock'));
  }

  function renderPlanEditor(user, s, block) {
    var teachers = DB.allUsers().filter(function (u) { return u.role === 'teacher'; });
    var plan = DB.studentPlanOf(s.id);
    var p = plan || { perWeek: 2, durationMin: 60, teacherId: '', status: 'active' };
    var teacherRate = null;
    if (p.teacherId) { var t = DB.user(p.teacherId); teacherRate = t ? t.rate || 0 : null; }

    function monthly() {
      var t = DB.user(document.getElementById('plTeacher').value);
      var rate = t ? t.rate || 0 : 0;
      var hours = (+document.getElementById('plDur').value) / 60;
      return Math.round(rate * hours * (+document.getElementById('plWeek').value) * 4.33);
    }

    block.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' +
        '<label class="field"><span class="field__label">уроков в неделю</span><select class="input" id="plWeek">' +
          [1, 2, 3, 4, 5].map(function (n) { return '<option ' + (p.perWeek === n ? 'selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span class="field__label">длительность, мин</span><select class="input" id="plDur">' +
          [45, 60, 90].map(function (n) { return '<option ' + (p.durationMin === n ? 'selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span class="field__label">преподаватель</span><select class="input" id="plTeacher">' +
          teachers.map(function (t) { return '<option value="' + t.id + '" ' + (p.teacherId === t.id ? 'selected' : '') + '>' + esc(t.name) + ' · $' + (t.rate || 0) + '/ч</option>'; }).join('') + '</select></label>' +
      '</div>' +
      '<p id="plPrice" class="mono" style="font-size:14px;color:var(--solar)">$' + (plan ? plan.monthly : 0) + ' / месяц</p>' +
      '<button class="btn btn--gold btn--full" id="plSave">Сохранить план</button>' +
      (plan ? '<p class="mono" style="font-size:11px;color:var(--dust-2);text-align:center">план активен · ученик видит цену в профиле</p>' : '');

    function upd() { document.getElementById('plPrice').textContent = '$' + monthly().toLocaleString('ru-RU') + ' / месяц'; }
    ['plWeek', 'plDur', 'plTeacher'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', upd);
    });
    document.getElementById('plSave').addEventListener('click', function () {
      var m = monthly();
      DB.saveStudentPlan({
        id: plan ? plan.id : DB.newId('sp'),
        studentId: s.id, teacherId: document.getElementById('plTeacher').value,
        perWeek: +document.getElementById('plWeek').value,
        durationMin: +document.getElementById('plDur').value,
        monthly: m, currency: 'USD', status: 'active',
        createdAt: plan ? plan.createdAt : new Date().toISOString(),
      }).then(function () { toast('Тариф сохранён: $' + m.toLocaleString('ru-RU') + '/мес ✦'); rerender(); });
    });
  }

  /* ═══════════ ЕЩЁ / НАСТРОЙКИ ═══════════ */

  function moreItems(user) {
    var items = [];
    if (user.role === 'student') {
      items.push({ href: '#/tests', icon: 'clipboard', label: 'Тренировочные тесты', sub: 'полные варианты и тесты' });
      items.push({ href: '#/homework', icon: 'clipboard', label: 'Домашние задания', sub: 'сдать и просмотреть' });
      items.push({ href: '#/progress', icon: 'chart', label: 'Прогресс', sub: 'XP, уровни, значки' });
      items.push({ href: '#/leaderboard', icon: 'users', label: 'Рейтинг', sub: 'кто выше в группе' });
      items.push({ href: '#/theory', icon: 'book', label: 'Теория', sub: 'библиотека тем' });
      items.push({ href: '#/payments', icon: 'star', label: 'Мои оплаты', sub: 'история платежей' });
    }
    if (user.role === 'teacher') {
      items.push({ href: '#/leaderboard', icon: 'users', label: 'Рейтинг', sub: 'XP по группам и школе' });
      items.push({ href: '#/builder', icon: 'edit', label: 'Конструктор тестов', sub: 'создать тренировку' });
      items.push({ href: '#/theory', icon: 'book', label: 'Теория', sub: 'библиотека тем' });
    }
    if (user.role === 'admin') {
      items.push({ href: '#/admin-leads', icon: 'link', label: 'Заявки', sub: DB.newLeadsCount() ? DB.newLeadsCount() + ' новых' : 'с лендинга' });
      items.push({ href: '#/leaderboard', icon: 'users', label: 'Рейтинг', sub: 'XP по группам и школе' });
      items.push({ href: '#/tests', icon: 'clipboard', label: 'Тесты', sub: 'банк и конструктор' });
      items.push({ href: '#/theory', icon: 'book', label: 'Теория', sub: 'библиотека тем' });
    }
    items.push({ href: '#/settings', icon: 'grid', label: 'Профиль и настройки', sub: 'пароль, приложение' });
    return items;
  }

  function installCard() {
    if (isStandalone()) {
      return '<div class="glass card" style="display:flex;gap:12px;align-items:center">' + ic('check') +
        '<span style="font-size:13.5px;color:var(--dust)">Приложение установлено — ты в автономном режиме ✦</span></div>';
    }
    var btn = deferredInstall
      ? '<button class="btn btn--gold btn--sm" id="installBtn">' + ic('install') + ' Установить</button>'
      : '<a class="btn btn--ghost btn--sm" href="' + esc(CONFIG.APK_URL) + '" target="_blank" rel="noopener">' + ic('install') + ' Скачать APK</a>';
    return '<div class="glass card" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">' + ic('phone') +
      '<span style="flex:1;min-width:180px"><b style="font-size:14.5px">На весь экран, как приложение</b>' +
      '<span style="display:block;font-size:12.5px;color:var(--dust)">Android: установи через Chrome или скачай APK</span></span>' + btn + '</div>';
  }

  function bindInstall() {
    var b = document.getElementById('installBtn');
    if (b && deferredInstall) {
      b.addEventListener('click', function () {
        deferredInstall.prompt();
        deferredInstall.userChoice.then(function (choice) {
          if (choice && choice.outcome === 'accepted') toast('VOSKHOD Orbit установлен ✦');
          deferredInstall = null;
          rerender();
        });
      });
    }
  }

  function renderMore(user) {
    shell(user, 'more',
      '<div class="page-head"><p class="eyebrow">[ ещё · бортовые системы ]</p><h1>Ещё</h1></div>' +
      '<div class="stack">' + moreItems(user).map(function (i) {
        return '<a class="login__card glass" href="' + i.href + '">' + ic(i.icon) +
          '<span><b>' + esc(i.label) + '</b><i>' + esc(i.sub) + '</i></span>' +
          '<span class="login__go">' + ic('back') + '</span></a>';
      }).join('') + '</div>' +
      '<p class="section-label"><span>приложение</span></p>' + installCard() +
      '<p class="section-label"><span>ссылки</span></p>' +
      '<div class="stack">' +
        '<a class="login__card glass" href="https://tankecu.github.io/voskhod-school/" target="_blank" rel="noopener">' + ic('link') +
          '<span><b>Сайт школы</b><i>программы, отзывы, заявка</i></span><span class="login__go">' + ic('back') + '</span></a>' +
        '<button class="login__card glass" id="logoutBtn" style="text-align:left">' + ic('logout') +
          '<span><b>Выйти</b><i>завершить сеанс</i></span></button>' +
      '</div>');
    bindLogout();
    bindInstall();
  }

  function bindLogout() {
    var b = document.getElementById('logoutBtn');
    if (b) b.addEventListener('click', function () {
      DB.logout();
      location.hash = '#/login';
      route();
    });
  }

  function renderSettings(user) {
    var lvl = DB.levelOf(user.xp || 0);
    shell(user, 'more',
      '<div class="page-head"><p class="eyebrow">[ профиль ]</p><h1>Профиль</h1></div>' +
      '<div class="glass card" style="display:flex;gap:16px;align-items:center;margin-bottom:14px">' +
        UI.avatar(user, 'lg') +
        '<div style="flex:1;min-width:0"><b style="font-family:var(--font-display);font-size:16px">' + esc(user.name) + '</b>' +
        '<span style="display:block;color:var(--dust);font-size:13px">' + esc(user.login) + ' · ' +
        (user.role === 'teacher' ? esc(user.subject || 'Преподаватель') : user.role === 'admin' ? 'администратор' : esc(lvl.level.name) + ' · ' + (user.xp || 0) + ' XP') + '</span></div>' +
        roleChip(user.role) + '</div>' +

      '<p class="section-label"><span>смена пароля</span></p>' +
      '<div class="glass card stack">' +
        '<label class="field"><span class="field__label">текущий пароль</span><input class="input" id="cpOld" type="password" autocomplete="current-password"></label>' +
        '<label class="field"><span class="field__label">новый пароль (мин. 6)</span><input class="input" id="cpNew" type="password" autocomplete="new-password"></label>' +
        '<button class="btn btn--gold btn--full" id="cpBtn">Сменить пароль</button>' +
      '</div>' +

      '<p class="section-label"><span>приложение</span></p>' + installCard() +
      '<p class="section-label"><span>выход</span></p>' +
      '<div class="stack"><button class="login__card glass" id="logoutBtn2" style="text-align:left">' + ic('logout') +
        '<span><b>Выйти из аккаунта</b><i>вернуться на экран входа</i></span></button></div>' +
      '<p class="mono" style="text-align:center;font-size:11px;color:var(--dust-2);margin-top:22px">VOSKHOD Orbit v' + esc(CONFIG.APP_VERSION) + ' · база: ' +
      (DB.adapterName() === 'supabase' ? 'supabase (общая)' : 'это устройство · supabase не подключён') + '</p>');

    bindInstall();
    document.getElementById('logoutBtn2').addEventListener('click', function () {
      DB.logout(); location.hash = '#/login'; route();
    });
    document.getElementById('cpBtn').addEventListener('click', function () {
      var oldP = document.getElementById('cpOld').value, newP = document.getElementById('cpNew').value;
      if (newP.length < 6) { toast('Новый пароль: минимум 6 символов', 'warn'); return; }
      DB.authChangePassword(user.id, oldP, newP).then(function (r) {
        if (r.error) { toast(r.error, 'warn'); return; }
        toast('Пароль изменён ✦');
        document.getElementById('cpOld').value = ''; document.getElementById('cpNew').value = '';
      });
    });
  }

  /* ═══════════ РОУТЕР ═══════════ */

  function rerender() { route(true); }

  function route(keepScroll) {
    Tests.cleanup();
    Mock.cleanup();
    if (window.Room) Room.cleanup();
    var hash = location.hash.replace(/^#\/?/, '') || '';
    var parts = hash.split('/');
    var name = parts[0] || '';

    if (name !== 'login' && !DB.session()) { location.hash = '#/login'; return; }
    var user = DB.currentUser();

    if (name === 'login' || name === '' || name === 'today' && !user) {
      renderLogin();
      return;
    }
    if (!user) { location.hash = '#/login'; return; }

    switch (name) {
      case 'today':
        /* дашборд всегда показывает свежие данные (в т.ч. от других устройств) */
        DB.refresh().then(function () {
          var fresh = DB.currentUser();
          if (!fresh) { location.hash = '#/login'; return; }
          renderToday(fresh);
        });
        break;
      case 'schedule': renderSchedule(user); break;
      case 'homework':
        if (user.role === 'student') renderHomework(user);
        else if (user.role === 'teacher') renderStudents(user);
        else renderAdminUsers(user);
        break;
      case 'tests': renderTests(user); break;
      case 'test': Tests.renderRunner(document.getElementById('page'), parts[1]); break;
      case 'builder':
        if (user.role === 'admin') { toast('Тесты создают преподаватели — админ видит всё в разделе «Тесты»', 'warn'); location.hash = '#/tests'; break; }
        Tests.renderBuilder(document.getElementById('page'), parts[1] || null);
        break;
      case 'review':
        var a = DB.attempt(parts[1]);
        var t = a && DB.test(a.testId);
        if (t) Tests.renderReview(document.getElementById('page'), t, a.answers);
        else location.hash = user.role === 'student' ? '#/progress' : '#/tests';
        break;
      case 'theory':
        if (parts[2]) renderTheoryTopic(user, parts[1], parts[2]);
        else if (parts[1]) renderTheoryCourse(user, parts[1]);
        else renderTheory(user);
        break;
      case 'mock':
        if (user.role !== 'student') { location.hash = '#/today'; break; }
        if (parts[1] === 'results') Mock.renderResultById(document.getElementById('page'), parts[2]);
        else if (parts[1] === 'review') Mock.renderReview(document.getElementById('page'), parts[2]);
        else Mock.renderIntro(document.getElementById('page'), user);
        break;
      case 'trainer':
        if (user.role !== 'student') { location.hash = '#/today'; break; }
        if (parts[1] === 'placement' && parts[2] === 'run') Trainer.runPlacement(document.getElementById('page'), user);
        else if (parts[1] === 'placement') Trainer.renderPlacementIntro(document.getElementById('page'), user);
        else if (parts[1] === 'stardust') Trainer.renderStardust(document.getElementById('page'), user);
        else if (parts[1] === 'topic') Trainer.renderTopicSession(document.getElementById('page'), user, parts[2], parts[3] || 'practice');
        else Trainer.renderTrainer(document.getElementById('page'), user);
        break;
      case 'trainer-exam': Trainer.renderLevelExam(document.getElementById('page'), user, parts[1]); break;
      case 'room':
        if (!window.Room) { location.hash = '#/schedule'; break; }
        if (parts[1]) Room.renderRoom(document.getElementById('page'), user, parts[1]);
        else location.hash = '#/schedule';
        break;
      case 'apply-consult':
        shell(user, 'trainer',
          '<div class="page-head"><p class="eyebrow">[ консультация ]</p><h1>Консультация с преподавателем</h1></div>' +
          '<div class="glass card" style="max-width:640px">' +
          '<p style="margin-bottom:12px">Твоя карта знаний готова и уже у преподавателя. На консультации вместе выберете частоту занятий, длительность и маршрут — от этого зависит стоимость.</p>' +
          '<ol class="apply__steps" style="margin-top:8px">' +
          '<li><b>Напиши преподавателю</b><span>в Telegram — отвечаем в течение дня</span></li>' +
          '<li><b>Консультация 40 минут</b><span>обсудите цели, расписание и план</span></li>' +
          '<li><b>Старт тренировок</b><span>маршрут появится в твоём тренажёре</span></li></ol>' +
          '<a class="btn btn--gold btn--full" href="https://t.me/Tankecu" target="_blank" rel="noopener" style="margin-top:16px">Записаться на консультацию ✈</a>' +
          '</div>');
        break;
      case 'progress':
        if (user.role === 'student') renderProgress(user);
        else renderStudents(user);
        break;
      case 'students': renderStudents(user); break;
      case 'student': renderStudentCard(user, parts[1]); break;
      case 'payments':
        if (user.role === 'student') renderPaymentsStudent(user);
        else renderAdminPayments(user);
        break;
      case 'admin-users': renderAdminUsers(user); break;
      case 'admin-payments': renderAdminPayments(user); break;
      case 'admin-leads':
        if (user.role !== 'admin') { location.hash = '#/today'; break; }
        renderAdminLeads(user);
        break;
      case 'leaderboard': renderLeaderboard(user); break;
      case 'route': renderRoutePlanner(user, parts[1]); break;
      case 'more': renderMore(user); break;
      case 'settings': renderSettings(user); break;
      default: renderToday(user);
    }
    if (!keepScroll) window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', function () { route(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('sw:', e); });
  }

  DB.init().then(function () { route(); });
})();
