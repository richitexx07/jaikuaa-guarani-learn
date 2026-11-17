import { useEffect, useRef, useState } from "react";
import { pedirTurno, sonarUnico } from "@/lib/voz-unica";
import { Loader2, Mic, Play, Repeat, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getHumanAudioUrl } from "@/lib/audio";
import { aBarras, detectorDeFin, picos, recortarSilencio, segundos, type EstadoEscucha } from "@/lib/voz";

const MAX_SEGUNDOS = 6;
const BARRAS = 40;

type Onda = { barras: number[]; dur: number };

async function ondaDe(blob: Blob): Promise<Onda | null> {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    void ctx.close();
    const alturas = recortarSilencio(picos(buf.getChannelData(0), 160));
    return { barras: aBarras(alturas, BARRAS), dur: buf.duration };
  } catch {
    return null;
  }
}

function play(src: string): Promise<boolean> {
  // Por el mismo canal que las demás voces: nunca se enciman. `false` si el teléfono no dejó reproducir.
  return sonarUnico(src, pedirTurno());
}

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ------------- «Empezar»: solo con tu voz (micrófono y sonido compartidos entre palabras) ------------- */

let microCompartido: MediaStream | null = null;
let ctxCompartido: AudioContext | null = null;

function contexto(): AudioContext {
  if (!ctxCompartido || ctxCompartido.state === "closed") {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctxCompartido = new Ctx();
  }
  return ctxCompartido;
}

/** Abre el micrófono una sola vez para toda la práctica (no vuelve a pedir permiso en cada palabra). */
async function abrirMicro(): Promise<MediaStream> {
  if (microCompartido?.getTracks().some((t) => t.readyState === "live")) return microCompartido;
  microCompartido = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  return microCompartido;
}

/** Apaga el micrófono (al parar, al salir de la pantalla o al esconder la app). */
export function cerrarMicro(): void {
  microCompartido?.getTracks().forEach((t) => t.stop());
  microCompartido = null;
  void ctxCompartido?.close().catch(() => undefined);
  ctxCompartido = null;
}

