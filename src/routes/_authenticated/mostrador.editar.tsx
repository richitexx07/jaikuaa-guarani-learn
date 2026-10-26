import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Plus, Save, Undo2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GuaraniCharBar } from "@/components/guarani-char-bar";
import { PhraseAudioRecorder } from "@/components/mostrador/phrase-audio-recorder";
import {
  addMostradorFrase,
  getMostradorAudio,
  listMostrador,
  saveMostradorGn,
  uploadMostradorAudio,
  validateMostrador,
} from "@/lib/mostrador.functions";
import { agruparPorSituacion, faltantes, isRubro, RUBROS, type Frase, type RubroId } from "@/lib/mostrador";
import { playFrase } from "@/lib/mostrador-audio";

export const Route = createFileRoute("/_authenticated/mostrador/editar")({
  head: () => ({ meta: [{ title: "Jaikuaa — Frases del mostrador" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { rubro?: RubroId } =>
    typeof s.rubro === "string" && isRubro(s.rubro) ? { rubro: s.rubro } : {},
  component: EditarMostrador,
});

function estado(f: Frase): { texto: string; clase: string } {
  if (f.status === "publicada") return { texto: "Publicada", clase: "bg-emerald-100 text-emerald-800" };
  const falta = faltantes(f);
  if (falta.length) return { texto: `Falta ${falta.join(" y ")}`, clase: "bg-amber-100 text-amber-800" };
  if (f.gnByMe) return { texto: "Espera que otro docente la valide", clase: "bg-sky-100 text-sky-800" };
  return { texto: "Lista para validar", clase: "bg-primary/10 text-primary" };
}

function EditarMostrador() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const rubro: RubroId = search.rubro ?? "salud";
  const qc = useQueryClient();
  const listFn = useServerFn(listMostrador);
  const audioFn = useServerFn(getMostradorAudio);

  const { data, isLoading, error } = useQuery({
    queryKey: ["mostrador-editar", rubro],
    queryFn: () => listFn({ data: { rubro, todas: true } }),
  });
  const frases = useMemo(() => data?.frases ?? [], [data]);
  const grupos = useMemo(() => agruparPorSituacion(frases), [frases]);
  const conAudio = useMemo(() => frases.filter((f) => f.hasAudio).map((f) => f.id), [frases]);
  const { data: audio } = useQuery({
    queryKey: ["mostrador-editar-audio", rubro, conAudio.join(",")],
    enabled: conAudio.length > 0,
    queryFn: () => audioFn({ data: { ids: conAudio.slice(0, 80) } }),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["mostrador-editar", rubro] });
    void qc.invalidateQueries({ queryKey: ["mostrador", rubro] });
  };

  const total = frases.length;
  const publicadas = frases.filter((f) => f.status === "publicada").length;

  if (!isLoading && data && !data.isStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-display text-xl font-bold">Esta pantalla es para docentes validadores.</p>
          <Button asChild className="mt-4">
            <Link to="/mostrador">Ir al Modo mostrador</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/mostrador" search={{ rubro }}>
              Ver como usuario
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Frases del mostrador</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para cada frase: <strong>1)</strong> un docente escribe el guaraní, <strong>2)</strong> un hablante la graba,
            <strong> 3)</strong> otro docente la escucha y la valida. Solo entonces la ven los usuarios. Escribí el guaraní
            vos: no copies de traductores automáticos.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {RUBROS.map((r) => (
              <Button
                key={r.id}
                variant={r.id === rubro ? "default" : "outline"}
                onClick={() => navigate({ search: { rubro: r.id }, replace: true })}
              >
                {r.emoji} {r.label}
              </Button>
            ))}
          </div>
          {total > 0 && (
            <p className="mt-3 text-sm font-medium text-foreground">
              {publicadas} de {total} frases publicadas
            </p>
          )}

          <div className="mt-6">
            <GuaraniCharBar />
          </div>

          {isLoading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />}
          {error && <p className="mt-8 text-sm text-destructive">{(error as Error).message}</p>}

          <div className="space-y-8">
            {grupos.map((g) => (
              <section key={g.nombre}>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {g.nombre}
                  {g.tipo === "escuchar" && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(respuestas que se escuchan)</span>
                  )}
                </h2>
                <ul className="mt-3 space-y-3">
                  {g.frases.map((f) => (
                    <FraseEditor key={f.id} f={f} url={audio?.urls?.[f.id]} onChanged={refresh} />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {data?.isStaff && <NuevaFrase rubro={rubro} situaciones={grupos.map((g) => g.nombre)} onAdded={refresh} />}
        </div>
      </main>
    </div>
  );
}

function FraseEditor({ f, url, onChanged }: { f: Frase; url?: string; onChanged: () => void }) {
  const saveFn = useServerFn(saveMostradorGn);
  const uploadFn = useServerFn(uploadMostradorAudio);
  const validateFn = useServerFn(validateMostrador);
  const [gn, setGn] = useState(f.gn ?? "");
  const [busy, setBusy] = useState(false);
  const e = estado(f);
  const changed = gn.trim() !== (f.gn ?? "") && gn.trim().length > 0;

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-foreground">{f.es}</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${e.clase}`}>{e.texto}</span>
      </div>

      <label className="mt-3 block text-xs font-semibold text-muted-foreground" htmlFor={`gn-${f.id}`}>
        En guaraní
      </label>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <Textarea
          id={`gn-${f.id}`}
          value={gn}
          onChange={(ev) => setGn(ev.target.value)}
          rows={2}
          maxLength={300}
          className="text-base"
          placeholder="Escribí la frase en guaraní"
          lang="gn"
        />
        <Button
          className="h-11 shrink-0"
          disabled={!changed || busy}
          onClick={() =>
            run(
              () => saveFn({ data: { id: f.id, gn: gn.trim() } }),
              f.hasAudio ? "Guardado. Como cambió la escritura, hay que grabarla de nuevo." : "Guardado.",
            )
          }
        >
          <Save className="h-4 w-4" /> Guardar
        </Button>
      </div>

      {f.gn && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {f.hasAudio && (
            <Button variant="outline" className="h-11" onClick={() => void playFrase(f.id, url)} disabled={!url}>
              <Volume2 className="h-4 w-4" /> Escuchar
            </Button>
          )}
          <div className="w-full sm:w-auto">
            <PhraseAudioRecorder
              label={f.es}
              hasAudio={f.hasAudio}
              onUpload={(base64) => uploadFn({ data: { id: f.id, base64 } })}
              onSaved={onChanged}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {f.status === "publicada" ? (
          <Button
            variant="outline"
            className="h-11"
            disabled={busy}
            onClick={() => run(() => validateFn({ data: { id: f.id, action: "despublicar" } }), "La frase dejó de mostrarse.")}
          >
            <Undo2 className="h-4 w-4" /> Sacar de publicación
          </Button>
        ) : (
          faltantes(f).length === 0 &&
          !f.gnByMe && (
            <Button
              variant="cta"
              className="h-11"
              disabled={busy}
              onClick={() =>
                run(() => validateFn({ data: { id: f.id, action: "publicar" } }), "Validada y publicada.")
              }
            >
              <CheckCircle2 className="h-4 w-4" /> Validar y publicar
            </Button>
          )
        )}
      </div>
    </li>
  );
}

function NuevaFrase({ rubro, situaciones, onAdded }: { rubro: RubroId; situaciones: string[]; onAdded: () => void }) {
  const addFn = useServerFn(addMostradorFrase);
  const [situacion, setSituacion] = useState("");
  const [es, setEs] = useState("");
  const [tipo, setTipo] = useState<"decir" | "escuchar">("decir");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      await addFn({ data: { rubro, situacion: situacion.trim(), tipo, es: es.trim() } });
      toast.success("Frase agregada. Falta el guaraní.");
      setEs("");
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "No se pudo agregar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-dashed p-4">
      <h2 className="font-display text-base font-bold text-foreground">Agregar una frase en castellano</h2>
      <p className="mt-1 text-xs text-muted-foreground">Solo el administrador. El guaraní lo escriben después los docentes.</p>
      <div className="mt-3 grid gap-2">
        <Input
          list="situaciones"
          value={situacion}
          onChange={(e) => setSituacion(e.target.value)}
          placeholder="Situación (por ejemplo: Recepción)"
          maxLength={80}
        />
        <datalist id="situaciones">
          {situaciones.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Input value={es} onChange={(e) => setEs(e.target.value)} placeholder="Frase en castellano" maxLength={300} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={tipo === "decir" ? "default" : "outline"} onClick={() => setTipo("decir")}>
            La dice quien atiende
          </Button>
          <Button type="button" variant={tipo === "escuchar" ? "default" : "outline"} onClick={() => setTipo("escuchar")}>
            Es una respuesta que se escucha
          </Button>
        </div>
        <Button onClick={add} disabled={busy || !situacion.trim() || !es.trim()} className="h-11">
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </div>
    </section>
  );
}
