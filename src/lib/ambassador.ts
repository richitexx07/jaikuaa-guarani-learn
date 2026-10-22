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
