/**
 * Efectos de sonido de 8 bits sintetizados con WebAudio (sin archivos de audio).
 * El navegador solo permite sonar después de una interacción del usuario: el contexto se crea
 * o reanuda en el primer sonido, que siempre ocurre tras un clic o un arrastre.
 */

let ctx: AudioContext | null = null;
let ruidoBuffer: AudioBuffer | null = null;
let silencio = false;

export function setSilencio(valor: boolean) {
  silencio = valor;
}
export const estaSilenciado = () => silencio;

function contexto(): AudioContext | null {
  if (silencio) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type Onda = OscillatorType;

/** Un tono con barrido de frecuencia y envolvente corta. `t` es el retardo en segundos. */
function tono(f0: number, f1: number, dur: number, onda: Onda = 'square', vol = 0.1, t = 0) {
  const c = contexto();
  if (!c) return;
  const ini = c.currentTime + t;
  const osc = c.createOscillator();
  const gan = c.createGain();
  osc.type = onda;
  osc.frequency.setValueAtTime(f0, ini);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), ini + dur);
  gan.gain.setValueAtTime(0.0001, ini);
  gan.gain.exponentialRampToValueAtTime(vol, ini + 0.008);
  gan.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
  osc.connect(gan).connect(c.destination);
  osc.start(ini);
  osc.stop(ini + dur + 0.02);
}

/** Ráfaga de ruido filtrado (golpes, salpicaduras, roturas). */
function ruido(dur: number, vol: number, filtro: BiquadFilterType, frec: number, t = 0, frecFin?: number) {
  const c = contexto();
  if (!c) return;
  if (!ruidoBuffer) {
    ruidoBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const datos = ruidoBuffer.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  }
  const ini = c.currentTime + t;
  const src = c.createBufferSource();
  src.buffer = ruidoBuffer;
  const f = c.createBiquadFilter();
  f.type = filtro;
  f.frequency.setValueAtTime(frec, ini);
  if (frecFin) f.frequency.exponentialRampToValueAtTime(frecFin, ini + dur);
  const gan = c.createGain();
  gan.gain.setValueAtTime(vol, ini);
  gan.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
  src.connect(f).connect(gan).connect(c.destination);
  src.start(ini);
  src.stop(ini + dur + 0.02);
}

/** Notas en Hz (escala de Do). */
const N = { C4: 262, E4: 330, G4: 392, A4: 440, C5: 523, E5: 659, G5: 784, B5: 988, C6: 1047, E6: 1319, G6: 1568, B6: 1976 };

let pie = 0;

export const sonido = {
  // ---- Espacio de trabajo
  encajar: () => tono(700, 950, 0.06, 'square', 0.07),
  borrar: () => {
    tono(420, 140, 0.14, 'triangle', 0.1);
    ruido(0.08, 0.05, 'lowpass', 1200);
  },

  // ---- Ejecución
  ejecutar: () => [N.C5, N.E5, N.G5].forEach((f, i) => tono(f, f, 0.07, 'square', 0.06, i * 0.06)),
  paso: () => {
    pie = 1 - pie;
    tono(pie ? 190 : 160, 120, 0.05, 'triangle', 0.07);
  },
  pasoHeroe: () => {
    pie = 1 - pie;
    tono(pie ? 240 : 210, 160, 0.04, 'triangle', 0.04);
  },
  girar: () => tono(480, 620, 0.06, 'sine', 0.06),
  choque: () => {
    ruido(0.16, 0.25, 'lowpass', 900);
    tono(140, 60, 0.18, 'square', 0.08);
  },
  agua: () => {
    ruido(0.35, 0.18, 'bandpass', 1400, 0, 500);
    tono(600, 200, 0.12, 'sine', 0.05);
  },
  lava: () => {
    ruido(0.45, 0.14, 'highpass', 3000);
    ruido(0.3, 0.12, 'lowpass', 300);
  },
  romper: () => [0, 0.07, 0.14].forEach((t, i) => ruido(0.08, 0.22 - i * 0.04, 'bandpass', 700 - i * 150, t)),
  colocar: () => {
    tono(200, 70, 0.14, 'sine', 0.18);
    ruido(0.06, 0.1, 'lowpass', 600);
  },
  atacar: () => {
    ruido(0.14, 0.12, 'highpass', 1500, 0, 5000);
    tono(300, 90, 0.12, 'square', 0.07, 0.05);
  },
  vencer: () => [N.G5, N.E5, N.C5].forEach((f, i) => tono(f, f * 0.9, 0.06, 'square', 0.05, i * 0.05)),
  recoger: () => [N.E6, N.G6, N.B6].forEach((f, i) => tono(f, f, 0.06, 'square', 0.05, i * 0.05)),
  fragmento: () => [N.C6, N.E6, N.G6, N.C6 * 2].forEach((f, i) => tono(f, f, 0.1, 'triangle', 0.09, i * 0.08)),
  duda: () => {
    tono(330, 300, 0.09, 'sine', 0.08);
    tono(260, 240, 0.12, 'sine', 0.08, 0.1);
  },
  puerta: () => {
    tono(N.C5, N.C5, 0.12, 'triangle', 0.09);
    tono(N.G5, N.G5, 0.2, 'triangle', 0.09, 0.1);
  },

  // ---- Resultado
  ganar: () => {
    [N.C5, N.E5, N.G5].forEach((f, i) => tono(f, f, 0.1, 'square', 0.07, i * 0.1));
    tono(N.C6, N.C6, 0.4, 'square', 0.07, 0.3);
    tono(N.E5, N.E5, 0.4, 'triangle', 0.05, 0.3);
  },
  perder: () => [N.G4, N.E4, N.C4].forEach((f, i) => tono(f, f * 0.97, 0.16, 'triangle', 0.1, i * 0.15)),

  // ---- Batería y contraseña
  sinBateria: () => tono(700, 90, 0.9, 'square', 0.05),
  claveMal: () => tono(130, 110, 0.25, 'square', 0.07),
  recargar: () => {
    tono(180, 1400, 0.9, 'square', 0.05);
    [N.C6, N.E6, N.G6].forEach((f, i) => tono(f, f, 0.12, 'triangle', 0.08, 0.95 + i * 0.09));
  },
};
