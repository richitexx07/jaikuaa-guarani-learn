/**
 * Reglas puras de la tienda de obras (libros y módulos de especialización), sin servidor, para poder probarlas.
 * - Un autor solo edita SU obra, y solo mientras no está publicada y está en borrador u observada.
 * - Nada se publica sin la autorización escrita del autor (la marca el administrador).
 * - Las páginas de un autor solo pueden apuntar a archivos de SU obra en el depósito «libros».
 */
import { partirRuta } from "@/lib/libros";

export const TIPOS_OBRA = ["libro", "modulo"] as const;
export type TipoObra = (typeof TIPOS_OBRA)[number];

export const AREAS = ["medico", "juridico", "financiero", "educacion", "turismo", "otro"] as const;
export type Area = (typeof AREAS)[number];

export const AREA_NOMBRE: Record<Area, string> = {
  medico: "Guaraní médico",
  juridico: "Guaraní jurídico",
  financiero: "Guaraní financiero",
  educacion: "Guaraní para docentes",
  turismo: "Guaraní para turismo",
  otro: "Otro rubro",
};

export const ESTADOS = ["borrador", "en_revision", "observado", "aprobado"] as const;
export type EstadoRevision = (typeof ESTADOS)[number];

export const ESTADO_NOMBRE: Record<EstadoRevision, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  observado: "Con observaciones",
  aprobado: "Aprobada",
};

export type ObraPermisos = { autorId: string | null; estado: EstadoRevision; publicado: boolean };

/** ¿Puede esta persona cambiar la obra (datos y páginas)? */
export function puedeEditarObra(obra: ObraPermisos, userId: string, esAdmin: boolean): boolean {
  if (esAdmin) return true;
  return obra.autorId === userId && !obra.publicado && (obra.estado === "borrador" || obra.estado === "observado");
}

/** ¿Puede verla en el lector sin haberla comprado? (administrador o su autor, para revisarla). */
export function puedeVerSinComprar(obra: Pick<ObraPermisos, "autorId">, userId: string, esAdmin: boolean): boolean {
  return esAdmin || (!!obra.autorId && obra.autorId === userId);
}

/** Sin autorización escrita del autor, la obra no se publica. */
export function puedePublicar(obra: { autorizacionFirmada: boolean }): boolean {
  return obra.autorizacionFirmada === true;
}

/** Ruta de archivo propia de la obra: solo «libros/<id de la obra>/…». */
export function esRutaDeLaObra(ruta: string | null | undefined, libroId: string): boolean {
  const p = partirRuta(ruta);
  return !!p && p.bucket === "libros" && p.path.startsWith(`${libroId}/`);
}

/** «2026-11» en hora de Paraguay. */
export function mesPy(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).slice(0, 7);
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
/** «2026-11» → «noviembre de 2026». */
export function nombreMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[(m ?? 1) - 1]} de ${y}`;
}

export type VentaPagada = { refId: string; montoGs: number; pagadoAt: string };
export type ObraVentas = { id: string; titulo: string; porcentajeAutor: number | null };
export type FilaInforme = { mes: string; obraId: string; titulo: string; ventas: number; cobradoGs: number; parteAutorGs: number | null };

/**
 * Informe para el autor: por mes y por obra, cuántas ventas, cuánto se cobró y su parte según contrato.
 * Si todavía no hay porcentaje firmado, la parte queda en null («a definir»). Meses más recientes primero.
 */
export function informeVentas(ventas: readonly VentaPagada[], obras: readonly ObraVentas[]): FilaInforme[] {
  const porId = new Map(obras.map((o) => [o.id, o]));
  const filas = new Map<string, FilaInforme>();
  for (const v of ventas) {
    const o = porId.get(v.refId);
    if (!o) continue;
    const mes = mesPy(v.pagadoAt);
    const k = `${mes}|${o.id}`;
    const f = filas.get(k) ?? { mes, obraId: o.id, titulo: o.titulo, ventas: 0, cobradoGs: 0, parteAutorGs: null };
    f.ventas += 1;
    f.cobradoGs += v.montoGs;
    filas.set(k, f);
  }
  const out = [...filas.values()];
  for (const f of out) {
    const pct = porId.get(f.obraId)?.porcentajeAutor;
    f.parteAutorGs = pct === null || pct === undefined ? null : Math.round((f.cobradoGs * pct) / 100);
  }
  return out.sort((a, b) => (a.mes === b.mes ? a.titulo.localeCompare(b.titulo) : a.mes < b.mes ? 1 : -1));
}

/** Páginas que se muestran gratis antes de comprar. */
export const MUESTRA_PAGINAS = 2;

/** Las primeras páginas de la obra (por número), para la muestra gratis. */
export function paginasDeMuestra<T extends { n: number }>(paginas: readonly T[], cuantas = MUESTRA_PAGINAS): T[] {
  return [...paginas].sort((a, b) => a.n - b.n).slice(0, Math.max(0, cuantas));
}
