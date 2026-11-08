import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import jaiProfe from "@/assets/jai-profe.webp";
import jaiAtencion from "@/assets/jai-atencion-pro.webp";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { LIB_COLORES, Nanduti } from "@/components/libreria/arte";
import {
  GraduationCap, Languages, Video, FileText, Mic, Clapperboard, Building2, Globe2, Plane, HeartHandshake,
  Send, UserCheck, CalendarCheck, HandCoins, CheckCircle2, BookOpen, ShieldCheck, Search, UserPlus,
} from "lucide-react";

/**
 * «Expertos Jaikuaa»: el lugar donde se encuentran los que saben guaraní (docentes y traductores) con quienes los necesitan.
 * Por ahora se suman interesados por WhatsApp, igual que la Librería; el cobro dentro de la app llega con la pasarela de pago.
 * Nunca traducción de máquina: cada clase y cada traducción la hace una persona.
 */
export const Route = createFileRoute("/expertos")({
  head: () => ({
    meta: [
      { title: "Expertos Jaikuaa — Docentes y traductores de guaraní" },
      { name: "description", content: "Clases de guaraní con docentes y traducciones hechas por personas, sin máquina. Docentes y traductores pueden sumarse a Expertos Jaikuaa." },
      { property: "og:title", content: "Expertos Jaikuaa — Las personas que saben guaraní, a un toque" },
      { property: "og:description", content: "Clases con docentes y traducción e interpretación del guaraní, hechas por personas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/expertos" }],
  }),
  component: ExpertosPage,
});

const C = LIB_COLORES;
const VERDE = "#1F6F6B";

const TRADUCCION = [
  { icon: FileText, t: "Documentos", d: "Notas, contratos, folletos, carteles y textos institucionales." },
  { icon: Mic, t: "Interpretación", d: "En consultas médicas, audiencias, reuniones y actos, en persona o por videollamada." },
  { icon: Clapperboard, t: "Subtítulos y doblaje", d: "Películas, series, publicidad y videos para redes." },
  { icon: Globe2, t: "Apps y juegos", d: "Que una aplicación o un juego hable guaraní de verdad." },
  { icon: BookOpen, t: "Revisión de textos", d: "Antes de imprimir o publicar, un experto revisa el guaraní." },
];

const PARA_QUIEN = [
  { icon: Plane, t: "Paraguayos en el exterior", d: "Que los hijos no pierdan la lengua de la familia." },
  { icon: Globe2, t: "Extranjeros", d: "Que viven, trabajan o invierten en el Paraguay." },
  { icon: Building2, t: "Empresas e instituciones", d: "Que necesitan atender, comunicar o capacitar en guaraní." },
  { icon: Clapperboard, t: "Productoras y medios", d: "Que quieren llegar a todo el país, también al campo." },
];

const PASOS = [
  { icon: UserPlus, t: "Te sumás", d: "Completás el formulario de abajo. Te respondemos por WhatsApp." },
  { icon: ShieldCheck, t: "Revisamos tus datos", d: "Tus títulos y tu experiencia, antes de mostrar tu perfil. Cada experto responde por su trabajo." },
  { icon: CalendarCheck, t: "Te encuentran", d: "Tu perfil aparece con tu especialidad, tus horarios y tu precio." },
  { icon: HandCoins, t: "Cobrás", d: "En las clases, el docente se queda con el 70 %. En las traducciones, el reparto se firma con cada traductor." },
];

