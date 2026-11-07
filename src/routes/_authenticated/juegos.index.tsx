import { createFileRoute, Link } from "@tanstack/react-router";
import { LanzamientoBanner } from "@/components/lanzamiento-banner";
import { RetoCard } from "@/components/games/reto-card";
import { MetaDiaria } from "@/components/meta-diaria";
import { GameStage } from "@/components/games/game-stage";
import { COVER_TONE, type CoverId } from "@/components/games/game-covers";
import { COVER_IMAGE } from "@/components/games/game-cover-images";
import { useRecordVisit, useStats } from "@/lib/gamification";
import jaiImg from "@/assets/jai-gamer.webp";
import { useEffect, useState } from "react";
import { precargarPenales } from "@/components/games/penalties/sprites";
import { authMode, isGuestPath, useIsGuest } from "@/lib/guest";
import { GAME_DESC, SHELF_TEXT, gameTitle, useGT } from "@/lib/i18n-games";

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

/** `pronto`: el juego está armado pero todavía sin contenido publicado (se ve, pero se marca «Muy pronto»). */
type Game = { id: CoverId; to: string; title: string; desc: string; xp: string; nuevo?: boolean; pronto?: boolean };

const GAMES: Game[] = [
  { id: "consultorio", to: "/juegos/consultorio", title: "Consultorio de Jai", desc: "Guaraní médico: atendé pacientes que hablan guaraní. En español y portugués.", xp: "≤20 XP", nuevo: true },
  { id: "ventanilla", to: "/juegos/ventanilla", title: "Ventanilla de Jai", desc: "Atención al público: atendé la fila en guaraní, como en un banco o una oficina.", xp: "≤20 XP", pronto: true },
  { id: "chacra", to: "/juegos/chacra", title: "Jai en la chacra", desc: "Sos técnico de campo: entendé lo que necesita cada productor.", xp: "≤20 XP", nuevo: true },
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

const SHELVES: { key: string; title: string; bajada: string; items: CoverId[] }[] = [
  { key: "estreno", title: "Lo nuevo", bajada: "Recién salidos del horno", items: ["consultorio", "tembiu", "penales"] },
  { key: "cultura", title: "Cultura paraguaya", bajada: "Música, cocina, cine y fútbol", items: ["karaoke", "tembiu", "taanga", "penales"] },
  { key: "trabajo", title: "Guaraní para el trabajo", bajada: "Salud, atención al público, campo y justicia", items: ["consultorio", "ventanilla", "chacra", "tekojoja"] },
  { key: "dos", title: "De a dos", bajada: "En el mismo celular o cada uno en el suyo", items: ["nee-rape", "duelo", "trivia-duelo"] },
  { key: "clasicos", title: "Clásicos rápidos", bajada: "Cinco minutos por día", items: ["palabra-del-dia", "ahorcado", "sopa-de-letras", "memoria"] },
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
const PRONTO: Record<string, string> = { es: "Muy pronto", pt: "Em breve", en: "Coming soon", de: "Demnächst", fr: "Bientôt", zh: "即將推出" };

function GamesHome() {
  // Penales es el juego más jugado: sus ilustraciones empiezan a bajar mientras se mira esta página.
  useEffect(() => { const t = window.setTimeout(precargarPenales, 1200); return () => window.clearTimeout(t); }, []);
  useRecordVisit("juegos");
  const guest = useIsGuest();
  const stats = useStats();
  const destacado = byId(guest ? "penales" : "consultorio");
  const { lang, g } = useGT();
  return (
    <GameStage
      title="Juegos"
      background="radial-gradient(120% 60% at 50% 0%, #1E3A6B 0%, #0D1B33 55%, #0A1426 100%)"
      css={CSS}
      wide
      back={guest ? { to: "/", label: g("backHome") } : { to: "/dashboard", label: g("backBoard") }}
    >
      <LanzamientoBanner oscuro className="mt-1" />
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
            <h1 className="font-display text-5xl font-bold leading-none tracking-tight sm:text-7xl">{g("games")}</h1>
            <p className="mt-2 text-sm text-white/75 sm:mt-3 sm:text-lg">
              {GAMES.length} {g("countSuffix")}
            </p>
          </div>
        </div>
      </section>

      <MetaDiaria className="mt-5" />

      <RetoCard guest={guest} />

      {guest && stats.xp > 0 && (
        <Link
          to="/auth"
          search={{ mode: authMode() }}
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#F6C445] px-4 py-3 text-[#3A1A05] ring-1 ring-black/10"
        >
          <span className="text-sm font-semibold">Ganaste {stats.xp} XP en este celular. Creá tu cuenta gratis para no perderlos.</span>
          <span className="shrink-0 rounded-xl bg-[#1E3A5F] px-3 py-2 text-xs font-bold text-white">Guardar mis puntos</span>
        </Link>
      )}

      {/* Destacado */}
      <Link
        to={destacado.to}
        className="vit-card mt-6 grid overflow-hidden rounded-3xl ring-1 ring-white/10 sm:grid-cols-[1.2fr_1fr]"
        style={{ background: COVER_TONE[destacado.id].bg }}
      >
        <div className="overflow-hidden">
          <img
            src={COVER_IMAGE[destacado.id]}
            alt={guest ? "Jai en el arco de Penales" : "Jai, vestido de doctor, atiende a una paciente en el consultorio"}
            className="vit-art block aspect-[4/3] h-full w-full object-cover"
            width={800}
            height={600}
          />
        </div>
        <div className="flex flex-col justify-center gap-2 p-5 sm:gap-3 sm:p-8">
          <span className="w-fit rounded-full bg-[#F6C445] px-3 py-1 text-xs font-bold text-[#3A1A05]">{guest ? g("freePlay") : g("nuevo")}</span>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{gameTitle(destacado.title, lang)}</h2>
          <p className="text-white/80">{GAME_DESC[destacado.id]?.[lang] ?? destacado.desc}</p>
          <span className="mt-2 inline-flex h-12 w-fit items-center rounded-2xl bg-[#3DE0B0] px-6 font-bold text-[#062A2E]">{guest ? "Jugar ahora" : g("startShift")}</span>
        </div>
      </Link>

      {SHELVES.map((s) => (
        <section key={s.title} className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">{SHELF_TEXT[s.key]?.title[lang] ?? s.title}</h2>
            <p className="text-sm text-white/60">{SHELF_TEXT[s.key]?.bajada[lang] ?? s.bajada}</p>
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

function LockedNotice({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Este juego pide cuenta" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-[#0D1B33] p-6 text-white ring-1 ring-white/15" onClick={(e) => e.stopPropagation()}>
        <img src={jaiImg} alt="Jai, el jaguarete" className="mx-auto h-24 w-24 object-contain" />
        <h2 className="mt-2 text-center font-display text-xl font-bold">«{title}» guarda tu progreso</h2>
        <p className="mt-2 text-center text-sm text-white/80">Creá tu cuenta gratis para jugarlo. Mientras tanto, podés jugar sin cuenta a los juegos marcados como libres.</p>
        <Link to="/auth" search={{ mode: authMode() }} className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-[#3DE0B0] font-bold text-[#062A2E]">Crear mi cuenta gratis</Link>
        <Link to="/juegos/penales" className="mt-2 flex h-12 items-center justify-center rounded-2xl bg-white/10 font-bold">Jugar Penales sin cuenta</Link>
        <button type="button" onClick={onClose} className="mt-2 h-11 w-full rounded-2xl tap-3d-dark font-semibold text-white/70">Ver otros juegos</button>
      </div>
    </div>
  );
}

function Cover({ g }: { g: Game }) {
  const { lang, g: tr } = useGT();
  const tone = COVER_TONE[g.id];
  const guest = useIsGuest();
  const free = isGuestPath(g.to);
  const [locked, setLocked] = useState(false);
  return (
    <>
    {locked && <LockedNotice title={gameTitle(g.title, lang)} onClose={() => setLocked(false)} />}
    <Link
      to={g.to}
      onClick={(e) => { if (guest && !free) { e.preventDefault(); setLocked(true); } }}
      className="vit-card relative flex w-[72%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl ring-1 ring-white/10 sm:w-[44%] lg:w-auto"
      style={{ background: tone.bg, color: tone.ink }}
    >
      <div className="overflow-hidden">
        <img
          src={COVER_IMAGE[g.id]}
          alt=""
          className="vit-art block aspect-[4/3] w-full object-cover"
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
        />
      </div>
      {g.pronto && (
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-[#0D1B33]">{PRONTO[lang] ?? PRONTO.es}</span>
      )}
      {g.nuevo && g.id !== "consultorio" && (
        <span className="absolute left-3 top-3 rounded-full bg-[#F6C445] px-2.5 py-0.5 text-[11px] font-bold text-[#3A1A05]">{tr("nuevo")}</span>
      )}
      {guest && free && (
        <span className="absolute right-3 top-3 rounded-full bg-[#3DE0B0] px-2.5 py-0.5 text-[11px] font-bold text-[#062A2E]">{tr("freePlay")}</span>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-lg font-bold leading-tight">{gameTitle(g.title, lang)}</h3>
        <p className="line-clamp-2 text-sm opacity-80">{GAME_DESC[g.id]?.[lang] ?? g.desc}</p>
        <p className="mt-auto pt-2 text-xs font-semibold opacity-70">{guest && !free ? tr("needsAccount") : g.xp}</p>
      </div>
    </Link>
    </>
  );
}
