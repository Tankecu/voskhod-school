/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit — роутер и экраны приложения
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

  /* ── логотип ── */
  var LOGO = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
    '<circle cx="16" cy="16" r="13" stroke="url(#lgo)" stroke-width="1.5" stroke-dasharray="3 5"/>' +
    '<path d="M16 7 L18.2 13.8 L25 16 L18.2 18.2 L16 25 L13.8 18.2 L7 16 L13.8 13.8 Z" fill="#F5C24B"/>' +
    '<defs><linearGradient id="lgo" x1="0" y1="0" x2="32" y2="32">' +
    '<stop stop-color="#67E8F9"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs></svg>';

  /* ═══════════ ВСПОМОГАТЕЛЬНОЕ ═══════════ */

  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  function lessonStart(l) {
    var d = parseIso(l.date), p = l.start.split(':');
    d.setHours(+p[0], +p[1], 0, 0);
    return d;
  }

  function untilLabel(l) {
    var st = DB.lessonStatus(l);
    if (st === 'live') return { chip: 'live', text: 'идёт прямо сейчас' };
    var diffMin = Math.round((lessonStart(l) - Date.now()) / 60000);
    var sameDay = l.date === new Date().toISOString().slice(0, 10);
    var when;
    if (sameDay && diffMin < 90) when = 'через ' + Math.max(1, diffMin) + ' ' + UI.plural(diffMin, 'минуту', 'минуты', 'минут');
    else if (diffMin < 60 * 26) when = 'завтра в ' + l.start;
    else when = UI.fmtDate(l.date) + ' в ' + l.start;
    return { chip: st === 'today' ? 'today' : 'upcoming', text: when };
  }

  function subjectTag(subject) {
    var s = subject || '';
    var cls = 'subject-tag';
    if (/Math|матем|Milliy/i.test(s)) cls += ' subject-tag--math';
    else if (/English|Reading|TOEFL|Writing|Grammar/i.test(s)) cls += ' subject-tag--eng';
    if (/пробник|mock/i.test(s)) cls += ' subject-tag--mock';
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }

  function statusChip(l) {
    var st = DB.lessonStatus(l);
    if (st === 'live') return '<span class="chip chip--live">в эфире</span>';
    if (st === 'today') return '<span class="chip chip--today">сегодня</span>';
    if (st === 'upcoming') return '<span class="chip chip--upcoming">впереди</span>';
    return '<span class="chip chip--past">прошёл</span>';
  }

  function teacherOf(lesson) { return DB.user(lesson.teacherId); }
  function groupOf(lesson) { return DB.group(lesson.groupId); }

  function emptyBox(icon, title, text) {
    return '<div class="empty">' + ic(icon) + '<b>' + esc(title) + '</b><p>' + esc(text) + '</p></div>';
  }

  /* ═══════════ ОБОЛОЧКА ═══════════ */

  function navItemsFor(user) {
    if (user.role === 'teacher') {
      return [
        { id: 'today', label: 'Сегодня', icon: 'home' },
        { id: 'schedule', label: 'Расписание', icon: 'calendar' },
        { id: 'tests', label: 'Тесты', icon: 'clipboard' },
        { id: 'students', label: 'Ученики', icon: 'users' },
        { id: 'more', label: 'Ещё', icon: 'dots' },
      ];
    }
    return [
      { id: 'today', label: 'Сегодня', icon: 'home' },
      { id: 'schedule', label: 'Расписание', icon: 'calendar' },
      { id: 'tests', label: 'Тесты', icon: 'clipboard' },
      { id: 'progress', label: 'Прогресс', icon: 'chart' },
      { id: 'more', label: 'Ещё', icon: 'dots' },
    ];
  }

  function sideNav(user, route) {
    return '<aside class="side">' +
      '<a class="side__logo" href="#/today">' + LOGO + '<div><b>VOSKHOD</b><i>ORBIT · ' + (user.role === 'teacher' ? 'teacher' : 'student') + '</i></div></a>' +
      '<nav class="side__nav">' +
      navItemsFor(user).map(function (n) {
        return '<a class="side__item' + (route === n.id ? ' side__item--on' : '') + '" href="#/' + n.id + '">' + ic(n.icon) + n.label + '</a>';
      }).join('') +
      (user.role === 'teacher'
        ? '<a class="side__item' + (route === 'builder' ? ' side__item--on' : '') + '" href="#/builder">' + ic('edit') + 'Конструктор</a>'
        : '') +
      '</nav>' +
      '<div class="side__foot"><a class="side__item" href="#/settings">' + UI.avatar(user, 'sm') + '<span>' + esc(user.name.split(' ')[0]) + '</span></a></div>' +
      '</aside>';
  }

  function tabbar(user, route) {
    return '<nav class="tabbar">' +
      navItemsFor(user).map(function (n) {
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
            '<i>' + (user.role === 'teacher' ? 'TEACHER' : 'STUDENT') + '</i></a>' +
          '<a class="topbar__ava" href="#/settings">' +
            '<span class="topbar__name">' + esc(user.name.split(' ')[0]) +
            '<i>' + esc(user.role === 'teacher' ? (user.subject || 'Преподаватель') : 'ученик') + '</i></span>' +
            UI.avatar(user) + '</a>' +
        '</header>' +
        '<main class="page' + (opts.wide ? ' page--wide' : '') + '" id="page">' + contentHtml + '</main>' +
      '</div>' +
      tabbar(user, route);
  }

  /* ═══════════ ВХОД ═══════════ */

  function renderLogin() {
    DB.logout();
    var teachers = DB.ready().users.filter(function (u) { return u.role === 'teacher'; });
    var students = DB.ready().users.filter(function (u) { return u.role === 'student' && u.id === 's1'; });

    app.innerHTML =
      '<div class="login"><div class="login__box">' +
        '<div class="login__mark">' + LOGO + '</div>' +
        '<p class="login__eyebrow">[ orbit · платформа ]</p>' +
        '<h1 class="login__title">VOSKHOD <span>Orbit</span></h1>' +
        '<p class="login__sub">Расписание, тесты и прогресс —<br>всё на борту. Выбери, кто ты.</p>' +
        '<div class="login__cards">' +
          students.map(function (u) {
            return '<button class="login__card" data-login="' + u.id + '">' + UI.avatar(u) +
              '<span><b>' + esc(u.name) + '</b><i>ученик · SAT 2026 · ' + (u.xp || 0) + ' XP</i></span>' +
              '<span class="login__go">' + ic('back') + '</span></button>';
          }).join('') +
          teachers.slice(0, 1).map(function (u) {
            return '<button class="login__card" data-login="' + u.id + '">' + UI.avatar(u, 'md').replace('ava ', 'ava ava--gold ') +
              '<span><b>' + esc(u.name) + '</b><i>преподаватель · ' + esc(u.subject || '') + '</i></span>' +
              '<span class="login__go">' + ic('back') + '</span></button>';
          }).join('') +
        '</div>' +
        '<div class="login__or">или свой аккаунт</div>' +
        '<form id="loginForm" style="display:grid;gap:12px">' +
          '<input class="input" id="loginName" placeholder="Твоё имя" maxlength="40" required>' +
          '<button class="btn btn--gold btn--full" type="submit">Создать аккаунт ученика</button>' +
        '</form>' +
        '<p class="login__foot">Демо-режим: данные хранятся на устройстве. <a href="https://tankecu.github.io/voskhod-school/" target="_blank" rel="noopener">О школе ↗</a></p>' +
      '</div></div>';

    app.querySelectorAll('[data-login]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        DB.login(btn.dataset.login);
        toast('С возвращением на борт ✦');
        location.hash = '#/today';
      });
    });
    app.querySelector('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = app.querySelector('#loginName').value.trim();
      if (!name) return;
      var u = DB.createStudent(name);
      DB.login(u.id);
      toast('Добро пожаловать, ' + name.split(' ')[0] + ' ✦');
      location.hash = '#/today';
    });
  }

  /* ═══════════ СЕГОДНЯ ═══════════ */

  function renderToday(user) {
    var lessons = DB.lessonsFor(user);
    var today = new Date().toISOString().slice(0, 10);
    var todays = lessons.filter(function (l) { return l.date === today; });
    var next = DB.nextLesson(user);
    var weekCount = lessons.filter(function (l) {
      var d = parseIso(l.date), now = new Date();
      var mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
      return d >= mon && d < new Date(mon.getTime() + 7 * 86400000);
    }).length;

    var html = '';

    if (user.role === 'student') {
      var xp = user.xp || 0;
      var lvl = DB.levelOf(xp);
      var pct = lvl.next ? Math.min(100, Math.round((xp - lvl.level.min) / (lvl.next.min - lvl.level.min) * 100)) : 100;

      var hwPending = DB.hwFor(user).filter(function (h) { return h.doneBy.indexOf(user.id) === -1; }).length;

      html +=
        '<div class="page-head"><p class="eyebrow">[ сегодня · ' + esc(UI.fmtDate(today)).toUpperCase() + ' ]</p>' +
          '<h1>Привет, ' + esc(user.name.split(' ')[0]) + ' ✦</h1></div>' +

        '<div class="glass orbit-wrap" style="margin-bottom:12px">' +
          '<div class="orbit" style="--pct:' + pct + '"><b>' + xp + '</b></div>' +
          '<div class="orbit-wrap__info" style="flex:1">' +
            '<b>' + esc(lvl.level.name) + '</b>' +
            '<span>' + (lvl.next ? 'до уровня «' + esc(lvl.next.name) + '» — ' + (lvl.next.min - xp) + ' XP' : 'максимальная орбита достигнута') + '</span>' +
            '<div class="orbit-wrap__bar"><i style="width:' + pct + '%"></i></div>' +
          '</div></div>' +

        '<div class="stat-row" style="margin-bottom:18px">' +
          '<div class="stat-tile glass">' + ic('fire') + '<b>' + (user.streak || 0) + '</b><span>' + UI.plural(user.streak || 0, 'день серии', 'дня серии', 'дней серии') + '</span></div>' +
          '<div class="stat-tile glass">' + ic('calendar') + '<b>' + weekCount + '</b><span>уроков на неделе</span></div>' +
          '<div class="stat-tile glass">' + ic('clipboard') + '<b>' + hwPending + '</b><span>домашки ждёт</span></div>' +
        '</div>';

      /* ближайший урок */
      if (next) {
        var until = untilLabel(next);
        var t = teacherOf(next);
        html +=
          '<p class="section-label"><span>ближайший урок</span></p>' +
          '<div class="hero-lesson glass">' +
            '<div class="hero-lesson__label"><span>' + (DB.lessonStatus(next) === 'live' ? '◉ сейчас идёт' : 'следующий · ' + until.text) + '</span>' + statusChip(next) + '</div>' +
            '<div class="hero-lesson__subject">' + esc(next.subject) + '</div>' +
            '<p class="hero-lesson__topic">' + esc(next.topic || '') + '</p>' +
            '<div class="hero-lesson__meta">' +
              '<span>' + ic('clock') + UI.dayLabel(next.date) + ', ' + esc(next.start) + '</span>' +
              (t ? '<span>' + UI.avatar(t, 'sm') + esc(t.name) + '</span>' : '') +
              '<span>' + ic('users') + esc(groupOf(next) ? groupOf(next).name : '') + '</span>' +
            '</div>' +
            '<div class="hero-lesson__actions">' +
              '<a class="btn btn--gold btn--sm" href="' + esc(next.room || '#') + '" target="_blank" rel="noopener">' + ic('play') + ' Войти в класс</a>' +
              '<button class="btn btn--ghost btn--sm" data-details="' + next.id + '">Подробнее</button>' +
            '</div>' +
          '</div>';
      } else {
        html += '<p class="section-label"><span>ближайший урок</span></p>' +
          emptyBox('calendar', 'Уроков пока нет', 'Когда преподаватель назначит уроки, они появятся здесь');
      }

      /* домашка */
      var hw = DB.hwFor(user);
      var hwOpen = hw.filter(function (h) { return h.doneBy.indexOf(user.id) === -1; }).slice(0, 3);
      html += '<p class="section-label"><span>домашка</span><a href="#/homework">вся →</a></p>';
      html += hwOpen.length
        ? '<div class="stack">' + hwOpen.map(function (h) { return hwItem(h, user); }).join('') + '</div>'
        : emptyBox('check', 'Всё сдано', 'Новых заданий нет — идеальный момент для теста');

      /* тест недели */
      var openTest = DB.testsFor(user)[0];
      if (openTest) {
        var best = bestAttempt(user.id, openTest.id);
        html += '<p class="section-label"><span>тест на разгон</span><a href="#/tests">все →</a></p>' + testCard(openTest, user, best);
      }
    } else {
      /* ── преподаватель ── */
      var myGroups = DB.groupsFor(user);
      var studentCount = myGroups.reduce(function (acc, g) { return acc + g.studentIds.length; }, 0);

      html +=
        '<div class="page-head"><p class="eyebrow">[ сегодня · ' + esc(UI.fmtDate(today)).toUpperCase() + ' ]</p>' +
          '<h1>Здравствуйте, ' + esc(user.name.split(' ')[0]) + '</h1></div>' +

        '<div class="stat-row" style="margin-bottom:18px">' +
          '<div class="stat-tile glass">' + ic('calendar') + '<b>' + todays.length + '</b><span>уроков сегодня</span></div>' +
          '<div class="stat-tile glass">' + ic('users') + '<b>' + myGroups.length + '</b><span>' + UI.plural(myGroups.length, 'группа', 'группы', 'групп') + '</span></div>' +
          '<div class="stat-tile glass">' + ic('home') + '<b>' + studentCount + '</b><span>учеников на борту</span></div>' +
        '</div>';

      html += '<p class="section-label"><span>уроки сегодня</span></p>';
      html += todays.length
        ? '<div class="stack">' + todays.map(function (l) { return lessonRow(l, user); }).join('') + '</div>'
        : emptyBox('calendar', 'Сегодня выходной', 'Уроков на эту дату не запланировано');

      /* свежие результаты */
      var recent = DB.ready().attempts.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 5);
      if (recent.length) {
        html += '<p class="section-label"><span>свежие результаты</span></p><div class="stack">';
        recent.forEach(function (a) {
          var u = DB.user(a.studentId), t = DB.test(a.testId);
          if (!u || !t) return;
          var pct = Math.round(a.score / a.max * 100);
          html += '<div class="attempt glass">' +
            '<span class="attempt__score ' + (pct >= 70 ? 'attempt__score--good' : pct < 50 ? 'attempt__score--bad' : '') + '">' + a.score + '/' + a.max + '</span>' +
            '<div class="attempt__main"><b>' + esc(u.name) + '</b><span>' + esc(t.title) + ' · ' + UI.dayLabel(a.date) + '</span></div></div>';
        });
        html += '</div>';
      }
    }

    shell(user, 'today', html);
    bindLessonDetails(user);
    bindHwChecks(user);
  }

  /* ═══════════ РАСПИСАНИЕ ═══════════ */

  function renderSchedule(user) {
    var lessons = DB.lessonsFor(user);
    var now = new Date();
    var mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
    var week = [];
    for (var i = 0; i < 7; i++) week.push(new Date(mon.getTime() + i * 86400000));

    var todayIso = now.toISOString().slice(0, 10);
    var byDay = {};
    lessons.forEach(function (l) { (byDay[l.date] = byDay[l.date] || []).push(l); });

    var strip = '<div class="week-strip">' + week.map(function (d) {
      var iso = d.toISOString().slice(0, 10);
      var has = (byDay[iso] || []).length > 0;
      return '<button class="week-strip__day' + (iso === todayIso ? ' week-strip__day--today' : '') + (has ? ' week-strip__day--has' : '') +
        '" data-jump="' + iso + '"><i>' + UI.WD_SHORT[(d.getDay() + 6) % 7] + '</i><b>' + d.getDate() + '</b><em></em></button>';
    }).join('') + '</div>';

    var list = '';
    var daysWithLessons = week.filter(function (d) { return (byDay[d.toISOString().slice(0, 10)] || []).length; });
    if (!daysWithLessons.length) {
      list = emptyBox('calendar', 'На этой неделе пусто', 'Уроки появятся, когда преподаватель их назначит');
    } else {
      list = daysWithLessons.map(function (d) {
        var iso = d.toISOString().slice(0, 10);
        var label = UI.dayLabel(iso);
        if (label === UI.fmtDate(iso)) label = UI.WD[(d.getDay() + 6) % 7];
        return '<div class="day-head" id="day-' + iso + '"><b>' + esc(label) + '</b><span>' + UI.fmtDate(iso) + '</span></div>' +
          '<div class="stack">' + byDay[iso].map(function (l) { return lessonRow(l, user); }).join('') + '</div>';
      }).join('');
    }

    var sub = user.role === 'student'
      ? 'Уроки твоих групп: время, тема и преподаватель'
      : 'Твои уроки по всем группам';

    shell(user, 'schedule',
      '<div class="page-head"><p class="eyebrow">[ расписание · неделя ]</p><h1>Расписание</h1><p>' + sub + '</p></div>' + strip + list,
      { wide: true });

    bindLessonDetails(user);
    app.querySelectorAll('[data-jump]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById('day-' + btn.dataset.jump);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function lessonRow(l, user) {
    var t = teacherOf(l);
    var st = DB.lessonStatus(l);
    return '<div class="lesson glass' + (st === 'live' ? ' lesson--live' : '') + '">' +
      '<div class="lesson__time"><b>' + esc(l.start) + '</b><span>' + l.durMin + ' мин</span></div>' +
      '<div class="lesson__main">' +
        '<div class="lesson__subject">' + subjectTag(l.subject) + '<span>' + esc(l.topic || '') + '</span></div>' +
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
        var t = teacherOf(l), g = groupOf(l);
        var hwList = DB.ready().homework.filter(function (h) { return h.lessonId === l.id; });
        var mats = (l.materials || []).map(function (m) {
          return '<a class="btn btn--ghost btn--sm" href="' + esc(m.url) + '" data-demo-link>' + ic('book') + ' ' + esc(m.name) + '</a>';
        }).join('');
        var hwHtml = hwList.map(function (h) {
          var done = user.role === 'student' && h.doneBy.indexOf(user.id) !== -1;
          return '<div class="hw glass hw--' + (done ? 'done' : 'todo') + '" style="padding:12px 14px">' +
            '<div class="hw__main"><div class="hw__title">' + esc(h.title) + '</div>' +
            '<div class="hw__desc">до ' + UI.fmtDate(h.due) + '</div></div>' +
            (done ? '<span class="chip chip--ion">сдано</span>' : '') + '</div>';
        }).join('');

        UI.modal(
          '<div class="modal__head"><h3>' + esc(l.subject) + '</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
          '<div class="modal__body">' +
            '<p style="color:var(--dust)">' + esc(l.topic || '') + '</p>' +
            '<div style="display:flex;flex-wrap:wrap;gap:8px">' + statusChip(l) + '<span class="chip">' + esc(UI.fmtDateFull(l.date)) + ' · ' + esc(l.start) + '</span>' +
            (g ? '<span class="chip">' + esc(g.name) + '</span>' : '') + '</div>' +
            (t ? '<div class="lesson__teacher" style="font-size:14px">' + UI.avatar(t, 'md').replace('ava"', 'ava ava--gold"') + '<span><b style="color:var(--stardust)">' + esc(t.name) + '</b><br><span style="font-size:12px;color:var(--dust)">' + esc(t.subject || '') + '</span></span></div>' : '') +
            '<a class="btn btn--ion btn--full" href="' + esc(l.room || '#') + '" target="_blank" rel="noopener">' + ic('play') + ' Войти в класс</a>' +
            (mats ? '<div><p class="section-label" style="margin:6px 0 8px"><span>материалы</span></p><div style="display:flex;flex-wrap:wrap;gap:8px">' + mats + '</div></div>' : '') +
            (hwHtml ? '<div><p class="section-label" style="margin:6px 0 8px"><span>домашка</span></p><div class="stack">' + hwHtml + '</div></div>' : '') +
          '</div>'
        );

        document.querySelectorAll('[data-demo-link]').forEach(function (a) {
          a.addEventListener('click', function (e) {
            if (a.getAttribute('href') === '#demo') { e.preventDefault(); toast('Демо: здесь будет файл с материалами', 'warn'); }
          });
        });
      });
    });
  }

  /* ═══════════ ДОМАШКА ═══════════ */

  function hwItem(h, user) {
    var done = h.doneBy.indexOf(user.id) !== -1;
    var late = h.due < new Date().toISOString().slice(0, 10) && !done;
    var lesson = DB.lesson(h.lessonId);
    return '<div class="hw glass hw--' + (done ? 'done' : 'todo') + '">' +
      '<button class="hw__check" data-hw="' + h.id + '" aria-label="Отметить выполненным">' + ic('check') + '</button>' +
      '<div class="hw__main"><div class="hw__title">' + esc(h.title) + '</div>' +
        '<div class="hw__desc">' + esc(h.desc || '') + (lesson ? ' · ' + esc(lesson.subject) : '') + '</div></div>' +
      '<div class="hw__due' + (late ? ' hw__due--late' : '') + '"><span>' + (done ? 'сдано' : 'до ' + UI.fmtDate(h.due)) + '</span>' +
        (late ? '<span>просрочено</span>' : '') + '</div>' +
    '</div>';
  }

  function renderHomework(user) {
    if (user.role === 'teacher') { renderStudents(user); return; }
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
        DB.toggleHwDone(hw.id, user.id);
        if (!wasDone) { DB.addXp(user.id, 5); toast('Сдано! +5 XP ✦'); }
        else toast('Возвращено в работу', 'warn');
        rerender();
      });
    });
  }

  /* ═══════════ ТЕСТЫ: СПИСОК ═══════════ */

  function bestAttempt(studentId, testId) {
    var all = DB.attemptsForTest(testId).filter(function (a) { return a.studentId === studentId; });
    if (!all.length) return null;
    return all.reduce(function (best, a) { return (a.score / a.max > best.score / best.max) ? a : best; });
  }

  function testCard(t, user, best) {
    var author = DB.user(t.authorId);
    return '<div class="test-card glass">' +
      '<div class="test-card__top"><h3>' + esc(t.title) + '</h3>' + subjectTag(t.subject) + '</div>' +
      '<div class="test-card__meta">' +
        '<span class="chip">' + ic('clipboard') + ' ' + t.questions.length + ' ' + UI.plural(t.questions.length, 'вопрос', 'вопроса', 'вопросов') + '</span>' +
        '<span class="chip">' + ic('clock') + ' ' + t.timeMin + ' мин</span>' +
        (author ? '<span class="chip">' + esc(author.name) + '</span>' : '') +
      '</div>' +
      '<div class="test-card__foot">' +
        (best
          ? '<span class="test-card__score">лучший: <b>' + best.score + '/' + best.max + '</b></span>' +
            '<a class="btn btn--ghost btn--sm" href="#/test/' + t.id + '">Пройти снова</a>'
          : '<span class="test-card__score mono" style="font-size:11px;color:var(--dust-2)">не пройден</span>' +
            '<a class="btn btn--gold btn--sm" href="#/test/' + t.id + '">' + ic('play') + ' Начать</a>') +
      '</div>' +
    '</div>';
  }

  function renderTests(user) {
    var tests = DB.testsFor(user);
    var body = '';

    if (user.role === 'teacher') {
      var mine = tests.filter(function (t) { return t.authorId === user.id; });
      var seeded = tests.filter(function (t) { return t.authorId !== user.id; });

      body = '<div class="page-head"><p class="eyebrow">[ тесты · конструктор ]</p>' +
        '<div class="page-head__row"><h1>Тесты</h1>' +
        '<a class="btn btn--gold btn--sm" href="#/builder">' + ic('plus') + ' Новый</a></div>' +
        '<p>Свои тесты и база школы. Результаты — по кнопке у каждого теста</p></div>';

      body += mine.length
        ? '<div class="stack">' + mine.map(function (t) {
            var attempts = DB.attemptsForTest(t.id);
            return '<div class="test-card glass">' +
              '<div class="test-card__top"><h3>' + esc(t.title) + '</h3>' + subjectTag(t.subject) + '</div>' +
              '<div class="test-card__meta">' +
                '<span class="chip">' + t.questions.length + ' вопр.</span>' +
                '<span class="chip">' + t.timeMin + ' мин</span>' +
                '<span class="chip chip--ion">' + t.assignedGroups.map(function (g) { var x = DB.group(g); return x ? x.name : g; }).join(', ') + '</span>' +
                '<span class="chip">' + attempts.length + ' ' + UI.plural(attempts.length, 'попытка', 'попытки', 'попыток') + '</span>' +
              '</div>' +
              '<div class="test-card__foot">' +
                '<button class="btn btn--ghost btn--sm" data-results="' + t.id + '">Результаты</button>' +
                '<div style="display:flex;gap:8px">' +
                  '<a class="icon-btn" href="#/builder/' + t.id + '" aria-label="Редактировать">' + ic('edit') + '</a>' +
                  '<button class="icon-btn icon-btn--danger" data-del="' + t.id + '" aria-label="Удалить">' + ic('trash') + '</button>' +
                '</div></div></div>';
          }).join('') + '</div>'
        : emptyBox('clipboard', 'Своих тестов пока нет', 'Создай первый тест — он сразу появится у учеников');

      if (seeded.length) {
        body += '<p class="section-label"><span>база школы</span></p><div class="stack">' + seeded.map(function (t) {
          var attempts = DB.attemptsForTest(t.id);
          return '<div class="test-card glass">' +
            '<div class="test-card__top"><h3>' + esc(t.title) + '</h3>' + subjectTag(t.subject) + '</div>' +
            '<div class="test-card__meta"><span class="chip">' + t.questions.length + ' вопр.</span>' +
            '<span class="chip">' + attempts.length + ' попыток</span></div>' +
            '<div class="test-card__foot"><button class="btn btn--ghost btn--sm" data-results="' + t.id + '">Результаты</button>' +
            '<a class="btn btn--ghost btn--sm" href="#/builder/' + t.id + '">Копировать в конструктор</a></div></div>';
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
            '<p style="color:var(--dust);font-size:14px">Тест исчезнет у учеников вместе с результатами попыток.</p>' +
            '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Отмена</button>' +
            '<button class="btn btn--danger btn--full" id="delYes">Удалить</button></div>');
          m.el.querySelector('#delYes').addEventListener('click', function () {
            DB.removeTest(b.dataset.del);
            m.close();
            toast('Тест удалён', 'warn');
            rerender();
          });
        });
      });
      return;
    }

    /* ученик */
    body = '<div class="page-head"><p class="eyebrow">[ тесты · тренировки ]</p><h1>Тесты</h1>' +
      '<p>Тренировки от преподавателей. За каждый верный ответ — +10 XP</p></div>';
    body += tests.length
      ? '<div class="stack">' + tests.map(function (t) { return testCard(t, user, bestAttempt(user.id, t.id)); }).join('') + '</div>'
      : emptyBox('clipboard', 'Тестов пока нет', 'Преподаватели скоро добавят тренировки');
    shell(user, 'tests', body);
  }

  /* ═══════════ ПРОГРЕСС (ученик) ═══════════ */

  function renderProgress(user) {
    var xp = user.xp || 0;
    var lvl = DB.levelOf(xp);
    var pct = lvl.next ? Math.min(100, Math.round((xp - lvl.level.min) / (lvl.next.min - lvl.level.min) * 100)) : 100;
    var attempts = DB.attemptsBy(user.id);

    var badges = [
      { on: attempts.length >= 1, icon: 'play', label: 'Первый запуск' },
      { on: (user.streak || 0) >= 3, icon: 'fire', label: 'Серия 3+' },
      { on: attempts.some(function (a) { return a.score === a.max; }), icon: 'star', label: '100% сгорание' },
      { on: attempts.length >= 5, icon: 'rocket', label: '5 тренировок' },
      { on: DB.hwFor(user).filter(function (h) { return h.doneBy.indexOf(user.id) !== -1; }).length >= 3, icon: 'check', label: '3 сдано' },
    ];

    var levels = DB.levels.map(function (l, i) {
      var cls = xp >= l.min ? (lvl.level === l ? 'level-row--cur' : 'level-row--done') : '';
      return '<div class="level-row ' + cls + '"><span class="level-row__dot"></span><b>' + esc(l.name) + '</b><span>' + l.min + '+ XP</span></div>';
    }).join('');

    var history = attempts.map(function (a) {
      var t = DB.test(a.testId);
      var p = Math.round(a.score / a.max * 100);
      return '<a class="attempt glass" href="#/review/' + a.id + '">' +
        '<span class="attempt__score ' + (p >= 70 ? 'attempt__score--good' : p < 50 ? 'attempt__score--bad' : '') + '">' + a.score + '/' + a.max + '</span>' +
        '<div class="attempt__main"><b>' + esc(t ? t.title : 'Тест') + '</b><span>' + UI.dayLabel(a.date) + ' · ' + Math.round(a.durSec / 60) + ' мин · тапни для разбора</span></div>' +
        '</a>';
    }).join('');

    shell(user, 'progress',
      '<div class="page-head"><p class="eyebrow">[ прогресс · телеметрия ]</p><h1>Твоя орбита</h1></div>' +

      '<div class="glass orbit-wrap" style="margin-bottom:12px">' +
        '<div class="orbit" style="--pct:' + pct + '"><b>' + xp + '</b></div>' +
        '<div class="orbit-wrap__info" style="flex:1">' +
          '<b>' + esc(lvl.level.name) + '</b><span>' + xp + ' XP всего' +
          (lvl.next ? ' · до «' + esc(lvl.next.name) + '» ' + (lvl.next.min - xp) + ' XP' : '') + '</span>' +
          '<div class="orbit-wrap__bar"><i style="width:' + pct + '%"></i></div>' +
        '</div></div>' +

      '<p class="section-label"><span>значки</span></p>' +
      '<div class="badges">' + badges.map(function (b) {
        return '<span class="badge' + (b.on ? ' badge--on' : '') + '">' + ic(b.icon) + ' ' + esc(b.label) + '</span>';
      }).join('') + '</div>' +

      '<p class="section-label"><span>карта уровней</span></p>' +
      '<div class="glass card"><div class="levels-track" style="position:relative">' + levels + '</div></div>' +

      '<p class="section-label"><span>история попыток</span></p>' +
      (history ? '<div class="stack">' + history + '</div>' : emptyBox('chart', 'Попыток пока нет', 'Пройди первый тест — и здесь появится телеметрия'))
    );
  }

  /* ═══════════ УЧЕНИКИ (преподаватель) ═══════════ */

  function renderStudents(user) {
    var groups = DB.groupsFor(user);
    var body = '<div class="page-head"><p class="eyebrow">[ ученики · экипаж ]</p><h1>Ученики</h1></div>';

    body += groups.map(function (g) {
      var rows = g.studentIds.map(function (sid) {
        var s = DB.user(sid);
        if (!s) return '';
        var lvl = DB.levelOf(s.xp || 0);
        var at = DB.attemptsBy(sid);
        var avg = at.length ? Math.round(at.reduce(function (acc, a) { return acc + a.score / a.max; }, 0) / at.length * 100) : null;
        return '<a class="student-row" href="#/student/' + sid + '">' +
          UI.avatar(s, 'md') +
          '<div class="student-row__main"><b>' + esc(s.name) + '</b><span>' + esc(lvl.level.name) + ' · серия ' + (s.streak || 0) + '</span></div>' +
          '<div class="student-row__stats"><b>' + (avg === null ? '—' : avg + '%') + '</b><span>' + (s.xp || 0) + ' XP</span></div>' +
          '</a>';
      }).join('');
      return '<p class="section-label"><span>' + esc(g.name) + ' · ' + g.studentIds.length + ' чел.</span></p>' +
        '<div class="glass" style="padding:6px 0">' + (rows || emptyBox('users', 'Пусто', 'В группе пока нет учеников')) + '</div>';
    }).join('');

    shell(user, 'students', body, { wide: true });
  }

  function renderStudentCard(user, studentId) {
    var s = DB.user(studentId);
    if (!s || s.role !== 'student') { location.hash = '#/students'; return; }
    var lvl = DB.levelOf(s.xp || 0);
    var attempts = DB.attemptsBy(studentId);
    var hw = DB.hwFor(s);
    var hwDone = hw.filter(function (h) { return h.doneBy.indexOf(studentId) !== -1; }).length;

    var history = attempts.map(function (a) {
      var t = DB.test(a.testId);
      var p = Math.round(a.score / a.max * 100);
      return '<div class="attempt glass">' +
        '<span class="attempt__score ' + (p >= 70 ? 'attempt__score--good' : p < 50 ? 'attempt__score--bad' : '') + '">' + a.score + '/' + a.max + '</span>' +
        '<div class="attempt__main"><b>' + esc(t ? t.title : 'Тест') + '</b><span>' + UI.dayLabel(a.date) + ' · ' + Math.round(a.durSec / 60) + ' мин</span></div></div>';
    }).join('');

    shell(user, 'students',
      '<div class="page-head"><p class="eyebrow">[ карточка ученика ]</p>' +
      '<div class="page-head__row"><h1>' + esc(s.name) + '</h1><a class="icon-btn" href="#/students" aria-label="Назад">' + ic('back') + '</a></div></div>' +

      '<div class="glass orbit-wrap" style="margin-bottom:12px">' + UI.avatar(s, 'lg').replace('ava--lg', 'ava ava--lg') +
        '<div class="orbit-wrap__info" style="flex:1"><b>' + esc(lvl.level.name) + '</b>' +
        '<span>' + (s.xp || 0) + ' XP · серия ' + (s.streak || 0) + ' · домашка ' + hwDone + '/' + hw.length + '</span></div></div>' +

      '<p class="section-label"><span>попытки тестов</span></p>' +
      (history || emptyBox('clipboard', 'Ещё не решал', 'Как только ученик пройдёт тест, результаты появятся здесь')));
  }

  /* ═══════════ ЕЩЁ / НАСТРОЙКИ ═══════════ */

  function moreList(user) {
    var items = [];
    if (user.role === 'student') items.push({ href: '#/homework', icon: 'clipboard', label: 'Домашние задания', sub: 'сдать и просмотреть' });
    if (user.role === 'teacher') items.push({ href: '#/builder', icon: 'edit', label: 'Конструктор тестов', sub: 'создать тренировку' });
    items.push({ href: '#/settings', icon: 'grid', label: 'Профиль и настройки', sub: 'уведомления, данные' });
    return items;
  }

  function renderMore(user) {
    var body =
      '<div class="page-head"><p class="eyebrow">[ ещё · бортовые системы ]</p><h1>Ещё</h1></div>' +
      '<div class="stack">' + moreList(user).map(function (i) {
        return '<a class="login__card glass" href="' + i.href + '">' + ic(i.icon) +
          '<span><b>' + esc(i.label) + '</b><i>' + esc(i.sub) + '</i></span>' +
          '<span class="login__go">' + ic('back') + '</span></a>';
      }).join('') + '</div>' +
      '<p class="section-label"><span>приложение</span></p>' +
      installCard() +
      '<p class="section-label"><span>ссылки</span></p>' +
      '<div class="stack">' +
        '<a class="login__card glass" href="https://tankecu.github.io/voskhod-school/" target="_blank" rel="noopener">' + ic('link') +
          '<span><b>Сайт школы</b><i>программы, отзывы, заявка</i></span><span class="login__go">' + ic('back') + '</span></a>' +
        '<button class="login__card glass" id="logoutBtn" style="text-align:left">' + ic('logout') +
          '<span><b>Выйти</b><i>сменить аккаунт</i></span></button>' +
      '</div>';
    shell(user, 'more', body);
    bindLogout();
    bindInstall();
  }

  function installCard() {
    if (isStandalone()) {
      return '<div class="glass card" style="display:flex;gap:12px;align-items:center">' + ic('check') +
        '<span style="font-size:13.5px;color:var(--dust)">Приложение установлено — ты в автономном режиме ✦</span></div>';
    }
    var btn = deferredInstall
      ? '<button class="btn btn--gold btn--sm" id="installBtn">' + ic('install') + ' Установить</button>'
      : '<span class="mono" style="font-size:11px;color:var(--dust-2)">меню Chrome → «Установить приложение»</span>';
    return '<div class="glass card" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">' + ic('phone') +
      '<span style="flex:1;min-width:180px"><b style="font-size:14.5px">На весь экран, как приложение</b>' +
      '<span style="display:block;font-size:12.5px;color:var(--dust)">Android: установка через браузер, работает офлайн</span></span>' + btn + '</div>';
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

  function bindLogout() {
    var b = document.getElementById('logoutBtn');
    if (b) b.addEventListener('click', function () {
      DB.logout();
      location.hash = '#/login';
    });
  }

  function renderSettings(user) {
    var lvl = DB.levelOf(user.xp || 0);
    shell(user, 'more',
      '<div class="page-head"><p class="eyebrow">[ профиль ]</p><h1>Профиль</h1></div>' +
      '<div class="glass card" style="display:flex;gap:16px;align-items:center;margin-bottom:14px">' +
        UI.avatar(user, 'lg').replace('ava--lg', 'ava ava--lg ' + (user.role === 'teacher' ? 'ava--gold' : '')) +
        '<div style="flex:1"><b style="font-family:var(--font-display);font-size:16px">' + esc(user.name) + '</b>' +
        '<span style="display:block;color:var(--dust);font-size:13px">' +
        (user.role === 'teacher' ? esc(user.subject || 'Преподаватель') : esc(lvl.level.name) + ' · ' + (user.xp || 0) + ' XP') + '</span></div></div>' +
      installCard() +
      '<p class="section-label"><span>данные</span></p>' +
      '<div class="stack">' +
        '<button class="login__card glass" id="resetBtn" style="text-align:left">' + ic('trash') +
          '<span><b>Сбросить демо-данные</b><i>вернуть расписание, тесты и XP к исходным</i></span></button>' +
        '<button class="login__card glass" id="logoutBtn2" style="text-align:left">' + ic('logout') +
          '<span><b>Выйти из аккаунта</b><i>вернуться на экран входа</i></span></button>' +
      '</div>' +
      '<p class="mono" style="text-align:center;font-size:11px;color:var(--dust-2);margin-top:22px">VOSKHOD Orbit · демо-версия · данные хранятся только на этом устройстве</p>'
    );
    bindInstall();
    bindLogout();
    document.getElementById('logoutBtn2').addEventListener('click', function () { DB.logout(); location.hash = '#/login'; });
    document.getElementById('resetBtn').addEventListener('click', function () {
      var m = UI.modal(
        '<div class="modal__head"><h3>Сбросить всё?</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
        '<p style="color:var(--dust);font-size:14px">XP, попытки, домашка и созданные тесты вернутся к демо-состоянию.</p>' +
        '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Отмена</button>' +
        '<button class="btn btn--danger btn--full" id="resetYes">Сбросить</button></div>');
      m.el.querySelector('#resetYes').addEventListener('click', function () {
        DB.reset(); m.close(); toast('Данные сброшены к демо-состоянию', 'warn');
        location.hash = '#/today'; rerender();
      });
    });
  }

  /* ═══════════ РОУТЕР ═══════════ */

  function rerender() { route(true); }

  function route(keepScroll) {
    Tests.cleanup();
    var hash = location.hash.replace(/^#\/?/, '') || '';
    var parts = hash.split('/');
    var name = parts[0] || '';

    if (name !== 'login' && !DB.session()) { location.hash = '#/login'; return; }
    var user = DB.currentUser();

    if (name === 'login' || name === '') {
      if (user && name !== 'login' && hash !== '') { /* ок */ }
      else if (user) { location.hash = '#/today'; return; }
      renderLogin();
      return;
    }
    if (!user) { location.hash = '#/login'; return; }

    switch (name) {
      case 'today': renderToday(user); break;
      case 'schedule': renderSchedule(user); break;
      case 'homework': renderHomework(user); break;
      case 'tests': renderTests(user); break;
      case 'test': Tests.renderRunner(document.getElementById('page'), parts[1]); break;
      case 'builder': Tests.renderBuilder(document.getElementById('page'), parts[1] || null); break;
      case 'review':
        var a = DB.attempt(parts[1]);
        var t = a && DB.test(a.testId);
        if (t) Tests.renderReview(document.getElementById('page'), t, a.answers);
        else location.hash = '#/progress';
        break;
      case 'progress':
        if (user.role === 'teacher') renderStudents(user); else renderProgress(user);
        break;
      case 'students': renderStudents(user); break;
      case 'student': renderStudentCard(user, parts[1]); break;
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
  DB.ready();
  route();
})();
