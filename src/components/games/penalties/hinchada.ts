/**
 * Ambiente de cancha para Penales en vivo: murmullo de tribuna, bombo, silbato,
 * «uhhh» de la tribuna y estallido de gol. Todo son ruidos de ambiente armados en el
 * navegador (sin voces ni palabras): nunca reemplaza grabaciones humanas.
 */
import type { Outcome } from "./physics";

type Ctx = AudioContext;

export class Hinchada {
  private ctx: Ctx | null = null;
  private murmullo: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private bombo: number | null = null;
  muted = false;

  private a(): Ctx | null {
    if (this.muted || typeof window === "undefined") return null;
    try {
      const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const C = W.AudioContext ?? W.webkitAudioContext;
      if (!C) return null;
      this.ctx ??= new C();
      void this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  }

  private ruido(a: Ctx, seg: number) {
    const b = a.createBuffer(1, Math.ceil(a.sampleRate * seg), a.sampleRate);
    const ch = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < ch.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; ch[i] = last * 6; }
    return b;
  }

  /** Murmullo de fondo y bombo mientras dura la tanda. */
  empezar() {
    const a = this.a();
    if (!a || this.murmullo) return;
    const src = a.createBufferSource();
    src.buffer = this.ruido(a, 4);
    src.loop = true;
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 0.6;
    const gain = a.createGain(); gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.06, a.currentTime + 1.5);
    src.connect(f).connect(gain).connect(a.destination);
    src.start();
    this.murmullo = { src, gain };
    let n = 0;
    this.bombo = window.setInterval(() => { if (n++ % 4 !== 3) this.golpe(); }, 520);
  }

  private golpe() {
    const a = this.a(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.26);
  }

  /** Sube o baja la tribuna (tensión mientras se patea). */
  tension(alta: boolean) {
    const a = this.ctx; if (!a || !this.murmullo) return;
    this.murmullo.gain.gain.cancelScheduledValues(a.currentTime);
    this.murmullo.gain.gain.setTargetAtTime(alta ? 0.1 : 0.06, a.currentTime, 0.4);
  }

  silbato() {
    const a = this.a(); if (!a) return;
    const t = a.currentTime;
    [0, 0.32].forEach((d, i) => {
      const o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
      o.type = "square"; o.frequency.value = 2900;
      lfo.frequency.value = 38; lg.gain.value = 120; lfo.connect(lg).connect(o.frequency);
      const dur = i === 0 ? 0.18 : 0.5;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.02);
      g.gain.setValueAtTime(0.05, t + d + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d + dur);
      o.connect(g).connect(a.destination);
      o.start(t + d); lfo.start(t + d); o.stop(t + d + dur); lfo.stop(t + d + dur);
    });
  }

  /** Reacción de la tribuna al resultado de un penal. */
  reaccion(o: Outcome) {
    const a = this.a(); if (!a) return;
    const gol = o === "goal" || o === "angle";
    const t = a.currentTime;
    const dur = gol ? (o === "angle" ? 3.2 : 2.4) : 1.4;
    const src = a.createBufferSource(); src.buffer = this.ruido(a, dur);
    const f = a.createBiquadFilter(); f.type = "bandpass";
    f.frequency.setValueAtTime(gol ? 900 : 500, t);
    if (!gol) f.frequency.exponentialRampToValueAtTime(260, t + dur); // «uhhh» que baja
    f.Q.value = gol ? 0.5 : 2.5;
    const g = a.createGain(); const pico = gol ? 0.45 : 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pico, t + (gol ? 0.12 : 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(a.destination); src.start(t);
    if (o === "post") this.palo();
    try { navigator.vibrate?.(gol ? [80, 40, 80, 40, 200] : o === "post" ? [250] : [60]); } catch { /* sin vibración */ }
  }

  private palo() {
    const a = this.a(); if (!a) return;
    const t = a.currentTime;
    [1180, 1770, 2650, 3900].forEach((fr, i) => {
      const o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = fr;
      g.gain.setValueAtTime(0.16 / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + 1.1);
    });
  }

  parar() {
    if (this.bombo) window.clearInterval(this.bombo);
    this.bombo = null;
    try { this.murmullo?.src.stop(); } catch { /* ya parado */ }
    this.murmullo = null;
  }

  dispose() { this.parar(); void this.ctx?.close(); this.ctx = null; }
}

/** Historial del clásico contra cada rival, guardado en este celular. */
export type Clasico = { yo: number; rival: number; empates: number };
const CLAVE = "jaikuaa:penales-clasico";

export function leerClasico(rivalId: string): Clasico {
  try {
    const todo = JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as Record<string, Clasico>;
    return todo[rivalId] ?? { yo: 0, rival: 0, empates: 0 };
  } catch { return { yo: 0, rival: 0, empates: 0 }; }
}

export function sumarClasico(prev: Clasico, misGoles: number, susGoles: number): Clasico {
  if (misGoles > susGoles) return { ...prev, yo: prev.yo + 1 };
  if (misGoles < susGoles) return { ...prev, rival: prev.rival + 1 };
  return { ...prev, empates: prev.empates + 1 };
}

export function guardarClasico(rivalId: string, c: Clasico) {
  try {
    const todo = JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as Record<string, Clasico>;
    todo[rivalId] = c;
    localStorage.setItem(CLAVE, JSON.stringify(todo));
  } catch { /* sin almacenamiento */ }
}

/** Texto de cargada para mandar al grupo. */
export function textoCargada(yo: string, rival: string, mios: number, suyos: number, link: string) {
  const r = mios > suyos ? `Le gané ${mios} a ${suyos} a ${rival}` : mios < suyos ? `${rival} me ganó ${suyos} a ${mios}, pero se viene la revancha` : `Empatamos ${mios} a ${suyos} con ${rival}`;
  return `${r} en los penales en guaraní de Jaikuaa. ¿Te da el cuero para patear conmigo?\n${link}`;
}
