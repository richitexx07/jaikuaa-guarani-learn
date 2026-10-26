import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Play, Repeat, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getHumanAudioUrl } from "@/lib/audio";
import { aBarras, picos, recortarSilencio, segundos } from "@/lib/voz";

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

function play(src: string): Promise<void> {
  return new Promise((resolve) => {
    const a = new Audio(src);
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.play().catch(() => resolve());
  });
}

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
export function GrabateCompara({ gn, es }: { gn: string; es: string }) {
  const [humanUrl, setHumanUrl] = useState<string | null | undefined>(undefined);
  const [humana, setHumana] = useState<Onda | null>(null);
  const [mia, setMia] = useState<{ url: string; onda: Onda | null } | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [seg, setSeg] = useState(0);
  const [sonando, setSonando] = useState<"humana" | "mia" | "ambas" | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

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

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

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

      <div className="mt-5 grid grid-cols-2 gap-2">
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

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Compará de oído: el ritmo, dónde cae la fuerza y los sonidos nasales. Tu grabación queda solo en este teléfono; no
        se sube a ningún lado.
      </p>
    </div>
  );
}
