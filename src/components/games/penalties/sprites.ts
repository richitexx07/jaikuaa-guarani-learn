import { disenoDe, type Figura, type Kit } from "./camisetas";

/**
 * Las ilustraciones de Penales (Jai arquero, pateadores, pelota y estadio) y la camiseta pintada por país.
 * Las imágenes se piden de a una y, mientras no llegan (o si falta alguna), el estadio se dibuja como antes.
 * La camiseta del pateador viene en verde croma: acá se pinta con los colores del país, el nombre y el número,
 * respetando las luces y sombras del dibujo.
 */
const ARCHIVOS = import.meta.glob<string>("/src/assets/penales/*.webp", { eager: true, import: "default" });
function url(nombre: string): string | null {
  return ARCHIVOS[`/src/assets/penales/${nombre}.webp`] ?? null;
}

export const ARQUERO = {
  listo: url("jai-arquero-listo"),
  estirada: url("jai-arquero-estirada"),
  /** La misma estirada con las manos vacías: para cuando la pelota todavía viaja o se le escapa. */
  estiradaSinPelota: url("jai-arquero-estirada-sin-pelota"),
  atajada: url("jai-arquero-atajada"),
  vencido: url("jai-arquero-vencido"),
};
/** Mimbi en el arco: las mismas cinco poses que Jai, para cuando ataja una chica. */
export const ARQUERA = {
  listo: url("mimbi-arquera-listo"),
  estirada: url("mimbi-arquera-estirada"),
  estiradaSinPelota: url("mimbi-arquera-estirada-sin-pelota"),
  atajada: url("mimbi-arquera-atajada"),
  vencido: url("mimbi-arquera-vencido"),
};
/** Quién está en el arco: Mimbi si ataja una chica; si falta algún dibujo de Mimbi, Jai. */
export function arqueroDe(f?: Figura): typeof ARQUERO {
  return f === "chica" && ARQUERA.listo ? ARQUERA : ARQUERO;
}
export const PELOTA = url("pelota");
export const ESTADIO = url("estadio-noche");
export function pateador(f: Figura, pose: "listo" | "patea"): string | null {
  return url(f === "chica" ? `pateadora-chica-${pose}` : `pateador-chico-${pose}`);
}

/**
 * Dónde está el arco dentro de estadio-noche.webp (en píxeles de la imagen), medido a mano.
 * Medido sobre el borde de afuera de los palos y el travesaño, hasta donde los palos tocan el césped.
 * Si se cambia la imagen, hay que volver a medir: el arco del dibujo tiene que caer justo sobre el arco del juego.
 */
export const ARCO_EN_ESTADIO = { x: 352, y: 349, w: 897, h: 295 };

/* ------------------------------ carga de imágenes ------------------------------ */

const imagenes = new Map<string, HTMLImageElement>();
/** La imagen si ya cargó; si no, empieza a cargarla y devuelve null (el que dibuja usa el respaldo). */
export function imagen(src: string | null): HTMLImageElement | null {
  if (!src || typeof Image === "undefined") return null;
  let im = imagenes.get(src);
  if (!im) {
    im = new Image();
    im.decoding = "async";
    im.src = src;
    imagenes.set(src, im);
  }
  return im.complete && im.naturalWidth > 0 ? im : null;
}

export function cargar(src: string | null): Promise<HTMLImageElement | null> {
  if (!src || typeof Image === "undefined") return Promise.resolve(null);
  const ya = imagen(src);
  if (ya) return Promise.resolve(ya);
  const im = imagenes.get(src)!;
  return new Promise((ok) => {
    im.addEventListener("load", () => ok(im.naturalWidth > 0 ? im : null), { once: true });
    im.addEventListener("error", () => ok(null), { once: true });
  });
}

/* ------------------------------ la camiseta pintada ------------------------------ */

