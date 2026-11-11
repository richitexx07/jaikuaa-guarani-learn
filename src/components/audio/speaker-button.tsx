import { useEffect, useRef, useState } from "react";
import { Clock, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHumanAudioUrl, prefetchAudio, playGuarani } from "@/lib/audio";
import { openJai } from "@/lib/jai-events";
import { cn } from "@/lib/utils";


type Props = {
  gn: string;
  size?: "sm" | "md";
  className?: string;
  rate?: number;
};

export function SpeakerButton({ gn, size = "sm", className, rate }: Props) {
  // Más grande para el dedo: es el botón más importante de la app (las voces reales).
  const dims = size === "md" ? "h-11 w-11" : "h-10 w-10";
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";

  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  // Todos los hooks van antes de cualquier return (regla de React).
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  // Fallas seguidas de una palabra que SÍ tiene grabación (no cuenta el silencio intencional).
  const failsRef = useRef(0);

  // El enlace se pide en tanda con las demás palabras de la pantalla.
  useEffect(() => {
    let alive = true;
    setUrl(undefined);
    setFailed(false);
    void getHumanAudioUrl(gn).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [gn]);

  // Cuando el botón se ve en pantalla, el audio se baja de antemano para que suene al instante.
  useEffect(() => {
    const el = buttonRef.current;
    if (!url || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      void prefetchAudio(gn);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void prefetchAudio(gn);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [gn, url]);

  const loading = url === undefined;
  const unavailable = failed || url === null;
  // Palabra que todavía no tiene grabación humana (no es una falla): se avisa que viene en camino.
  const pending = url === null && !failed;

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      size="icon"
      disabled={playing}
      aria-busy={loading || playing}
      onFocus={() => void prefetchAudio(gn)}
      onTouchStart={() => void prefetchAudio(gn)}
      onClick={async (e) => {
        const hadRecording = !!url || failed;
        setPlaying(true);
        // Si el usuario toca con Shift, o si viene rate especificado, escucha con velocidad ajustada
        const targetRate = rate ?? (e.shiftKey ? 0.75 : 1);
        const ok = await playGuarani(gn, targetRate !== 1 ? { rate: targetRate } : undefined);
        setPlaying(false);
        setFailed(!ok && hadRecording);
        if (!ok) setUrl(null);
        else void getHumanAudioUrl(gn).then(setUrl);
        failsRef.current = ok ? 0 : hadRecording ? failsRef.current + 1 : 0;
        // Si el audio falla dos veces seguidas, Jai aparece con la solución (volumen, modo silencio…).
        if (failsRef.current === 2) openJai("audio");
      }}
      aria-label={pending ? `${gn}: grabación en camino` : `${unavailable ? "Reintentar audio de" : "Escuchar"} ${gn}`}
      title={
        pending
          ? "Grabación en camino: esta palabra todavía no tiene voz humana grabada."
          : unavailable
            ? "No se pudo reproducir. Tocá para reintentar."
            : "Escuchar grabación humana"
      }
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95 disabled:opacity-50",
        pending && "bg-muted text-muted-foreground hover:bg-muted",
        dims,
        // Sin grabación todavía: se dice con palabras, no con un relojito.
        pending && "w-auto gap-1 px-2.5 text-[11px] font-semibold",
        className,
      )}
    >
      {playing || loading ? (
        <Loader2 className={cn(icon, "motion-safe:animate-spin")} />
      ) : pending ? (
        <>
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Voz pronto
        </>
      ) : unavailable ? (
        <VolumeX className={icon} />
      ) : (
        <Volume2 className={icon} />
      )}
    </Button>
  );
}
