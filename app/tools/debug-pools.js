global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.CONFIG = { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
require('../js/bank-math.js');
const B = window.BANK_MATH;
['a1','a2','a3','a4','a5','b1','b2','b3','b4','b5','c1','c2','c3','c4','c5','d1','d2','d3','d4','d5','e1','e2','e3','e4'].forEach(t => {
  const easy = B.all.filter(g => g.topic === t && g.difficulties.includes('easy')).length;
  const med = B.all.filter(g => g.topic === t && g.difficulties.includes('medium')).length;
  const hard = B.all.filter(g => g.topic === t && g.difficulties.includes('hard')).length;
  if (med === 0 || hard === 0) console.log('EMPTY POOL:', t, { easy, med, hard });
  // тест draw
  try { B.draw(t, 'medium', 1); } catch (e) { console.log('DRAW FAIL', t, e.message); }
});
console.log('pool check done');
