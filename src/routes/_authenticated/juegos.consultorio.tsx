import { createFileRoute, Link } from "@tanstack/react-router";
import { QuitGameButton } from "@/components/games/quit-game-button";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RotateCcw, Stethoscope, Volume2, ArrowLeft } from "lucide-react";
import { GameKit, GameSoundButton, useGameKit } from "@/components/games/game-kit";
import { useGameWords } from "@/components/games/game-shell";
import { recordCompletion } from "@/lib/gamification";
import { playGuarani, prefetchAudio } from "@/lib/audio";
import { callarVoz } from "@/lib/voz-unica";
import { useMostrador } from "@/lib/use-mostrador";
import { playFrase, prefetchFrases } from "@/lib/mostrador-audio";
import {
  armarTurno,
  enIdioma,
  estrellas,
  paciente as nuevoPaciente,
  PACIENTES_POR_TURNO,
  puntosConTriage,
  TRIAGE,
  triageDe,
  type Triage,
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
import { CaraPaciente } from "@/components/games/consultorio/paciente-ilustrado";
import { LaminaCuerpo } from "@/components/games/consultorio/lamina-cuerpo";
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
@media (prefers-reduced-motion: reduce) { .cj-ecg, .cj-pulse, .cj-flat, .cj-enter { animation: none !important; } }
`;

type Historia = { nombre: string; femenino: boolean; gn: string; es: string; ok: boolean; triage: Triage };
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
  const [triages, setTriages] = useState<Triage[]>([]);
  const [historia, setHistoria] = useState<Historia[]>([]);
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
  const tri: Triage = triages[i] ?? "verde";
  const segTotal = TRIAGE[tri].segundos;

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
    // Las voces de todo el turno se bajan ya, así cada paciente habla apenas llega (sin esperar segundos).
    for (const r of rs) if (r.tipo === "cuerpo") void prefetchAudio(r.palabra.gn);
    setRondas(rs);
    // Con la misma semilla: en un reto, los dos jugadores ven los mismos pacientes.
    setPacientes(rs.map((r, k) => nuevoPaciente(k, rnd, r)));
    setTriages(rs.map(() => triageDe(rnd)));
    setHistoria([]);
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
    setRestante(segTotal);
    const id = window.setTimeout(() => sonar(ronda), 450);
    return () => window.clearTimeout(id);
  }, [fase, i, ronda, sonar, segTotal]);

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
      if (pac) {
        const gn = ronda.tipo === "cuerpo" ? ronda.palabra.gn : ronda.frase.gn;
        const es = ronda.tipo === "cuerpo" ? ronda.palabra.es : ronda.frase.es;
        setHistoria((h) => [...h, { nombre: pac.nombre, femenino: pac.femenino, gn, es, ok, triage: tri }]);
      }
      if (ok) {
        const nr = racha + 1;
        setRacha(nr);
        setMejorRacha((m) => Math.max(m, nr));
        setAciertos((n) => n + 1);
        setPuntos((p) => p + puntosConTriage(Math.floor(restante), nr, tri));
        react("success");
        if (ronda.tipo === "indicacion") void playFrase(ronda.frase.id, urls[ronda.frase.id]);
      } else {
        setRacha(0);
        setVidas((v) => v - 1);
        react("error");
      }
    },
    [resultado, ronda, racha, restante, react, urls, pac, tri],
  );

  useEffect(() => {
    if (fase === "jugando" && !resultado && restante <= 0) responder(false, undefined, true);
  }, [restante, fase, resultado, responder]);

  function siguiente() {
    callarVoz(); // lo que decía el paciente anterior se corta al pasar al siguiente
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
        <Link to="/juegos" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Juegos
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
        {fase === "intro" && <RetoBanner partida={partida} className="mt-4" onJugar={empezar} />}
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
              segTotal={segTotal}
            />
            <Ficha key={i} p={pac} triage={tri} ronda={ronda} idioma={idioma} onEscuchar={() => sonar(ronda)} resultado={resultado}>
              {ronda.tipo === "cuerpo" && (
                <LaminaCuerpo
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
            historia={historia}
            partida={partida}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------ Niveles ------------------------------ */

const NIVELES = [
  {
    id: "basico",
    es: "Básico", pt: "Básico",
    sub: { es: "Partes del cuerpo, con voz real", pt: "Partes do corpo, com voz real" },
    temas: { es: ["Cabeza, ojos, nariz, boca, oído y pie"], pt: ["Cabeça, olhos, nariz, boca, ouvido e pé"] },
    listo: true,
  },
  {
    id: "intermedio",
    es: "Intermedio", pt: "Intermediário",
    sub: { es: "Consulta de guardia", pt: "Consulta de plantão" },
    temas: {
      es: ["Saludo y datos del paciente", "Dónde duele y desde cuándo", "Fiebre, tos y presión", "Antecedentes familiares"],
      pt: ["Saudação e dados do paciente", "Onde dói e desde quando", "Febre, tosse e pressão", "Antecedentes familiares"],
    },
    listo: false,
  },
  {
    id: "avanzado",
    es: "Avanzado", pt: "Avançado",
    sub: { es: "Especialidades", pt: "Especialidades" },
    temas: {
      es: ["Diabetes e hipertensión", "Embarazo y control prenatal", "Pediatría", "Indicaciones y medicamentos"],
      pt: ["Diabetes e hipertensão", "Gravidez e pré-natal", "Pediatria", "Indicações e medicamentos"],
    },
    listo: false,
  },
] as const;

function Niveles({ idioma }: { idioma: Idioma }) {
  const [abierto, setAbierto] = useState<string>("basico");
  const L = idioma === "es" ? "es" : "pt";
  return (
    <div className="mt-5">
      <h2 className="font-display text-lg font-bold text-white">{L === "es" ? "Elegí tu nivel" : "Escolha seu nível"}</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {NIVELES.map((n) => {
          const activo = abierto === n.id;
          return (
            <button
              key={n.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setAbierto(n.id)}
              className={`rounded-2xl border p-3 text-left transition ${activo ? "border-white bg-white/15" : "border-white/15 bg-white/5"}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{n[L]}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${n.listo ? "bg-white text-[#062A2E]" : "bg-[#F2B544]/20 text-[#FBE3A6]"}`}>
                  {n.listo ? (L === "es" ? "Se juega" : "Disponível") : L === "es" ? "En desarrollo" : "Em desenvolvimento"}
                </span>
              </span>
              <span className="mt-1 block text-sm text-white/75">{n.sub[L]}</span>
            </button>
          );
        })}
      </div>
      {NIVELES.filter((n) => n.id === abierto).map((n) => (
        <div key={n.id} className="mt-3 rounded-2xl bg-white/10 p-4 text-sm text-white/85">
          <ul className="list-disc space-y-1 pl-5">
            {n.temas[L].map((tm) => <li key={tm}>{tm}</li>)}
          </ul>
          {!n.listo && (
            <p className="mt-3 text-[#FBE3A6]">
              {L === "es"
                ? "Basado en la obra Tesãirã del Dr. Carlos Ferreira. Revisión del autor y grabación con voces reales en curso."
                : "Baseado na obra Tesãirã do Dr. Carlos Ferreira. Revisão do autor e gravação com vozes reais em andamento."}
            </p>
          )}
        </div>
      ))}
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
          <span className="block font-semibold text-white">{idioma === "es" ? "Triage de guardia" : "Triagem"}</span>
          {idioma === "es" ? "emergencia: menos tiempo, más puntos" : "emergência: menos tempo, mais pontos"}
        </li>
        <li className="rounded-2xl bg-white/10 p-3">
          <span className="block font-semibold text-white">{VIDAS} vidas</span>
          {idioma === "es" ? "un error cuesta una" : "cada erro custa uma"}
        </li>
      </ul>
      <Niveles idioma={idioma} />
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
  segTotal,
}: {
  segTotal: number;
  restante: number;
  vidas: number;
  puntos: number;
  racha: number;
  n: number;
  total: number;
  resultado: Resultado;
  idioma: Idioma;
}) {
  const urgente = restante <= Math.min(6, segTotal / 2) && !resultado;
  const vel = resultado ? 2.4 : Math.max(0.7, (restante / segTotal) * 2.4);
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

function Ficha({
  p,
  triage,
  ronda,
  idioma,
  onEscuchar,
  resultado,
  children,
}: {
  p: Paciente;
  triage: Triage;
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
        <CaraPaciente paciente={p} className="h-20 w-20 shrink-0 ring-4 ring-white shadow-md" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-bold leading-tight">{p.nombre}</p>
          <p className="text-sm opacity-70">
            {p.edad} {idioma === "es" ? "años" : "anos"}
          </p>
          <span className="mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: "#FCE7B0", color: "#6A4A00" }}>
            {motivo}
          </span>
          <span className="ml-1.5 mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: TRIAGE[triage].color }}>
            <span className={`h-2 w-2 rounded-full bg-white ${triage === "rojo" ? "animate-pulse" : ""}`} aria-hidden />
            {idioma === "es" ? "Triage" : "Triagem"}: {TRIAGE[triage][idioma]} · {TRIAGE[triage].segundos} s{TRIAGE[triage].mult > 1 ? ` · ×${TRIAGE[triage].mult}` : ""}
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
  historia,
}: {
  historia: Historia[];
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
      {historia.length > 0 && (
        <div className="mt-5 rounded-3xl p-5 shadow-2xl" style={{ background: C.ficha, color: C.tinta }}>
          <h3 className="font-display text-xl font-bold">{idioma === "es" ? "Historia clínica del turno" : "Prontuário do plantão"}</h3>
          <p className="text-xs opacity-70">{idioma === "es" ? "Repasá lo que escuchaste y dijiste." : "Revise o que você ouviu e disse."}</p>
          <ol className="mt-3 divide-y divide-[#C9DCD8]">
            {historia.map((h, k) => (
              <li key={k} className="flex items-start gap-3 py-2.5">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: TRIAGE[h.triage].color }} aria-label={TRIAGE[h.triage][idioma]} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{h.nombre}</p>
                  <p className="text-sm">
                    <span className="font-bold" lang="gn">{h.gn}</span> <span className="opacity-70">= {enIdioma(h.es, idioma, h.femenino)}</span>
                  </p>
                </div>
                <span className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold" style={h.ok ? { background: "#D8F6EC", color: "#14614F" } : { background: "#FBE2DF", color: "#7A1F17" }}>
                  {h.ok ? (idioma === "es" ? "Bien" : "Certo") : idioma === "es" ? "Repasar" : "Revisar"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
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
