/* ═══════════════════════════════════════════════════════════
   VOSKHOD — тренажёр слов: SM-2 упрощённый.
   Верно → интервал ×2.5 (1→3→7→14→30), ошибка → сброс на 1.
   ═══════════════════════════════════════════════════════════ */

window.Vocab = (function () {
  'use strict';

  var esc = UI.esc, ic = UI.ic, toast = UI.toast;

  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function addDaysIso(iso, n) {
    var d = iso ? new Date(iso + 'T00:00:00') : new Date();
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ═══════════ ГЛАВНЫЙ ЭКРАН ═══════════ */

  function renderVocab(root, user) {
    var all = window.VOCAB_BANK || [];
    var progress = DB.vocabProgressFor(user.id);
    var byWord = {};
    progress.forEach(function (r) { byWord[r.wordId] = r; });

    var today = todayIso();
    var due = all.filter(function (w) {
      var p = byWord[w.id];
      return !p || p.nextReview <= today;
    });
    var mastered = progress.filter(function (p) { return p.intervalDays >= 30; }).length;
    var seen = progress.length;
    var accuracy = 0;
    progress.forEach(function (p) { accuracy += p.correct; });
    var totalSeen = progress.reduce(function (a, p) { return a + p.seen; }, 0);
    if (totalSeen > 0) accuracy = Math.round(accuracy / totalSeen * 100);

    root.innerHTML =
      '<div class="page-head"><p class="eyebrow">[ слова · spaced repetition ]</p>' +
      '<div class="page-head__row"><h1>Слова дня</h1>' +
      '<span class="chip chip--gold" style="font-size:13px">' + mastered + ' освоено</span></div>' +
      '<p>10 слов в день по алгоритму интервалов — самый быстрый способ набрать словарный запас для SAT</p></div>' +

      '<div class="stat-row" style="margin-bottom:18px">' +
        '<div class="stat-tile glass">' + ic('star') + '<b>' + seen + '</b><span>слов в работе</span></div>' +
        '<div class="stat-tile glass">' + ic('check') + '<b>' + mastered + '</b><span>освоено (интервал 30+)</span></div>' +
        '<div class="stat-tile glass">' + ic('chart') + '<b>' + accuracy + '%</b><span>общая точность</span></div>' +
      '</div>' +

      (due.length
        ? '<div class="glass card" style="text-align:center;margin-bottom:16px">' +
            '<p style="font-size:15px;margin-bottom:12px">Сегодня к повторению: <b style="color:var(--ion)">' + Math.min(10, due.length) + ' слов</b></p>' +
            '<a class="btn btn--gold btn--full" href="#/vocab/session">' + ic('play') + ' Начать сессию</a>' +
          '</div>'
        : '<div class="th-tip" style="margin-bottom:16px">✓ Все слова на сегодня повторены — возвращайся завтра!</div>') +

      '<p class="section-label"><span>как работает</span></p>' +
      '<div class="glass card" style="font-size:13.5px;color:var(--dust)">' +
      '<p>Ответил верно → слово вернётся через больший интервал (1 → 3 → 7 → 14 → 30 дней). Ошибся → вернётся завтра. Слова с интервалом 30+ дней считаются освоенными.</p>' +
      '</div>';
  }

  /* ═══════════ СЕССИЯ ═══════════ */

  function renderSession(root, user) {
    var all = window.VOCAB_BANK || [];
    var progress = DB.vocabProgressFor(user.id);
    var byWord = {};
    progress.forEach(function (r) { byWord[r.wordId] = r; });

    var today = todayIso();
    var due = all.filter(function (w) {
      var p = byWord[w.id];
      return !p || p.nextReview <= today;
    }).slice(0, 10);

    if (!due.length) {
      toast('Все слова на сегодня повторены ✦');
      location.hash = '#/trainer';
      return;
    }

    var sessionIdx = 0, sessionResults = [];

    function render() {
      if (sessionIdx >= due.length) { finish(); return; }
      var w = due[sessionIdx];
      var p = byWord[w.id];
      var isNew = !p || !p.seen;
      var keys = ['A', 'B', 'C', 'D'];

      var options = shuffle([w.def].concat(w.d));
      var correctIdx = options.indexOf(w.def);

      root.innerHTML =
        '<div class="mock-shell">' +
          '<div class="mock-top"><div class="mock-top__title"><b>' + esc(w.word) + '</b>' +
          '<span>' + (isNew ? 'новое слово' : 'повторение · интервал ' + (p ? p.intervalDays : 1) + ' дн') + ' · ' + (sessionIdx + 1) + '/' + due.length + '</span></div></div>' +
          '<div class="qcard glass">' +
            '<p class="qcard__num">Что означает это слово?</p>' +
            '<p class="qcard__text" style="font-size:22px;font-family:var(--font-display)">' + esc(w.word) + '</p>' +
            '<div id="vOpts">' +
            options.map(function (opt, i) {
              return '<button class="opt" data-vopt="' + i + '"><span class="opt__key">' + keys[i] + '</span><span>' + esc(opt) + '</span></button>';
            }).join('') +
            '</div>' +
            '<div id="vExplain"></div>' +
          '</div>' +
          '<div class="mock-nav"><button class="btn btn--gold btn--full" id="vNext" style="visibility:hidden">' +
            (sessionIdx === due.length - 1 ? 'Завершить' : 'Далее →') + '</button></div>' +
        '</div>';

      root.querySelectorAll('[data-vopt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = +btn.dataset.vopt;
          var correct = i === correctIdx;
          sessionResults.push({ wordId: w.id, correct: correct });
          root.querySelectorAll('[data-vopt]').forEach(function (b, bi) {
            b.disabled = true;
            if (bi === correctIdx) b.classList.add('opt--right');
            else if (bi === i) b.classList.add('opt--wrong');
          });
          document.getElementById('vExplain').innerHTML =
            '<div class="explain"><b>' + (correct ? '✓ верно' : 'запомни') + '</b>' + esc(w.word) + ' — ' + esc(w.def) + '. <i>' + esc(w.ex) + '</i></div>';
          document.getElementById('vNext').style.visibility = 'visible';
        });
      });
      document.getElementById('vNext').addEventListener('click', function () {
        sessionIdx++;
        render();
      });
      window.scrollTo(0, 0);
    }

    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    function finish() {
      var chain = Promise.resolve();
      sessionResults.forEach(function (r) {
        chain = chain.then(function () { return applySM2(user.id, r.wordId, r.correct); });
      });
      chain = chain.then(function () {
        return DB.addStardust(user.id, 10, 'Слова дня: ' + sessionResults.length + ' слов');
      });
      chain.then(function () {
        var correct = sessionResults.filter(function (r) { return r.correct; }).length;
        root.innerHTML =
          '<div class="mock-shell"><div class="result glass">' +
            '<div class="result__ring" style="--pct:' + Math.round(correct / sessionResults.length * 100) + '"><div><b>' + correct + '/' + sessionResults.length + '</b><span>слов</span></div></div>' +
            '<div class="result__verdict">Сессия завершена ✦</div>' +
            '<p class="result__sub">+10 ✦ · Возвращайся завтра — система покажет слова в оптимальный момент</p>' +
            '<a class="btn btn--gold btn--full" href="#/trainer">К тренажёру</a>' +
          '</div></div>';
      });
    }

    render();
  }

  /* SM-2 упрощённый */
  function applySM2(studentId, wordId, correct) {
    var row = DB.vocabOf(studentId, wordId) || {
      id: DB.newId('vp'), studentId: studentId, wordId: wordId,
      intervalDays: 0, nextReview: todayIso(), streak: 0, seen: 0, correct: 0,
    };
    row.seen++;
    if (correct) {
      row.correct++;
      row.streak++;
      row.intervalDays = row.intervalDays === 0 ? 1 : Math.min(30, Math.round(row.intervalDays * 2.5));
    } else {
      row.streak = 0;
      row.intervalDays = 1;
    }
    row.nextReview = addDaysIso(todayIso(), row.intervalDays);
    row.updatedAt = new Date().toISOString();
    return DB.saveVocabProgress(row);
  }

  return { renderVocab: renderVocab, renderSession: renderSession, applySM2: applySM2 };
})();
