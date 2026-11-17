import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { GameStage } from "@/components/games/game-stage";
import { LaceBackground, useGameFeedback } from "@/components/games/game-kit";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCourseLesson, listCourseLessons, type CourseVocabItem } from "@/lib/lessons.functions";
import { getCourseLessonGuest } from "@/lib/guest.functions";
import { GUEST_LESSONS, hasSessionNow } from "@/lib/guest";
import { withOfflineCache } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import { getStats, pendingLessonRefs, recordCompletion } from "@/lib/gamification";
import { logAnswer } from "@/lib/answer-log";
import { playGuarani } from "@/lib/audio";
import { actualizar, distractores, elegirRepaso, firmes, hoyPy, proximoRepaso, type EstadoRepaso } from "@/lib/repaso";
import jaiImg from "@/assets/jai-profe.webp";

export const Route = createFileRoute("/_authenticated/repaso")({
  head: () => ({
    meta: [
      { title: "Repaso de Jai | Jaikuaa" },
      { name: "description", content: "Dos minutos por día: las palabras de tus lecciones vuelven para que no se olviden." },
      { property: "og:title", content: "Repaso de Jai | Jaikuaa" },
      { property: "og:description", content: "Repasá las palabras en guaraní que ya aprendiste, con voces reales." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RepasoPage,
});

const C = { tinta: "#0F2D3A", hoja: "#FFFFFF", turquesa: "#0E7C72", rojo: "#D52B1E", sol: "#F6C445", verde: "#2F7A4A" };

const CSS = `
.rp-card { animation: rp-in .35s cubic-bezier(.2,.8,.2,1) both; }
@keyframes rp-in { from { transform: translateY(10px); opacity: 0 } }
.game-stage .game-lace-background { opacity: .18; }
@media (prefers-reduced-motion: reduce) { .rp-card { animation: none !important } }
`;

function RepasoPage() {
  return (
    <GameStage
      title="Repaso de Jai"
      css={CSS}
      ink={C.tinta}
      background="linear-gradient(180deg, #E3F7F3 0%, #C9EEE7 60%, #A9E2D8 100%)"
    >
      <LaceBackground />
      <RepasoContent />
    </GameStage>
  );
}

/* ------------------- de dónde salen las palabras ------------------- */

type Palabra = Pick<CourseVocabItem, "gn" | "es">;

/** Las palabras de las lecciones ya terminadas, en el orden en que se aprendieron. */
async function palabrasAprendidas(): Promise<{ dueño: string; palabras: Palabra[] }> {
  const conCuenta = await hasSessionNow();
  let nums: number[];
  let dueño = "invitado";
  if (conCuenta) {
    const { data } = await supabase.auth.getSession();
    dueño = data.session?.user.id ?? "cuenta";
    const { lessons } = await withOfflineCache(K.lessons, () => listCourseLessons(), { label: "El curso" });
    const pendientes = pendingLessonRefs();
    nums = lessons.filter((l) => l.completed || pendientes.has(`guarani:${l.n}`)).map((l) => l.n);
  } else {
    // Sin cuenta las lecciones se hacen en orden: las primeras N que terminó en este celular.
    const hechas = Math.min(getStats().guaraniLessonsCompleted, GUEST_LESSONS.length);
    nums = GUEST_LESSONS.slice(0, hechas) as number[];
  }
  // Alcanza con las últimas 12 lecciones: el repaso no tiene que descargar todo el curso.
  nums = [...nums].sort((a, b) => a - b).slice(-12);
  const lecciones = await Promise.all(
    nums.map((n) =>
      withOfflineCache(K.lesson(n), () => (conCuenta ? getCourseLesson({ data: { n } }) : getCourseLessonGuest({ data: { n } })), {
        label: `La lección ${n}`,
      }).catch(() => ({ lesson: null })),
    ),
  );
  const vistas = new Set<string>();
  const palabras: Palabra[] = [];
  for (const r of lecciones) {
    for (const v of r.lesson?.vocab ?? []) {
      if (!v.gn || vistas.has(v.gn)) continue;
      vistas.add(v.gn);
      palabras.push({ gn: v.gn, es: v.es });
    }
  }
  return { dueño, palabras };
}

/* ------------------- lo que recuerda el celular ------------------- */

const clave = (dueño: string) => `jaikuaa:repaso:v1:${dueño}`;

function leerEstado(dueño: string): EstadoRepaso {
  try {
    return JSON.parse(window.localStorage.getItem(clave(dueño)) || "{}") as EstadoRepaso;
  } catch {
    return {};
  }
}
function guardarEstado(dueño: string, e: EstadoRepaso) {
  try {
    window.localStorage.setItem(clave(dueño), JSON.stringify(e));
  } catch {
    /* sin almacenamiento: el repaso funciona igual, solo no recuerda para mañana */
  }
}

function fechaLinda(dia: string): string {
  const hoy = hoyPy();
  const f = new Date(`${dia}T12:00:00Z`);
  const manana = new Date(`${hoy}T12:00:00Z`);
  manana.setUTCDate(manana.getUTCDate() + 1);
  if (dia <= hoy) return "hoy";
  if (dia === manana.toISOString().slice(0, 10)) return "mañana";
  return f.toLocaleDateString("es-PY", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/* ------------------- la pantalla ------------------- */

type Pregunta = { item: Palabra; opciones: Palabra[] };

function RepasoContent() {
  const q = useQuery({ queryKey: ["repaso-palabras"], queryFn: palabrasAprendidas, staleTime: 5 * 60 * 1000 });
  const feedback = useGameFeedback();
  const [estado, setEstado] = useState<EstadoRepaso>({});
  const [ronda, setRonda] = useState<Pregunta[] | null>(null);
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const anotado = useRef(false);
  const siguienteRef = useRef<HTMLDivElement | null>(null);

  const dueño = q.data?.dueño;
  const palabras = q.data?.palabras ?? [];
  const pool = useMemo(() => palabras.map((p) => p.gn), [palabras]);

  useEffect(() => {
    if (dueño) setEstado(leerEstado(dueño));
  }, [dueño]);

  const hoy = hoyPy();
  const deHoy = useMemo(() => elegirRepaso(pool, estado, hoy), [pool, estado, hoy]);

  function empezar() {
    const porGn = new Map(palabras.map((p) => [p.gn, p]));
    const preguntas = deHoy
      .map((gn) => porGn.get(gn))
      .filter((x): x is Palabra => !!x)
      .map((item) => {
        const opciones = [item, ...distractores(item, palabras)];
        for (let k = opciones.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [opciones[k], opciones[j]] = [opciones[j]!, opciones[k]!];
        }
        return { item, opciones };
      });
    anotado.current = false;
    setAciertos(0);
    setI(0);
    setElegida(null);
    setRonda(preguntas);
    if (preguntas[0]) void playGuarani(preguntas[0].item.gn);
  }

  function responder(p: Pregunta, opcion: Palabra) {
    if (elegida || !dueño) return;
    const acerto = opcion.gn === p.item.gn;
    setElegida(opcion.gn);
    if (acerto) setAciertos((a) => a + 1);
    feedback(acerto ? "success" : "error");
    logAnswer(p.item.gn, acerto, "game", "repaso");
    const nuevo = actualizar(estado, p.item.gn, acerto, hoy);
    setEstado(nuevo);
    guardarEstado(dueño, nuevo);
    // Que «Siguiente» quede a la vista sin bajar con el dedo.
    requestAnimationFrame(() => siguienteRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  function siguiente() {
    if (!ronda) return;
    const n = i + 1;
    setI(n);
    setElegida(null);
    if (ronda[n]) void playGuarani(ronda[n]!.item.gn);
  }

  const terminado = !!ronda && i >= ronda.length;
  useEffect(() => {
    if (!terminado || anotado.current || !ronda) return;
    anotado.current = true;
    feedback("victory");
    recordCompletion({ source: "game", sourceRef: "repaso", xp: aciertos * 2 });
  }, [terminado, ronda, aciertos, feedback]);

  if (q.isLoading) {
    return (
      <div className="relative mx-auto flex max-w-xl items-center justify-center gap-2 px-4 py-24 font-semibold">
        <Loader2 className="h-5 w-5 animate-spin" /> Buscando tus palabras…
      </div>
    );
  }

  if (q.isError) {
    return (
      <Hoja>
        <p className="font-semibold">No se pudieron traer tus palabras. Revisá la conexión y probá de nuevo.</p>
        <Button className="mt-4 h-12 w-full text-base" onClick={() => void q.refetch()}>Probar de nuevo</Button>
      </Hoja>
    );
  }

  if (palabras.length < 4) {
    return (
      <Hoja>
        <Jai />
        <h2 className="mt-2 text-center font-display text-2xl font-bold">Primero, una lección</h2>
        <p className="mt-2 text-center">El repaso usa las palabras de las lecciones que ya terminaste. Hacé la primera y mañana Jai te las vuelve a preguntar.</p>
        <Button asChild variant="cta" className="mt-5 h-14 w-full text-base">
          <Link to="/curso/$lang/leccion/$n" params={{ lang: "guarani", n: "1" }}>Empezar la lección 1</Link>
        </Button>
      </Hoja>
    );
  }

  // Pantalla final.
  if (terminado && ronda) {
    const proximo = proximoRepaso(pool, estado);
    return (
      <Hoja>
        <Jai />
        <h2 className="mt-2 text-center font-display text-3xl font-bold">¡Repaso hecho!</h2>
        <p className="mt-2 text-center text-lg">
          Acertaste <b>{aciertos}</b> de <b>{ronda.length}</b>.
        </p>
        <p className="mt-3 text-center">Las que te costaron vuelven mañana; las que ya sabés, en unos días.</p>
        <p className="mt-1 text-center text-sm opacity-80">
          Palabras firmes: {firmes(pool, estado)} de {pool.length}. {proximo ? `Próximo repaso: ${fechaLinda(proximo)}.` : ""}
        </p>
        <Button asChild variant="cta" className="mt-5 h-14 w-full text-base">
          <Link to="/juegos">Seguir jugando</Link>
        </Button>
      </Hoja>
    );
  }

  // Pregunta en curso.
  if (ronda && ronda[i]) {
    const p = ronda[i]!;
    return (
      <div className="relative mx-auto max-w-xl px-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold">Palabra {i + 1} de {ronda.length}</span>
          <div className="flex gap-1.5" aria-hidden>
            {ronda.map((_, k) => (
              <span key={k} className="h-2.5 w-6 rounded-full" style={{ background: k < i ? C.turquesa : k === i ? C.sol : "rgba(15,45,58,.18)" }} />
            ))}
          </div>
        </div>
        <div key={i} className="rp-card mt-3 rounded-3xl p-5 shadow-[0_6px_0_rgba(14,124,114,.25)]" style={{ background: C.hoja }}>
          <p className="text-sm font-bold opacity-75">¿Qué significa?</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="font-display text-4xl font-bold leading-tight break-words">{p.item.gn}</span>
            <SpeakerButton gn={p.item.gn} size="md" />
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {p.opciones.map((o) => {
            const esLaCorrecta = o.gn === p.item.gn;
            const marcada = elegida === o.gn;
            const estilo = !elegida
              ? { background: C.hoja, borderColor: "rgba(15,45,58,.15)" }
              : esLaCorrecta
                ? { background: "#E6F5EA", borderColor: C.verde }
                : marcada
                  ? { background: "#FDECEA", borderColor: C.rojo }
                  : { background: C.hoja, borderColor: "rgba(15,45,58,.1)", opacity: 0.55 };
            return (
              <button
                key={o.gn}
                type="button"
                disabled={!!elegida}
                onClick={() => responder(p, o)}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-semibold"
                style={estilo}
              >
                <span>{o.es}</span>
                {elegida && esLaCorrecta && <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: C.verde }} aria-label="Correcta" />}
                {elegida && marcada && !esLaCorrecta && <XCircle className="h-6 w-6 shrink-0" style={{ color: C.rojo }} aria-label="Elegiste esta" />}
              </button>
            );
          })}
        </div>
        {elegida && (
          <>
            <div
              ref={siguienteRef}
              className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0"
            >
              <div className="mx-auto max-w-xl">
                <p className="mb-2 text-base font-semibold">
                  {elegida === p.item.gn ? "¡Iporã! Muy bien." : `Era «${p.item.es}». Vuelve mañana para que no se te olvide.`}
                </p>
                <Button variant="cta" className="h-14 w-full text-base" onClick={siguiente}>
                  {i + 1 < ronda.length ? "Siguiente" : "Terminar"}
                </Button>
              </div>
            </div>
            <div aria-hidden className="h-40 sm:hidden" />
          </>
        )}
      </div>
    );
  }

  // Inicio.
  const proximo = proximoRepaso(pool, estado);
  return (
    <Hoja>
      <Jai />
      <h1 className="mt-2 text-center font-display text-3xl font-bold">Repaso de Jai</h1>
      {deHoy.length > 0 ? (
        <>
          <p className="mt-2 text-center text-lg">
            Hoy te tocan <b>{deHoy.length}</b> palabras. Son dos minutos.
          </p>
          <p className="mt-2 text-center text-sm opacity-80">Respondé antes de ver la respuesta: así es como mejor se recuerda.</p>
          <Button variant="cta" className="mt-5 h-14 w-full text-lg" onClick={empezar}>
            Empezar el repaso
          </Button>
        </>
      ) : (
        <>
          <p className="mt-2 text-center text-lg">Por hoy ya repasaste todo.</p>
          <p className="mt-1 text-center text-sm opacity-80">
            {proximo ? `Tu próximo repaso es ${fechaLinda(proximo)}.` : ""} Mientras tanto, una lección nueva suma palabras.
          </p>
          <Button asChild variant="cta" className="mt-5 h-14 w-full text-base">
            <Link to="/curso/$lang" params={{ lang: "guarani" }}>Ir al curso</Link>
          </Button>
        </>
      )}
      <p className="mt-4 text-center text-xs opacity-70">
        Palabras firmes: {firmes(pool, estado)} de {pool.length}. Tu repaso se guarda en este celular.
      </p>
    </Hoja>
  );
}

function Hoja({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-md px-4 pt-4">
      <div className="rp-card rounded-3xl p-6 shadow-[0_6px_0_rgba(14,124,114,.25)]" style={{ background: C.hoja }}>
        {children}
      </div>
    </div>
  );
}

function Jai() {
  return <img src={jaiImg} alt="Jai, el jaguareté maestro" className="mx-auto h-28 w-28 object-contain" />;
}