function ExpertosPage() {
  const [modo, setModo] = useState<"busco" | "soy">("busco");
  const [que, setQue] = useState<"clases" | "traduccion">("clases");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [detalle, setDetalle] = useState("");
  const listo = nombre.trim().length > 1 && (modo === "soy" || detalle.trim().length > 3);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!listo) return;
    const txt = [
      modo === "busco" ? "Mba'éichapa. Busco un experto en Expertos Jaikuaa." : "Mba'éichapa. Quiero sumarme a Expertos Jaikuaa.",
      `${modo === "busco" ? "Necesito" : "Ofrezco"}: ${que === "clases" ? "clases de guaraní" : "traducción o interpretación"}`,
      `Nombre: ${nombre.trim()}`,
      contacto.trim() ? `${modo === "busco" ? "Desde dónde escribo" : "Títulos y experiencia"}: ${contacto.trim()}` : "",
      detalle.trim() ? `Detalle: ${detalle.trim()}` : "",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(txt)}`, "_blank", "noopener");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader accion={<a href="#sumate" className="shrink-0"><Button size="sm">Sumarme</Button></a>} />
      <main className="flex-1">
        {/* Portada */}
        <section className="relative overflow-hidden px-4 pb-16 pt-10 text-white sm:px-6 sm:pt-14" style={{ background: `radial-gradient(90% 70% at 50% 25%, #1E5A62 0%, ${C.azul} 45%, ${C.noche} 100%)` }}>
          <Nanduti className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-white/10 sm:h-[560px] sm:w-[560px]" />
          <div className="relative mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
                <HeartHandshake className="h-3.5 w-3.5" /> Expertos Jaikuaa · Estamos sumando a los primeros
              </span>
              <h1 className="mt-5 font-display text-[2.5rem] font-bold leading-[1.03] tracking-tight sm:text-6xl">
                Las personas que saben guaraní,
                <span className="block" style={{ color: C.dorado }}>a un toque</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
                Clases con docentes y traducciones hechas por personas. <strong className="text-white">Nunca traducción de máquina</strong>: el guaraní lo trabaja siempre alguien que lo sabe.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a href="#sumate" onClick={() => setModo("busco")} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-display font-bold shadow-lg transition hover:brightness-105" style={{ background: C.dorado, color: C.noche }}>
                  <Search className="h-4 w-4" /> Busco un experto
                </a>
                <a href="#sumate" onClick={() => setModo("soy")} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/40 px-6 font-semibold text-white hover:bg-white/10">
                  <UserPlus className="h-4 w-4" /> Soy docente o traductor
                </a>
              </div>
            </div>
            <div className="relative mx-auto flex items-end justify-center gap-2">
              <img src={jaiProfe} alt="Jai docente con un libro" width={537} height={720} className="h-48 w-auto drop-shadow-2xl sm:h-60" />
              <img src={jaiAtencion} alt="Jai traductor con auriculares" width={600} height={720} className="h-44 w-auto drop-shadow-2xl sm:h-56" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-2" aria-hidden>
            <i className="block flex-1" style={{ background: C.rojo }} /><i className="block flex-1 bg-white" /><i className="block flex-1" style={{ background: "#2F62C9" }} />
          </div>
        </section>

        {/* Las dos puertas */}
        <section className="px-4 py-14 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
            <div className="rounded-3xl p-6 text-white shadow-elegant" style={{ background: `linear-gradient(135deg, ${C.azul}, ${C.noche})` }}>
              <GraduationCap className="h-9 w-9" style={{ color: C.dorado }} />
              <h2 className="mt-3 font-display text-2xl font-bold">Clases con docentes</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">Elegís al docente por su especialidad, su horario y su precio. Clases por videollamada, con Jaikuaa como material: el docente ve tu avance en los juegos y lecciones.</p>
              <ul className="mt-4 space-y-1.5 text-sm text-white/85">
                <li className="flex gap-2"><Video className="h-4 w-4 shrink-0" style={{ color: C.dorado }} /> Particulares o en grupo, desde cualquier país</li>
                <li className="flex gap-2"><GraduationCap className="h-4 w-4 shrink-0" style={{ color: C.dorado }} /> Para chicos, para adultos y por rubro: salud, derecho, campo, atención al público</li>
              </ul>
            </div>
            <div className="rounded-3xl border-2 bg-white p-6 shadow-elegant" style={{ borderColor: VERDE }}>
              <Languages className="h-9 w-9" style={{ color: VERDE }} />
              <h2 className="mt-3 font-display text-2xl font-bold" style={{ color: C.tinta }}>Traducción e interpretación</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Traductores e intérpretes de guaraní para documentos, actos, consultas, videos y apps. Pedís, te pasan el presupuesto y lo hace una persona.</p>
              <ul className="mt-4 grid gap-2">
                {TRADUCCION.map((x) => (
                  <li key={x.t} className="flex gap-2 text-sm"><x.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VERDE }} /><span><b style={{ color: C.tinta }}>{x.t}:</b> <span className="text-muted-foreground">{x.d}</span></span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Para quién */}
        <section className="px-4 py-14 sm:px-6" style={{ background: C.noche }}>
          <div className="mx-auto max-w-4xl text-white">
            <h2 className="text-center font-display text-3xl font-bold">¿Quién los <span style={{ color: C.dorado }}>necesita</span>?</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {PARA_QUIEN.map((b) => (
                <div key={b.t} className="flex gap-4 rounded-3xl border border-white/15 bg-white/[.06] p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: C.dorado }}><b.icon className="h-6 w-6" style={{ color: C.noche }} /></div>
                  <div><h3 className="font-display text-lg font-bold">{b.t}</h3><p className="mt-1 text-[15px] text-white/80">{b.d}</p></div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-white/70">¿Tu empresa necesita que todo el personal atienda en guaraní? Mirá <Link to="/atendemos" className="font-semibold underline" style={{ color: C.dorado }}>Atendemos en guaraní</Link>.</p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="px-4 py-14 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>Para docentes y traductores, en 4 pasos</h2>
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
          </div>
        </section>

        {/* Formulario */}
        <section id="sumate" className="scroll-mt-4 px-4 pb-16 pt-4 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-elegant ring-1 ring-black/5">
            <div className="grid grid-cols-2">
              {(["busco", "soy"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setModo(k)} aria-pressed={modo === k}
                  className="flex h-14 items-center justify-center gap-2 font-display font-bold transition"
                  style={modo === k ? { background: C.azul, color: "#fff" } : { background: "#EEF1F6", color: C.tinta }}>
                  {k === "busco" ? <><Search className="h-4 w-4" /> Busco un experto</> : <><UserCheck className="h-4 w-4" /> Quiero sumarme</>}
                </button>
              ))}
            </div>
            <form onSubmit={enviar} className="space-y-4 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-2">
                {(["clases", "traduccion"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setQue(k)} aria-pressed={que === k}
                    className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${que === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                    {k === "clases" ? "Clases de guaraní" : "Traducción o interpretación"}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="ex-nombre">{modo === "busco" ? "Tu nombre o el de tu empresa" : "Tu nombre"}</label>
                <Input id="ex-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} className="mt-1 h-11" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="ex-contacto">{modo === "busco" ? "Desde dónde escribís (ciudad y país)" : "Títulos y experiencia"}</label>
                <Input id="ex-contacto" value={contacto} onChange={(e) => setContacto(e.target.value)} maxLength={200} className="mt-1 h-11" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="ex-det">{modo === "busco" ? "¿Qué necesitás?" : "¿Qué ofrecés? (especialidad, horarios, precio) — opcional"}</label>
                <Textarea id="ex-det" value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={600} rows={3} className="mt-1" />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!listo}>
                <Send className="mr-2 h-4 w-4" /> Enviar por WhatsApp
              </Button>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {modo === "busco" ? "Te respondemos con opciones y presupuesto. Pedir no te compromete a nada." : "Sumarte no te compromete a nada. Las condiciones se acuerdan y firman con cada experto."}
              </p>
            </form>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-center text-sm text-muted-foreground">¿Escribiste un libro en guaraní? Eso va en la <Link to="/libreria" className="font-semibold text-primary underline">Librería Jaikuaa</Link>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
