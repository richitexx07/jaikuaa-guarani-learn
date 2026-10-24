import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, CheckCircle2, FlaskConical, Info, Library, ScrollText, Search, ShieldAlert } from "lucide-react";
import { PrivateGate } from "@/components/private-gate";
import { ValidationNotice } from "@/components/validation-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { analyze, normalizeWord, type Analysis, type AnalysisParadigm } from "@/lib/morph/analyzer";
import type { Person } from "@/lib/morph/academia-rules";
import { buildCorpusIndex, rankByAttestation, type Attestation } from "@/lib/morph/corpus-index";
import { checkWord, type OrthographyIssue } from "@/lib/morph/orthography";
import { CLOSED_CLASS_LABEL, lookupClosed } from "@/lib/morph/closed-classes";
import { analyzeNominal, type NominalAnalysis } from "@/lib/morph/nominal-analyzer";
import { getAlanMotorReadings, getLabBook, getLabCorpus, getLabDictionary, getLabWiktionary } from "@/lib/laboratorio.functions";
import { matchesLab, type LabReadingKey, type MotorToken } from "@/lib/morph/motor-contract";
import { buildSplIndex, posLabel, splUrl, type SplIndex } from "@/lib/morph/spl-dictionary";
import { buildWiktionaryIndex, FORM_OF_LABEL, POS_LABEL, type WiktionaryHit, type WiktionaryIndex } from "@/lib/morph/wikcionario";
import { buildBookIndex, type BookIndex } from "@/lib/morph/book-lexicon";
import { buildCalcoIndex, type CalcoIndex } from "@/lib/morph/calcos";
import { checkText } from "@/lib/morph/orthography";
import {
  analyzeText,
  buildBookRootIndex,
  MAX_TEXT_WORDS,
  type BookRootIndex,
  type Evidence,
  type RootSource,
  type TextSources,
  type WordStatus,
} from "@/lib/morph/text-analyzer";

/**
 * Laboratorio Morfológico (privado, solo admin).
 * Muestra lo que devuelve analyze(): no genera, traduce ni corrige guaraní.
 * Toda forma queda "pendiente de validación" hasta que la apruebe un especialista.
 */
export const Route = createFileRoute("/_authenticated/laboratorio")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Laboratorio Morfológico Guaraní" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Espacio de trabajo lingüístico de Jaikuaa para analizar resultados y realizar revisión especializada." },
      { property: "og:title", content: "Jaikuaa — Laboratorio Morfológico Guaraní" },
      { property: "og:description", content: "Espacio de trabajo lingüístico de Jaikuaa para analizar resultados y realizar revisión especializada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PrivateGate>
      <LaboratorioPage />
    </PrivateGate>
  ),
});

const BOOK = "Guarani Ñe'ẽ Rerekuapavẽ (2020)";

/** Caracteres del alfabeto oficial que no están en el teclado común (pág. 33). */
const SPECIAL_CHARS = ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ", "ñ", "g̃", "'"] as const;

/** Formas tomadas literalmente del libro, con la página donde aparecen. */
const BOOK_EXAMPLES: { word: string; page: number; note: string }[] = [
  { word: "aguapy", page: 103, note: "areal, 1.ª sing., oral" },
  { word: "ñamaña", page: 103, note: "areal, 1.ª pl. incl., nasal" },
  { word: "ndojapói", page: 25, note: "negación oral nd- … -i" },
  { word: "noñaníri", page: 25, note: "negación nasal n- … -ri" },
  { word: "aipota", page: 105, note: "aireal" },
  { word: "ha'a", page: 105, note: "hareal, con puso" },
  { word: "aguapyse", page: 139, note: "modo volitivo -se" },
  { word: "akarúkuri", page: 129, note: "pretérito reciente -kuri" },
  { word: "ndojeporuva'erãi", page: 184, note: "negación con futuro obligatorio" },
  { word: "amboguata", page: 119, note: "voz coactiva mbo-" },
  { word: "ajapouka", page: 145, note: "modo mediativo -uka" },
  { word: "tapytáke", page: 167, note: "imperativo conminativo -ke" },
  { word: "amba'apove", page: 175, note: "grado comparativo -ve" },
  { word: "iporã", page: 93, note: "predicativo i-" },
  { word: "chejuhu", page: 103, note: "pronominal (objeto che-)" },
  { word: "oho", page: 97, note: "lexema variable «ho»" },
  { word: "rógakuéra", page: 83, note: "triforme óga + plural -kuéra" },
  { word: "iñakãngue", page: 59, note: "posesivo iñ- + preteritiva -ngue" },
  { word: "ndajajuhúi", page: 115, note: "negación con vocal eufónica" },
];

/** Cuántas lecturas se muestran antes de "Ver las demás". */
const VISIBLE_READINGS = 3;

const PERSON_LABEL: Record<Person, { label: string; pronoun: string }> = {
  "1sg": { label: "1.ª persona singular", pronoun: "Che" },
  "2sg": { label: "2.ª persona singular", pronoun: "Nde" },
  "3": { label: "3.ª persona (singular y plural)", pronoun: "Ha'e / Ha'ekuéra" },
  "1pl_incl": { label: "1.ª persona plural inclusiva", pronoun: "Ñande" },
  "1pl_excl": { label: "1.ª persona plural exclusiva", pronoun: "Ore" },
  "2pl": { label: "2.ª persona plural", pronoun: "Peẽ" },
};

const PARADIGM_LABEL: Record<AnalysisParadigm, string> = {
  areal: "Areal (regular)",
  aireal: "Aireal (regular, 1.ª conjugación)",
  hareal: "Hareal (regular, 2.ª conjugación)",
  imperativo: "Imperativo / optativo (pág. 165)",
  predicativo: "Predicativo: sustantivo, adjetivo o adverbio conjugado (págs. 93 y 101)",
  pronominal: "Pronominal: la persona es el objeto de la acción (pág. 103)",
  irregular: "Lexema variable (pág. 97)",
};

