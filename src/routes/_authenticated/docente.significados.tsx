import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Languages, Loader2, Undo2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Input } from "@/components/ui/input";
import {
  aprobarSignificados, IDIOMAS_SIG, NOMBRE_IDIOMA_SIG, panelSignificados, quitarSignificado, type FilaSignificado, type IdiomaSig,
} from "@/lib/significados.functions";

/**
 * Los docentes revisan el significado de cada palabra en otros idiomas antes de que aparezca en las lecciones.
 * Se revisa solo el significado (lo que está en castellano, pasado a otro idioma); el guaraní no se toca.
 */
export const Route = createFileRoute("/_authenticated/docente/significados")({
  head: () => ({ meta: [{ title: "Significados en otros idiomas — Docentes" }, { name: "robots", content: "noindex" }] }),
  component: SignificadosPage,
});

function SignificadosPage() {
  const [lang, setLang] = useState<IdiomaSig>("en");
  const listar = useServerFn(panelSignificados);
  const aprobar = useServerFn(aprobarSignificados);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["panel-significados", lang], queryFn: () => listar({ data: { lang } }) });
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [soloLecciones, setSoloLecciones] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setTextos(Object.fromEntries((q.data ?? []).map((f) => [f.id, f.aprobado ?? f.propuesto ?? ""])));
    setMarcadas(new Set());
  }, [q.data]);

  const filas = useMemo(() => (q.data ?? []).filter((f) => !soloLecciones || f.enLeccion), [q.data, soloLecciones]);
  const pendientes = filas.filter((f) => !f.aprobado);
  const aprobadas = (q.data ?? []).filter((f) => f.aprobado).length;

  async function aprobarMarcadas(ids: string[]) {
    const items = ids.map((id) => ({ id, texto: (textos[id] ?? "").trim() })).filter((i) => i.texto);
    if (!items.length) { toast.error("No hay nada marcado para aprobar."); return; }
    setGuardando(true);
    try {
      const r = await aprobar({ data: { lang, items } });
      toast.success(`${r.aprobados} significados aprobados en ${NOMBRE_IDIOMA_SIG[lang].toLowerCase()}`);
      await qc.invalidateQueries({ queryKey: ["panel-significados", lang] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Panel</Link>
          <span className="font-display font-bold text-primary"><BrandLogo /></span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-40 pt-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Languages className="h-6 w-6 text-primary" aria-hidden /> Significados en otros idiomas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quien elige otro idioma en la app ve el significado de cada palabra en ese idioma, pero solo después de que un docente lo aprueba acá.
          Mientras tanto ve el castellano. Se revisa solo el significado: el guaraní no cambia.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Idioma">
          {IDIOMAS_SIG.map((l) => (
            <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-border ${lang === l ? "bg-primary text-primary-foreground" : ""}`}>
              {NOMBRE_IDIOMA_SIG[l]}
            </button>
          ))}
        </div>

        {q.data && (
          <p className="mt-3 text-sm">
            <b>{aprobadas}</b> de {q.data.length} palabras ya aprobadas en {NOMBRE_IDIOMA_SIG[lang].toLowerCase()}.
          </p>
        )}
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={soloLecciones} onChange={(e) => setSoloLecciones(e.target.checked)} className="h-5 w-5" />
          Solo las palabras que están en las lecciones (las primeras que ve un alumno)
        </label>

        {pendientes.length > 0 && (
          // Arriba de la lista y pegado al borde al bajar (abajo lo taparía la barra de la app).
          <div className="sticky top-0 z-10 -mx-4 mt-3 flex flex-wrap items-center gap-2 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur">
            <button type="button" onClick={() => setMarcadas(new Set(pendientes.map((f) => f.id)))} className="min-h-12 rounded-xl px-4 text-sm font-semibold ring-1 ring-border">
              Marcar todas ({pendientes.length})
            </button>
            <button type="button" disabled={guardando || marcadas.size === 0} onClick={() => aprobarMarcadas([...marcadas])}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden />} Aprobar ({marcadas.size})
            </button>
          </div>
        )}
        {q.isLoading ? (
          <p className="mt-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
        ) : q.error ? (
          <p className="mt-8 text-destructive">Esta página es para docentes y administración.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {filas.map((f) => (
              <Fila key={f.id} f={f} lang={lang} texto={textos[f.id] ?? ""} marcada={marcadas.has(f.id)}
                onTexto={(t) => setTextos((x) => ({ ...x, [f.id]: t }))}
                onMarcar={(v) => setMarcadas((s) => { const n = new Set(s); if (v) n.add(f.id); else n.delete(f.id); return n; })}
                onCambio={() => qc.invalidateQueries({ queryKey: ["panel-significados", lang] })} />
            ))}
          </ul>
        )}
      </main>

    </div>
  );
}

function Fila({ f, lang, texto, marcada, onTexto, onMarcar, onCambio }: {
  f: FilaSignificado; lang: IdiomaSig; texto: string; marcada: boolean;
  onTexto: (t: string) => void; onMarcar: (v: boolean) => void; onCambio: () => void;
}) {
  const quitar = useServerFn(quitarSignificado);
  const [ocupado, setOcupado] = useState(false);
  return (
    <li className={`rounded-2xl p-3 ring-1 ${f.aprobado ? "bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-950/20" : "bg-card ring-border"}`}>
      <div className="flex items-start gap-3">
        {!f.aprobado && (
          <input type="checkbox" checked={marcada} onChange={(e) => onMarcar(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" aria-label={`Marcar ${f.gn}`} />
        )}
        <div className="min-w-0 flex-1">
          <p><b className="font-display text-lg text-primary">{f.gn}</b> <span className="text-sm text-muted-foreground">· {f.es}</span>{f.enLeccion && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">en lección</span>}</p>
          {f.aprobado ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200"><Check className="h-4 w-4" aria-hidden /> {f.aprobado}</p>
              <button type="button" disabled={ocupado} onClick={async () => {
                setOcupado(true);
                try { await quitar({ data: { lang, id: f.id } }); toast.success("Vuelve a revisión"); onCambio(); }
                catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo."); }
                finally { setOcupado(false); }
              }} className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-muted-foreground underline underline-offset-4">
                <Undo2 className="h-3.5 w-3.5" aria-hidden /> Corregir
              </button>
            </div>
          ) : (
            <Input value={texto} onChange={(e) => { onTexto(e.target.value); onMarcar(true); }} maxLength={160} className="mt-1 h-11 text-base" aria-label={`Significado de ${f.gn} en ${NOMBRE_IDIOMA_SIG[lang]}`} />
          )}
        </div>
      </div>
    </li>
  );
}
