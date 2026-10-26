import { createFileRoute, Link } from "@tanstack/react-router";
import { GameStage } from "@/components/games/game-stage";
import { COVER_TONE, GameCover, type CoverId } from "@/components/games/game-covers";
import { useRecordVisit } from "@/lib/gamification";
import jaiImg from "@/assets/jai-gamer.webp";
import jaiDoctor from "@/assets/jai-doctor.webp";

export const Route = createFileRoute("/_authenticated/juegos/")({
  head: () => ({
    meta: [
      { title: "Juegos | Jaikuaa" },
      { name: "description", content: "Jugá con palabras en guaraní: consultorio, karaoke, cocina, cine, penales, ahorcado, duelos y más." },
      { property: "og:title", content: "Juegos | Jaikuaa" },
      { property: "og:description", content: "Juegos de palabras en guaraní con audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesHome,
});

type Game = { id: CoverId; to: string; title: string; desc: string; xp: string; nuevo?: boolean };

const GAMES: Game[] = [
  { id: "consultorio", to: "/juegos/consultorio", title: "Consultorio de Jai", desc: "Guaraní médico: atendé pacientes que hablan guaraní. En español y portugués.", xp: "≤20 XP", nuevo: true },
  { id: "karaoke", to: "/juegos/karaoke", title: "Purahéi Karaoke", desc: "Cantá al ritmo del arpa y completá el verso a tiempo.", xp: "≤20 XP", nuevo: true },
  { id: "tembiu", to: "/juegos/tembiu", title: "Tembi'u Paraguái", desc: "Armá los platos típicos con sus ingredientes.", xp: "≤20 XP", nuevo: true },
  { id: "taanga", to: "/juegos/taanga", title: "Ta'anga · Claqueta de Jai", desc: "Sé guionista: completá el diálogo de cada escena.", xp: "≤20 XP", nuevo: true },
  { id: "tekojoja", to: "/juegos/tekojoja", title: "Tekojoja · Juzgado de Paz", desc: "Resolvé casos y aprendé términos jurídicos.", xp: "≤20 XP", nuevo: true },
  { id: "nee-rape", to: "/juegos/nee-rape", title: "Ñe'ẽ Rape · A distancia", desc: "Desafiá por WhatsApp: cada uno desde su celular.", xp: "≤20 XP", nuevo: true },
  { id: "penales", to: "/juegos/penales", title: "Penales", desc: "Respondé la palabra y pateá al arco. Solo o en duelo.", xp: "≤20 XP" },
  { id: "duelo", to: "/juegos/duelo", title: "Duelo Cara a Cara", desc: "Dos jugadores, un celular: el más rápido gana.", xp: "≤20 XP" },
  { id: "trivia-duelo", to: "/juegos/trivia-duelo", title: "Duelo de Trivia", desc: "¿Quién sabe más del Paraguay?", xp: "≤20 XP" },
  { id: "ahorcado", to: "/juegos/ahorcado", title: "Ahorcado con chipas", desc: "Adiviná la palabra antes de quedarte sin chipas.", xp: "≤15 XP" },
  { id: "sopa-de-letras", to: "/juegos/sopa-de-letras", title: "Sopa de letras", desc: "Encontrá 6 palabras escondidas.", xp: "20 XP" },
  { id: "memoria", to: "/juegos/memoria", title: "Memoria", desc: "Uní cada palabra con su significado.", xp: "≤20 XP" },
  { id: "palabra-del-dia", to: "/juegos/palabra-del-dia", title: "Palabra del día", desc: "Escuchala y elegí su significado.", xp: "5 XP" },
];

const SHELVES: { title: string; bajada: string; items: CoverId[] }[] = [
  { title: "Cultura paraguaya", bajada: "Música, cocina, cine y fútbol", items: ["karaoke", "tembiu", "taanga", "penales"] },
  { title: "Guaraní para el trabajo", bajada: "Salud y justicia", items: ["consultorio", "tekojoja"] },
  { title: "De a dos", bajada: "En el mismo celular o a distancia", items: ["nee-rape", "duelo", "trivia-duelo"] },
  { title: "Clásicos rápidos", bajada: "Cinco minutos por día", items: ["palabra-del-dia", "ahorcado", "sopa-de-letras", "memoria"] },
];

const CSS = `
.vit-card { transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s; }
.vit-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -18px rgba(0,0,0,.7); }
.vit-card:hover .vit-art { transform: scale(1.05); }
.vit-art { transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.vit-row { scrollbar-width: none; }
.vit-row::-webkit-scrollbar { display: none; }
.vit-jai { animation: vit-bob 3s ease-in-out infinite; }
@keyframes vit-bob { 50% { transform: translateY(-6px) } }
.vit-lights span { animation: vit-blink 1.6s steps(2) infinite; }
.vit-lights span:nth-child(2n) { animation-delay: .8s; }
@keyframes vit-blink { 50% { opacity: .25 } }
@media (prefers-reduced-motion: reduce) { .vit-card, .vit-art, .vit-jai, .vit-lights span { animation: none !important; transition: none !important; } }
`;

const byId = (id: CoverId) => GAMES.find((g) => g.id === id)!;

function GamesHome() {
  useRecordVisit("juegos");
  const destacado = byId("consultorio");
  return (
    <GameStage
      title="Juegos"
      background="radial-gradient(120% 60% at 50% 0%, #1E3A6B 0%, #0D1B33 55%, #0A1426 100%)"
      css={CSS}
      wide
      back={{ to: "/dashboard", label: "← Tablero" }}
    >
      {/* Marquesina */}
      <section className="relative pt-2 sm:pt-6">
        <div className="vit-lights flex justify-center gap-3 sm:gap-5" aria-hidden>
          {Array.from({ length: 13 }, (_, i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: i % 3 === 0 ? "#D52B1E" : i % 3 === 1 ? "#F6C445" : "#FFFFFF" }} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 sm:gap-8">
          <img src={jaiImg} alt="Jai, el jaguarete" className="vit-jai h-28 w-28 object-contain drop-shadow-2xl sm:h-52 sm:w-52" />
          <div>
            <h1 className="font-display text-5xl font-bold leading-none tracking-tight sm:text-7xl">Juegos</h1>
            <p className="mt-2 text-sm text-white/75 sm:mt-3 sm:text-lg">
              {GAMES.length} juegos para aprender guaraní jugando, solo o de a dos.
            </p>
          </div>
        </div>
      </section>

      {/* Destacado */}
      <Link
        to={destacado.to}
        className="vit-card mt-6 grid overflow-hidden rounded-3xl ring-1 ring-white/10 sm:grid-cols-[1.2fr_1fr]"
        style={{ background: COVER_TONE[destacado.id].bg }}
      >
        <div className="relative overflow-hidden">
          <GameCover id={destacado.id} fit className="vit-art block aspect-[16/9] h-full w-full sm:aspect-[4/3]" />
          <img src={jaiDoctor} alt="Jai, el doctor del consultorio" className="absolute bottom-0 right-2 h-[92%] w-auto drop-shadow-2xl sm:right-6" />
        </div>
        <div className="flex flex-col justify-center gap-2 p-5 sm:gap-3 sm:p-8">
          <span className="w-fit rounded-full bg-[#F6C445] px-3 py-1 text-xs font-bold text-[#3A1A05]">Nuevo</span>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{destacado.title}</h2>
          <p className="text-white/80">{destacado.desc}</p>
          <span className="mt-2 inline-flex h-12 w-fit items-center rounded-2xl bg-[#3DE0B0] px-6 font-bold text-[#062A2E]">Empezar el turno</span>
        </div>
      </Link>

      {SHELVES.map((s) => (
        <section key={s.title} className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">{s.title}</h2>
            <p className="text-sm text-white/60">{s.bajada}</p>
          </div>
          <div className="vit-row -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {s.items.map((id) => (
              <Cover key={id} g={byId(id)} />
            ))}
          </div>
        </section>
      ))}
    </GameStage>
  );
}

function Cover({ g }: { g: Game }) {
  const tone = COVER_TONE[g.id];
  return (
    <Link
      to={g.to}
      className="vit-card relative flex w-[72%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl ring-1 ring-white/10 sm:w-[44%] lg:w-auto"
      style={{ background: tone.bg, color: tone.ink }}
    >
      <div className="overflow-hidden">
        <GameCover id={g.id} className="vit-art block aspect-[4/3] w-full" />
      </div>
      {g.nuevo && g.id !== "consultorio" && (
        <span className="absolute left-3 top-3 rounded-full bg-[#F6C445] px-2.5 py-0.5 text-[11px] font-bold text-[#3A1A05]">Nuevo</span>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-lg font-bold leading-tight">{g.title}</h3>
        <p className="line-clamp-2 text-sm opacity-80">{g.desc}</p>
        <p className="mt-auto pt-2 text-xs font-semibold opacity-70">{g.xp}</p>
      </div>
    </Link>
  );
}
