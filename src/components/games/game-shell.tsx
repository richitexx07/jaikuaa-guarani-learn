import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { listCourseLessons } from "@/lib/lessons.functions";
import { getGameWords, type GameWord } from "@/lib/games.functions";
import { withOfflineCache } from "@/lib/offline-data";
import { prefetchAudio } from "@/lib/audio";
import { K } from "@/lib/offline-pack";
import { GameKit, GameCompanion, GameSoundButton, LaceBackground } from './game-kit';
import { GameHelp } from './game-help';
import { SponsorLine } from './sponsor-line';
import type { SponsorSlot } from '@/lib/sponsor-slots';
import { gameTitle, useGT } from '@/lib/i18n-games';
import { getGameWordsGuest } from "@/lib/guest.functions";
import { hasSessionNow, useIsGuest } from "@/lib/guest";
import { useRememberPlace } from "@/lib/last-place";
import { useT } from '@/lib/i18n';

export function GameShell({ title, emoji, children, sponsorSlot, companion = true }: { title: string; emoji: string; children: ReactNode; sponsorSlot?: SponsorSlot; companion?: boolean }) {
  const { lang, g } = useGT();
  const { t } = useT();
  useRememberPlace(title, "game", title !== "Juegos");
  return (
    <GameKit><div className="game-shell relative isolate flex min-h-screen flex-col bg-background">
      {title !== 'Penales' && <LaceBackground/>}
      <header className="relative border-b border-border/50 bg-background/90">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-4 px-3 sm:h-16 sm:px-6 lg:max-w-6xl">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <nav aria-label={t("nav.main")} className="hidden items-center gap-1 md:flex">
            {([["/dashboard",t("nav.learn")],["/juegos",t("nav.games")],["/ranking",t("nav.ranking")],["/logros",t("nav.achievements")]] as const).map(([to,label])=>(
              <Link key={to} to={to} activeOptions={{exact:true}} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary" activeProps={{className:"bg-primary/10 text-primary"}}>{label}</Link>
            ))}
          </nav>
          {title === 'Juegos'
            ? <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary md:hidden">{g("backBoard")}</Link>
            : <Link to="/juegos" className="text-sm font-medium text-muted-foreground hover:text-primary md:hidden">{g("back")}</Link>}
        </div>
      </header>
      <main className="relative flex-1 px-3 py-2 sm:px-6 sm:py-10">
        <div className={`mx-auto max-w-3xl ${title === 'Juegos' ? 'lg:max-w-6xl' : 'lg:max-w-4xl'}`}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-col-reverse sm:items-stretch">
            <h1 className="min-w-0 truncate font-display text-xl font-bold tracking-normal text-foreground sm:text-center sm:text-4xl">
              <span aria-hidden>{emoji}</span> {gameTitle(title, lang)}
            </h1>
            <div className="flex shrink-0 justify-end gap-1 sm:mb-4 sm:gap-2"><GameHelp title={title}/><GameSoundButton/></div>
          </div>
          {sponsorSlot && <SponsorLine slot={sponsorSlot} />}
          {companion && title !== 'Penales' && <div className="mx-auto mt-2 hidden max-w-lg sm:mt-4 sm:block"><GameCompanion/></div>}
          <div className="mt-3 sm:mt-6">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div></GameKit>
  );
}

/** Selector "Todas las palabras" o una lección publicada. */
export function LessonFilter({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const fn = useServerFn(listCourseLessons);
  const guest = useIsGuest();
  const q = useQuery({
    queryKey: ["course-lessons"],
    enabled: !guest,
    queryFn: () => withOfflineCache(K.lessons, () => fn(), { label: "El curso" }),
  });
  const lessons = (q.data?.lessons ?? []).filter((l) => l.publishedWords > 0);
  const { g } = useGT();
  // Sin cuenta se juega con todas las palabras (elegir lección es para quien sigue el curso).
  if (guest) return null;
  return (
    <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      {g("words")}
      <select
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{g("allWords")}</option>
        {lessons.map((l) => (
          <option key={l.n} value={l.n}>
            {g("lesson")} {l.n}: {l.title}
          </option>
        ))}
      </select>
    </label>
  );
}

export function useGameWords(lesson: number | null) {
  const fn = useServerFn(getGameWords);
  const guestFn = useServerFn(getGameWordsGuest);
  const q = useQuery({
    queryKey: ["game-words", lesson],
    queryFn: () =>
      withOfflineCache(
        K.gameWords(lesson),
        async () => ((await hasSessionNow()) ? fn({ data: { lesson } }) : guestFn({ data: { lesson } })),
        { label: "Las palabras del juego" },
      ),
    staleTime: 5 * 60_000,
  });
  // Deja listos (y con volumen parejo) los audios de las palabras del juego antes de que suenen.
  const words = q.data?.words;
  useEffect(() => {
    if (!words) return;
    for (const w of words.filter((x) => x.hasAudio).slice(0, 24)) void prefetchAudio(w.gn);
  }, [words]);
  return q;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickDistinct(words: GameWord[], n: number, filter: (w: GameWord) => boolean = () => true) {
  const seen = new Set<string>();
  const out: GameWord[] = [];
  for (const w of shuffle(words.filter(filter))) {
    const k = w.gn.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(w);
    if (out.length === n) break;
  }
  return out;
}

export function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const h = () => setWide(m.matches);
    h();
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return wide;
}

export function NotEnough({ min }: { min: number }) {
  const { g } = useGT();
  return (
    <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {g("notEnough", { n: min })}
    </p>
  );
}

export function XpNote({ xp }: { xp: number }) {
  return <ExitAfterGame xp={xp} />;
}

function ExitAfterGame({ xp }: { xp: number }) {
  const guest = useIsGuest();
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-center text-sm font-semibold text-accent">+{xp} XP</p>
      <Link
        to={guest ? "/juegos" : "/dashboard"}
        className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-muted"
      >
        {guest ? "Listo · Volver a los juegos" : "Listo · Volver al panel"}
      </Link>
    </div>
  );
}
