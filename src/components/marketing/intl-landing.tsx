import { useEffect } from "react";
import { setAppLang } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { AudioLines, Briefcase, Clock, Landmark, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import heroImg from "@/assets/intl-hero.jpg";

export type IntlCopy = {
  lang: "pt" | "en" | "zh" | "de" | "fr" | "ja" | "ru" | "ko" | "ar" | "it" | "qu" | "hi" | "he" | "tr" | "sw";
  /** Aviso visible de traducción preliminar (pendiente de revisión nativa). */
  notice?: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  cta: string;
  login: string;
  pillarsTitle: string;
  pillars: { title: string; body: string }[];
  trustTitle: string;
  trust: string[];
  closingTitle: string;
  closingBody: string;
  imageAlt: string;
};

const ICONS = [Briefcase, AudioLines, Clock];

export function IntlLanding({ c }: { c: IntlCopy }) {
  useEffect(() => { if (c.lang !== "de" && c.lang !== "fr") setAppLang(c.lang); }, [c.lang]);
  return (
    <div lang={({ pt: "pt-BR", en: "en", zh: "zh-Hant-TW", de: "de", fr: "fr", ja: "ja", ru: "ru", ko: "ko", ar: "ar", it: "it", qu: "qu", hi: "hi", he: "he", tr: "tr", sw: "sw" } as const)[c.lang]} dir={c.lang === "ar" || c.lang === "he" ? "rtl" : "ltr"} className="flex min-h-screen flex-col bg-background">
      <header className="w-full border-b border-border/50 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <LanguageSwitcher current={c.lang} />
        </div>
      </header>
      {c.notice && (
        <div role="note" className="border-b border-border/50 bg-muted px-4 py-2 text-center text-xs font-medium text-muted-foreground">
          {c.notice}
        </div>
      )}

      <main className="flex-1">
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/70">{c.eyebrow}</p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
                {c.title} <span className="text-accent">{c.titleAccent}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-primary-foreground/85">{c.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="cta" size="lg" asChild>
                  <Link to="/comenzar">{c.cta}</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                  <Link to="/auth" search={{ mode: "login" }}>{c.login}</Link>
                </Button>
              </div>
            </div>
            <img
              src={heroImg}
              alt={c.imageAlt}
              width={1536}
              height={1024}
              className="w-full rounded-2xl shadow-2xl ring-1 ring-primary-foreground/10"
            />
          </div>
          <div className="flex h-1.5">
            <span className="flex-1 bg-accent" />
            <span className="flex-1 bg-background" />
            <span className="flex-1 bg-primary" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">{c.pillarsTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {c.pillars.map((p, i) => {
              const Icon = ICONS[i] ?? Briefcase;
              return (
                <article key={p.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border/50 bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-center font-display text-xl font-semibold text-foreground">{c.trustTitle}</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {c.trust.map((t, i) => {
                const Icon = i === 2 ? ShieldCheck : Landmark;
                return (
                  <li key={t} className="flex items-start gap-3 rounded-xl bg-card p-4 text-sm text-foreground shadow-sm">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-foreground">{c.closingTitle}</h2>
          <p className="mt-4 text-muted-foreground">{c.closingBody}</p>
          <Button variant="cta" size="lg" className="mt-8" asChild>
            <Link to="/comenzar">{c.cta}</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Jaikuaa · Guaraní Global Tech E.A.S. · Paraguay
      </footer>
    </div>
  );
}
