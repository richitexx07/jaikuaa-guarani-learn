/**
 * Inicio a dos toques: un solo botón protagonista para seguir aprendiendo, los juegos con sus portadas
 * en una fila que se desliza y las novedades guardadas en la campana (no compiten con la lección).
 * Pedido de Alan y Richard (nov 2026): «todo tiene que ser en 2 o 3 toques».
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BookOpen, ChevronRight, Gamepad2, Play } from "lucide-react";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { useLastPlace } from "@/lib/last-place";
import { NandutiDisc } from "@/components/nanduti-disc";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import coverPenales from "@/assets/covers/cover-penales.webp";
import coverPalabra from "@/assets/covers/cover-palabra-del-dia.webp";
import coverMemoria from "@/assets/covers/cover-memoria.webp";
import coverKaraoke from "@/assets/covers/cover-karaoke.webp";
import coverTembiu from "@/assets/covers/cover-tembiu.webp";
import coverTrivia from "@/assets/covers/cover-trivia-duelo.webp";

type L = Record<AppLang, string>;
const T = {
  seguir: { es: "Seguí donde quedaste", pt: "Continue de onde parou", en: "Pick up where you left off", de: "Mach weiter, wo du aufgehört hast", fr: "Reprenez où vous en étiez", zh: "從上次的地方繼續" },
  empezar: { es: "Tu curso de guaraní", pt: "Seu curso de guarani", en: "Your Guarani course", de: "Dein Guarani-Kurs", fr: "Votre cours de guarani", zh: "你的瓜拉尼語課程" },
  cursoTitulo: { es: "Lecciones de guaraní", pt: "Lições de guarani", en: "Guarani lessons", de: "Guarani-Lektionen", fr: "Leçons de guarani", zh: "瓜拉尼語課程" },
  sub: { es: "Lecciones cortas, con voces reales", pt: "Lições curtas, com vozes reais", en: "Short lessons with real voices", de: "Kurze Lektionen mit echten Stimmen", fr: "Leçons courtes, avec de vraies voix", zh: "簡短課程，真人發音" },
  continuar: { es: "Continuar lección", pt: "Continuar lição", en: "Continue lesson", de: "Lektion fortsetzen", fr: "Continuer la leçon", zh: "繼續上課" },
  empezarBtn: { es: "Empezar a aprender", pt: "Começar a aprender", en: "Start learning", de: "Jetzt lernen", fr: "Commencer à apprendre", zh: "開始學習" },
  volverJuego: { es: "Volver a {t}", pt: "Voltar a {t}", en: "Back to {t}", de: "Zurück zu {t}", fr: "Retour à {t}", zh: "回到 {t}" },
  jugar: { es: "Jugá y repasá", pt: "Jogue e revise", en: "Play and review", de: "Spielen und wiederholen", fr: "Jouez et révisez", zh: "邊玩邊複習" },
  verTodos: { es: "Ver todos", pt: "Ver todos", en: "See all", de: "Alle ansehen", fr: "Tout voir", zh: "查看全部" },
  novedades: { es: "Novedades", pt: "Novidades", en: "What's new", de: "Neuigkeiten", fr: "Nouveautés", zh: "最新消息" },
  novedadesD: { es: "Lo nuevo de Jaikuaa, en un solo lugar.", pt: "O que há de novo no Jaikuaa, num só lugar.", en: "What's new in Jaikuaa, in one place.", de: "Neues von Jaikuaa an einem Ort.", fr: "Les nouveautés de Jaikuaa, au même endroit.", zh: "Jaikuaa 的最新消息都在這裡。" },
  penales: { es: "Penales", pt: "Pênaltis", en: "Penalties", de: "Elfmeter", fr: "Penalties", zh: "點球" },
  penalesD: { es: "Un toque y pateás", pt: "Um toque e você chuta", en: "One tap and you shoot", de: "Ein Tipp und du schießt", fr: "Un geste et vous tirez", zh: "點一下就射門" },
  palabra: { es: "Palabra del día", pt: "Palavra do dia", en: "Word of the day", de: "Wort des Tages", fr: "Mot du jour", zh: "每日一詞" },
  palabraD: { es: "Una nueva cada día", pt: "Uma nova a cada dia", en: "A new one every day", de: "Jeden Tag ein neues", fr: "Un nouveau chaque jour", zh: "每天一個新詞" },
  memoria: { es: "Memoria", pt: "Memória", en: "Memory", de: "Memory", fr: "Mémoire", zh: "記憶" },
  memoriaD: { es: "Pares de palabras", pt: "Pares de palavras", en: "Word pairs", de: "Wortpaare", fr: "Paires de mots", zh: "詞語配對" },
  karaoke: { es: "Karaoke", pt: "Karaokê", en: "Karaoke", de: "Karaoke", fr: "Karaoké", zh: "卡拉OK" },
  karaokeD: { es: "Cantá en guaraní", pt: "Cante em guarani", en: "Sing in Guarani", de: "Sing auf Guarani", fr: "Chantez en guarani", zh: "用瓜拉尼語唱歌" },
  tembiu: { es: "Tembi'u", pt: "Tembi'u", en: "Tembi'u", de: "Tembi'u", fr: "Tembi'u", zh: "Tembi'u" },
  tembiuD: { es: "Cocina paraguaya", pt: "Cozinha paraguaia", en: "Paraguayan cooking", de: "Paraguayische Küche", fr: "Cuisine paraguayenne", zh: "巴拉圭料理" },
  trivia: { es: "Trivia", pt: "Trivia", en: "Trivia", de: "Quiz", fr: "Quiz", zh: "問答" },
  triviaD: { es: "Preguntas y respuestas", pt: "Perguntas e respostas", en: "Questions and answers", de: "Fragen und Antworten", fr: "Questions et réponses", zh: "問與答" },
} satisfies Record<string, L>;

function useTD() {
  const lang = useAppLang();
  return (k: keyof typeof T, v?: Record<string, string>) =>
    (T[k][lang] ?? T[k].es).replace(/\{(\w+)\}/g, (_, x) => v?.[x] ?? "");
}

/** El botón protagonista: seguir la última lección o empezar el curso. Si lo último fue un juego, se ofrece volver abajo, chiquito. */
export function HeroLeccion() {
  const t = useTD();
  const place = useLastPlace();
  const leccion = place?.kind === "lesson" ? place : null;
  const juego = place?.kind === "game" ? place : null;
  const href = leccion?.href ?? "/curso/guarani";
  return (
    <section aria-label={leccion ? t("seguir") : t("empezar")} className="mt-5">
      <a
        href={href}
        className="relative block overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-lift transition active:scale-[0.99] sm:p-7"
      >
        <NandutiDisc className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 text-primary-foreground opacity-[0.12]" />
        <span className="relative block text-xs font-bold uppercase tracking-wide text-[#F6C445]">
          {leccion ? t("seguir") : t("empezar")}
        </span>
        <span className="relative mt-1.5 block font-display text-2xl font-bold leading-tight sm:text-3xl">
          {leccion?.title ?? t("cursoTitulo")}
        </span>
        <span className="relative mt-1 block text-sm opacity-85">{t("sub")}</span>
        <span className="relative mt-5 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#F6C445] font-display text-lg font-bold text-[#13233A] shadow">
          <Play className="h-5 w-5 fill-current" aria-hidden />
          {leccion ? t("continuar") : t("empezarBtn")}
        </span>
      </a>
      {juego && (
        <a
          href={juego.href}
          className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition active:scale-[0.99]"
        >
          <Gamepad2 className="h-4 w-4 text-primary" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{t("volverJuego", { t: juego.title })}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </a>
      )}
    </section>
  );
}

