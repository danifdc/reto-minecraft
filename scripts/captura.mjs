// Herramienta de desarrollo: abre el juego en Chrome sin ventana, ejecuta pasos y guarda capturas.
//
// Uso:  node scripts/captura.mjs <url> <carpeta-salida> [ancho] [alto]
// Los pasos se leen de la variable de entorno PASOS (JSON: eval, click, hover, arrastrar, esperar, texto, foto), por ejemplo:
//   PASOS='[{"eval":"__debug.cargar(1)"},{"eval":"__debug.ponerSolucion(1)"},{"click":"#btn-ejecutar"},{"esperar":1500},{"foto":"a"}]'
import puppeteer, { KnownDevices } from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [url = 'http://localhost:5173/', salida = '.', ancho = '1920', alto = '1080'] = process.argv.slice(2);
const pasos = JSON.parse(process.env.PASOS ?? '[{"esperar":1500},{"foto":"inicio"}]');
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(salida, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
// MOVIL=1 simula un celular (para probar el aviso de dispositivos móviles).
if (process.env.MOVIL) await page.emulate(KnownDevices['iPhone 13']);
else await page.setViewport({ width: Number(ancho), height: Number(alto) });
const errores = [];
page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${m.type()}: ${m.text()}`); });

await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__debug !== undefined, { timeout: 15000 }).catch(() => errores.push('sin __debug'));

for (const p of pasos) {
  if (p.eval) console.log('eval →', JSON.stringify(await page.evaluate(p.eval)));
  if (p.click) await page.click(p.click);
  if (p.hover) await page.hover(p.hover);
  if (p.arrastrar) {
    // p.arrastrar: expresión JS que devuelve [x1, y1, x2, y2] en píxeles de la ventana.
    const [x1, y1, x2, y2] = await page.evaluate(p.arrastrar);
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x1 + 10, y1 + 10, { steps: 3 });
    await page.mouse.move(x2, y2, { steps: 15 });
    await page.mouse.up();
  }
  if (p.esperar) await new Promise((r) => setTimeout(r, p.esperar));
  if (p.texto) console.log(p.texto, '→', await page.$eval(p.texto, (el) => el.innerText.replace(/\s+/g, ' ').trim()).catch(() => '(no visible)'));
  if (p.foto) {
    const archivo = join(salida, `${p.foto}.png`);
    // p.clip: selector CSS para fotografiar solo ese elemento.
    if (p.clip) await (await page.$(p.clip)).screenshot({ path: archivo });
    else await page.screenshot({ path: archivo });
    console.log('foto →', archivo);
  }
}

console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'Sin errores en consola');
await browser.close();
