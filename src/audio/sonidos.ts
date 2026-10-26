/**
 * Efectos de sonido de 8 bits sintetizados con WebAudio (sin archivos de audio).
 * El navegador solo permite sonar después de una interacción del usuario: el contexto se crea
 * o reanuda en el primer sonido, que siempre ocurre tras un clic o un arrastre.
 */

// ====================================================================================================
//  VOLÚMENES  ←  AQUÍ SE AJUSTA EL VOLUMEN DE CADA SONIDO
//
//  VOLUMEN_GENERAL multiplica todos los sonidos a la vez (1 = normal, 2 = el doble, 0.5 = la mitad).
//  Cada sonido tiene además su propio multiplicador: 1 = como estaba, 2 = el doble de fuerte, etc.
//  Subir un valor de más de ~3 suele distorsionar; si hace falta más fuerza, sube VOLUMEN_GENERAL.
// ====================================================================================================
const VOLUMEN_GENERAL = 1.5;

const VOLUMEN = {
  // ---- Interfaz
  seleccionarHeroe: 1.5,
  jugar: 1.5,
  siguiente: 1.5,

  // ---- Espacio de trabajo
  encajar: 2,
  borrar: 1.5,

  // ---- Ejecución
  ejecutar: 1.2,
  paso: 3,
  pasoHeroe: 3,
  girar: 2.5,
  choque: 1.5,
  agua: 1.5,
  lava: 1.5,
  romper: 1.5,
  colocar: 2.5,
  atacar: 1.5,
  vencer: 2,
  recoger: 2.5,
  fragmento: 1.5,
  duda: 2.5,
  puerta: 1.5,

  // ---- Resultado
  ganar: 1.3,
  perder: 1.3,

  // ---- Batería y contraseña
  sinBateria: 1.5,
  claveMal: 1.8,
  recargar: 1.5,
} as const;

type NombreSonido = keyof typeof VOLUMEN;
// ====================================================================================================

let ctx: AudioContext | null = null;
let salida: AudioNode | null = null;
let ruidoBuffer: AudioBuffer | null = null;
let silencio = false;
/** Multiplicador del sonido que se está generando ahora mismo (se fija en `con`). */
let actual = 1;

export function setSilencio(valor: boolean) {
  silencio = valor;
}
export const estaSilenciado = () => silencio;

function contexto(): AudioContext | null {
  if (silencio) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      // Limitador suave (tanh): si varios sonidos se superponen no distorsionan feo, y a diferencia de un
      // compresor no cambia el volumen de un sonido según lo que sonó antes.
      const curva = new Float32Array(1024);
      for (let i = 0; i < curva.length; i++) curva[i] = Math.tanh(((i / (curva.length - 1)) * 2 - 1) * 1.5) / Math.tanh(1.5);
      const limitador = ctx.createWaveShaper();
      limitador.curve = curva;
      const general = ctx.createGain();
      general.gain.value = VOLUMEN_GENERAL;
      general.connect(limitador).connect(ctx.destination);
      salida = general;
    }
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
  if (!c || !salida) return;
  const ini = c.currentTime + t;
  const osc = c.createOscillator();
  const gan = c.createGain();
  osc.type = onda;
  osc.frequency.setValueAtTime(f0, ini);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), ini + dur);
  // Entrada suave (evita el clic del arranque) y salida que llega a cero antes de detener el oscilador
  // (evita que el sonido se corte de golpe).
  const ataque = Math.min(0.012, dur * 0.2);
  gan.gain.setValueAtTime(0, ini);
  gan.gain.linearRampToValueAtTime(vol * actual, ini + ataque);
  gan.gain.setTargetAtTime(0, ini + ataque, dur / 4);
  osc.connect(gan).connect(salida);
  osc.start(ini);
  osc.stop(ini + dur * 1.6 + 0.05);
}

/** Ráfaga de ruido filtrado (golpes, salpicaduras, roturas). */
function ruido(dur: number, vol: number, filtro: BiquadFilterType, frec: number, t = 0, frecFin?: number) {
  const c = contexto();
  if (!c || !salida) return;
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
  gan.gain.setValueAtTime(vol * actual, ini);
  gan.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
  src.connect(f).connect(gan).connect(salida);
  src.start(ini);
  src.stop(ini + dur + 0.02);
}

/** Notas en Hz (escala de Do). */
const N = { C4: 262, E4: 330, G4: 392, A4: 440, C5: 523, E5: 659, G5: 784, B5: 988, C6: 1047, E6: 1319, G6: 1568, B6: 1976 };

let pie = 0;

/** Envuelve un sonido para aplicarle su volumen de la tabla de arriba. */
const con = (nombre: NombreSonido, fn: () => void) => () => {
  actual = VOLUMEN[nombre];
  fn();
};

