import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import logo from "@/assets/jaikuaa-logo.webp";
import mimbiSaluda from "@/assets/ejecutivos/mimbi-ejecutiva-saluda.webp";
import coverConsultorio from "@/assets/covers/cover-consultorio.webp";
import coverVentanilla from "@/assets/covers/cover-ventanilla.webp";
import coverChacra from "@/assets/covers/cover-chacra.webp";
import coverTekojoja from "@/assets/covers/cover-tekojoja.webp";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { LIB_COLORES, Nanduti } from "@/components/libreria/arte";
import {
  Store, MessageSquareText, Gamepad2, BarChart3, FileCheck2, BadgeCheck, Send, CheckCircle2,
  ClipboardList, Users, Building2, MapPin,
} from "lucide-react";

/**
 * «Atendemos en guaraní»: licencia anual para empresas e instituciones que quieren que su personal atienda en guaraní.
 * Junta lo que Jaikuaa ya tiene (modo mostrador, juegos por rubro, seguimiento) y suma el distintivo para el local.
 * La constancia es de capacitación en Jaikuaa: no es un título oficial de la lengua.
 */
export const Route = createFileRoute("/atendemos")({
  head: () => ({
    meta: [
      { title: "Atendemos en guaraní — Jaikuaa para empresas e instituciones" },
      { name: "description", content: "Que todo tu personal atienda en guaraní: frases de atención con voz humana, juegos por rubro, seguimiento para Recursos Humanos, constancia de capacitación y el distintivo para tu local." },
      { property: "og:title", content: "Atendemos en guaraní — Jaikuaa para empresas e instituciones" },
      { property: "og:description", content: "Capacitá a tu personal para atender en guaraní y mostralo con orgullo en cada sucursal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/atendemos" }],
  }),
  component: AtendemosPage,
});

const C = LIB_COLORES;

const INCLUYE = [
  { icon: MessageSquareText, t: "Modo mostrador «Atendé en guaraní»", d: "Las frases de atención de tu rubro, con voz humana, listas en el celular del funcionario." },
  { icon: Gamepad2, t: "El juego de tu rubro", d: "Tu personal practica jugando, en ratos libres: cinco minutos por día alcanzan." },
  { icon: BarChart3, t: "Panel para Recursos Humanos", d: "Quién empezó, cuánto avanzó y qué sucursal va adelante." },
  { icon: FileCheck2, t: "Constancia de capacitación", d: "Para cada funcionario que completa el programa." },
  { icon: BadgeCheck, t: "El distintivo para tu local", d: "Para el mostrador y la vidriera: que tus clientes sepan que acá se los atiende en guaraní." },
];

const RUBROS = [
  { img: coverConsultorio, t: "Salud", d: "Hospitales, sanatorios, farmacias y seguros médicos.", juego: "Consultorio de Jai" },
  { img: coverVentanilla, t: "Bancos y oficinas", d: "Bancos, financieras, cooperativas, municipios y ministerios.", juego: "Ventanilla de Jai" },
  { img: coverChacra, t: "Campo", d: "Técnicos de extensión, acopiadoras, cooperativas y agroindustria.", juego: "Jai en la chacra" },
  { img: coverTekojoja, t: "Justicia y seguridad", d: "Juzgados, fiscalías, defensorías y atención ciudadana.", juego: "Tekojoja" },
];

const PASOS = [
  { icon: ClipboardList, t: "Charla corta", d: "Nos contás tu rubro, tus sucursales y cuántas personas atienden al público." },
  { icon: Users, t: "Arranca tu personal", d: "Cada funcionario entra con su usuario. Empieza por las frases que más usa en su puesto." },
  { icon: BarChart3, t: "Seguimiento", d: "Recursos Humanos ve el avance. Te mandamos un informe por mes." },
  { icon: BadgeCheck, t: "Distintivo y constancias", d: "Cuando la sucursal completa el programa, recibe su distintivo y cada funcionario su constancia." },
];

