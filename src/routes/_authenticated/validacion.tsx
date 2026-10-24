import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, History, Loader2, RotateCcw, Search, UserPlus, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GuaraniCharBar } from "@/components/guarani-char-bar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addReviewer,
  getCircuitRoles,
  getProposalHistory,
  getVerificationQueue,
  listMyProposals,
  listQueue,
  listReviewers,
  proposeContent,
  removeReviewer,
  resubmitProposal,
  reviewProposal,
  searchWordsForCorrection,
  validateProposal,
  type ProposalStatus,
  type VerificationState,
  type VerificationWord,
} from "@/lib/validation-circuit.functions";
import { listContentReports, setContentReportStatus, type ContentReport, type ReportStatus } from "@/lib/content-reports.functions";

export const Route = createFileRoute("/_authenticated/validacion")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Circuito de validación" },
      { name: "description", content: "Proponer, revisar y validar contenido del corpus en tres pasos." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Jaikuaa — Circuito de validación" },
      { property: "og:description", content: "Accedé al circuito de propuestas, revisión y validación de contenido de Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { tab?: CircuitTab } =>
    TABS.includes(s.tab as CircuitTab) ? { tab: s.tab as CircuitTab } : {},
  component: ValidationCircuitPage,
});

const TABS = ["proponer", "mias", "verificar", "revisar", "errores", "validar", "revisores"] as const;
type CircuitTab = (typeof TABS)[number];

const STATUS_LABEL: Record<ProposalStatus, { label: string; cls: string }> = {
  propuesta: { label: "Esperando revisión", cls: "bg-muted text-foreground" },
  revisada: { label: "Esperando validación docente", cls: "bg-accent/15 text-accent" },
  validada: { label: "Validada y publicada", cls: "bg-primary/15 text-primary" },
  devuelta: { label: "Devuelta para corregir", cls: "bg-amber-100 text-amber-800" },
  rechazada: { label: "No aceptada", cls: "bg-destructive/10 text-destructive" },
};

