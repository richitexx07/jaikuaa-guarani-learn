import { createFileRoute, Link } from "@tanstack/react-router";
import { QuitGameButton } from "@/components/games/quit-game-button";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RotateCcw, Stethoscope, Volume2 } from "lucide-react";
import { GameKit, GameSoundButton, useGameKit } from "@/components/games/game-kit";
import { useGameWords } from "@/components/games/game-shell";
import { recordCompletion } from "@/lib/gamification";
import { playGuarani } from "@/lib/audio";
import { useMostrador } from "@/lib/use-mostrador";
import { playFrase, prefetchFrases } from "@/lib/mostrador-audio";
import {
  armarTurno,
  enIdioma,
  estrellas,
  paciente as nuevoPaciente,
  PACIENTES_POR_TURNO,
  puntosPorAcierto,
  regionDe,
  REGIONES,
  SEGUNDOS_POR_PACIENTE,
  t,
  VIDAS,
  xpDelTurno,
  type FraseSalud,
  type Idioma,
  type PalabraCuerpo,
  type Paciente,
  type RegionId,
  type Ronda,
} from "@/lib/consultorio";
import jaiImg from "@/assets/jai-doctor.webp";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { mulberry32, orderedBy } from "@/lib/reto";

export const Route = createFileRoute("/_authenticated/juegos/consultorio")({
  head: () => ({
    meta: [
      { title: "Consultorio de Jai | Jaikuaa" },
      {
        name: "description",
        content: "Juego de guaraní médico: atendé pacientes que hablan guaraní, con voces de hablantes paraguayos.",
      },
    ],
  }),
  component: () => (
    <GameKit>
      <Consultorio />
    </GameKit>
  ),
});

/* Paleta propia del consultorio: ambo de guardia, papel de ficha y fósforo de monitor. */
const C = {
  ambo: "#0F4C55",
  amboOscuro: "#0A3439",
  ficha: "#F3FAF7",
  tinta: "#12323A",
  fosforo: "#3DE0B0",
  ambar: "#F2B544",
  rojo: "#D52B1E",
};

const CSS = `
.cj-ecg { animation: cj-scroll var(--cj-speed, 2.4s) linear infinite; }
@keyframes cj-scroll { from { transform: translateX(0) } to { transform: translateX(-200px) } }
.cj-pulse { animation: cj-pulse 0.9s ease-out 1; transform-box: fill-box; transform-origin: center; }
@keyframes cj-pulse { 0% { transform: scale(1) } 40% { transform: scale(1.35) } 100% { transform: scale(1) } }
.cj-flat { animation: cj-flat 0.5s steps(2) 2; }
@keyframes cj-flat { 50% { opacity: 0.2 } }
.cj-enter { animation: cj-enter 0.45s cubic-bezier(.2,.8,.2,1) 1; }
@keyframes cj-enter { from { transform: translateY(18px) rotate(-1.5deg); opacity: 0 } to { transform: none; opacity: 1 } }
.cj-region { cursor: pointer; outline: none; }
.cj-region .cj-ring { opacity: 0; transition: opacity .15s; }
.cj-region:hover .cj-ring, .cj-region:focus-visible .cj-ring { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .cj-ecg, .cj-pulse, .cj-flat, .cj-enter { animation: none !important; } }
`;

type Fase = "intro" | "jugando" | "fin";
type Resultado = null | { ok: boolean; porTiempo?: boolean; elegida?: string };