type Block = { kind: "neg" | "person" | "voice" | "root" | "suffix"; text: string; label: string };

/** Arma los bloques a partir de lo que devolvió el analizador; no agrega letras propias. */
function toBlocks(a: Analysis): Block[] {
  const word = normalizeWord(a.word);
  const core = a.prefix + a.voices.map((v) => v.form).join("") + a.root + a.suffixes.map((x) => x.form).join("");
  const start = word.indexOf(core);
  const blocks: Block[] = [];
  if (a.negated && start > 0) blocks.push({ kind: "neg", text: word.slice(0, start), label: "Negación (prefijo)" });
  if (a.prefix) {
    const personLabel = a.paradigm === "imperativo" ? "Persona (imperativo)" : a.paradigm === "pronominal" ? "Persona (objeto)" : "Persona";
    blocks.push({ kind: "person", text: a.prefix, label: personLabel });
  }
  for (const v of a.voices) blocks.push({ kind: "voice", text: v.form, label: `${v.meaning} · pág. ${v.page}` });
  blocks.push({
    kind: "root",
    text: a.root,
    label: a.lexeme
      ? `Forma de «${a.lexeme.form}» (${a.lexeme.meaning}) · pág. ${a.lexeme.page}`
      : a.paradigm === "predicativo"
        ? "Raíz (nombre o adjetivo)"
        : "Raíz verbal",
  });
  for (const sfx of a.suffixes) {
    blocks.push({ kind: "suffix", text: sfx.form, label: `${sfx.meaning} · pág. ${sfx.page}` });
  }
  const end = start >= 0 ? start + core.length : word.length;
  if (a.negated && end < word.length) blocks.push({ kind: "neg", text: word.slice(end), label: "Negación (sufijo)" });
  return blocks;
}

const BLOCK_STYLE: Record<Block["kind"], string> = {
  neg: "border-red-300 bg-red-50 text-red-900 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-100",
  person: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-100",
  voice: "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-100",
  suffix: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100",
  root: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100",
};

