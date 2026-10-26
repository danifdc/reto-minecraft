// Herramienta de desarrollo: mide dónde queda el texto y el ícono (píxeles blancos) dentro de cada botón.
// Uso: node scripts/medir-botones.mjs "#btn-ejecutar" "#btn-paso"   (con el juego abierto en el nivel 1)
import puppeteer from 'puppeteer-core';

const selectores = process.argv.slice(2);
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(process.env.URL ?? 'http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__debug !== undefined);
await page.click('#btn-jugar');
await new Promise((r) => setTimeout(r, 300));
await page.click('.dialogo-botones .btn');
await new Promise((r) => setTimeout(r, 300));

for (const sel of selectores) {
  const el = await page.$(sel);
  const b64 = await el.screenshot({ encoding: 'base64' });
  const r = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    // Columna a columna: separa íconos y texto buscando huecos verticales de más de 14 px.
    const blanco = (i) => d[i] > 225 && d[i + 1] > 225 && d[i + 2] > 225;
    const filas = (x0, x1) => { let a = -1, z = -1; for (let y = 0; y < c.height; y++) for (let xx = x0; xx < x1; xx++) if (blanco((y * c.width + xx) * 4)) { if (a < 0) a = y; z = y; break; } return [a, z]; };
    const cols = []; for (let xx = 0; xx < c.width; xx++) { let s = false; for (let y = 0; y < c.height; y++) if (blanco((y * c.width + xx) * 4)) { s = true; break; } cols.push(s); }
    const grupos = []; let ini = -1, ult = -1;
    cols.forEach((s, i) => { if (s) { if (ini < 0) ini = i; else if (i - ult > 14) { grupos.push([ini, ult]); ini = i; } ult = i; } });
    if (ini >= 0) grupos.push([ini, ult]);
    return { alto: c.height, ancho: c.width, grupos: grupos.map(([a, z]) => ({ x: [a, z], y: filas(a, z + 1) })) };
  }, b64);
  const g = r.grupos;
  console.log(sel, `caja ${r.ancho}x${r.alto}`);
  g.forEach((q, i) => {
    const centro = (q.y[0] + q.y[1]) / 2;
    console.log(`  ${i === 0 ? 'ícono' : 'texto'} x ${q.x} y ${q.y} → centro ${centro.toFixed(1)} (centro de la caja ${(r.alto / 2).toFixed(1)}, desvío ${(centro - r.alto / 2).toFixed(1)})`);
  });
}
await browser.close();