const JUEGOS = [
  { href: "/juegos/penales", img: coverPenales, t: "penales", d: "penalesD" },
  { href: "/juegos/palabra-del-dia", img: coverPalabra, t: "palabra", d: "palabraD" },
  { href: "/juegos/memoria", img: coverMemoria, t: "memoria", d: "memoriaD" },
  { href: "/juegos/karaoke", img: coverKaraoke, t: "karaoke", d: "karaokeD" },
  { href: "/juegos/tembiu", img: coverTembiu, t: "tembiu", d: "tembiuD" },
  { href: "/trivia", img: coverTrivia, t: "trivia", d: "triviaD" },
] as const;

/** Los juegos con sus portadas, en una fila que se desliza con el dedo. */
export function JuegosCarrusel() {
  const t = useTD();
  return (
    <section aria-labelledby="inicio-juegos" className="mt-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="inicio-juegos" className="font-display text-xl font-bold text-foreground">{t("jugar")}</h2>
        <Link to="/juegos" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          {t("verTodos")}
        </Link>
      </div>
      <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {JUEGOS.map((j) => (
          <li key={j.href} className="w-40 shrink-0 snap-start sm:w-auto">
            <a
              href={j.href}
              className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition active:scale-[0.98]"
            >
              <img src={j.img} alt="" width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              <span className="block px-3 pb-3 pt-2">
                <span className="block font-display text-base font-bold leading-tight text-foreground">{t(j.t)}</span>
                <span className="block truncate text-xs text-muted-foreground">{t(j.d)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const VISTO = "jaikuaa:novedades-vistas";
const hoy = () => new Date().toISOString().slice(0, 10);

/** La campana del encabezado: las novedades y avisos se abren aparte, sin tapar la lección. */
export function NovedadesCampana({ children }: { children: ReactNode }) {
  const t = useTD();
  const [punto, setPunto] = useState(false);
  useEffect(() => {
    try { setPunto(localStorage.getItem(VISTO) !== hoy()); } catch { setPunto(false); }
  }, []);
  return (
    <Sheet
      onOpenChange={(o) => {
        if (!o) return;
        setPunto(false);
        try { localStorage.setItem(VISTO, hoy()); } catch { /* sin almacenamiento */ }
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("novedades")}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-background text-primary transition hover:border-primary/40"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {punto && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" aria-hidden />}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-2xl">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden /> {t("novedades")}
          </SheetTitle>
          <SheetDescription>{t("novedadesD")}</SheetDescription>
        </SheetHeader>
        <div className="pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