const pintadas = new Map<string, HTMLCanvasElement | "pintando">();
/** La última camiseta pintada de cada dibujo: se muestra mientras se pinta la nueva (al escribir el nombre, al cambiar de país). */
const ultima = new Map<string, HTMLCanvasElement>();
const esperando = new Map<string, Array<(c: HTMLCanvasElement | null) => void>>();

function claveKit(src: string, k: Kit) {
  return `${src}|${k.pais}|${k.especial ?? ""}|${k.nombre.trim().toUpperCase()}|${k.numero}`;
}

/** El pateador con la camiseta del país ya pintada, o null mientras se pinta. */
export function pateadorPintado(k: Kit, pose: "listo" | "patea"): HTMLCanvasElement | null {
  const src = pateador(k.figura, pose);
  if (!src) return null;
  const clave = claveKit(src, k);
  const hecho = pintadas.get(clave);
  if (hecho && hecho !== "pintando") return hecho;
  if (!hecho) void pintarCuandoCargue(src, k, clave);
  return ultima.get(src) ?? null;
}

export function pateadorPintadoAsync(k: Kit, pose: "listo" | "patea"): Promise<HTMLCanvasElement | null> {
  const src = pateador(k.figura, pose);
  if (!src) return Promise.resolve(null);
  const clave = claveKit(src, k);
  const hecho = pintadas.get(clave);
  if (hecho && hecho !== "pintando") return Promise.resolve(hecho);
  return new Promise((ok) => {
    const lista = esperando.get(clave) ?? [];
    lista.push(ok);
    esperando.set(clave, lista);
    if (!hecho) void pintarCuandoCargue(src, k, clave);
  });
}

async function pintarCuandoCargue(src: string, k: Kit, clave: string) {
  pintadas.set(clave, "pintando");
  const im = await cargar(src);
  let lienzo: HTMLCanvasElement | null = null;
  if (im) {
    try {
      // La letra de la marca, si está, para el nombre y el número.
      await document.fonts?.load?.('800 40px "Space Grotesk"').catch(() => undefined);
    } catch { /* sin fuentes */ }
    try { lienzo = pintarCamiseta(im, k); } catch { lienzo = null; }
  }
  if (lienzo) { pintadas.set(clave, lienzo); ultima.set(src, lienzo); }
  else pintadas.delete(clave);
  // No guardar demasiadas: cada una es una imagen entera.
  if (pintadas.size > 24) {
    const primera = pintadas.keys().next().value;
    if (primera && primera !== clave) pintadas.delete(primera);
  }
  (esperando.get(clave) ?? []).forEach((f) => f(lienzo));
  esperando.delete(clave);
}

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Medidas de la camiseta dentro del dibujo (sale de mirar el verde). */
export type Medidas = { x0: number; x1: number; y0: number; y1: number; cx: number; anchoTorso: number };

