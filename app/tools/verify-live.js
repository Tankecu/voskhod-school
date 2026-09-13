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

  /* мобильный Android-вид */
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto('https://tankecu.github.io/voskhod-school/app/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 5000));

  const checks = await p.evaluate(async () => {
    const swReg = await navigator.serviceWorker.getRegistration();
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const manifest = manifestLink ? await fetch(manifestLink.href).then(r => r.json()).catch(() => null) : null;
    return {
      swActive: !!(swReg && (swReg.active || swReg.installing || swReg.waiting)),
      manifestOk: !!(manifest && manifest.icons && manifest.icons.length >= 3),
      manifestName: manifest ? manifest.name : null,
      display: manifest ? manifest.display : null,
      loginVisible: !!document.querySelector('.login__title'),
    };
  });
  console.log(JSON.stringify(checks, null, 1));
  await p.screenshot({ path: OUT + 'live-m-login.png' });

  /* вход учеником, дашборд */
  await p.evaluate(() => document.querySelectorAll('[data-login]')[0].click());
  await new Promise(r => setTimeout(r, 1200));
  await p.screenshot({ path: OUT + 'live-m-today.png' });

  /* десктоп */
  await p.setViewport({ width: 1440, height: 900 });
  await p.evaluate(() => { location.hash = '#/today'; });
  await new Promise(r => setTimeout(r, 1000));
  await p.screenshot({ path: OUT + 'live-d-today.png' });

  console.log('errors:', errs.length ? '\n' + errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