function LaboratorioPage() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [results, setResults] = useState<Analysis[]>([]);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vocabulario de la plataforma: sirve para ordenar lecturas y mostrar evidencia, nunca para inventar.
  const corpusFn = useServerFn(getLabCorpus);
  const corpus = useQuery({ queryKey: ["lab-corpus"], queryFn: () => corpusFn(), staleTime: 5 * 60_000 });
  const index = useMemo(() => (corpus.data ? buildCorpusIndex(corpus.data.entries) : null), [corpus.data]);
  // Formas que imprime la Gramática ALG 2020 (solo servidor/admin): atestiguación por la fuente oficial.
  const bookFn = useServerFn(getLabBook);
  const bookQ = useQuery({ queryKey: ["lab-book"], queryFn: () => bookFn(), staleTime: Infinity });
  const book = useMemo(() => (bookQ.data ? buildBookIndex(bookQ.data.forms) : null), [bookQ.data]);
  const calcos = useMemo(() => (bookQ.data ? buildCalcoIndex(bookQ.data.calcos) : null), [bookQ.data]);
  // Diccionario de la Academia publicado por la SPL (solo entrada y enlace; uso interno, admin).
  const dictFn = useServerFn(getLabDictionary);
  const dictQ = useQuery({ queryKey: ["lab-dictionary"], queryFn: () => dictFn(), staleTime: Infinity });
  const dict = useMemo(() => (dictQ.data ? buildSplIndex(dictQ.data.entries) : null), [dictQ.data]);
  const ranked = useMemo(() => rankByAttestation(results, index, book, dict), [results, index, book, dict]);
  // Significados del Wikcionario (CC BY-SA, solo admin): fuente externa, se muestra aparte y citada.
  const wikFn = useServerFn(getLabWiktionary);
  const wikQ = useQuery({ queryKey: ["lab-wiktionary"], queryFn: () => wikFn(), staleTime: Infinity });
  const wik = useMemo(() => (wikQ.data ? buildWiktionaryIndex(wikQ.data.entries) : null), [wikQ.data]);
  const wordInCorpus: Attestation | null = submitted && index ? index.word(submitted) : null;

  const closed = useMemo(() => (submitted ? lookupClosed(submitted) : []), [submitted]);
  const nominal = useMemo(() => (submitted ? analyzeNominal(submitted) : []), [submitted]);
  const nominalRanked = useMemo(() => rankByAttestation(nominal, index, book, dict), [nominal, index, book, dict]);

  const run = (word: string) => {
    const w = word.trim();
    setSubmitted(w || null);
    setResults(w ? analyze(w) : []);
    setShowAll(false);
    // Lleva directo al resultado: nada de buscar bajando la pantalla.
    if (w) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(value);
  };

  /** Inserta el carácter donde está el cursor. */
  const insertChar = (ch: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + ch.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const tryExample = (word: string) => {
    setValue(word);
    run(word);
  };

  const textSources = useMemo<TextSources>(() => ({ book, dictionary: dict, wiktionary: wik, corpus: index }), [book, dict, wik, index]);
  const resultsRef = useRef<HTMLDivElement>(null);
  /** Desde el texto completo: analiza la palabra tocada y baja hasta su análisis. */
  const pickFromText = (word: string) => {
    tryExample(word);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <ValidationNotice />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Cabecera */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FlaskConical className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Laboratorio Morfológico Guaraní
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Desarmador y analizador morfológico basado en la Gramática Oficial (Academia de la Lengua Guaraní, 2020)
              </p>
            </div>
          </div>
          <Badge className="self-start whitespace-nowrap border-accent/40 bg-accent/10 text-accent hover:bg-accent/10" variant="outline">
            En validación — pendiente de especialistas
          </Badge>
        </header>

        {/* Entrada */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <label htmlFor="lab-word" className="text-sm font-medium text-foreground">
                Escribí una palabra conjugada en guaraní
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="lab-word"
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={60}
                  className="h-12 text-lg"
                  placeholder="Escribí aquí"
                />
                <Button type="submit" variant="cta" size="lg" className="h-12" disabled={!value.trim()}>
                  <Search className="mr-2 h-4 w-4" aria-hidden />
                  Analizar morfología
                </Button>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Caracteres del alfabeto guaraní">
                {SPECIAL_CHARS.map((ch) => (
                  <Button
                    key={ch}
                    type="button"
                    variant="outline"
                    className="h-10 min-w-10 px-3 text-lg"
                    onClick={() => insertChar(ch)}
                    aria-label={ch === "'" ? "Insertar puso" : `Insertar ${ch}`}
                    title={ch === "'" ? "puso" : undefined}
                  >
                    {ch}
                  </Button>
                ))}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Ejemplos del libro */}
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden />
            Ejemplos tomados del libro
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BOOK_EXAMPLES.map((ex) => (
              <button
                key={ex.word}
                type="button"
                onClick={() => tryExample(ex.word)}
                className="rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="font-display text-lg font-semibold text-foreground">{ex.word}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  pág. {ex.page} · {ex.note}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Texto completo: semáforo palabra por palabra */}
        <TextAnalyzerPanel sources={textSources} bookForms={bookQ.data?.forms ?? null} loading={bookQ.isLoading || dictQ.isLoading || wikQ.isLoading} onPick={pickFromText} />

        {/* Frases: ortografía y calcos del capítulo 6 */}
        <SentenceChecker calcos={calcos} loading={bookQ.isLoading} />

        {/* Resultados */}
        <div ref={resultsRef} className="scroll-mt-4" />
        {submitted && (
          <section className="mt-8" aria-live="polite">
            {closed.length > 0 && <ClosedClassPanel matches={closed} />}
            {results.length === 0 && nominal.length === 0 && closed.length === 0 ? (
              <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-500/10">
                <CardContent className="flex items-start gap-3 pt-6">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                  <p className="text-sm text-foreground">
                    <strong>«{submitted}»:</strong> forma no contemplada en las reglas cargadas o requiere revisión humana.
                  </p>
                </CardContent>
              </Card>
            ) : results.length === 0 ? null : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-foreground">Análisis de «{submitted}»</h2>
                  {results.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {results.length} lecturas posibles según las reglas cargadas. La correcta la decide un especialista.
                    </p>
                  )}
                </div>
                <div className="mt-4 space-y-4">
                  {(showAll ? ranked : ranked.slice(0, VISIBLE_READINGS)).map(({ reading: a, attestation }, i) => (
                    <AnalysisCard
                      key={`${a.paradigm}-${a.person}-${a.prefix}-${a.negated}-${a.root}-${i}`}
                      analysis={a}
                      attestation={attestation}
                      index={i + 1}
                      total={results.length}
                    />
                  ))}
                </div>
                {!showAll && ranked.length > VISIBLE_READINGS && (
                  <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setShowAll(true)}>
                    Ver las {ranked.length - VISIBLE_READINGS} lecturas restantes
                  </Button>
                )}
              </>
            )}
            {nominal.length > 0 && <NominalReadings readings={nominalRanked} />}
            <details className="mt-6 rounded-xl border bg-muted/30 p-3 [&_section]:mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                Ver fuentes, ortografía y cómo se ordenaron las lecturas
              </summary>
              {results.length > 0 && (
                <CorpusStatus loading={corpus.isLoading} failed={corpus.isError} size={index?.size ?? 0} word={submitted} inWord={wordInCorpus} />
              )}
              <OrthographyPanel word={submitted} />
              {book && bookQ.data && (
                <BookPanel
                  word={submitted}
                  book={book}
                  observaciones={bookQ.data.observaciones}
                  showCompounds={![...ranked, ...nominalRanked].some((r) => r.attestation.level !== "none") && closed.length === 0}
                />
              )}
              {dict && <SplPanel word={submitted} dict={dict} />}
              {wik && wikQ.data && (
                <WiktionaryPanel
                  word={submitted}
                  wik={wik}
                  attribution={wikQ.data.source.atribucion}
                  license={wikQ.data.source.licencia}
                  roots={[...ranked.slice(0, 3).map((r) => r.reading.root), ...nominalRanked.slice(0, 3).map((r) => r.reading.root)]}
                />
              )}
              <AlanMotorPanel word={submitted} lab={results.map((a) => ({ person: a.person, root: a.root, suffixes: a.suffixes.map((s) => s.form) }))} />
            </details>
          </section>
        )}

        <p className="mt-10 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Herramienta interna en desarrollo. Aplica reglas tomadas de la gramática publicada por la Academia de la Lengua Guaraní;
          no es una herramienta de la Academia ni cuenta con su aprobación. Ningún resultado se usa en clase sin validación de especialistas.
        </p>
      </main>
    </div>
  );
}

const SEVERITY_LABEL: Record<OrthographyIssue["severity"], string> = {
  error: "No cumple la regla",
  revisar: "Revisar",
  prestamo: "Préstamo",
};

