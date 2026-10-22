// Trabajo del piloto hecho sin señal: aprobaciones del docente, avisos de error y palabras que
// verifica el estudiante en práctica. Se guarda primero en el teléfono y se envía solo al volver la señal.

import { quickValidateWord } from "./corpus.functions";
import { reportContentError } from "./content-reports.functions";
import { proposeContent } from "./validation-circuit.functions";
import { PENDING_EVENT } from "./gamification";
import { isNetworkError } from "./offline-data";

const VAL_KEY = "jaikuaa:pending-validations";
const REP_KEY = "jaikuaa:pending-reports";
const PROP_KEY = "jaikuaa:pending-proposals";
const FAIL_KEY = "jaikuaa:proposal-failures";
const MAX = 500;

export type QueuedValidation = { id: string; gn: string; at: string };
export type QueuedReport = {
  gn: string;
  es: string;
  lugar: string;
  tipo: "escritura" | "significado" | "audio" | "otro";
  mensaje: string;
};
export type QueuedProposal = { gn: string; es: string; notes: string; source: string; at: string };
export type ProposalFailure = { gn: string; error: string; at: string };

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}
function write(key: string, list: unknown[]) {
  try {
    if (list.length) window.localStorage.setItem(key, JSON.stringify(list.slice(-MAX)));
    else window.localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent(PENDING_EVENT));
  } catch {}
}

/** Errores que se reintentan: sin señal o sesión que se renueva sola. */
function retryable(e: unknown): boolean {
  return isNetworkError(e) || /unauthori|jwt|token/i.test(String((e as Error)?.message ?? ""));
}

/* ------------------------------- Aprobaciones del docente ------------------------------- */

export function queueValidation(id: string, gn: string) {
  const list = read<QueuedValidation>(VAL_KEY);
  if (!list.some((x) => x.id === id)) write(VAL_KEY, [...list, { id, gn, at: new Date().toISOString() }]);
}

/** Quita una aprobación que todavía no salió del teléfono (botón «Deshacer»). */
export function unqueueValidation(id: string): boolean {
  const list = read<QueuedValidation>(VAL_KEY);
  const left = list.filter((x) => x.id !== id);
  if (left.length === list.length) return false;
  write(VAL_KEY, left);
  return true;
}

export function queuedValidationIds(): Set<string> {
  return new Set(read<QueuedValidation>(VAL_KEY).map((x) => x.id));
}

/* ------------------------------------ Avisos de error ------------------------------------ */

export function queueReport(r: QueuedReport) {
  write(REP_KEY, [...read<QueuedReport>(REP_KEY), r]);
}

/* ------------------------------ Palabras del estudiante en práctica ------------------------------ */

export function queueProposal(p: Omit<QueuedProposal, "at">) {
  const list = read<QueuedProposal>(PROP_KEY);
  if (!list.some((x) => x.gn === p.gn)) write(PROP_KEY, [...list, { ...p, at: new Date().toISOString() }]);
}

export function queuedProposalWords(): Set<string> {
  return new Set(read<QueuedProposal>(PROP_KEY).map((x) => x.gn));
}

/** Palabras guardadas sin señal que el servidor no aceptó (por ejemplo, ya estaban en el corpus). */
export function proposalFailures(): ProposalFailure[] {
  return read<ProposalFailure>(FAIL_KEY);
}
export function clearProposalFailures() {
  write(FAIL_KEY, []);
}

/* ------------------------------------------ Envío ------------------------------------------ */

export function staffPendingCount(): number {
  return read(VAL_KEY).length + read(REP_KEY).length + read(PROP_KEY).length;
}

export async function flushStaff(): Promise<void> {
  const vals = read<QueuedValidation>(VAL_KEY);
  if (vals.length) {
    const left: QueuedValidation[] = [];
    for (const v of vals) {
      try {
        await quickValidateWord({ data: { id: v.id, action: "approve" } });
      } catch (e) {
        if (retryable(e)) left.push(v);
      }
    }
    // Lo que se agregó mientras se enviaba se conserva.
    const added = read<QueuedValidation>(VAL_KEY).filter((x) => !vals.some((v) => v.id === x.id));
    write(VAL_KEY, [...left, ...added]);
  }

  const reps = read<QueuedReport>(REP_KEY);
  if (reps.length) {
    const left: QueuedReport[] = [];
    for (const r of reps) {
      try {
        await reportContentError({ data: r });
      } catch (e) {
        if (retryable(e)) left.push(r);
      }
    }
    write(REP_KEY, [...left, ...read<QueuedReport>(REP_KEY).slice(reps.length)]);
  }

  const props = read<QueuedProposal>(PROP_KEY);
  if (props.length) {
    const left: QueuedProposal[] = [];
    const failed: ProposalFailure[] = [];
    for (const p of props) {
      try {
        const r = await proposeContent({
          data: { kind: "nueva", targetWordId: null, gn: p.gn, es: p.es, notes: p.notes, source: p.source },
        });
        if (!r.ok) {
          // Límite del día: se intenta de nuevo más tarde. Otro motivo: se avisa en el panel.
          if (/máximo/i.test(r.error)) left.push(p);
          else failed.push({ gn: p.gn, error: r.error, at: new Date().toISOString() });
        }
      } catch (e) {
        if (retryable(e)) left.push(p);
        else failed.push({ gn: p.gn, error: "No se pudo enviar.", at: new Date().toISOString() });
      }
    }
    const added = read<QueuedProposal>(PROP_KEY).filter((x) => !props.some((p) => p.gn === x.gn));
    write(PROP_KEY, [...left, ...added]);
    if (failed.length) write(FAIL_KEY, [...proposalFailures(), ...failed].slice(-50));
  }
}
