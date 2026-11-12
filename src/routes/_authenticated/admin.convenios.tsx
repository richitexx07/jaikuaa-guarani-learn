import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, ExternalLink, FileSignature, Loader2, Paperclip, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CONVENIOS, ESTADOS, NOMBRE_ESTADO, NOMBRE_PROGRAMA, type Estado, type Programa } from "@/lib/convenios";
import { crearFichaDesdeConvenio, decidirConvenio, panelConvenios, type ConvenioRow } from "@/lib/convenios.functions";

/** Panel de convenios firmados en línea: revisar, aprobar o rechazar, retirar y crear la ficha en Purahéi. */
export const Route = createFileRoute("/_authenticated/admin/convenios")({
  head: () => ({ meta: [{ title: "Convenios firmados — Panel" }, { name: "robots", content: "noindex" }] }),
  component: PanelConvenios,
});

const COLOR: Record<Estado, string> = {
  pendiente: "bg-amber-100 text-amber-900",
  aprobado: "bg-emerald-100 text-emerald-900",
  rechazado: "bg-muted text-muted-foreground",
  retiro_pedido: "bg-red-100 text-red-900",
  retirado: "bg-muted text-muted-foreground",
};

function PanelConvenios() {
  const [programa, setPrograma] = useState<Programa | undefined>();
  const [estado, setEstado] = useState<Estado | undefined>();
  const listar = useServerFn(panelConvenios);
  const q = useQuery({ queryKey: ["panel-convenios", programa, estado], queryFn: () => listar({ data: { programa, estado } }) });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Panel</Link>
          <span className="font-display font-bold text-primary"><BrandLogo /></span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><FileSignature className="h-6 w-6 text-primary" aria-hidden /> Convenios firmados</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lo firmado no se puede cambiar. Acá se revisa, se aprueba o se rechaza, y se atienden los pedidos de retiro (plazo: siete días).</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {([undefined, "purahei", "libreria"] as const).map((p) => (
            <button key={p ?? "todos"} type="button" aria-pressed={programa === p} onClick={() => setPrograma(p)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold ring-1 ring-border ${programa === p ? "bg-primary text-primary-foreground" : ""}`}>
              {p ? NOMBRE_PROGRAMA[p] : "Todos"}
            </button>
          ))}
          <select value={estado ?? ""} onChange={(e) => setEstado((e.target.value || undefined) as Estado | undefined)} className="min-h-10 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">Cualquier estado</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{NOMBRE_ESTADO[s]}</option>)}
          </select>
        </div>
        {q.isLoading ? (
          <p className="mt-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
        ) : q.error ? (
          <p className="mt-8 text-destructive">No tenés acceso a este panel.</p>
        ) : !q.data?.length ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">Todavía no hay convenios firmados con este filtro.</p>
        ) : (
          <ul className="mt-5 space-y-3">{q.data.map((c) => <Fila key={c.id} c={c} />)}</ul>
        )}
      </main>
    </div>
  );
}

function Fila({ c }: { c: ConvenioRow }) {
  const [abierto, setAbierto] = useState(false);
  const [nota, setNota] = useState(c.nota);
  const [ocupado, setOcupado] = useState(false);
  const qc = useQueryClient();
  const decidir = useServerFn(decidirConvenio);
  const crearFicha = useServerFn(crearFichaDesdeConvenio);
  const conv = CONVENIOS[c.programa];
  const lbl = (lista: { id: string; label: string }[], ids: string[]) => ids.map((id) => lista.find((x) => x.id === id)?.label ?? id).join(" · ");
  async function hacer(fn: () => Promise<unknown>, ok: string) {
    setOcupado(true);
    try { await fn(); toast.success(ok); await qc.invalidateQueries({ queryKey: ["panel-convenios"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo."); }
    finally { setOcupado(false); }
  }
  return (
    <li className="rounded-2xl bg-card ring-1 ring-border">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="min-w-0 flex-1">
          <b className="block truncate font-display text-lg">{c.nombre}</b>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${COLOR[c.estado]}`}>{NOMBRE_ESTADO[c.estado]}</span>
            <span>{NOMBRE_PROGRAMA[c.programa]}</span>
            <span className="font-mono">{c.codigo}</span>
            <span>{new Date(c.firmado_at).toLocaleDateString("es-PY", { timeZone: "America/Asuncion" })}</span>
            {c.adjunto_tipo && <span className="inline-flex items-center gap-0.5"><Paperclip className="h-3 w-3" aria-hidden /> adjunto</span>}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition ${abierto ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {abierto && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Cédula</dt><dd>{c.ci}</dd>
            <dt className="text-muted-foreground">Correo</dt><dd className="break-all">{c.email}</dd>
            <dt className="text-muted-foreground">WhatsApp</dt><dd><a className="font-semibold text-primary" href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer">+{c.whatsapp}</a></dd>
            {c.ciudad && <><dt className="text-muted-foreground">Ciudad</dt><dd>{c.ciudad}</dd></>}
            <dt className="text-muted-foreground">Firma como</dt><dd>{lbl(conv.roles, c.roles)}</dd>
            <dt className="text-muted-foreground">Autoriza</dt><dd>{lbl(conv.permisos, c.permisos)}</dd>
            <dt className="text-muted-foreground">Versión</dt><dd>{c.version}</dd>
          </dl>
          <div>
            <p className="font-semibold">{conv.obra.plural[0]!.toUpperCase() + conv.obra.plural.slice(1)}</p>
            <ul className="mt-1 list-disc pl-5">
              {c.obras.map((o, i) => <li key={i}><b>{o.titulo}</b>{[o.autor, o.interprete, o.productor].filter(Boolean).length ? ` — ${[o.autor, o.interprete, o.productor].filter(Boolean).join(" / ")}` : ""}</li>)}
            </ul>
          </div>
          <Link to="/constancia-convenio/$codigo" params={{ codigo: c.codigo }} className="inline-flex items-center gap-1 font-semibold text-primary">
            Ver la constancia{c.adjunto_tipo ? " y el adjunto" : ""} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Nota del equipo (la ve solo el equipo)</span>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} maxLength={1000} rows={2} className="mt-1 w-full rounded-xl border border-input bg-background p-2 text-base" />
          </label>
          <div className="flex flex-wrap gap-2">
            {c.estado !== "aprobado" && c.estado !== "retirado" && (
              <button type="button" disabled={ocupado} onClick={() => hacer(() => decidir({ data: { id: c.id, estado: "aprobado", nota } }), "Convenio aprobado")} className="min-h-11 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">Aprobar</button>
            )}
            {c.estado === "pendiente" && (
              <button type="button" disabled={ocupado} onClick={() => hacer(() => decidir({ data: { id: c.id, estado: "rechazado", nota } }), "Convenio rechazado")} className="min-h-11 rounded-xl px-4 font-semibold ring-1 ring-border disabled:opacity-50">Rechazar</button>
            )}
            {c.estado !== "retirado" && c.estado !== "pendiente" && c.estado !== "rechazado" && (
              <button type="button" disabled={ocupado} onClick={() => hacer(() => decidir({ data: { id: c.id, estado: "retirado", nota } }), "Marcado como retirado")} className="min-h-11 rounded-xl bg-destructive px-4 font-semibold text-destructive-foreground disabled:opacity-50">Ya retiré sus obras</button>
            )}
            {c.programa === "purahei" && c.estado === "aprobado" && !c.artista_id && (
              <button type="button" disabled={ocupado} onClick={() => hacer(() => crearFicha({ data: { id: c.id } }), "Ficha creada en Purahéi (sin publicar)")} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">
                <UserPlus className="h-4 w-4" aria-hidden /> Crear su ficha en Purahéi
              </button>
            )}
            {c.artista_id && <Link to="/admin/purahei" className="inline-flex min-h-11 items-center font-semibold text-primary">Ir a su ficha en el panel de Purahéi</Link>}
          </div>
          {c.estado === "retiro_pedido" && <p className="text-xs text-red-800">Pidió el retiro: despublicá sus obras en el panel de Purahéi o de la Librería y después tocá «Ya retiré sus obras».</p>}
        </div>
      )}
    </li>
  );
}
