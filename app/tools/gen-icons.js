/* Генерация PNG-иконок PWA из SVG через headless Chrome */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, '..', 'icons');

const SVG = (square = false) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512">
      <stop stop-color="#140B33"/><stop offset="1" stop-color="#06040F"/>
    </linearGradient>
    <linearGradient id="o" x1="90" y1="90" x2="422" y2="422">
      <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#8B5CF6"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.65">
      <stop stop-color="#8B5CF6" stop-opacity="0.5"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${square ? 0 : 112}" fill="url(#bg)"/>
  <rect width="512" height="512" rx="${square ? 0 : 112}" fill="url(#glow)"/>
  <circle cx="256" cy="256" r="196" fill="none" stroke="url(#o)" stroke-width="10"
          stroke-dasharray="28 62" stroke-linecap="round" transform="rotate(-18 256 256)"/>
  <path d="M256 116 L288 224 L396 256 L288 288 L256 396 L224 288 L116 256 L224 224 Z" fill="#F5C24B"/>
  <circle cx="404" cy="130" r="16" fill="#EDEBFF"/>
  <circle cx="118" cy="380" r="11" fill="#67E8F9"/>
  <circle cx="140" cy="130" r="8" fill="#EDEBFF" opacity="0.7"/>
</svg>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  async function shot(svg, size, name) {
    await page.setViewport({ width: size, height: size });
    await page.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
    await new Promise(r => setTimeout(r, 150));
    await page.screenshot({ path: path.join(OUT, name), clip: { x: 0, y: 0, width: size, height: size } });
    console.log('ok', name);
  }
  await shot(SVG(false), 192, 'icon-192.png');
  await shot(SVG(false), 512, 'icon-512.png');
  await shot(SVG(true), 512, 'icon-maskable.png');   // без скруглений — Android сам маскирует
  await shot(SVG(false), 180, 'apple-touch-icon.png');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