/** El distintivo que va en el mostrador. */
function Distintivo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-white text-center shadow-2xl ring-1 ring-black/10 ${className}`} role="img" aria-label="Distintivo: Aquí te atendemos en guaraní, con Jaikuaa">
      <div className="flex h-3" aria-hidden><i className="block flex-1" style={{ background: C.rojo }} /><i className="block flex-1 bg-white" /><i className="block flex-1" style={{ background: "#2F62C9" }} /></div>
      <Nanduti className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 text-[#1E3A5F]/10" />
      <div className="relative px-6 pb-6 pt-5">
        <img src={logo} alt="" width={256} height={256} className="mx-auto h-16 w-16 rounded-2xl" />
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: C.rojo }}>Aquí te</p>
        <p className="font-display text-3xl font-bold leading-none" style={{ color: C.tinta }}>atendemos</p>
        <p className="mt-1 font-display text-4xl font-bold leading-none" style={{ color: C.azul }}>en guaraní</p>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ background: C.dorado }} aria-hidden />
        <p className="mt-3 text-xs font-semibold" style={{ color: C.tinta }}>Personal capacitado con Jaikuaa</p>
        <p className="text-[11px] text-muted-foreground">www.jaikuaa.com</p>
      </div>
    </div>
  );
}

function AtendemosPage() {
  const [empresa, setEmpresa] = useState("");
  const [rubro, setRubro] = useState(RUBROS[0].t);
  const [sucursales, setSucursales] = useState("");
  const [personas, setPersonas] = useState("");
  const [contacto, setContacto] = useState("");
  const [detalle, setDetalle] = useState("");
  const listo = empresa.trim().length > 1 && contacto.trim().length > 1;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!listo) return;
    const txt = [
      "Mba'éichapa. Nos interesa «Atendemos en guaraní» de Jaikuaa.",
      `Empresa o institución: ${empresa.trim()}`,
      `Rubro: ${rubro}`,
      sucursales.trim() ? `Sucursales: ${sucursales.trim()}` : "",
      personas.trim() ? `Personas que atienden al público: ${personas.trim()}` : "",
      `Contacto: ${contacto.trim()}`,
      detalle.trim() ? `Detalle: ${detalle.trim()}` : "",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(txt)}`, "_blank", "noopener");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader accion={<a href="#pedir" className="shrink-0"><Button size="sm">Pedir propuesta</Button></a>} />
      <main className="flex-1">
        {/* Portada con el distintivo */}
        <section className="relative overflow-hidden px-4 pb-16 pt-10 text-white sm:px-6 sm:pt-14" style={{ background: `radial-gradient(90% 70% at 50% 25%, #24497A 0%, ${C.azul} 40%, ${C.noche} 100%)` }}>
          <Nanduti className="pointer-events-none absolute -left-28 -top-28 h-[440px] w-[440px] text-white/[.08]" />
          <div className="relative mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
                <Store className="h-3.5 w-3.5" /> Para empresas e instituciones
              </span>
              <h1 className="mt-5 font-display text-[2.5rem] font-bold leading-[1.03] tracking-tight sm:text-6xl">
                Que en cada sucursal
                <span className="block" style={{ color: C.dorado }}>te atiendan en guaraní</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
                Tu personal aprende las frases de su puesto con voz humana, practica jugando y tu local lo muestra con orgullo. Una licencia por año, con seguimiento para Recursos Humanos.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a href="#pedir" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-display font-bold shadow-lg transition hover:brightness-105" style={{ background: C.dorado, color: C.noche }}>
                  <Building2 className="h-4 w-4" /> Pedir una propuesta
                </a>
                <a href="#incluye" className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/40 px-6 font-semibold text-white hover:bg-white/10">Qué incluye</a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[250px] -translate-x-10 sm:max-w-[290px] sm:-translate-x-12">
              <Distintivo className="rotate-[-3deg]" />
              <img src={mimbiSaluda} alt="" width={704} height={944} className="absolute -bottom-10 -right-[7.5rem] h-48 w-auto drop-shadow-2xl sm:-right-40 sm:h-64" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-2" aria-hidden>
            <i className="block flex-1" style={{ background: C.rojo }} /><i className="block flex-1 bg-white" /><i className="block flex-1" style={{ background: "#2F62C9" }} />
          </div>
        </section>

        {/* Por qué */}
        <section className="px-4 py-12 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-2xl font-bold leading-snug sm:text-3xl" style={{ color: C.tinta }}>
              Millones de paraguayos se sienten más cómodos en guaraní. Atenderlos en su lengua es respeto, confianza y clientes que vuelven.
            </p>
            <p className="mt-3 text-[15px] text-muted-foreground">Y acompaña lo que pide la Ley de Lenguas para la atención al público.</p>
          </div>
        </section>

        {/* Qué incluye */}
        <section id="incluye" className="scroll-mt-4 px-4 pb-14 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>Qué incluye la licencia</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUYE.map((x, i) => (
                <div key={x.t} className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 ${i === INCLUYE.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: C.azul }}><x.icon className="h-5 w-5" style={{ color: C.dorado }} /></div>
                  <h3 className="mt-3 font-display text-lg font-bold" style={{ color: C.tinta }}>{x.t}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por rubro */}
        <section className="px-4 py-14 sm:px-6" style={{ background: C.noche }}>
          <div className="mx-auto max-w-5xl text-white">
            <h2 className="text-center font-display text-3xl font-bold">Un programa para <span style={{ color: C.dorado }}>cada rubro</span></h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {RUBROS.map((r) => (
                <div key={r.t} className="overflow-hidden rounded-3xl border border-white/15 bg-white/[.06]">
                  <img src={r.img} alt="" width={800} height={600} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-display text-xl font-bold">{r.t}</h3>
                    <p className="mt-1 text-sm text-white/80">{r.d}</p>
                    <p className="mt-2 text-xs font-semibold" style={{ color: C.dorado }}>Practica con: {r.juego}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-sm text-white/70">¿Comercio, turismo u otro rubro? También armamos tu programa.</p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="px-4 py-14 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>Cómo funciona</h2>
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
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Todo el guaraní que aprende tu personal es contenido revisado por docentes especialistas, con voz humana. ¿Necesitás además traducir carteles o folletos? Lo hacen nuestros <Link to="/expertos" className="font-semibold text-primary underline">Expertos Jaikuaa</Link>.
            </p>
          </div>
        </section>

        {/* Formulario */}
        <section id="pedir" className="scroll-mt-4 px-4 pb-16 pt-4 sm:px-6" style={{ background: C.papel }}>
          <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-elegant ring-1 ring-black/5">
            <div className="px-6 py-5 text-white sm:px-8" style={{ background: `linear-gradient(135deg, ${C.azul}, ${C.noche})` }}>
              <h2 className="font-display text-2xl font-bold">Pedí una propuesta</h2>
              <p className="mt-0.5 text-sm text-white/80">Tarda un minuto. Se abre WhatsApp con tus datos listos para enviar.</p>
            </div>
            <form onSubmit={enviar} className="space-y-4 p-6 sm:p-8">
              <div>
                <label className="text-sm font-medium" htmlFor="at-emp">Empresa o institución</label>
                <Input id="at-emp" value={empresa} onChange={(e) => setEmpresa(e.target.value)} maxLength={120} className="mt-1 h-11" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="at-rubro">Rubro</label>
                <select id="at-rubro" value={rubro} onChange={(e) => setRubro(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {RUBROS.map((r) => <option key={r.t}>{r.t}</option>)}
                  <option>Comercio</option>
                  <option>Turismo</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium" htmlFor="at-suc"><MapPin className="h-3.5 w-3.5" /> Sucursales</label>
                  <Input id="at-suc" inputMode="numeric" value={sucursales} onChange={(e) => setSucursales(e.target.value.replace(/[^\d]/g, "").slice(0, 5))} className="mt-1 h-11" />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium" htmlFor="at-per"><Users className="h-3.5 w-3.5" /> Personas que atienden</label>
                  <Input id="at-per" inputMode="numeric" value={personas} onChange={(e) => setPersonas(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} className="mt-1 h-11" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="at-cont">Tu nombre y cargo</label>
                <Input id="at-cont" value={contacto} onChange={(e) => setContacto(e.target.value)} maxLength={160} className="mt-1 h-11" />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="at-det">Algo más que quieras contarnos (opcional)</label>
                <Textarea id="at-det" value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={600} rows={3} className="mt-1" />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!listo}>
                <Send className="mr-2 h-4 w-4" /> Enviar por WhatsApp
              </Button>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Pedir una propuesta no te compromete a nada. La constancia es de capacitación en Jaikuaa, no un título oficial de la lengua.
              </p>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
