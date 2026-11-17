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
  /** Dónde empezó y terminó la voz (en ms), para recortar el silencio de las puntas. */
  tramo: () => { inicio: number; fin: number } | null;
};

/**
 * Decide cuándo cortar la grabación sola, pensado para cómo suena el guaraní:
 * - Mide primero el ruido del lugar (`calibraMs`) y pide una voz claramente más fuerte que ese ruido
 *   (`sobreRuido` veces), con un piso (`umbral`): así funciona en una casa callada y en una escuela con ruido.
 * - El puso (la pausa cortita de «Mba'éichapa») y el cierre de las nasales bajan el volumen un instante:
 *   por eso solo corta tras un silencio largo (`silencioMs`), mucho más largo que cualquier puso.
 * - Las vocales nasales y los finales suaves suenan más bajo: el umbral es relativo al ruido, no fijo y alto.
 * - Las palabras de una sílaba duran poco: alcanza con `minHablaMs` de voz para contar como habla;
 *   un golpe o un clic (más cortos) no cuentan.
 * Si nadie habla en `esperaMaxMs`, avisa «sin-voz». Nunca pasa de `maxMs`.
 */
export function detectorDeFin({
  umbral = 0.02,
  sobreRuido = 3,
  calibraMs = 250,
  silencioMs = 900,
  esperaMaxMs = 4000,
  maxMs = 6000,
  minHablaMs = 150,
}: {
  umbral?: number;
  sobreRuido?: number;
  calibraMs?: number;
  silencioMs?: number;
  esperaMaxMs?: number;
  maxMs?: number;
  minHablaMs?: number;
} = {}): DetectorFin {
  let inicioVoz: number | null = null;
  let ultimaVoz = 0;
  let ruido = 0;
  let muestrasRuido = 0;
  let corte = umbral;
  return {
    medir(volumen, ms) {
      if (ms < calibraMs) {
        ruido += volumen;
        muestrasRuido++;
        corte = Math.max(umbral, (ruido / muestrasRuido) * sobreRuido);
        return "esperando";
      }
      if (volumen >= corte) {
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
    tramo() {
      return inicioVoz === null ? null : { inicio: inicioVoz, fin: ultimaVoz };
    },
  };
}

/**
 * Desde dónde hasta dónde dejar la grabación (en segundos) para que quede limpia: la voz con un margen chico
 * antes (para no comerse la primera consonante, como la «mb» de «Mba'éichapa») y un poco más después
 * (las vocales finales y las nasales se apagan despacio).
 */
export function cortesLimpios(
  durSeg: number,
  tramo: { inicio: number; fin: number } | null,
  antesMs = 150,
  despuesMs = 300,
): { desde: number; hasta: number } {
  if (!tramo) return { desde: 0, hasta: durSeg };
  const desde = Math.max(0, (tramo.inicio - antesMs) / 1000);
  const hasta = Math.min(durSeg, (tramo.fin + despuesMs) / 1000);
  return hasta - desde > 0.2 ? { desde, hasta } : { desde: 0, hasta: durSeg };
}

/** Arma un archivo WAV (mono, 16 bits) con las muestras dadas, para reproducir la grabación ya recortada. */
export function wavDe(muestras: Float32Array, frecuencia: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + muestras.length * 2);
  const v = new DataView(buf);
  const txt = (o: number, t: string) => {
    for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i));
  };
  txt(0, "RIFF");
  v.setUint32(4, 36 + muestras.length * 2, true);
  txt(8, "WAVE");
  txt(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, frecuencia, true);
  v.setUint32(28, frecuencia * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  txt(36, "data");
  v.setUint32(40, muestras.length * 2, true);
  for (let i = 0; i < muestras.length; i++) {
    const x = Math.max(-1, Math.min(1, muestras[i]!));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return buf;
}
