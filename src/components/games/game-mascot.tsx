import jaiTradicional from "@/assets/jai-tradicional.png";
import jaiGamer from "@/assets/jai-gamer.webp";
import jaiProfe from "@/assets/jai-profe.webp";

export type MascotMood = "idle" | "success" | "error" | "victory";

/** Jai cambia según la jugada: tranquilo al empezar, festeja cuando acertás y explica cuando te equivocás. */
const JAI_POR_ANIMO: Record<MascotMood, string> = {
  idle: jaiTradicional,
  success: jaiGamer,
  victory: jaiGamer,
  error: jaiProfe,
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