/** Pinta la camiseta verde croma con los colores del país, el nombre y el número. */
export function pintarCamiseta(im: HTMLImageElement, k: Kit): HTMLCanvasElement | null {
  const w = im.naturalWidth;
  const h = im.naturalHeight;
  const lienzo = document.createElement("canvas");
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(im, 0, 0);
  const datos = ctx.getImageData(0, 0, w, h);
  const px = datos.data;

  // 1) Qué píxeles son camiseta (verde croma) y cuánto.
  const peso = new Float32Array(w * h);
  const verdes: number[] = [];
  let x0 = w, x1 = 0, y0 = h, y1 = 0;
  for (let i = 0, n = w * h; i < n; i++) {
    const a = px[i * 4 + 3];
    if (a < 16) continue;
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const v = g - Math.max(r, b);
    if (v <= 28 || g < 50) continue;
    const p = Math.min(1, (v - 28) / 50);
    peso[i] = p;
    if (p > 0.7) {
      const x = i % w, y = (i / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if ((i & 7) === 0) verdes.push(g);
    }
  }
  if (verdes.length < 50) return lienzo;
  verdes.sort((a, b) => a - b);
  const gRef = verdes[Math.floor(verdes.length * 0.92)] || 255;
  const m = medir(peso, w, x0, x1, y0, y1);

  // 2) El dibujo de la camiseta del país (rayas, banda, nombre y número), del tamaño de la imagen.
  const d: { base: string; rayas?: string; banda?: string; vivo?: string; numero: string } = disenoDe(k);
  const patron = document.createElement("canvas");
  patron.width = w;
  patron.height = h;
  const pc = patron.getContext("2d", { willReadFrequently: true })!;
  pc.fillStyle = d.base;
  pc.fillRect(0, 0, w, h);
  const alto = m.y1 - m.y0;
  if (d.rayas) {
    const ancho = Math.max(6, m.anchoTorso / 6.5);
    pc.fillStyle = d.rayas;
    // Simétricas respecto de la columna: una raya de color en el centro.
    for (let x = m.cx - ancho / 2 - ancho * 12; x < w; x += ancho * 2) pc.fillRect(Math.round(x), 0, Math.round(ancho), h);
  }
  if (d.banda) {
    // De espaldas la banda baja del hombro izquierdo a la cadera derecha.
    pc.save();
    pc.translate(m.cx, m.y0 + alto * 0.5);
    pc.rotate(Math.PI / 4.2);
    pc.fillStyle = d.banda;
    pc.fillRect(-w, -alto * 0.11, w * 2, alto * 0.22);
    pc.restore();
  }
  const nombre = k.nombre.trim().toUpperCase();
  const tamNum = Math.min(alto * 0.36, m.anchoTorso * 0.62);
  const tamNom = Math.max(10, tamNum * 0.3);
  pc.textAlign = "center";
  pc.textBaseline = "middle";
  pc.lineJoin = "round";
  const fuente = (t: number) => `800 ${Math.round(t)}px "Space Grotesk", "Arial Black", system-ui, sans-serif`;
  const conBorde = !!(d.rayas || d.banda);
  if (nombre) {
    pc.font = fuente(tamNom);
    if (conBorde) {
      pc.strokeStyle = d.base;
      pc.lineWidth = tamNom * 0.28;
      pc.strokeText(nombre, m.cx, m.y0 + alto * 0.2, m.anchoTorso * 0.86);
    }
    pc.fillStyle = d.numero;
    pc.fillText(nombre, m.cx, m.y0 + alto * 0.2, m.anchoTorso * 0.86);
  }
  pc.font = fuente(tamNum);
  if (conBorde) {
    pc.strokeStyle = d.base;
    pc.lineWidth = tamNum * 0.12;
    pc.strokeText(String(k.numero), m.cx, m.y0 + alto * 0.48, m.anchoTorso * 0.8);
  }
  pc.fillStyle = d.numero;
  pc.fillText(String(k.numero), m.cx, m.y0 + alto * 0.48, m.anchoTorso * 0.8);
  const pat = pc.getImageData(0, 0, w, h).data;

  // 3) Mezcla: color del país × luz del dibujo; el borde de la camiseta lleva el ribete.
  const vivo = d.vivo ? hexRgb(d.vivo) : null;
  const borde = Math.max(3, Math.round(w / 120));
  const esCamiseta = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && peso[y * w + x] > 0.35;
  for (let y = m.y0 - 2; y <= m.y1 + 2; y++) {
    if (y < 0 || y >= h) continue;
    for (let x = m.x0 - 2; x <= m.x1 + 2; x++) {
      if (x < 0 || x >= w) continue;
      const i = y * w + x;
      const p = peso[i];
      if (p <= 0) continue;
      const o = i * 4;
      const luz = Math.max(0.22, Math.min(1.12, px[o + 1] / gRef));
      let r = pat[o], g = pat[o + 1], b = pat[o + 2];
      if (vivo && p > 0.6 && !(esCamiseta(x - borde, y) && esCamiseta(x + borde, y) && esCamiseta(x, y - borde) && esCamiseta(x, y + borde))) {
        [r, g, b] = vivo;
      }
      r = Math.min(255, r * luz);
      g = Math.min(255, g * luz);
      b = Math.min(255, b * luz);
      // En el borde suave, sacar el verde que queda del original.
      const or = px[o], ob = px[o + 2];
      const og = Math.min(px[o + 1], Math.max(or, ob));
      px[o] = or + (r - or) * p;
      px[o + 1] = og + (g - og) * p;
      px[o + 2] = ob + (b - ob) * p;
    }
  }
  ctx.putImageData(datos, 0, 0);
  return lienzo;
}

/** Dónde va la espalda: el centro de la columna y el ancho del torso a la altura del número. */
function medir(peso: Float32Array, w: number, x0: number, x1: number, y0: number, y1: number): Medidas {
  const alto = y1 - y0;
  const xs: number[] = [];
  for (let y = Math.round(y0 + alto * 0.15); y < y0 + alto * 0.6; y += 3) {
    for (let x = x0; x <= x1; x += 2) if (peso[y * w + x] > 0.7) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  const cx = xs.length ? xs[Math.floor(xs.length / 2)] : (x0 + x1) / 2;
  // Ancho del torso a la altura del número: desde la columna hacia cada lado hasta que se acaba la camiseta.
  const yN = Math.round(y0 + alto * 0.48);
  let izq = Math.round(cx), der = Math.round(cx), huecos = 0;
  while (izq > x0 && huecos < 6) { izq--; huecos = peso[yN * w + izq] > 0.35 ? 0 : huecos + 1; }
  huecos = 0;
  while (der < x1 && huecos < 6) { der++; huecos = peso[yN * w + der] > 0.35 ? 0 : huecos + 1; }
  return { x0, x1, y0, y1, cx, anchoTorso: Math.max(20, der - izq - 12) };
}

/* ------------------------------ precarga ------------------------------ */

/** Lo que tiene que estar para mostrar el estadio nuevo desde el primer cuadro. */
const ESENCIALES = [ESTADIO, ARQUERO.listo, PELOTA, pateador("chico", "listo"), pateador("chica", "listo")];
/** El resto, que se usa recién al patear. */
const RESTO = [...Object.values(ARQUERA), ARQUERO.estirada, ARQUERO.estiradaSinPelota, ARQUERO.atajada, ARQUERO.vencido, pateador("chico", "patea"), pateador("chica", "patea")];
let precargaDesde = 0;
/** Desde cuándo el juego está en pantalla esperando las ilustraciones. */
let esperaDesde = 0;

/** Empieza a bajar todas las ilustraciones de Penales (se llama al abrir Juegos, antes de entrar al juego). */
export function precargarPenales(): void {
  if (typeof Image === "undefined") return;
  if (!precargaDesde) precargaDesde = Date.now();
  for (const src of [...ESENCIALES, ...RESTO]) imagen(src);
}

/** Si una imagen ya terminó pero vino rota (sin internet, error del servidor). */
function rota(src: string | null): boolean {
  const im = src ? imagenes.get(src) : undefined;
  return !!im && im.complete && im.naturalWidth === 0;
}

/**
 * «listo»: ya se puede dibujar el estadio nuevo. «cargando»: todavía no, se muestra una pantalla de espera
 * (nunca el dibujo viejo). «respaldo»: falló algo o tardó demasiado; se juega con el dibujo simple antes que dejar esperando.
 */
/** Pasaron demasiados segundos esperando la camiseta pintada: mejor jugar igual. */
export function pintadoTarde(): boolean {
  return !!esperaDesde && Date.now() - esperaDesde > 9000;
}

export function estadoEstadio(): "listo" | "cargando" | "respaldo" {
  precargarPenales();
  if (!esperaDesde) esperaDesde = Date.now();
  const faltan = ESENCIALES.filter((src) => src && !imagen(src));
  if (faltan.length === 0) return "listo";
  if (faltan.some(rota) || Date.now() - esperaDesde > 9000) return "respaldo";
  return "cargando";
}
