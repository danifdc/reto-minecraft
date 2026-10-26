// Herramienta de desarrollo: juega todos los niveles en la app real (con su solución de referencia)
// y verifica que cada uno termine con "¡Misión cumplida!" y sin errores en la consola.
//
// Uso:  node scripts/jugar-todos.mjs [velocidad]
import puppeteer from 'puppeteer-core';

const velocidad = Number(process.argv[2] ?? 4);
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.URL ?? 'http://localhost:5173/';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__debug !== undefined, { timeout: 15000 });
await page.evaluate((v) => { window.__debug.desbloquear(); window.__debug.escena.velocidad = v; }, velocidad);

const total = await page.evaluate(() => window.__debug.juego.niveles.length);
let fallos = 0;
for (let i = 0; i < total; i++) {
  await page.evaluate((n) => { window.__debug.cargar(n); window.__debug.ponerSolucion(n); }, i);
  await new Promise((r) => setTimeout(r, 150));
  await page.click('#btn-ejecutar');
  const titulo = await page
    .waitForFunction(() => !document.getElementById('dialogo').hidden && document.getElementById('dialogo-titulo').textContent, { timeout: 60000 })
    .then((h) => h.jsonValue())
    .catch(() => '(sin diálogo)');
  const ok = titulo === '¡Misión cumplida!';
  if (!ok) fallos++;
  const nombre = await page.$eval('#mision-chip', (el) => el.textContent);
  console.log(`${ok ? '✔' : '✘'} ${nombre} → ${titulo}`);
}

console.log(errores.length ? `ERRORES EN CONSOLA:\n${errores.join('\n')}` : 'Sin errores en consola');
console.log(fallos ? `${fallos} nivel(es) fallaron` : `Los ${total} niveles se ganan en la app.`);
await browser.close();
process.exit(fallos || errores.length ? 1 : 0);
