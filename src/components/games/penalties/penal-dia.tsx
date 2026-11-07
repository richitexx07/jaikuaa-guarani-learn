/**
 * «El penal del día» en pantalla: la tarjeta de arriba de Penales (jugar o ver el resultado de hoy)
 * y el final con la fila para compartir por WhatsApp, como Wordle.
 */
import { useEffect, useState } from "react";
import { CalendarDays, Copy, Share2 } from "lucide-react";
import { hoyPy } from "@/lib/meta-diaria";
import { usePM } from "@/lib/i18n-penales-modos";
import type { Outcome } from "./physics";
import {
  fechaCorta,
  golesDe,
  guardarResultadoDia,
  iconoPenal,
  leerResultadoDia,
  msHastaManana,
  textoCompartirDia,
  type ResultadoDia,
} from "@/lib/penal-dia";

const C = { noche: "#071A33", led: "#FFB23E", gol: "#3BE38A" };
export const URL_DIA = "https://www.jaikuaa.com/juegos/penales?dia=1&de=penal-dia";

/** El resultado de hoy, si ya se jugó (se actualiza cuando termina la tanda). */
export function useResultadoDia(): [ResultadoDia | null, (r: ResultadoDia) => void] {
  const [r, setR] = useState<ResultadoDia | null>(null);
  useEffect(() => setR(leerResultadoDia()), []);
  return [r, (nuevo) => { guardarResultadoDia(nuevo); setR(nuevo); }];
}

function useFaltan(): string {
  const pm = usePM();
  const [ms, setMs] = useState(() => msHastaManana());
  useEffect(() => {
    const t = window.setInterval(() => setMs(msHastaManana()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  return pm("diaVuelve", { h, m });
}

/** La fila de íconos del día (⚽ 🎯 🧤 ❌). */
export function FilaDia({ outcomes, className = "" }: { outcomes: readonly Outcome[]; className?: string }) {
  return (
    <p className={`tracking-[0.2em] ${className}`} aria-hidden>
      {outcomes.map(iconoPenal).join("")}
    </p>
  );
}

/** Botones para compartir el resultado (WhatsApp, el menú del celular y copiar). */
export function CompartirTexto({ texto }: { texto: string }) {
  const pm = usePM();
  const [copiado, setCopiado] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  const nativo = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 items-center gap-2 rounded-2xl px-5 font-bold text-white shadow-lg"
        style={{ background: "#1FAF54" }}
      >
        <Share2 className="h-5 w-5" aria-hidden /> WhatsApp
      </a>
      {nativo && (
        <button
          type="button"
          onClick={() => { navigator.share?.({ text: texto }).catch(() => undefined); }}
          className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 font-bold ring-1 ring-white/30"
        >
          <Share2 className="h-5 w-5" aria-hidden /> {pm("compartir")}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(texto).then(() => { setCopiado(true); window.setTimeout(() => setCopiado(false), 1800); }).catch(() => undefined);
        }}
        className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 font-bold ring-1 ring-white/30"
      >
        <Copy className="h-5 w-5" aria-hidden /> {copiado ? pm("copiado") : pm("copiar")}
      </button>
    </div>
  );
}

/** La tarjeta de arriba: invita a patear el de hoy o muestra lo que hiciste y cuánto falta para el próximo. */
export function TarjetaPenalDia({ resultado, onJugar }: { resultado: ResultadoDia | null; onJugar: () => void }) {
  const pm = usePM();
  const faltan = useFaltan();
  const fecha = hoyPy();
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-4 text-white shadow-xl ring-2"
      style={{ background: "linear-gradient(135deg, #0E3B73 0%, #0A2A52 55%, #0B4A2E 100%)", ["--tw-ring-color" as string]: C.led }}
      aria-labelledby="penal-dia-titulo"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: C.led, color: C.noche }}>
            <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {fechaCorta(fecha)}
          </p>
          <h2 id="penal-dia-titulo" className="mt-2 font-display text-2xl font-bold leading-tight">{pm("diaTitulo")}</h2>
          <p className="mt-1 text-sm text-white/80">{pm("diaBajada")}</p>
        </div>
        <span className="text-5xl" aria-hidden>⚽</span>
      </div>
      {resultado ? (
        <div className="mt-3 rounded-2xl bg-black/25 p-3 text-center">
          <p className="text-sm font-semibold text-white/80">{pm("diaHecho")}</p>
          <FilaDia outcomes={resultado.outcomes} className="mt-1 text-3xl" />
          <p className="font-display text-xl font-bold" style={{ color: C.gol }}>{pm("deCinco", { n: golesDe(resultado.outcomes) })}</p>
          <p className="mt-1 text-xs text-white/70">{faltan}</p>
          <div className="mt-3">
            <CompartirTexto texto={textoCompartirDia(resultado, URL_DIA, { titulo: pm("diaTitulo"), deCinco: pm("deCinco", { n: "{n}" }), reto: pm("diaReto") })} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onJugar}
          className="mt-3 h-14 w-full rounded-2xl tap-3d-dark font-display text-xl font-bold shadow-lg transition active:scale-[.98]"
          style={{ background: C.led, color: C.noche }}
        >
          {pm("diaJugar")}
        </button>
      )}
    </section>
  );
}

/** El final del penal del día: guarda el resultado y muestra la fila para compartir. */
export function FinalDia({ outcomes, onGuardar, onModes }: { outcomes: Outcome[]; onGuardar: (r: ResultadoDia) => void; onModes: () => void }) {
  const pm = usePM();
  const faltan = useFaltan();
  const r: ResultadoDia = { fecha: hoyPy(), outcomes };
  useEffect(() => { onGuardar(r); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold uppercase tracking-wide" style={{ color: C.led }}>{pm("diaTitulo")} · {fechaCorta(r.fecha)}</p>
      <FilaDia outcomes={outcomes} className="text-4xl" />
      <h2 className="font-display text-3xl font-bold">{pm("deCinco", { n: golesDe(outcomes) })}</h2>
      <CompartirTexto texto={textoCompartirDia(r, URL_DIA, { titulo: pm("diaTitulo"), deCinco: pm("deCinco", { n: "{n}" }), reto: pm("diaReto") })} />
      <p className="text-xs text-white/70">{faltan}</p>
      <button type="button" className="h-12 rounded-2xl px-4 font-semibold text-white/80" onClick={onModes}>{pm("volverModos")}</button>
    </div>
  );
}
