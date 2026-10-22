import { evaluateGate, sanitizeGateText, type GateResult, type MotorOutcome } from "@/lib/deterministic-gate";

/** Consulta el motor HFST de Alan (secretos ALAN_MOTOR_URL / ALAN_MOTOR_TOKEN). Nunca lanza. */
export async function callAlanMotor(text: string): Promise<MotorOutcome> {
  const url = process.env.ALAN_MOTOR_URL;
  const token = process.env.ALAN_MOTOR_TOKEN;
  if (!url || !token) return { status: "apagado" };
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
    if (!res.ok) return { status: "error", message: `Error de conexión con el motor HFST (HTTP ${res.status})` };
    const body: unknown = await res.json().catch(() => null);
    const parsed = parseMotorResponse(body);
    if (!parsed.ok) return { status: "error", message: parsed.error };
    return { status: "ok", response: parsed.value };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { status: "error", message: aborted ? "El motor HFST no respondió en 4 segundos" : "No se pudo conectar con el motor HFST" };
  } finally {
    clearTimeout(timer);
  }
}

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
