/**
 * Mercado Jaikuaa: reglas puras (sin servidor) del mercado de todo el ecosistema, para poder probarlas.
 * - Catálogo unificado: obras de la Librería («obra») y productos del resto del ecosistema («producto»).
 * - Carrito con varios productos que se paga una sola vez; el descuento de un cupón se reparte entre los productos
 *   para que la suma de lo cobrado sea exactamente el total.
 */
import { normalizar } from "@/lib/obras";

export const CATEGORIAS = ["libros", "modulos", "cursos", "artesania", "musica", "clases", "traducciones", "experiencias", "empresas", "otros"] as const;
export type Categoria = (typeof CATEGORIAS)[number];
/** Las que se cargan como producto del Mercado (las otras son obras de la Librería). */
export const CATEGORIAS_PRODUCTO = ["artesania", "musica", "clases", "traducciones", "experiencias", "empresas", "otros"] as const;
export type CategoriaProducto = (typeof CATEGORIAS_PRODUCTO)[number];

export const CATEGORIA_NOMBRE: Record<Categoria, string> = {
  libros: "Libros",
  modulos: "Módulos de especialización",
  cursos: "Cursos",
  artesania: "Artesanía",
  musica: "Música y artistas",
  clases: "Clases",
  traducciones: "Traducciones",
  experiencias: "Experiencias",
  empresas: "Para empresas",
  otros: "Otros",
};

export const ENTREGAS = ["fisico", "digital", "servicio", "experiencia", "cotizacion"] as const;
export type Entrega = (typeof ENTREGAS)[number];

export const ENTREGA_NOMBRE: Record<Entrega, string> = {
  fisico: "Producto con envío",
  digital: "Archivo para descargar",
  servicio: "Servicio (clase, traducción, contratación)",
  experiencia: "Experiencia con fecha",
  cotizacion: "A cotizar (empresas e instituciones)",
};

export type ItemTipo = "obra" | "producto";

export type ItemMercado = {
  tipo: ItemTipo;
  id: string;
  titulo: string;
  descripcion: string;
  categoria: Categoria;
  entrega: Entrega | "lectura";
  precioGs: number | null;
  precioAnteriorGs: number | null;
  foto: string | null;
  vendedor: string;
  vendedorSlug: string | null;
  ciudad: string;
  fechaEvento: string | null;
  estrellas: number | null;
  resenas: number;
  ventas: number;
  creado: string;
  destacado: boolean;
  agotado: boolean;
};

export const ORDENES = ["relevancia", "nuevos", "precio_asc", "precio_desc", "valorados"] as const;
export type Orden = (typeof ORDENES)[number];
export const ORDEN_NOMBRE: Record<Orden, string> = {
  relevancia: "Más relevantes",
  nuevos: "Más nuevos",
  precio_asc: "Menor precio",
  precio_desc: "Mayor precio",
  valorados: "Mejor valorados",
};

export type FiltroMercado = { texto?: string; categoria?: Categoria | null; precioMax?: number | null; conStock?: boolean };

export function filtrarMercado<T extends ItemMercado>(items: readonly T[], f: FiltroMercado): T[] {
  const palabras = normalizar(f.texto ?? "").split(/\s+/).filter(Boolean);
  return items.filter((i) => {
    if (f.categoria && i.categoria !== f.categoria) return false;
    if (f.precioMax && (i.precioGs === null || i.precioGs > f.precioMax)) return false;
    if (f.conStock && i.agotado) return false;
    if (palabras.length === 0) return true;
    const pajar = normalizar([i.titulo, i.descripcion, i.vendedor, i.ciudad, CATEGORIA_NOMBRE[i.categoria]].join(" "));
    return palabras.every((w) => pajar.includes(w));
  });
}

/** Puntaje de relevancia: destacados, valoración (con peso por cantidad de opiniones), ventas y novedad. */
function relevancia(i: ItemMercado, ahora: number): number {
  const dias = Math.max(0, (ahora - new Date(i.creado).getTime()) / 86_400_000);
  const valor = i.estrellas === null ? 3 : i.estrellas;
  return (i.destacado ? 50 : 0) + valor * Math.min(i.resenas, 20) + Math.log1p(i.ventas) * 8 + Math.max(0, 30 - dias) / 3 - (i.agotado ? 100 : 0);
}

export function ordenarMercado<T extends ItemMercado>(items: readonly T[], orden: Orden, ahora = Date.now()): T[] {
  const sinPrecio = (p: number | null, alto: boolean) => (p === null ? (alto ? -1 : Number.MAX_SAFE_INTEGER) : p);
  const copia = [...items];
  switch (orden) {
    case "nuevos":
      return copia.sort((a, b) => (a.creado < b.creado ? 1 : -1));
    case "precio_asc":
      return copia.sort((a, b) => sinPrecio(a.precioGs, false) - sinPrecio(b.precioGs, false));
    case "precio_desc":
      return copia.sort((a, b) => sinPrecio(b.precioGs, true) - sinPrecio(a.precioGs, true));
    case "valorados":
      return copia.sort((a, b) => (b.estrellas ?? 0) - (a.estrellas ?? 0) || b.resenas - a.resenas);
    default:
      return copia.sort((a, b) => relevancia(b, ahora) - relevancia(a, ahora));
  }
}