export const sonido = {
  // ---- Interfaz
  seleccionarHeroe: con('seleccionarHeroe', () => {
    tono(N.E5, N.E5, 0.07, 'square', 0.06);
    tono(N.A4 * 2, N.A4 * 2, 0.1, 'square', 0.06, 0.07);
  }),
  jugar: con('jugar', () => {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tono(f, f, 0.09, 'square', 0.06, i * 0.07));
  }),
  siguiente: con('siguiente', () => {
    // Barrido ascendente y una campanita al final.
    tono(300, 1100, 0.14, 'triangle', 0.08);
    tono(N.E6, N.E6, 0.14, 'sine', 0.07, 0.13);
    tono(N.B6, N.B6, 0.2, 'sine', 0.06, 0.2);
  }),

  // ---- Espacio de trabajo
  encajar: con('encajar', () => {
    tono(520, 880, 0.11, 'triangle', 0.1);
    tono(1040, 1040, 0.07, 'triangle', 0.05, 0.04);
  }),
  borrar: con('borrar', () => {
    tono(420, 140, 0.14, 'triangle', 0.1);
    ruido(0.08, 0.05, 'lowpass', 1200);
  }),

  // ---- Ejecución
  ejecutar: con('ejecutar', () => [N.C5, N.E5, N.G5].forEach((f, i) => tono(f, f, 0.07, 'square', 0.06, i * 0.06))),
  paso: con('paso', () => {
    pie = 1 - pie;
    tono(pie ? 190 : 160, 120, 0.05, 'triangle', 0.07);
  }),
  pasoHeroe: con('pasoHeroe', () => {
    pie = 1 - pie;
    tono(pie ? 240 : 210, 160, 0.04, 'triangle', 0.04);
  }),
  girar: con('girar', () => tono(480, 620, 0.06, 'sine', 0.06)),
  choque: con('choque', () => {
    ruido(0.16, 0.25, 'lowpass', 900);
    tono(140, 60, 0.18, 'square', 0.08);
  }),
  agua: con('agua', () => {
    ruido(0.35, 0.18, 'bandpass', 1400, 0, 500);
    tono(600, 200, 0.12, 'sine', 0.05);
  }),
  lava: con('lava', () => {
    ruido(0.45, 0.14, 'highpass', 3000);
    ruido(0.3, 0.12, 'lowpass', 300);
  }),
  romper: con('romper', () => [0, 0.07, 0.14].forEach((t, i) => ruido(0.08, 0.22 - i * 0.04, 'bandpass', 700 - i * 150, t))),
  colocar: con('colocar', () => {
    tono(200, 70, 0.14, 'sine', 0.18);
    ruido(0.06, 0.1, 'lowpass', 600);
  }),
  atacar: con('atacar', () => {
    ruido(0.14, 0.12, 'highpass', 1500, 0, 5000);
    tono(300, 90, 0.12, 'square', 0.07, 0.05);
  }),
  vencer: con('vencer', () => [N.G5, N.E5, N.C5].forEach((f, i) => tono(f, f * 0.9, 0.06, 'square', 0.05, i * 0.05))),
  recoger: con('recoger', () => [N.E6, N.G6, N.B6].forEach((f, i) => tono(f, f, 0.06, 'square', 0.05, i * 0.05))),
  fragmento: con('fragmento', () => [N.C6, N.E6, N.G6, N.C6 * 2].forEach((f, i) => tono(f, f, 0.1, 'triangle', 0.09, i * 0.08))),
  duda: con('duda', () => {
    tono(330, 300, 0.09, 'sine', 0.08);
    tono(260, 240, 0.12, 'sine', 0.08, 0.1);
  }),
  puerta: con('puerta', () => {
    tono(N.C5, N.C5, 0.12, 'triangle', 0.09);
    tono(N.G5, N.G5, 0.2, 'triangle', 0.09, 0.1);
  }),

  // ---- Resultado
  ganar: con('ganar', () => {
    [N.C5, N.E5, N.G5].forEach((f, i) => tono(f, f, 0.1, 'square', 0.07, i * 0.1));
    tono(N.C6, N.C6, 0.4, 'square', 0.07, 0.3);
    tono(N.E5, N.E5, 0.4, 'triangle', 0.05, 0.3);
  }),
  perder: con('perder', () => [N.G4, N.E4, N.C4].forEach((f, i) => tono(f, f * 0.97, 0.16, 'triangle', 0.1, i * 0.15))),

  // ---- Batería y contraseña
  sinBateria: con('sinBateria', () => tono(700, 90, 0.9, 'square', 0.05)),
  claveMal: con('claveMal', () => tono(130, 110, 0.25, 'square', 0.07)),
  recargar: con('recargar', () => {
    tono(180, 1400, 0.9, 'square', 0.05);
    [N.C6, N.E6, N.G6].forEach((f, i) => tono(f, f, 0.12, 'triangle', 0.08, 0.95 + i * 0.09));
  }),
};
