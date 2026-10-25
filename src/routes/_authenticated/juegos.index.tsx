import { createFileRoute, Link } from "@tanstack/react-router";
import { GameShell } from "@/components/games/game-shell";
import { useRecordVisit } from "@/lib/gamification";
import { CircleDashed, Grid2X2, Layers, CalendarDays, Goal, Swords, Brain, Wifi, ChefHat, Mic, Scale, Clapperboard } from 'lucide-react';
import jaiImg from "@/assets/jai-tradicional.png";
const jaiAsset = { url: jaiImg };
import { AoPoiDivider, Terere, Chipa, Arpa, JaiPaw } from "@/components/py-icons";

export const Route = createFileRoute("/_authenticated/juegos/")({
  head: () => ({
    meta: [
      { title: "Juegos | Jaikuaa" },
      { name: "description", content: "Jugá con las palabras guaraníes validadas: duelo, penales, ahorcado, sopa de letras, memoria y palabra del día." },
      { property: "og:title", content: "Juegos | Jaikuaa" },
      { property: "og:description", content: "Juegos de palabras en guaraní con audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesHome,
});

const GAMES = [
  { to: "/juegos/taanga", tone: "football", icon: Clapperboard, title: "Ta'anga · Claqueta de Jai", desc: "Sé guionista: completá el diálogo y que Jai grite ¡Corte, quedó perfecta! Nuevo", xp: "hasta 20 XP" },
  { to: "/juegos/tekojoja", tone: "memory", icon: Scale, title: "Tekojoja · Juzgado de Paz", desc: "Resolvé casos de un Juzgado de Paz y aprendé términos jurídicos. Nuevo", xp: "hasta 20 XP" },
  { to: "/juegos/nee-rape", tone: "search", icon: Wifi, title: "Ñe'ẽ Rape · A distancia", desc: "Desafiá por WhatsApp: cada uno desde su celular. 4 senderos. Nuevo · Multijugador a distancia", xp: "hasta 20 XP" },
  { to: "/juegos/karaoke", tone: "daily", icon: Mic, title: "Purahéi Karaoke", desc: "Cantá en guaraní al ritmo del arpa y completá el verso. Nuevo", xp: "hasta 20 XP" },
  { to: "/juegos/tembiu", tone: "chipa", icon: ChefHat, title: "Tembi'u Paraguái", desc: "Armá los platos típicos: sopa paraguaya, mbeju, vori vori… Nuevo", xp: "hasta 20 XP" },
  { to: "/juegos/duelo", tone: "football", icon: Swords, title: "Duelo Cara a Cara", desc: "En el mismo celular o a distancia, cada uno desde el suyo.", xp: "hasta 20 XP" },
  { to: "/juegos/trivia-duelo", tone: "daily", icon: Brain, title: "Duelo de Trivia", desc: "¿Quién sabe más del Paraguay? Mismo celular o a distancia.", xp: "hasta 20 XP" },
  { to: "/juegos/ahorcado", tone: "chipa", icon: CircleDashed, title: "Ahorcado con chipas", desc: "Adiviná la palabra antes de que se acaben las 6 chipas.", xp: "hasta 15 XP" },
  { to: "/juegos/sopa-de-letras", tone: "search", icon: Grid2X2, title: "Sopa de letras", desc: "Encontrá 6 palabras escondidas en la grilla.", xp: "20 XP" },
  { to: "/juegos/memoria", tone: "memory", icon: Layers, title: "Memoria", desc: "Uní cada palabra en guaraní con su traducción.", xp: "hasta 20 XP" },
  { to: "/juegos/penales", tone: "football", icon: Goal, title: "Penales", desc: "Respondé la palabra y pateá al arco. Solo, Duelo o a distancia.", xp: "hasta 20 XP" },
  { to: "/juegos/palabra-del-dia", tone: "daily", icon: CalendarDays, title: "Palabra del día", desc: "Escuchala y elegí su significado. Una vez por día.", xp: "5 XP" },
] as const;

const SHELVES = [
  { title: "Clásicos rápidos", items: ["/juegos/palabra-del-dia", "/juegos/memoria", "/juegos/sopa-de-letras", "/juegos/ahorcado"] },
  { title: "Tradición, cancha y música", items: ["/juegos/penales", "/juegos/karaoke", "/juegos/tembiu", "/juegos/taanga"] },
  { title: "Duelos y casos", items: ["/juegos/tekojoja", "/juegos/nee-rape", "/juegos/duelo", "/juegos/trivia-duelo"] },
] as const;

function GamesHome() {
  useRecordVisit("juegos");
  return (
    <GameShell title="Juegos" emoji="🎮" companion={false}>
      <div className="nanduti-bg relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-elegant">
        <div className="flex items-center gap-3">
          <img src={jaiAsset.url} alt="Jai, el jaguarete" className="penalties-mascot h-16 w-16 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-foreground">¡Mba'éichapa! Soy Jai.</p>
            <p className="text-xs text-muted-foreground">Elegí un juego y aprendamos jugando.</p>
          </div>
        </div>
        <AoPoiDivider className="mt-3" />
        <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Terere size={18} />Tereré</span>
          <span className="flex items-center gap-1"><Chipa size={18} />Chipa</span>
          <span className="flex items-center gap-1"><Arpa size={18} />Arpa</span>
          <span className="flex items-center gap-1"><JaiPaw size={18} />Jai</span>
        </div>
      </div>
      {SHELVES.map((s) => (
        <section key={s.title} className="mt-5">
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">{s.title}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
            {GAMES.filter((g) => (s.items as readonly string[]).includes(g.to)).map((g) => (
              <Link
                key={g.to}
                to={g.to}
                className={`game-card game-card-${g.tone} flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-elegant card-hover hover:shadow-lift`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="game-card-icon flex h-10 w-10 items-center justify-center rounded-lg" aria-hidden><g.icon size={22} strokeWidth={1.8}/></span>
                  <span className="game-card-xp rounded-md px-1.5 py-0.5 text-[10px] font-semibold">{g.xp.replace("hasta ", "≤")}</span>
                </div>
                <div className="font-display text-sm font-bold leading-tight text-foreground">{g.title}</div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{g.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </GameShell>
  );
}
