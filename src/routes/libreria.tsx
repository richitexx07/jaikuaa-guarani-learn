import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import jaiProfe from "@/assets/jai-profe.webp";
import coverConsultorio from "@/assets/covers/cover-consultorio.webp";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { LIB_COLORES, Nanduti } from "@/components/libreria/arte";
import { CatalogoLibreria } from "@/components/libreria/catalogo";
import {
  BookOpen, Headphones, Globe2, HandCoins, Stethoscope, Scale, Languages,
  Feather, GraduationCap, Send, FileText, Mic, CheckCircle2, Building2, PenLine, ArrowRight,
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

const C = LIB_COLORES;

/** Cada estantería es un lomo de libro: color, altura y un pequeño detalle de ñandutí. */
const AREAS = [
  { icon: Stethoscope, name: "Salud y medicina", bg: "#1F6F6B", alto: 92, inclinado: false },
  { icon: Scale, name: "Derecho y función pública", bg: C.azul, alto: 100, inclinado: false },
  { icon: Languages, name: "Gramática y diccionarios", bg: "#8E1B2A", alto: 86, inclinado: true },
  { icon: Feather, name: "Literatura y relatos", bg: "#B8741A", alto: 96, inclinado: false },
  { icon: GraduationCap, name: "Escolar y didáctico", bg: "#3C4E8C", alto: 90, inclinado: false },
];

const PASOS = [
  { icon: Send, t: "Nos contás tu obra", d: "Completás el formulario de abajo en un minuto. Te respondemos por WhatsApp." },
  { icon: FileText, t: "Charlamos y firmamos", d: "Vemos juntos el formato, el precio y el reparto. Todo por escrito, con cada autor o editorial." },
  { icon: Mic, t: "Preparamos el libro", d: "Lo pasamos a digital y, si querés, grabamos la voz humana: la tuya o la de un docente." },
  { icon: BookOpen, t: "Sale a la vitrina", d: "Tu obra aparece en Jaikuaa y llega a paraguayos en todo el mundo. Recibís un informe mensual." },
];

const CSS = `
.lb-onda i{display:block;width:6px;border-radius:6px;background:linear-gradient(${C.dorado},#E59A2B);animation:lb-onda 1.6s ease-in-out infinite;transform-origin:50% 50%}
@keyframes lb-onda{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.lb-jai{animation:lb-flota 5s ease-in-out infinite}
@keyframes lb-flota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.lb-lomo{transition:transform .35s cubic-bezier(.2,.9,.3,1.2)}
.lb-lomo:hover,.lb-lomo:focus-visible{transform:translateY(-14px) rotate(-2deg)}
.lb-pagina{animation:lb-pag 6s ease-in-out infinite;transform-origin:0 50%}
@keyframes lb-pag{0%,70%,100%{transform:rotateY(0)}80%{transform:rotateY(-160deg)}90%{transform:rotateY(-160deg)}}
@media (prefers-reduced-motion: reduce){.lb-onda i,.lb-jai,.lb-pagina{animation:none!important}}
`;

/** El libro abierto del que sale la voz. */
function LibroQueHabla() {
  return (
    <div className="relative mx-auto h-44 w-64 [perspective:900px] sm:h-52 sm:w-80" aria-hidden>
      <div className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-black/30 blur-md" />
      <div className="absolute bottom-3 left-1/2 flex h-36 w-[92%] -translate-x-1/2 sm:h-44">
        <div className="h-full w-1/2 rounded-l-xl border-r border-black/10 p-4" style={{ background: C.papel, boxShadow: "inset -10px 0 18px rgba(0,0,0,.12)" }}>
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="mb-2.5 h-1.5 rounded-full bg-[#1B2433]/15" style={{ width: `${88 - (i % 3) * 14}%` }} />)}
        </div>
        <div className="relative h-full w-1/2 rounded-r-xl p-4" style={{ background: C.papel, boxShadow: "inset 10px 0 18px rgba(0,0,0,.12)" }}>
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="mb-2.5 h-1.5 rounded-full bg-[#1B2433]/15" style={{ width: `${80 - (i % 2) * 18}%` }} />)}
          <div className="lb-pagina absolute inset-0 rounded-r-xl" style={{ background: "#FFFDF6", boxShadow: "inset 6px 0 12px rgba(0,0,0,.08)" }} />
        </div>
      </div>
      <div className="lb-onda absolute -top-2 left-1/2 flex h-16 -translate-x-1/2 items-center gap-1.5">
        {Array.from({ length: 13 }, (_, i) => <i key={i} style={{ height: `${28 + ((i * 37) % 36)}px`, animationDelay: `${(i % 7) * 0.12}s` }} />)}
      </div>
    </div>
  );
}

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
      <style>{CSS}</style>
      <MarketingHeader accion={<a href="#postular" className="shrink-0"><Button size="sm">Postular mi obra</Button></a>} />

      <main className="flex-1 pb-24 md:pb-0">
        {/* Portada: de noche, con encaje de ñandutí, el Jai lector y un libro que habla */}
        <section className="relative overflow-hidden px-4 pb-16 pt-10 text-white sm:px-6 sm:pt-14" style={{ background: `radial-gradient(90% 70% at 50% 30%, #24497A 0%, ${C.azul} 40%, ${C.noche} 100%)` }}>
          <Nanduti className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-white/10 sm:h-[560px] sm:w-[560px]" />
          <Nanduti className="pointer-events-none absolute -bottom-40 -left-32 h-[380px] w-[380px] text-white/[.07]" />
          <div className="relative mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
                <BookOpen className="h-3.5 w-3.5" /> Librería Jaikuaa · En desarrollo
              </span>
              <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl">
                Libros que se leen
                <span className="block" style={{ color: C.dorado }}>y libros que hablan</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
                La casa digital de las obras en guaraní y bilingües. Para leer en el celular y también
                escuchar cada página con <strong className="text-white">voz humana real</strong>: la del autor o la de un docente.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
                <a href="#postular" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-display font-bold shadow-lg transition hover:brightness-105" style={{ background: C.dorado, color: C.noche }}>
                  <PenLine className="h-4 w-4" /> Soy autor o editorial
                </a>
                <a href="#como" className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/40 px-6 font-semibold text-white hover:bg-white/10">Cómo funciona</a>
              </div>
            </div>
            <div className="relative">
              <LibroQueHabla />
              <img src={jaiProfe} alt="Jai, el jaguareté, con un libro en la mano" width={537} height={720} className="lb-jai absolute -bottom-6 -right-2 h-40 w-auto drop-shadow-2xl sm:-right-6 sm:h-52" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-2" aria-hidden>
            <i className="block flex-1" style={{ background: C.rojo }} />
            <i className="block flex-1 bg-white" />
            <i className="block flex-1" style={{ background: "#2F62C9" }} />
          </div>
        </section>

        {/* Dos formatos */}
        <section className="px-4 py-14 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-elegant" style={{ background: `linear-gradient(135deg, ${C.azul}, ${C.noche})` }}>
              <div className="absolute inset-y-0 left-0 w-3" style={{ background: "rgba(0,0,0,.25)" }} aria-hidden />
              <BookOpen className="ml-2 h-9 w-9" style={{ color: C.dorado }} />
              <h2 className="ml-2 mt-3 font-display text-2xl font-bold">Para leer</h2>
              <p className="ml-2 mt-2 text-[15px] leading-relaxed text-white/85">Edición digital que se abre al instante en el celular, desde cualquier país. También se puede pedir en papel.</p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border-2 p-6 shadow-elegant" style={{ background: "#fff", borderColor: C.dorado }}>
              <div className="flex items-center justify-between">
                <Headphones className="h-9 w-9" style={{ color: C.rojo }} />
                <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: C.dorado, color: C.noche }}>Lo nuevo</span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold" style={{ color: C.tinta }}>Libros que hablan</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Leés y escuchás la pronunciación exacta, párrafo por párrafo. Siempre voz de una persona: nunca voz de máquina.</p>
              <div className="lb-onda mt-4 flex h-8 items-center gap-1" aria-hidden>
                {Array.from({ length: 22 }, (_, i) => <i key={i} style={{ height: `${12 + ((i * 29) % 20)}px`, width: 4, animationDelay: `${(i % 9) * 0.1}s` }} />)}
              </div>
            </div>
          </div>
        </section>

        {/* Libros ya publicados (si hay) */}
        <CatalogoLibreria />

        {/* Estantería de verdad: lomos de libros sobre una tabla de madera */}
        <section className="px-4 pb-16 pt-4 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>Las estanterías que estamos armando</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-[15px] text-muted-foreground">Estas semanas sumamos las primeras obras. Cada libro se muestra recién cuando el autor lo autoriza.</p>
            <div className="relative mt-10">
              <div className="flex items-end justify-center gap-2 px-2 sm:gap-4">
                {AREAS.map((a) => (
                  <div
                    key={a.name}
                    tabIndex={0}
                    className="lb-lomo relative flex w-[19%] max-w-[120px] flex-col items-center justify-between rounded-t-md px-1.5 pb-3 pt-3 text-white shadow-[4px_0_10px_rgba(0,0,0,.25)] outline-none"
                    style={{ background: `linear-gradient(90deg, rgba(0,0,0,.25), rgba(255,255,255,.08) 30%, rgba(0,0,0,.15)), ${a.bg}`, height: `${a.alto * 2.3}px`, transform: a.inclinado ? "rotate(4deg) translateX(4px)" : undefined }}
                  >
                    <span className="block h-1 w-[80%] rounded-full" style={{ background: C.dorado }} aria-hidden />
                    <a.icon className="h-5 w-5 opacity-95" />
                    <p className="font-display text-[13px] font-bold leading-tight sm:text-sm" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{a.name}</p>
                    <span className="block h-1 w-[80%] rounded-full" style={{ background: C.dorado }} aria-hidden />
                  </div>
                ))}
              </div>
              <div className="h-5 rounded-md shadow-[0_10px_20px_rgba(0,0,0,.25)]" style={{ background: "linear-gradient(#B9824B, #8A5A2F)" }} aria-hidden />
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximamente</p>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="px-4 py-14 sm:px-6" style={{ background: C.noche }}>
          <div className="mx-auto max-w-4xl text-white">
            <h2 className="text-center font-display text-3xl font-bold">¿Por qué publicar en <span style={{ color: C.dorado }}>Jaikuaa</span>?</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Globe2, t: "Llegás a todo el mundo", d: "Paraguayos en Argentina, España, EE. UU. y más van a poder comprar tu obra digital sin pagar flete." },
                { icon: Headphones, t: "Tu voz, tu libro", d: "Grabamos tu obra con voz humana, para que quien aprende escuche cómo se pronuncia." },
                { icon: HandCoins, t: "Reparto claro", d: "El porcentaje depende de quién trae al lector y se firma con cada autor o editorial. Informe todos los meses." },
              ].map((b) => (
                <div key={b.t} className="rounded-3xl border border-white/15 bg-white/[.06] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: C.dorado }}>
                    <b.icon className="h-6 w-6" style={{ color: C.noche }} />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold">{b.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/80">{b.d}</p>
                </div>
              ))}
            </div>
            {/* Del juego al libro */}
            <div className="mt-8 grid items-center gap-5 rounded-3xl p-5 sm:grid-cols-[1fr_auto_1fr] sm:p-6" style={{ background: "linear-gradient(135deg, rgba(246,196,69,.16), rgba(255,255,255,.04))", boxShadow: "inset 0 0 0 1.5px rgba(246,196,69,.4)" }}>
              <img src={coverConsultorio} alt="Consultorio de Jai, el juego de guaraní médico" width={800} height={600} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg" />
              <ArrowRight className="mx-auto h-8 w-8 rotate-90 sm:rotate-0" style={{ color: C.dorado }} aria-hidden />
              <div>
                <p className="font-display text-xl font-bold">Lo que el juego tiene y una librería no</p>
                <p className="mt-2 text-[15px] leading-relaxed text-white/80">Quien termina un juego de un área (por ejemplo, el Consultorio) ve el libro de esa área. El juego despierta las ganas; el libro las profundiza.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona: un camino con hilo dorado */}
        <section id="como" className="scroll-mt-4 px-4 py-14 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>Cómo sumar tu obra, en 4 pasos</h2>
            <ol className="relative mt-9 space-y-5 before:absolute before:bottom-6 before:left-[23px] before:top-6 before:w-1 before:rounded-full before:bg-[#F6C445]">
              {PASOS.map((p, i) => (
                <li key={p.t} className="relative flex gap-4">
                  <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold text-white shadow-md" style={{ background: C.azul }}>{i + 1}</div>
                  <div className="flex-1 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-2 font-display text-lg font-bold" style={{ color: C.tinta }}><p.icon className="h-5 w-5" style={{ color: C.rojo }} />{p.t}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl bg-white p-4 text-[15px] shadow-sm">
                <PenLine className="h-5 w-5 shrink-0" style={{ color: C.azul }} />
                <p><strong>Autores y docentes:</strong> trato directo y rápido, con tu propio enlace para traer a tus alumnos.</p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-white p-4 text-[15px] shadow-sm">
                <Building2 className="h-5 w-5 shrink-0" style={{ color: C.azul }} />
                <p><strong>Editoriales:</strong> un nuevo canal digital internacional para tu catálogo en guaraní y bilingüe.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Formulario */}
        <section id="postular" className="scroll-mt-4 px-4 pb-16 pt-4 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-elegant ring-1 ring-black/5">
            <div className="flex items-center gap-4 px-6 py-5 text-white sm:px-8" style={{ background: `linear-gradient(135deg, ${C.azul}, ${C.noche})` }}>
              <img src={jaiProfe} alt="" width={537} height={720} loading="lazy" className="h-16 w-auto" />
              <div>
                <h2 className="font-display text-2xl font-bold">Postulá tu obra</h2>
                <p className="mt-0.5 text-sm text-white/80">Tarda un minuto. Se abre WhatsApp con tus datos listos para enviar.</p>
              </div>
            </div>
            <form onSubmit={enviar} className="space-y-4 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-2">
                {(["autor", "editorial"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setTipo(k)} aria-pressed={tipo === k}
                    className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${tipo === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                    {k === "autor" ? "Autor o docente" : "Editorial"}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-nombre">{tipo === "autor" ? "Tu nombre" : "Nombre de la editorial"}</label>
                <Input id="lb-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} className="mt-1 h-11" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-titulo">Título de la obra (o de las obras)</label>
                <Input id="lb-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} className="mt-1 h-11" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-area">Área</label>
                <select id="lb-area" value={area} onChange={(e) => setArea(e.target.value)}
                  className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm">
                  {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
                  <option>Otra</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-sm" style={{ background: "#FFF3D1" }}>
                <input type="checkbox" checked={voz} onChange={(e) => setVoz(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
                Me interesa que mi libro también hable (voz humana)
              </label>
              <div>
                <label className="text-sm font-medium" htmlFor="lb-det">Algo más que quieras contarnos (opcional)</label>
                <Textarea id="lb-det" value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={600} rows={3} className="mt-1" />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!listo}>
                <Send className="mr-2 h-4 w-4" /> Enviar por WhatsApp
              </Button>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Postular no te compromete a nada. Los porcentajes y condiciones se acuerdan y firman con cada autor o editorial.
              </p>
            </form>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-center text-sm text-muted-foreground">¿Sos docente o traductor de guaraní? Sumate a <Link to="/expertos" className="font-semibold text-primary underline">Expertos Jaikuaa</Link>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
