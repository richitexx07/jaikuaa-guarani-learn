import { evaluateGate, sanitizeGateText, type GateResult, type MotorOutcome } from "@/lib/deterministic-gate";
import { analyzeLocalMotor, type FuentesMotor } from "@/lib/morph/motor-local";

let fuentesCache: { at: number; f: FuentesMotor } | null = null;

/**
 * Fuentes hechas por personas con las que el motor de Jaikuaa confirma palabras y raíces:
 * el vocabulario publicado (docentes), el Diccionario de la Academia (SPL) y la Gramática ALG 2020.
 * Se arman una vez y duran 10 minutos.
 */
async function fuentesMotor(): Promise<FuentesMotor> {
  if (fuentesCache && Date.now() - fuentesCache.at < 10 * 60 * 1000) return fuentesCache.f;
  const [{ armarFuentes }, spl, libro] = await Promise.all([
    import("@/lib/morph/fuentes-motor"),
    import("@/lib/morph/data/spl-diccionario-alg.json"),
    import("@/lib/morph/data/gramatica-alg-2020-formas.json"),
  ]);
  let vocabulario: string[] = [];
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let desde = 0; desde < 20000; desde += 1000) {
      const { data } = await supabaseAdmin.from("corpus_words").select("gn").eq("status", "published").range(desde, desde + 999);
      const filas = (data ?? []) as { gn: string }[];
      vocabulario = vocabulario.concat(filas.map((r) => r.gn));
      if (filas.length < 1000) break;
    }
  } catch {
    /* sin base de datos: el motor sigue con el diccionario y la gramática */
  }
  const f = armarFuentes({
    vocabulario,
    diccionario: (spl as unknown as { default: { entradas: [string, string, string, number, string[]?][] } }).default.entradas,
    gramatica: (libro as unknown as { default: { forms: Record<string, number[]> } }).default.forms,
  });
  fuentesCache = { at: Date.now(), f };
  return f;
}

/**
 * Motor determinista de Jaikuaa (versión 1.1, en prueba).
 * Descompone con las reglas de la Gramática ALG 2020 y reconoce una palabra solo si ella o su raíz
 * aparecen en el vocabulario de Jaikuaa, el Diccionario de la Academia o la Gramática. Solo opina.
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

  // Motor determinista de Jaikuaa: descompone con las reglas de la Gramática y solo reconoce
  // lo que encuentra en fuentes hechas por personas.
  try {
    const response = analyzeLocalMotor(text, await fuentesMotor());
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
