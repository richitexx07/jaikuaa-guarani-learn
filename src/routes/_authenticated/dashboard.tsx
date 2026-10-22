import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ValidationBadge } from "@/components/validation-notice";
import { DisplayToggles } from "@/components/display-toggles";
import { AI_GUARANI_TOOLS_ENABLED } from "@/lib/features";
import { BrandLogo } from "@/components/brand-logo";
import { LogOut } from "lucide-react";
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
import { OfflinePackCard } from "@/components/offline/offline-pack-card";
import jaiImg from "@/assets/jai-tradicional.png";
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
      <Button asChild variant="cta" className="mt-3 h-auto min-h-14 w-full justify-start whitespace-normal py-3 text-left text-base">
        <Link to="/docente">🧑‍🏫 Panel del docente</Link>
      </Button>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-12 w-full justify-start">
          <Link to="/validar">⚡ Validación rápida</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 w-full justify-start">
          <Link to="/cuaderno">📒 Cuaderno digital del aula</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 w-full justify-start">
          <Link to="/admin/corpus">✅ Bandeja de validación</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 w-full justify-start">
          <Link to="/validacion">🔁 Circuito de validación</Link>
        </Button>
        {/* Studio (motor de Alan): solo administradores lo ven. */}
        {data.isAdmin && (
          <Button asChild variant="outline" className="h-auto min-h-12 w-full justify-start whitespace-normal py-2 text-left">
            <a href="/studio">🔬 Jaikuaa Studio · motor en desarrollo</a>
          </Button>
        )}
        {data.isAdmin && (
          <Button asChild variant="outline" className="h-12 w-full justify-start">
            <Link to="/admin/noticias">📰 Noticias para aprobar</Link>
          </Button>
        )}
        {data.isAdmin && (
          <Button asChild variant="outline" className="h-12 w-full justify-start">
            <Link to="/admin/jai">🐆 Qué le preguntan a Jai</Link>
          </Button>
        )}
      </div>
    </section>
  );
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
          <Link to="/practica">🎓 Panel de práctica</Link>
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