const STEP_LABEL: Record<string, string> = {
  propuesta: "Propuso",
  reenviada: "Corrigió y reenvió",
  revisada: "Revisó y aprobó",
  devuelta_en_revision: "Devolvió en revisión",
  rechazada_en_revision: "No aceptó en revisión",
  devuelta_en_validacion: "Devolvió en validación",
  rechazada_en_validacion: "No aceptó en validación",
  validada: "Validó y publicó",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PY", { dateStyle: "short", timeStyle: "short" }) : "";

function ValidationCircuitPage() {
  const rolesFn = useServerFn(getCircuitRoles);
  const roles = useQuery({ queryKey: ["circuit-roles"], queryFn: () => rolesFn() });
  const { tab } = Route.useSearch();

  if (roles.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  const r = roles.data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Circuito de validación</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tres personas distintas en tres pasos: <strong>una propone</strong>, <strong>otra revisa</strong> y{" "}
        <strong>un docente valida</strong>. Nada se publica hasta la validación docente, y cada paso queda
        registrado con nombre, fecha y hora.
      </p>

      <div className="mt-6"><GuaraniCharBar /></div>
      <Tabs
        defaultValue={
          tab === "validar" || tab === "revisores"
            ? (tab === "validar" ? r?.canValidate : r?.isAdmin)
              ? tab
              : "proponer"
            : tab && tab !== "proponer" && tab !== "mias" && !r?.canReview
              ? "proponer"
              : (tab ?? "proponer")
        }
      >
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="proponer">Proponer</TabsTrigger>
          <TabsTrigger value="mias">Mis propuestas</TabsTrigger>
          {r?.canReview && <TabsTrigger value="verificar">Palabras para verificar</TabsTrigger>}
          {r?.canReview && <TabsTrigger value="revisar">Revisar</TabsTrigger>}
          {r?.canReview && <TabsTrigger value="errores">Errores señalados</TabsTrigger>}
          {r?.canValidate && <TabsTrigger value="validar">Validar</TabsTrigger>}
          {r?.isAdmin && <TabsTrigger value="revisores">Revisores</TabsTrigger>}
        </TabsList>
        <TabsContent value="proponer">
          {r?.canPropose ? (
            <ProposeForm />
          ) : (
            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-6 text-sm shadow-elegant">
              <p className="font-semibold text-foreground">Proponer palabras es solo para personas habilitadas del piloto.</p>
              <p className="mt-2 text-muted-foreground">
                Si sos docente o estudiante en práctica, pedí tu acceso. Si encontraste un error en una palabra, usá
                «Señalar un error» desde la lección: eso sí está abierto para todos.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="cta" size="sm">
                  <Link to="/docente">Soy docente</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/practica">Soy estudiante en práctica</Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="mias">
          <MyProposals />
        </TabsContent>
        {r?.canReview && (
          <TabsContent value="verificar">
            <VerificationQueue />
          </TabsContent>
        )}
        {r?.canReview && (
          <TabsContent value="revisar">
            <Queue step="revisar" />
          </TabsContent>
        )}
        {r?.canReview && (
          <TabsContent value="errores">
            <ReportsInbox />
          </TabsContent>
        )}
        {r?.canValidate && (
          <TabsContent value="validar">
            <Queue step="validar" />
          </TabsContent>
        )}
        {r?.isAdmin && (
          <TabsContent value="revisores">
            <Reviewers />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/* ------------------------------ Proponer ------------------------------ */

function ProposeForm() {
  const qc = useQueryClient();
  const proposeFn = useServerFn(proposeContent);
  const searchFn = useServerFn(searchWordsForCorrection);
  const [kind, setKind] = useState<"nueva" | "correccion">("nueva");
  const [target, setTarget] = useState<{ id: string; gn: string; es: string } | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; gn: string; es: string }[]>([]);
  const [gn, setGn] = useState("");
  const [es, setEs] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");

  const search = useMutation({
    mutationFn: () => searchFn({ data: { q: query } }),
    onSuccess: (d) => setResults(d.words),
  });
  const send = useMutation({
    mutationFn: () =>
      proposeFn({ data: { kind, targetWordId: target?.id ?? null, gn, es, notes, source } }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success("Propuesta enviada. Ahora la revisa otra persona.");
      setGn("");
      setEs("");
      setNotes("");
      setSource("");
      setTarget(null);
      qc.invalidateQueries({ queryKey: ["my-proposals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pick = (w: { id: string; gn: string; es: string }) => {
    setTarget(w);
    setGn(w.gn);
    setEs(w.es);
    setResults([]);
  };

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="flex flex-wrap gap-2">
        <Button variant={kind === "nueva" ? "default" : "outline"} size="sm" onClick={() => { setKind("nueva"); setTarget(null); }}>
          Palabra nueva
        </Button>
        <Button variant={kind === "correccion" ? "default" : "outline"} size="sm" onClick={() => setKind("correccion")}>
          Corregir una palabra
        </Button>
      </div>

      {kind === "correccion" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscá la palabra a corregir</label>
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="En guaraní o en castellano" />
            <Button variant="outline" onClick={() => search.mutate()} disabled={query.trim().length < 2 || search.isPending}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {results.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {results.map((w) => (
                <li key={w.id}>
                  <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => pick(w)}>
                    <strong>{w.gn}</strong> — {w.es}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {target && (
            <p className="text-xs text-muted-foreground">
              Corrigiendo: <strong>{target.gn}</strong> — {target.es}. Cambiá abajo lo que esté mal.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">En guaraní</label>
          <Input value={gn} onChange={(e) => setGn(e.target.value)} maxLength={200} />
        </div>
        <div>
          <label className="text-sm font-medium">En castellano</label>
          <Input value={es} onChange={(e) => setEs(e.target.value)} maxLength={300} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Notas (uso, región, registro, por qué corregir)</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium">Fuente (diccionario, libro, docente o hablante)</label>
        <Input value={source} onChange={(e) => setSource(e.target.value)} maxLength={300} />
      </div>
      <p className="text-xs text-muted-foreground">
        Escribilo vos, con tus palabras: no copies de traductores automáticos ni de inteligencia artificial.
        Lo que propongas no se publica hasta que lo revise otra persona y lo valide un docente.
      </p>
      <Button
        variant="cta"
        onClick={() => send.mutate()}
        disabled={!gn.trim() || !es.trim() || (kind === "correccion" && !target) || send.isPending}
      >
        {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar propuesta
      </Button>
    </div>
  );
}

/* ----------------------- Palabras para verificar ----------------------- */

const SOURCE_LABEL: Record<VerificationWord["fuente"], { short: string; cite: string }> = {
  "common-voice": { short: "Common Voice", cite: "Mozilla Common Voice, guaraní (CC0)" },
  jojajovai: { short: "Jojajovai", cite: "Corpus Jojajovai (Grupo PLN, Universidad de la República, 2022)" },
  vikipeta: { short: "Vikipetã", cite: "Vikipetã, Wikipedia en guaraní (colaboradores de gn.wikipedia.org, CC BY-SA 4.0)" },
};

const STATE_LABEL: Record<VerificationState, string> = {
  pendiente: "Pendiente",
  en_circuito: "Ya está en el circuito",
  en_corpus: "Ya está en el corpus",
};

/**
 * Palabras frecuentes en textos reales que todavía no tienen respaldo. El docente confirma si la
 * palabra está bien escrita y escribe el significado con sus palabras; al enviarla entra al
 * circuito como propuesta suya (después la revisa otra persona y la valida un docente).
 */
function VerificationQueue() {
  const fn = useServerFn(getVerificationQueue);
  const q = useQuery({ queryKey: ["verification-queue"], queryFn: () => fn() });
  const [filter, setFilter] = useState<"pendiente" | "todas">("pendiente");
  const [source, setSource] = useState<"todas" | VerificationWord["fuente"]>("todas");
  const [search, setSearch] = useState("");
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(30);

  if (q.isLoading) return <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-primary" />;
  if (q.isError || !q.data) return <p className="mt-6 text-sm text-muted-foreground">No se pudo cargar la lista.</p>;
  const { palabras, state, dailyLimit } = q.data;
  const stateOf = (gn: string): VerificationState => (sent.has(gn) ? "en_circuito" : state[gn] ?? "pendiente");
  const needle = search.trim().toLowerCase();
  const list = palabras.filter(
    (p) =>
      !skipped.has(p.gn) &&
      (filter === "todas" || stateOf(p.gn) === "pendiente") &&
      (source === "todas" || p.fuente === source) &&
      (!needle || p.gn.toLowerCase().includes(needle)),
  );
  const pending = palabras.filter((p) => stateOf(p.gn) === "pendiente").length;

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm">
        <p className="text-foreground">
          Estas palabras aparecen muchas veces en textos reales en guaraní, pero todavía no tienen respaldo en Jaikuaa.
          Si la palabra está bien escrita, escribí su significado con tus palabras y enviala: entra al circuito como
          propuesta tuya. Si no es guaraní o está mal escrita, tocá «Saltar».
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {pending} pendientes de {palabras.length}. Máximo {dailyLimit} propuestas por día por persona. La lectura del motor es
          automática y no está validada: no la copies si no estás de acuerdo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={filter === "pendiente" ? "default" : "outline"} onClick={() => setFilter("pendiente")}>
          Pendientes
        </Button>
        <Button size="sm" variant={filter === "todas" ? "default" : "outline"} onClick={() => setFilter("todas")}>
          Todas
        </Button>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        {(["todas", "common-voice", "jojajovai", "vikipeta"] as const).map((s) => (
          <Button key={s} size="sm" variant={source === s ? "secondary" : "ghost"} onClick={() => setSource(s)}>
            {s === "todas" ? "Todas las fuentes" : SOURCE_LABEL[s].short}
          </Button>
        ))}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar palabra"
          className="h-9 w-full sm:ml-auto sm:w-48"
          aria-label="Buscar palabra"
        />
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay palabras con este filtro.</p>
      ) : (
        <ul className="space-y-2">
          {list.slice(0, shown).map((p) => (
            <li key={p.gn} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold text-foreground">{p.gn}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.veces} veces · {SOURCE_LABEL[p.fuente].short}
                    {p.lectura && <> · el motor la lee: {p.lectura}</>}
                  </p>
                  {p.ejemplo && <p className="mt-1 text-sm italic text-muted-foreground">«{p.ejemplo}»</p>}
                </div>
                {stateOf(p.gn) === "pendiente" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setOpen(open === p.gn ? null : p.gn)}>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Está bien escrita
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSkipped((s) => new Set([...s, p.gn]))}
                      aria-label={`Saltar ${p.gn}`}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Saltar
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline">{STATE_LABEL[stateOf(p.gn)]}</Badge>
                )}
              </div>
              {open === p.gn && (
                <VerifyForm
                  word={p}
                  onSent={() => {
                    setSent((s) => new Set([...s, p.gn]));
                    setOpen(null);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {list.length > shown && (
        <Button variant="outline" className="w-full" onClick={() => setShown((n) => n + 30)}>
          Ver 30 más ({list.length - shown} restantes)
        </Button>
      )}
    </div>
  );
}

function VerifyForm({ word, onSent }: { word: VerificationWord; onSent: () => void }) {
  const qc = useQueryClient();
  const proposeFn = useServerFn(proposeContent);
  const [gn, setGn] = useState(word.gn);
  const [es, setEs] = useState("");
  const [notes, setNotes] = useState("");
  const send = useMutation({
    mutationFn: () =>
      proposeFn({ data: { kind: "nueva", targetWordId: null, gn, es, notes, source: `${SOURCE_LABEL[word.fuente].cite}; verificada por docente` } }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success("Enviada al circuito. Ahora la revisa otra persona.");
      qc.invalidateQueries({ queryKey: ["my-proposals"] });
      onSent();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">En guaraní (corregí si hace falta)</label>
          <Input value={gn} onChange={(e) => setGn(e.target.value)} maxLength={200} />
        </div>
        <div>
          <label className="text-sm font-medium">Qué significa, en castellano</label>
          <Input value={es} onChange={(e) => setEs(e.target.value)} maxLength={300} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Notas (uso, región, si es una forma conjugada)</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} />
      </div>
      <Button variant="cta" size="sm" onClick={() => send.mutate()} disabled={!gn.trim() || !es.trim() || send.isPending}>
        {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar al circuito
      </Button>
    </div>
  );
}

/* --------------------------- Mis propuestas --------------------------- */

function MyProposals() {
  const fn = useServerFn(listMyProposals);
  const q = useQuery({ queryKey: ["my-proposals"], queryFn: () => fn() });
  if (q.isLoading) return <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-primary" />;
  const list = q.data?.proposals ?? [];
  if (!list.length) return <p className="mt-6 text-sm text-muted-foreground">Todavía no enviaste propuestas.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {list.map((p) => (
        <li key={p.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">{p.gn}</span> <span className="text-muted-foreground">— {p.es}</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABEL[p.status].cls}`}>
              {STATUS_LABEL[p.status].label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {p.kind === "correccion" ? "Corrección" : "Palabra nueva"} · enviada {fmt(p.proposed_at)}
          </p>
          {(p.review_note || p.validation_note) && (
            <p className="mt-2 rounded-lg bg-muted p-2 text-sm">{p.validation_note || p.review_note}</p>
          )}
          {p.status === "devuelta" && <ResubmitForm proposal={p} />}
          <HistoryToggle id={p.id} />
        </li>
      ))}
    </ul>
  );
}

function ResubmitForm({ proposal }: { proposal: { id: string; gn: string; es: string; notes: string; source: string } }) {
  const qc = useQueryClient();
  const fn = useServerFn(resubmitProposal);
  const [gn, setGn] = useState(proposal.gn);
  const [es, setEs] = useState(proposal.es);
  const [notes, setNotes] = useState(proposal.notes);
  const m = useMutation({
    mutationFn: () => fn({ data: { id: proposal.id, gn, es, notes, source: proposal.source } }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success("Reenviada a revisión.");
      qc.invalidateQueries({ queryKey: ["my-proposals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={gn} onChange={(e) => setGn(e.target.value)} />
        <Input value={es} onChange={(e) => setEs(e.target.value)} />
      </div>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <Button size="sm" variant="outline" onClick={() => m.mutate()} disabled={m.isPending}>
        <RotateCcw className="mr-1 h-4 w-4" /> Corregir y reenviar
      </Button>
    </div>
  );
}

function HistoryToggle({ id }: { id: string }) {
  const fn = useServerFn(getProposalHistory);
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["proposal-history", id], queryFn: () => fn({ data: { id } }), enabled: open });
  return (
    <div className="mt-2">
      <button type="button" className="inline-flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => setOpen(!open)}>
        <History className="h-3.5 w-3.5" /> {open ? "Ocultar historial" : "Ver historial"}
      </button>
      {open && (
        <ol className="mt-2 space-y-1 border-l pl-3 text-xs text-muted-foreground">
          {(q.data?.history ?? []).map((h, i) => (
            <li key={i}>
              <strong className="text-foreground">{STEP_LABEL[h.paso] ?? h.paso}</strong>: {h.nombre}, {fmt(h.en)}
              {h.nota ? ` — «${h.nota}»` : ""}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------------------------- Errores señalados ---------------------------- */

const REPORT_TYPE_LABEL: Record<ContentReport["tipo"], string> = {
  escritura: "Escritura",
  significado: "Significado",
  audio: "Audio",
  otro: "Otra cosa",
};

/**
 * Avisos de «Señalar un error» que mandan docentes y usuarios desde las lecciones y el glosario.
 * Nada se corrige solo: si el aviso tiene razón, la corrección se propone en la pestaña Proponer.
 */
function ReportsInbox() {
  const qc = useQueryClient();
  const listFn = useServerFn(listContentReports);
  const setFn = useServerFn(setContentReportStatus);
  const q = useQuery({ queryKey: ["content-reports"], queryFn: () => listFn() });
  const mark = useMutation({
    mutationFn: (v: { id: string; estado: ReportStatus }) => setFn({ data: v }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      qc.invalidateQueries({ queryKey: ["content-reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-primary" />;
  const open = q.data?.open ?? [];
  const done = q.data?.done ?? [];
  const busy = mark.isPending ? mark.variables?.id : null;
  return (
    <div className="mt-4 space-y-6">
      <p className="text-sm text-muted-foreground">
        Avisos que llegan desde las lecciones y el glosario. Si el aviso tiene razón, proponé la corrección en la
        pestaña <strong>Proponer → Corregir una palabra</strong> y marcalo como resuelto: así sigue los tres pasos.
      </p>
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay avisos abiertos.</p>
      ) : (
        <ul className="space-y-3">
          {open.map((x) => (
            <li key={x.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{REPORT_TYPE_LABEL[x.tipo]}</Badge>
                <span className="text-xs text-muted-foreground">
                  {x.reporterName} · {x.lugar} · {fmt(x.created_at)}
                </span>
              </div>
              <p className="mt-2 text-lg">
                <strong>{x.word_gn}</strong>
                {x.word_es && <span className="text-muted-foreground"> — {x.word_es}</span>}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm">{x.mensaje}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => mark.mutate({ id: x.id, estado: "resuelto" })} disabled={busy === x.id}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Resuelto
                </Button>
                <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: x.id, estado: "descartado" })} disabled={busy === x.id}>
                  <XCircle className="mr-1 h-4 w-4" /> Descartar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">Últimos revisados</h3>
          <ul className="mt-2 divide-y rounded-xl border border-border/60">
            {done.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  <strong>{x.word_gn}</strong> · {REPORT_TYPE_LABEL[x.tipo]} ·{" "}
                  {x.estado === "resuelto" ? "Resuelto" : "Descartado"}
                  {x.reviewerName ? ` por ${x.reviewerName}` : ""}
                </span>
                <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: x.id, estado: "abierto" })} disabled={busy === x.id}>
                  <RotateCcw className="mr-1 h-4 w-4" /> Reabrir
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Revisar / Validar ---------------------------- */

/** Respuesta común de revisar y validar (validar puede avisar que hay que regrabar el audio). */
type DecideResult = { ok: true; audioWarning?: boolean } | { ok: false; error: string };

function Queue({ step }: { step: "revisar" | "validar" }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listQueue);
  const reviewFn = useServerFn(reviewProposal);
  const validateFn = useServerFn(validateProposal);
  const q = useQuery({ queryKey: ["circuit-queue", step], queryFn: () => listFn({ data: { step } }) });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = useMutation({
    mutationFn: async (v: { id: string; decision: "aprobar" | "devolver" | "rechazar" }): Promise<DecideResult> => {
      const payload = { data: { ...v, note: notes[v.id] ?? "" } };
      return step === "revisar" ? await reviewFn(payload) : await validateFn(payload);
    },
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success(step === "revisar" ? "Revisión registrada." : "Validación registrada.");
      if ("audioWarning" in d && d.audioWarning) toast.warning("Cambió la escritura: hay que volver a grabar el audio de esta palabra.");
      qc.invalidateQueries({ queryKey: ["circuit-queue"] });
    },
    onError: (e: Error) => toast.error(e.message.includes("motivo") ? "Escribí el motivo para devolver o no aceptar." : e.message),
  });

  if (q.isLoading) return <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-primary" />;
  const items = q.data?.items ?? [];
  if (!items.length) {
    return <p className="mt-6 text-sm text-muted-foreground">No hay propuestas para {step === "revisar" ? "revisar" : "validar"} ahora.</p>;
  }
  return (
    <ul className="mt-4 space-y-3">
      {items.map((p) => (
        <li key={p.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{p.kind === "correccion" ? "Corrección" : "Palabra nueva"}</Badge>
            <span className="text-xs text-muted-foreground">
              Propuso {p.proposerName} · {fmt(p.proposed_at)}
              {p.reviewerName ? ` · Revisó ${p.reviewerName} · ${fmt(p.reviewed_at)}` : ""}
            </span>
          </div>
          {p.current && (
            <p className="mt-2 text-sm text-muted-foreground">
              Hoy en el corpus: <strong>{p.current.gn}</strong> — {p.current.es}
            </p>
          )}
          <p className="mt-2 text-lg">
            <strong>{p.gn}</strong> <span className="text-muted-foreground">— {p.es}</span>
          </p>
          {p.notes && <p className="mt-1 text-sm">Notas: {p.notes}</p>}
          {p.source && <p className="text-sm text-muted-foreground">Fuente: {p.source}</p>}
          {p.review_note && <p className="mt-1 text-sm text-muted-foreground">Nota del revisor: {p.review_note}</p>}
          <Textarea
            className="mt-3"
            rows={2}
            placeholder="Nota (obligatoria para devolver o no aceptar)"
            value={notes[p.id] ?? ""}
            onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide.mutate({ id: p.id, decision: "aprobar" })} disabled={decide.isPending}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> {step === "revisar" ? "Aprobar revisión" : "Validar y publicar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: p.id, decision: "devolver" })} disabled={decide.isPending}>
              <RotateCcw className="mr-1 h-4 w-4" /> Devolver para corregir
            </Button>
            <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: p.id, decision: "rechazar" })} disabled={decide.isPending}>
              <XCircle className="mr-1 h-4 w-4" /> No aceptar
            </Button>
          </div>
          <HistoryToggle id={p.id} />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Revisores ------------------------------ */

type ReviewerRow = { userId: string; name: string; email: string; reviewed: number };

function Reviewers() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReviewers);
  const addFn = useServerFn(addReviewer);
  const removeFn = useServerFn(removeReviewer);
  const q = useQuery({ queryKey: ["reviewers"], queryFn: () => listFn() });
  const [email, setEmail] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { email } }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success("Revisor agregado.");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["reviewers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeFn({ data: { userId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviewers"] }),
  });
  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <p className="text-sm text-muted-foreground">
        Revisores avanzados: estudiantes avanzados o pasantes que hacen el segundo paso. Los docentes validadores
        se cargan en Corpus → Validación.
      </p>
      <div className="flex gap-2">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo de su cuenta en Jaikuaa" />
        <Button onClick={() => add.mutate()} disabled={!email.trim() || add.isPending}>
          <UserPlus className="mr-1 h-4 w-4" /> Agregar
        </Button>
      </div>
      <ul className="divide-y">
        {((q.data?.reviewers ?? []) as ReviewerRow[]).map((r) => (
          <li key={r.userId} className="flex items-center justify-between py-2 text-sm">
            <span>
              {r.name || r.email} <span className="text-muted-foreground">· {r.reviewed} revisadas</span>
            </span>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.userId)} aria-label="Quitar revisor">
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
