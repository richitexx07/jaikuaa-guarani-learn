import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ChevronRight, FileSignature, Loader2, Lock, MailCheck, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Nanduti } from "@/components/libreria/arte";
import { PH } from "@/components/purahei/partes";
import { supabase } from "@/integrations/supabase/client";
import { rememberAfterLogin } from "@/lib/after-login";
import {
  borrarBorrador, CONVENIOS, esPrograma, faltaParaFirmar, FIRMA_VACIA, guardarBorrador, leerBorrador, MAX_OBRAS, NOMBRE_ESTADO,
  type Firma, type ObraFirmada, type Programa,
} from "@/lib/convenios";
import { firmarConvenio, miCuentaConvenio } from "@/lib/convenios.functions";

export const Route = createFileRoute("/convenio/$programa")({
  head: ({ params }) => {
    const c = esPrograma(params.programa) ? CONVENIOS[params.programa] : null;
    return {
      meta: [
        { title: c ? `Firmá en línea — ${c.subtitulo.split(",")[0]}` : "Convenio — Jaikuaa" },
        { name: "description", content: "Firmá en línea, con tu correo confirmado, la autorización para mostrar tus obras en Jaikuaa. Recibís una constancia verificable." },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ConvenioPage,
});

function useSesion() {
  const [s, setS] = useState<{ listo: boolean; id: string | null }>({ listo: false, id: null });
  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => { if (vivo) setS({ listo: true, id: data.session?.user.id ?? null }); });
    const { data } = supabase.auth.onAuthStateChange((_e, ses) => setS({ listo: true, id: ses?.user.id ?? null }));
    return () => { vivo = false; data.subscription.unsubscribe(); };
  }, []);
  return s;
}

function ConvenioPage() {
  const { programa } = Route.useParams();
  if (!esPrograma(programa)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MarketingHeader />
        <main className="mx-auto max-w-xl flex-1 px-4 py-16 text-center">
          <p className="font-display text-2xl font-bold">No encontramos este convenio</p>
          <p className="mt-2 text-muted-foreground">Elegí dónde querés sumarte:</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/convenio/$programa" params={{ programa: "purahei" }} className="font-semibold text-primary">Purahéi</Link>
            <Link to="/convenio/$programa" params={{ programa: "libreria" }} className="font-semibold text-primary">Librería</Link>
          </div>
        </main>
      </div>
    );
  }
  return <Formulario programa={programa} />;
}

