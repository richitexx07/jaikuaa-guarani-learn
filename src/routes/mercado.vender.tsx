import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { BadgeCheck, ChartColumn, CreditCard, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { miPostulacion, postularVendedor } from "@/lib/mercado.functions";
import { CATEGORIAS_PRODUCTO, CATEGORIA_NOMBRE } from "@/lib/mercado";
import { CabeceraMercado, MC as C } from "@/components/mercado/partes";
import { useMercadoAbierto } from "@/components/mercado/avisame";
import { SiteFooter } from "@/components/site-footer";

/** «Vender en el Mercado»: qué gana quien vende, cómo funciona y la postulación (con su cuenta de Jaikuaa). */
export const Route = createFileRoute("/mercado/vender")({
  head: () => ({
    meta: [
      { title: "Vender en el Mercado Jaikuaa" },
      { name: "description", content: "Autores, artesanos, artistas, docentes y guías: vendé lo tuyo en el Mercado Jaikuaa, con tu propia vitrina y cobro con Pagopar." },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/mercado/vender" }],
  }),
  component: VenderPage,
});

const campo = "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-base text-[#1B2433]";

function VenderPage() {
  const [sesion, setSesion] = useState<boolean | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSesion(!!data.session));
  }, []);
  const ver = useServerFn(miPostulacion);
  const enviar = useServerFn(postularVendedor);
  const qc = useQueryClient();
  const { data: estado } = useQuery({ queryKey: ["mi-postulacion"], queryFn: () => ver(), enabled: !!sesion, retry: false });
  const [enviando, setEnviando] = useState(false);
  const { abierto, cargando } = useMercadoAbierto();

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F6F3EC" }}>
      <CabeceraMercado />
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 pb-16 pt-5 sm:px-6">
        <section className="rounded-3xl px-5 py-8 text-white sm:px-10" style={{ background: `linear-gradient(120deg, ${C.noche}, ${C.azul})` }}>
          {!cargando && !abierto && (
            <p className="text-sm font-semibold" style={{ color: C.dorado }}>Inscripciones abiertas: tu vitrina queda lista para la apertura</p>
          )}
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Vendé lo tuyo en el Mercado Jaikuaa</h1>
          <p className="mt-2 max-w-2xl text-white/85">
            Autores, artesanos, artistas, docentes, traductores y guías: llegá a todo el Paraguay y a los paraguayos de afuera, con tu propia vitrina.
          </p>
          <a href="#postular" className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>Inscribirme</a>
        </section>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            [Store, "Tu vitrina", "Tu nombre, tu historia y todos tus productos juntos, con un enlace para compartir."],
            [CreditCard, "Cobro seguro", "La gente paga con Pagopar. Tu parte se calcula sola y la ves cada mes."],
            [BadgeCheck, "Opiniones reales", "Solo opinan quienes compraron: tu buena fama se construye con ventas de verdad."],
            [ChartColumn, "Tu panel", "Cargás productos con fotos, ves pedidos por atender y lo que ganaste."],
          ].map(([I, t, d]) => {
            const Icono = I as typeof Store;
            return (
              <li key={t as string} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <Icono className="h-6 w-6 shrink-0" style={{ color: C.azul }} aria-hidden />
                <div>
                  <p className="font-semibold" style={{ color: C.tinta }}>{t as string}</p>
                  <p className="text-sm text-foreground/80">{d as string}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm" aria-labelledby="t-pasos">
          <h2 id="t-pasos" className="font-display text-xl font-bold" style={{ color: C.tinta }}>Cómo funciona</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground/85">
            <li>Te inscribís con tu cuenta de Jaikuaa.</li>
            <li>Te escribimos por WhatsApp y firmamos la autorización y el reparto.</li>
            <li>Cargás tus productos con fotos y los mandás a revisión.</li>
            <li>Los publicamos y empezás a vender.</li>
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Todo lo que tenga guaraní lo revisan docentes especialistas antes de publicarse. Nada se publica sin tu autorización firmada.
          </p>
        </section>

        <section id="postular" className="mt-5 rounded-2xl bg-white p-5 shadow-sm" aria-labelledby="t-post">
          <h2 id="t-post" className="font-display text-xl font-bold" style={{ color: C.tinta }}>Inscribirme</h2>
          {sesion === null ? (
            <Loader2 className="mt-3 h-5 w-5 animate-spin text-muted-foreground" />
          ) : !sesion ? (
            <div className="mt-2">
              <p className="text-sm text-foreground/80">Para inscribirte, ingresá con tu cuenta de Jaikuaa (o creala, es gratis).</p>
              <Link to="/auth" search={{ mode: "login" }} className="mt-3 inline-block rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>Ingresar</Link>
            </div>
          ) : estado?.estado === "vendedor" ? (
            <div className="mt-2">
              <p className="text-sm text-foreground/80">Ya vendés en el Mercado.</p>
              <Link to="/mi-tienda" className="mt-3 inline-block rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.tinta, color: "#fff" }}>Ir a Mi tienda</Link>
            </div>
          ) : (
            <>
              {estado?.estado === "pendiente" && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Recibimos tu inscripción. Te escribimos por WhatsApp. Si querés, podés corregir tus datos.</p>}
              {estado?.estado === "rechazada" && (
                <p className="mt-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Esta vez no pudimos sumarte{estado.nota ? `: ${estado.nota}` : "."} Podés volver a inscribirte.</p>
              )}
              <form
                className="mt-3 space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  setEnviando(true);
                  try {
                    await enviar({
                      data: {
                        nombre: String(fd.get("nombre") ?? ""),
                        categoria: String(fd.get("categoria") ?? "otros"),
                        descripcion: String(fd.get("descripcion") ?? ""),
                        whatsapp: String(fd.get("whatsapp") ?? ""),
                        ciudad: String(fd.get("ciudad") ?? ""),
                      },
                    });
                    toast.success("¡Listo! Recibimos tu inscripción.");
                    void qc.invalidateQueries({ queryKey: ["mi-postulacion"] });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No se pudo enviar.");
                  } finally {
                    setEnviando(false);
                  }
                }}
              >
                <input name="nombre" required minLength={2} maxLength={120} className={campo} placeholder="Tu nombre o el de tu taller, editorial o grupo" aria-label="Nombre" />
                <select name="categoria" className={campo} aria-label="¿Qué vas a vender?" defaultValue="artesania">
                  <option value="libreria">Libros, módulos o cursos</option>
                  {CATEGORIAS_PRODUCTO.map((c) => (
                    <option key={c} value={c}>{CATEGORIA_NOMBRE[c]}</option>
                  ))}
                </select>
                <input name="whatsapp" required minLength={6} maxLength={30} inputMode="tel" className={campo} placeholder="Tu WhatsApp" aria-label="WhatsApp" />
                <input name="ciudad" maxLength={80} className={campo} placeholder="Ciudad" aria-label="Ciudad" />
                <textarea name="descripcion" maxLength={2000} rows={4} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-base" placeholder="Contanos qué hacés y qué te gustaría vender" aria-label="Qué hacés" />
                <button type="submit" disabled={enviando} className="rounded-full px-5 py-2.5 text-sm font-bold disabled:opacity-50" style={{ background: C.tinta, color: "#fff" }}>
                  {enviando ? "Enviando…" : estado?.estado === "pendiente" ? "Actualizar mis datos" : "Enviar inscripción"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
