const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  const apiCalls = [];
  p.on('response', async (r) => {
    if (r.url().includes('api.telegram.org')) {
      apiCalls.push(r.url().split('/bot')[1].split('/')[0] + ' → ' + r.status());
    }
  });
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('https://tankecu.github.io/voskhod-school/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));

  await p.evaluate(() => document.querySelector('#apply').scrollIntoView());
  await new Promise(r => setTimeout(r, 1500));
  await p.evaluate(() => {
    const set = (s, v) => {
      const el = document.querySelector(s);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('#fName', 'Тестовая Заявка');
    set('#fContact', '@test_student');
  });
  await p.evaluate(() => document.querySelector('#submitBtn').click());
  await new Promise(r => setTimeout(r, 4000));

  const state = await p.evaluate(() => ({
    successShown: !document.getElementById('formSuccess').hidden,
    successText: document.getElementById('formSuccess').textContent.trim().slice(0, 80),
    btnText: document.getElementById('submitBtn').textContent,
  }));
  console.log('telegram api responses:', JSON.stringify(apiCalls));
  console.log('form state:', JSON.stringify(state, null, 1));
  await p.screenshot({ path: 'D:\\rep\\voskhod\\app-shots\\bot-form-success.png' });
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
