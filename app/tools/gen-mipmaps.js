const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RES = path.join(__dirname, '..', '..', 'apk', 'res');
const SVG = fs.readFileSync(path.join(__dirname, '..', 'icons', 'icon.svg'), 'utf8');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  const sizes = { 'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192 };
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    await page.setViewport({ width: size, height: size });
    await page.setContent(`<body style="margin:0">${SVG.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
    await new Promise(r => setTimeout(r, 120));
    await page.screenshot({ path: path.join(dir, 'ic_launcher.png'), clip: { x: 0, y: 0, width: size, height: size } });
    console.log('ok', folder, size);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
