/** Embajadores de Jaikuaa: reglas compartidas (XP separado del aprendizaje). */
export const REF_STORAGE_KEY = "jaikuaa_ref";
export const XP_PER_ACTIVATED_INVITE = 50;
export const MAX_REWARDED_INVITES_PER_MONTH = 20;

export const AMBASSADOR_LEVELS = [
  { min: 0, name: "Aprendiz embajador" },
  { min: 1, name: "Embajador" },
  { min: 5, name: "Embajador destacado" },
  { min: 15, name: "Embajador de honor" },
] as const;

export function levelFor(started: number) {
  let current: (typeof AMBASSADOR_LEVELS)[number] = AMBASSADOR_LEVELS[0];
  let next: (typeof AMBASSADOR_LEVELS)[number] | null = null;
  for (const l of AMBASSADOR_LEVELS) {
    if (started >= l.min) current = l;
    else if (!next) next = l;
  }
  return { current, next };
}

export function cleanRefCode(raw: string | null | undefined): string | null {
  const c = (raw ?? "").trim().toUpperCase();
  return /^[A-F0-9]{8}$/.test(c) ? c : null;
}

/**
 * Código del embajador para las compras de la Librería: dura 30 días desde que la persona entró con ?ref=,
 * aunque ya tuviera cuenta (la invitación a Jaikuaa solo cuenta para cuentas nuevas; la venta sí se le acredita).
 */
export const REF_COMPRA_KEY = "jaikuaa_ref_compra";
const REF_COMPRA_DIAS = 30;

export function guardarRefCompra(code: string, ahora = Date.now()): void {
  try {
    localStorage.setItem(REF_COMPRA_KEY, JSON.stringify({ code, t: ahora }));
  } catch {
    /* sin almacenamiento */
  }
}

export function leerRefCompra(ahora = Date.now()): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(REF_COMPRA_KEY) ?? "null") as { code?: string; t?: number } | null;
    if (!v?.code || typeof v.t !== "number" || ahora - v.t > REF_COMPRA_DIAS * 24 * 3600_000) return null;
    return cleanRefCode(v.code);
  } catch {
    return null;
  }
}
