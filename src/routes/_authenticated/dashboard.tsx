import { useAppLang } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ValidationBadge } from "@/components/validation-notice";
import { DisplayToggles } from "@/components/display-toggles";
import { AI_GUARANI_TOOLS_ENABLED } from "@/lib/features";
import { BrandLogo } from "@/components/brand-logo";
import { AppLanguageToggle } from "@/components/app-language-toggle";
import { useT } from "@/lib/i18n";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  Keyboard,
  Languages,
  MessageCircleQuestion,
  MessagesSquare,
  Newspaper,
  NotebookPen,
  RefreshCw,
  School,
  Sparkles,
  Stethoscope,
  Wrench,
  Zap,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatsBar, StreakBanner } from "@/components/gamification/stats-bar";
import { SiteFooter } from "@/components/site-footer";
import { NhandeMarandu } from "@/components/nhande-marandu";
import { AdminCorpusLink } from "@/components/admin-corpus-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkCorpusAdmin } from "@/lib/corpus.functions";
import { getMyStaffStatus } from "@/lib/teacher.functions";
import { claimReferral } from "@/lib/ambassador.functions";
import { cleanRefCode, REF_STORAGE_KEY } from "@/lib/ambassador";
import { withOfflineCache } from "@/lib/offline-data";
import { StaffRequestCard } from "@/components/pilot/staff-request-card";
import { staffStatusRefreshInterval } from "@/lib/staff-status-refresh";
import { OfflinePackCard } from "@/components/offline/offline-pack-card";
import { AulaPendientes } from "@/components/aula/aula-pendientes";
import { NovedadLibreria } from "@/components/libreria/novedad-libreria";
import { RetoCard } from "@/components/games/reto-card";
import jaiImg from "@/assets/jai/jai-saluda.webp";
import { NandutiDisc } from "@/components/nanduti-disc";
import bannerAprender from "@/assets/banners/banner-aprender.webp";
import bannerCurso from "@/assets/banners/banner-curso.webp";
import bannerEscolar from "@/assets/banners/banner-escolar.webp";
import bannerCastellano from "@/assets/banners/banner-castellano-tecnico.webp";
import coverKaraoke from "@/assets/covers/cover-karaoke.webp";
import miniKaraoke from "@/assets/covers/mini/mini-karaoke.webp";
import miniPenales from "@/assets/covers/mini/mini-penales.webp";
import miniTembiu from "@/assets/covers/mini/mini-tembiu.webp";
import miniTaanga from "@/assets/covers/mini/mini-taanga.webp";
import miniTrivia from "@/assets/covers/mini/mini-trivia-duelo.webp";
import miniTekojoja from "@/assets/covers/mini/mini-tekojoja.webp";
import miniMemoria from "@/assets/covers/mini/mini-memoria.webp";
import miniConsultorio from "@/assets/covers/mini/mini-consultorio.webp";
import miniDuelo from "@/assets/covers/mini/mini-duelo.webp";
import miniSopa from "@/assets/covers/mini/mini-sopa-de-letras.webp";
import miniAhorcado from "@/assets/covers/mini/mini-ahorcado.webp";
import miniNeeRape from "@/assets/covers/mini/mini-nee-rape.webp";
import miniVentanilla from "@/assets/covers/mini/mini-ventanilla.webp";
import miniChacra from "@/assets/covers/mini/mini-chacra.webp";
import coverPalabra from "@/assets/covers/cover-palabra-del-dia.webp";
import coverPenales from "@/assets/covers/cover-penales.webp";
import coverTrivia from "@/assets/covers/cover-trivia-duelo.webp";
import medallaPrimerPaso from "@/assets/medallas/medalla-primer-paso.webp";
import jaiEmbajador from "@/assets/jai/jai-embajador.webp";
import jaiGraduado from "@/assets/jai/jai-graduado.webp";
import jaiTrofeo from "@/assets/jai/jai-trofeo.webp";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";
import jaiProfe from "@/assets/jai-profe.webp";
import jaiAtencion from "@/assets/jai-atencion-pro.webp";
import jaiAgro from "@/assets/jai-agro.webp";
import { forgetPlace, useLastPlace } from "@/lib/last-place";
import { X } from "lucide-react";
import { shouldShowWelcome, welcomeSeen } from "@/lib/welcome";
import triviaVocabulario from "@/assets/trivia/trivia-vocabulario.webp";
const jaiAsset = { url: jaiImg };