function Formulario({ programa }: { programa: Programa }) {
  const c = CONVENIOS[programa];
  const navigate = useNavigate();
  const sesion = useSesion();
  const [f, setF] = useState<Firma>(FIRMA_VACIA);
  const [cargado, setCargado] = useState(false);
  useEffect(() => { const b = leerBorrador(programa); if (b) setF(b); setCargado(true); }, [programa]);
  useEffect(() => { if (cargado) guardarBorrador(programa, f); }, [cargado, programa, f]);

  const cuentaFn = useServerFn(miCuentaConvenio);
  const cuenta = useQuery({
    queryKey: ["convenio-cuenta", programa, sesion.id],
    queryFn: () => cuentaFn({ data: { programa } }),
    enabled: !!sesion.id,
  });
  useEffect(() => {
    const nombre = cuenta.data?.nombre;
    if (nombre && !f.nombre) setF((x) => ({ ...x, nombre }));
  }, [cuenta.data?.nombre]); // eslint-disable-line react-hooks/exhaustive-deps

  const firmarFn = useServerFn(firmarConvenio);
  const [firmando, setFirmando] = useState(false);
  const falta = faltaParaFirmar(c, f);

  const set = <K extends keyof Firma>(k: K, v: Firma[K]) => setF((x) => ({ ...x, [k]: v }));
  const alternar = (k: "roles" | "permisos", id: string) => setF((x) => ({ ...x, [k]: x[k].includes(id) ? x[k].filter((y) => y !== id) : [...x[k], id] }));
  const setObra = (i: number, k: keyof ObraFirmada, v: string) => setF((x) => ({ ...x, obras: x.obras.map((o, j) => (j === i ? { ...o, [k]: v } : o)) }));

  async function firmar() {
    if (falta.length) { toast.error(`Falta: ${falta.join(", ")}`); return; }
    setFirmando(true);
    try {
      const r = await firmarFn({ data: { programa, version: c.version, ...f, acepto: true } });
      borrarBorrador(programa);
      toast.success("¡Listo! Tu convenio quedó firmado.");
      navigate({ to: "/constancia-convenio/$codigo", params: { codigo: r.codigo } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo firmar. Probá de nuevo.");
    } finally {
      setFirmando(false);
    }
  }

  const irACuenta = (modo: "signup" | "login") => {
    guardarBorrador(programa, f);
    rememberAfterLogin(`/convenio/${programa}`);
    navigate({ to: "/auth", search: { mode: modo } });
  };

  const etiqueta = "text-sm font-semibold text-foreground";
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden text-white" style={{ background: `radial-gradient(120% 90% at 80% 0%, #2B527F 0%, ${PH.marino} 45%, ${PH.noche} 100%)` }}>
          <Nanduti className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 opacity-20" />
          <div className="relative mx-auto max-w-2xl px-4 pb-8 pt-8 sm:px-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"><FileSignature className="h-4 w-4" aria-hidden /> {c.subtitulo.split(",")[0]}</p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{c.titulo}</h1>
            <p className="mt-2 text-white/85">Firmalo en línea en pocos minutos, sin imprimir nada. Vale como firma electrónica (Ley N.° 6822/2021) y te queda una constancia que cualquiera puede verificar.</p>
          </div>
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${PH.rojo} 0 33%, #FFFFFF 33% 66%, #0038A8 66%)` }} aria-hidden />
        </section>

        <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6">
          {cuenta.data && cuenta.data.convenios.length > 0 && (
            <section className="rounded-2xl bg-muted/50 p-4">
              <h2 className="font-display text-lg font-bold">Tus convenios firmados</h2>
              <ul className="mt-2 space-y-2">
                {cuenta.data.convenios.map((k) => (
                  <li key={k.codigo}>
                    <Link to="/constancia-convenio/$codigo" params={{ codigo: k.codigo }} className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-card px-3 ring-1 ring-border">
                      <span><b className="font-mono text-sm">{k.codigo}</b> <span className="text-sm text-muted-foreground">· {NOMBRE_ESTADO[k.estado]}</span></span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Paso n={1} titulo="Tus datos">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className={etiqueta}>Nombre completo (como en tu cédula)</span>
                <Input value={f.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={120} autoComplete="name" className="mt-1 h-12 text-base" /></label>
              <label><span className={etiqueta}>Cédula de identidad</span>
                <Input value={f.ci} onChange={(e) => set("ci", e.target.value)} maxLength={20} inputMode="numeric" className="mt-1 h-12 text-base" /></label>
              <label><span className={etiqueta}>WhatsApp</span>
                <Input value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} maxLength={25} inputMode="tel" autoComplete="tel" placeholder="0981 123 456" className="mt-1 h-12 text-base" /></label>
              <label className="sm:col-span-2"><span className={etiqueta}>Ciudad (opcional)</span>
                <Input value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} maxLength={120} className="mt-1 h-12 text-base" /></label>
            </div>
            <p className={`mt-4 ${etiqueta}`}>Firmás como…</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.roles.map((r) => (
                <button key={r.id} type="button" aria-pressed={f.roles.includes(r.id)} onClick={() => alternar("roles", r.id)}
                  className={`min-h-11 rounded-full border-2 px-4 text-sm font-semibold transition ${f.roles.includes(r.id) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </Paso>

          <Paso n={2} titulo={`Tus ${c.obra.plural}`}>
            <ul className="space-y-3">
              {f.obras.map((o, i) => (
                <li key={i} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {c.obra.campos.map((campo) => (
                      <label key={campo.id} className={campo.id === "titulo" ? "sm:col-span-2" : ""}>
                        <span className="text-xs font-semibold text-muted-foreground">{campo.label}</span>
                        <Input value={o[campo.id]} onChange={(e) => setObra(i, campo.id, e.target.value)} maxLength={campo.id === "titulo" ? 200 : 120} className="mt-0.5 h-11 text-base" />
                      </label>
                    ))}
                  </div>
                  {f.obras.length > 1 && (
                    <button type="button" onClick={() => set("obras", f.obras.filter((_, j) => j !== i))} className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-destructive">
                      <Trash2 className="h-4 w-4" aria-hidden /> Quitar
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {f.obras.length < MAX_OBRAS && (
              <button type="button" onClick={() => set("obras", [...f.obras, { titulo: "", autor: "", interprete: "", productor: "" }])}
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-primary ring-1 ring-border">
                <Plus className="h-4 w-4" aria-hidden /> Agregar otro {c.obra.singular}
              </button>
            )}
          </Paso>

          <Paso n={3} titulo="Qué autorizás">
            <p className="text-sm text-muted-foreground">Marcá solo lo que es tuyo. Lo que no marques, no se usa.</p>
            <ul className="mt-3 space-y-2">
              {c.permisos.map((p) => (
                <li key={p.id}>
                  <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
                    <input type="checkbox" checked={f.permisos.includes(p.id)} onChange={() => alternar("permisos", p.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" />
                    <span><span className="font-semibold text-foreground">{p.label}</span>{p.ayuda && <span className="block text-sm text-muted-foreground">{p.ayuda}</span>}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Paso>

          <Paso n={4} titulo="Leé el convenio">
            <div className="max-h-[22rem] overflow-y-auto rounded-2xl bg-card p-4 text-sm leading-relaxed ring-1 ring-border" tabIndex={0} aria-label="Texto del convenio">
              <p className="font-display text-base font-bold">{c.titulo}</p>
              <p className="text-xs text-muted-foreground">Versión {c.version}</p>
              <ol className="mt-3 space-y-2">
                {c.clausulas.map((k, i) => <li key={k.t}><b>{i + 1}. {k.t}.</b> {k.x}</li>)}
              </ol>
            </div>
          </Paso>

          <Paso n={5} titulo="Firmá">
            {!sesion.listo ? (
              <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Un momento…</p>
            ) : !sesion.id ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-4">
                <p className="flex items-center gap-2 font-semibold"><MailCheck className="h-5 w-5 text-primary" aria-hidden /> Para firmar, confirmamos tu correo</p>
                <p className="mt-1 text-sm text-muted-foreground">Entrá con tu cuenta de Jaikuaa o creá una gratis. Lo que ya llenaste queda guardado en este celular y volvés acá para firmar.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => irACuenta("signup")} className="min-h-12 rounded-2xl font-display font-bold text-white" style={{ background: PH.marino }}>Crear mi cuenta gratis</button>
                  <button type="button" onClick={() => irACuenta("login")} className="min-h-12 rounded-2xl font-display font-bold text-primary ring-1 ring-border">Ya tengo cuenta</button>
                </div>
              </div>
            ) : cuenta.isLoading ? (
              <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Revisando tu cuenta…</p>
            ) : cuenta.data && !cuenta.data.confirmado ? (
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200">
                <p className="font-semibold">Falta confirmar tu correo</p>
                <p className="mt-1 text-sm">Abrí el correo que te mandamos al crear la cuenta y tocá el enlace. Después volvé a esta página.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm"><BadgeCheck className="h-5 w-5 text-primary" aria-hidden /> Firmás con tu correo confirmado: <b className="break-all">{cuenta.data?.email}</b></p>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
                  <input type="checkbox" checked={f.acepto} onChange={(e) => set("acepto", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" />
                  <span className="text-sm">Leí el convenio, los datos son verdaderos y tengo los derechos que autorizo. <b>Acepto y lo firmo electrónicamente.</b></span>
                </label>
                {falta.length > 0 && (
                  <div className="rounded-2xl bg-muted/60 p-3 text-sm">
                    <p className="font-semibold">Antes de firmar falta:</p>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">{falta.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                )}
                <button type="button" onClick={firmar} disabled={firmando || falta.length > 0}
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold shadow-lg transition active:scale-[.98] disabled:opacity-50"
                  style={{ background: PH.dorado, color: PH.noche }}>
                  {firmando ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSignature className="h-5 w-5" aria-hidden />} Firmar el convenio
                </button>
              </div>
            )}
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> Tu cédula y tu correo no se publican.</li>
              <li className="flex items-start gap-1.5"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> Después podés adjuntar el convenio firmado con firma electrónica cualificada o a mano.</li>
            </ul>
          </Paso>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`paso-${n}`}>
      <h2 id={`paso-${n}`} className="mb-3 flex items-center gap-3 font-display text-xl font-bold text-foreground">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-base text-white" style={{ background: PH.marino }}>{n}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}
