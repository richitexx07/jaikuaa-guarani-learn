import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock } from "lucide-react";
import { leerLibro } from "@/lib/libros.functions";
import { Lector } from "@/components/libreria/lector";

/**
 * El lector de la Librería: un libro comprado, página por página, pensado para el celular.
 * - Cada página puede tener su voz humana real (botón Escuchar).
 * - Protegido: no se descarga, no se arrastra, y cada página lleva marcado a quién pertenece el ejemplar.
 * - Recuerda en qué página quedaste (solo en este aparato).
 */
export const Route = createFileRoute("/_authenticated/leer/$id")({
  head: () => ({ meta: [
    { title: "Jaikuaa — Lector" },
    { name: "description", content: "Leé tu obra digital de la Librería Jaikuaa con voces humanas." },
    { property: "og:title", content: "Jaikuaa — Lector" },
    { property: "og:description", content: "Leé tu obra digital de la Librería Jaikuaa con voces humanas." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: LectorPage,
});

function LectorPage() {
  const { id } = Route.useParams();
  const abrir = useServerFn(leerLibro);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leer-libro", id],
    queryFn: () => abrir({ data: { id } }),
    retry: false,
    staleTime: 50 * 60 * 1000, // los enlaces vencen a la hora: se renuevan antes
    refetchInterval: 50 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Fondo>
        <p className="flex items-center gap-2 text-white/80">
          <Loader2 className="h-5 w-5 animate-spin" /> Abriendo tu libro…
        </p>
      </Fondo>
    );
  }
  if (error || !data) {
    return (
      <Fondo>
        <div className="max-w-sm text-center text-white">
          <p className="text-lg font-semibold">No pudimos abrir el libro.</p>
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
        <Aviso titulo="Este libro no existe" texto="Puede que el enlace esté mal escrito." />
      </Fondo>
    );
  }
  if (data.estado === "sin-acceso") {
    return (
      <Fondo>
        <Aviso
          icono
          titulo={`«${data.titulo}» todavía no está en tu biblioteca`}
          texto="La edición digital aparece en «Mis libros» con esta misma cuenta. Una compra impresa no incluye acceso digital: podés consultar su envío en «Mis compras». Mientras tanto, podés ver la muestra gratis."
          muestraId={id}
        />
      </Fondo>
    );
  }
  if (data.estado === "preventa") {
    return (
      <Fondo>
        <Aviso
          titulo={`«${data.titulo}» ya es tuyo`}
          texto={
            data.fecha
              ? `Está en preventa: va a estar lista para leer alrededor del ${new Date(`${data.fecha}T12:00:00`).toLocaleDateString("es-PY", { day: "numeric", month: "long" })}. Te queda guardada en «Mis libros».`
              : "Está en preventa: te queda guardada en «Mis libros» y se abre completa apenas esté lista."
          }
        />
      </Fondo>
    );
  }
  return (
    <Lector
      id={id}
      titulo={data.titulo}
      autor={data.autor}
      marca={data.marca}
      aviso={data.vistaPrevia ? "Vista previa: así lo ve quien lo compra." : null}
      paginas={data.paginas}
    />
  );
}

function Fondo({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#0B1E3A] px-4">{children}</div>;
}

function Aviso({ titulo, texto, icono = false, muestraId }: { titulo: string; texto: string; icono?: boolean; muestraId?: string }) {
  return (
    <div className="max-w-sm text-center text-white">
      {icono && <Lock className="mx-auto mb-3 h-10 w-10 text-[#F2C230]" aria-hidden />}
      <p className="text-lg font-semibold">{titulo}</p>
      <p className="mt-1 text-sm text-white/70">{texto}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {muestraId ? (
          <Link to="/muestra/$id" params={{ id: muestraId }} className="rounded-xl bg-[#F2C230] px-5 py-2.5 font-bold text-[#1B2A44]">
            Ver muestra gratis
          </Link>
        ) : (
          <Link to="/mis-libros" className="rounded-xl bg-[#F2C230] px-5 py-2.5 font-bold text-[#1B2A44]">
            Mis libros
          </Link>
        )}
        <Link to="/libreria" className="rounded-xl border border-white/30 px-5 py-2.5 font-semibold text-white">
          Ir a la Librería
        </Link>
      </div>
    </div>
  );
}

