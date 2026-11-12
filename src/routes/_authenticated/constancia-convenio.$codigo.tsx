import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ArrowLeft, Download, FileCheck2, Loader2, Paperclip, Undo2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { CONVENIOS, NOMBRE_ESTADO, NOMBRE_PROGRAMA } from "@/lib/convenios";
import {
  confirmarAdjunto, MIME_ADJUNTO, pedirRetiro, urlAdjuntoConvenio, verConstancia, type MimeAdjunto,
} from "@/lib/convenios.functions";

export const Route = createFileRoute("/_authenticated/constancia-convenio/$codigo")({
  head: ({ params }) => ({ meta: [{ title: `Constancia ${params.codigo} — Jaikuaa` }, { name: "robots", content: "noindex" }] }),
  component: ConstanciaPage,
});

const fechaHora = (iso: string) => new Date(iso).toLocaleString("es-PY", {
  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Asuncion",
});

function ConstanciaPage() {
  const { codigo } = Route.useParams();
  const ver = useServerFn(verConstancia);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["constancia", codigo], queryFn: () => ver({ data: { codigo } }), retry: false });
  const d = q.data;
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (!d?.codigo) return;
    QRCode.toDataURL(`https://www.jaikuaa.com/verificar-convenio/${d.codigo}`, { margin: 0, width: 220, color: { dark: "#1E3A5F" } })
      .then(setQr).catch(() => setQr(null));
  }, [d?.codigo]);

  if (q.isLoading) return <p className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando la constancia…</p>;
  if (!d) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-xl font-bold">No encontramos esta constancia en tu cuenta</p>
        <Link to="/dashboard" className="mt-4 inline-block font-semibold text-primary">Ir al panel</Link>
      </div>
    );
  }
  const c = CONVENIOS[d.programa];
  const etiqueta = (lista: { id: string; label: string }[], ids: string[]) => ids.map((id) => lista.find((x) => x.id === id)?.label ?? id);
  const recargar = () => qc.invalidateQueries({ queryKey: ["constancia", codigo] });

  return (
    <div className="min-h-screen bg-muted/40 print:bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 14mm; } }`}</style>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 print:hidden">
        <Link to="/convenio/$programa" params={{ programa: d.programa }} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground">
          <Download className="h-4 w-4" aria-hidden /> Descargar PDF
        </button>
      </div>

      <article className="mx-auto max-w-3xl bg-white px-6 py-8 text-[#1b2433] shadow-elegant sm:px-10 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 pb-4" style={{ borderColor: "#1E3A5F" }}>
          <div>
            <div className="font-display text-lg font-bold text-[#1E3A5F]"><BrandLogo /></div>
            <p className="mt-1 text-xs text-[#5b6577]">Guaraní Global Tech E.A.S. · RUC 80174299-4 · www.jaikuaa.com</p>
          </div>
          {qr && <img src={qr} alt={`Código QR para verificar ${d.codigo}`} className="h-24 w-24 shrink-0" />}
        </header>

        <h1 className="mt-5 font-display text-2xl font-bold text-[#1E3A5F]">Constancia de firma electrónica</h1>
        <p className="text-sm text-[#5b6577]">{c.titulo} · {NOMBRE_PROGRAMA[d.programa]}</p>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-[#5b6577]">Código</dt><dd className="font-mono font-bold">{d.codigo}</dd>
          <dt className="text-[#5b6577]">Estado</dt><dd className="font-semibold">{NOMBRE_ESTADO[d.estado]}</dd>
          <dt className="text-[#5b6577]">Titular</dt><dd className="font-semibold">{d.nombre}</dd>
          <dt className="text-[#5b6577]">Cédula</dt><dd>{d.ci}</dd>
          <dt className="text-[#5b6577]">Correo confirmado</dt><dd className="break-all">{d.email}</dd>
          <dt className="text-[#5b6577]">WhatsApp</dt><dd>+{d.whatsapp}</dd>
          {d.ciudad && <><dt className="text-[#5b6577]">Ciudad</dt><dd>{d.ciudad}</dd></>}
          <dt className="text-[#5b6577]">Firma como</dt><dd>{etiqueta(c.roles, d.roles).join(", ")}</dd>
          <dt className="text-[#5b6577]">Fecha y hora</dt><dd>{fechaHora(d.firmado_at)} (hora de Paraguay)</dd>
          <dt className="text-[#5b6577]">Versión del texto</dt><dd>{d.version}</dd>
          {d.adjunto_tipo && <><dt className="text-[#5b6577]">Adjunto</dt><dd>{d.adjunto_tipo === "cualificada" ? "Convenio con firma electrónica cualificada" : "Convenio firmado a mano"}</dd></>}
        </dl>

        <h2 className="mt-6 font-display text-lg font-bold text-[#1E3A5F]">Autoriza</h2>
        <ul className="mt-1 list-disc pl-5 text-sm">{etiqueta(c.permisos, d.permisos).map((p) => <li key={p}>{p}</li>)}</ul>

        <h2 className="mt-5 font-display text-lg font-bold text-[#1E3A5F]">{c.obra.plural[0]!.toUpperCase() + c.obra.plural.slice(1)}</h2>
        <table className="mt-2 w-full border-collapse text-left text-sm">
          <thead><tr className="border-b border-[#c9d0dc]">{c.obra.campos.map((k) => <th key={k.id} className="py-1.5 pr-2 font-semibold">{k.label}</th>)}</tr></thead>
          <tbody>{d.obras.map((o, i) => <tr key={i} className="border-b border-[#e3e7ee]">{c.obra.campos.map((k) => <td key={k.id} className="py-1.5 pr-2 align-top">{o[k.id] || "—"}</td>)}</tr>)}</tbody>
        </table>

        <h2 className="mt-6 font-display text-lg font-bold text-[#1E3A5F]">Texto aceptado</h2>
        <ol className="mt-2 space-y-1.5 text-[13px] leading-relaxed">
          {c.version === d.version
            ? c.clausulas.map((k, i) => <li key={k.t}><b>{i + 1}. {k.t}.</b> {k.x}</li>)
            : <li>El texto de la versión {d.version} queda guardado por Jaikuaa y se identifica con la huella de abajo.</li>}
        </ol>

        <div className="mt-6 rounded-xl bg-[#f3f5f9] p-3 text-xs text-[#3b4557] print:bg-white print:ring-1 print:ring-[#c9d0dc]">
          <p><b>Huella del texto (SHA-256):</b> <span className="break-all font-mono">{d.huella}</span></p>
          <p className="mt-1"><b>Dispositivo:</b> {d.dispositivo || "—"}{d.ip ? ` · IP ${d.ip}` : ""}</p>
          <p className="mt-2">Firmado electrónicamente conforme a la Ley N.° 6822/2021, desde una cuenta con el correo confirmado. Para verificar esta constancia, escaneá el QR o entrá a www.jaikuaa.com/verificar-convenio/{d.codigo}</p>
        </div>
      </article>

      {d.esTitular && (
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 print:hidden">
          <Adjuntar codigo={d.codigo} actual={d.adjuntoUrl} tipo={d.adjunto_tipo} bloqueado={d.estado === "retirado"} onListo={recargar} />
          {d.estado !== "retirado" && d.estado !== "retiro_pedido" && <Retiro codigo={d.codigo} onListo={recargar} />}
          {d.estado === "retiro_pedido" && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">Pediste el retiro. El equipo de Jaikuaa lo hace en un plazo máximo de siete días.</p>}
        </div>
      )}
    </div>
  );
}

function Adjuntar({ codigo, actual, tipo, bloqueado, onListo }: { codigo: string; actual: string | null; tipo: string | null; bloqueado: boolean; onListo: () => void }) {
  const pedir = useServerFn(urlAdjuntoConvenio);
  const confirmar = useServerFn(confirmarAdjunto);
  const [clase, setClase] = useState<"cualificada" | "manuscrita">("cualificada");
  const [subiendo, setSubiendo] = useState(false);
  async function subir(file: File) {
    const mime = file.type as MimeAdjunto;
    if (!(mime in MIME_ADJUNTO)) { toast.error("Subí un PDF o una foto (JPG, PNG o WEBP)."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("El archivo pesa más de 10 MB."); return; }
    setSubiendo(true);
    try {
      const s = await pedir({ data: { codigo, mime } });
      const { error } = await supabase.storage.from("convenios").uploadToSignedUrl(s.path, s.token, file, { contentType: mime });
      if (error) throw new Error("No se pudo subir el archivo.");
      await confirmar({ data: { codigo, path: s.path, tipo: clase } });
      toast.success("Adjunto guardado.");
      onListo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  }
  return (
    <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Paperclip className="h-5 w-5 text-primary" aria-hidden /> Adjuntar el convenio firmado (opcional)</h2>
      <p className="mt-1 text-sm text-muted-foreground">Tu firma en línea ya vale. Si además tenés firma electrónica cualificada, descargá esta constancia, firmala y subila. También podés subir una foto del papel firmado a mano.</p>
      {actual && <a href={actual} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"><FileCheck2 className="h-4 w-4" aria-hidden /> Ver el adjunto ({tipo === "cualificada" ? "firma cualificada" : "firmado a mano"})</a>}
      {!bloqueado && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([["cualificada", "Firma cualificada (PDF)"], ["manuscrita", "Firmado a mano (foto o PDF)"]] as const).map(([k, t]) => (
              <button key={k} type="button" aria-pressed={clase === k} onClick={() => setClase(k)}
                className={`min-h-12 rounded-xl border-2 px-2 text-sm font-semibold ${clase === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{t}</button>
            ))}
          </div>
          <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold text-primary ring-1 ring-border">
            {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" aria-hidden />} {actual ? "Reemplazar el archivo" : "Elegir el archivo"}
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={subiendo}
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void subir(f); }} />
          </label>
        </>
      )}
    </section>
  );
}

function Retiro({ codigo, onListo }: { codigo: string; onListo: () => void }) {
  const pedir = useServerFn(pedirRetiro);
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground underline underline-offset-4">
        <Undo2 className="h-4 w-4" aria-hidden /> Quiero retirar mis obras
      </button>
    );
  }
  return (
    <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <h2 className="font-display text-lg font-bold">Pedir el retiro</h2>
      <p className="mt-1 text-sm text-muted-foreground">Jaikuaa retira lo autorizado en un plazo máximo de siete días. Si querés, contanos el motivo.</p>
      <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-base" />
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={enviando} onClick={async () => {
          setEnviando(true);
          try { await pedir({ data: { codigo, motivo } }); toast.success("Pedido de retiro enviado."); onListo(); }
          catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo enviar."); }
          finally { setEnviando(false); }
        }} className="min-h-11 rounded-xl bg-destructive px-4 text-sm font-bold text-destructive-foreground disabled:opacity-50">Confirmar el retiro</button>
        <button type="button" onClick={() => setAbierto(false)} className="min-h-11 rounded-xl px-4 text-sm font-semibold ring-1 ring-border">Cancelar</button>
      </div>
    </section>
  );
}
