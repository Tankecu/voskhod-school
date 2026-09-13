const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'D:\\rep\\voskhod\\app-shots\\';
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = async n => { await p.screenshot({ path: OUT + n }); console.log('shot', n); };

  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('https://tankecu.github.io/voskhod-school/app/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(5000);
  const setup = await p.evaluate(() => !!document.querySelector('#setupForm'));
  console.log('live setup wizard:', setup);
  await shot('live-v2-setup.png');

  /* создать админа */
  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#suName', 'Директор');
    set('#suLogin', 'director');
    set('#suPass', 'orbit2026');
    set('#suPass2', 'orbit2026');
  });
  await p.evaluate(() => document.querySelector('#suBtn').click());
  await sleep(1500);
  console.log('after setup hash:', await p.evaluate(() => location.hash));
  await shot('live-v2-admin.png');

  /* тестов у админа видно 14 из банка */
  await p.evaluate(() => { location.hash = '#/tests'; });
  await sleep(1200);
  const bankCount = await p.evaluate(() => document.querySelectorAll('.test-card').length);
  console.log('test cards visible (bank=14):', bankCount);

  /* перелогин → теория */
  await p.evaluate(() => { location.hash = '#/settings'; });
  await sleep(700);
  await p.evaluate(() => document.querySelector('#logoutBtn2').click());
  await sleep(1000);
  console.log('login again:', await p.evaluate(() => !!document.querySelector('#loginForm')));
  console.log('errors:', errs.length ? '\n' + errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