function StaffShortcuts() {
  const check = useServerFn(checkCorpusAdmin);
  const { data } = useQuery({
    queryKey: ["corpus-admin"],
    queryFn: () => check(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  if (!data?.canAccess) return null;
  return (
    <section className="mt-6 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
        Docentes y validadores
      </p>
      <Link
        to="/docente"
        className="mt-3 flex min-h-16 items-center gap-3 overflow-hidden rounded-2xl bg-accent px-4 py-2 text-accent-foreground shadow-lift transition active:scale-[0.98]"
      >
        <img src={jaiProfe} alt="" className="-my-2 h-16 w-16 shrink-0 object-contain" />
        <span className="min-w-0 flex-1 font-display text-lg font-bold leading-tight">Panel del docente</span>
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
      </Link>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <StaffLink to="/validar" icon={Zap} label="Validación rápida" />
        <StaffLink to="/docente/juegos" icon={Gamepad2} label="Guaraní de los juegos" />
        <StaffLink to="/cuaderno" icon={NotebookPen} label="Cuaderno digital del aula" />
        <StaffLink to="/mostrador/editar" icon={Stethoscope} label="Frases del mostrador" />
        <StaffLink to="/aula/docente" icon={School} label="Mis aulas" />
        <StaffLink to="/admin/corpus" icon={CheckCircle2} label="Bandeja de validación" />
        <StaffLink to="/validacion" icon={RefreshCw} label="Circuito de validación" />
        {/* Studio (motor de Alan): solo administradores lo ven. */}
        {data.isAdmin && <StaffLink href="/admin/corpus?tab=tablero" icon={BarChart3} label="Analíticas en vivo" />}
        {data.isAdmin && <StaffLink href="/studio" icon={FlaskConical} label="Jaikuaa Studio · motor en desarrollo" />}
        {data.isAdmin && <StaffLink to="/admin/noticias" icon={Newspaper} label="Noticias para aprobar" />}
        {data.isAdmin && <StaffLink to="/admin/jai" icon={MessageCircleQuestion} label="Qué le preguntan a Jai" />}
      </div>
    </section>
  );
}

/** «Seguí donde quedaste»: un toque para volver al último juego o lección. */
function ResumeCard() {
  const place = useLastPlace();
  const [hidden, setHidden] = useState(false);
  if (!place || hidden) return null;
  return (
    <div className="relative">
    <button
      type="button"
      aria-label="Cerrar «Seguí donde quedaste»"
      onClick={() => { forgetPlace(); setHidden(true); }}
      className="absolute right-2 top-7 z-10 grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/15 text-primary-foreground"
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
    <a
      href={place.href}
      className="mt-5 flex min-h-16 items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lift transition active:scale-[0.98]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
        {place.kind === "lesson" ? <BookOpen className="h-5 w-5" aria-hidden /> : <Gamepad2 className="h-5 w-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold opacity-80">Seguí donde quedaste</span>
        <span className="block truncate font-display text-lg font-bold leading-tight">{place.title}</span>
      </span>
      <ChevronRight className="mr-9 h-5 w-5 shrink-0" aria-hidden />
    </a>
    </div>
  );
}

/** Acceso del área docente: ícono, nombre y flecha; alto cómodo para el dedo en el celular. */
function StaffLink({ to, href, icon: Icon, label }: { to?: string; href?: string; icon: LucideIcon; label: string }) {
  const cls =
    "flex min-h-12 items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 active:scale-[0.98]";
  const inner = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 leading-tight">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </>
  );
  return href ? <a href={href} className={cls}>{inner}</a> : <Link to={to!} className={cls}>{inner}</Link>;
}

/**
 * Lugar en el piloto para quien todavía no es docente: acceso al Panel de práctica, estado del pedido
 * o un enlace discreto para pedir acceso (solo si ya está en un grupo del piloto).
 */
const PANEL_REDIRECT_KEY = "jaikuaa:panel-abierto";

function PilotCard() {
  const fn = useServerFn(getMyStaffStatus);
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["my-staff-status"],
    queryFn: () => withOfflineCache("my-staff-status", () => fn()),
    refetchInterval: (query) => staffStatusRefreshInterval(query.state.data),
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    networkMode: "always",
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Al abrir Jaikuaa, el docente va directo a su Panel del docente y el estudiante en práctica a su
  // Panel de práctica. Una sola vez por visita: si vuelve al inicio, se queda acá. El administrador no.
  useEffect(() => {
    if (!data) return;
    const target = data.isTeacher && !data.isAdmin ? "/docente" : !data.isTeacher && data.isPractice ? "/practica" : null;
    if (!target) return;
    try {
      if (sessionStorage.getItem(PANEL_REDIRECT_KEY)) return;
      sessionStorage.setItem(PANEL_REDIRECT_KEY, "1");
    } catch {
      return;
    }
    void navigate({ to: target, replace: true });
  }, [data, navigate]);

  if (!data || data.isTeacher) return null;
  if (data.isPractice) {
    return (
      <section className="mt-6 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Práctica supervisada</p>
        <Button asChild variant="cta" className="mt-3 h-auto min-h-14 w-full justify-start whitespace-normal py-3 text-left text-base">
          <Link to="/practica"><GraduationCap aria-hidden /> Panel de práctica</Link>
        </Button>
      </section>
    );
  }
  if (data.request) {
    return (
      <div className="mt-6">
        <StaffRequestCard request={data.request} defaultName={data.fullName} compact />
      </div>
    );
  }
  if (!data.cohort) return null;
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      ¿Sos docente o estudiante del Ateneo en el piloto?{" "}
      <Link to="/docente" className="font-semibold text-primary underline-offset-4 hover:underline">
        Pedí tu acceso
      </Link>
    </p>
  );
}

/** Los juegos que van pasando en el botón «Jugar» (empieza con Jai y el arpa). */
const JUEGOS_ROTAN: { img: string; nombre: string }[] = [
  { img: miniKaraoke, nombre: "Karaoke" },
  { img: miniPenales, nombre: "Penales" },
  { img: miniTembiu, nombre: "Tembi'u" },
  { img: miniTrivia, nombre: "Trivia" },
  { img: miniTaanga, nombre: "Ta'anga" },
  { img: miniMemoria, nombre: "Memoria" },
  { img: miniConsultorio, nombre: "Consultorio" },
  { img: miniVentanilla, nombre: "Ventanilla" },
  { img: miniChacra, nombre: "Chacra" },
  { img: miniDuelo, nombre: "Duelo" },
  { img: miniTekojoja, nombre: "Tekojoja" },
  { img: miniSopa, nombre: "Sopa" },
  { img: miniAhorcado, nombre: "Ahorcado" },
  { img: miniNeeRape, nombre: "Ñe'ẽ Rape" },
];

/** Imagen que va cambiando suave de un juego a otro (quieta si el celular pide menos movimiento). */
function RotatingThumb({ items, className }: { items: { img: string; nombre: string }[]; className: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") setI((n) => (n + 1) % items.length);
    }, 2600);
    return () => window.clearInterval(t);
  }, [items.length]);
  return (
    <span className={`relative block overflow-hidden ${className}`} aria-hidden>
      {items.map((it, k) => (
        <img
          key={it.nombre}
          src={it.img}
          alt=""
          width={184}
          height={144}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out"
          style={{ opacity: k === i ? 1 : 0, transform: k === i ? "scale(1)" : "scale(1.08)" }}
        />
      ))}
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1 pb-0.5 pt-3 text-center text-[10px] font-bold leading-none text-white">
        {items[i]?.nombre}
      </span>
    </span>
  );
}

