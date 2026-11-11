/**
 * Una sola voz a la vez en toda la app.
 * - Cada pedido de audio saca un «turno». Si mientras se busca el audio llega otro pedido (el usuario pasó a la
 *   siguiente palabra o paciente), el viejo ya no suena: nunca aparece un audio atrasado.
 * - Al empezar una voz se corta la anterior: nunca se enciman dos audios.
 * - Al cambiar de pantalla o esconder la app, se calla.
 */
let turno = 0;
let actual: HTMLAudioElement | null = null;
let soltarActual: (() => void) | null = null;

/** Pide turno para un audio que todavía hay que buscar. */
export function pedirTurno(): number {
  return ++turno;
}

/** ¿Sigue siendo el último pedido? */
export function sigueVigente(t: number): boolean {
  return t === turno;
}

/** Corta lo que esté sonando y deja sin efecto los pedidos que todavía están buscando su audio. */
export function callarVoz(): void {
  turno++;
  cortar();
}

function cortar() {
  const a = actual;
  actual = null;
  const soltar = soltarActual;
  soltarActual = null;
  try {
    a?.pause();
  } catch {
    /* nada */
  }
  soltar?.();
}

/**
 * Hace sonar `src` si el turno sigue vigente, cortando la voz anterior.
 * Devuelve una promesa que termina cuando el audio termina (o lo corta otro). `false` solo si falló al reproducir.
 * Con `alEmpezar`, la promesa termina apenas arranca (para quien no necesita esperar el final).
 */
export function sonarUnico(src: string, t: number, alEmpezar = false, rate = 1): Promise<boolean> {
  if (typeof Audio === "undefined" || !sigueVigente(t)) return Promise.resolve(true);
  cortar();
  return new Promise<boolean>((resolve) => {
    let listo = false;
    const fin = (ok: boolean) => {
      if (listo) return;
      listo = true;
      if (actual === audio) {
        actual = null;
        soltarActual = null;
      }
      resolve(ok);
    };
    const audio = new Audio(src);
    if (rate && rate !== 1) {
      audio.playbackRate = rate;
      const pitched = audio as HTMLAudioElement & {
        preservesPitch?: boolean;
        mozPreservesPitch?: boolean;
        webkitPreservesPitch?: boolean;
      };
      if ("preservesPitch" in pitched) pitched.preservesPitch = true;
      if ("mozPreservesPitch" in pitched) pitched.mozPreservesPitch = true;
      if ("webkitPreservesPitch" in pitched) pitched.webkitPreservesPitch = true;
    }
    actual = audio;
    soltarActual = () => fin(true);
    audio.onended = () => fin(true);
    audio.onerror = () => fin(false);
    try {
      const p = audio.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          if (alEmpezar) fin(true);
        }).catch(() => fin(false));
      } else if (alEmpezar) fin(true);
    } catch {
      fin(false);
    }
  });
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("pagehide", callarVoz);
  if (typeof document !== "undefined")
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") callarVoz();
    });
}
