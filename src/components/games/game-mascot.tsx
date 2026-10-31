import jaiPiensa from "@/assets/jai/jai-piensa.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiFesteja from "@/assets/jai/jai-trofeo.webp";
import jaiAnimo from "@/assets/jai/jai-animo.webp";

export type MascotMood = "idle" | "success" | "error" | "victory";

/** Jai cambia según la jugada: piensa con vos, aplaude cuando acertás, te da ánimo si errás y festeja al ganar. */
const JAI_POR_ANIMO: Record<MascotMood, string> = {
  idle: jaiPiensa,
  success: jaiAplaude,
  victory: jaiFesteja,
  error: jaiAnimo,
};

export function GameMascot({ message, mood = "idle" }: { message: string; mood?: MascotMood }) {
  return (
    <div className={`game-mascot game-mascot-${mood} flex items-center gap-3 py-2`} data-mood={mood}>
      <img
        key={mood}
        src={JAI_POR_ANIMO[mood]}
        alt="Jai, el jaguarete"
        className="penalties-mascot h-20 w-20 shrink-0 object-contain"
        loading="lazy"
      />
      <p className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
