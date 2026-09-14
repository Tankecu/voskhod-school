global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.CONFIG = { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
require('../js/bank-math.js');
require('../js/curriculum.js');

const cov = {};
window.BANK_MATH.all.forEach(g => {
  (cov[g.topic] = cov[g.topic] || { easy: 0, med: 0, hard: 0, tot: 0 });
  if (g.difficulties.includes('hard')) cov[g.topic].hard++;
  else cov[g.topic].med++;
  cov[g.topic].tot++;
});
let gaps = 0, total = 0;
window.CURRICULUM.blocks.forEach(b => b.topics.forEach(t => {
  total++;
  const c = cov[t.id] || { easy: 0, med: 0, hard: 0, tot: 0 };
  const ok = c.tot >= 2 && c.med >= 1;
  if (!ok) { console.log('GAP:', t.id, t.title, JSON.stringify(c)); gaps++; }
}));
console.log('topics:', total, '| generators:', window.BANK_MATH.all.length, '| gaps:', gaps);

let bad = 0;
window.BANK_MATH.all.forEach(g => {
  for (let i = 0; i < 20; i++) {
    const q = g.make();
    if (!q.q || q.options.length !== 4 || new Set(q.options).size !== 4 || q.correct < 0 || q.correct > 3 || !q.explain || /NaN|undefined/.test(q.q + q.explain + q.options.join())) {
      bad++; console.log('BAD', g.topic, g.domain, (q.q || '').slice(0, 60)); break;
    }
  }
});
console.log('bad generators:', bad);

const s = window.BANK_MATH.draw('a1', 'easy', 5);
console.log('draw a1 easy x5:', s.length, '| all a1:', s.every(q => q.topic === 'a1'));
