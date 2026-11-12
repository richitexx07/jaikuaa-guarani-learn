import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Download, GraduationCap, Loader2, Mail, MapPin, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { actualizarColaborador, panelColaboradores, type ColaboradorRow } from "@/lib/colaboradores.functions";
import { aCsv, DEPARTAMENTOS, ESTADOS, nombreAporte, nombrePerfil, PERFILES, type EstadoColaborador } from "@/lib/colaboradores";

/** Panel de postulaciones de colaboradores: lo usan la administración y los docentes para elegir a quién llamar. */
export const Route = createFileRoute("/_authenticated/admin/colaboradores")({
  head: () => ({ meta: [{ title: "Colaboradores — Panel" }, { name: "robots", content: "noindex" }] }),
  component: PanelPage,
});

const CLAVE = ["colaboradores-panel"];
const COLOR: Record<EstadoColaborador, string> = {
  nuevo: "bg-sky-100 text-sky-900", contactado: "bg-amber-100 text-amber-900", seleccionado: "bg-emerald-100 text-emerald-900", descartado: "bg-muted text-muted-foreground",
};
const fecha = (iso: string) => new Intl.DateTimeFormat("es-PY", { timeZone: "America/Asuncion", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function PanelPage() {
  const listar = useServerFn(panelColaboradores);
  const { data, isLoading, error } = useQuery({ queryKey: CLAVE, queryFn: () => listar(), retry: false });
  const [estado, setEstado] = useState<string>("todos");
  const [dep, setDep] = useState<string>("todos");
  const [perfil, setPerfil] = useState<string>("todos");
  const filas = useMemo(() => (data?.filas ?? []).filter((r) =>
    (estado === "todos" || r.estado === estado) && (dep === "todos" || r.departamento === dep) && (perfil === "todos" || r.perfil === perfil)), [data, estado, dep, perfil]);
  const porDep = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data?.filas ?? []) m.set(r.departamento, (m.get(r.departamento) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);

  function descargar() {
    const csv = aCsv(filas.map((r) => ({
      Fecha: fecha(r.created_at), Nombre: r.nombre, Departamento: r.departamento, Ciudad: r.ciudad, WhatsApp: r.whatsapp ?? "", Correo: r.email ?? "",
      Perfil: nombrePerfil(r.perfil), Institución: r.institucion, Lenguas: r.lenguas, Colabora: r.aportes.map(nombreAporte).join(", "),
      Capacitación: r.capacitacion ? "Sí" : "No", Comentario: r.comentario, Origen: r.origen, Estado: r.estado, Nota: r.nota_interna,
    })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "colaboradores-jaikuaa.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const sel = "h-10 rounded-md border bg-background px-2 text-sm";
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/dashboard"><BrandLogo withWordmark={false} /></Link>
          <Button asChild variant="outline" size="sm"><Link to="/colaboradores">Ver el formulario</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="font-display text-2xl font-bold">Colaboradores</h1>
        <p className="mt-1 text-sm text-muted-foreground">Postulaciones desde jaikuaa.com/colaboradores y desde el QR. Los datos son privados: no se publican ni se comparten.</p>
        {isLoading && <p className="mt-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>}
        {error && <p className="mt-6 text-destructive">Este panel es para administración y docentes.</p>}
        {data && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ESTADOS.map((e) => (
                <button key={e.id} type="button" onClick={() => setEstado(estado === e.id ? "todos" : e.id)}
                  className={`rounded-2xl p-3 text-left ring-1 ring-border transition ${estado === e.id ? "ring-2 ring-primary" : ""}`}>
                  <b className="block font-display text-2xl tabular-nums">{data.filas.filter((r) => r.estado === e.id).length}</b>
                  <span className="text-sm text-muted-foreground">{e.nombre}</span>
                </button>
              ))}
            </div>
            {porDep.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {porDep.map(([d, n]) => <span key={d} className="rounded-full bg-muted px-2.5 py-1">{d}: <b>{n}</b></span>)}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select className={sel} value={dep} onChange={(e) => setDep(e.target.value)} aria-label="Departamento">
                <option value="todos">Todos los departamentos</option>
                {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className={sel} value={perfil} onChange={(e) => setPerfil(e.target.value)} aria-label="Perfil">
                <option value="todos">Todos los perfiles</option>
                {PERFILES.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <Button variant="outline" className="h-10" onClick={descargar} disabled={!filas.length}><Download className="mr-1.5 h-4 w-4" /> Descargar planilla ({filas.length})</Button>
            </div>
            <ul className="mt-5 space-y-3">
              {filas.map((r) => <Item key={r.id} r={r} />)}
              {filas.length === 0 && <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Todavía no hay postulaciones en esta lista.</li>}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function Item({ r }: { r: ColaboradorRow }) {
  const [abierto, setAbierto] = useState(false);
  const [nota, setNota] = useState(r.nota_interna);
  const qc = useQueryClient();
  const guardar = useServerFn(actualizarColaborador);
  const m = useMutation({
    mutationFn: (estado: EstadoColaborador) => guardar({ data: { id: r.id, estado, nota } }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: CLAVE }); toast.success("Guardado"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo guardar"),
  });
  return (
    <li className="rounded-2xl bg-card ring-1 ring-border">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-start gap-3 p-3 text-left">
        <span className="min-w-0 flex-1">
          <b className="block truncate font-display text-lg">{r.nombre}</b>
          <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden /> {[r.ciudad, r.departamento].filter(Boolean).join(", ")}</span>
            <span>{nombrePerfil(r.perfil)}</span>
            {r.capacitacion && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" aria-hidden /> Quiere capacitación</span>}
            <span>{fecha(r.created_at)}{r.origen ? ` · ${r.origen}` : ""}</span>
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR[r.estado]}`}>{ESTADOS.find((e) => e.id === r.estado)?.nombre}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div className="space-y-3 border-t border-border p-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {r.whatsapp && <Button asChild variant="outline" className="h-10"><a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" /> {r.whatsapp}</a></Button>}
            {r.email && <Button asChild variant="outline" className="h-10"><a href={`mailto:${r.email}`}><Mail className="mr-1.5 h-4 w-4" /> {r.email}</a></Button>}
          </div>
          {r.institucion && <p><b>Institución:</b> {r.institucion}</p>}
          {r.lenguas && <p><b>Lenguas:</b> {r.lenguas}</p>}
          <p><b>Quiere colaborar:</b> {r.aportes.map(nombreAporte).join(" · ")}</p>
          {r.comentario && <p className="whitespace-pre-line rounded-xl bg-muted/60 p-3">{r.comentario}</p>}
          <label className="block font-medium">Nota del equipo (privada)
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} maxLength={600} rows={2} className="mt-1" />
          </label>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <Button key={e.id} variant={r.estado === e.id ? "default" : "outline"} className="h-10" disabled={m.isPending} onClick={() => m.mutate(e.id)}>{e.nombre}</Button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
