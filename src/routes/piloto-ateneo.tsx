import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPilotPage } from "@/lib/pilot.functions";
import { redeemPendingPilotCode, savePendingPilotCode } from "@/lib/pilot-code";

export const Route = createFileRoute("/piloto-ateneo")({
  validateSearch: (s: Record<string, unknown>) => ({
    codigo: typeof s.codigo === "string" ? s.codigo.slice(0, 40) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plan piloto | Jaikuaa" },
      { name: "description", content: "Información del plan piloto de Jaikuaa." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Plan piloto | Jaikuaa" },
      { property: "og:description", content: "Información del plan piloto de Jaikuaa." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" },
    ],
  }),
  component: PilotPage,
});

const CODE_MSG: Record<string, string> = {
  ok: "Tu código fue aceptado. Ya formás parte del grupo del piloto.",
  full: "Este código ya alcanzó su cantidad máxima de usos.",
  invalid: "El código no es válido o venció.",
  rate: "Demasiados intentos. Probá de nuevo más tarde.",
};

function PilotPage() {
  const { codigo } = Route.useSearch();
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
    void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  const q = useQuery({
    queryKey: ["pilot-page"],
    queryFn: () => getPilotPage(),
    enabled: mounted,
  });
  const d = q.data;

  useEffect(() => {
    if (!d?.visible || d.draft || !codigo) return;
    savePendingPilotCode(codigo);
    void redeemPendingPilotCode().then((r) => r && setCodeMsg(CODE_MSG[r] ?? null));
  }, [d, codigo]);

  if (!mounted || q.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!d?.visible) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <BrandLogo />
        <h1 className="font-display text-2xl font-bold text-foreground">Página no disponible</h1>
        <Link to="/" className="text-sm font-medium text-accent hover:underline">
          Ir al inicio
        </Link>
      </div>
    );
  }

  const c = d.content;
  return (
    <div className="min-h-screen bg-background">
      {d.draft && (
        <div className="sticky top-0 z-20 bg-accent px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-accent-foreground sm:text-sm">
          BORRADOR — pendiente de aprobación del Ateneo. No compartir.
        </div>
      )}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <BrandLogo />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:py-14">
        <section className="rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground shadow-elegant">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{c.welcome.title}</h1>
          <p className="mt-4 text-base font-semibold sm:text-lg">{c.welcome.institutional}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">{c.welcome.line}</p>
          {codeMsg && (
            <p className="mx-auto mt-5 max-w-md rounded-xl bg-primary-foreground/15 px-4 py-2 text-sm">{codeMsg}</p>
          )}
          <Buttons signedIn={signedIn} />
        </section>

        <Section title={c.timeline.title}>
          <ol className="relative space-y-6 border-l-2 border-accent/40 pl-6">
            {c.timeline.stages.map((s) => (
              <li key={s.label} className="relative">
                <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-background bg-accent" />
                <div className="font-display text-lg font-bold text-primary">{s.label}</div>
                <div className="text-sm font-semibold text-foreground">
                  {s.when} · {s.who}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
          <Note>{c.timeline.note}</Note>
        </Section>

        <Section title={c.teachers.title}>
          <ol className="space-y-3">
            {c.teachers.steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground sm:text-base">{s}</span>
              </li>
            ))}
          </ol>
          <Note>{c.teachers.note}</Note>
        </Section>

        <Section title={c.recognition.title}>
          <List items={c.recognition.items} />
          <Note>{c.recognition.note}</Note>
        </Section>

        <Section title={c.students.title}>
          <List items={c.students.items} />
          <Note>{c.students.note}</Note>
        </Section>

        <Section title={c.data.title}>
          <List items={c.data.items} />
        </Section>

        <Section title={c.experimental.title}>
          <p className="rounded-2xl border border-border bg-muted/50 p-4 text-sm text-foreground">{c.experimental.text}</p>
        </Section>

        <Section title={c.contact.title}>
          <p className="text-sm text-foreground sm:text-base">{c.contact.org}</p>
          {d.contact && <p className="mt-1 text-sm font-semibold text-primary sm:text-base">{d.contact}</p>}
        </Section>

        <div className="pb-6">
          <Buttons signedIn={signedIn} dark />
        </div>
      </main>
    </div>
  );
}

function Buttons({ signedIn, dark }: { signedIn: boolean; dark?: boolean }) {
  if (signedIn) return null;
  return (
    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
      <Button asChild variant={dark ? "default" : "secondary"} size="lg">
        <Link to="/auth" search={{ mode: "signup" }}>
          Crear mi cuenta
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg" className={dark ? "" : "bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"}>
        <Link to="/auth" search={{ mode: "login" }}>
          Ingresar
        </Link>
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-2xl font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-sm text-foreground sm:text-base">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent">{children}</p>;
}