/** Un «bip» cortito para avisar que ahora habla la persona (un tono, no una voz). */
async function pitido(): Promise<void> {
  try {
    const ctx = contexto();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.frequency.value = 880;
    vol.gain.setValueAtTime(0.15, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(vol).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    /* sin bip igual se puede seguir */
  }
  await espera(220);
}

/** Graba hasta que la persona termina de hablar. `null` si no habló (o si se canceló). */
function grabarHastaSilencio(stream: MediaStream, alCambiar: (e: EstadoEscucha) => void): { listo: Promise<Blob | null>; cancelar: () => void } {
  const rec = new MediaRecorder(stream);
  const partes: BlobPart[] = [];
  let resultado: "fin" | "sin-voz" | "cancelado" = "fin";
  let timer = 0;
  let fuente: MediaStreamAudioSourceNode | null = null;
  const listo = new Promise<Blob | null>((resolve) => {
    rec.ondataavailable = (e) => {
      if (e.data.size) partes.push(e.data);
    };
    rec.onstop = () => {
      window.clearInterval(timer);
      fuente?.disconnect();
      resolve(resultado === "fin" ? new Blob(partes, { type: rec.mimeType || "audio/webm" }) : null);
    };
  });
  const terminar = (r: typeof resultado) => {
    resultado = r;
    if (rec.state === "recording") rec.stop();
  };
  rec.start();
  const t0 = performance.now();
  let medidor: AnalyserNode | null = null;
  try {
    const ctx = contexto();
    if (ctx.state === "running") {
      fuente = ctx.createMediaStreamSource(stream);
      medidor = ctx.createAnalyser();
      medidor.fftSize = 1024;
      fuente.connect(medidor);
    }
  } catch {
    medidor = null;
  }
  if (!medidor) {
    // El teléfono no deja medir el volumen: se graba un rato fijo.
    timer = window.setTimeout(() => terminar("fin"), 3500);
    return { listo, cancelar: () => terminar("cancelado") };
  }
  const datos = new Float32Array(medidor.fftSize);
  const det = detectorDeFin({ umbral: 0.025 });
  timer = window.setInterval(() => {
    medidor!.getFloatTimeDomainData(datos);
    let suma = 0;
    for (let i = 0; i < datos.length; i++) suma += datos[i]! * datos[i]!;
    const e = det.medir(Math.sqrt(suma / datos.length), performance.now() - t0);
    alCambiar(e);
    if (e === "fin" || e === "sin-voz") terminar(e);
  }, 50);
  return { listo, cancelar: () => terminar("cancelado") };
}

type Fase = "escucha" | "vos" | "teEscucho" | "sinvoz" | "compara" | "siguiente" | "toca";

function Barras({ onda, color, etiqueta }: { onda: Onda | null; color: string; etiqueta: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold">{etiqueta}</span>
        {onda && <span>{segundos(onda.dur)}</span>}
      </div>
      <div className="mt-1 flex h-16 items-center gap-[3px] rounded-lg bg-muted/50 px-2" aria-hidden>
        {onda && onda.barras.length > 0 ? (
          onda.barras.map((h, i) => (
            <span key={i} className={`flex-1 rounded-full ${color}`} style={{ height: `${Math.max(6, h * 100)}%` }} />
          ))
        ) : (
          <span className="w-full text-center text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

/**
 * Escuchá la voz de un hablante, grabate diciendo lo mismo y compará las dos, de oído y con la forma de la voz.
 * Tu grabación queda solo en este teléfono: no se sube a ningún lado. No hay nota automática.
 */
export function GrabateCompara({
  gn,
  es,
  manosLibres = false,
  onManosLibres,
  onSiguiente,
}: {
  gn: string;
  es: string;
  /** «Empezar»: la práctica sigue sola, palabra tras palabra; la persona solo habla. */
  manosLibres?: boolean;
  onManosLibres?: (v: boolean) => void;
  onSiguiente?: () => void;
}) {
  const [humanUrl, setHumanUrl] = useState<string | null | undefined>(undefined);
  const [humana, setHumana] = useState<Onda | null>(null);
  const [mia, setMia] = useState<{ url: string; onda: Onda | null } | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [seg, setSeg] = useState(0);
  const [sonando, setSonando] = useState<"humana" | "mia" | "ambas" | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [fase, setFase] = useState<Fase | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const manosRef = useRef(manosLibres);
  manosRef.current = manosLibres;
  const vivoRef = useRef(true);
  const cicloHecho = useRef(false);
  const cancelarRef = useRef<(() => void) | null>(null);

  // Al cambiar de palabra: buscar la voz grabada y dibujar su forma.
  useEffect(() => {
    let vivo = true;
    setHumanUrl(undefined);
    setHumana(null);
    setMia((m) => {
      if (m) URL.revokeObjectURL(m.url);
      return null;
    });
    void getHumanAudioUrl(gn).then(async (url) => {
      if (!vivo) return;
      setHumanUrl(url);
      if (!url) return;
      try {
        const r = await fetch(url, { mode: "cors", credentials: "omit" });
        const onda = r.ok ? await ondaDe(await r.blob()) : null;
        if (vivo) setHumana(onda);
      } catch {
        /* sin forma: igual se puede escuchar */
      }
    });
    return () => {
      vivo = false;
    };
  }, [gn]);

  useEffect(() => {
    vivoRef.current = true;
    return () => {
      vivoRef.current = false;
      cancelarRef.current?.();
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /** Una vuelta: suena el hablante, bip, la persona habla, se corta sola, suenan las dos y pasa a la siguiente. */
  async function ciclo(url: string, intento = 0) {
    const sigue = () => vivoRef.current && manosRef.current;
    setFase("escucha");
    const ok = await play(url);
    if (!sigue()) return;
    if (!ok) return setFase("toca");
    let stream: MediaStream;
    try {
      stream = await abrirMicro();
    } catch {
      toast.error("No se pudo usar el micrófono. Revisá los permisos del navegador.");
      return onManosLibres?.(false);
    }
    if (!sigue()) return;
    setFase("vos");
    await pitido();
    if (!sigue()) return;
    const g = grabarHastaSilencio(stream, (e) => {
      if (e === "hablando") setFase("teEscucho");
    });
    cancelarRef.current = g.cancelar;
    const blob = await g.listo;
    cancelarRef.current = null;
    if (!sigue()) return;
    if (!blob) {
      if (intento === 0) {
        setFase("sinvoz");
        await espera(900);
        if (sigue()) await ciclo(url, 1);
        return;
      }
      setAviso("Se pausó porque no te escuché. Tocá «Empezar» para seguir.");
      return onManosLibres?.(false);
    }
    const miaUrl = URL.createObjectURL(blob);
    setMia((m) => {
      if (m) URL.revokeObjectURL(m.url);
      return { url: miaUrl, onda: null };
    });
    void ondaDe(blob).then((onda) => setMia((m) => (m && m.url === miaUrl ? { url: miaUrl, onda } : m)));
    setFase("compara");
    await play(url);
    if (!sigue()) return;
    await espera(300);
    await play(miaUrl);
    if (!sigue()) return;
    setFase("siguiente");
    await espera(900);
    if (sigue()) onSiguiente?.();
  }

  useEffect(() => {
    if (!manosLibres) {
      cancelarRef.current?.();
      cicloHecho.current = false;
      setFase(null);
      return;
    }
    if (humanUrl === undefined || cicloHecho.current) return;
    cicloHecho.current = true;
    // Sin grabación del hablante: se pasa sola a otra palabra.
    if (humanUrl === null) void espera(600).then(() => manosRef.current && vivoRef.current && onSiguiente?.());
    else void ciclo(humanUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manosLibres, humanUrl]);

  async function empezar() {
    setAviso(null);
    try {
      // Dentro del toque: así el teléfono deja usar el micrófono y el sonido durante toda la práctica.
      void contexto().resume().catch(() => undefined);
      await abrirMicro();
    } catch {
      toast.error("No se pudo usar el micrófono. Revisá los permisos del navegador.");
      return;
    }
    onManosLibres?.(true);
  }

  const TEXTO_FASE: Record<Fase, string> = {
    escucha: "Escuchá…",
    vos: `Ahora vos: decí «${gn}»`,
    teEscucho: "Te escucho…",
    sinvoz: "No te escuché. Otra vez…",
    compara: "Compará: primero el hablante, después vos",
    siguiente: "Sigue otra palabra…",
    toca: "El teléfono pidió un toque para seguir.",
  };

  async function grabar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      const partes: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && partes.push(e.data);
      rec.onstop = async () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        stream.getTracks().forEach((t) => t.stop());
        setGrabando(false);
        const blob = new Blob(partes, { type: rec.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMia((m) => {
          if (m) URL.revokeObjectURL(m.url);
          return { url, onda: null };
        });
        const onda = await ondaDe(blob);
        setMia((m) => (m && m.url === url ? { url, onda } : m));
      };
      recRef.current = rec;
      setSeg(0);
      rec.start();
      setGrabando(true);
      timerRef.current = window.setInterval(() => {
        setSeg((s) => {
          if (s + 1 >= MAX_SEGUNDOS && rec.state === "recording") rec.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("No se pudo usar el micrófono. Revisá los permisos del navegador.");
    }
  }

  function parar() {
    if (recRef.current?.state === "recording") recRef.current.stop();
  }

  async function escuchar(cual: "humana" | "mia" | "ambas") {
    setSonando(cual);
    if (cual !== "mia" && humanUrl) await play(humanUrl);
    if (cual === "ambas") await new Promise((r) => setTimeout(r, 350));
    if (cual !== "humana" && mia) await play(mia.url);
    setSonando(null);
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-elegant">
      <p className="text-center text-sm text-muted-foreground">{es}</p>
      <p className="mt-1 text-center font-display text-4xl font-bold text-foreground" lang="gn">
        {gn}
      </p>

      {humanUrl === null && (
        <p className="mt-4 text-center text-sm text-muted-foreground">Esta palabra todavía no tiene grabación.</p>
      )}

      <div className="mt-5 space-y-3">
        <Barras onda={humana} color="bg-primary" etiqueta="Hablante paraguayo" />
        <Barras onda={mia?.onda ?? null} color="bg-accent" etiqueta="Tu voz" />
      </div>

      {onManosLibres && (
        <div className="mt-5">
          {manosLibres ? (
            <Button variant="outline" className="h-14 w-full text-base" onClick={() => onManosLibres(false)}>
              <Square className="h-4 w-4" /> Parar
            </Button>
          ) : (
            <Button variant="cta" className="h-14 w-full text-base" onClick={() => void empezar()} disabled={!humanUrl || !!sonando || grabando}>
              <Mic className="h-5 w-5" /> Empezar: solo con tu voz
            </Button>
          )}
          {manosLibres && fase && (
            <div aria-live="polite" className="mt-3 text-center">
              <p className={`text-base font-semibold ${fase === "teEscucho" ? "text-accent" : "text-foreground"}`}>{TEXTO_FASE[fase]}</p>
              {fase === "toca" && humanUrl && (
                <Button variant="cta" className="mt-2 h-11" onClick={() => void ciclo(humanUrl)}>
                  <Volume2 className="h-4 w-4" /> Seguir
                </Button>
              )}
            </div>
          )}
          {!manosLibres && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {aviso ?? "Tocás una vez y después solo hablás: escuchás la palabra, la repetís, se corta sola, suenan las dos voces y pasa a la siguiente."}
            </p>
          )}
        </div>
      )}

      {!manosLibres && (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-12" onClick={() => void escuchar("humana")} disabled={!humanUrl || !!sonando || grabando}>
          {sonando === "humana" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />} 1. Escuchá
        </Button>
        {grabando ? (
          <Button variant="destructive" className="h-12" onClick={parar}>
            <Square className="h-4 w-4" /> Listo ({seg}s)
          </Button>
        ) : (
          <Button variant="cta" className="h-12" onClick={grabar} disabled={!humanUrl || !!sonando}>
            <Mic className="h-4 w-4" /> {mia ? "2. Grabate otra vez" : "2. Grabate"}
          </Button>
        )}
        <Button variant="outline" className="h-12" onClick={() => void escuchar("mia")} disabled={!mia || !!sonando || grabando}>
          {sonando === "mia" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} 3. Tu voz
        </Button>
        <Button variant="outline" className="h-12" onClick={() => void escuchar("ambas")} disabled={!mia || !humanUrl || !!sonando || grabando}>
          {sonando === "ambas" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />} 4. Las dos
        </Button>
      </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Compará de oído: el ritmo, dónde cae la fuerza y los sonidos nasales. Tu grabación queda solo en este teléfono; no
        se sube a ningún lado.
      </p>
    </div>
  );
}
