/* ═══════════════════════════════════════════════════════════
   VOSKHOD — сборщик уникального пробника из банков вопросов
   + адаптивный выбор Module 2 (как в Bluebook):
   ≥60% верных в Module 1 → hard M2, ниже → easy M2.
   ═══════════════════════════════════════════════════════════ */

window.MOCK_GEN = (function () {
  'use strict';

  var ADAPTIVE_THRESHOLD = 0.6;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function buildRwModule(kind) {
    var out = [];
    if (kind === 'm1' || kind === 'medium') {
      out = out.concat(window.BANK_RW_ITEMS_DRAW('medium', 14, []));
      out = out.concat(window.BANK_RW_ITEMS_DRAW('easy', 6, []));
      out = out.concat(window.BANK_RW_GEN.draw('medium', kind === 'm1' ? 7 : 7));
    } else if (kind === 'easy') {
      out = out.concat(window.BANK_RW_ITEMS_DRAW('easy', 12, []));
      out = out.concat(window.BANK_RW_ITEMS_DRAW('medium', 6, []));
      out = out.concat(window.BANK_RW_GEN.draw('easy', 9));
    } else { /* hard */
      out = out.concat(window.BANK_RW_ITEMS_DRAW('hard', 12, []));
      out = out.concat(window.BANK_RW_ITEMS_DRAW('medium', 10, []));
      out = out.concat(window.BANK_RW_GEN.draw('hard', 5));
    }
    return shuffle(out).slice(0, 27);
  }

  function buildMathModule(kind) {
    var out = [];
    if (kind === 'm1' || kind === 'medium') {
      out = window.BANK_MATH.draw('easy', 11).concat(window.BANK_MATH.draw('medium', 11));
    } else if (kind === 'easy') {
      out = window.BANK_MATH.draw('easy', 13).concat(window.BANK_MATH.draw('medium', 9));
    } else { /* hard */
      out = window.BANK_MATH.draw('medium', 9).concat(window.BANK_MATH.draw('hard', 13));
    }
    return shuffle(out).slice(0, 22);
  }

  /* уникальный экзамен: M2 строится адаптивно после M1 */
  function build() {
    var exam = {
      id: 'gen' + Date.now().toString(36),
      title: 'SAT Unique Practice',
      generated: true,
      adaptive: true,
      rw: [buildRwModule('m1'), null],
      math: [buildMathModule('m1'), null],
      m2Variant: {},
      buildM2: function (sectionIdx, pctCorrect) {
        var difficulty = pctCorrect >= ADAPTIVE_THRESHOLD ? 'hard' : 'easy';
        var key = sectionIdx === 0 ? 'rw' : 'math';
        if (sectionIdx === 0) exam.rw[1] = buildRwModule(difficulty);
        else exam.math[1] = buildMathModule(difficulty);
        exam.m2Variant[key] = difficulty;
        return exam[key][1];
      },
    };
    return exam;
  }

  /* после JSON.parse функции теряются — навешиваем сборщик обратно */
  function attachBuilder(exam) {
    if (!exam || !exam.generated) return exam;
    exam.buildM2 = function (sectionIdx, pctCorrect) {
      var difficulty = pctCorrect >= ADAPTIVE_THRESHOLD ? 'hard' : 'easy';
      var key = sectionIdx === 0 ? 'rw' : 'math';
      if (sectionIdx === 0) exam.rw[1] = buildRwModule(difficulty);
      else exam.math[1] = buildMathModule(difficulty);
      exam.m2Variant[key] = difficulty;
      return exam[key][1];
    };
    return exam;
  }

  return { build: build, attachBuilder: attachBuilder, threshold: ADAPTIVE_THRESHOLD };
})();