/** Promedio de estrellas con un decimal (null si no hay opiniones). */
export function promedioEstrellas(estrellas: readonly number[]): number | null {
  if (estrellas.length === 0) return null;
  return Math.round((estrellas.reduce((s, x) => s + x, 0) / estrellas.length) * 10) / 10;
}

/* ───────────────────────── Carrito ───────────────────────── */

export type LineaCarrito = { tipo: ItemTipo; id: string; cantidad: number };
export const MAX_LINEAS = 20;
export const MAX_CANTIDAD = 10;

const clave = (l: Pick<LineaCarrito, "tipo" | "id">) => `${l.tipo}:${l.id}`;

/** Agrega (o suma) una línea. Las obras digitales van de a una. */
export function agregarAlCarrito(carrito: readonly LineaCarrito[], l: LineaCarrito): LineaCarrito[] {
  const tope = l.tipo === "obra" ? 1 : MAX_CANTIDAD;
  const out = carrito.map((x) => ({ ...x }));
  const ya = out.find((x) => clave(x) === clave(l));
  if (ya) ya.cantidad = Math.min(tope, ya.cantidad + Math.max(1, l.cantidad));
  else if (out.length < MAX_LINEAS) out.push({ ...l, cantidad: Math.min(tope, Math.max(1, l.cantidad)) });
  return out;
}

export function cambiarCantidad(carrito: readonly LineaCarrito[], l: Pick<LineaCarrito, "tipo" | "id">, cantidad: number): LineaCarrito[] {
  if (cantidad <= 0) return carrito.filter((x) => clave(x) !== clave(l));
  const tope = l.tipo === "obra" ? 1 : MAX_CANTIDAD;
  return carrito.map((x) => (clave(x) === clave(l) ? { ...x, cantidad: Math.min(tope, Math.floor(cantidad)) } : x));
}

/** Limpia lo que venga del almacenamiento del celular: formas raras, duplicados, cantidades fuera de rango. */
export function sanearCarrito(v: unknown): LineaCarrito[] {
  if (!Array.isArray(v)) return [];
  let out: LineaCarrito[] = [];
  for (const x of v) {
    if (!x || typeof x !== "object") continue;
    const { tipo, id, cantidad } = x as Record<string, unknown>;
    if ((tipo !== "obra" && tipo !== "producto") || typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) continue;
    out = agregarAlCarrito(out, { tipo, id, cantidad: typeof cantidad === "number" && Number.isFinite(cantidad) ? cantidad : 1 });
  }
  return out;
}

/* ───────────────────────── Cupones y totales ───────────────────────── */

export type Cupon = { codigo: string; porcentaje: number; vence: string | null; usosMax: number | null; usos: number; activo: boolean };

export function cuponValido(c: Cupon | null, hoy: string): { ok: true } | { ok: false; motivo: string } {
  if (!c || !c.activo) return { ok: false, motivo: "Ese cupón no existe." };
  if (c.vence && hoy > c.vence) return { ok: false, motivo: "Ese cupón ya venció." };
  if (c.usosMax !== null && c.usos >= c.usosMax) return { ok: false, motivo: "Ese cupón ya se usó todas las veces posibles." };
  return { ok: true };
}

/**
 * Reparte el descuento entre las líneas, proporcional a su monto, para que la suma cobrada sea exacta.
 * Ninguna línea queda por debajo del mínimo que acepta el cobro (1.000 Gs.).
 */
export function aplicarDescuento(montos: readonly number[], porcentaje: number, minimo = 1000): { montos: number[]; descuento: number } {
  const bruto = montos.reduce((s, m) => s + m, 0);
  const pct = Math.min(90, Math.max(0, porcentaje));
  const objetivo = Math.round((bruto * pct) / 100);
  const out = montos.map((m) => Math.max(Math.min(m, minimo), m - Math.floor((m * pct) / 100)));
  let resta = bruto - objetivo - out.reduce((s, m) => s + m, 0);
  // Ajuste de centavos por redondeo: se corrige en la línea más grande que lo permita.
  const orden = out.map((_, i) => i).sort((a, b) => out[b] - out[a]);
  for (const i of orden) {
    if (resta === 0) break;
    const nuevo = out[i] + resta;
    if (nuevo >= Math.min(montos[i], minimo) && nuevo <= montos[i]) {
      out[i] = nuevo;
      resta = 0;
    }
  }
  return { montos: out, descuento: bruto - out.reduce((s, m) => s + m, 0) };
}

/** Normaliza un código de cupón: mayúsculas, sin espacios ni signos. */
export function normalizarCupon(c: string | null | undefined): string | null {
  const t = (c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{3,20}$/.test(t) ? t : null;
}

/** ¿Hay stock suficiente? (null = sin límite). */
export function hayStock(stock: number | null, cantidad: number): boolean {
  return stock === null || stock >= cantidad;
}