function BigAction({ to, emoji, title, desc, tone }: { to: "/curso/$lang" | "/juegos" | "/juegos/palabra-del-dia"; emoji: string; title: string; desc: string; tone: "primary" | "accent" | "card" }) {
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
      className={`flex min-h-[60px] items-center gap-3 rounded-2xl px-4 py-3 shadow-lift transition-transform active:scale-[0.98] sm:min-h-[72px] ${cls}`}
    >
      <span className="text-3xl leading-none sm:text-4xl" aria-hidden>{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-bold leading-tight sm:text-xl">{title}</span>
        <span className="block truncate text-xs opacity-90 sm:text-sm">{desc}</span>
      </span>
      <span className="text-2xl font-bold" aria-hidden>›</span>
    </Link>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Jaikuaa — Tu panel" }] }),
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
            <DisplayToggles />
            <AdminCorpusLink />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              aria-label="Cerrar sesión"
            >
              <LogOut />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          {/* 1. SALUDO DE JAI */}
          <div className="nanduti-bg flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-elegant">
            <img src={jaiAsset.url} alt="Jai, el jaguarete" className="h-20 w-20 shrink-0 object-contain" />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-4xl">
                ¡Che, {name ? <span className="text-accent">{name}</span> : "amigo"}! {greeting.emoji}
              </h1>
              <p className="mt-1 text-base text-muted-foreground">¿Qué querés hacer hoy? Tocá un botón.</p>
            </div>
          </div>

          {/* 2. TRES BOTONES GIGANTES */}
          <nav aria-label="Elegí qué hacer" className="mt-5 grid gap-3 sm:grid-cols-3">
            <BigAction to="/curso/$lang" emoji="📚" title="Aprender" desc="Seguí tu curso con voces reales" tone="primary" />
            <BigAction to="/juegos" emoji="🎮" title="Jugar" desc="11 juegos con palabras validadas" tone="accent" />
            <BigAction to="/juegos/palabra-del-dia" emoji="⭐" title="Palabra del día" desc="Una palabra nueva, en 1 minuto" tone="card" />
          </nav>

          {/* INVITAR — franja compacta con vida */}
          <Link
            to="/embajadores"
            className="group relative mt-5 flex items-center gap-3 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-card to-accent/10 px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-primary-foreground/40 to-transparent motion-safe:animate-[shine_3.5s_ease-in-out_infinite]" />
            <span aria-hidden className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <span className="absolute inset-0 rounded-full bg-accent/20 motion-safe:animate-ping" style={{ animationDuration: "2.6s" }} />
              <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor"><path d="M12 21s-7-4.35-9.5-8.5C.9 9.6 2.6 6 6 6c2 0 3.2 1.1 4 2.3h4C14.8 7.1 16 6 18 6c3.4 0 5.1 3.6 3.5 6.5C19 16.65 12 21 12 21z"/></svg>
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="font-display text-sm font-bold leading-tight text-foreground">¿Querés aprender y jugar?</p>
              <p className="text-xs text-muted-foreground">Invitá a un amigo o familiar</p>
            </div>
            <span className="relative inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              Compartir
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>

          <div className="mt-6 space-y-3">
            <StatsBar />
            <StreakBanner />
            <OfflinePackCard />
          </div>

          <h2 className="mt-10 text-center font-display text-lg font-semibold text-muted-foreground">
            Más cosas para explorar
          </h2>

          {/* 3. ACCESO DOCENTE */}
          <StaffShortcuts />
          <PilotCard />

          {/* 4. TRES PILARES */}
          <Tabs defaultValue="aprender" className="mt-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl p-1 sm:grid-cols-4">
              <TabsTrigger value="aprender" className="rounded-xl py-2.5 text-xs sm:text-sm">
                📚 Aprender
              </TabsTrigger>
              <TabsTrigger value="jugar" className="rounded-xl py-2.5 text-xs sm:text-sm">
                🎮 Jugar
              </TabsTrigger>
              <TabsTrigger value="herramientas" className="rounded-xl py-2.5 text-xs sm:text-sm">
                🛠️ Herramientas
              </TabsTrigger>
              <TabsTrigger value="noticias" className="rounded-xl py-2.5 text-xs sm:text-sm">
                📰 Noticias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aprender" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Contenido pedagógico ordenado, con audio humano.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FreeCard to="/curso/guarani" emoji="📚" title="Curso de Guaraní" desc="10 lecciones con audio humano real. Empezá desde cero y sumá XP." accent="accent" />
                <FreeCard to="/guarani-escolar" emoji="🎒" title="Guaraní Escolar" desc="Organizado según los grados escolares." accent="accent" inValidation />
                <FreeCard to="/logros" emoji="🏅" title="Mis logros" desc="Tus insignias, racha y avance." accent="primary" />
                <FreeCard to="/embajadores" emoji="🤝" title="Invitar a alguien" desc="¿Querés invitar a un amigo o familiar? Compartí tu enlace acá." accent="primary" />
                <FreeCard to="/certificado" emoji="📜" title="Certificado" desc="Terminá el Curso de Guaraní y descargá tu certificado." accent="primary" />
              </div>
            </TabsContent>

            <TabsContent value="jugar" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Practicá lo aprendido jugando. Todo gratis.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FreeCard to="/trivia" emoji="🧠" title="Preguntados paraguayo" desc="Girá la ruleta: gastronomía, mitos, deportes, música y más." accent="accent" inValidation />
                <FreeCard to="/juegos" emoji="⚽" title="Juegos de vocabulario" desc="Penales, Palabra del día, Ahorcado, Sopa de letras y Memoria." accent="accent" />
                <FreeCard to="/ranking" emoji="🏆" title="Ranking semanal" desc="Mirá quiénes estudiaron más esta semana en tu grupo." accent="primary" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  to="/juegos/karaoke"
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">Nuevo</span>
                  <div className="mt-1 font-display font-bold text-foreground">🎤 Purahéi Karaoke</div>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpenTeaser("vivo")}
                  className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Próximamente</span>
                  <div className="mt-1 font-display font-bold text-foreground">🔴 Guaraní en Vivo</div>
                </button>
              </div>
            </TabsContent>

            <TabsContent value="herramientas" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Apoyo y consulta.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FreeCard to="/teclado" emoji="⌨️" title="Teclado Guaraní" desc="Escribí con ã, g̃ y puso, y mandalo por WhatsApp." accent="primary" />
                <FreeCard to="/glosario" emoji="📖" title="Glosario" desc="Las palabras publicadas, con su significado y su audio." accent="primary" />
                <FreeCard to="/agro" emoji="🌾" title="Jaikuaa Agro-Rural" desc="Guaraní técnico del campo: suelo, cultivos y ganado." accent="primary" />
                {AI_GUARANI_TOOLS_ENABLED && (
                  <>
                    <FreeCard to="/traductor" emoji="🌐" title="Traductor" desc="Consulta rápida guaraní – español." accent="primary" experimental />
                    <FreeCard to="/tutor" emoji="✨" title="Tutor IA" desc="Conversá con un asistente para practicar." accent="primary" experimental />
                  </>
                )}
                <FreeCard to="/nhe-mbytepe" emoji="🗣️" title="Ñe'ẽ Mbytépe" desc="El guaraní que se habla en la calle." accent="primary" inValidation />
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

function FreeCard({
  to,
  emoji,
  title,
  desc,
  accent,
  experimental,
  inValidation,
}: {
  to: string;
  emoji: string;
  title: string;
  desc: string;
  accent: "primary" | "accent";
  experimental?: boolean;
  inValidation?: boolean;
}) {
  const border =
    accent === "accent"
      ? "border-accent/40 hover:border-accent"
      : "border-primary/30 hover:border-primary";
  const link = accent === "accent" ? "text-accent" : "text-primary";
  return (
    <Link
      to={to}
      className={`group relative flex flex-col gap-2 rounded-2xl border ${border} bg-card p-5 shadow-elegant card-hover hover:shadow-lift`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
        {inValidation ? (
          <ValidationBadge />
        ) : experimental ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Experimental
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Gratis
          </span>
        )}
      </div>
      <div className="font-display text-lg font-bold text-foreground">{title}</div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <span className={`mt-1 text-sm font-medium ${link}`}>Abrir →</span>
    </Link>
  );
}
