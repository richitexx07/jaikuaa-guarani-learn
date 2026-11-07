/**
 * «Copa de los Departamentos» en pantalla: elegir el departamento, ver la llave (octavos → final),
 * patear cada ronda, el penal de desempate y la vuelta olímpica. Se juega solo; la tabla nacional queda para más adelante.
 * La tanda en sí la dibuja la pantalla de Penales (jugar), así el estadio, el audio y las palabras son los mismos.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, X, Trophy, RotateCcw, MapPin } from "lucide-react";
import { usePM } from "@/lib/i18n-penales-modos";
import { celebrate } from "@/lib/confetti";
import {
  DEPARTAMENTOS,
  RONDAS,
  anotar,
  anotarDesempate,
  guardarCopa,
  leerCopa,
  nuevaCopa,
  pideDesempate,
  type Copa,
  type Departamento,
} from "@/lib/copa";
import { CompartirTexto } from "./penal-dia";
import jaiTrofeo from "@/assets/jai/jai-trofeo.webp";
import type { Outcome } from "./physics";

const C = { noche: "#071A33", led: "#FFB23E", gol: "#3BE38A", mal: "#FF5A4E", blanco: "#F4F7FB" };
export const URL_COPA = "https://www.jaikuaa.com/juegos/penales?copa=1&de=copa";

export type JugarTanda = (o: {
  key: string;
  seed: number;
  total: number;
  etiqueta: string;
  final: (r: { goals: number; outcomes: Outcome[] }) => ReactNode;
}) => ReactNode;

type Fase = "llave" | "tanda" | "desempate";

export function CopaFlow({ jugar, onSalir }: { jugar: JugarTanda; onSalir: () => void }) {
  const pm = usePM();
  const [copa, setCopa] = useState<Copa | null>(null);
  const [cargada, setCargada] = useState(false);
  const [elegir, setElegir] = useState(false);
  const [fase, setFase] = useState<Fase>("llave");
  useEffect(() => {
    const c = leerCopa();
    setCopa(c);
    setElegir(!c);
    setCargada(true);
  }, []);
  function guardar(c: Copa | null) {
    setCopa(c);
    guardarCopa(c);
  }
  function empezar(d: Departamento) {
    guardar(nuevaCopa(d, Date.now() % 1_000_000_007));
    setElegir(false);
    setFase("llave");
  }
  if (!cargada) return null;
  if (elegir || !copa) return <ElegirDepto actual={copa?.depto} onElegir={empezar} onSalir={onSalir} />;

  const ronda = RONDAS[copa.ronda]!;
  const p = copa.partidos[copa.ronda]!;
  const etiquetaRonda = `${pm(ronda)} vs ${p.rival}`;

  if (fase === "tanda")
    return (
      <>
        {jugar({
          key: `copa-${copa.id}-${copa.ronda}`,
          seed: (copa.id + copa.ronda * 7919) >>> 0,
          total: 5,
          etiqueta: etiquetaRonda,
          final: ({ goals }) => (
            <FinalRonda
              antes={copa}
              goals={goals}
              onSeguir={(c) => {
                guardar(c);
                setFase("llave");
              }}
            />
          ),
        })}
      </>
    );
  if (fase === "desempate")
    return (
      <>
        {jugar({
          key: `copa-${copa.id}-${copa.ronda}-desempate`,
          seed: (copa.id + copa.ronda * 7919 + 13) >>> 0,
          total: 1,
          etiqueta: `${pm("desempate")} vs ${p.rival}`,
          final: ({ goals }) => (
            <FinalRonda
              antes={copa}
              goals={goals}
              desempate
              onSeguir={(c) => {
                guardar(c);
                setFase("llave");
              }}
            />
          ),
        })}
      </>
    );

  return (
    <div className="space-y-4 py-4">
      {copa.estado === "campeon" ? (
        <Campeon depto={copa.depto} />
      ) : (
        <header className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: C.led, color: C.noche }}>
            <Trophy className="h-3.5 w-3.5" aria-hidden /> {pm("copaTitulo")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-none">{copa.depto}</h1>
        </header>
      )}
      <Llave copa={copa} />
      {copa.estado === "jugando" && (
        <section className="rounded-3xl bg-white/[.07] p-4 text-center ring-1 ring-white/15" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.led }}>{pm(ronda)}</p>
          <h2 className="mt-1 font-display text-2xl font-bold">
            {copa.depto} <span className="text-white/50">vs</span> {p.rival}
          </h2>
          {pideDesempate(copa) ? (
            <>
              <p className="mt-2 text-white/85">{pm("copaEmpate")}</p>
              <button type="button" onClick={() => setFase("desempate")} className="mt-3 h-14 w-full rounded-2xl tap-3d-dark font-display text-xl font-bold shadow-lg" style={{ background: C.led, color: C.noche }}>
                {pm("copaDesempate")}
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-white/85">{pm("copaRival", { r: p.rival, g: p.golesRival })}</p>
              <p className="font-display text-lg font-bold" style={{ color: C.gol }}>{pm("copaNecesitas", { n: p.golesRival + 1 })}</p>
              <button type="button" onClick={() => setFase("tanda")} className="mt-3 h-14 w-full rounded-2xl tap-3d-dark font-display text-xl font-bold shadow-lg" style={{ background: C.led, color: C.noche }}>
                {pm("copaCancha")}
              </button>
            </>
          )}
        </section>
      )}
      {copa.estado !== "jugando" && (
        <section className="space-y-3 text-center">
          {copa.estado === "eliminado" && (
            <h2 className="font-display text-2xl font-bold">{pm("copaEliminado", { d: copa.depto, r: pm(ronda).toLowerCase() })}</h2>
          )}
          <CompartirTexto
            texto={`${
              copa.estado === "campeon"
                ? pm("copaTextoCampeon", { d: copa.depto })
                : pm("copaTextoElim", { d: copa.depto, r: pm(ronda).toLowerCase() })
            }\n${URL_COPA}`}
          />
          <button type="button" onClick={() => empezar(copa.depto)} className="inline-flex h-12 items-center gap-2 rounded-2xl tap-3d-dark px-6 font-bold" style={{ background: C.led, color: C.noche }}>
            <RotateCcw className="h-5 w-5" aria-hidden /> {pm("copaOtra")}
          </button>
        </section>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => setElegir(true)} className="inline-flex h-11 items-center gap-1.5 rounded-2xl px-4 text-sm font-semibold text-white/80 ring-1 ring-white/20">
          <MapPin className="h-4 w-4" aria-hidden /> {pm("copaCambiar")}
        </button>
        <button type="button" onClick={onSalir} className="h-11 rounded-2xl px-4 text-sm font-semibold text-white/80">{pm("volverModos")}</button>
      </div>
    </div>
  );
}

/** La llave de la copa: cuatro rondas, con el resultado de las jugadas. */
function Llave({ copa }: { copa: Copa }) {
  const pm = usePM();
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label={pm("copaTitulo")}>
      {copa.partidos.map((p, i) => {
        const actual = copa.estado === "jugando" && i === copa.ronda;
        const jugado = p.paso !== undefined;
        return (
          <li
            key={i}
            className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center"
            style={{
              background: actual ? "rgba(255,178,62,.16)" : "rgba(255,255,255,.06)",
              boxShadow: actual ? `inset 0 0 0 2px ${C.led}` : "inset 0 0 0 1px rgba(255,255,255,.12)",
              opacity: !jugado && !actual ? 0.6 : 1,
            }}
            aria-current={actual ? "step" : undefined}
          >
            <span className="text-[10px] font-bold uppercase leading-tight tracking-wide text-white/70">{pm(RONDAS[i]!)}</span>
            <span className="w-full break-words text-[11px] font-semibold leading-tight">{p.rival}</span>
            <span
              className="grid h-6 w-6 place-items-center rounded-full"
              style={{ background: jugado ? (p.paso ? C.gol : C.mal) : "rgba(255,255,255,.12)", color: C.noche }}
              aria-hidden
            >
              {jugado ? p.paso ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" /> : <span className="text-[11px] text-white/80">{i + 1}</span>}
            </span>
            {p.mios !== undefined && (
              <span className="pn-led font-display text-sm font-bold" style={{ color: C.led }}>
                {p.mios}-{p.golesRival}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** El final de cada tanda de la copa: dice si pasaste, si hay desempate o si quedaste afuera. */
function FinalRonda({ antes, goals, desempate = false, onSeguir }: { antes: Copa; goals: number; desempate?: boolean; onSeguir: (c: Copa) => void }) {
  const pm = usePM();
  const despues = useMemo(() => (desempate ? anotarDesempate(antes, goals > 0) : anotar(antes, goals)), [antes, goals, desempate]);
  const guardado = useRef(false);
  useEffect(() => {
    if (guardado.current) return;
    guardado.current = true;
    guardarCopa(despues);
  }, [despues]);
  const p = antes.partidos[antes.ronda]!;
  const empate = !desempate && pideDesempate(despues);
  const paso = despues.partidos[antes.ronda]?.paso === true;
  const titulo = empate
    ? pm("copaEmpate")
    : paso
      ? despues.estado === "campeon"
        ? pm("copaCampeon", { d: antes.depto })
        : pm("copaPaso", { d: antes.depto })
      : pm("copaEliminado", { d: antes.depto, r: pm(RONDAS[antes.ronda]!).toLowerCase() });
  return (
    <div className="space-y-3">
      {!desempate && (
        <p className="pn-led font-display text-5xl font-bold" style={{ color: C.led }}>
          {goals} <span className="text-white/40">-</span> {p.golesRival}
        </p>
      )}
      {!desempate && <p className="text-sm text-white/75">{pm("copaHiciste", { n: goals })} {pm("copaRival", { r: p.rival, g: p.golesRival })}</p>}
      <h2 className="font-display text-2xl font-bold" style={{ color: empate ? C.led : paso ? C.gol : C.mal }}>{titulo}</h2>
      <button type="button" onClick={() => onSeguir(despues)} className="h-14 w-full rounded-2xl tap-3d-dark font-display text-xl font-bold shadow-lg" style={{ background: C.led, color: C.noche }}>
        {pm("copaSeguir")}
      </button>
    </div>
  );
}

function Campeon({ depto }: { depto: Departamento }) {
  const pm = usePM();
  useEffect(() => {
    celebrate("big");
  }, []);
  return (
    <section className="relative overflow-hidden rounded-3xl p-5 text-center ring-2" style={{ background: "radial-gradient(80% 70% at 50% 0%, rgba(255,214,107,.35), transparent 70%), linear-gradient(180deg,#0E3B73,#071A33)", ["--tw-ring-color" as string]: C.led }}>
      <img src={jaiTrofeo} alt="" className="mx-auto h-44 w-auto drop-shadow-[0_10px_30px_rgba(255,178,62,.45)]" width={176} height={176} />
      <h1 className="mt-2 font-display text-4xl font-bold leading-none" style={{ color: C.led }}>{pm("copaCampeon", { d: depto })}</h1>
      <p className="mt-2 text-white/85">{pm("copaCampeonD")}</p>
    </section>
  );
}

function ElegirDepto({ actual, onElegir, onSalir }: { actual?: Departamento; onElegir: (d: Departamento) => void; onSalir: () => void }) {
  const pm = usePM();
  return (
    <div className="space-y-4 py-4">
      <header className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: C.led, color: C.noche }}>
          <Trophy className="h-3.5 w-3.5" aria-hidden /> {pm("copaTitulo")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight">{pm("copaElegi")}</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-white/75">{pm("copaBajada")}</p>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={pm("copaElegi")}>
        {DEPARTAMENTOS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onElegir(d)}
            className="min-h-12 rounded-2xl tap-3d-dark px-3 py-2 text-left font-display text-base font-bold transition active:scale-95"
            style={
              d === actual
                ? { background: C.blanco, color: C.noche, boxShadow: `0 0 0 3px ${C.led}` }
                : { background: "rgba(255,255,255,.08)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.18)" }
            }
          >
            {d}
          </button>
        ))}
      </div>
      <div className="text-center">
        <button type="button" onClick={onSalir} className="h-11 rounded-2xl px-4 text-sm font-semibold text-white/80">{pm("volverModos")}</button>
      </div>
    </div>
  );
}
