import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getHumanAudioUrl, prefetchAudio, playGuarani } from "@/lib/audio";
import { cn } from "@/lib/utils";


type Props = {
  gn: string;
  size?: "sm" | "md";
  className?: string;
};

export function SpeakerButton({ gn, size = "sm", className }: Props) {
  const dims = size === "md" ? "h-9 w-9" : "h-8 w-8";
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";

  const [url, setUrl] = useState<string | null | undefined>(undefined);
  // Todos los hooks van antes de cualquier return (regla de React).
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // El enlace se pide en tanda con las demás palabras de la pantalla.
  useEffect(() => {
    let alive = true;
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
  const hasAudio = Boolean(url);

  if (!hasAudio && !loading) {
    return (
      <button
        type="button"
        disabled
        aria-label={`Audio humano próximamente para ${gn}`}
        title="Audio humano próximamente"
        className={cn(
          "inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-muted text-muted-foreground opacity-60",
          dims,
          className,
        )}
      >
        <VolumeX className={icon} />
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={loading}
      onFocus={() => void prefetchAudio(gn)}
      onTouchStart={() => void prefetchAudio(gn)}
      onClick={() => {
        if (!url) return;
        void playGuarani(gn);
      }}
      aria-label={`Escuchar ${gn}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95 disabled:opacity-50",
        dims,
        className,
      )}
    >
      <Volume2 className={icon} />
    </button>
  );
}

