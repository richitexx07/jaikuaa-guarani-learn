import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, CheckCircle2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GuaraniCharBar } from "@/components/guarani-char-bar";
import { saveJuegoTexto } from "@/lib/juego-textos.functions";
import {
  getTexto,
  itemListo,
  itemsEditor,
  JUEGO_CAMPOS,
  JUEGOS_EDITOR,
  REVISADO,
  type ItemEditor,
  type JuegoId,
  type JuegoTexto,
  type TextosIndex,
} from "@/lib/juego-textos";
import { JUEGO_TEXTOS_KEY, useJuegoTextos } from "@/lib/use-juego-textos";

const IDS = JUEGOS_EDITOR.map((j) => j.id);
const isJuego = (s: unknown): s is JuegoId => typeof s === "string" && (IDS as string[]).includes(s);

const RUTA_JUEGO: Record<JuegoId, string> = {
  trivia: "/trivia",
  karaoke: "/juegos/karaoke",
  tembiu: "/juegos/tembiu",
  taanga: "/juegos/taanga",
  tekojoja: "/juegos/tekojoja",
  chacra: "/juegos/chacra",
};

export const Route = createFileRoute("/_authenticated/docente/juegos")({
  head: () => ({ meta: [{ title: "Jaikuaa — Guaraní de los juegos" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { juego?: JuegoId } => (isJuego(s.juego) ? { juego: s.juego } : {}),
  component: GuaraniDeLosJuegos,
});

function GuaraniDeLosJuegos() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const juego: JuegoId = search.juego ?? "trivia";
  const info = JUEGOS_EDITOR.find((j) => j.id === juego)!;
  const { idx, textos, isStaff, loading, query } = useJuegoTextos();
  const [verTodos, setVerTodos] = useState(false);

  // En el celular, que la pestaña elegida quede a la vista.
  useEffect(() => {
    document.getElementById(`tab-${juego}`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [juego, loading]);

  const porJuego = useMemo(() => {
    const out = {} as Record<JuegoId, { items: ItemEditor[]; listos: number }>;
    for (const id of IDS) {
      const items = itemsEditor(id);
      out[id] = { items, listos: items.filter((it) => itemListo(idx, id, it.clave)).length };
    }
    return out;
  }, [idx]);

  const { items, listos } = porJuego[juego];
  const visibles = verTodos ? items : items.filter((it) => !itemListo(idx, juego, it.clave));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <p className="font-display text-xl font-bold">Esta pantalla es para docentes validadores.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.isError ? "No se pudo cargar. Revisá la conexión y volvé a abrirla." : "Si sos docente, pedí tu acceso desde el Panel del docente."}
          </p>
          <Button asChild className="mt-4">
            <Link to="/docente">Ir al Panel del docente</Link>
          </Button>
        </div>
      </main>
    );
  }

  const pct = items.length ? Math.round((listos / items.length) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/docente" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
            <BrandLogo withWordmark={false} />
            <span>Panel del docente</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <a href={RUTA_JUEGO[juego]}>Ver el juego</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Guaraní de los juegos</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Lo que guardás aparece en el juego enseguida, con tu nombre. Si algo ya está bien, tocá{" "}
            <strong className="text-foreground">Está bien así</strong>. Escribí el guaraní vos: no copies de traductores
            automáticos.
          </p>

          <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm">
            <p className="font-semibold text-foreground">Ventanilla de Jai y Consultorio usan las frases del Modo mostrador.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to="/mostrador/editar" search={{ rubro: "atencion" }} className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 font-semibold text-primary-foreground">Frases de atención al público</Link>
              <Link to="/mostrador/editar" search={{ rubro: "salud" }} className="inline-flex min-h-11 items-center rounded-full border border-primary px-4 font-semibold text-primary">Frases de salud</Link>
            </div>
          </div>

          <nav aria-label="Juegos" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {JUEGOS_EDITOR.map((j) => {
              const p = porJuego[j.id];
              const activo = j.id === juego;
              return (
                <button
                  key={j.id}
                  id={`tab-${j.id}`}
                  type="button"
                  onClick={() => navigate({ search: { juego: j.id }, replace: true })}
                  aria-pressed={activo}
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                    activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {j.nombre}
                  <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${activo ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>
                    {p.listos}/{p.items.length}
                  </span>
                </button>
              );
            })}
          </nav>

          <section className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-lg font-bold text-foreground">{info.nombre}</p>
              <p className="text-xs font-semibold text-accent">{info.quien}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{info.explica}</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${listos} de ${items.length} listos`}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">
                {listos} de {items.length} listos
              </span>
              <button type="button" onClick={() => setVerTodos((v) => !v)} className="min-h-11 px-1 font-semibold text-primary underline-offset-4 hover:underline">
                {verTodos ? "Ver solo pendientes" : "Ver todos"}
              </button>
            </div>
          </section>

          <div className="mt-5">
            <GuaraniCharBar />
          </div>

          {visibles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-primary" aria-hidden />
              <p className="mt-2 font-display text-lg font-bold text-foreground">{info.nombre} está completo</p>
              <p className="mt-1 text-sm text-muted-foreground">Podés pasar a otro juego o tocar «Ver todos» para corregir algo.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {visibles.map((it) => (
                <ItemCard key={`${juego}-${it.clave}`} juego={juego} item={it} idx={idx} textos={textos} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function quienYCuando(textos: JuegoTexto[], juego: JuegoId, clave: string) {
  const mios = textos.filter((t) => t.juego === juego && t.clave === clave && t.campo !== "obs");
  if (!mios.length) return null;
  const ult = mios.reduce((a, b) => (a.cuando > b.cuando ? a : b));
  return { por: ult.por, soloRevisado: mios.every((t) => t.campo === "revisado") };
}

function ItemCard({ juego, item, idx, textos }: { juego: JuegoId; item: ItemEditor; idx: TextosIndex; textos: JuegoTexto[] }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveJuegoTexto);
  const campos = JUEGO_CAMPOS[juego].includes("obs")
    ? [...item.campos.filter((c) => c.campo !== "obs"), ...item.campos.filter((c) => c.campo === "obs")]
    : item.campos;
  // Lo guardado por un docente, o si no hay nada, lo que muestra hoy la app (para corregir sobre eso).
  const base = (campo: string, actual?: string) => getTexto(idx, juego, item.clave, campo) ?? actual ?? "";
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(campos.map((c) => [c.campo, base(c.campo, c.actual)])),
  );
  const [busy, setBusy] = useState(false);

  const cambios = campos.filter((c) => (vals[c.campo] ?? "").trim() !== base(c.campo, c.actual).trim());
  const listo = itemListo(idx, juego, item.clave);
  const firma = quienYCuando(textos, juego, item.clave);

  // Karaoke: la palabra a completar tiene que estar tal cual en el verso.
  let aviso: string | null = null;
  if (juego === "karaoke") {
    const palabras = (vals.verso ?? "").trim().split(/\s+/).filter(Boolean);
    const c = (vals.completar ?? "").trim();
    if (palabras.length && c && !palabras.includes(c)) aviso = "La palabra a completar tiene que estar escrita igual en el verso.";
  }

  async function guardar(lista: { campo: string; texto: string }[], ok: string) {
    setBusy(true);
    try {
      for (const x of lista) await saveFn({ data: { juego, clave: item.clave, campo: x.campo, texto: x.texto } });
      toast.success(ok);
      await qc.invalidateQueries({ queryKey: JUEGO_TEXTOS_KEY });
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  const guardarCambios = () => {
    const lista = cambios.map((c) => {
      const v = (vals[c.campo] ?? "").trim();
      // Si vuelve a quedar igual que la app, se borra lo guardado y el juego usa lo de siempre.
      return { campo: c.campo, texto: c.actual !== undefined && v === c.actual.trim() ? "" : v };
    });
    void guardar(lista, "Guardado. Ya aparece en el juego.");
  };

  return (
    <li className={`rounded-2xl border bg-card p-4 shadow-sm ${listo ? "border-primary/30" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display text-base font-bold text-foreground">{item.titulo}</p>
        {listo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            <Check className="h-3 w-3" aria-hidden />
            {firma?.soloRevisado ? "Revisado" : "Escrito"}
            {firma?.por ? ` por ${firma.por}` : ""}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Pendiente</span>
        )}
      </div>
      <div className="mt-2 space-y-1 rounded-xl bg-muted/50 p-3 text-sm text-foreground">
        {item.contexto.map((l, i) => (
          <p key={i} className={i === 0 ? "" : "text-muted-foreground"}>
            {l}
          </p>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {campos.map((c) => {
          const id = `${juego}-${item.clave}-${c.campo}`;
          const Comp = c.largo ? Textarea : Input;
          return (
            <div key={c.campo}>
              <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground">
                {c.label}
              </label>
              <Comp
                id={id}
                value={vals[c.campo] ?? ""}
                onChange={(ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setVals((v) => ({ ...v, [c.campo]: ev.target.value }))}
                maxLength={600}
                lang={c.campo === "obs" || c.campo === "termino_es" || c.campo === "por_que" ? "es" : "gn"}
                className="mt-1 text-base"
                {...(c.largo ? { rows: 2 } : {})}
              />
              {(c.ayuda || (c.actual !== undefined && (vals[c.campo] ?? "").trim() !== c.actual.trim())) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.ayuda}
                  {c.actual !== undefined && (vals[c.campo] ?? "").trim() !== c.actual.trim() && (
                    <>
                      {c.ayuda ? " " : ""}En la app decía: <span className="font-medium text-foreground">{c.actual || "(vacío)"}</span>
                    </>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {aviso && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">{aviso}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={busy || cambios.length > 0 || !!getTexto(idx, juego, item.clave, "revisado")}
          onClick={() => void guardar([{ campo: "revisado", texto: REVISADO }], "Marcado como revisado.")}
        >
          <Check className="mr-1.5 h-4 w-4" aria-hidden />
          Está bien así
        </Button>
        <Button type="button" className="h-11" disabled={busy || cambios.length === 0 || !!aviso} onClick={guardarCambios}>
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-1.5 h-4 w-4" aria-hidden />}
          Guardar
        </Button>
      </div>
    </li>
  );
}
