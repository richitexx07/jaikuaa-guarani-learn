import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, GraduationCap, HeartHandshake, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LIB_COLORES, Nanduti } from "@/components/libreria/arte";
import jaiDocente from "@/assets/ejecutivos/jai-ejecutivo-docente.webp";
import { postularColaborador } from "@/lib/colaboradores.functions";
import { APORTES, DEPARTAMENTOS, PERFILES, faltaPostulacion } from "@/lib/colaboradores";
import { normalizarWhatsapp } from "@/lib/purahei";

/**
 * «Sumate como colaborador»: docentes, supervisores, traductores y hablantes que quieren ayudar a Jaikuaa.
 * Se llega también por el QR de los congresos y escuelas (?origen=aka). Las postulaciones las revisa el equipo.
 */
export const Route = createFileRoute("/colaboradores")({
  validateSearch: (s: Record<string, unknown>): { origen?: string } =>
    typeof s.origen === "string" && s.origen ? { origen: s.origen.slice(0, 40) } : {},
  head: () => ({
    meta: [
      { title: "Colaboradores de Jaikuaa — Sumate" },
      { name: "description", content: "Docentes, supervisores, traductores y hablantes de guaraní: sumate a Jaikuaa para revisar, grabar, enseñar y llevar el guaraní a tu comunidad. Con capacitación gratuita." },
      { property: "og:title", content: "Sumate como colaborador de Jaikuaa" },
      { property: "og:description", content: "Revisá, grabá, enseñá y llevá el guaraní a tu comunidad, con capacitación gratuita." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/colaboradores" }],
  }),
  component: ColaboradoresPage,
});

const C = LIB_COLORES;

type Form = {
  nombre: string; departamento: string; ciudad: string; whatsapp: string; email: string; perfil: string;
  institucion: string; lenguas: string; aportes: string[]; capacitacion: boolean | null; comentario: string; acepto: boolean; sitio: string;
};
const VACIO: Form = { nombre: "", departamento: "", ciudad: "", whatsapp: "", email: "", perfil: "", institucion: "", lenguas: "", aportes: [], capacitacion: null, comentario: "", acepto: false, sitio: "" };

function ColaboradoresPage() {
  const { origen } = Route.useSearch();
  const [f, setF] = useState<Form>(VACIO);
  const [intento, setIntento] = useState(false);
  const enviarFn = useServerFn(postularColaborador);
  const m = useMutation({ mutationFn: () => enviarFn({ data: { ...f, origen: origen ?? "" } }) });
  const falta = faltaPostulacion(f, (n) => !!normalizarWhatsapp(n));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const alternar = (id: string) => set("aportes", f.aportes.includes(id) ? f.aportes.filter((a) => a !== id) : [...f.aportes, id]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setIntento(true);
    if (!falta.length) m.mutate();
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: C.papel }}>
      <MarketingHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(160deg, ${C.azul}, ${C.noche})` }}>
          <Nanduti className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 text-white opacity-15" />
          <div className="relative mx-auto grid max-w-5xl gap-4 px-4 pb-8 pt-8 sm:grid-cols-[1fr_auto] sm:items-end sm:px-6 sm:pt-12">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"><HeartHandshake className="h-4 w-4" aria-hidden /> Colaboradores de Jaikuaa</p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">Sumate a Jaikuaa</h1>
              <p className="mt-3 max-w-xl text-lg text-white/85">
                Buscamos docentes, supervisores, traductores y hablantes de guaraní de todo el país para revisar, grabar, enseñar y llevar el guaraní a cada escuela y comunidad.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                <li className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: C.dorado, color: C.noche }}><GraduationCap className="h-4 w-4" aria-hidden /> Capacitación gratuita</li>
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1"><MapPin className="h-4 w-4" aria-hidden /> Desde cualquier departamento</li>
              </ul>
            </div>
            <img src={jaiDocente} alt="" className="mx-auto hidden w-48 sm:block" />
          </div>
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${C.rojo} 0 33%, #FFFFFF 33% 66%, #0038A8 66%)` }} aria-hidden />
        </section>

        <section className="postulation-light px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-xl">
            {m.isSuccess ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-elegant ring-1 ring-black/5">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
                <h2 className="mt-3 font-display text-2xl font-bold" style={{ color: C.tinta }}>¡Gracias! Recibimos tu postulación</h2>
                <p className="mt-2 text-muted-foreground">El equipo de docentes de Jaikuaa la va a revisar y te vamos a escribir. Mientras tanto, podés empezar a usar la plataforma.</p>
                <Button asChild className="mt-6 h-12"><Link to="/">Conocer Jaikuaa</Link></Button>
              </div>
            ) : (
              <form onSubmit={enviar} noValidate className="space-y-5 rounded-3xl bg-white p-6 shadow-elegant ring-1 ring-black/5 sm:p-8">
                <h2 className="font-display text-2xl font-bold" style={{ color: C.tinta }}>Tus datos</h2>
                <label className="block text-sm font-medium" htmlFor="co-nombre">Nombre completo
                  <Input id="co-nombre" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={120} autoComplete="name" className="mt-1 h-12 text-base" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium" htmlFor="co-dep">¿Dónde vivís?
                    <select id="co-dep" value={f.departamento} onChange={(e) => set("departamento", e.target.value)} className="mt-1 h-12 w-full rounded-md border bg-background px-3 text-base">
                      <option value="">Elegí el departamento</option>
                      {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium" htmlFor="co-ciudad">Ciudad o distrito
                    <Input id="co-ciudad" value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} maxLength={120} className="mt-1 h-12 text-base" />
                  </label>
                  <label className="block text-sm font-medium" htmlFor="co-wa">Número de teléfono (WhatsApp)
                    <Input id="co-wa" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} maxLength={25} inputMode="tel" autoComplete="tel" placeholder="0981 123 456" className="mt-1 h-12 text-base" />
                  </label>
                  <label className="block text-sm font-medium" htmlFor="co-email">Correo electrónico
                    <Input id="co-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} maxLength={255} autoComplete="email" inputMode="email" placeholder="nombre@correo.com" className="mt-1 h-12 text-base" />
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium">Tu perfil</legend>
                  <div className="mt-2 grid gap-2">
                    {PERFILES.map((p) => (
                      <label key={p.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 text-sm font-semibold transition ${f.perfil === p.id ? "border-primary bg-primary/5" : "border-border"}`}>
                        <input type="radio" name="perfil" value={p.id} checked={f.perfil === p.id} onChange={() => set("perfil", p.id)} className="h-5 w-5 accent-[var(--primary)]" />
                        {p.nombre}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium" htmlFor="co-inst">Escuela, colegio o institución (opcional)
                    <Input id="co-inst" value={f.institucion} onChange={(e) => set("institucion", e.target.value)} maxLength={160} className="mt-1 h-12 text-base" />
                  </label>
                  <label className="block text-sm font-medium" htmlFor="co-len">¿Qué lenguas hablás? (opcional)
                    <Input id="co-len" value={f.lenguas} onChange={(e) => set("lenguas", e.target.value)} maxLength={200} placeholder="Guaraní, castellano…" className="mt-1 h-12 text-base" />
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium">¿Cómo querés colaborar? Elegí todo lo que quieras</legend>
                  <div className="mt-2 grid gap-2">
                    {APORTES.map((a) => (
                      <label key={a.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 text-sm font-semibold transition ${f.aportes.includes(a.id) ? "border-primary bg-primary/5" : "border-border"}`}>
                        <input type="checkbox" checked={f.aportes.includes(a.id)} onChange={() => alternar(a.id)} className="h-5 w-5 accent-[var(--primary)]" />
                        {a.nombre}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-medium">¿Querés recibir capacitación gratuita para trabajar con Jaikuaa?</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {([true, false] as const).map((v) => (
                      <label key={String(v)} className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold transition ${f.capacitacion === v ? "border-primary bg-primary/5" : "border-border"}`}>
                        <input type="radio" name="capacitacion" checked={f.capacitacion === v} onChange={() => set("capacitacion", v)} className="h-5 w-5 accent-[var(--primary)]" />
                        {v ? "Sí, quiero" : "Ahora no"}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block text-sm font-medium" htmlFor="co-com">¿Algo más que quieras contarnos? (opcional)
                  <Textarea id="co-com" value={f.comentario} onChange={(e) => set("comentario", e.target.value)} maxLength={800} rows={3} className="mt-1 text-base" />
                </label>
                <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.sitio} onChange={(e) => set("sitio", e.target.value)} />

                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input type="checkbox" checked={f.acepto} onChange={(e) => set("acepto", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" />
                  <span>Autorizo a Jaikuaa a guardar estos datos y a contactarme solo para esta colaboración. No se publican ni se comparten.</span>
                </label>

                {intento && falta.length > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Para enviar falta: {falta.join(", ")}.</p>}
                {m.isError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{m.error instanceof Error ? m.error.message : "No se pudo enviar. Probá de nuevo."}</p>}
                <Button type="submit" className="h-12 w-full text-base" disabled={m.isPending}>
                  {m.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <HeartHandshake className="mr-2 h-5 w-5" />} Enviar mi postulación
                </Button>
                <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Cada postulación la revisa el equipo de docentes de Jaikuaa. Te escribimos por WhatsApp o por correo.</p>
              </form>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
