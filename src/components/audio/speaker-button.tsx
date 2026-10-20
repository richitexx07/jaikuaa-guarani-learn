import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  // Todos los hooks van antes de cualquier return (regla de React).
  const hoverTimer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    setUrl(undefined);
    setFailed(false);
    void getHumanAudioUrl(gn).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
      if (hoverTimer.current !== null) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
    };
  }, [gn]);

  const loading = url === undefined;

  const startHoverPrefetch = () => {
    if (hoverTimer.current !== null) return;
    hoverTimer.current = window.setTimeout(() => {
      void prefetchAudio(gn);
      hoverTimer.current = null;
    }, 200);
  };
  const cancelHoverPrefetch = () => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={playing}
      aria-busy={loading || playing}
      onMouseEnter={startHoverPrefetch}
      onMouseLeave={cancelHoverPrefetch}
      onFocus={() => void prefetchAudio(gn)}
      onTouchStart={() => void prefetchAudio(gn)}
      onClick={async () => {
        setPlaying(true);
        const ok = await playGuarani(gn);
        setPlaying(false);
        setFailed(!ok);
        if (!ok) setUrl(null);
        else void getHumanAudioUrl(gn).then(setUrl);
      }}
      aria-label={`${failed || url === null ? "Reintentar audio de" : "Escuchar"} ${gn}`}
      title={failed || url === null ? "No se pudo reproducir. Tocá para reintentar." : "Escuchar grabación humana"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95 disabled:opacity-50",
        dims,
        className,
      )}
    >
      {playing || loading ? <Loader2 className={cn(icon, "motion-safe:animate-spin")} /> : failed || url === null ? <VolumeX className={icon} /> : <Volume2 className={icon} />}
    </Button>
  );
}

