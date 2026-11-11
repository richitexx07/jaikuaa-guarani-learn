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

/**
 * Fuentes con las que el motor confirma que una palabra o una raíz existe. Solo fuentes hechas por
 * personas: el vocabulario de Jaikuaa que cargaron los docentes, el Diccionario de la Academia (SPL)
 * y las formas que imprime la Gramática ALG 2020. Devuelve el nombre de la fuente o null.
 * Sin fuentes, el motor solo descompone y nunca da una palabra por reconocida.
 */
export interface FuentesMotor {
  conoce(palabra: string): string | null;
}

const sinTilde = (s: string) => s.normalize("NFD").replace(/\u0301/g, "").normalize("NFC");

export function analyzeLocalMotor(text: string, fuentes?: FuentesMotor): MotorResponse {
  const matches = Array.from(text.matchAll(WORD_RE));
  const tokens: MotorToken[] = [];

  for (const match of matches) {
    const surface = match[0];
    const norm = normalizeWord(surface);
    if (!norm) continue;

    const lecturas: MotorReading[] = [];

    // 1. Clases cerradas impresas en la Gramática (pronombres, partículas, posposiciones sueltas).
    for (const c of lookupClosed(norm)) {
      lecturas.push({
        raiz: norm,
        lema: c.entry.form,
        categoria: c.entry.cls,
        persona: c.entry.person ?? null,
        negacion: false,
        prefijos: [],
        sufijos: [],
        analisis_crudo: `${norm}[${c.entry.cls}]`,
        rango: lecturas.length + 1,
        peso: null,
        paginas: [c.entry.page],
        procedencia: "gramatica-alg-2020",
      });
    }
    const cerrada = lecturas.length > 0;

    // 2. La palabra entera en una fuente hecha por personas.
    const fuenteEntera = cerrada ? null : (fuentes?.conoce(norm) ?? null);
    if (fuenteEntera) {
      lecturas.push({
        raiz: norm,
        lema: norm,
        categoria: "palabra_atestiguada",
        persona: null,
        negacion: false,
        prefijos: [],
        sufijos: [],
        analisis_crudo: `${norm}[${fuenteEntera}]`,
        rango: lecturas.length + 1,
        peso: null,
        paginas: [],
        procedencia: fuenteEntera,
      });
    }

    // 3. Descomposición por reglas (verbal y nominal), quedándose solo con las de raíz atestiguada.
    const candidatas: MotorReading[] = [];
    if (!cerrada) {
      for (const v of analyze(norm)) candidatas.push(verbalToReading(v, candidatas.length));
      for (const n of analyzeNominal(norm)) candidatas.push(nominalToReading(n, candidatas.length));
    }
    const conRaiz: MotorReading[] = [];
    for (const l of candidatas) {
      if (!fuentes || l.raiz === norm) continue; // sin prefijos ni sufijos no hay nada que descomponer
      const f = fuentes.conoce(l.raiz) ?? fuentes.conoce(sinTilde(l.raiz));
      if (f) conRaiz.push({ ...l, procedencia: `raiz:${f}`, rango: lecturas.length + conRaiz.length + 1 });
    }

    // Deduplicación de lecturas equivalentes
    const unicas: MotorReading[] = [];
    const seen = new Set<string>();
    for (const l of [...lecturas, ...conRaiz]) {
      const k = `${l.categoria}|${l.raiz}|${l.analisis_crudo}`;
      if (!seen.has(k)) {
        seen.add(k);
        unicas.push({ ...l, rango: unicas.length + 1 });
      }
    }

    // Si la palabra entera está en una fuente o es de clase cerrada, eso decide (evidencia, no adivinanza).
    let estado: ReadingStatus;
    let seleccion: number | null = null;
    let metodo: string;
    if (unicas.length === 0) {
      estado = "sin_analisis";
      metodo = "sin-fuente";
    } else if (unicas.length === 1) {
      estado = "una_lectura";
      seleccion = 0;
      metodo = cerrada ? "clase-cerrada" : fuenteEntera ? "palabra-atestiguada" : "raiz-atestiguada";
    } else if (cerrada || fuenteEntera) {
      estado = "resuelta";
      seleccion = 0;
      metodo = cerrada ? "clase-cerrada" : "palabra-atestiguada";
    } else {
      estado = "sin_resolver";
      metodo = "raiz-atestiguada";
    }

    tokens.push({ superficie: surface, normalizada: norm, lecturas: unicas, seleccion, estado, metodo });
  }

  return {
    version_contrato: CONTRACT_VERSION,
    motor: {
      nombre: "jaikuaa-determinista-nativo",
      version: "1.1",
      transductor: fuentes ? "gramatica-alg-2020+fuentes" : "gramatica-alg-2020",
    },
    tokens,
  };
}
