const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://localhost:8091/';
const mkHash = (pass) => crypto.createHash('sha256').update('r:' + pass).digest('hex');
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' | ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push('C: ' + m.text().slice(0, 110)); });
  await p.setViewport({ width: 1280, height: 800 });
  await p.goto(APP, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await p.evaluate(() => {
    const s = (s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    s('#loginName', 'roome2et');
    s('#loginPass', 'pt');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await new Promise(r => setTimeout(r, 2000));
  await p.evaluate(() => { location.hash = '#/room/l-roome2e'; });
  await new Promise(r => setTimeout(r, 1500));
  const st = await p.evaluate(() => ({
    hash: location.hash,
    room: !!document.querySelector('.room'),
    hasPeer: typeof Peer !== 'undefined',
    stream: !!(window.__x = null) || undefined,
    bodySnippet: document.body.innerText.slice(0, 110).replace(/\n/g, ' | '),
  }));
  console.log(JSON.stringify(st, null, 1));
  console.log('errors:', errs.join('\n') || 'none');
  await b.close();
})().catch(e => console.error('FAIL', e.message));
