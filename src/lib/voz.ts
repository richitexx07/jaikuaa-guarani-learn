/**
 * «Grabate y compará»: utilidades puras para dibujar la forma de la voz.
 * No hay nota ni corrección automática: el alumno compara con el oído y con la vista.
 */

/** Resume una señal de audio en `barras` alturas entre 0 y 1 (pico de cada tramo, normalizado). */
export function picos(samples: Float32Array, barras = 48): number[] {
  if (samples.length === 0 || barras <= 0) return [];
  const tramo = Math.max(1, Math.floor(samples.length / barras));
  const out: number[] = [];
  for (let b = 0; b < barras; b++) {
    let max = 0;
    const ini = b * tramo;
    const fin = Math.min(samples.length, ini + tramo);
    for (let i = ini; i < fin; i++) {
      const v = Math.abs(samples[i]);
      if (v > max) max = v;
    }
    out.push(max);
  }
  const tope = Math.max(...out);
  return tope > 0 ? out.map((v) => v / tope) : out;
}

/** Recorta el silencio del principio y del final para que las dos voces se alineen mejor. */
export function recortarSilencio(alturas: number[], umbral = 0.08): number[] {
  let ini = 0;
  let fin = alturas.length;
  while (ini < fin && alturas[ini] < umbral) ini++;
  while (fin > ini && alturas[fin - 1] < umbral) fin--;
  return alturas.slice(ini, fin);
}

/** Lleva una lista de alturas a `n` barras (estira o achica), para comparar dos voces de distinto largo. */
export function aBarras(alturas: number[], n = 40): number[] {
  if (alturas.length === 0) return [];
  return Array.from({ length: n }, (_, i) => alturas[Math.min(alturas.length - 1, Math.floor((i * alturas.length) / n))]);
}

/** Duración en segundos con un decimal, para mostrar «1,2 s». */
export function segundos(s: number): string {
  return `${(Math.round(s * 10) / 10).toString().replace(".", ",")} s`;
}

/* ------------------- «Empezar»: corte automático cuando terminás de hablar ------------------- */

export type EstadoEscucha = "esperando" | "hablando" | "fin" | "sin-voz";

export type DetectorFin = {
  /** Se llama con el volumen (0 a 1) y el momento en milisegundos desde que empezó la grabación. */
  medir: (volumen: number, ms: number) => EstadoEscucha;
};

/**
 * Decide cuándo cortar la grabación sola: espera que la persona hable y corta tras un silencio corto.
 * Si nadie habla en `esperaMaxMs`, avisa «sin-voz». Nunca pasa de `maxMs`.
 */
export function detectorDeFin({
  umbral = 0.04,
  silencioMs = 900,
  esperaMaxMs = 4000,
  maxMs = 6000,
  minHablaMs = 250,
}: { umbral?: number; silencioMs?: number; esperaMaxMs?: number; maxMs?: number; minHablaMs?: number } = {}): DetectorFin {
  let inicioVoz: number | null = null;
  let ultimaVoz = 0;
  return {
    medir(volumen, ms) {
      if (volumen >= umbral) {
        if (inicioVoz === null) inicioVoz = ms;
        ultimaVoz = ms;
      }
      if (ms >= maxMs) return inicioVoz === null ? "sin-voz" : "fin";
      if (inicioVoz === null) return ms >= esperaMaxMs ? "sin-voz" : "esperando";
      // Un ruido cortito (un golpe, un clic) no cuenta como haber hablado.
      if (ultimaVoz - inicioVoz < minHablaMs && ms - ultimaVoz >= silencioMs) {
        inicioVoz = null;
        return ms >= esperaMaxMs ? "sin-voz" : "esperando";
      }
      return ms - ultimaVoz >= silencioMs ? "fin" : "hablando";
    },
  };
}
