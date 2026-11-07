import { useId, useState } from "react";
import { Lock } from "lucide-react";
import { usePM } from "@/lib/i18n-penales-modos";
import { useStats } from "@/lib/gamification";
import { useAppLang } from "@/lib/i18n";
import { usePT } from "@/lib/i18n-penales";
import { ESPECIALES, LISTA_ESPECIALES, disenoDe, rachaMaxima, PAISES, PAISES_MICSUR, bandera, nombrePais, useMiKit, type Kit, type Pais } from "./camisetas";

/** La espalda de la camiseta dibujada (nombre y número), para ver cómo queda antes de patear. */
export function EspaldaCamiseta({ kit, className = "", mini = false }: { kit: Kit; className?: string; mini?: boolean }) {
  const id = useId().replace(/:/g, "");
  const d: { base: string; rayas?: string; banda?: string; vivo?: string; numero: string } = disenoDe(kit);
  const forma = "M40 10 Q60 18 80 10 L106 24 L98 48 L88 44 L88 122 Q60 128 32 122 L32 44 L22 48 L14 24 Z";
  const nombre = kit.nombre.trim().toUpperCase();
  const borde = d.rayas || d.banda ? d.base : "none";
  return (
    <svg viewBox="0 0 120 132" className={className} role={mini ? undefined : "img"} aria-hidden={mini || undefined} aria-label={mini ? undefined : `${nombre || ""} ${kit.numero}`.trim()}>
      <defs>
        <clipPath id={`c${id}`}><path d={forma} /></clipPath>
        <linearGradient id={`l${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="120" height="132" fill={d.base} />
        {d.rayas && Array.from({ length: 8 }, (_, i) => <rect key={i} x={56 - 32 * 2 + i * 16} y="0" width="8" height="132" fill={d.rayas} />)}
        {d.banda && <rect x="-20" y="56" width="160" height="22" fill={d.banda} transform="rotate(42 60 66)" />}
        {!mini && <text x="60" y="44" textAnchor="middle" fontFamily="'Space Grotesk', 'Arial Black', sans-serif" fontWeight="800" fontSize="11" fill={d.numero} stroke={borde} strokeWidth={borde === "none" ? 0 : 2.4} paintOrder="stroke" textLength={nombre.length > 8 ? 50 : undefined} lengthAdjust="spacingAndGlyphs">{nombre}</text>}
        {!mini && <text x="60" y="96" textAnchor="middle" fontFamily="'Space Grotesk', 'Arial Black', sans-serif" fontWeight="800" fontSize="44" fill={d.numero} stroke={borde} strokeWidth={borde === "none" ? 0 : 4} paintOrder="stroke">{kit.numero}</text>}
        <rect width="120" height="132" fill={`url(#l${id})`} />
      </g>
      <path d={forma} fill="none" stroke={d.vivo ?? "rgba(0,0,0,.35)"} strokeWidth={d.vivo ? 4 : 1.5} strokeLinejoin="round" />
    </svg>
  );
}

function BotonPais({ p, elegido, lang, onElegir }: { p: Pais; elegido: boolean; lang: string; onElegir: (p: Pais) => void }) {
  return (
    <button
      type="button"
      aria-pressed={elegido}
      onClick={() => onElegir(p)}
      className="flex min-h-12 items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-semibold transition active:scale-95"
      style={elegido ? { background: "#F4F7FB", color: "#071A33", boxShadow: "0 0 0 3px #FFB23E" } : { background: "rgba(255,255,255,.08)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.14)" }}
    >
      {bandera(p) ? (
        <img src={bandera(p)} alt="" width={40} height={30} loading="lazy" className="h-[30px] w-10 shrink-0 rounded-[5px] object-cover shadow-[0_1px_3px_rgba(0,0,0,.4)] ring-1 ring-black/15" />
      ) : (
        <EspaldaCamiseta mini kit={{ pais: p, figura: "chico", nombre: "", numero: 10 }} className="h-8 w-8 shrink-0" />
      )}
      <span className="min-w-0 leading-tight">{nombrePais(p, lang)}</span>
    </button>
  );
}

/** Elegir camiseta, quién patea, nombre y número. Queda guardado en el celular. */
export function ElegirCamiseta() {
  const { p } = usePT();
  const lang = useAppLang();
  const [kit, guardar] = useMiKit();
  const resto = PAISES.filter((x) => !PAISES_MICSUR.includes(x));
  const [abierto, setAbierto] = useState(false);
  const elegir = (pais: Pais) => { guardar({ pais }); setAbierto(false); };
  const pm = usePM();
  const stats = useStats();
  const racha = rachaMaxima(stats.streak);
  return (
    <section className="space-y-3 rounded-2xl bg-white/[.06] p-3 ring-1 ring-white/15" aria-label={p("kitTitle")}>
      <div className="flex items-start gap-3">
        <EspaldaCamiseta kit={kit} className="h-28 w-28 shrink-0 drop-shadow-[0_6px_10px_rgba(0,0,0,.45)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="font-display text-xl font-bold">{p("kitTitle")}</h2>
          <p className="text-xs text-white/70">{p("kitInfo")}</p>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={p("kitWho")}>
            {(["chico", "chica"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={kit.figura === f}
                onClick={() => guardar({ figura: f })}
                className="h-10 rounded-xl text-sm font-bold"
                style={kit.figura === f ? { background: "#FFB23E", color: "#071A33" } : { background: "rgba(255,255,255,.08)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.14)" }}
              >
                {f === "chico" ? p("kitHe") : p("kitShe")}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <label className="text-xs font-semibold text-white/80">
          {p("kitName")}
          <input
            value={kit.nombre}
            maxLength={12}
            onChange={(e) => guardar({ nombre: e.target.value })}
            className="mt-1 h-11 w-full rounded-xl border border-white/25 bg-white/10 px-3 font-display text-base font-bold uppercase tracking-wide text-white placeholder:text-white/40"
            placeholder="JAIKUAA"
            autoComplete="nickname"
          />
        </label>
        <label className="text-xs font-semibold text-white/80">
          {p("kitNumber")}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={kit.numero}
            onChange={(e) => {
              const n = Math.round(Number(e.target.value));
              if (n >= 1 && n <= 99) guardar({ numero: n });
            }}
            className="mt-1 h-11 w-full rounded-xl border border-white/25 bg-white/10 px-3 text-center font-display text-lg font-bold text-white"
          />
        </label>
      </div>
      <div className="space-y-1.5" role="group" aria-label={pm("rachaKit")}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold text-white/80">🔥 {pm("rachaKit")}</p>
          <p className="text-[11px] text-white/60">{racha > 0 ? pm("rachaTuya", { n: racha }) : pm("rachaKitD")}</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {LISTA_ESPECIALES.map((e) => {
            const ganada = racha >= ESPECIALES[e].racha;
            const puesta = kit.especial === e;
            return (
              <button
                key={e}
                type="button"
                disabled={!ganada}
                aria-pressed={puesta}
                onClick={() => guardar({ especial: puesta ? undefined : e })}
                className="relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition active:scale-95 disabled:cursor-not-allowed"
                style={puesta ? { background: "#F4F7FB", color: "#071A33", boxShadow: "0 0 0 3px #FFB23E" } : { background: "rgba(255,255,255,.08)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.14)" }}
              >
                <EspaldaCamiseta mini kit={{ ...kit, especial: e }} className={`h-10 w-10 ${ganada ? "" : "opacity-35 grayscale"}`} />
                {!ganada && <Lock className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-white/80" aria-hidden />}
                <span className="text-[11px] font-bold leading-tight">{pm(`kit_${e}` as const)}</span>
                {!ganada && <span className="text-[10px] leading-tight opacity-70">{pm("rachaFalta", { n: ESPECIALES[e].racha })}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {!abierto ? (
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <BotonPais p={kit.pais} elegido lang={lang} onElegir={() => setAbierto(true)} />
          <button type="button" onClick={() => setAbierto(true)} aria-expanded={false} className="h-12 rounded-xl px-3 text-sm font-bold ring-1 ring-white/30">{p("kitCountry")} ▾</button>
        </div>
      ) : (
        <div role="group" aria-label={p("kitCountry")} className="space-y-2">
          <p className="text-xs font-semibold text-white/70">{p("kitSouth")}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {PAISES_MICSUR.map((x) => <BotonPais key={x} p={x} elegido={kit.pais === x} lang={lang} onElegir={elegir} />)}
          </div>
          <p className="pt-1 text-xs font-semibold text-white/70">{p("kitWorld")}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {resto.map((x) => <BotonPais key={x} p={x} elegido={kit.pais === x} lang={lang} onElegir={elegir} />)}
          </div>
        </div>
      )}
    </section>
  );
}