function Consultorio() {
  const { react } = useGameKit();
  const [idioma, setIdioma] = useState<Idioma>("es");
  useEffect(() => {
    try {
      const v = localStorage.getItem("jaikuaa:consultorio-idioma");
      if (v === "pt" || v === "es") setIdioma(v);
      // Sin elección guardada: sigue el idioma de la app (portugués si la app está en portugués).
      else if (localStorage.getItem("jaikuaa_lang") === "pt") setIdioma("pt");
    } catch {}
  }, []);
  const cambiarIdioma = (v: Idioma) => {
    setIdioma(v);
    try {
      localStorage.setItem("jaikuaa:consultorio-idioma", v);
    } catch {}
  };

  // Contenido: TODAS las partes del cuerpo publicadas con voz (no solo la lección 4), así cada palabra
  // nueva de salud que publiquen los docentes (mano, panza, pecho…) suma pacientes sola. Y las frases de salud.
  const cuerpoQ = useGameWords(null);
  const { listar, audios } = useMostrador();
  const frasesQ = useQuery({
    queryKey: ["mostrador", "salud"],
    queryFn: () => listar("salud"),
    retry: false,
  });
  const cuerpo: PalabraCuerpo[] = useMemo(
    () =>
      (cuerpoQ.data?.words ?? [])
        .filter((w) => w.hasAudio)
        .map((w) => ({ gn: w.gn, es: w.es, region: regionDe(w.es) }))
        .filter((w): w is PalabraCuerpo => w.region !== null),
    [cuerpoQ.data],
  );
  const frases: FraseSalud[] = useMemo(
    () =>
      (frasesQ.data?.frases ?? [])
        .filter((f) => f.gn && f.hasAudio)
        .map((f) => ({ id: f.id, tipo: f.tipo, es: f.es, gn: f.gn as string })),
    [frasesQ.data],
  );
  const ids = useMemo(() => frases.map((f) => f.id), [frases]);
  const audioQ = useQuery({
    queryKey: ["mostrador-audio", "salud", ids.join(",")],
    enabled: ids.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: () => audios(ids.slice(0, 80)),
  });
  const urls = audioQ.data?.urls ?? {};
  useEffect(() => { if (audioQ.data?.urls) prefetchFrases(audioQ.data.urls); }, [audioQ.data?.urls]);
  const cargando = cuerpoQ.isLoading || frasesQ.isLoading;
  const pocos = frases.length < 8;

  const partida = useRetoPartida("consultorio", { total: PACIENTES_POR_TURNO });
  const { seed, otra } = partida;
  const usada = useRef<number | null>(null);
  const [fase, setFase] = useState<Fase>("intro");
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [i, setI] = useState(0);
  const [vidas, setVidas] = useState(VIDAS);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [mejorRacha, setMejorRacha] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [atendidos, setAtendidos] = useState(0);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [restante, setRestante] = useState(SEGUNDOS_POR_PACIENTE);
  const [ganado, setGanado] = useState<number | null>(null);
  const guardado = useRef(false);

  const ronda = rondas[i];
  const pac = pacientes[i];

  const sonar = useCallback(
    (r: Ronda | undefined) => {
      if (!r) return;
      if (r.tipo === "cuerpo") void playGuarani(r.palabra.gn);
      else if (r.tipo === "sintoma") void playFrase(r.frase.id, urls[r.frase.id]);
    },
    [urls],
  );

  function empezar() {
    // El primer turno usa la semilla del reto (si vino uno); los siguientes, una nueva.
    const s = usada.current === seed ? otra() : seed;
    usada.current = s;
    const rnd = mulberry32(s);
    const rs = armarTurno(orderedBy(cuerpo, (w) => w.gn), orderedBy(frases, (f) => f.id), rnd);
    if (rs.length === 0) return;
    setRondas(rs);
    // Con la misma semilla: en un reto, los dos jugadores ven los mismos pacientes.
    setPacientes(rs.map((r, k) => nuevoPaciente(k, rnd, r)));
    setI(0);
    setVidas(VIDAS);
    setPuntos(0);
    setRacha(0);
    setMejorRacha(0);
    setAciertos(0);
    setAtendidos(0);
    setResultado(null);
    setRestante(SEGUNDOS_POR_PACIENTE);
    setGanado(null);
    guardado.current = false;
    setFase("jugando");
  }

  // Al llegar cada paciente: dice lo que le pasa y arranca el reloj.
  useEffect(() => {
    if (fase !== "jugando" || !ronda) return;
    setRestante(SEGUNDOS_POR_PACIENTE);
    const id = window.setTimeout(() => sonar(ronda), 450);
    return () => window.clearTimeout(id);
  }, [fase, i, ronda, sonar]);

  useEffect(() => {
    if (fase !== "jugando" || resultado) return;
    const id = window.setInterval(() => setRestante((s) => Math.max(0, +(s - 0.1).toFixed(1))), 100);
    return () => window.clearInterval(id);
  }, [fase, resultado, i]);

  const responder = useCallback(
    (ok: boolean, elegida?: string, porTiempo = false) => {
      if (resultado || !ronda) return;
      setResultado({ ok, elegida, porTiempo });
      setAtendidos((n) => n + 1);
      if (ok) {
        const nr = racha + 1;
        setRacha(nr);
        setMejorRacha((m) => Math.max(m, nr));
        setAciertos((n) => n + 1);
        setPuntos((p) => p + puntosPorAcierto(Math.floor(restante), nr));
        react("success");
        if (ronda.tipo === "indicacion") void playFrase(ronda.frase.id, urls[ronda.frase.id]);
      } else {
        setRacha(0);
        setVidas((v) => v - 1);
        react("error");
      }
    },
    [resultado, ronda, racha, restante, react, urls],
  );

  useEffect(() => {
    if (fase === "jugando" && !resultado && restante <= 0) responder(false, undefined, true);
  }, [restante, fase, resultado, responder]);

  function siguiente() {
    if (vidas <= 0 || i + 1 >= rondas.length) {
      setFase("fin");
      return;
    }
    setResultado(null);
    setI((n) => n + 1);
  }

  useEffect(() => {
    if (fase !== "fin" || guardado.current) return;
    guardado.current = true;
    const xp = xpDelTurno(aciertos);
    setGanado(xp);
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "consultorio", xp });
    if (estrellas(aciertos, PACIENTES_POR_TURNO) >= 2) react("victory");
  }, [fase, aciertos, react]);

  return (
    <div className="min-h-screen pb-28" style={{ background: `linear-gradient(180deg, ${C.ambo} 0%, ${C.amboOscuro} 100%)` }}>
      <style>{CSS}</style>
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 text-white">
        <Link to="/juegos" className="rounded-md px-2 py-1 text-sm font-medium text-white/80 hover:text-white">
          ← Juegos
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-white/30 text-xs font-semibold" role="group" aria-label="Idioma">
            {(["es", "pt"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => cambiarIdioma(v)}
                aria-pressed={idioma === v}
                className={`px-3 py-1.5 ${idioma === v ? "bg-white text-[#0F4C55]" : "text-white/80"}`}
              >
                {v === "es" ? "Español" : "Português"}
              </button>
            ))}
          </div>
          <div className="[&_button]:border-white/30 [&_button]:bg-transparent [&_button]:text-white">
            <GameSoundButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        {fase === "intro" && <RetoBanner partida={partida} className="mt-4" />}
        {fase === "intro" && (
          <Intro
            idioma={idioma}
            cargando={cargando}
            puede={cuerpo.length >= 3 || frases.length >= 4}
            pocos={pocos}
            onEmpezar={empezar}
          />
        )}

        {fase === "jugando" && ronda && pac && (
          <div className="space-y-4">
            <Monitor
              restante={restante}
              vidas={vidas}
              puntos={puntos}
              racha={racha}
              n={i + 1}
              total={rondas.length}
              resultado={resultado}
              idioma={idioma}
            />
            <Ficha key={i} p={pac} ronda={ronda} idioma={idioma} onEscuchar={() => sonar(ronda)} resultado={resultado}>
              {ronda.tipo === "cuerpo" && (
                <CuerpoMapa
                  correcta={ronda.palabra.region}
                  elegida={(resultado?.elegida as RegionId | undefined) ?? null}
                  bloqueado={!!resultado}
                  idioma={idioma}
                  onElegir={(r) => responder(r === ronda.palabra.region, r)}
                />
              )}
              {ronda.tipo !== "cuerpo" && (
                <Opciones ronda={ronda} idioma={idioma} femenino={pac.femenino} resultado={resultado} onElegir={(id, ok) => responder(ok, id)} />
              )}
            </Ficha>
            {resultado && (
              <Veredicto ronda={ronda} resultado={resultado} idioma={idioma} femenino={pac.femenino} onSeguir={siguiente} ultimo={vidas <= 0 || i + 1 >= rondas.length} />
            )}
            <QuitGameButton className="mt-3 text-white" kind="shift" onQuit={() => setFase("fin")} />
          </div>
        )}

        {fase === "fin" && (
          <Fin
            idioma={idioma}
            aciertos={aciertos}
            atendidos={atendidos}
            total={rondas.length}
            racha={mejorRacha}
            puntos={puntos}
            xp={ganado ?? 0}
            onOtro={empezar}
            partida={partida}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------ Pantallas ------------------------------ */

function Intro({
  idioma,
  cargando,
  puede,
  pocos,
  onEmpezar,
}: {
  idioma: Idioma;
  cargando: boolean;
  puede: boolean;
  pocos: boolean;
  onEmpezar: () => void;
}) {
  return (
    <section className="cj-enter pt-4 text-white">
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#062A2E] shadow-2xl">
        <Ecg velocidad={2.4} alto={90} />
        <div className="grid items-end gap-4 px-6 pb-6 sm:grid-cols-[1fr_auto]">
          <div>
            <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">{t("titulo", idioma)}</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">{t("bajada", idioma)}</p>
          </div>
          <img src={jaiImg} alt="Jai, el doctor del consultorio" className="mx-auto h-48 w-auto drop-shadow-xl sm:h-60" />
        </div>
      </div>
      <ul className="mt-5 grid gap-2 text-sm text-white/85 sm:grid-cols-3">
        <li className="rounded-2xl bg-white/10 p-3">
          <span className="block font-semibold text-white">{PACIENTES_POR_TURNO} pacientes</span>
          {idioma === "es" ? "por turno, con voces reales" : "por plantão, com vozes reais"}
        </li>
        <li className="rounded-2xl bg-white/10 p-3">
          <span className="block font-semibold text-white">{SEGUNDOS_POR_PACIENTE} segundos</span>
          {idioma === "es" ? "para atender a cada uno" : "para atender cada um"}
        </li>
        <li className="rounded-2xl bg-white/10 p-3">
          <span className="block font-semibold text-white">{VIDAS} vidas</span>
          {idioma === "es" ? "un error cuesta una" : "cada erro custa uma"}
        </li>
      </ul>
      {pocos && !cargando && <p className="mt-4 rounded-2xl border border-[#F2B544]/50 bg-[#F2B544]/10 p-3 text-sm text-[#FBE3A6]">{t("pocos", idioma)}</p>}
      <button
        type="button"
        onClick={onEmpezar}
        disabled={cargando || !puede}
        className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold text-[#062A2E] shadow-lg transition active:scale-[0.98] disabled:opacity-50"
        style={{ background: C.fosforo }}
      >
        {cargando ? <Loader2 className="h-6 w-6 animate-spin" /> : <Stethoscope className="h-6 w-6" />}
        {t("empezar", idioma)}
      </button>
    </section>
  );
}

function Ecg({ velocidad, alto, color = C.fosforo, plano = false }: { velocidad: number; alto: number; color?: string; plano?: boolean }) {
  // Un latido cada 200 px; se repite y se desplaza para que parezca un monitor.
  const latido = "M0 50 L60 50 L70 44 L78 50 L90 50 L96 20 L104 82 L112 50 L128 50 L140 40 L156 50 L200 50";
  const d = Array.from({ length: 6 }, (_, k) => latido.replace(/(\d+(?:\.\d+)?) (\d+)/g, (_, x, y) => `${Number(x) + k * 200} ${y}`)).join(" ");
  return (
    <svg viewBox={`0 0 600 100`} preserveAspectRatio="none" className="block w-full" style={{ height: alto }} aria-hidden>
      <defs>
        <pattern id="cj-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L0 0 0 20" fill="none" stroke="#0E3D42" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="600" height="100" fill="url(#cj-grid)" />
      <g className={plano ? "" : "cj-ecg"} style={{ ["--cj-speed" as string]: `${velocidad}s` }}>
        <path d={plano ? "M0 50 L1200 50" : d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </g>
    </svg>
  );
}

function Corazon({ lleno }: { lleno: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
        fill={lleno ? C.rojo : "transparent"}
        stroke={lleno ? C.rojo : "#ffffff55"}
        strokeWidth="1.6"
      />
    </svg>
  );
}

/** El monitor de signos vitales: reloj, vidas, puntos y racha. Late más rápido cuando queda poco tiempo. */
function Monitor({
  restante,
  vidas,
  puntos,
  racha,
  n,
  total,
  resultado,
  idioma,
}: {
  restante: number;
  vidas: number;
  puntos: number;
  racha: number;
  n: number;
  total: number;
  resultado: Resultado;
  idioma: Idioma;
}) {
  const urgente = restante <= 6 && !resultado;
  const vel = resultado ? 2.4 : Math.max(0.7, (restante / SEGUNDOS_POR_PACIENTE) * 2.4);
  const color = resultado ? (resultado.ok ? C.fosforo : C.rojo) : urgente ? C.ambar : C.fosforo;
  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#062A2E] text-white shadow-xl">
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-white/70">
        <span>
          {t("paciente", idioma)} {n} {t("de", idioma)} {total}
        </span>
        <span className="flex gap-1" aria-label={`${vidas} vidas`}>
          {Array.from({ length: VIDAS }, (_, k) => (
            <Corazon key={k} lleno={k < vidas} />
          ))}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center">
        <div className={resultado && !resultado.ok ? "cj-flat" : ""}>
          <Ecg velocidad={vel} alto={64} color={color} plano={!!resultado && !resultado.ok} />
        </div>
        <div className="px-4 text-right">
          <div className="font-display text-4xl font-bold tabular-nums leading-none" style={{ color }} aria-live="off">
            {Math.ceil(restante)}
            <span className="ml-0.5 text-base font-medium text-white/60">s</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-sm">
        <span className="tabular-nums">
          <span className="font-bold text-white">{puntos}</span> <span className="text-white/60">{t("puntos", idioma)}</span>
        </span>
        {racha >= 2 && (
          <span key={racha} className="cj-pulse rounded-full px-2 py-0.5 text-xs font-bold text-[#062A2E]" style={{ background: C.ambar }}>
            ×{Math.min(2, 1 + 0.25 * (racha - 1)).toFixed(2).replace(/\.?0+$/, "")} · {racha} seguidos
          </span>
        )}
      </div>
    </div>
  );
}

const PIEL = ["#F2C9A0", "#D9A57B", "#B57B52", "#8A5A3B"];
const PELO = ["#2B1D14", "#5A3A22", "#9A9A9A", "#C9A15B"];

function Avatar({ p, estado }: { p: Paciente; estado: "espera" | "bien" | "mal" }) {
  const piel = PIEL[p.piel]!;
  const pelo = p.edad > 62 ? PELO[2]! : PELO[p.pelo]!;
  const boca = estado === "bien" ? "M38 62 Q50 72 62 62" : estado === "mal" ? "M38 68 Q50 60 62 68" : "M40 65 Q50 66 60 65";
  const ceja = estado === "espera" ? "M34 40 L44 43 M56 43 L66 40" : "M34 42 L44 41 M56 41 L66 42";
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" aria-hidden>
      <circle cx="50" cy="50" r="48" fill="#DCEFEA" />
      {p.femenino && <path d="M18 56 Q14 18 50 14 Q86 18 82 56 L76 80 L24 80 Z" fill={pelo} />}
      <ellipse cx="50" cy="54" rx="26" ry="30" fill={piel} />
      <path d={p.femenino ? "M24 46 Q30 20 50 20 Q70 20 76 46 Q64 30 50 32 Q36 30 24 46" : "M25 44 Q28 20 50 20 Q72 20 75 44 Q70 32 50 32 Q30 32 25 44"} fill={pelo} />
      <path d={ceja} stroke="#3a2a20" strokeWidth="2.2" strokeLinecap="round" />
      {[40, 60].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="50" rx="4.6" ry="4.2" fill="#fff" />
          <circle cx={x} cy="50.5" r="2.8" fill="#4A2F1C" />
          <circle cx={x + 1} cy="49" r="0.9" fill="#fff" />
        </g>
      ))}
      <circle cx="33" cy="60" r="5" fill="#E9877A" opacity=".35" />
      <circle cx="67" cy="60" r="5" fill="#E9877A" opacity=".35" />
      <path d="M50 52 Q47 58 50 60" stroke="#00000033" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {p.edad > 62 && <g fill="none" stroke="#3a2a20" strokeWidth="1.4"><circle cx="40" cy="50" r="6.5" /><circle cx="60" cy="50" r="6.5" /><path d="M46.5 50 L53.5 50" /></g>}
      <path d={boca} stroke="#6b2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M22 100 Q22 82 50 82 Q78 82 78 100 Z" fill="#7FB8C9" /><path d="M42 82 L50 92 L58 82" fill="none" stroke="#4A8A9C" strokeWidth="2" />
    </svg>
  );
}

