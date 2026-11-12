import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, XCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CONVENIOS, NOMBRE_ESTADO, NOMBRE_PROGRAMA } from "@/lib/convenios";
import { verificarConvenio } from "@/lib/convenios.functions";

export const Route = createFileRoute("/verificar-convenio/$codigo")({
  loader: ({ params }) => verificarConvenio({ data: { codigo: params.codigo } }),
  head: ({ params }) => ({
    meta: [
      { title: `Verificación de convenio ${params.codigo} | Jaikuaa` },
      { name: "description", content: "Verificá la autenticidad de un convenio firmado en línea con Jaikuaa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerificarPage,
});

function VerificarPage() {
  const v = Route.useLoaderData();
  const { codigo } = Route.useParams();
  const vigente = v && (v.estado === "aprobado" || v.estado === "pendiente");
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <Link to="/" className="font-display text-xl font-bold text-primary"><BrandLogo /></Link>
      <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-elegant">
        {v ? (
          <>
            <BadgeCheck className={`mx-auto h-14 w-14 ${vigente ? "text-primary" : "text-muted-foreground"}`} aria-hidden />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Convenio auténtico</h1>
            <p className="mt-4 text-muted-foreground">{CONVENIOS[v.programa].titulo}</p>
            <p className="text-sm text-muted-foreground">{NOMBRE_PROGRAMA[v.programa]}</p>
            <p className="mt-4 text-muted-foreground">Firmado electrónicamente por</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{v.nombre}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              el {new Date(v.firmado_at).toLocaleString("es-PY", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Asuncion" })}
            </p>
            <p className="mt-4 inline-block rounded-full bg-muted px-4 py-1 text-sm font-semibold text-foreground">Estado: {NOMBRE_ESTADO[v.estado]}</p>
            <dl className="mt-5 space-y-1 text-left text-xs text-muted-foreground">
              <div><dt className="inline font-semibold">Código: </dt><dd className="inline font-mono">{v.codigo}</dd></div>
              <div><dt className="inline font-semibold">Versión: </dt><dd className="inline">{v.version}</dd></div>
              <div><dt className="inline font-semibold">Huella (SHA-256): </dt><dd className="inline break-all font-mono">{v.huella}</dd></div>
              {v.adjunto_tipo && <div><dt className="inline font-semibold">Adjunto: </dt><dd className="inline">{v.adjunto_tipo === "cualificada" ? "con firma electrónica cualificada" : "firmado a mano"}</dd></div>}
            </dl>
            <p className="mt-5 text-xs text-muted-foreground">Firma electrónica conforme a la Ley N.° 6822/2021, desde una cuenta con el correo confirmado. Por privacidad, acá no se muestran la cédula ni el correo.</p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-14 w-14 text-destructive" aria-hidden />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Código no encontrado</h1>
            <p className="mt-3 text-sm text-muted-foreground">No existe ningún convenio de Jaikuaa con el código <span className="font-mono">{codigo}</span>.</p>
          </>
        )}
      </div>
    </div>
  );
}
