import { createFileRoute, Link } from "@tanstack/react-router";
import { useTX } from "@/lib/i18n-pages";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { ValidationNotice } from "@/components/validation-notice";
import { TEMAS_AGRO } from "@/lib/guarani-tema-agro";
import jaiAgro from "@/assets/jai-agro.webp";

export const Route = createFileRoute("/_authenticated/agro")({
  head: () => ({
    meta: [
      { title: "Jaikuaa Agro-Rural | Guaraní para el campo" },
      { name: "description", content: "Vocabulario técnico agropecuario en guaraní: suelo, cultivos, ganado y trabajo en la chacra." },
      { property: "og:title", content: "Jaikuaa Agro-Rural" },
      { property: "og:description", content: "Guaraní técnico para escuelas agrícolas y extensión rural, también sin internet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgroPage,
});

function AgroPage() {
  const tx = useTX();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ValidationNotice />
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-display text-xl font-bold text-primary"><BrandLogo /></Link>
          <Button asChild variant="outline" size="sm"><Link to="/dashboard">{tx("back")}</Link></Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="text-center">
          <img src={jaiAgro} alt={tx("agAlt")} className="mx-auto mb-4 h-44 w-auto drop-shadow-xl sm:h-56" />
          <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Jaikuaa Agro-Rural 🌾</div>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">Ñemitỹ ha Ka'aguy</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {tx("agSub")}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground">
            {tx("agContent")}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TEMAS_AGRO.map((t) => (
            <Link
              key={t.slug}
              to="/guarani-escolar/tema/$topic"
              params={{ topic: t.slug }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md active:scale-[0.99]"
            >
              <span className="text-4xl" aria-hidden>{t.emoji}</span>
              <span className="flex-1">
                <span className="block font-display text-lg font-semibold text-foreground">{t.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{t.subtitle}</span>
              </span>
              <span className="text-primary" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
