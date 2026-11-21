import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameStage } from "@/components/games/game-stage";
import { LessonFilter, NotEnough, useGameWords } from "@/components/games/game-shell";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import { castellano } from "@/lib/significado";
import type { GameWord } from "@/lib/games.functions";
import { esLetraCorrecta, estrellas, letras, PALABRAS_POR_RONDA, resultado } from "@/lib/teclea";
import jaiImg from "@/assets/jai/jai-bienvenida.webp";

export const Route = createFileRoute("/_authenticated/juegos/teclea")({
  head: () => ({
    meta: [
      { title: "Jai Teclea · Aprendé a escribir en guaraní | Jaikuaa" },
      { name: "description", content: "Juego de mecanografía: escribí palabras en guaraní con puso y nasales, y Jai corre por el sendero." },
      { property: "og:title", content: "Jai Teclea | Jaikuaa" },
      { property: "og:description", content: "Escribí bien en guaraní jugando: cada letra hace correr a Jai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TecleaPage,
});

const ESPECIALES = ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ", "g̃", "'", "ñ"];

const CSS = `
.tc-jai { transition: left .35s cubic-bezier(.2,.8,.2,1); }
.tc-salto { animation: tc-salto .5s ease-out; }
@keyframes tc-salto { 40% { transform: translateY(-38px) rotate(-6deg) } }
.tc-error { animation: tc-error .3s; }
@keyframes tc-error { 25%,75% { transform: translateX(-6px) } 50% { transform: translateX(6px) } }
@media (prefers-reduced-motion: reduce) { .tc-jai, .tc-salto, .tc-error { animation: none !important; transition: none !important; } }
`;

function mezclar<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

function TecleaPage() {
  const [lesson, setLesson] = useState<number | null>(null);
  const [ronda, setRonda] = useState(0);
  const q = useGameWords(lesson);
  const pool = useMemo(
    () => (q.data?.words ?? []).filter((w) => !/\s/.test(w.gn.trim()) && letras(w.gn).length <= 14),
    [q.data],
  );
  const palabras = useMemo(() => mezclar(pool).slice(0, PALABRAS_POR_RONDA), [pool, ronda]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GameStage
      title="Jai Teclea"
      css={CSS}
      background="linear-gradient(180deg, #CDEBF5 0%, #EAF6EC 55%, #7FB069 55%, #4E7F3A 100%)"
      ink="#13294B"
    >
      <div className="flex justify-center">
        <LessonFilter value={lesson} onChange={(v) => { setLesson(v); setRonda((r) => r + 1); }} />
      </div>
      <div className="mt-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : palabras.length < 3 ? (
          <NotEnough min={3} />
        ) : (
          <Carrera key={ronda} palabras={palabras} onOtra={() => setRonda((r) => r + 1)} />
        )}
      </div>
    </GameStage>
  );
}

function Carrera({ palabras, onOtra }: { palabras: GameWord[]; onOtra: () => void }) {
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [ok, setOk] = useState(0);
  const [mal, setMal] = useState(0);
  const [salto, setSalto] = useState(0);
  const [error, setError] = useState(0);
  const [inicio, setInicio] = useState<number | null>(null);
  const [fin, setFin] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const palabra = palabras[idx];
  const ls = useMemo(() => (palabra ? letras(palabra.gn) : []), [palabra]);
  const terminado = fin !== null;

  useEffect(() => { input.current?.focus(); }, []);

  function teclear(texto: string) {
    if (terminado || !palabra) return;
    if (inicio === null) setInicio(Date.now());
    let p = pos;
    let i = idx;
    for (const l of letras(texto)) {
      const esperada = letras(palabras[i]!.gn)[p];
      if (esperada === undefined) break;
      if (esLetraCorrecta(esperada, l)) {
        setOk((n) => n + 1);
        p++;
        const total = letras(palabras[i]!.gn).length;
        if (p >= total) {
          void playGuarani(palabras[i]!.gn);
          setSalto((n) => n + 1);
          p = 0;
          i++;
          if (i >= palabras.length) {
            setFin(Date.now());
            break;
          }
        }
      } else {
        setMal((n) => n + 1);
        setError((n) => n + 1);
        if (navigator.vibrate) navigator.vibrate(40);
        break;
      }
    }
    setPos(p);
    setIdx(Math.min(i, palabras.length - 1));
  }

  const avance = terminado ? 1 : (idx + (ls.length ? pos / ls.length : 0)) / palabras.length;
  const r = resultado(ok, mal, (fin ?? Date.now()) - (inicio ?? Date.now()));
  const est = estrellas(r.precision);

  useEffect(() => {
    if (terminado && est > 0) recordCompletion({ source: "game", sourceRef: "teclea", xp: 10 });
  }, [terminado]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Sendero */}
      <div className="relative h-32 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 to-emerald-100 ring-1 ring-black/10" aria-hidden>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-[#B9824A]" />
        {palabras.map((_, k) => (
          <span key={k} className="absolute bottom-8 h-5 w-3 rounded-t-full bg-[#4E7F3A]" style={{ left: `${8 + ((k + 1) / palabras.length) * 84}%` }} />
        ))}
        <span className="absolute bottom-8 right-2 h-14 w-1.5 bg-[#13294B]" />
        <span className="absolute bottom-[4.6rem] right-2 h-4 w-8 rounded-sm bg-[#C8102E]" />
        <img
          key={salto}
          src={jaiImg}
          alt=""
          className={`tc-jai absolute bottom-6 h-20 w-20 object-contain ${salto ? "tc-salto" : ""}`}
          style={{ left: `calc(${avance * 84}% )` }}
        />
      </div>

      <p className="mt-3 text-center text-sm font-semibold">
        Palabra {Math.min(idx + 1, palabras.length)} de {palabras.length} · {r.precision}% de aciertos
      </p>

      {!terminado && palabra && (
        <div key={error} className={`mt-3 rounded-3xl bg-white p-5 text-center shadow-sm ${error ? "tc-error" : ""}`}>
          <p className="font-display text-4xl font-bold tracking-wide sm:text-5xl" aria-label={palabra.gn}>
            {ls.map((l, k) => (
              <span key={k} className={k < pos ? "text-emerald-600" : k === pos ? "rounded bg-[#F6C445] px-0.5 text-[#13294B]" : "text-[#13294B]/50"}>
                {l}
              </span>
            ))}
          </p>
          <p className="mt-2 text-sm text-[#13294B]/70">{castellano(palabra)}</p>
          <input
            ref={input}
            value=""
            onChange={(e) => teclear(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Escribí la palabra"
            placeholder="Tocá acá y escribí"
            className="mt-4 h-12 w-full rounded-xl border-2 border-[#13294B]/20 bg-[#F7FAFC] text-center text-lg text-[#13294B] outline-none focus:border-[#1E3A5F]"
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {ESPECIALES.map((l) => (
              <button
                key={l}
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => { teclear(l); input.current?.focus(); }}
                className="h-11 min-w-11 rounded-xl bg-[#1E3A5F] px-3 font-display text-lg font-bold text-white"
              >
                {l === "'" ? "puso '" : l}
              </button>
            ))}
          </div>
        </div>
      )}

      {terminado && (
        <div className="mt-3 rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="flex justify-center gap-1" aria-label={`${est} de 3 estrellas`}>
            {[1, 2, 3].map((n) => (
              <Star key={n} className="h-9 w-9" style={{ color: "#E0A100", fill: n <= est ? "#E0A100" : "transparent" }} />
            ))}
          </div>
          <p className="mt-2 font-display text-2xl font-bold">¡Llegaste a la meta!</p>
          <p className="mt-1 text-sm">{r.lpm} letras por minuto · {r.precision}% de aciertos</p>
          {est === 0 && <p className="mt-1 text-sm">Con 70% de aciertos o más ganás tus puntos. ¡Probá de nuevo!</p>}
          <Button variant="success" size="lg" className="mt-4" onClick={onOtra}>Otra carrera</Button>
        </div>
      )}
    </div>
  );
}
