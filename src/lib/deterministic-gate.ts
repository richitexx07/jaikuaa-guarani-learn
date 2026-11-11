/**
 * Barrera determinista: decide si el motor HFST ACEPTÓ explícitamente una entrada.
 * Todo lo que no sea una aceptación explícita bloquea (apagado, error, sin análisis, vacío).
 * Ningún motor probabilístico ni IA puede anular este resultado.
 */
import type { MotorResponse } from "@/lib/morph/motor-contract";

export type GateResult = { accepted: true; fuente?: string } | { accepted: false; reason: string };

export type MotorOutcome =
  | { status: "apagado" }
  | { status: "error"; message: string }
  | { status: "ok"; response: MotorResponse };

const ACCEPTED_STATES = new Set(["una_lectura", "resuelta"]);

export function sanitizeGateText(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function evaluateGate(text: string, outcome: MotorOutcome): GateResult {
  if (!sanitizeGateText(text)) return { accepted: false, reason: "La palabra está vacía." };
  if (outcome.status === "apagado") return { accepted: false, reason: "todavía no está conectado." };
  if (outcome.status === "error") return { accepted: false, reason: `El motor determinista falló: ${outcome.message}` };
  const tokens = outcome.response.tokens;
  if (!tokens.length) return { accepted: false, reason: "El motor no devolvió análisis (tokens vacíos)." };
  for (const t of tokens) {
    if (!t.lecturas.length || !ACCEPTED_STATES.has(t.estado)) {
      return { accepted: false, reason: `El motor no aceptó «${t.superficie}» (estado: ${t.estado}).` };
    }
  }
  const fuentes = [...new Set(tokens.map((t) => t.lecturas[t.seleccion ?? 0]?.procedencia).filter((f): f is string => !!f))];
  return fuentes.length ? { accepted: true, fuente: fuentes.join(", ") } : { accepted: true };
}