function BigAction({ to, img, rotate, title, desc, tone }: { to: "/curso/$lang" | "/juegos" | "/juegos/palabra-del-dia"; img: string; rotate?: { img: string; nombre: string }[]; title: string; desc: string; tone: "primary" | "accent" | "card" }) {
  const cls =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-card text-foreground border-2 border-primary/30";
  return (
    <Link
      to={to}
      params={to === "/curso/$lang" ? { lang: "guarani" } : undefined}
      className={`flex min-h-[76px] items-center gap-3 overflow-hidden rounded-2xl p-2 pr-4 shadow-lift transition-transform active:scale-[0.98] sm:min-h-[88px] ${cls}`}
    >
      {rotate ? (
        <RotatingThumb items={rotate} className="h-[60px] w-[76px] shrink-0 rounded-xl sm:h-[72px] sm:w-[92px]" />
      ) : (
        <img src={img} alt="" className="h-[60px] w-[76px] shrink-0 rounded-xl object-cover sm:h-[72px] sm:w-[92px]" loading="lazy" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-bold leading-tight sm:text-xl">{title}</span>
        <span className="block text-xs leading-snug opacity-90 sm:text-sm">{desc}</span>
      </span>
      <ChevronRight className="h-6 w-6 shrink-0" aria-hidden />
    </Link>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Tu panel" },
      { name: "description", content: "Retomá tu curso de guaraní, consultá tu progreso y encontrá juegos y actividades de Jaikuaa." },
      { property: "og:title", content: "Jaikuaa — Tu panel" },
      { property: "og:description", content: "Tu espacio de aprendizaje: curso, juegos, progreso y actividades de guaraní." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://www.jaikuaa.com/dashboard" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/dashboard" }],
  }),
  component: Dashboard,
});

function greetingFor(hour: number): { subtitle: string; emoji: string } {
  if (hour >= 6 && hour < 12)
    return {
      emoji: "🌅",
      subtitle: "¿Listo para despertar el guaraní que llevás dentro?",
    };
  if (hour >= 12 && hour < 18)
    return {
      emoji: "☀️",
      subtitle: "El sol está alto y tu ñe'ẽ también puede brillar.",
    };
  if (hour >= 18 && hour < 24)
    return {
      emoji: "🌙",
      subtitle: "Unos minutos de guaraní antes de dormir.",
    };
  return {
    emoji: "🌙",
    subtitle: "El jaguaréte también caza de noche. ¡Practicá un poco!",
  };
}

const NAME_CACHE_KEY = "aranduka:profile-name";

function firstName(fullName: string): string {
  if (!fullName) return "";
  const first = fullName.split(" ")[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
}

function readCachedName(): string {
  if (typeof window === "undefined") return "";
  try {
    return firstName(window.localStorage.getItem(NAME_CACHE_KEY) || "");
  } catch {
    return "";
  }
}

function writeCachedName(name: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAME_CACHE_KEY, firstName(name));
  } catch {}
}

