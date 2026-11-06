import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import {
  BookOpen, Headphones, Globe2, HandCoins, Stethoscope, Scale, Languages,
  Feather, GraduationCap, Send, FileText, Mic, CheckCircle2, Building2, PenLine,
} from "lucide-react";

export const Route = createFileRoute("/libreria")({
  head: () => ({
    meta: [
      { title: "Librería Jaikuaa — Libros que se leen y se escuchan" },
      { name: "description", content: "La librería digital de Jaikuaa para obras en guaraní y bilingües: lectura en el celular y libros con voz humana real. Autores y editoriales pueden postular sus obras." },
      { property: "og:title", content: "Librería Jaikuaa — Libros que hablan, con voz humana real" },
      { property: "og:description", content: "Autores, docentes y editoriales: llevá tus obras en guaraní a paraguayos de todo el mundo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/libreria" }],
  }),
  component: LibreriaPage,
});

const AREAS = [
  { icon: Stethoscope, name: "Salud y medicina", tone: "from-primary to-primary/70" },
  { icon: Scale, name: "Derecho y función pública", tone: "from-accent to-accent/70" },
  { icon: Languages, name: "Gramática y diccionarios", tone: "from-primary/90 to-accent/80" },
  { icon: Feather, name: "Literatura y relatos", tone: "from-accent/90 to-primary/80" },
  { icon: GraduationCap, name: "Escolar y didáctico", tone: "from-primary to-accent" },
];

const PASOS = [
  { icon: Send, t: "Nos contás tu obra", d: "Completás el formulario de abajo en un minuto. Te respondemos por WhatsApp." },
  { icon: FileText, t: "Charlamos y firmamos", d: "Vemos juntos el formato, el precio y el reparto. Todo por escrito, con cada autor o editorial." },
  { icon: Mic, t: "Preparamos el libro", d: "Lo pasamos a digital y, si querés, grabamos la voz humana: la tuya o la de un docente." },
  { icon: BookOpen, t: "Sale a la vitrina", d: "Tu obra aparece en Jaikuaa y llega a paraguayos en todo el mundo. Recibís un informe mensual." },
];

