/* Александр rate=4 + группа + 5 учеников */
const crypto = require('crypto');
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };

const STUDENTS = [
  { login: 'dilnoza', name: 'Дилноза Рахимова' },
  { login: 'javohir', name: 'Жавохир Тошматов' },
  { login: 'aziza', name: 'Азиза Каримова' },
  { login: 'timur', name: 'Тимур Султанов' },
  { login: 'kamron', name: 'Камрон Юсупов' },
];
const PASS = 'orbit2026';

(async () => {
  /* id Саши */
  const users = await fetch(SB + 'users?select=id,login,rate&login=eq.sashbash', { headers: H }).then(r => r.json());
  const sasha = users[0];
  if (!sasha) { console.error('sashbash не найден'); process.exit(1); }

  /* ставка $4/час */
  const pr = await fetch(SB + 'users?id=eq.' + sasha.id, {
    method: 'PATCH', headers: H, body: JSON.stringify({ rate: 4 }),
  });
  console.log('ставка Саши = $4/ч:', pr.status === 204 ? 'ok' : pr.status);

  /* группа */
  const gid = 'g-sasha-sat';
  await fetch(SB + 'groups', {
    method: 'POST', headers: H,
    body: JSON.stringify([{ id: gid, name: 'SAT Math · Александр', teacherIds: [sasha.id], studentIds: [] }]),
  });
  console.log('группа создана');

  /* ученики: id собираем для группы */
  const ids = [];
  for (const s of STUDENTS) {
    const salt = crypto.randomBytes(8).toString('hex');
    const passHash = crypto.createHash('sha256').update(salt + ':' + PASS).digest('hex');
    const id = 'u-' + s.login;
    ids.push(id);
    const r = await fetch(SB + 'users', {
      method: 'POST', headers: H,
      body: JSON.stringify([{
        id, login: s.login, pass_hash: passHash, salt, role: 'student',
        name: s.name, active: true, xp: 0, streak: 0, group_id: gid,
      }]),
    });
    console.log(s.login, ':', r.status);
  }
  const gr = await fetch(SB + 'groups?id=eq.' + gid, { headers: H }).then(r => r.json());
  const cur = gr[0] ? gr[0].student_ids || [] : [];
  const merged = [...new Set(cur.concat(ids))];
  await fetch(SB + 'groups?id=eq.' + gid, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ student_ids: merged }),
  });
  console.log('группа наполнена:', merged.length, 'учеников');
  console.log('готово — пароль всех учеников:', PASS);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
