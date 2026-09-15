const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto('https://tankecu.github.io/voskhod-school/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 3000));
  await p.evaluate(() => document.querySelector('#apply').scrollIntoView());
  await new Promise(r => setTimeout(r, 800));
  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#fName', 'E2E Проверка');
    set('#fContact', '@e2e_lead_check');
  });
  await p.evaluate(() => document.querySelector('#submitBtn').click());
  await new Promise(r => setTimeout(r, 4000));
  const ui = await p.evaluate(() => !document.getElementById('formSuccess').hidden);
  await new Promise(r => setTimeout(r, 1000));
  const rows = await fetch(SB + 'leads?contact=eq.@e2e_lead_check', {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  }).then(r => r.json());
  console.log('form success UI:', ui, '| lead rows in supabase:', rows.length,
    rows.length ? '| name: ' + rows[0].name + ', program: ' + rows[0].program + ', status: ' + rows[0].status : '');
  await b.close();
  await fetch(SB + 'leads?contact=eq.@e2e_lead_check', { method: 'DELETE', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
  console.log('test lead deleted');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
