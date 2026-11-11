import { evaluateGate, sanitizeGateText, type GateResult, type MotorOutcome } from "@/lib/deterministic-gate";
import { analyzeLocalMotor } from "@/lib/morph/motor-local";

/**
 * Motor determinista unificado de Jaikuaa (versión 1.0).
 * Autosuficiente: analiza palabras en memoria con las reglas de la Gramática ALG 2020.
 * Si los secretos ALAN_MOTOR_URL y ALAN_MOTOR_TOKEN están configurados, consulta opcionalmente el servicio externo;
 * si no están o si la red falla, el motor determinista nativo responde de inmediato en <1 ms.
 */
export async function callMotor(text: string): Promise<MotorOutcome> {
  const url = process.env.ALAN_MOTOR_URL;
  const token = process.env.ALAN_MOTOR_TOKEN;

  if (url && token) {
    const { parseMotorResponse } = await import("@/lib/morph/motor-contract");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${url.replace(/\/+$/, "")}/v1/analizar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ texto: text }),
        signal: controller.signal,
      });
      if (res.ok) {
        const body: unknown = await res.json().catch(() => null);
        const parsed = parseMotorResponse(body);
        if (parsed.ok) return { status: "ok", response: parsed.value };
      }
    } catch {
      // Fallback automático al motor determinista nativo
    } finally {
      clearTimeout(timer);
    }
  }

  // Motor determinista nativo de Jaikuaa
  try {
    const response = analyzeLocalMotor(text);
    return { status: "ok", response };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Error en el análisis morfológico nativo" };
  }
}

/** Alias para mantener compatibilidad total con todas las llamadas del proyecto */
export const callAlanMotor = callMotor;

export async function checkDeterministicAcceptance(gn: string): Promise<GateResult> {
  const text = sanitizeGateText(gn);
  if (!text) return { accepted: false, reason: "La palabra está vacía." };
  return evaluateGate(text, await callAlanMotor(text));
}

/** Lanza un error con la razón exacta si el motor no aceptó explícitamente la entrada. */
export async function requireDeterministicAcceptance(gn: string): Promise<void> {
  const r = await checkDeterministicAcceptance(gn);
  if (!r.accepted) throw new Error(`Bloqueado por el motor determinista: ${r.reason}`);
}
