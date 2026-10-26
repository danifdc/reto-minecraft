// Herramienta de desarrollo: fotografía el escenario de cada nivel y arma un mosaico en una sola imagen.
//
// Uso:  node scripts/mosaico.mjs <archivo-salida.png> [desde] [hasta]   (niveles numerados desde 1)
import puppeteer from 'puppeteer-core';

const [salida = 'mosaico.png', desde = '1', hasta = '20'] = process.argv.slice(2);
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.URL ?? 'http://localhost:5173/';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__debug !== undefined, { timeout: 15000 });
await page.evaluate(() => window.__debug.desbloquear());

const fotos = [];
for (let n = Number(desde); n <= Number(hasta); n++) {
  await page.evaluate((i) => window.__debug.cargar(i), n - 1);
  await new Promise((r) => setTimeout(r, 350));
  const titulo = await page.$eval('#mision-chip', (el) => el.textContent);
  const img = await (await page.$('.escenario-marco')).screenshot({ encoding: 'base64' });
  fotos.push({ titulo, img });
}

const columnas = 5;
const html = `<body style="margin:0;background:#12151B;font:700 18px sans-serif;color:#F2C94C">
  <div style="display:grid;grid-template-columns:repeat(${columnas},360px);gap:8px;padding:8px">
  ${fotos.map((f) => `<div><div style="height:24px">${f.titulo}</div><img src="data:image/png;base64,${f.img}" style="width:360px;display:block"></div>`).join('')}
  </div></body>`;
const mosaico = await browser.newPage();
const filas = Math.ceil(fotos.length / columnas);
await mosaico.setViewport({ width: columnas * 368 + 8, height: filas * 410 + 8 });
await mosaico.setContent(html, { waitUntil: 'load' });
await mosaico.screenshot({ path: salida, fullPage: true });
console.log('mosaico →', salida);
await browser.close();