/** Avisos de las reglas ortográficas del libro (págs. 19–37). Solo verifica: no corrige ni propone formas. */
function OrthographyPanel({ word }: { word: string }) {
  const issues = useMemo(() => checkWord(word), [word]);
  return (
    <div className="mb-4 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        {issues.length === 0 ? (
          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden />
        )}
        Ortografía (reglas de las págs. 19–37)
      </p>
      {issues.length === 0 ? (
        <p className="mt-1 text-muted-foreground">
          Sin avisos en alfabeto, tilde, sílabas nasales y sílaba directa. Esto no confirma que la palabra exista.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {issues.map((i, k) => (
            <li key={`${i.rule}-${k}`} className="flex flex-wrap items-baseline gap-2">
              <Badge variant="outline" className="whitespace-nowrap">
                {SEVERITY_LABEL[i.severity]} · pág. {i.page}
              </Badge>
              <span className="text-foreground">{i.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Revisión de una frase: avisos de ortografía (págs. 19–37) y comparación con los 110 pares de
 * calcos del capítulo 6 (págs. 246–253). Solo cita al libro; no reescribe la frase.
 */
function SentenceChecker({ calcos, loading }: { calcos: CalcoIndex | null; loading: boolean }) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<string | null>(null);
  const issues = useMemo(() => (checked ? checkText(checked) : []), [checked]);
  const matches = useMemo(() => (checked && calcos ? calcos.check(checked) : []), [checked, calcos]);
  const HOW: Record<"exacta" | "contiene" | "parecida", string> = { exacta: "igual", contiene: "la contiene", parecida: "difiere en una palabra" };
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Revisar una frase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(ev: FormEvent) => {
            ev.preventDefault();
            setChecked(text.trim() || null);
          }}
        >
          <Input
            value={text}
            onChange={(ev: { target: { value: string } }) => setText(ev.target.value)}
            maxLength={300}
            autoComplete="off"
            spellCheck={false}
            className="h-11"
            placeholder="Escribí una frase en guaraní"
            aria-label="Frase en guaraní"
          />
          <Button type="submit" variant="outline" className="h-11" disabled={!text.trim()}>
            Revisar frase
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Compara con los 110 pares «Como se dice / Como debe decirse» del capítulo 6 (págs. 246–253) y revisa la ortografía.
          {loading && " Cargando los pares del libro…"}
        </p>
        {checked && (
          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-muted-foreground">No coincide con ninguno de los pares del capítulo 6.</p>
            ) : (
              <ul className="space-y-2">
                {matches.map((m) => (
                  <li key={`${m.pair.n}-${m.kind}`} className="rounded-lg border border-border/60 px-3 py-2">
                    {m.kind === "calco" ? (
                      <>
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          El libro da esta frase como calco ({HOW[m.how]}, n.º {m.pair.n}, pág. {m.pair.paginas[0]}): «{m.pair.calco}»
                        </p>
                        <p className="text-foreground">
                          Como debe decirse según el libro (pág. {m.pair.paginas[1]}): {m.pair.correcta.map((c) => `«${c}»`).join(" o ")}
                        </p>
                      </>
                    ) : (
                      <p className="text-emerald-800 dark:text-emerald-200">
                        Es la forma que el libro recomienda ({HOW[m.how]}, n.º {m.pair.n}, pág. {m.pair.paginas[1]}), en lugar de «{m.pair.calco}».
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {issues.length > 0 ? (
              <ul className="space-y-1">
                {issues.map((i, k) => (
                  <li key={`${i.word}-${k}`} className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline">{SEVERITY_LABEL[i.severity]} · pág. {i.page}</Badge>
                    <span>
                      «{i.word}»: {i.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Sin avisos de ortografía.</p>
            )}
            <p className="text-xs text-muted-foreground">Pendiente de validación: la decisión final es de un especialista.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const MOTOR_STATUS_LABEL: Record<MotorToken["estado"], string> = {
  sin_analisis: "No encontró análisis",
  una_lectura: "Una lectura",
  sin_resolver: "Varias lecturas, sin elegir (correcto: no hay evidencia para elegir)",
  resuelta: "Varias lecturas; eligió una",
};

/**
 * Lecturas del motor HFST/LEXC de Alan para la misma palabra (contrato 1.0), al lado de las del
 * Laboratorio. Apagado hasta que el servicio esté configurado; nunca reemplaza a las del Laboratorio.
 */
function AlanMotorPanel({ word, lab }: { word: string; lab: LabReadingKey[] }) {
  const fn = useServerFn(getAlanMotorReadings);
  const q = useQuery({
    queryKey: ["alan-motor", word],
    queryFn: () => fn({ data: { text: word } }),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const box = "mt-6 rounded-xl border p-4 text-sm";
  if (q.isLoading) return <p className="mt-6 text-xs text-muted-foreground">Consultando el motor HFST…</p>;
  if (q.isError || !q.data) return <p className={`${box} border-amber-300/60 text-foreground`}>No se pudo consultar el motor HFST.</p>;
  if (q.data.status === "apagado") {
    return (
      <p className={`${box} border-dashed border-border/70 text-muted-foreground`}>
        <strong className="text-foreground">Motor HFST (Alan):</strong> todavía no está conectado. Cuando su servicio esté en línea,
        sus lecturas van a aparecer acá, al lado de las del Laboratorio.
      </p>
    );
  }
  if (q.data.status === "error") {
    return (
      <p className={`${box} border-amber-300/60 bg-amber-50/60 text-foreground dark:bg-amber-500/10`}>
        <strong>Motor HFST (Alan):</strong> {q.data.message}. Se muestran solo las lecturas del Laboratorio.
      </p>
    );
  }
  const { response } = q.data;
  const tokens = response.tokens.length > 0 ? response.tokens : [];
  return (
    <section className={`${box} border-violet-300/60`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-foreground">Motor HFST de Alan</h3>
        <span className="text-xs text-muted-foreground">
          {response.motor.nombre} {response.motor.version}
          {response.motor.transductor ? ` · transductor ${response.motor.transductor}` : ""}
        </span>
      </div>
      {tokens.length === 0 && <p className="mt-2 text-muted-foreground">El motor no devolvió palabras.</p>}
      {tokens.map((t, ti) => (
        <div key={ti} className="mt-3">
          <p className="text-xs text-muted-foreground">
            «{t.superficie}» · {MOTOR_STATUS_LABEL[t.estado]}
          </p>
          <ul className="mt-2 space-y-2">
            {t.lecturas.map((r, ri) => {
              const same = matchesLab(r, lab);
              return (
                <li key={ri} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {[...r.prefijos.map((p) => p.forma), r.raiz, ...r.sufijos.map((s) => s.forma)].join(" + ")}
                    </span>
                    {r.persona && <Badge variant="outline">{PERSON_LABEL[r.persona].label}</Badge>}
                    {r.negacion && <Badge variant="outline">negación</Badge>}
                    <Badge
                      variant="outline"
                      className={same ? "border-emerald-400/60 text-emerald-800 dark:text-emerald-200" : "border-amber-400/60 text-amber-800 dark:text-amber-200"}
                    >
                      {same ? "Coincide con el Laboratorio" : "Distinta al Laboratorio"}
                    </Badge>
                    {t.seleccion === ri && <Badge variant="outline">elegida ({t.metodo ?? "sin método"})</Badge>}
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{r.analisis_crudo}</p>
                  {r.paginas.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">Gramática ALG 2020, pág. {r.paginas.join(", ")}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="mt-3 text-xs text-muted-foreground">
        Las diferencias entre los dos motores no se resuelven solas: las decide un docente.
      </p>
    </section>
  );
}

const TEXT_STATUS: Record<WordStatus, { label: string; short: string; chip: string; dot: string }> = {
  respaldada: {
    label: "Respaldada: la palabra está tal cual en una fuente",
    short: "Respaldada",
    chip: "bg-emerald-100 text-emerald-950 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-50 dark:ring-emerald-400/40",
    dot: "bg-emerald-500",
  },
  armada: {
    label: "Armada por el motor con las reglas del libro, sobre una raíz respaldada",
    short: "Armada por el motor",
    chip: "bg-amber-100 text-amber-950 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-50 dark:ring-amber-400/40",
    dot: "bg-amber-500",
  },
  sin_respaldo: {
    label: "Sin respaldo: el motor no la reconoce (va a la lista de los docentes)",
    short: "Sin respaldo",
    chip: "bg-red-100 text-red-950 ring-red-300 dark:bg-red-500/20 dark:text-red-50 dark:ring-red-400/40",
    dot: "bg-red-500",
  },
  fuera_alfabeto: {
    label: "Fuera del alfabeto oficial (castellano, nombre propio o error de escritura); no se cuenta",
    short: "Fuera del alfabeto",
    chip: "bg-muted text-muted-foreground ring-border",
    dot: "bg-muted-foreground/50",
  },
};

const ROOT_SOURCE_LABEL: Record<RootSource, string> = {
  libro: "en la Gramática ALG 2020",
  "libro-forma": "en la Gramática ALG 2020 dentro de otra forma",
  diccionario: "en el diccionario de la Academia (SPL)",
  wikcionario: "en el Wikcionario (no validado)",
  docente: "validada por un docente",
};

/** Explica en una línea de dónde sale el estado de una palabra. */
function evidenceText(e: Evidence): string {
  switch (e.kind) {
    case "libro":
      return `Aparece tal cual en la Gramática ALG 2020, pág. ${e.pages.join(", ")}.`;
    case "lista-del-libro":
      return `Está en las listas de palabras del libro, pág. ${e.page}.`;
    case "diccionario":
      return "Es una entrada del diccionario de la Academia publicado por la SPL.";
    case "wikcionario":
      return "Está en el Wikcionario (fuente colaborativa, no validada).";
    case "docente":
      return "Validada por un docente en Jaikuaa.";
    case "reglas":
      return `El motor la arma así: ${e.parts.join(" + ")}. La raíz «${e.root}» está ${ROOT_SOURCE_LABEL[e.rootSource]}${e.inForm ? ` («${e.inForm}»)` : ""}${e.pages.length ? `, pág. ${e.pages.slice(0, 3).join(", ")}` : ""}.`;
    case "ninguna":
      return e.readings > 0
        ? "El motor ve cómo podría separarse, pero ninguna raíz tiene respaldo en las fuentes."
        : "El motor no la reconoce con las reglas cargadas.";
    case "alfabeto":
      return e.message;
  }
}

/**
 * Vista «semáforo»: un texto completo, palabra por palabra, con el respaldo de cada una.
 * No corrige ni completa nada: solo muestra lo que las fuentes y las reglas del libro respaldan.
 */
function TextAnalyzerPanel({
  sources,
  bookForms,
  loading,
  onPick,
}: {
  sources: TextSources;
  bookForms: Record<string, number[]> | null;
  loading: boolean;
  onPick: (word: string) => void;
}) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // Las raíces dentro de las formas del libro se arman una sola vez, recién al analizar el primer texto.
  const rootsRef = useRef<{ forms: Record<string, number[]>; index: BookRootIndex } | null>(null);
  const result = useMemo(() => {
    if (!checked) return null;
    if (bookForms && rootsRef.current?.forms !== bookForms) rootsRef.current = { forms: bookForms, index: buildBookRootIndex(bookForms) };
    return analyzeText(checked, { ...sources, bookRoots: bookForms ? rootsRef.current?.index : null });
  }, [checked, sources, bookForms]);
  const pick = result && selected !== null ? result.pieces[selected] : null;
  const word = pick && pick.kind === "word" ? pick : null;
  const splRefs = word && (word.evidence.kind === "diccionario" || word.evidence.kind === "reglas") ? word.evidence.refs : [];

  return (
    <Card className="mt-6 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="h-4 w-4 text-primary" aria-hidden />
          Analizar un texto completo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <form
          className="space-y-3"
          onSubmit={(ev: FormEvent) => {
            ev.preventDefault();
            setChecked(text.trim() || null);
            setSelected(null);
          }}
        >
          <Textarea
            value={text}
            onChange={(ev: { target: { value: string } }) => setText(ev.target.value)}
            maxLength={20000}
            rows={5}
            spellCheck={false}
            placeholder="Pegá un texto en guaraní: un artículo de una ley, una noticia, un cuento…"
            aria-label="Texto en guaraní"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="cta" disabled={!text.trim() || loading}>
              Analizar texto
            </Button>
            {loading && <span className="text-xs text-muted-foreground">Cargando el libro, el diccionario y el Wikcionario…</span>}
            {!loading && (
              <span className="text-xs text-muted-foreground">Hasta {MAX_TEXT_WORDS.toLocaleString("es-PY")} palabras. Tocá una palabra para ver de dónde sale.</span>
            )}
          </div>
        </form>

        {result && (
          <div className="space-y-4" aria-live="polite">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              {result.recognized === null ? (
                <p className="text-muted-foreground">No se encontraron palabras en guaraní para analizar.</p>
              ) : (
                <p className="text-foreground">
                  <span className="font-display text-3xl font-bold">{result.recognized.toLocaleString("es-PY")} %</span>{" "}
                  <span className="text-muted-foreground">
                    de las {result.guarani.toLocaleString("es-PY")} palabras en guaraní tiene respaldo o la arma el motor.
                  </span>
                </p>
              )}
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {(Object.keys(TEXT_STATUS) as WordStatus[]).map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TEXT_STATUS[s].dot}`} aria-hidden />
                    <span className="text-foreground">{TEXT_STATUS[s].short}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">{result.counts[s].toLocaleString("es-PY")}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-background p-4 text-base leading-9">
              {result.pieces.map((p, i) =>
                p.kind === "gap" ? (
                  <span key={i}>{p.text}</span>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(i)}
                    title={`${TEXT_STATUS[p.status].short}: ${evidenceText(p.evidence)}`}
                    aria-label={`${p.surface}: ${TEXT_STATUS[p.status].short}`}
                    className={`rounded px-0.5 ring-1 transition hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${TEXT_STATUS[p.status].chip} ${selected === i ? "ring-2 ring-primary" : ""}`}
                  >
                    {p.surface}
                  </button>
                ),
              )}
            </div>

            {word && (
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold text-foreground">{word.surface}</span>
                  <Badge variant="outline" className="gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${TEXT_STATUS[word.status].dot}`} aria-hidden />
                    {TEXT_STATUS[word.status].short}
                  </Badge>
                </div>
                <p className="mt-2 text-foreground">{evidenceText(word.evidence)}</p>
                {splRefs.length > 0 && (
                  <p className="mt-1 text-xs">
                    <a
                      href={splUrl(splRefs[0]!)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      Ver la entrada en el sitio de la SPL
                    </a>
                  </p>
                )}
                {word.status !== "fuera_alfabeto" && (
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onPick(word.word)}>
                    Ver el análisis completo de «{word.word}»
                  </Button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              «Respaldada» y «armada» no quieren decir «correcta»: la lectura final la valida un docente. Las palabras sin
              respaldo pueden ser guaraní que todavía falta en las fuentes, nombres propios o errores de escritura.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ¿La palabra aparece tal cual en la Gramática? Si no, formas del libro parecidas y lecturas de
 * compuesto (pág. 53). No es una corrección: solo muestra palabras que el libro imprime.
 */
function BookPanel({
  word,
  book,
  observaciones,
  showCompounds,
}: {
  word: string;
  book: BookIndex;
  observaciones: Record<string, { pages: number[]; issues: string[] }>;
  showCompounds: boolean;
}) {
  const hit = useMemo(() => book.lookup(word), [book, word]);
  const observed = observaciones[normalizeWord(word)];
  const similar = useMemo(() => (hit ? [] : book.similar(word, 2, 5)), [book, word, hit]);
  const compounds = useMemo(() => (hit || !showCompounds ? [] : book.compounds(word).slice(0, 3)), [book, word, hit, showCompounds]);
  return (
    <div className="mb-4 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <Library className="h-4 w-4 text-primary" aria-hidden />
        En la Gramática oficial ({book.size} formas)
      </p>
      {hit ? (
        <p className="mt-1 text-foreground">
          «{hit.form}» aparece en el libro (pág. {hit.pages.slice(0, 6).join(", ")}).
          {hit.accentDiffers && <span className="text-amber-700 dark:text-amber-300"> El libro la escribe con otra tilde.</span>}
        </p>
      ) : observed ? (
        <p className="mt-1 text-foreground">
          El libro la imprime así (pág. {observed.pages.join(", ")}), pero el corrector marca: {observed.issues.join("; ")}. Queda como observación para especialistas.
        </p>
      ) : (
        <p className="mt-1 text-muted-foreground">No aparece tal cual en el libro.</p>
      )}
      {similar.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Formas del libro parecidas (no es una corrección; decide un especialista):</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {similar.map((s) => (
              <li key={s.form}>
                <Badge variant="outline">
                  {s.form} · pág. {s.pages[0]}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      {compounds.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Posible palabra compuesta (pág. 53: dos núcleos que se unen sin pérdida de elementos):</p>
          <ul className="mt-1 space-y-1">
            {compounds.map((c) => (
              <li key={c.parts.map((p) => p.form).join("+")} className="text-foreground">
                {c.parts[0].form} + {c.parts[1].form}{" "}
                <span className="text-xs text-muted-foreground">
                  (págs. {c.parts[0].pages[0]} y {c.parts[1].pages[0]})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * ¿La palabra es una entrada del diccionario monolingüe de la Academia que publica la SPL? Solo
 * muestra la entrada, su abreviatura y el enlace: la definición se lee en el sitio de la SPL.
 */
function SplPanel({ word, dict }: { word: string; dict: SplIndex }) {
  const hits = useMemo(() => dict.lookup(word), [dict, word]);
  if (hits.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <BookOpen className="h-4 w-4 text-primary" aria-hidden />
        En el diccionario de la Academia publicado por la SPL ({dict.size} entradas)
      </p>
      <ul className="mt-2 space-y-1.5">
        {hits.map((h, k) => (
          <li key={`${h.entry.ref}-${k}`} className="flex flex-wrap items-baseline gap-2">
            <a href={splUrl(h.entry.ref)} target="_blank" rel="noreferrer" className="font-medium text-foreground underline">
              {h.entry.headword}
            </a>
            {h.entry.pos && (
              <Badge variant="outline" className="whitespace-nowrap">
                {h.entry.pos}
                {posLabel(h.entry.pos) ? ` · ${posLabel(h.entry.pos)}` : ""}
              </Badge>
            )}
            {h.accentDiffers && <span className="text-xs text-amber-700 dark:text-amber-300">(el diccionario la escribe con otra tilde)</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Diccionario de la Academia de la Lengua Guaraní, publicado por la Secretaría de Políticas Lingüísticas. La definición se lee en su sitio.
      </p>
    </div>
  );
}

/** Definiciones de una entrada del Wikcionario, tal cual (en inglés). */
function WiktionaryLine({ hit }: { hit: WiktionaryHit }) {
  const { entry, accentDiffers, lemma } = hit;
  const flagged =
    !["character", "suffix", "prefix", "circumfix"].includes(entry.pos) &&
    entry.word.split(/\s+/).some((w) => checkWord(w).some((i) => i.severity === "error"));
  return (
    <li className="space-y-0.5">
      <p className="text-foreground">
        <strong>{entry.word}</strong> <span className="text-xs text-muted-foreground">({POS_LABEL[entry.pos] ?? entry.pos})</span>{" "}
        {entry.formOf ? (
          <span>
            {FORM_OF_LABEL[entry.formOf.kind]} «{entry.formOf.lemma}»
            {lemma && lemma.length > 0 && <span className="text-muted-foreground"> — {lemma.flatMap((l) => l.glosses).slice(0, 3).join("; ")}</span>}
          </span>
        ) : (
          <span>{entry.glosses.join("; ")}</span>
        )}
      </p>
      {accentDiffers && <p className="text-xs text-amber-700 dark:text-amber-300">La fuente la escribe con otra tilde.</p>}
      {flagged && <p className="text-xs text-amber-700 dark:text-amber-300">El corrector marca esta escritura según las reglas de la Gramática ALG (págs. 19–37).</p>}
    </li>
  );
}

/**
 * Significados del Wikcionario: fuente colaborativa externa (CC BY-SA 4.0), en inglés y sin
 * validar. Busca la palabra; si no está, las raíces de las lecturas. No traduce ni corrige.
 */
function WiktionaryPanel({ word, wik, roots, attribution, license }: { word: string; wik: WiktionaryIndex; roots: string[]; attribution: string; license: string }) {
  const direct = useMemo(() => wik.lookup(word), [wik, word]);
  const viaRoots = useMemo(() => {
    if (direct.length > 0) return [];
    const seen = new Set<string>();
    const out: { root: string; hits: WiktionaryHit[] }[] = [];
    for (const r of roots) {
      const k = normalizeWord(r);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const hits = wik.lookup(r);
      if (hits.length > 0) out.push({ root: r, hits });
    }
    return out.slice(0, 3);
  }, [wik, word, roots, direct]);
  if (direct.length === 0 && viaRoots.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
        <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
        Significado según el Wikcionario (fuente externa, en inglés)
        <Badge variant="outline" className="whitespace-nowrap">Wikcionario · CC BY-SA</Badge>
      </p>
      {direct.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {direct.map((h, k) => (
            <WiktionaryLine key={`${h.entry.word}-${h.entry.pos}-${k}`} hit={h} />
          ))}
        </ul>
      ) : (
        viaRoots.map(({ root, hits }) => (
          <div key={root} className="mt-2">
            <p className="text-xs text-muted-foreground">La palabra no está; sí la raíz «{root}» de una de las lecturas:</p>
            <ul className="mt-1 space-y-1.5">
              {hits.map((h, k) => (
                <WiktionaryLine key={`${h.entry.word}-${h.entry.pos}-${k}`} hit={h} />
              ))}
            </ul>
          </div>
        ))
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {attribution}. Licencia {license}. No es la Gramática de la Academia ni está validado por docentes de Jaikuaa.
      </p>
    </div>
  );
}

/** La palabra está en una de las listas cerradas del libro (pronombres, adverbios, conjunciones…). */
function ClosedClassPanel({ matches }: { matches: ReturnType<typeof lookupClosed> }) {
  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <BookOpen className="h-4 w-4 text-primary" aria-hidden />
        Está en las listas del libro
      </p>
      <ul className="mt-2 space-y-1.5">
        {matches.map(({ entry, accentDiffers }, k) => (
          <li key={`${entry.cls}-${k}`} className="flex flex-wrap items-baseline gap-2">
            <Badge variant="outline" className="whitespace-nowrap">pág. {entry.page}</Badge>
            <span className="text-foreground">
              {CLOSED_CLASS_LABEL[entry.cls]}: «{entry.form}»{entry.gloss ? ` — ${entry.gloss}` : ""}
            </span>
            {accentDiffers && <span className="text-xs text-amber-700 dark:text-amber-300">(el libro la escribe con otra tilde)</span>}
            {entry.note && <span className="w-full text-xs text-muted-foreground">{entry.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pieza tomada de la fuente académica externa (no del libro de la Academia). */
function ExternalTag({ page }: { page: number }) {
  return (
    <span className="text-amber-700 dark:text-amber-300">
      (fuente académica externa: Estigarribia 2020, pág. {page}; no está en la Gramática ALG)
    </span>
  );
}

const HARMONY_LABEL: Record<NominalAnalysis["harmony"], string | null> = {
  ok: "Armonía nasal correcta según la última sílaba de la raíz (págs. 29, 61 y 63)",
  no: "La partícula no corresponde a la armonía nasal de la última sílaba de la raíz (págs. 29, 61 y 63)",
  duda: "Armonía nasal en duda: el libro no decide con consonantes naso-orales",
  "no-aplica": null,
};

/** Lecturas como sustantivo, adjetivo o adverbio (págs. 49–85 y 207). */
function NominalReadings({ readings }: { readings: { reading: NominalAnalysis; attestation: Attestation }[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? readings : readings.slice(0, VISIBLE_READINGS);
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-bold text-foreground">Lecturas como sustantivo, adjetivo o adverbio</h2>
      <p className="mt-1 text-xs text-muted-foreground">Según las reglas del sustantivo y del adjetivo (págs. 49–85). La correcta la decide un especialista.</p>
      <div className="mt-3 space-y-3">
        {shown.map(({ reading: a, attestation }, i) => (
          <Card key={`${a.possessor?.form ?? ""}-${a.root}-${a.suffixes.map((s) => s.ruleId).join("+")}-${i}`}>
            <CardContent className="space-y-2 pt-5 text-sm">
              <p className="font-display text-base">
                {a.possessor && <span className="text-accent">{a.possessor.form}-</span>}
                <strong className="text-foreground">{a.root}</strong>
                {a.suffixes.map((s) => (
                  <span key={s.ruleId} className="text-primary">-{s.form}</span>
                ))}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {a.possessor && <li>Índice de posesión de 3.ª persona «{a.possessor.form}» (pág. {a.possessor.page})</li>}
                {a.multiform && (
                  <li>
                    Sustantivo {a.multiform.kind}: «{a.multiform.form}» es forma de «{a.multiform.absolute}»{" "}
                    {a.multiform.external ? <ExternalTag page={a.multiform.page} /> : `(pág. ${a.multiform.page})`}
                  </li>
                )}
                {a.suffixes.map((s) => (
                  <li key={`m-${s.ruleId}`}>
                    «{s.form}»: {s.meaning} {s.external ? <ExternalTag page={s.page} /> : `(pág. ${s.page})`}
                  </li>
                ))}
                {HARMONY_LABEL[a.harmony] && <li>{HARMONY_LABEL[a.harmony]}</li>}
              </ul>
              <AttestationNote attestation={attestation} />
              <Badge variant="outline" className="border-accent/40 text-accent">Pendiente de validación</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      {!all && readings.length > VISIBLE_READINGS && (
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setAll(true)}>
          Ver las {readings.length - VISIBLE_READINGS} lecturas restantes
        </Button>
      )}
    </div>
  );
}

/** Estado del vocabulario y si la palabra escrita está tal cual en él. */
function CorpusStatus({ loading, failed, size, word, inWord }: { loading: boolean; failed: boolean; size: number; word: string; inWord: Attestation | null }) {
  if (loading) return <p className="mt-3 text-xs text-muted-foreground">Cargando el vocabulario de la plataforma…</p>;
  if (failed) return <p className="mt-3 text-xs text-muted-foreground">No se pudo cargar el vocabulario: las lecturas se muestran en el orden del analizador.</p>;
  return (
    <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
      <Library className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        Ordenadas así: primero las raíces validadas por docentes, después las que están en la Gramática oficial y después las del
        vocabulario de Jaikuaa ({size} palabras publicadas, aún sin validar).
        {inWord && inWord.level !== "none" && (
          <strong className="text-foreground">
            {" "}«{word}» figura tal cual en el vocabulario{inWord.level === "validated" ? ", validada por docentes." : " (aún sin validación de docentes)."}
          </strong>
        )}
      </span>
    </div>
  );
}

function AttestationNote({ attestation }: { attestation: Attestation }) {
  if (attestation.level === "none") {
    return <p className="text-xs text-muted-foreground">La raíz no aparece en el vocabulario de la plataforma.</p>;
  }
  const words = attestation.examples.map((w) => `«${w}»`).join(", ");
  if (attestation.level === "dictionary") {
    return (
      <p className="flex items-start gap-1.5 text-xs font-medium text-foreground">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          La raíz es una entrada del diccionario de la Academia publicado por la SPL:{" "}
          {attestation.examples.map((w, k) => (
            <a key={w} href={splUrl(attestation.refs[k] ?? attestation.refs[0] ?? "")} target="_blank" rel="noreferrer" className="underline">
              «{w}»
            </a>
          ))}
          .
        </span>
      </p>
    );
  }
  if (attestation.level === "book") {
    return (
      <p className="flex items-start gap-1.5 text-xs font-medium text-foreground">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        La raíz aparece tal cual en la Gramática oficial: {words} (pág. {attestation.pages.join(", ")}).
      </p>
    );
  }
  return attestation.level === "validated" ? (
    <p className="flex items-start gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      Raíz validada por docentes: aparece en {words}.
    </p>
  ) : (
    <p className="text-xs text-foreground">
      La raíz aparece en el vocabulario de Jaikuaa ({words}), aún sin validación de docentes.
    </p>
  );
}

function AnalysisCard({ analysis: a, attestation, index, total }: { analysis: Analysis; attestation: Attestation; index: number; total: number }) {
  const blocks = toBlocks(a);
  const person = PERSON_LABEL[a.person];
  const pages = [...new Set(a.pages)].sort((x, y) => x - y);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-base">
            {total > 1 ? `Lectura ${index} de ${total}` : "Lectura"}
          </CardTitle>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            Pendiente de validación
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Bloques */}
        <div className="flex flex-wrap items-stretch gap-2" aria-label="Partes de la palabra">
          {blocks.map((b, i) => (
            <div key={`${b.kind}-${i}`} className={`flex min-w-16 flex-col items-center rounded-xl border-2 px-4 py-2 ${BLOCK_STYLE[b.kind]}`}>
              <span className="font-display text-2xl font-bold leading-tight">{b.text}</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wide opacity-80">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Ficha técnica */}
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{a.paradigm === "pronominal" ? "Objeto (a quién)" : "Sujeto / persona"}</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {person.label} <span className="text-muted-foreground">({person.pronoun})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conjugación</dt>
            <dd className="mt-0.5 font-medium text-foreground">{PARADIGM_LABEL[a.paradigm]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Voz</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {a.voices.length
                ? a.voices.map((v) => v.meaning).join(" · ")
                : a.paradigm === "predicativo" || a.paradigm === "pronominal"
                  ? "No aplica en estas reglas"
                  : "Voz activa simple, sin partícula (pág. 117)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tiempo, modo y grado</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {a.suffixes.length
                ? a.suffixes.map((x) => x.meaning).join(" · ")
                : a.paradigm === "imperativo"
                  ? "Modo imperativo sin partícula (pág. 165)"
                  : "Sin partículas: presente y modo indicativo simple (págs. 123 y 139)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Forma</dt>
            <dd className="mt-0.5 font-medium text-foreground">{a.negated ? "Negativa" : "Afirmativa"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Fuente</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              Regla según {BOOK}, {pages.length > 1 ? "págs." : "pág."} {pages.join(" y ")}
            </dd>
          </div>
        </dl>
        <AttestationNote attestation={attestation} />
      </CardContent>
    </Card>
  );
}
