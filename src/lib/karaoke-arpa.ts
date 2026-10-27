/**
 * El arpa del karaoke como una pista de audio de verdad.
 *
 * Antes el arpa sonaba con «osciladores» de Web Audio: en el iPhone con el botón de silencio
 * activado no se escuchaba nada, y en muchos celulares sonaba muy bajo. Ahora la canción entera
 * se «graba» en el celular antes de empezar (tarda una fracción de segundo) y se reproduce con el
 * reproductor normal, como cualquier audio: suena aunque el iPhone esté en silencio, más fuerte, y
 * el juego sigue el reloj de esa pista, así la letra y el arpa van siempre juntas.
 */
import { encodeWav, softLimit } from "@/lib/audio-louder";

export type Pluck = { f: number; t: number; vol: number };

/** Las notas de cada pulso (las mismas que tocaba el arpa en vivo). */
export function plucksFor(chords: readonly (readonly number[])[], beats: number, beatSec: number): Pluck[] {
  const out: Pluck[] = [];
  if (!chords.length) return out;
  for (let b = 0; b < beats; b++) {
    const chord = chords[Math.floor(b / 2) % chords.length]!;
    const t0 = b * beatSec;
    chord.forEach((f, i) => out.push({ f, t: t0 + i * beatSec * 0.16, vol: 0.07 }));
    if (chord[0]) out.push({ f: chord[0] / 2, t: t0, vol: 0.09 });
    if (chord[2]) out.push({ f: chord[2] * 2, t: t0 + beatSec * 0.5, vol: 0.035 });
  }
  return out;
}

/** Cuánto dura la pista: todos los pulsos más la última cuerda apagándose. */
export function duracionPista(beats: number, beatSec: number): number {
  return beats * beatSec + 1.5;
}

/** Sube el volumen hasta un nivel fuerte y parejo, sin que los picos se rompan. */
export function masFuerte(x: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]!));
  if (peak <= 0) return x;
  const gain = Math.min(20, 1.4 / peak);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = softLimit(x[i]! * gain);
  return out;
}

const SR = 22050;

/** Arma la pista del arpa como un WAV. Si el celular no puede, devuelve null y se usa el arpa en vivo. */
export async function renderArpa(chords: readonly (readonly number[])[], beats: number, beatSec: number): Promise<Blob | null> {
  try {
    if (typeof window === "undefined") return null;
    const W = window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext };
    const Ctx = W.OfflineAudioContext ?? W.webkitOfflineAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx(1, Math.ceil(duracionPista(beats, beatSec) * SR), SR);
    for (const p of plucksFor(chords, beats, beatSec)) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = p.f;
      g.gain.setValueAtTime(0.0001, p.t);
      g.gain.exponentialRampToValueAtTime(p.vol, p.t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, p.t + 1.1);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(p.t);
      o.stop(p.t + 1.2);
    }
    const buf: AudioBuffer = await new Promise((resolve, reject) => {
      ctx.oncomplete = (e) => resolve(e.renderedBuffer);
      const r = ctx.startRendering() as Promise<AudioBuffer> | undefined;
      if (r && typeof r.then === "function") r.then(resolve, reject);
    });
    return new Blob([encodeWav(masFuerte(buf.getChannelData(0)), buf.sampleRate)], { type: "audio/wav" });
  } catch {
    return null;
  }
}

/**
 * En el iPhone (iOS 17 o más nuevo) le dice al celular cómo usar el audio: «playback» = suena por
 * el parlante aunque esté en silencio; «play-and-record» = mientras se graba la voz.
 */
export function sesionDeAudio(tipo: "playback" | "play-and-record" | "auto"): void {
  try {
    const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (s && "type" in s) s.type = tipo;
  } catch {
    /* celulares sin este control: no pasa nada */
  }
}
