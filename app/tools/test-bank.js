/* Валидатор банка: каждый генератор × 40 прогонов */
global.window = { MOCK_SAT_1_RW: [[], []], MOCK_SAT_1_MATH: [[], []], MOCK_SAT_1: {} };
require('../js/bank-math.js');
const bank = window.BANK_MATH;
let bad = 0, total = 0;

bank.all.forEach((g, gi) => {
  for (let run = 0; run < 40; run++) {
    g.difficulties.forEach((d) => {
      let q;
      try { q = g.make(); } catch (e) { console.log('THROW', gi, g.domain, d, e.message); bad++; return; }
      total++;
      if (!q.q || typeof q.q !== 'string') { console.log('bad q', gi); bad++; }
      if (!Array.isArray(q.options) || q.options.length !== 4) { console.log('bad options len', gi, JSON.stringify(q.options)); bad++; }
      if (new Set(q.options).size !== 4) { console.log('dup options', gi, g.domain, d, '|', (q.q || '').slice(0, 90), '|', JSON.stringify(q.options)); bad++; }
      if (q.correct < 0 || q.correct > 3 || q.correct == null) { console.log('bad correct', gi); bad++; }
      const c = q.options[q.correct];
      if (c === undefined || /NaN|undefined|null/.test(c)) { console.log('bad correct value', gi, c); bad++; }
      if (/NaN|undefined/.test(q.q) || /NaN|undefined/.test(q.explain)) { console.log('NaN in text', gi, '|', q.q.slice(0, 80), '|', (q.explain || '').slice(0, 80)); bad++; }
      if (!q.explain || q.explain.length < 5) { console.log('no explain', gi); bad++; }
    });
  }
});
console.log('generators:', bank.all.length, '| checks passed:', total - bad, '| problems:', bad);
