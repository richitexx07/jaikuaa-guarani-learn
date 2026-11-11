/**
 * Motor morfológico determinista nativo de Jaikuaa (versión 1.0).
 *
 * Unifica el análisis verbal (analyze), nominal (analyzeNominal) y clases cerradas (lookupClosed)
 * en un único motor determinista en TypeScript, cumpliendo el contrato formal de Jaikuaa.
 *
 * Características:
 * - 100% autosuficiente: no depende de servidores externos ni de conexiones de red.
 * - Basado estrictamente en la "Gramática Guaraní ALG 2020" de la Academia de la Lengua Guaraní.
 * - Descompone prefijos personales, negación, voces (incluyendo causativos), tiempos, modos,
 *   aspectos, posesivos, plurales y posposiciones con citación exacta de páginas impresas.
 * - No inventa vocabulario ni genera texto: solo analiza con rigor determinista.
 */

import { analyze, normalizeWord, type Analysis } from "./analyzer";
import { analyzeNominal, type NominalAnalysis } from "./nominal-analyzer";
import { lookupClosed } from "./closed-classes";
import { CONTRACT_VERSION, type MorphPiece, type MotorReading, type MotorResponse, type MotorToken, type ReadingStatus } from "./motor-contract";

const WORD_RE = /[\p{L}\p{M}'’‘´`ʼʻ]+/gu;

function verbalToReading(a: Analysis, index: number): MotorReading {
  const prefijos: MorphPiece[] = [];
  if (a.prefix) {
    prefijos.push({ forma: a.prefix, rasgo: "persona", valor: a.person });
  }
  for (const v of a.voices) {
    prefijos.push({ forma: v.form, rasgo: "voz", valor: v.meaning });
  }

  const sufijos: MorphPiece[] = a.suffixes.map((s) => ({
    forma: s.form,
    rasgo: s.type,
    valor: s.meaning,
  }));

  const crudoParts = [
    a.negated ? "neg" : null,
    a.prefix || null,
    ...a.voices.map((v) => v.form),
    a.root,
    ...a.suffixes.map((s) => s.form),
  ].filter(Boolean);

  return {
    raiz: a.root,
    lema: a.lexeme?.meaning ? a.lexeme.form : a.root,
    categoria: a.paradigm === "imperativo" ? "verbo_imperativo" : a.paradigm === "predicativo" ? "predicativo" : "verbo",
    persona: a.person,
    negacion: a.negated,
    prefijos,
    sufijos,
    analisis_crudo: crudoParts.join("-"),
    rango: index + 1,
    peso: null,
    paginas: a.pages,
    procedencia: "jaikuaa-nativo",
  };
}

function nominalToReading(n: NominalAnalysis, index: number): MotorReading {
  const prefijos: MorphPiece[] = [];
  if (n.possessor) {
    prefijos.push({ forma: n.possessor.form, rasgo: "posesivo_3p", valor: "3p" });
  }
  if (n.multiform) {
    prefijos.push({ forma: n.multiform.form, rasgo: "multiforme", valor: n.multiform.kind });
  }

  const sufijos: MorphPiece[] = n.suffixes.map((s) => ({
    forma: s.form,
    rasgo: s.type,
    valor: s.meaning,
  }));

  const pages = [
    ...(n.possessor ? [n.possessor.page] : []),
    ...(n.multiform ? [n.multiform.page] : []),
    ...n.suffixes.map((s) => s.page),
  ].filter(Boolean);

  const crudoParts = [
    n.possessor?.form,
    n.multiform?.form,
    n.root,
    ...n.suffixes.map((s) => s.form),
  ].filter(Boolean);

  return {
    raiz: n.root,
    lema: n.multiform?.absolute ?? n.root,
    categoria: "sustantivo",
    persona: n.possessor ? "3" : null,
    negacion: false,
    prefijos,
    sufijos,
    analisis_crudo: crudoParts.join("-"),
    rango: index + 1,
    peso: null,
    paginas: pages,
    procedencia: "jaikuaa-nativo",
  };
}

export function analyzeLocalMotor(text: string): MotorResponse {
  const matches = Array.from(text.matchAll(WORD_RE));
  const tokens: MotorToken[] = [];

  for (const match of matches) {
    const surface = match[0];
    const norm = normalizeWord(surface);
    if (!norm) continue;

    const lecturas: MotorReading[] = [];

    // 1. Clases cerradas (pronombres, partículas, posposiciones sueltas de la Academia)
    const closed = lookupClosed(norm);
    if (closed) {
      lecturas.push({
        raiz: norm,
        lema: norm,
        categoria: closed.meaning,
        persona: null,
        negacion: false,
        prefijos: [],
        sufijos: [],
        analisis_crudo: `${norm}[${closed.meaning}]`,
        rango: 1,
        peso: null,
        paginas: [closed.page],
        procedencia: "jaikuaa-nativo",
      });
    }

    // 2. Análisis verbal (prefijos de persona, negación, voces causativas/pasivas, sufijos)
    const verbales = analyze(norm);
    for (const v of verbales) {
      lecturas.push(verbalToReading(v, lecturas.length));
    }

    // 3. Análisis nominal (posesión, multiformes, sufijos de plural/tiempo/posposición)
    if (lecturas.length === 0) {
      const nominales = analyzeNominal(norm);
      for (const n of nominales) {
        lecturas.push(nominalToReading(n, lecturas.length));
      }
    }

    // Deduplicación de lecturas equivalentes
    const uniqueLecturas: MotorReading[] = [];
    const seen = new Set<string>();
    for (const l of lecturas) {
      const k = `${l.categoria}|${l.raiz}|${l.analisis_crudo}`;
      if (!seen.has(k)) {
        seen.add(k);
        uniqueLecturas.push(l);
      }
    }

    const estado: ReadingStatus =
      uniqueLecturas.length === 0
        ? "sin_analisis"
        : uniqueLecturas.length === 1
          ? "una_lectura"
          : "sin_resolver";

    tokens.push({
      superficie: surface,
      normalizada: norm,
      lecturas: uniqueLecturas,
      seleccion: uniqueLecturas.length === 1 ? 0 : null,
      estado,
      metodo: "reglas-alg-2020",
    });
  }

  return {
    version_contrato: CONTRACT_VERSION,
    motor: {
      nombre: "jaikuaa-determinista-nativo",
      version: "1.0",
      transductor: "gramatica-alg-2020",
    },
    tokens,
  };
}
