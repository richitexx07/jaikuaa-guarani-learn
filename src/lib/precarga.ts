/**
 * Precargas «de cortesía» (juegos pesados que todavía no se abrieron): solo cuando el celular está libre
 * y la conexión lo permite. Con «ahorro de datos» o señal muy lenta no se baja nada de más.
 */
type Conexion = { saveData?: boolean; effectiveType?: string };

export function conexionAguanta(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: Conexion }).connection;
  if (!c) return true;
  if (c.saveData) return false;
  return c.effectiveType !== "slow-2g" && c.effectiveType !== "2g";
}

/** Corre `fn` cuando el celular termina lo urgente (sin trabar la pantalla que se está usando). */
export function cuandoEsteLibre(fn: () => void, demoraMs = 1200): () => void {
  if (typeof window === "undefined" || !conexionAguanta()) return () => {};
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  let idle: number | undefined;
  const t = window.setTimeout(() => {
    if (w.requestIdleCallback) idle = w.requestIdleCallback(fn, { timeout: 3000 });
    else fn();
  }, demoraMs);
  return () => {
    window.clearTimeout(t);
    if (idle !== undefined) w.cancelIdleCallback?.(idle);
  };
}
