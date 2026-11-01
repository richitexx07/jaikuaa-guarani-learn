import { createFileRoute, Link } from "@tanstack/react-router";
import { GuaraniCharBar } from "@/components/guarani-char-bar";
import { WordAudioRecorder } from "@/components/corpus/word-audio-recorder";
import { ValidationPanel } from "@/components/corpus/validation-panel";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Mic,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Pencil,
  UserCheck,
  UserPlus,
  X,
  ArrowUp,
  ArrowDown,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PilotPageSettings } from "@/components/pilot-page-settings";
import { SponsorSettings } from "@/components/sponsor-settings";
import { CORPUS_CATEGORIES, type CorpusCategory } from "@/lib/corpus-categories";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  checkCorpusAdmin,
  commitCorpusImport,
  deleteCorpusWord,
  getCorpusOverview,
  getMecCapacities,
  listCorpusWords,
  publishLevel,
  previewCorpusImport as previewFn,
  refreshAudioCoverage,
  updateCorpusWord,
  listValidators,
  addValidator,
  removeValidator,
  listCohortMembers,
  setUserCohort,
  getPilotDashboard,
  listAdminLessons,
  saveLesson,
  setLessonStatus,
  deleteLesson,
  getLessonWords,
  addLessonWord,
  removeLessonWord,
  reorderLessonWords,
} from "@/lib/corpus.functions";

export const Route = createFileRoute("/_authenticated/admin/corpus")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Panel del corpus guaraní" },
      {
        name: "description",
        content:
          "Cargá, revisá y publicá el corpus de palabras y oraciones en guaraní por grado escolar.",
      },
      { property: "og:title", content: "Jaikuaa — Panel del corpus guaraní" },
      {
        property: "og:description",
        content: "Gestión del corpus de palabras y oraciones en guaraní por grado del MEC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Ocurrió un error</h1>
      <Button variant="cta" className="mt-4" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="font-display text-2xl font-bold">No encontrado</h1>
    </div>
  ),
  component: CorpusAdminPage,
});

type ParsedRow = {
  gn: string;
  es: string;
  levelId: string;
  unit: string;
  type: "palabra" | "oracion";
  notes: string;
};

function CorpusAdminPage() {
  const checkAdmin = useServerFn(checkCorpusAdmin);
  const adminQ = useQuery({ queryKey: ["corpus-admin"], queryFn: () => checkAdmin() });

  if (adminQ.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminQ.data?.canAccess) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Acceso restringido</h1>
        <p className="mt-2 text-muted-foreground">
          Este panel es solo para administradores y docentes validadores de Jaikuaa.
        </p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  return <CorpusAdminContent isAdmin={adminQ.data.isAdmin} />;
}

