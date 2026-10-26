import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Maximize2, Minimize2 } from "lucide-react";
import { GameKit, GameSoundButton } from "./game-kit";
import { GameHelp } from "./game-help";
import { SponsorLine } from "./sponsor-line";
import type { SponsorSlot } from "@/lib/sponsor-slots";

/**
 * Escenario de pantalla completa para los juegos con identidad visual propia
 * (como el Consultorio de Jai): cada juego pone su fondo y su paleta, y este marco
 * agrega la barra de arriba (volver, ayuda, sonido y pantalla completa para el stand).
 */
export function GameStage({
  title,
  background,
  ink = "#FFFFFF",
  sponsorSlot,
  css,
  children,
  wide = false,
  extra,
  back = { to: "/juegos", label: "← Juegos" },
}: {
  title: string;
  background: string;
  ink?: string;
  sponsorSlot?: SponsorSlot;
  css?: string;
  children: ReactNode;
  wide?: boolean;
  extra?: ReactNode;
  back?: { to: "/juegos" | "/dashboard"; label: string };
}) {
  return (
    <GameKit>
      <div className="game-stage min-h-screen pb-28" style={{ background, color: ink, "--stage-ink": ink } as CSSProperties}>
        <style>{STAGE_CSS + (css ?? "")}</style>
        <header className={`mx-auto flex items-center justify-between gap-2 px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
          <Link to={back.to} className="rounded-md px-2 py-1 text-sm font-medium opacity-80 hover:opacity-100">
            {back.label}
          </Link>
          <div className="game-stage-tools flex items-center gap-2">
            {extra}
            <GameHelp title={title} />
            <GameSoundButton />
            <FullscreenButton />
          </div>
        </header>
        {sponsorSlot && (
          <div className="game-stage-sponsor -mt-2 mb-1">
            <SponsorLine slot={sponsorSlot} />
          </div>
        )}
        <main className={`mx-auto px-4 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</main>
      </div>
    </GameKit>
  );
}

/** Para el stand: pone el juego en pantalla completa, sin la barra del navegador. */
function FullscreenButton() {
  const [on, setOn] = useState(false);
  const [can, setCan] = useState(false);
  useEffect(() => {
    setCan(typeof document !== "undefined" && !!document.documentElement.requestFullscreen);
    const h = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  if (!can) return null;
  return (
    <button
      type="button"
      className="hidden h-10 w-10 items-center justify-center rounded-md border sm:inline-flex"
      title={on ? "Salir de pantalla completa" : "Pantalla completa"}
      aria-label={on ? "Salir de pantalla completa" : "Pantalla completa"}
      onClick={() => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen().catch(() => {});
      }}
    >
      {on ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  );
}

/** Estilos comunes del marco: botones de la barra con el color del juego. */
const STAGE_CSS = `
.game-stage-tools button { background: transparent; color: var(--stage-ink); border-color: color-mix(in srgb, var(--stage-ink) 30%, transparent); }
.game-stage-tools button:hover { background: color-mix(in srgb, var(--stage-ink) 10%, transparent); color: var(--stage-ink); }
.game-stage-sponsor p, .game-stage-sponsor p span { color: color-mix(in srgb, var(--stage-ink) 75%, transparent) !important; }
.game-stage :focus-visible { outline: 3px solid color-mix(in srgb, var(--stage-ink) 85%, transparent); outline-offset: 2px; }
`;