type TeaserKey = "karaoke" | "vivo" | null;

function Dashboard() {
  const { t } = useT();
  const navigate = useNavigate();
  const [name, setName] = useState<string>(() => readCachedName());
  const [openTeaser, setOpenTeaser] = useState<TeaserKey>(null);
  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);

  const claim = useServerFn(claimReferral);
  useEffect(() => {
    const code = cleanRefCode(localStorage.getItem(REF_STORAGE_KEY));
    if (!code) return;
    claim({ data: { code } })
      .then(({ result }) => {
        if (result !== "ok" && result !== "already" && result !== "invalid" && result !== "self" && result !== "too_old") return;
        localStorage.removeItem(REF_STORAGE_KEY);
      })
      .catch(() => {});
  }, [claim]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;
      // Cuenta recién creada: primero «Tu primera palabra en 30 segundos» (una sola vez).
      if (shouldShowWelcome(user.created_at, welcomeSeen())) {
        void navigate({ to: "/bienvenida", replace: true });
        return;
      }
      const fromMeta =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined);
      if (!readCachedName() && fromMeta) {
        setName(firstName(fromMeta));
        writeCachedName(fromMeta);
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const resolved = profile?.full_name || fromMeta || user.email?.split("@")[0] || "";
      if (resolved) {
        setName(firstName(resolved));
        writeCachedName(resolved);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    try {
      window.localStorage.removeItem(NAME_CACHE_KEY);
    } catch {}
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 font-display text-xl font-bold text-primary"
          >
            <BrandLogo withWordmark={false} className="sm:hidden" />
            <BrandLogo className="hidden sm:inline-flex" />
          </Link>
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <AppLanguageToggle />
            <DisplayToggles />
            <AdminCorpusLink />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              aria-label={t("signOut")}
            >
              <LogOut aria-hidden />
              <span className="sm:hidden">Salir</span>
              <span className="hidden sm:inline">{t("signOut")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          {/* 1. SALUDO DE JAI */}
          <div className="nanduti-bg relative flex items-center gap-3 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-elegant sm:gap-5 sm:p-5">
            <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
              <NandutiDisc className="absolute inset-0 h-full w-full text-primary" />
              <img src={jaiAsset.url} alt="Jai, el jaguarete, te saluda" className="relative h-full w-full object-contain drop-shadow-lg" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-4xl">
                ¡Mba'éichapa, {name ? <span className="text-accent">{name}</span> : t("dash.friend")}! {greeting.emoji}
              </h1>
              <p className="mt-1 text-base text-muted-foreground">{t("dash.question")}</p>
            </div>
          </div>

          <ResumeCard />

          {/* 2. TRES BOTONES GIGANTES */}
          <nav aria-label={t("dash.question")} className="mt-5 grid gap-3 sm:grid-cols-3">
            <BigAction to="/curso/$lang" img={bannerCurso} title={t("nav.learn")} desc={t("dash.learnDesc")} tone="primary" />
            <BigAction to="/juegos" img={coverKaraoke} rotate={JUEGOS_ROTAN} title={t("dash.play")} desc={t("dash.playDesc")} tone="accent" />
            <BigAction to="/juegos/palabra-del-dia" img={coverPalabra} title={t("dash.word")} desc={t("dash.wordDesc")} tone="card" />
          </nav>

          {/* NOVEDAD — Librería Jaikuaa */}
          <NovedadLibreria />

          {/* RETAR — la tarjeta de «¿Quién sabe más guaraní?», con su código de embajador */}
          <RetoCard guest={false} />

          <div className="mt-6 space-y-3">
            <StatsBar />
            <p className="px-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{t("dash.xpStrong")}</span> {t("dash.xpRest")}
            </p>
            <StreakBanner />
            <OfflinePackCard />
          </div>

          <h2 className="mt-10 text-center font-display text-lg font-semibold text-muted-foreground">
            {t("dash.explore")}
          </h2>

          {/* 3. ACCESO DOCENTE */}
          <AulaPendientes />
          <StaffShortcuts />
          <PilotCard />

          {/* 4. TRES PILARES */}
          <Tabs defaultValue="aprender" className="mt-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl p-1 sm:grid-cols-4">
              <TabsTrigger value="aprender" className="min-h-11 rounded-xl py-2.5 text-sm">
                <BookOpen className="mr-1.5 h-4 w-4" aria-hidden /> {t("nav.learn")}
              </TabsTrigger>
              <TabsTrigger value="jugar" className="min-h-11 rounded-xl py-2.5 text-sm">
                <Gamepad2 className="mr-1.5 h-4 w-4" aria-hidden /> {t("dash.play")}
              </TabsTrigger>
              <TabsTrigger value="herramientas" className="min-h-11 rounded-xl py-2.5 text-sm">
                <Wrench className="mr-1.5 h-4 w-4" aria-hidden /> {t("dash.tools")}
              </TabsTrigger>
              <TabsTrigger value="noticias" className="min-h-11 rounded-xl py-2.5 text-sm">
                <Newspaper className="mr-1.5 h-4 w-4" aria-hidden /> {t("dash.news")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aprender" className="mt-6">
              <img
                src={bannerAprender}
                alt="Jai escucha audio en el celular, recostado junto a un libro abierto, al atardecer"
                className="mb-4 aspect-[16/9] w-full rounded-2xl object-cover sm:aspect-[21/9]"
                width={1280}
                height={720}
                loading="lazy"
              />
              <p className="mb-4 text-sm text-muted-foreground">
                {t("d.learnIntro")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FreeCard to="/curso/guarani" img={bannerCurso} cover title={t("d.course.t")} desc={t("d.course.d")} accent="accent" />
                <FreeCard to="/guarani-escolar" img={bannerEscolar} cover title={t("d.school.t")} desc={t("d.school.d")} accent="accent" inValidation />
                <FreeCard to="/logros" img={medallaPrimerPaso} title={t("d.ach.t")} desc={t("d.ach.d")} accent="primary" />
                <FreeCard to="/embajadores" img={jaiEmbajador} title={t("d.invite.t")} desc={t("d.invite.d")} accent="primary" />
                <FreeCard to="/certificado" img={jaiGraduado} title={t("d.cert.t")} desc={t("d.cert.d")} accent="primary" />
              </div>
            </TabsContent>

            <TabsContent value="jugar" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                {t("d.playIntro")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FreeCard to="/trivia" img={coverTrivia} cover title={t("d.trivia.t")} desc={t("d.trivia.d")} accent="accent" inValidation />
                <FreeCard to="/juegos" img={coverPenales} cover title={t("d.games.t")} desc={t("d.games.d")} accent="accent" />
                <FreeCard to="/ranking" img={jaiTrofeo} title={t("d.rank.t")} desc={t("d.rank.d")} accent="primary" />
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
                <p className="font-display font-bold text-foreground">{t("d.more.t")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("d.more.d")}
                </p>
                <Link to="/juegos" className="mt-2 inline-block text-sm font-semibold text-primary">
                  {t("d.more.link")} →
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="herramientas" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                {t("d.toolsIntro")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FreeCard to="/libreria" icon={BookOpen} title="Librería Jaikuaa" desc="Libros que se leen y libros que hablan. En desarrollo." accent="accent" />
                <FreeCard to="/aula" img={jaiProfe} title={t("d.aula.t")} desc={t("d.aula.d")} accent="primary" />
                <FreeCard to="/pronunciar" img={jaiBienvenida} title={t("d.pron.t")} desc={t("d.pron.d")} accent="primary" />
                <FreeCard to="/mostrador" img={jaiAtencion} title={t("d.mostr.t")} desc={t("d.mostr.d")} accent="primary" inValidation />
                <FreeCard to="/teclado" icon={Keyboard} title={t("d.kb.t")} desc={t("d.kb.d")} accent="primary" />
                <FreeCard to="/glosario" img={triviaVocabulario} title={t("d.gloss.t")} desc={t("d.gloss.d")} accent="primary" />
                <FreeCard to="/agro" img={jaiAgro} title="Jaikuaa Agro-Rural" desc={t("d.agro.d")} accent="primary" />
                {AI_GUARANI_TOOLS_ENABLED && (
                  <>
                    <FreeCard to="/traductor" icon={Languages} title="Traductor" desc="Consulta rápida guaraní – español." accent="primary" experimental />
                    <FreeCard to="/tutor" icon={Sparkles} title="Tutor IA" desc="Conversá con un asistente para practicar." accent="primary" experimental />
                  </>
                )}
                <FreeCard to="/nhe-mbytepe" icon={MessagesSquare} title="Ñe'ẽ Mbytépe" desc={t("d.street.d")} accent="primary" inValidation />
              </div>
            </TabsContent>

            <TabsContent value="noticias" className="mt-6">
              <NhandeMarandu className="" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />

      {/* Teaser modals */}
      <Dialog open={openTeaser === "karaoke"} onOpenChange={(o) => !o && setOpenTeaser(null)}>
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-gradient-to-br from-[#1E3A5F] via-[#2A4A73] to-[#C8102E] p-0 text-white">
          <div className="relative flex flex-col p-7 sm:p-10">
            <span className="absolute -right-6 -bottom-6 text-9xl opacity-10" aria-hidden>
              🎵
            </span>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.10),transparent_40%)] pointer-events-none" />
            <DialogHeader className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  🎤
                </span>
                <DialogTitle className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  KARAOKE ÑE'Ẽ
                </DialogTitle>
              </div>
              <DialogDescription className="text-base leading-relaxed text-white/90 sm:text-lg">
                El guaraní no tiene un solo género. Tiene ALMA.
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 mt-8 space-y-6 text-sm leading-relaxed text-white/90 sm:text-base">
              <div className="space-y-3">
                <p>Cantá guaranías, rap, trap, reggae, cachaca, rock y más.</p>
                <p>En guaraní puro o en jopara. Tu voz, tu ritmo, tu lengua.</p>
                <p>
                  ¿Querés competir con amigos? Adentro. ¿Preferís cantar a tu ritmo, solo? También.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Guaranía clásica</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Rap ñe'ẽ</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Trap jopara</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Reggae guaraní</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Cachaca/Chamamé</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Rock paraguayo</span>
                </li>
              </ul>
              <div className="flex flex-col items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  Próximamente
                </span>
                <p className="text-sm text-white/80">Prepará tu voz.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTeaser === "vivo"} onOpenChange={(o) => !o && setOpenTeaser(null)}>
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-gradient-to-br from-[#C8102E] via-[#A01024] to-[#1E3A5F] p-0 text-white">
          <div className="relative flex flex-col p-7 sm:p-10">
            <span className="absolute -right-6 -bottom-6 text-9xl opacity-10" aria-hidden>
              📡
            </span>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.10),transparent_40%)] pointer-events-none" />
            <DialogHeader className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  🔴
                </span>
                <DialogTitle className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  GUARANÍ EN VIVO
                </DialogTitle>
              </div>
              <DialogDescription className="text-base leading-relaxed text-white/90 sm:text-lg">
                El guaraní no se guarda en libros. Se habla. Se comparte. Se VIVE.
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 mt-8 space-y-6 text-sm leading-relaxed text-white/90 sm:text-base">
              <p>
                Transmisiones en vivo con hablantes nativos, artistas, maestros y sabios de todo
                Paraguay.
              </p>
              <ul className="space-y-3">
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Referentes y especialistas del guaraní
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Debates sobre el uso, la historia y el futuro del guaraní
                      </p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Hablantes nativos de distintas regiones
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Conversaciones en guaraní puro y jopara
                      </p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Artistas del rap y la música urbana en guaraní
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Letras, ritmo y cultura en ñe'ẽ
                      </p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Talleres familiares
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Aprendé guaraní junto a tus hijos
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
              <p>Chat en vivo. Preguntá en tiempo real. La comunidad del ñe'ẽ, conectada.</p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  Próximamente
                </span>
                <p className="text-sm text-white/80">Prepará tus preguntas.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Acceso a una sección: en el celular es una fila (imagen, nombre, flecha) fácil de tocar;
 * en pantallas anchas se reparte en dos columnas.
 */
function FreeCard({
  to,
  img,
  cover,
  icon: Icon,
  title,
  desc,
  accent,
  experimental,
  inValidation,
}: {
  to: string;
  img?: string;
  cover?: boolean;
  icon?: LucideIcon;
  title: string;
  desc: string;
  accent: "primary" | "accent";
  experimental?: boolean;
  inValidation?: boolean;
}) {
  const border =
    accent === "accent"
      ? "border-accent/40 hover:border-accent"
      : "border-primary/20 hover:border-primary/60";
  return (
    <Link
      to={to}
      className={`group flex min-h-[84px] items-center gap-3 rounded-2xl border ${border} bg-card p-3 pr-3 shadow-sm transition active:scale-[0.98] hover:shadow-md`}
    >
      {img ? (
        <img
          src={img}
          alt=""
          className={`h-16 w-16 shrink-0 rounded-xl ${cover ? "object-cover" : "bg-primary/5 object-contain p-1"}`}
          loading="lazy"
        />
      ) : Icon ? (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-base font-bold leading-tight text-foreground">{title}</span>
          {inValidation ? (
            <ValidationBadge />
          ) : experimental ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Experimental</span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{desc}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

/* Próxima novedad (plan real, en desarrollo): textos en los 6 idiomas de contenido. */
const NOV = {
  badge: { es: "Próxima novedad", pt: "Próxima novidade", en: "Coming soon", de: "Demnächst", fr: "Bientôt", zh: "即將推出" },
  dev: { es: "En desarrollo", pt: "Em desenvolvimento", en: "In development", de: "In Entwicklung", fr: "En développement", zh: "開發中" },
  title: { es: "Castellano técnico y formal", pt: "Espanhol técnico e formal", en: "Technical and formal Spanish", de: "Fach- und Amtsspanisch", fr: "Espagnol technique et formel", zh: "專業與正式西班牙語" },
  sub: { es: "para quienes ya hablan guaraní", pt: "para quem já fala guarani", en: "for people who already speak Guarani", de: "für alle, die schon Guaraní sprechen", fr: "pour ceux qui parlent déjà guarani", zh: "給已會說瓜拉尼語的人" },
  body: {
    es: "Redacción, trámites y vocabulario académico para jóvenes del interior. Se prepara y revisa con docentes especialistas.",
    pt: "Redação, trâmites e vocabulário acadêmico para jovens do interior. É preparado e revisado com professores especialistas.",
    en: "Writing, paperwork and academic vocabulary for young people from rural Paraguay. Prepared and reviewed with specialist teachers.",
    de: "Schreiben, Behördengänge und Fachwortschatz für junge Menschen vom Land. Vorbereitet und geprüft mit Fachlehrkräften.",
    fr: "Rédaction, démarches et vocabulaire académique pour les jeunes de l'intérieur du pays. Préparé et revu avec des enseignants spécialisés.",
    zh: "為鄉村青年準備的寫作、辦事手續與學術詞彙，由專業教師編寫並審閱。",
  },
  now: {
    es: "Hoy ya practicás en las dos direcciones: castellano ⇄ guaraní.",
    pt: "Hoje você já pratica nas duas direções: espanhol ⇄ guarani.",
    en: "You can already practise both ways today: Spanish ⇄ Guarani.",
    de: "Du übst schon heute in beide Richtungen: Spanisch ⇄ Guaraní.",
    fr: "Vous pratiquez déjà dans les deux sens : espagnol ⇄ guarani.",
    zh: "現在已可雙向練習：西班牙語 ⇄ 瓜拉尼語。",
  },
  alt: {
    es: "Joven estudiante del interior con cuaderno y celular, camino a la ciudad",
    pt: "Jovem estudante do interior com caderno e celular, a caminho da cidade",
    en: "Young student from rural Paraguay with a notebook and phone, on the way to the city",
    de: "Junge Studentin vom Land mit Heft und Handy auf dem Weg in die Stadt",
    fr: "Jeune étudiant de l'intérieur avec un cahier et un téléphone, en route vers la ville",
    zh: "帶著筆記本和手機、前往城市的鄉村青年學生",
  },
} as const;

function NovedadCastellano() {
  const lang = useAppLang();
  const x = (k: keyof typeof NOV) => NOV[k][lang] ?? NOV[k].es;
  return (
    <section aria-labelledby="novedad-castellano" className="relative mt-5 overflow-hidden rounded-3xl border border-primary/20 shadow-xl">
      <img src={bannerCastellano} alt={x("alt")} width={1280} height={640} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[30%_center]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/10 sm:bg-gradient-to-l sm:from-primary sm:via-primary/85 sm:to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-primary-foreground/15 to-transparent motion-safe:animate-[shine_5s_ease-in-out_infinite]" />
      <div className="relative flex min-h-[320px] flex-col justify-end p-5 sm:ml-auto sm:min-h-[280px] sm:w-3/5 sm:justify-center sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-accent-foreground shadow">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-accent-foreground/70 motion-safe:animate-ping" /><span className="relative h-2 w-2 rounded-full bg-accent-foreground" /></span>
            {x("badge")}
          </span>
          <span className="rounded-full border border-primary-foreground/40 bg-primary-foreground/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary-foreground backdrop-blur-sm">
            {x("dev")}
          </span>
        </div>
        <h2 id="novedad-castellano" className="mt-3 font-display text-2xl font-bold leading-tight text-primary-foreground sm:text-3xl">
          {x("title")}
          <span className="block text-base font-semibold text-primary-foreground/85 sm:text-lg">{x("sub")}</span>
        </h2>
        <p className="mt-2 text-sm text-primary-foreground/90">{x("body")}</p>
        <p className="mt-3 text-xs font-medium text-primary-foreground/75">{x("now")}</p>
      </div>
    </section>
  );
}
