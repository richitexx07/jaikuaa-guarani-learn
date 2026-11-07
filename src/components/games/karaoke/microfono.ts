/**
 * «Cantá con tu voz»: el micrófono durante la canción.
 *
 * - Mide qué tan fuerte suena la voz (para el medidor y para saber si el jugador cantó cada verso).
 * - Graba toda la canción. Al terminar, la voz se mezcla con la música del arpa y queda un audio
 *   para escuchar y compartir. Todo pasa en el celular: no se sube nada a ningún lado.
 */
import { encodeWav, gainFor, softLimit } from "@/lib/audio-louder";
import { sesionDeAudio } from "@/lib/karaoke-arpa";

export type Micro = {
  /** Nivel actual de la voz, de 0 a 1 (aprox.). */
  nivel: () => number;
  empezarGrabacion: () => void;
  terminarGrabacion: () => Promise<Blob | null>;
  /** Segundos de la pista en que empezó a grabar (para alinear la voz con el arpa). */
  desfase: number;
  cerrar: () => void;
  ctx: AudioContext;
};

export async function abrirMicrofono(): Promise<Micro | null> {
  try {
    sesionDeAudio("play-and-record");
    const stream = await navigator.mediaDevices.getUserMedia({
      // Cancelar el eco: el celular resta lo que sale por el parlante (el arpa) y deja la voz.
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctx = W.AudioContext ?? W.webkitAudioContext;
    if (!Ctx) throw new Error("sin audio");
    const ctx = new Ctx();
    void ctx.resume();
    const fuente = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    fuente.connect(an);
    const datos = new Float32Array(an.fftSize);
    let rec: MediaRecorder | null = null;
    const trozos: Blob[] = [];
    const m: Micro = {
      ctx,
      desfase: 0,
      nivel() {
        an.getFloatTimeDomainData(datos);
        let s = 0;
        for (let i = 0; i < datos.length; i++) s += datos[i]! * datos[i]!;
        return Math.sqrt(s / datos.length);
      },
      empezarGrabacion() {
        try {
          rec = new MediaRecorder(stream);
          rec.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
          rec.start();
        } catch {
          rec = null;
        }
      },
      terminarGrabacion() {
        return new Promise((ok) => {
          if (!rec || rec.state === "inactive") return ok(trozos.length ? new Blob(trozos, { type: rec?.mimeType || "audio/webm" }) : null);
          const r = rec;
          r.onstop = () => ok(trozos.length ? new Blob(trozos, { type: r.mimeType || "audio/webm" }) : null);
          try { r.stop(); } catch { ok(null); }
        });
      },
      cerrar() {
        try { if (rec && rec.state !== "inactive") rec.stop(); } catch { /* nada */ }
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close().catch(() => {});
        // El sonido vuelve al parlante (en el iPhone quedaba bajito, por el auricular).
        sesionDeAudio("playback");
      },
    };
    return m;
  } catch {
    sesionDeAudio("playback");
    return null;
  }
}

/**
 * ¿Cantó en este verso? Se compara la voz con el «ruido de fondo» medido en la introducción
 * (ahí suena el arpa sola). Hace falta voz en al menos un tercio de las mediciones del verso.
 */
export function canto(niveles: readonly number[], fondo: number): boolean {
  if (niveles.length < 3) return false;
  const umbral = Math.max(0.018, fondo * 1.8);
  const con = niveles.filter((v) => v > umbral).length;
  return con / niveles.length >= 0.33;
}

/** El ruido de fondo: la mediana de lo medido con el arpa sola. */
export function fondoDe(niveles: readonly number[]): number {
  if (!niveles.length) return 0.01;
  const o = [...niveles].sort((a, b) => a - b);
  return o[Math.floor(o.length / 2)]!;
}

/** Pasa un audio a otra frecuencia de muestreo (lineal, alcanza para voz). */
export function remuestrear(x: Float32Array, de: number, a: number): Float32Array {
  if (de === a) return x;
  const n = Math.floor((x.length * a) / de);
  const out = new Float32Array(n);
  const k = de / a;
  for (let i = 0; i < n; i++) {
    const p = i * k;
    const j = Math.floor(p);
    const f = p - j;
    out[i] = (x[j] ?? 0) * (1 - f) + (x[j + 1] ?? 0) * f;
  }
  return out;
}

/** Mezcla la voz con la música: la voz adelante, el arpa de fondo. */
export function mezclar(musica: Float32Array, voz: Float32Array, desfaseSeg: number, sr: number): Float32Array {
  const out = new Float32Array(Math.max(musica.length, Math.round(desfaseSeg * sr) + voz.length, 1));
  const gv = gainFor(voz) * 0.95;
  for (let i = 0; i < musica.length; i++) out[i] = musica[i]! * 0.5;
  // Desfase negativo = la grabación empezó antes que la música: se recorta ese pedacito del principio.
  const d = Math.round(desfaseSeg * sr);
  const v = d < 0 ? voz.subarray(Math.min(voz.length, -d)) : voz;
  const ini = Math.max(0, d);
  for (let i = 0; i < v.length && ini + i < out.length; i++) out[ini + i]! += v[i]! * gv;
  for (let i = 0; i < out.length; i++) out[i] = softLimit(out[i]!);
  return out;
}

/** De la grabación del micrófono a «mi canción» (WAV con la voz y el arpa). */
export async function miCancion(grabacion: Blob, musica: Float32Array, sr: number, desfaseSeg: number, ctx?: AudioContext): Promise<Blob | null> {
  try {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctx = W.AudioContext ?? W.webkitAudioContext;
    const c = ctx && ctx.state !== "closed" ? ctx : Ctx ? new Ctx() : null;
    if (!c) return null;
    const datos = await grabacion.arrayBuffer();
    // Los Safari viejos solo aceptan la forma con «avisos» (callbacks); los nuevos devuelven una promesa.
    const buf: AudioBuffer = await new Promise((ok, mal) => {
      const r = c.decodeAudioData(datos, ok, mal) as Promise<AudioBuffer> | undefined;
      if (r && typeof r.then === "function") r.then(ok, mal);
    });
    const voz = remuestrear(buf.getChannelData(0), buf.sampleRate, sr);
    if (c !== ctx) void c.close().catch(() => {});
    return new Blob([encodeWav(mezclar(musica, voz, desfaseSeg, sr), sr)], { type: "audio/wav" });
  } catch {
    return null;
  }
}