function Ficha({
  p,
  ronda,
  idioma,
  onEscuchar,
  resultado,
  children,
}: {
  p: Paciente;
  ronda: Ronda;
  idioma: Idioma;
  onEscuchar: () => void;
  resultado: Resultado;
  children: ReactNode;
}) {
  const motivo = ronda.tipo === "cuerpo" ? t("motivoCuerpo", idioma) : ronda.tipo === "sintoma" ? t("motivoSintoma", idioma) : t("motivoIndicacion", idioma);
  const pregunta = ronda.tipo === "cuerpo" ? t("dondeDuele", idioma) : ronda.tipo === "sintoma" ? t("quePasa", idioma) : t("queDecis", idioma);
  return (
    <article className="cj-enter relative rounded-3xl p-5 pt-7 shadow-2xl" style={{ background: C.ficha, color: C.tinta }}>
      {/* El clip de la tablilla */}
      <div className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-md bg-[#9FB4B2] shadow-inner" aria-hidden />
      <div className="flex items-center gap-4">
        <Avatar p={p} estado={resultado ? (resultado.ok ? "bien" : "mal") : "espera"} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-bold leading-tight">{p.nombre}</p>
          <p className="text-sm opacity-70">
            {p.edad} {idioma === "es" ? "años" : "anos"}
          </p>
          <span className="mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: "#FCE7B0", color: "#6A4A00" }}>
            {motivo}
          </span>
        </div>
      </div>

      {ronda.tipo !== "indicacion" ? (
        <button
          type="button"
          onClick={onEscuchar}
          className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl tap-3d-dark text-base font-bold text-white shadow-md transition active:scale-[0.98]"
          style={{ background: C.ambo }}
        >
          <Volume2 className="h-6 w-6" /> {t("escuchar", idioma)}
        </button>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-dashed p-4" style={{ borderColor: "#9FB4B2" }}>
          <p className="text-sm opacity-70">{t("pedile", idioma)}</p>
          <p className="mt-1 font-display text-xl font-bold">{enIdioma(ronda.frase.es, idioma, p.femenino)}</p>
        </div>
      )}

      <p className="mt-5 text-sm font-semibold">{pregunta}</p>
      <div className="mt-3">{children}</div>
    </article>
  );
}

/** Dibujo del cuerpo con las partes que se pueden tocar. Cabeza grande para que la cara se toque fácil. */
function CuerpoMapa({
  correcta,
  elegida,
  bloqueado,
  idioma,
  onElegir,
}: {
  correcta: RegionId;
  elegida: RegionId | null;
  bloqueado: boolean;
  idioma: Idioma;
  onElegir: (r: RegionId) => void;
}) {
  const piel = "#E8B990";
  const zonas: { id: RegionId; shape: ReactNode; ring: ReactNode }[] = [
    // La cabeza va primero (abajo): toda la cabeza se puede tocar, y ojos, nariz, boca y orejas quedan encima.
    { id: "cabeza", shape: <circle cx="120" cy="92" r="70" />, ring: <ellipse cx="120" cy="40" rx="58" ry="24" /> },
    { id: "ojo", shape: <><circle cx="96" cy="86" r="17" /><circle cx="144" cy="86" r="17" /></>, ring: <><circle cx="96" cy="86" r="17" /><circle cx="144" cy="86" r="17" /></> },
    { id: "oreja", shape: <><ellipse cx="50" cy="96" rx="15" ry="20" /><ellipse cx="190" cy="96" rx="15" ry="20" /></>, ring: <><ellipse cx="50" cy="96" rx="15" ry="20" /><ellipse cx="190" cy="96" rx="15" ry="20" /></> },
    { id: "nariz", shape: <circle cx="120" cy="108" r="12" />, ring: <circle cx="120" cy="108" r="12" /> },
    { id: "boca", shape: <ellipse cx="120" cy="134" rx="22" ry="11" />, ring: <ellipse cx="120" cy="134" rx="22" ry="11" /> },
    { id: "panza", shape: <ellipse cx="120" cy="250" rx="46" ry="30" />, ring: <circle cx="120" cy="245" r="22" /> },
    { id: "corazon", shape: <circle cx="140" cy="198" r="22" />, ring: <circle cx="140" cy="198" r="18" /> },
    { id: "mano", shape: <><circle cx="46" cy="268" r="17" /><circle cx="194" cy="268" r="17" /></>, ring: <><circle cx="46" cy="268" r="17" /><circle cx="194" cy="268" r="17" /></> },
    { id: "pie", shape: <><ellipse cx="98" cy="350" rx="20" ry="11" /><ellipse cx="142" cy="350" rx="20" ry="11" /></>, ring: <><ellipse cx="98" cy="350" rx="20" ry="11" /><ellipse cx="142" cy="350" rx="20" ry="11" /></> },
  ];
  const etiqueta = (id: RegionId) => {
    const r = REGIONES.find((x) => x.id === id)!;
    return idioma === "pt" ? r.pt : r.es[0]!.charAt(0).toUpperCase() + r.es[0]!.slice(1);
  };
  return (
    <div className="mx-auto max-w-[300px]">
      <svg viewBox="0 0 240 370" className="w-full" role="group" aria-label={idioma === "es" ? "Cuerpo del paciente" : "Corpo do paciente"}>
        <defs>
          <radialGradient id="cj-skin" cx="45%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#F6CFA8" />
            <stop offset="70%" stopColor={piel} />
            <stop offset="100%" stopColor="#C98F66" />
          </radialGradient>
          <linearGradient id="cj-bata" x1="0" x2="1">
            <stop offset="0%" stopColor="#5E9FB3" />
            <stop offset="45%" stopColor="#8CC6D6" />
            <stop offset="100%" stopColor="#5E9FB3" />
          </linearGradient>
          <linearGradient id="cj-pant" x1="0" x2="1">
            <stop offset="0%" stopColor="#24596A" />
            <stop offset="50%" stopColor="#367F92" />
            <stop offset="100%" stopColor="#24596A" />
          </linearGradient>
          <radialGradient id="cj-cheek"><stop offset="0%" stopColor="#E9877A" stopOpacity=".55" /><stop offset="100%" stopColor="#E9877A" stopOpacity="0" /></radialGradient>
          <linearGradient id="cj-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5A3D29" /><stop offset="100%" stopColor="#2E1F15" /></linearGradient>
        </defs>
        {/* Sombra en el piso */}
        <ellipse cx="120" cy="360" rx="70" ry="8" fill="#0003" />
        {/* Piernas */}
        <path d="M86 284 Q84 320 90 344 L108 344 Q112 316 116 290 Z" fill="url(#cj-pant)" />
        <path d="M154 284 Q156 320 150 344 L132 344 Q128 316 124 290 Z" fill="url(#cj-pant)" />
        {/* Zapatillas */}
        <path d="M78 352 Q80 340 98 340 Q116 340 118 352 Q98 358 78 352 Z" fill="#2B3134" />
        <path d="M122 352 Q124 340 142 340 Q160 340 162 352 Q142 358 122 352 Z" fill="#2B3134" />
        <path d="M80 351 L116 351 M124 351 L160 351" stroke="#E8EEF0" strokeWidth="2.5" />
        {/* Brazos */}
        <path d="M74 182 Q52 204 46 254" stroke="url(#cj-bata)" strokeWidth="24" strokeLinecap="round" fill="none" />
        <path d="M166 182 Q188 204 194 254" stroke="url(#cj-bata)" strokeWidth="24" strokeLinecap="round" fill="none" />
        {/* Manos con dedos */}
        {[46, 194].map((x) => (
          <g key={x} fill="url(#cj-skin)" stroke="#B57B52" strokeWidth="1">
            <ellipse cx={x} cy="268" rx="13" ry="14" />
            <rect x={x - 11} y="274" width="5" height="11" rx="2.5" />
            <rect x={x - 4.5} y="276" width="5" height="12" rx="2.5" />
            <rect x={x + 2} y="275" width="5" height="11" rx="2.5" />
          </g>
        ))}
        {/* Torso con bata de paciente */}
        <rect x="106" y="148" width="28" height="26" rx="6" fill="url(#cj-skin)" />
        <path d="M68 178 Q120 156 172 178 L178 290 Q120 304 62 290 Z" fill="url(#cj-bata)" />
        <path d="M104 166 L120 190 L136 166" fill="none" stroke="#4A8A9C" strokeWidth="3" strokeLinejoin="round" />
        <path d="M120 190 L120 292" stroke="#4A8A9C" strokeWidth="1.5" strokeDasharray="2 6" />
        {[208, 236, 264].map((y) => <circle key={y} cx="120" cy={y} r="2.5" fill="#F2F7F8" />)}
        <path d="M66 288 Q120 300 176 288" stroke="#4A8A9C" strokeWidth="3" fill="none" />
        {/* Pulsera de internación */}
        <rect x="36" y="250" width="20" height="6" rx="2" fill="#F4F4F0" stroke="#C8102E" strokeWidth="1" />
        {/* Cabeza */}
        <ellipse cx="50" cy="96" rx="12" ry="17" fill="url(#cj-skin)" />
        <ellipse cx="190" cy="96" rx="12" ry="17" fill="url(#cj-skin)" />
        <path d="M50 88 Q45 96 50 104 M190 88 Q195 96 190 104" stroke="#B57B52" strokeWidth="2" fill="none" />
        <circle cx="120" cy="92" r="70" fill="url(#cj-skin)" />
        <path d="M50 84 Q52 18 120 16 Q188 18 190 84 Q180 52 152 44 Q138 58 112 52 Q84 48 66 62 Q56 70 50 84" fill="url(#cj-hair)" />
        <path d="M84 36 Q110 26 140 32" stroke="#7A5638" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Cejas */}
        <path d="M82 68 Q96 62 108 68 M132 68 Q144 62 158 68" stroke="#3B2A1E" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Ojos */}
        {[96, 144].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="86" rx="10" ry="9" fill="#FFFFFF" />
            <circle cx={x} cy="87" r="6" fill="#5A3A22" />
            <circle cx={x} cy="87" r="3" fill="#141414" />
            <circle cx={x + 2} cy="84" r="1.8" fill="#FFFFFF" />
          </g>
        ))}
        {/* Mejillas */}
        <circle cx="78" cy="114" r="14" fill="url(#cj-cheek)" />
        <circle cx="162" cy="114" r="14" fill="url(#cj-cheek)" />
        {/* Nariz y boca */}
        <path d="M120 96 Q112 112 118 116 Q122 118 126 115" stroke="#B07A55" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M102 130 Q120 146 138 130 Q120 138 102 130 Z" fill="#9E4444" stroke="#7E3030" strokeWidth="2" strokeLinejoin="round" />
        {/* Corazón */}
        <path d="M140 190 c-4-6-12-3-10 4 c1 5 10 10 10 10 s9-5 10-10 c2-7-6-10-10-4z" fill="#C8102E55" />
        {/* Ombligo */}
        <circle cx="120" cy="252" r="0" />

        {zonas.map((z) => {
          const esCorrecta = bloqueado && z.id === correcta;
          const esMal = bloqueado && elegida === z.id && z.id !== correcta;
          const fill = esCorrecta ? "#3DE0B088" : esMal ? "#D52B1E77" : "transparent";
          return (
            <g
              key={z.id}
              className={`cj-region ${esCorrecta ? "cj-pulse" : ""}`}
              role="button"
              tabIndex={bloqueado ? -1 : 0}
              aria-label={etiqueta(z.id)}
              aria-disabled={bloqueado}
              onClick={() => !bloqueado && onElegir(z.id)}
              onKeyDown={(e) => {
                if (!bloqueado && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onElegir(z.id);
                }
              }}
            >
              <g fill={fill} stroke={esCorrecta ? C.fosforo : esMal ? C.rojo : "none"} strokeWidth="3">
                {z.shape}
              </g>
              <g className="cj-ring" fill="none" stroke={C.ambo} strokeWidth="2.5" strokeDasharray="5 4">
                {z.ring}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Opciones({
  ronda,
  idioma,
  femenino,
  resultado,
  onElegir,
}: {
  ronda: Extract<Ronda, { tipo: "sintoma" | "indicacion" }>;
  idioma: Idioma;
  femenino: boolean;
  resultado: Resultado;
  onElegir: (id: string, ok: boolean) => void;
}) {
  return (
    <div className="grid gap-2">
      {ronda.opciones.map((o) => {
        const ok = o.id === ronda.frase.id;
        const marcada = resultado && (ok || resultado.elegida === o.id);
        return (
          <button
            key={o.id}
            type="button"
            disabled={!!resultado}
            onClick={() => onElegir(o.id, ok)}
            className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold transition active:scale-[0.99] ${
              marcada ? (ok ? "border-[#1E9E78] bg-[#D8F6EC]" : "border-[#D52B1E] bg-[#FBE2DF]") : "border-[#C9DCD8] bg-white hover:border-[#0F4C55]"
            }`}
            lang={ronda.tipo === "indicacion" ? "gn" : undefined}
          >
            {ronda.tipo === "sintoma" ? enIdioma(o.es, idioma, femenino) : o.gn}
          </button>
        );
      })}
    </div>
  );
}

function Veredicto({
  ronda,
  resultado,
  idioma,
  femenino,
  onSeguir,
  ultimo,
}: {
  ronda: Ronda;
  resultado: NonNullable<Resultado>;
  idioma: Idioma;
  femenino: boolean;
  onSeguir: () => void;
  ultimo: boolean;
}) {
  const gn = ronda.tipo === "cuerpo" ? ronda.palabra.gn : ronda.frase.gn;
  const es = ronda.tipo === "cuerpo" ? ronda.palabra.es : ronda.frase.es;
  const titulo = resultado.ok ? t("correcto", idioma) : resultado.porTiempo ? t("seAcabo", idioma) : t("incorrecto", idioma);
  return (
    <div
      className="cj-enter rounded-3xl p-4 text-white shadow-xl"
      style={{ background: resultado.ok ? "#14614F" : "#7A1F17" }}
      role="status"
    >
      <p className="font-display text-xl font-bold">{titulo}</p>
      <p className="mt-1 text-base">
        <span className="font-bold" lang="gn">
          {gn}
        </span>{" "}
        <span className="opacity-80">= {enIdioma(es, idioma, femenino)}</span>
      </p>
      <button
        type="button"
        onClick={onSeguir}
        autoFocus
        className="mt-3 h-12 w-full rounded-xl bg-white text-base font-bold transition active:scale-[0.98]"
        style={{ color: resultado.ok ? "#14614F" : "#7A1F17" }}
      >
        {ultimo ? t("resumen", idioma) : t("siguiente", idioma)}
      </button>
    </div>
  );
}

function Fin({
  idioma,
  aciertos,
  atendidos,
  total,
  racha,
  puntos,
  xp,
  onOtro,
  partida,
}: {
  idioma: Idioma;
  aciertos: number;
  atendidos: number;
  total: number;
  racha: number;
  puntos: number;
  xp: number;
  onOtro: () => void;
  partida: Partida;
}) {
  const e = estrellas(aciertos, total);
  return (
    <section className="cj-enter pt-4 text-white">
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#062A2E] shadow-2xl">
        <Ecg velocidad={2.4} alto={70} />
        <div className="px-6 pb-6 text-center">
          <h2 className="font-display text-3xl font-bold">{t("resumen", idioma)}</h2>
          <div className="mt-3 flex justify-center gap-2" aria-label={`${e} de 3`}>
            {[1, 2, 3].map((k) => (
              <svg key={k} viewBox="0 0 24 24" className="h-10 w-10" aria-hidden>
                <path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill={k <= e ? C.ambar : "#ffffff22"} />
              </svg>
            ))}
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-left">
            <div className="rounded-2xl bg-white/10 p-3">
              <dt className="text-xs text-white/70">{t("atendidos", idioma)}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">
                {aciertos}/{atendidos}
              </dd>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <dt className="text-xs text-white/70">{t("racha", idioma)}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">{racha}</dd>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <dt className="text-xs text-white/70">{t("puntos", idioma)}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">{puntos}</dd>
            </div>
          </dl>
          {xp > 0 && <p className="mt-4 text-sm text-white/80">+{xp} XP</p>}
        </div>
      </div>
      <RetoFinal partida={partida} puntaje={aciertos} total={total} className="mt-5" />
      <button
        type="button"
        onClick={onOtro}
        className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl tap-3d-dark text-lg font-bold text-[#062A2E] shadow-lg transition active:scale-[0.98]"
        style={{ background: C.fosforo }}
      >
        <RotateCcw className="h-5 w-5" /> {t("otroTurno", idioma)}
      </button>
      <Link to="/juegos" className="mt-3 block text-center text-sm text-white/70 hover:text-white">
        {idioma === "es" ? "Volver a los juegos" : "Voltar aos jogos"}
      </Link>
    </section>
  );
}