function CorpusAdminContent({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const overviewFn = useServerFn(getCorpusOverview);
  const refreshFn = useServerFn(refreshAudioCoverage);

  const overview = useQuery({ queryKey: ["corpus-overview"], queryFn: () => overviewFn() });

  const refresh = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: (r) => {
      toast.success(
        `Audio re-escaneado: ${r.audioFiles} archivos, ${r.changed} palabras actualizadas.`,
      );
      void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
      void qc.invalidateQueries({ queryKey: ["corpus-words"] });
    },
    onError: () => toast.error("No se pudo re-escanear el audio."),
  });

  const totals = overview.data?.totals;
  const levels = overview.data?.levels ?? [];

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← Volver al panel
        </Link>
        <Link
          to="/validacion"
          className="ml-4 text-sm font-semibold text-primary hover:underline"
        >
          Circuito de validación →
        </Link>
        <Link
          to="/cuaderno"
          className="ml-4 text-sm font-semibold text-primary hover:underline"
        >
          Abrir cuaderno digital →
        </Link>
        <Link to="/laboratorio" className="ml-4 text-sm font-semibold text-primary hover:underline">
          Laboratorio Morfológico →
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
          Corpus guaraní
        </h1>
        <p className="mt-1 text-muted-foreground">
          Una sola fuente de palabras para todos los grados. Las palabras nunca se duplican: se
          reusan entre niveles.
        </p>
      </div>

      <GuaraniCharBar />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Palabras únicas" value={totals?.words ?? 0} />
        <StatCard label="Con audio" value={totals?.withAudio ?? 0} accent />
        <StatCard label="Publicadas" value={totals?.published ?? 0} />
        <StatCard label="Oraciones" value={totals?.sentences ?? 0} />
      </div>

      {isAdmin && (
      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          {refresh.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Re-escanear audios
        </Button>
      </div>
      )}

      <Tabs
        defaultValue={
          isAdmin && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "tablero"
            ? "tablero"
            : isAdmin
              ? "importar"
              : "palabras"
        }
        className="mt-8"
      >
        <TabsList className="h-auto w-full flex-wrap">
          {isAdmin && (
            <TabsTrigger value="importar" className="flex-1">
              Importar Excel
            </TabsTrigger>
          )}
          <TabsTrigger value="cronograma" className="flex-1">
            Cronograma MEC
          </TabsTrigger>
          <TabsTrigger value="niveles" className="flex-1">
            Cobertura por grado
          </TabsTrigger>
          <TabsTrigger value="palabras" className="flex-1">
            Palabras
          </TabsTrigger>
          <TabsTrigger value="lecciones" className="flex-1">
            Lecciones
          </TabsTrigger>
          <TabsTrigger value="validacion" className="flex-1">
            Validación
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="docentes" className="flex-1">
              Docentes validadores
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="piloto" className="flex-1">
              Piloto
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="auspiciantes" className="flex-1">
              Auspiciantes
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="tablero" className="flex-1">
              Tablero
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="importar" className="mt-6">
            <ImportPanel levels={levels} />
          </TabsContent>
        )}
        <TabsContent value="cronograma" className="mt-6">
          <CronogramaPanel />
        </TabsContent>
        <TabsContent value="niveles" className="mt-6">
          <LevelsPanel levels={levels} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="palabras" className="mt-6">
          <WordsPanel levels={levels} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="lecciones" className="mt-6">
          <LessonsPanel levels={levels} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="validacion" className="mt-6">
          <ValidationPanel />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="docentes" className="mt-6">
            <ValidatorsPanel />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="piloto" className="mt-6">
            <PilotPanel />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="auspiciantes" className="mt-6">
            <SponsorSettings />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="tablero" className="mt-6">
            <DashboardPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className={`font-display text-2xl font-bold ${accent ? "text-accent" : "text-primary"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

type Level = {
  id: string;
  label: string;
  stage: string;
  words: number;
  withAudio: number;
  published: number;
  sentences: number;
};

/* ------------------------------ IMPORTAR ------------------------------ */

function ImportPanel({ levels }: { levels: Level[] }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [defaultLevel, setDefaultLevel] = useState<string>("");
  const [overwrite, setOverwrite] = useState(false);

  const preview = useServerFn(previewFn);
  const commit = useServerFn(commitCorpusImport);

  const previewM = useMutation({
    mutationFn: (r: ParsedRow[]) => preview({ data: { rows: r } }),
    onError: () => toast.error("No se pudo analizar el archivo."),
  });

  const commitM = useMutation({
    mutationFn: (r: ParsedRow[]) => commit({ data: { rows: r, overwriteTranslations: overwrite } }),
    onSuccess: (res) => {
      toast.success(
        `Guardado: ${res.created} palabras nuevas, ${res.reused} reusadas, ${res.sentences} oraciones.`,
      );
      setRows([]);
      setFileName("");
      previewM.reset();
      void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
      void qc.invalidateQueries({ queryKey: ["corpus-words"] });
    },
    onError: () => toast.error("No se pudo guardar la importación."),
  });

  const levelIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const lv of levels) {
      m.set(lv.id.toLowerCase(), lv.id);
      m.set(lv.label.toLowerCase(), lv.id);
      m.set(lv.label.toLowerCase().replace(/[°º]/g, ""), lv.id);
    }
    return m;
  }, [levels]);

  function resolveLevel(raw: unknown): string {
    const s = String(raw ?? "")
      .trim()
      .toLowerCase();
    if (!s) return defaultLevel;
    return levelIndex.get(s) ?? levelIndex.get(s.replace(/[°º]/g, "")) ?? defaultLevel;
  }

  async function handleFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const parsed: ParsedRow[] = [];
    for (const r of json) {
      const keys = Object.keys(r);
      const pick = (...names: string[]) => {
        for (const n of names) {
          const k = keys.find((kk) => kk.trim().toLowerCase() === n);
          if (k && String(r[k]).trim()) return String(r[k]).trim();
        }
        return "";
      };
      const gn = pick("guarani", "guaraní", "gn", "palabra");
      const es = pick("español", "espanol", "es", "castellano", "traduccion", "traducción");
      if (!gn || !es) continue;
      const tipoRaw = pick("tipo").toLowerCase();
      const type: "palabra" | "oracion" =
        tipoRaw.startsWith("or") || gn.trim().includes(" ") ? "oracion" : "palabra";
      parsed.push({
        gn,
        es,
        levelId: resolveLevel(pick("grado", "nivel", "curso")),
        unit:
          pick("capacidad", "codigo", "código", "capacity").toUpperCase() ||
          pick("unidad", "tema", "unit"),
        type: tipoRaw ? (tipoRaw.startsWith("or") ? "oracion" : "palabra") : type,
        notes: pick("notas", "observaciones"),
      });
    }

    const sinNivel = parsed.filter((p) => !p.levelId).length;
    if (sinNivel > 0) {
      toast.warning(
        `${sinNivel} filas sin grado. Elegí un grado por defecto y volvé a subir el archivo.`,
      );
    }
    setRows(parsed.filter((p) => p.levelId));
    setFileName(file.name);
    previewM.reset();
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        guarani: "Aguyje",
        español: "Gracias",
        grado: "1° grado",
        capacidad: "MEC-1G-01",
        unidad: "Saludos",
        tipo: "palabra",
        notas: "",
      },
      {
        guarani: "Che sy iporã",
        español: "Mi mamá es linda",
        grado: "3° grado",
        capacidad: "MEC-3G-01",
        unidad: "La familia",
        tipo: "oracion",
        notas: "",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "corpus");
    XLSX.writeFile(wb, "jaikuaa-plantilla-corpus.xlsx");
  }

  const p = previewM.data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">Cómo funciona</h2>
        <ol className="mt-2 space-y-1 text-sm text-foreground">
          <li>
            1. Preparás el Excel: guaraní · español · grado · capacidad (código MEC) · unidad ·
            tipo.
          </li>
          <li>2. Lo subís acá y ves cuántas palabras son nuevas y cuántas se reusan.</li>
          <li>3. Guardás. El sistema te dice exactamente qué audios faltan grabar.</li>
          <li>4. Publicás el grado cuando la cobertura de audio esté completa.</li>
        </ol>
        <Button variant="outline" size="sm" className="mt-4" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Descargar plantilla
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Grado por defecto
            </label>
            <Select value={defaultLevel} onValueChange={setDefaultLevel}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Elegí un grado" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((lv) => (
                  <SelectItem key={lv.id} value={lv.id}>
                    {lv.label} — {lv.stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Se usa cuando la fila del Excel no trae grado.
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <Button variant="cta" onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Elegir archivo Excel
            </Button>
            {fileName && (
              <p className="mt-2 text-xs text-muted-foreground">
                {fileName} · {rows.length} filas válidas
              </p>
            )}
          </div>
        </div>

        {rows.length > 0 && !p && (
          <Button
            className="mt-5 w-full"
            variant="outline"
            disabled={previewM.isPending}
            onClick={() => previewM.mutate(rows)}
          >
            {previewM.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Comparar contra el corpus
          </Button>
        )}
      </div>

      {p && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewBox
              tone="ok"
              title={`${p.reused.length} ya en el corpus`}
              subtitle="Se reusan · 0 audios nuevos"
              items={p.reused.map((r) => `${r.gn} — ${r.es}`)}
            />
            <PreviewBox
              tone="new"
              title={`${p.created.length} nuevas`}
              subtitle={`${p.audioToRecord.length} audios por grabar`}
              items={p.created.map((r) => `${r.gn} — ${r.es}${r.hasAudio ? " ✓ audio" : ""}`)}
            />
            <PreviewBox
              tone="warn"
              title={`${p.conflicts.length} conflictos`}
              subtitle="Misma palabra, traducción distinta"
              items={p.conflicts.map((c) => `${c.gn}: «${c.actual}» vs «${c.nuevo}»`)}
            />
          </div>

          {p.sentences.length > 0 && (
            <PreviewBox
              tone="ok"
              title={`${p.sentences.length} oraciones`}
              subtitle="Se arman con palabras del corpus"
              items={p.sentences.map(
                (s) =>
                  `${s.gn}${s.missingWords.length ? ` · faltan: ${s.missingWords.join(", ")}` : " ✓"}`,
              )}
            />
          )}

          {p.unknownCapacities.length > 0 && (
            <PreviewBox
              tone="warn"
              title={`${p.unknownCapacities.length} códigos de capacidad desconocidos`}
              subtitle="No existen en el cronograma oficial del MEC"
              items={p.unknownCapacities}
            />
          )}



          {p.audioToRecord.length > 0 && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <h3 className="flex items-center gap-2 font-display font-semibold text-accent">
                <Mic className="h-4 w-4" /> Audios a grabar ({p.audioToRecord.length})
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Nombres de archivo exactos para el bucket <code>guarani-audio</code>, MP3 mono 64
                kbps.
              </p>
              <div className="mt-3 max-h-40 overflow-auto rounded-lg bg-background p-3 font-mono text-xs leading-relaxed">
                {p.audioToRecord.join("\n")}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  void navigator.clipboard.writeText(p.audioToRecord.join("\n"));
                  toast.success("Lista copiada.");
                }}
              >
                Copiar lista
              </Button>
            </div>
          )}

          {p.conflicts.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              Sobrescribir las traducciones existentes con las del Excel
            </label>
          )}

          <Button
            variant="cta"
            size="lg"
            className="w-full"
            disabled={commitM.isPending}
            onClick={() => commitM.mutate(rows)}
          >
            {commitM.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Guardar en el corpus
          </Button>
        </div>
      )}
    </div>
  );
}

function PreviewBox({
  tone,
  title,
  subtitle,
  items,
}: {
  tone: "ok" | "new" | "warn";
  title: string;
  subtitle: string;
  items: string[];
}) {
  const styles = {
    ok: "border-primary/25 bg-primary/5 text-primary",
    new: "border-accent/25 bg-accent/5 text-accent",
    warn: "border-destructive/25 bg-destructive/5 text-destructive",
  }[tone];
  const Icon = tone === "warn" ? AlertTriangle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <h3 className="flex items-center gap-2 font-display text-sm font-bold">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <p className="mt-0.5 text-xs opacity-80">{subtitle}</p>
      {items.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-xs text-foreground">
          {items.map((it) => (
            <li key={it} className="truncate">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ NIVELES ------------------------------ */

function LevelsPanel({ levels, isAdmin }: { levels: Level[]; isAdmin: boolean }) {
  const qc = useQueryClient();
  const publish = useServerFn(publishLevel);
  const publishM = useMutation({
    mutationFn: (levelId: string) => publish({ data: { levelId } }),
    onSuccess: (r) => {
      toast.success(`${r.published} palabras publicadas.`);
      void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
    },
    onError: () => toast.error("No se pudo publicar el grado."),
  });

  return (
    <div className="space-y-2">
      {levels.map((lv) => {
        const pct = lv.words === 0 ? 0 : Math.round((lv.withAudio / lv.words) * 100);
        return (
          <div
            key={lv.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="min-w-[9rem]">
              <div className="font-display font-semibold text-foreground">{lv.label}</div>
              <div className="text-xs text-muted-foreground">{lv.stage}</div>
            </div>
            <div className="flex flex-1 flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{lv.words} palabras</Badge>
              <Badge variant="secondary">{lv.sentences} oraciones</Badge>
              <Badge variant={pct === 100 && lv.words > 0 ? "default" : "outline"}>
                {pct}% audio
              </Badge>
              <Badge variant="outline">{lv.published} publicadas</Badge>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                disabled={lv.words === 0 || publishM.isPending}
                onClick={() => publishM.mutate(lv.id)}
              >
                Publicar
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ PALABRAS ------------------------------ */

type NewWord = {
  gn: string;
  es: string;
  levelId: string;
  capacityCode: string;
  unit: string;
  type: "palabra" | "oracion";
  notes: string;
  category: string;
};
const EMPTY_WORD: NewWord = {
  gn: "",
  es: "",
  levelId: "",
  capacityCode: "",
  unit: "",
  type: "palabra",
  notes: "",
  category: "",
};

/** Alta de una palabra u oración reutilizando la importación del Excel con una sola fila. */
function NewWordForm({ levels, onSaved }: { levels: Level[]; onSaved: () => void }) {
  const preview = useServerFn(previewFn);
  const commit = useServerFn(commitCorpusImport);
  const capsFn = useServerFn(getMecCapacities);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<NewWord>(EMPTY_WORD);
  const [result, setResult] = useState<
    | { kind: "exists"; gn: string; es: string; conflict: string | null }
    | { kind: "created"; gn: string; audio: string | null }
    | { kind: "sentence"; gn: string; missing: string[] }
    | null
  >(null);
  const capsQ = useQuery({
    queryKey: ["mec-capacities"],
    queryFn: () => capsFn(),
    enabled: open,
  });
  const caps = capsQ.data?.capacities ?? [];

  const saveM = useMutation({
    mutationFn: async (v: NewWord) => {
      const notes = [v.capacityCode && v.unit.trim() ? `Unidad / tema: ${v.unit.trim()}` : "", v.notes.trim()]
        .filter(Boolean)
        .join(" · ");
      const row = {
        gn: v.gn.trim(),
        es: v.es.trim(),
        levelId: v.levelId,
        unit: v.capacityCode || v.unit.trim(),
        type: v.type,
        notes,
        category: (v.category || null) as CorpusCategory | null,
      };
      const p = await preview({ data: { rows: [row] } });
      if (v.type === "oracion") {
        await commit({ data: { rows: [row], overwriteTranslations: false } });
        return { kind: "sentence" as const, gn: row.gn, missing: p.sentences[0]?.missingWords ?? [] };
      }
      if (p.reused.length > 0) {
        const r = p.reused[0];
        return {
          kind: "exists" as const,
          gn: r.gn,
          es: r.es,
          conflict: p.conflicts[0]?.nuevo ?? null,
        };
      }
      await commit({ data: { rows: [row], overwriteTranslations: false } });
      const c = p.created[0];
      return { kind: "created" as const, gn: row.gn, audio: c && !c.hasAudio ? `${c.slug}.mp3` : null };
    },
    onSuccess: (r) => {
      setResult(r);
      if (r.kind !== "exists") {
        setF({ ...EMPTY_WORD, levelId: f.levelId, type: f.type });
        onSaved();
      }
    },
    onError: () => toast.error("No se pudo guardar."),
  });

  if (!open) {
    return (
      <Button variant="cta" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Nueva palabra
      </Button>
    );
  }

  const valid = f.gn.trim() && f.es.trim() && f.levelId;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">Nueva palabra</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Queda en borrador, pendiente de validación docente.
      </p>
      <form
        className="mt-3 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) saveM.mutate(f);
        }}
      >
        <Input value={f.gn} onChange={(e) => setF({ ...f, gn: e.target.value })} placeholder="Guaraní *" maxLength={500} />
        <Input value={f.es} onChange={(e) => setF({ ...f, es: e.target.value })} placeholder="Español *" maxLength={500} />
        <Select value={f.levelId || undefined} onValueChange={(v) => setF({ ...f, levelId: v, capacityCode: "" })}>
          <SelectTrigger>
            <SelectValue placeholder="Grado *" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((lv) => (
              <SelectItem key={lv.id} value={lv.id}>
                {lv.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={f.capacityCode || "none"}
          onValueChange={(v) => setF({ ...f, capacityCode: v === "none" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin capacidad MEC</SelectItem>
            {caps
              .filter((c) => !f.levelId || c.level_id === f.levelId)
              .map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="Unidad / tema (opcional)" maxLength={240} />
        <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as NewWord["type"] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="palabra">Palabra</SelectItem>
            <SelectItem value="oracion">Oración</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.category || "none"} onValueChange={(v) => setF({ ...f, category: v === "none" ? "" : v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin categoría temática</SelectItem>
            {CORPUS_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notas (opcional)" maxLength={1000} />
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="cta" disabled={!valid || saveM.isPending}>
            {saveM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); setResult(null); setF(EMPTY_WORD); }}>
            Cerrar
          </Button>
        </div>
      </form>
      {result?.kind === "exists" && (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Ya está en el corpus
          </p>
          <p className="mt-1">
            «{result.gn}» ya existe con la traducción «{result.es}». No se creó otra.
          </p>
          {result.conflict && (
            <p className="mt-1 text-muted-foreground">
              La traducción que escribiste («{result.conflict}») es distinta: si hay que corregirla, editala en la lista.
            </p>
          )}
        </div>
      )}
      {result?.kind === "created" && (
        <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> «{result.gn}» quedó en borrador
          </p>
          {result.audio ? (
            <p className="mt-1">
              Audio que falta grabar: <code className="break-all font-mono">{result.audio}</code>
            </p>
          ) : (
            <p className="mt-1">Ya hay un audio grabado con su nombre.</p>
          )}
        </div>
      )}
      {result?.kind === "sentence" && (
        <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Oración guardada
          </p>
          {result.missing.length > 0 && (
            <p className="mt-1">Palabras que todavía no están en el corpus: {result.missing.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function WordsPanel({ levels, isAdmin }: { levels: Level[]; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelId, setLevelId] = useState<string>("todos");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);
  const [category, setCategory] = useState<string>("todas");
  const [editing, setEditing] = useState<{
    id: string;
    es: string;
    notes: string;
    category: string;
  } | null>(null);

  const listFn = useServerFn(listCorpusWords);
  const updateFn = useServerFn(updateCorpusWord);
  const deleteFn = useServerFn(deleteCorpusWord);

  const wordsQ = useQuery({
    queryKey: ["corpus-words", search, levelId, onlyMissing, onlyPending, category],
    queryFn: () =>
      listFn({
        data: {
          search,
          levelId: levelId === "todos" ? undefined : levelId,
          onlyMissingAudio: onlyMissing,
          onlyPendingValidation: onlyPending,
          category:
            category === "todas" ? undefined : category === "sin" ? "none" : (category as CorpusCategory),
          limit: 300,
        },
      }),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["corpus-words"] });
    void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
  };

  const updateM = useMutation({
    mutationFn: (v: {
      id: string;
      status?: "draft" | "published";
      es?: string;
      notes?: string;
      category?: CorpusCategory | null;
    }) => updateFn({ data: v }),
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
    onError: () => toast.error("No se pudo actualizar."),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Palabra eliminada.");
      invalidate();
    },
    onError: () => toast.error("No se pudo eliminar."),
  });

  const words = wordsQ.data?.words ?? [];

  return (
    <div className="space-y-4">
      <NewWordForm levels={levels} onSaved={invalidate} />
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en guaraní o español…"
            className="pl-9"
          />
        </div>
        <Select value={levelId} onValueChange={setLevelId}>
          <SelectTrigger className="w-[11rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los grados</SelectItem>
            {levels.map((lv) => (
              <SelectItem key={lv.id} value={lv.id}>
                {lv.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[13rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            <SelectItem value="sin">Sin categoría</SelectItem>
            {CORPUS_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={onlyMissing ? "cta" : "outline"} onClick={() => setOnlyMissing((v) => !v)}>
          <Mic className="mr-2 h-4 w-4" />
          Sin audio
        </Button>
        <Button variant={onlyPending ? "cta" : "outline"} onClick={() => setOnlyPending((v) => !v)}>
          <UserCheck className="mr-2 h-4 w-4" />
          Pendientes de validación docente
        </Button>
      </div>

      {wordsQ.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : words.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No hay palabras con esos filtros.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          {words.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center gap-3 border-b border-border/40 bg-card p-3 last:border-0"
            >
              <div className="min-w-[10rem] flex-1">
                <div className="font-display font-semibold text-foreground">{w.gn}</div>
                {editing?.id === w.id ? (
                  <div className="mt-2 space-y-2">
                    <Input
                      value={editing.es}
                      onChange={(e) => setEditing({ ...editing, es: e.target.value })}
                      placeholder="Traducción al español"
                      maxLength={500}
                    />
                    <Input
                      value={editing.notes}
                      onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                      placeholder="Notas"
                      maxLength={1000}
                    />
                    <Select
                      value={editing.category || "none"}
                      onValueChange={(v) => setEditing({ ...editing, category: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría temática</SelectItem>
                        {CORPUS_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="cta"
                        disabled={!editing.es.trim() || updateM.isPending}
                        onClick={() =>
                          updateM.mutate({
                            id: w.id,
                            es: editing.es.trim(),
                            notes: editing.notes,
                            category: (editing.category || null) as CorpusCategory | null,
                          })
                        }
                      >
                        Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">{w.es}</div>
                    {w.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {w.category}
                      </Badge>
                    )}
                    {w.notes && <div className="text-xs text-muted-foreground/80">{w.notes}</div>}
                  </>
                )}
                {w.status === "published" &&
                  (w.validated_by ? (
                    <div className="mt-1 text-xs text-primary">
                      Validado por {w.validatorName}
                      {w.validated_at &&
                        ` · ${new Date(w.validated_at).toLocaleDateString("es-PY")}`}
                    </div>
                  ) : (
                    <Badge variant="outline" className="mt-1 border-amber-400 text-amber-700">
                      Sin validación docente
                    </Badge>
                  ))}
              </div>
              <code className="text-xs text-muted-foreground">{w.audio_slug}.mp3</code>
              <Badge variant={w.has_audio ? "default" : "outline"}>
                {w.has_audio ? "audio ✓" : "sin audio"}
              </Badge>
              <WordAudioRecorder
                wordId={w.id}
                slug={w.audio_slug}
                hasAudio={w.has_audio}
                onSaved={() => {
                  void qc.invalidateQueries({ queryKey: ["corpus-words"] });
                  void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
                }}
              />
              <Button
                size="sm"
                variant={w.status === "published" ? "secondary" : "outline"}
                onClick={() =>
                  updateM.mutate({
                    id: w.id,
                    status: w.status === "published" ? "draft" : "published",
                  })
                }
              >
                {w.status === "published" ? "Publicada" : "Borrador"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Editar ${w.gn}`}
                onClick={() =>
                  setEditing({ id: w.id, es: w.es, notes: w.notes ?? "", category: w.category ?? "" })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Eliminar ${w.gn}`}
                  onClick={() => deleteM.mutate(w.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- CRONOGRAMA MEC ---------------------------- */

function CronogramaPanel() {
  const capsFn = useServerFn(getMecCapacities);
  const q = useQuery({ queryKey: ["mec-capacities"], queryFn: () => capsFn() });

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const levels = q.data?.levels ?? [];
  const caps = q.data?.capacities ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">
          Cronograma oficial del MEC
        </h2>
        <p className="mt-1 text-sm text-foreground">
          {caps.length} capacidades desde 1° grado hasta 3er curso. Usá el código de cada capacidad
          (ej. <code>MEC-2G-01</code>) en la columna <strong>capacidad</strong> del Excel para que
          las palabras y oraciones queden atadas al currículum.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">
            {caps.reduce((a, c) => a + c.words, 0)} palabras ligadas a capacidades
          </Badge>
          {q.data?.freeUnits.length ? (
            <Badge variant="outline">{q.data.freeUnits.length} unidades libres (sin código)</Badge>
          ) : null}
        </div>
      </div>

      {levels.map((lv) => {
        const list = caps.filter((c) => c.level_id === lv.id);
        if (list.length === 0) return null;
        return (
          <div key={lv.id}>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {lv.label} · {lv.stage}
            </h3>
            <div className="mt-2 space-y-2">
              {list.map((c) => (
                <div
                  key={c.code}
                  className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {c.code}
                    </code>
                    <Badge variant="outline" className="text-xs">
                      {c.axis}
                    </Badge>
                    <Badge variant={c.words > 0 ? "default" : "secondary"} className="text-xs">
                      {c.words} palabras
                    </Badge>
                  </div>
                  <p className="mt-2 font-display text-sm font-semibold text-foreground">
                    {c.capacity_gn}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.contents_es}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------- DOCENTES VALIDADORES ------------------------- */

function ValidatorsPanel() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [withPilot, setWithPilot] = useState(true);
  const listFn = useServerFn(listValidators);
  const addFn = useServerFn(addValidator);
  const removeFn = useServerFn(removeValidator);
  const q = useQuery({ queryKey: ["corpus-validators"], queryFn: () => listFn() });

  const addM = useMutation({
    mutationFn: (e: string) =>
      addFn({ data: { email: e, cohort: withPilot ? PILOT_COHORT : null } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Docente validador agregado.");
      setEmail("");
      void qc.invalidateQueries({ queryKey: ["corpus-validators"] });
      void qc.invalidateQueries({ queryKey: ["pilot-members"] });
    },
    onError: () => toast.error("Email inválido o no se pudo agregar."),
  });
  const removeM = useMutation({
    mutationFn: (userId: string) => removeFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Rol de docente quitado.");
      void qc.invalidateQueries({ queryKey: ["corpus-validators"] });
    },
    onError: () => toast.error("No se pudo quitar el rol."),
  });

  const list = q.data?.validators ?? [];

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) addM.mutate(email.trim());
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email del docente"
          className="min-w-[14rem] flex-1"
          maxLength={255}
        />
        <Button type="submit" variant="cta" disabled={addM.isPending || !email.trim()}>
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar docente
        </Button>
        <label className="flex w-full items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={withPilot}
            onChange={(e) => setWithPilot(e.target.checked)}
          />
          Asignarle también el grupo "{PILOT_COHORT}"
        </label>
      </form>
      {q.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Todavía no hay docentes validadores.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          {list.map((v) => (
            <div
              key={v.userId}
              className="flex flex-wrap items-center gap-3 border-b border-border/40 bg-card p-3 last:border-0"
            >
              <div className="min-w-[10rem] flex-1">
                <div className="font-display font-semibold text-foreground">
                  {v.name || "Sin nombre"}
                </div>
                <div className="text-sm text-muted-foreground">{v.email}</div>
              </div>
              <Badge variant="secondary">{v.validated} palabras validadas</Badge>
              <Button
                size="sm"
                variant="ghost"
                disabled={removeM.isPending}
                onClick={() => removeM.mutate(v.userId)}
              >
                <X className="mr-1 h-4 w-4 text-destructive" />
                Quitar rol
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PILOT_COHORT = "Piloto Ateneo";

/* -------------------------------- PILOTO -------------------------------- */

function PilotPanel() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [cohort, setCohort] = useState(PILOT_COHORT);
  const listFn = useServerFn(listCohortMembers);
  const setFn = useServerFn(setUserCohort);
  const q = useQuery({ queryKey: ["pilot-members"], queryFn: () => listFn() });
  const setM = useMutation({
    mutationFn: (v: { email: string; cohort: string | null }) => setFn({ data: v }),
    onSuccess: (r, v) => {
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(v.cohort ? `Asignado a "${v.cohort}".` : "Grupo quitado.");
      if (v.cohort) setEmail("");
      void qc.invalidateQueries({ queryKey: ["pilot-members"] });
      void qc.invalidateQueries({ queryKey: ["pilot-dashboard"] });
    },
    onError: () => toast.error("Email inválido o no se pudo guardar."),
  });
  const members = q.data?.members ?? [];

  return (
    <div className="space-y-4">
      <PilotPageSettings />
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim() && cohort.trim())
            setM.mutate({ email: email.trim(), cohort: cohort.trim() });
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email del usuario"
          className="min-w-[14rem] flex-1"
          maxLength={255}
        />
        <Input
          value={cohort}
          onChange={(e) => setCohort(e.target.value)}
          placeholder="Grupo"
          className="w-[12rem]"
          maxLength={60}
        />
        <Button type="submit" variant="cta" disabled={setM.isPending || !email.trim() || !cohort.trim()}>
          Asignar grupo
        </Button>
      </form>
      {q.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : members.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Todavía no hay usuarios con grupo asignado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex flex-wrap items-center gap-3 border-b border-border/40 bg-card p-3 last:border-0"
            >
              <div className="min-w-[10rem] flex-1">
                <div className="font-display font-semibold text-foreground">{m.name || "Sin nombre"}</div>
                <div className="text-sm text-muted-foreground">{m.email}</div>
              </div>
              <Badge variant="secondary">{m.cohort}</Badge>
              <Button
                size="sm"
                variant="ghost"
                disabled={setM.isPending || !m.email}
                onClick={() => setM.mutate({ email: m.email, cohort: null })}
              >
                <X className="mr-1 h-4 w-4 text-destructive" />
                Quitar grupo
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- TABLERO -------------------------------- */

function DashboardPanel() {
  const [cohort, setCohort] = useState<string>("todos");
  const [period, setPeriod] = useState<"7" | "30" | "all">("30");
  const membersFn = useServerFn(listCohortMembers);
  const dashFn = useServerFn(getPilotDashboard);
  const cohortsQ = useQuery({ queryKey: ["pilot-members"], queryFn: () => membersFn() });
  const q = useQuery({
    queryKey: ["pilot-dashboard", cohort, period],
    queryFn: () => dashFn({ data: { cohort: cohort === "todos" ? null : cohort, period } }),
  });
  const d = q.data;
  const maxActive = Math.max(1, ...(d?.series ?? []).map((x) => x.active));

  function downloadCsv() {
    if (!d) return;
    const header = "fecha,activos,nuevos,lecciones,pruebas,partidas_juegos,xp,palabras_validadas";
    const lines = d.series.map((x) =>
      [x.date, x.active, x.newUsers, x.lessons, x.exams, x.games, x.xp, x.validated].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jaikuaa-tablero-${cohort === "todos" ? "todos" : cohort.replace(/\s+/g, "-")}-${d.startDay}_${d.today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={cohort} onValueChange={setCohort}>
          <SelectTrigger className="w-[12rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {(cohortsQ.data?.cohorts ?? []).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => setPeriod(v as "7" | "30" | "all")}>
          <SelectTrigger className="w-[12rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="all">Desde el inicio</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="ml-auto" disabled={!d} onClick={downloadCsv}>
          <Download className="mr-2 h-4 w-4" />
          Descargar CSV
        </Button>
      </div>

      {q.isLoading || !d ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Período: {d.startDay} al {d.today} (hora de Paraguay)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Usuarios registrados" value={d.registered} />
            <StatCard label="Nuevos en el período" value={d.newUsers} />
            <StatCard label="Activos en el período" value={d.activeUsers} accent />
            <StatCard label="Activos últimos 7 días" value={d.active7} accent />
            <StatCard label="Lecciones completadas" value={d.lessons} />
            <StatCard label="Pruebas completadas" value={d.exams} />
            <StatCard label="Partidas de juegos" value={d.games} />
            <StatCard label="XP total ganado" value={d.xp} />
            <StatCard label="Docentes validadores activos" value={d.activeValidators} />
            <StatCard label="Palabras validadas en el período" value={d.validatedInPeriod} />
            <StatCard label="Palabras con validación docente" value={d.validatedTotal} />
            <StatCard label="Pendientes de validación" value={d.pendingValidation} />
          </div>

          <SourcesCard sources={d.sources} />

          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 font-display font-semibold text-foreground">
              Usuarios activos por día
            </div>
            <div className="flex h-40 items-end gap-px overflow-x-auto">
              {d.series.map((x) => (
                <div
                  key={x.date}
                  title={`${x.date}: ${x.active}`}
                  className="min-w-[4px] flex-1 rounded-t bg-primary/80"
                  style={{ height: `${(x.active / maxActive) * 100}%`, minHeight: x.active ? 2 : 0 }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{d.startDay}</span>
              <span>máx. {Math.max(0, ...d.series.map((x) => x.active))}</span>
              <span>{d.today}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Enlaces con origen para compartir y cuántos se registraron desde cada lugar. */
const SHARE_PLACES = [
  ["facebook", "Facebook"],
  ["whatsapp", "WhatsApp"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
] as const;

function SourcesCard({ sources }: { sources: { source: string; count: number }[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const total = sources.reduce((a, x) => a + x.count, 0);
  const max = Math.max(1, ...sources.map((x) => x.count));
  async function copy(place: string) {
    const url = `https://www.jaikuaa.com/?de=${place}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(place);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copiá este enlace:", url);
    }
  }
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="font-display font-semibold text-foreground">¿De dónde llegaron los nuevos?</div>
      <p className="mt-1 text-xs text-muted-foreground">
        Se cuenta desde el 1/11/2026. «directo»: entraron sin enlace con origen. «sin dato»: cuentas de antes.
      </p>
      {total === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Todavía no hay registros nuevos en el período.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {sources.map((x) => (
            <li key={x.source} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 truncate font-medium">{x.source}</span>
              <span className="h-3 rounded bg-primary/80" style={{ width: `${(x.count / max) * 60}%`, minWidth: 4 }} />
              <span className="tabular-nums text-muted-foreground">{x.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 border-t border-border/60 pt-3">
        <p className="text-sm font-medium">Enlaces para compartir (cada uno cuenta por separado)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SHARE_PLACES.map(([place, label]) => (
            <Button key={place} type="button" variant="outline" size="sm" onClick={() => void copy(place)}>
              {copied === place ? "¡Copiado!" : `Copiar enlace de ${label}`}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Ejemplo: https://www.jaikuaa.com/?de=facebook</p>
      </div>
    </div>
  );
}

/* ------------------------------ LECCIONES ------------------------------ */

type LessonForm = {
  id: string | null;
  sortOrder: string;
  title: string;
  theme: string;
  levelId: string;
  capacityCode: string;
};

function LessonsPanel({ levels, isAdmin }: { levels: Level[]; isAdmin: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminLessons);
  const saveFn = useServerFn(saveLesson);
  const statusFn = useServerFn(setLessonStatus);
  const deleteFn = useServerFn(deleteLesson);
  const capsFn = useServerFn(getMecCapacities);
  const q = useQuery({ queryKey: ["admin-lessons"], queryFn: () => listFn() });
  const capsQ = useQuery({ queryKey: ["mec-capacities"], queryFn: () => capsFn() });
  const [form, setForm] = useState<LessonForm | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    void qc.invalidateQueries({ queryKey: ["course-lessons"] });
  };
  const saveM = useMutation({
    mutationFn: (f: LessonForm) =>
      saveFn({
        data: {
          id: f.id,
          sortOrder: Number(f.sortOrder),
          title: f.title,
          theme: f.theme,
          levelId: f.levelId || null,
          capacityCode: f.capacityCode || null,
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Lección guardada.");
      setForm(null);
      invalidate();
    },
    onError: () => toast.error("No se pudo guardar la lección."),
  });
  const statusM = useMutation({
    mutationFn: (v: { id: string; status: "draft" | "published" }) => statusFn({ data: v }),
    onSuccess: invalidate,
    onError: () => toast.error("No se pudo cambiar el estado."),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Lección eliminada.");
      invalidate();
    },
    onError: () => toast.error("No se pudo eliminar."),
  });

  const lessons = q.data?.lessons ?? [];
  const caps = capsQ.data?.capacities ?? [];
  const nextOrder = String((lessons.at(-1)?.sort_order ?? 0) + 1);

  return (
    <div className="space-y-4">
      {isAdmin && !form && (
        <Button
          variant="cta"
          onClick={() =>
            setForm({ id: null, sortOrder: nextOrder, title: "", theme: "", levelId: "", capacityCode: "" })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva lección
        </Button>
      )}

      {isAdmin && form && (
        <form
          className="grid gap-2 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim() && Number(form.sortOrder) >= 1) saveM.mutate(form);
          }}
        >
          <Input
            type="number"
            min={1}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            placeholder="Orden"
          />
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Título"
            maxLength={120}
          />
          <Input
            className="sm:col-span-2"
            value={form.theme}
            onChange={(e) => setForm({ ...form, theme: e.target.value })}
            placeholder="Tema"
            maxLength={240}
          />
          <Select
            value={form.levelId || "none"}
            onValueChange={(v) => setForm({ ...form, levelId: v === "none" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin nivel</SelectItem>
              {levels.map((lv) => (
                <SelectItem key={lv.id} value={lv.id}>
                  {lv.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.capacityCode || "none"}
            onValueChange={(v) => setForm({ ...form, capacityCode: v === "none" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin capacidad MEC</SelectItem>
              {caps
                .filter((c) => !form.levelId || c.level_id === form.levelId)
                .map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="cta" disabled={saveM.isPending || !form.title.trim()}>
              Guardar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {q.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : lessons.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay lecciones.</p>
      ) : (
        <div className="space-y-2">
          {lessons.map((l) => (
            <div key={l.id} className="rounded-xl border border-border/60 bg-card shadow-sm">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-[10rem] flex-1">
                  <div className="font-display font-semibold text-foreground">
                    {l.sort_order}. {l.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {l.theme}
                    {l.level_id ? ` · ${l.level_id}` : ""}
                    {l.capacity_code ? ` · ${l.capacity_code}` : ""}
                  </div>
                </div>
                <Badge variant={l.status === "published" ? "default" : "outline"}>
                  {l.status === "published" ? "Publicada" : "Borrador"}
                </Badge>
                <Badge variant="secondary">{l.published} publicadas</Badge>
                <Badge variant="outline">{l.drafts} en borrador</Badge>
                <Button size="sm" variant="outline" onClick={() => setOpenId(openId === l.id ? null : l.id)}>
                  {openId === l.id ? "Cerrar" : "Palabras"}
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          id: l.id,
                          sortOrder: String(l.sort_order),
                          title: l.title,
                          theme: l.theme,
                          levelId: l.level_id ?? "",
                          capacityCode: l.capacity_code ?? "",
                        })
                      }
                      aria-label={`Editar lección ${l.sort_order}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={statusM.isPending}
                      onClick={() =>
                        statusM.mutate({
                          id: l.id,
                          status: l.status === "published" ? "draft" : "published",
                        })
                      }
                    >
                      {l.status === "published" ? "Pasar a borrador" : "Publicar"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar lección ${l.sort_order}`}
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la lección "${l.title}"? Las palabras siguen en el corpus.`))
                          deleteM.mutate(l.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
              {openId === l.id && <LessonWordsEditor lessonId={l.id} onChanged={invalidate} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonWordsEditor({ lessonId, onChanged }: { lessonId: string; onChanged: () => void }) {
  const qc = useQueryClient();
  const wordsFn = useServerFn(getLessonWords);
  const addFn = useServerFn(addLessonWord);
  const removeFn = useServerFn(removeLessonWord);
  const reorderFn = useServerFn(reorderLessonWords);
  const updateFn = useServerFn(updateCorpusWord);
  const searchFn = useServerFn(listCorpusWords);
  const [search, setSearch] = useState("");
  const [onlyDrafts, setOnlyDrafts] = useState(false);

  const key = ["lesson-words", lessonId];
  const q = useQuery({ queryKey: key, queryFn: () => wordsFn({ data: { lessonId } }) });
  const searchQ = useQuery({
    queryKey: ["lesson-word-search", search],
    queryFn: () => searchFn({ data: { search, limit: 20 } }),
    enabled: search.trim().length >= 2,
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["corpus-words"] });
    void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
    onChanged();
  };
  const addM = useMutation({
    mutationFn: (wordId: string) => addFn({ data: { lessonId, wordId } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      refresh();
    },
    onError: () => toast.error("No se pudo agregar."),
  });
  const removeM = useMutation({
    mutationFn: (linkId: string) => removeFn({ data: { linkId } }),
    onSuccess: refresh,
    onError: () => toast.error("No se pudo quitar."),
  });
  const reorderM = useMutation({
    mutationFn: (linkIds: string[]) => reorderFn({ data: { lessonId, linkIds } }),
    onSuccess: refresh,
    onError: () => toast.error("No se pudo reordenar."),
  });
  const validateM = useMutation({
    mutationFn: (id: string) => updateFn({ data: { id, status: "published" } }),
    onSuccess: () => {
      toast.success("Palabra validada y publicada.");
      refresh();
    },
    onError: () => toast.error("No se pudo validar."),
  });

  const words = q.data?.words ?? [];
  const shown = onlyDrafts ? words.filter((w) => w.status !== "published") : words;
  const drafts = words.filter((w) => w.status !== "published").length;
  const inLesson = new Set(words.map((w) => w.wordId));

  function move(idx: number, dir: -1 | 1) {
    const ids = words.map((w) => w.linkId);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    reorderM.mutate(ids);
  }

  return (
    <div className="space-y-3 border-t border-border/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar palabra del corpus para agregar…"
            className="pl-9"
          />
        </div>
        <Button
          size="sm"
          variant={onlyDrafts ? "cta" : "outline"}
          onClick={() => setOnlyDrafts((v) => !v)}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Validar borradores ({drafts})
        </Button>
      </div>

      {search.trim().length >= 2 && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border/40">
          {(searchQ.data?.words ?? []).map((w) => (
            <div key={w.id} className="flex items-center gap-2 border-b border-border/30 p-2 text-sm last:border-0">
              <div className="flex-1">
                <span className="font-semibold text-foreground">{w.gn}</span>{" "}
                <span className="text-muted-foreground">· {w.es}</span>
              </div>
              <Badge variant="outline">{w.status === "published" ? "publicada" : "borrador"}</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={inLesson.has(w.id) || addM.isPending}
                onClick={() => addM.mutate(w.id)}
              >
                {inLesson.has(w.id) ? "Ya está" : "Agregar"}
              </Button>
            </div>
          ))}
          {searchQ.data && searchQ.data.words.length === 0 && (
            <p className="p-3 text-center text-xs text-muted-foreground">Sin resultados en el corpus.</p>
          )}
        </div>
      )}

      {q.isLoading ? (
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
      ) : shown.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {onlyDrafts ? "No hay palabras en borrador en esta lección." : "Esta lección no tiene palabras."}
        </p>
      ) : (
        <ol className="space-y-1">
          {shown.map((w) => {
            const idx = words.findIndex((x) => x.linkId === w.linkId);
            return (
              <li key={w.linkId} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2 text-sm">
                <span className="w-6 text-xs text-muted-foreground">{idx + 1}</span>
                <div className="min-w-[8rem] flex-1">
                  <span className="font-semibold text-foreground">{w.gn}</span>{" "}
                  <span className="text-muted-foreground">· {w.es}</span>
                </div>
                <Badge variant={w.status === "published" ? "default" : "outline"}>
                  {w.status === "published" ? "publicada" : "borrador"}
                </Badge>
                {!w.has_audio && <Badge variant="outline">sin audio</Badge>}
                {w.status !== "published" && (
                  <Button size="sm" variant="cta" disabled={validateM.isPending} onClick={() => validateM.mutate(w.wordId)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Validar
                  </Button>
                )}
                {!onlyDrafts && (
                  <>
                    <Button size="icon" variant="ghost" aria-label="Subir" disabled={idx === 0 || reorderM.isPending} onClick={() => move(idx, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Bajar" disabled={idx === words.length - 1 || reorderM.isPending} onClick={() => move(idx, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button size="icon" variant="ghost" aria-label={`Quitar ${w.gn}`} disabled={removeM.isPending} onClick={() => removeM.mutate(w.linkId)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
