const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ': ' + m.text()); });
  await page.goto('http://localhost:8091/#/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2500));
  const info = await page.evaluate(() => ({
    hash: location.hash,
    html: document.getElementById('app').innerHTML.slice(0, 300),
    loginBtns: document.querySelectorAll('[data-login]').length,
    session: localStorage.getItem('voskhod-orbit-session'),
  }));
  console.log(JSON.stringify(info, null, 1));
  console.log('errs:', errs.length ? '\n' + errs.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
