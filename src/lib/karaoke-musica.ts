/**
 * La música del karaoke, armada en el celular: arpa paraguaya, guitarra y bajo.
 *
 * Antes la pista eran «pitidos» (osciladores). Ahora cada cuerda se simula como una cuerda de verdad
 * (el método Karplus-Strong: un ruidito que rebota y se apaga como una cuerda pulsada), así suena a arpa.
 * Cada ritmo tiene su forma de tocar:
 *  - polca y galopa: el arpa corre en tresillos, el bajo alterna y la guitarra marca el contratiempo;
 *  - guarania: el arpa va más lenta y ligada, con el bajo en el primer tiempo.
 * Todo se calcula con números (sin Web Audio), así funciona igual en cualquier celular, y el resultado
 * se reproduce como un audio común: suena aunque el iPhone esté en silencio.
 */
import { encodeWav, softLimit } from "@/lib/audio-louder";

export const SR_MUSICA = 22050;
export type Ritmo = "polca" | "guarania" | "galopa";

export function ritmoDe(estilo: string): Ritmo {
  if (/guarania/i.test(estilo)) return "guarania";
  if (/galopa/i.test(estilo)) return "galopa";
  return "polca";
}

/** Generador de números al azar con semilla: la misma canción suena siempre igual. */
function azar(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export type Nota = { f: number; t: number; vol: number; dur: number; brillo: number; suave: number };

/** Una cuerda pulsada que se apaga sola (Karplus-Strong), sumada en `out`. */
export function cuerda(out: Float32Array, n: Nota, rnd: () => number, sr = SR_MUSICA): void {
  if (!(n.f > 0)) return;
  const P = Math.max(2, Math.round(sr / n.f));
  const buf = new Float32Array(P);
  for (let i = 0; i < P; i++) buf[i] = rnd() * 2 - 1;
  // Suavizar el «golpe» inicial: menos chasquido, más madera.
  for (let k = 0; k < n.suave; k++) for (let i = 0; i < P; i++) buf[i] = 0.5 * (buf[i]! + buf[(i + 1) % P]!);
  let media = 0;
  for (let i = 0; i < P; i++) media += buf[i]!;
  media /= P;
  for (let i = 0; i < P; i++) buf[i] = buf[i]! - media;
  const inicio = Math.round(n.t * sr);
  const largo = Math.min(Math.round(n.dur * sr), out.length - inicio);
  const ataque = Math.round(0.002 * sr);
  const cola = Math.round(0.08 * sr);
  for (let i = 0; i < largo; i++) {
    const j = i % P;
    const s = buf[j]!;
    buf[j] = n.brillo * 0.5 * (s + buf[(j + 1) % P]!);
    let env = 1;
    if (i < ataque) env = i / ataque;
    else if (i > largo - cola) env = (largo - i) / cola;
    out[inicio + i]! += s * n.vol * env;
  }
}

/** Las notas de toda la canción, según el ritmo. `pulsos` = cantidad de pulsos de la canción. */
export function notasDe(chords: readonly (readonly number[])[], pulsos: number, beatSec: number, ritmo: Ritmo): Nota[] {
  const notas: Nota[] = [];
  if (!chords.length) return notas;
  const arpa = (f: number, t: number, vol: number, dur = 1.8) => notas.push({ f, t, vol, dur, brillo: 0.9965, suave: 2 });
  const bajo = (f: number, t: number, vol = 0.5) => notas.push({ f, t, vol, dur: 1.6, brillo: 0.997, suave: 3 });
  const guitarra = (acorde: readonly number[], t: number, vol: number) =>
    [...acorde].sort((a, b) => a - b).forEach((f, i) => notas.push({ f, t: t + i * 0.012, vol, dur: 0.38, brillo: 0.99, suave: 1 }));
  for (let b = 0; b < pulsos; b++) {
    const ac = chords[Math.floor(b / 2) % chords.length]!;
    const [r, m, q] = [ac[0] ?? 0, ac[1] ?? 0, ac[2] ?? 0];
    const t0 = b * beatSec;
    const primero = b % 2 === 0;
    if (ritmo === "guarania") {
      // Bajo en el 1, arpa en corcheas ligadas, melodía arriba al cambiar de acorde.
      if (primero) bajo(r / 2, t0, 0.55);
      const arp = primero ? [r, q, m * 2] : [q, m * 2, q];
      arp.forEach((f, i) => arpa(f, t0 + (i * beatSec) / arp.length, 0.2, 2.2));
      if (primero) arpa(q * 2, t0 + 0.006, 0.26, 2.4);
      if (!primero) guitarra([r, m, q], t0 + beatSec * 0.5, 0.07);
    } else {
      // Polca y galopa: tresillos del arpa, bajo que alterna fundamental y quinta, guitarra al contratiempo.
      bajo(primero ? r / 2 : q / 2, t0, 0.5);
      const arp = primero ? [r * 2, m * 2, q * 2] : [q * 2, m * 2, r * 2];
      arp.forEach((f, i) => arpa(f, t0 + (i * beatSec) / 3, i === 0 ? 0.24 : 0.17, 1.5));
      if (primero) arpa(q * 4 > 1400 ? q * 2 : q * 4, t0 + 0.005, 0.12, 1.6);
      guitarra([r, m, q], t0 + beatSec * (ritmo === "galopa" ? 0.5 : 2 / 3), ritmo === "galopa" ? 0.08 : 0.065);
    }
  }
  // Cierre: un acorde largo con glisando del arpa.
  const fin = chords[0]!;
  const tf = pulsos * beatSec;
  bajo((fin[0] ?? 0) / 2, tf, 0.5);
  [fin[0], fin[1], fin[2], (fin[0] ?? 0) * 2, (fin[1] ?? 0) * 2, (fin[2] ?? 0) * 2].forEach((f, i) => f && arpa(f, tf + i * 0.05, 0.22, 2.6));
  return notas;
}

/** Cuánto dura la pista: todos los pulsos más el acorde final. */
export function duracionMusica(pulsos: number, beatSec: number): number {
  return pulsos * beatSec + 2.8;
}

/** Calcula la música entera (muestras de −1 a 1). */
export function sintetizar(chords: readonly (readonly number[])[], pulsos: number, beatSec: number, ritmo: Ritmo, sr = SR_MUSICA): Float32Array {
  const out = new Float32Array(Math.ceil(duracionMusica(pulsos, beatSec) * sr));
  const rnd = azar(pulsos * 7919 + Math.round(beatSec * 1000));
  for (const n of notasDe(chords, pulsos, beatSec, ritmo)) cuerda(out, n, rnd, sr);
  // Un poco de «sala»: ecos cortos y suaves, como tocar en un patio.
  const eco = (d: number, g: number) => {
    const s = Math.round(d * sr);
    for (let i = out.length - 1; i >= s; i--) out[i]! += out[i - s]! * g;
  };
  eco(0.071, 0.16);
  eco(0.133, 0.1);
  // Volumen parejo y fuerte, sin romperse; la última parte se apaga despacio.
  let pico = 0;
  for (let i = 0; i < out.length; i++) pico = Math.max(pico, Math.abs(out[i]!));
  const g = pico > 0 ? 1.25 / pico : 1;
  const fo = Math.round(1.2 * sr);
  for (let i = 0; i < out.length; i++) {
    let v = softLimit(out[i]! * g) * 0.92;
    const resta = out.length - i;
    if (resta < fo) v *= resta / fo;
    out[i] = v;
  }
  return out;
}

/** La pista lista para reproducir (WAV) y sus muestras (para mezclar con la voz). Si algo falla, null. */
export async function renderMusica(
  chords: readonly (readonly number[])[],
  pulsos: number,
  beatSec: number,
  ritmo: Ritmo,
): Promise<{ wav: Blob; muestras: Float32Array } | null> {
  try {
    if (typeof window === "undefined") return null;
    // Se deja respirar a la pantalla antes del cálculo (tarda una fracción de segundo).
    await new Promise((r) => setTimeout(r, 30));
    const muestras = sintetizar(chords, pulsos, beatSec, ritmo);
    return { wav: new Blob([encodeWav(muestras, SR_MUSICA)], { type: "audio/wav" }), muestras };
  } catch {
    return null;
  }
}

/** Aplausos del público (ruido con golpecitos), para festejar un verso perfecto o el final. */
export function aplausos(seg = 1.6, sr = SR_MUSICA, semilla = 7): Float32Array {
  const out = new Float32Array(Math.round(seg * sr));
  const rnd = azar(semilla);
  const palmas = Math.round(seg * 95);
  for (let k = 0; k < palmas; k++) {
    const t = Math.round(rnd() * (out.length - sr * 0.05));
    const vol = 0.25 + rnd() * 0.5;
    const largo = Math.round(sr * (0.012 + rnd() * 0.02));
    let y = 0;
    for (let i = 0; i < largo; i++) {
      // Ruido «pasa altos» que se apaga rapidísimo: suena a palmada.
      const r = rnd() * 2 - 1;
      const v = r - y;
      y = r;
      out[t + i]! += v * vol * Math.exp((-i / largo) * 5);
    }
  }
  const fo = Math.round(0.5 * sr);
  let pico = 0;
  for (let i = 0; i < out.length; i++) pico = Math.max(pico, Math.abs(out[i]!));
  for (let i = 0; i < out.length; i++) {
    const resta = out.length - i;
    out[i] = (out[i]! / (pico || 1)) * 0.7 * (resta < fo ? resta / fo : 1) * Math.min(1, i / (0.08 * sr));
  }
  return out;
}

export function aplausosWav(): Blob {
  return new Blob([encodeWav(aplausos(), SR_MUSICA)], { type: "audio/wav" });
}
