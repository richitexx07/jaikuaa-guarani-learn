/**
 * Audio más fuerte y parejo: algunas grabaciones quedaron bajas (micrófono lejos, voz suave).
 * Antes de reproducirlas, se calcula qué tan fuerte suena la voz y se la sube hasta un nivel
 * común, con un «limitador» suave para que los picos no se rompan.
 *
 * El resultado se reproduce con el reproductor normal del celular (no con Web Audio), así sigue
 * sonando aunque el iPhone esté en silencio y no necesita permisos extra.
 */

/** Nivel de voz al que se lleva cada grabación (≈ −15 dBFS RMS). */
export const TARGET_RMS = 0.18;
/** Nunca se sube más de 6 veces (para no amplificar ruido de fondo). */
export const MAX_GAIN = 6;
/** Si ya suena casi bien, se deja igual. */
export const MIN_USEFUL_GAIN = 1.15;
/** Debajo de esto se considera silencio y no cuenta para medir la voz. */
const SILENCE = 0.01;
const KNEE = 0.7;

/** Qué tan fuerte suena la voz (ignora los silencios). */
export function voiceRms(x: Float32Array): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i]!;
    if (Math.abs(v) > SILENCE) {
      sum += v * v;
      n++;
    }
  }
  return n ? Math.sqrt(sum / n) : 0;
}

export function gainFor(x: Float32Array): number {
  const rms = voiceRms(x);
  if (rms <= 0) return 1;
  return Math.max(1, Math.min(MAX_GAIN, TARGET_RMS / rms));
}

/** Limitador suave: hasta 0,7 no toca nada; arriba, redondea para no pasar nunca de 1. */
export function softLimit(v: number): number {
  const a = Math.abs(v);
  if (a <= KNEE) return v;
  const over = (a - KNEE) / (1 - KNEE);
  return Math.sign(v) * (KNEE + (1 - KNEE) * Math.tanh(over));
}

export function amplify(x: Float32Array, gain: number): Float32Array {
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = softLimit(x[i]! * gain);
  return out;
}

/** WAV mono de 16 bits (lo reproduce cualquier celular). */
export function encodeWav(x: Float32Array, sampleRate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + x.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF");
  v.setUint32(4, 36 + x.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, x.length * 2, true);
  for (let i = 0; i < x.length; i++) {
    const s = Math.max(-1, Math.min(1, x[i]!));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

type Decoded = { data: Float32Array; sampleRate: number };

async function decode(bytes: ArrayBuffer): Promise<Decoded | null> {
  const W = window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext };
  const Ctx = W.OfflineAudioContext ?? W.webkitOfflineAudioContext;
  if (!Ctx) return null;
  // 22 050 Hz alcanza de sobra para la voz y deja el archivo liviano.
  const ctx = new Ctx(1, 1, 22050);
  const buf: AudioBuffer = await new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(bytes, resolve, reject) as Promise<AudioBuffer> | undefined;
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
  const len = buf.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i]! += d[i]! / buf.numberOfChannels;
  }
  return { data: mono, sampleRate: buf.sampleRate };
}

/**
 * Devuelve la grabación subida de volumen. Si no hace falta, o el celular no puede procesarla,
 * devuelve la original: nunca deja una palabra sin sonar.
 */
export async function louderBlob(blob: Blob): Promise<Blob> {
  try {
    if (typeof window === "undefined" || blob.size > 3_000_000) return blob;
    const d = await decode(await blob.arrayBuffer());
    if (!d || d.data.length === 0) return blob;
    const g = gainFor(d.data);
    if (g < MIN_USEFUL_GAIN) return blob;
    return new Blob([encodeWav(amplify(d.data, g), d.sampleRate)], { type: "audio/wav" });
  } catch {
    return blob;
  }
}
