import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/* El reconocimiento de voz del navegador (Chrome en Android, Safari en iPhone). Solo castellano. */
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Botón de micrófono para dictar en castellano (el significado de una palabra, un aviso de error).
 * Nunca se usa para escribir guaraní: el reconocimiento de voz no conoce la grafía oficial.
 * Si el navegador no lo permite o no hay señal, el botón no aparece.
 */
export function DictateButton({ onText, label = "Dictar" }: { onText: (text: string) => void; label?: string }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    const update = () => setSupported(!!recognitionCtor() && navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      rec.current?.stop();
    };
  }, []);

  if (!supported) return null;

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    setError(null);
    const r = new Ctor();
    r.lang = "es-PY";
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((x) => x[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onText(text);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Hay que permitir el micrófono." : "No se entendió. Probá de nuevo.");
    };
    r.onend = () => setListening(false);
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant={listening ? "secondary" : "outline"}
        size="sm"
        className="h-9"
        onClick={() => (listening ? rec.current?.stop() : start())}
        aria-label={listening ? "Dejar de escuchar" : `${label} en castellano con la voz`}
      >
        {listening ? <Square aria-hidden /> : <Mic aria-hidden />}
        {listening ? "Escuchando…" : label}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
