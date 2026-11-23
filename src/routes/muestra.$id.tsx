import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageCircle } from "lucide-react";
import { muestraObra } from "@/lib/libros.functions";
import { AREA_NOMBRE } from "@/lib/obras";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { Lector } from "@/components/libreria/lector";
import { ComprarImpreso, ComprarLibro } from "@/components/libreria/comprar-libro";

/**
 * Muestra gratis de una obra publicada de la Librería: las primeras páginas con su voz, sin cuenta.
 * Al terminar la muestra, comprar o pedirla por WhatsApp.
 */
export const Route = createFileRoute("/muestra/$id")({
  head: () => ({
    meta: [
      { title: "Librería Jaikuaa — Muestra gratis" },
      { name: "description", content: "Leé y escuchá gratis las primeras páginas, con voz humana real." },
      { property: "og:title", content: "Librería Jaikuaa — Muestra gratis" },
      { property: "og:description", content: "Leé y escuchá gratis las primeras páginas, con voz humana real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MuestraPage,
});

function MuestraPage() {
  const { id } = Route.useParams();
  const cargar = useServerFn(muestraObra);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["muestra-obra", id],
    queryFn: () => cargar({ data: { id } }),
    retry: false,
    staleTime: 50 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Fondo>
        <p className="flex items-center gap-2 text-white/80">
          <Loader2 className="h-5 w-5 animate-spin" /> Abriendo la muestra…
        </p>
      </Fondo>
    );
  }
  if (error || !data) {
    return (
      <Fondo>
        <div className="max-w-sm text-center text-white">
          <p className="text-lg font-semibold">No pudimos abrir la muestra.</p>
          <p className="mt-1 text-sm text-white/70">Revisá tu conexión y probá de nuevo.</p>
          <button type="button" onClick={() => void refetch()} className="mt-4 rounded-xl bg-[#F2C230] px-5 py-2.5 font-bold text-[#1B2A44]">
            Probar de nuevo
          </button>
        </div>
      </Fondo>
    );
  }
  if (data.estado === "no-existe") {
    return (
      <Fondo>
        <div className="max-w-sm text-center text-white">
          <p className="text-lg font-semibold">Esta obra no está disponible</p>
          <p className="mt-1 text-sm text-white/70">Puede que el enlace esté mal escrito o que todavía no esté publicada.</p>
          <Link to="/libreria" className="mt-5 inline-block rounded-xl bg-[#F2C230] px-5 py-2.5 font-bold text-[#1B2A44]">
            Ir a la Librería
          </Link>
        </div>
      </Fondo>
    );
  }

  const queEs = data.tipo === "modulo" ? "el módulo" : data.tipo === "curso" ? "el curso" : "el libro";
  const resto = Math.max(0, data.totalPaginas - data.paginas.length);
  const texto = `Mba'éichapa! Quiero ${queEs} «${data.titulo}» de la Librería Jaikuaa.`;
  const rubro = data.tipo !== "libro" && data.area ? ` · ${AREA_NOMBRE[data.area]}` : "";

  return (
    <Lector
      id={`muestra-${id}`}
      titulo={data.titulo}
      autor={data.autor || (data.tipo === "modulo" ? `Módulo${rubro}` : "")}
      marca="Muestra gratis · Librería Jaikuaa"
      aviso={`Muestra gratis: ${data.paginas.length} de ${data.totalPaginas} ${data.totalPaginas === 1 ? "página" : "páginas"}${rubro}`}
      paginas={data.paginas}
      volver="/libreria"
      recordar={false}
      final={
        <div className="rounded-2xl bg-white p-5 text-[#1B2A44]">
          <p className="font-display text-lg font-bold">¿Te gustó?</p>
          <p className="mt-1 text-sm text-[#1B2A44]/80">
            {resto > 0
              ? `Faltan ${resto} ${resto === 1 ? "página" : "páginas"} más, todas con voz humana real. La edición digital queda guardada en «Mis libros» con tu cuenta.`
              : "La edición digital queda guardada en «Mis libros» con tu cuenta, para leerla y escucharla cuando quieras."}
            {data.enPreventa && " Está en preventa: lo reservás ahora y se abre completo cuando esté listo."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.precioGs && <ComprarLibro libroId={id} precioGs={data.precioGs} preventa={data.enPreventa} />}
            {data.precioFisicoGs && <ComprarImpreso libroId={id} precioGs={data.precioFisicoGs} />}
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2C230] px-3 py-2 text-sm font-bold text-[#1B2A44]"
            >
              <MessageCircle className="h-4 w-4" /> Pedirlo por WhatsApp
            </a>
          </div>
          <p className="mt-3 text-xs text-[#1B2A44]/70">
            ¿Ya compraste la edición digital?{" "}
            <Link to="/leer/$id" params={{ id }} className="font-semibold underline">
              Abrilo completo
            </Link>
          </p>
        </div>
      }
    />
  );
}

function Fondo({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#0B1E3A] px-4">{children}</div>;
}
