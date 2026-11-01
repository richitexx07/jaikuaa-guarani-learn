/**
 * Bienvenida («Tu primera palabra en 30 segundos»): se muestra una sola vez,
 * solo a cuentas nuevas (creadas hace menos de 2 días) que todavía no la vieron en este celular.
 */
const KEY = "jaikuaa:bienvenida-vista";
const NEW_ACCOUNT_MS = 2 * 24 * 60 * 60 * 1000;

export function markWelcomeSeen() {
  try { localStorage.setItem(KEY, "1"); } catch { /* sin almacenamiento */ }
}

export function welcomeSeen(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return true; }
}

/** ¿Hay que mandar a esta cuenta a la bienvenida? */
export function shouldShowWelcome(createdAt: string | undefined, seen: boolean, now = Date.now()): boolean {
  if (seen || !createdAt) return false;
  const t = Date.parse(createdAt);
  return Number.isFinite(t) && now - t >= 0 && now - t < NEW_ACCOUNT_MS;
}
