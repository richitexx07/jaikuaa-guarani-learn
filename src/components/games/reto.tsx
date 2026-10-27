import { useCallback, useEffect, useState } from "react";
import { Copy, MessageCircle, Swords, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  newSeed,
  puntajeTexto,
  RETO_NOMBRE,
  RETO_RUTA,
  retoDeLaUrl,
  retoMensaje,
  retoUrl,
  veredicto,
  type Reto,
  type RetoJuego,
} from "@/lib/reto";

const INK = "#13233F";

/** Primer nombre de la cuenta, para firmar el reto. */
export function useMiNombre(): string {
  const [n, setN] = useState("");
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const full = (u?.user_metadata?.full_name as string | undefined) ?? u?.email?.split("@")[0] ?? "";
      setN(full.trim().split(/\s+/)[0]?.slice(0, 16) ?? "");
    });
  }, []);
  return n;
}

/**
 * La partida actual: si entraste por un reto, usa su semilla (la misma partida que jugó tu amigo);
 * si no, una nueva. `otra()` arranca otra partida y deja el reto atrás.
 */
export function useRetoPartida(juego: RetoJuego) {
  const [reto, setReto] = useState<Reto | null>(() => retoDeLaUrl(juego));
  const [seed, setSeed] = useState<number>(() => reto?.s ?? newSeed());
  const otra = useCallback((): number => {
    const s = newSeed();
    setReto(null);
    setSeed(s);
    if (typeof window !== "undefined" && window.location.search.includes("reto=")) {
      const u = new URL(window.location.href);
      u.searchParams.delete("reto");
      window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
    }
    return s;
  }, []);
  return { reto, seed, otra };
}

/** Aviso arriba del juego cuando entraste por un reto. */
export function RetoBanner({ reto, className = "" }: { reto: Reto | null; className?: string }) {
  if (!reto) return null;
  return (
    <div className={`mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-white p-3 shadow-lg ${className}`} style={{ color: INK }} role="status">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: "#F6C445" }} aria-hidden>
        <Swords className="h-5 w-5" />
      </span>
      <p className="min-w-0 text-sm leading-snug">
        <b>{reto.n}</b> te retó: hizo <b>{puntajeTexto(reto)}</b>. Jugá la misma partida y ganale.
      </p>
    </div>
  );
}

/**
 * Al terminar: si era un reto, quién ganó; siempre, el botón para retar a un amigo con esta misma
 * partida por WhatsApp.
 */
export function RetoFinal({
  juego,
  seed,
  puntaje,
  total,
  reto,
  extra,
  menosEsMejor,
  unidad,
  className = "",
}: {
  juego: RetoJuego;
  seed: number;
  puntaje: number;
  total: number;
  reto: Reto | null;
  extra?: string;
  menosEsMejor?: boolean;
  unidad?: string;
  className?: string;
}) {
  const nombre = useMiNombre();
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.jaikuaa.com";
  const mio: Reto = { j: juego, s: seed, p: puntaje, t: total, n: nombre || "Tu amigo", ...(extra ? { x: extra } : {}), ...(menosEsMejor ? { m: 1 as const } : {}), ...(unidad ? { u: unidad } : {}) };
  const url = retoUrl(origin, mio);
  const mensaje = retoMensaje(mio, url);
  const esReto = !!reto && reto.s === seed;
  const v = esReto ? veredicto(puntaje, reto) : null;

  const contar = esReto
    ? `Jugué tu reto en ${RETO_NOMBRE[juego]} de Jaikuaa: hice ${puntajeTexto(mio)} y vos ${puntajeTexto(reto!)}. ${
        v === "gane" ? "¡Te gané!" : v === "perdi" ? "Me ganaste, ya te voy a alcanzar." : "¡Empatamos!"
      } ${origin}${RETO_RUTA[juego]}`
    : "";

  return (
    <div className={`mx-auto w-full max-w-md space-y-3 rounded-3xl bg-white p-4 text-left shadow-xl ${className}`} style={{ color: INK }}>
      {esReto && (
        <div className="text-center">
          <Trophy className="mx-auto h-8 w-8" style={{ color: v === "perdi" ? "#8A94A6" : "#E0A100" }} aria-hidden />
          <p className="mt-1 font-display text-2xl font-bold">
            {v === "gane" ? `¡Le ganaste a ${reto!.n}!` : v === "perdi" ? `${reto!.n} te ganó` : `Empate con ${reto!.n}`}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#EEF3FB] p-2">
              <p className="text-xs font-semibold opacity-70">Vos</p>
              <p className="font-display text-xl font-bold tabular-nums">{puntajeTexto(mio)}</p>
            </div>
            <div className="rounded-xl bg-[#EEF3FB] p-2">
              <p className="truncate text-xs font-semibold opacity-70">{reto!.n}</p>
              <p className="font-display text-xl font-bold tabular-nums">{puntajeTexto(reto!)}</p>
            </div>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(contar)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1FA855] font-bold text-white"
          >
            <MessageCircle className="h-5 w-5" aria-hidden /> Contale a {reto!.n}
          </a>
        </div>
      )}
      <div>
        <p className="font-display text-lg font-bold">{esReto ? "Retá a otro amigo" : "Retá a un amigo"}</p>
        <p className="text-sm opacity-75">Le llega esta misma partida por WhatsApp. La juega cuando quiera y gana el que hace más.</p>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl font-bold text-white"
            style={{ background: esReto ? INK : "#1FA855" }}
          >
            <Swords className="h-5 w-5" aria-hidden /> Retar por WhatsApp
          </a>
          <button
            type="button"
            aria-label="Copiar el enlace del reto"
            className="grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/15"
            onClick={() => {
              void navigator.clipboard?.writeText(url);
              toast.success("Enlace del reto copiado");
            }}
          >
            <Copy className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
