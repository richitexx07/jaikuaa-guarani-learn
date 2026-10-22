import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SUPPORT_WHATSAPP } from "@/lib/contact";

const NAV_LINKS = [
  { to: "/teclado", label: "Teclado" },
  { to: "/instituciones", label: "Instituciones" },
  { to: "/auspiciantes", label: "Auspiciantes" },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 font-display text-xl font-bold text-primary">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <Link to="/embajadores" className="font-semibold text-primary hover:underline">Invitar a alguien</Link>
          <a href="/studio" className="text-muted-foreground hover:text-foreground">Studio</a>
        </nav>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="absolute inset-x-0 top-16 z-50 border-b border-border bg-background shadow-lg md:hidden">
          <ul className="flex flex-col px-4 py-2">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/embajadores" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-base font-semibold text-primary hover:bg-muted">Invitar a alguien</Link>
            </li>
            <li>
              <a href="/studio" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted">Studio</a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function WhatsAppCta({ message, children }: { message: string; children: ReactNode }) {
  const href = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-md transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      {children}
    </a>
  );
}

export function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
        {intro && <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{intro}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function InfoCard({ emoji, title, children, tag }: { emoji: string; title: string; children: ReactNode; tag?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="flex items-center justify-between">
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
        {tag && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
            {tag}
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export function BackingList() {
  const items = [
    ["Honorable Cámara de Senadores", "Declaración N.° 547/2026, de Interés Nacional y Educativo."],
    ["Secretaría de Políticas Lingüísticas", "Resolución N.° 116/2026, de interés lingüístico."],
    ["Ateneo de Lengua y Cultura Guaraní", "Convenio Marco de Cooperación Institucional, firmado el 25 de septiembre de 2026."],
  ];
  return (
    <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
      {items.map(([who, what]) => (
        <li key={who} className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="font-display font-bold text-foreground">{who}</div>
          <div className="mt-1 text-sm text-muted-foreground">{what}</div>
        </li>
      ))}
    </ul>
  );
}