function LibreriaPage() {
  const [tipo, setTipo] = useState<"autor" | "editorial">("autor");
  const [nombre, setNombre] = useState("");
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState(AREAS[0].name);
  const [voz, setVoz] = useState(true);
  const [detalle, setDetalle] = useState("");

  const listo = nombre.trim().length > 1 && titulo.trim().length > 1;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!listo) return;
    const txt = [
      "Mba'éichapa. Quiero postular a la Librería Jaikuaa.",
      `Soy: ${tipo === "autor" ? "Autor/a o docente" : "Editorial"}`,
      `Nombre: ${nombre.trim()}`,
      `Obra(s): ${titulo.trim()}`,
      `Área: ${area}`,
      `Me interesa el libro con voz humana: ${voz ? "Sí" : "Por ahora no"}`,
      detalle.trim() ? `Detalle: ${detalle.trim()}` : "",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(txt)}`, "_blank", "noopener");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <a href="#postular" className="ml-auto">
            <Button size="sm">Postular mi obra</Button>
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Portada */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 px-4 pb-14 pt-10 text-primary-foreground sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <BookOpen className="h-3.5 w-3.5" /> Librería Jaikuaa · En desarrollo
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">
              Libros que se leen <span className="block text-accent-foreground/90">y libros que hablan</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              La casa digital de las obras en guaraní y bilingües. Para leer en el celular y, por primera vez,
              escuchar cada página con <strong>voz humana real</strong>: la del autor o la de un docente.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#postular"><Button size="lg" variant="secondary" className="w-full sm:w-auto"><PenLine className="mr-2 h-4 w-4" />Soy autor o editorial</Button></a>
              <a href="#como"><Button size="lg" variant="outline" className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto">Cómo funciona</Button></a>
            </div>
          </div>
        </section>

        {/* Dos formatos */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
              <BookOpen className="h-8 w-8 text-primary" />
              <h2 className="mt-3 font-display text-xl font-bold">Para leer</h2>
              <p className="mt-2 text-sm text-muted-foreground">Edición digital que se abre al instante en el celular, desde cualquier país. También se puede pedir en papel.</p>
            </div>
            <div className="rounded-2xl border-2 border-accent/50 bg-card p-6 shadow-elegant">
              <div className="flex items-center justify-between">
                <Headphones className="h-8 w-8 text-accent" />
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase text-accent-foreground">Lo nuevo</span>
              </div>
              <h2 className="mt-3 font-display text-xl font-bold">Libros que hablan</h2>
              <p className="mt-2 text-sm text-muted-foreground">Leés y escuchás la pronunciación exacta, párrafo por párrafo. Siempre voz de una persona: nunca voz de máquina.</p>
            </div>
          </div>
        </section>

        {/* Áreas */}
        <section className="px-4 pb-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">Las estanterías que estamos armando</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Estas semanas sumamos las primeras obras. Cada libro se muestra recién cuando el autor lo autoriza.</p>
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {AREAS.map((a) => (
                <div key={a.name} className="group">
                  <div className={`relative flex aspect-[3/4] flex-col justify-between rounded-r-xl rounded-l-sm bg-gradient-to-br ${a.tone} p-3 text-primary-foreground shadow-elegant transition-transform group-hover:-translate-y-1`}>
                    <div className="absolute inset-y-0 left-0 w-2 rounded-l-sm bg-foreground/20" />
                    <a.icon className="ml-2 h-6 w-6 opacity-90" />
                    <div className="ml-2">
                      <p className="font-display text-sm font-bold leading-tight">{a.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide opacity-80">Próximamente</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="bg-muted/40 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">¿Por qué publicar en Jaikuaa?</h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Globe2, t: "Llegás a todo el mundo", d: "Paraguayos en Argentina, España, EE. UU. y más compran tu obra digital sin pagar flete." },
                { icon: Headphones, t: "Tu voz, tu libro", d: "Grabamos tu obra con voz humana. Un formato único que ninguna librería ofrece." },
                { icon: HandCoins, t: "Reparto claro", d: "La mayor parte es para quien crea, con informe mensual. Se firma con cada autor o editorial." },
              ].map((b) => (
                <div key={b.t} className="rounded-2xl border border-border/60 bg-card p-5">
                  <b.icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-3 font-display font-bold">{b.t}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{b.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-5 text-sm">
              <p className="font-semibold text-foreground">Lo que el juego tiene y una librería no</p>
              <p className="mt-1 text-muted-foreground">Quien termina un juego de un área (por ejemplo, el Consultorio) ve el libro de esa área. El juego despierta las ganas; el libro las profundiza.</p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como" className="scroll-mt-4 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">Cómo sumar tu obra, en 4 pasos</h2>
            <ol className="mt-7 space-y-3">
              {PASOS.map((p, i) => (
                <li key={p.t} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</div>
                  <div>
                    <p className="flex items-center gap-2 font-display font-bold"><p.icon className="h-4 w-4 text-accent" />{p.t}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
                <PenLine className="h-5 w-5 shrink-0 text-primary" />
                <p><strong>Autores y docentes:</strong> trato directo y rápido, con tu propio enlace para traer a tus alumnos.</p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
                <Building2 className="h-5 w-5 shrink-0 text-primary" />
                <p><strong>Editoriales:</strong> un nuevo canal digital internacional para tu catálogo en guaraní y bilingüe.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Formulario */}
        <section id="postular" className="scroll-mt-4 px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-elegant sm:p-8">
            <h2 className="font-display text-2xl font-bold">Postulá tu obra</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tarda un minuto. Se abre WhatsApp con tus datos listos para enviar.</p>
            <form onSubmit={enviar} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["autor", "editorial"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setTipo(k)}
                    className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${tipo === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                    {k === "autor" ? "Autor o docente" : "Editorial"}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-nombre">{tipo === "autor" ? "Tu nombre" : "Nombre de la editorial"}</label>
                <Input id="lb-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-titulo">Título de la obra (o de las obras)</label>
                <Input id="lb-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-area">Área</label>
                <select id="lb-area" value={area} onChange={(e) => setArea(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
                  <option>Otra</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/50 p-3 text-sm">
                <input type="checkbox" checked={voz} onChange={(e) => setVoz(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
                Me interesa que mi libro también hable (voz humana)
              </label>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-det">Algo más que quieras contarnos (opcional)</label>
                <Textarea id="lb-det" value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={600} rows={3} className="mt-1" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={!listo}>
                <Send className="mr-2 h-4 w-4" /> Enviar por WhatsApp
              </Button>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Postular no te compromete a nada. Los porcentajes y condiciones se acuerdan y firman con cada autor o editorial.
              </p>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
