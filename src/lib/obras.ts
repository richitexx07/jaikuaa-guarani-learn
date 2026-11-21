/**
 * Reglas puras de la tienda de obras (libros y módulos de especialización), sin servidor, para poder probarlas.
 * - Un autor solo edita SU obra, y solo mientras no está publicada y está en borrador u observada.
 * - Nada se publica sin la autorización escrita del autor (la marca el administrador).
 * - Las páginas de un autor solo pueden apuntar a archivos de SU obra en el depósito «libros».
 */
import { partirRuta } from "@/lib/libros";

export const TIPOS_OBRA = ["libro", "modulo", "curso"] as const;
export type TipoObra = (typeof TIPOS_OBRA)[number];

export const TIPO_NOMBRE: Record<TipoObra, string> = {
  libro: "Libro",
  modulo: "Módulo de especialización",
  curso: "Curso con video",
};

/** En qué lengua está la obra. */
export const VARIANTES = ["guarani", "jopara", "bilingue", "castellano"] as const;
export type Variante = (typeof VARIANTES)[number];

export const VARIANTE_NOMBRE: Record<Variante, string> = {
  guarani: "En guaraní",
  jopara: "En jopará",
  bilingue: "Bilingüe guaraní y castellano",
  castellano: "En castellano",
};

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

/* ───────────────────────── Catálogo: buscador y filtros ───────────────────────── */

/** Minúsculas y sin tildes, para buscar «medico» y encontrar «Médico». */
export function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export type FiltroCatalogo = { texto?: string; tipo?: TipoObra | null; area?: Area | null; variante?: Variante | null; impreso?: boolean };
export type ObraFiltrable = { titulo: string; autor: string; descripcion: string; tipo: TipoObra; area: Area | null; variante: Variante | null; precioFisicoGs: number | null };

/** Filtra el catálogo: todas las palabras buscadas tienen que aparecer (en título, autor, descripción o rubro). */
export function filtrarObras<T extends ObraFiltrable>(obras: readonly T[], f: FiltroCatalogo): T[] {
  const palabras = normalizar(f.texto ?? "").split(/\s+/).filter(Boolean);
  return obras.filter((o) => {
    if (f.tipo && o.tipo !== f.tipo) return false;
    if (f.area && o.area !== f.area) return false;
    if (f.variante && o.variante !== f.variante) return false;
    if (f.impreso && !o.precioFisicoGs) return false;
    if (palabras.length === 0) return true;
    const pajar = normalizar([o.titulo, o.autor, o.descripcion, o.area ? AREA_NOMBRE[o.area] : ""].join(" "));
    return palabras.every((w) => pajar.includes(w));
  });
}

/* ───────────────────────── Vitrina del autor ───────────────────────── */

/** «María José Benítez» → «maria-jose-benitez» (para jaikuaa.com/autor/…). */
export function slugAutor(nombre: string): string {
  return normalizar(nombre)
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

/* ───────────────────────── Cursos: video de YouTube ───────────────────────── */

/** Saca el id (11 caracteres) de un enlace de YouTube. Cualquier otra cosa → null. */
export function idYoutube(entrada: string | null | undefined): string | null {
  const t = (entrada ?? "").trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m ? m[1] : null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/* ───────────────────────── Reparto: afiliados y saldos ───────────────────────── */

/**
 * A quién se le acredita la venta como embajador: primero el código con el que llegó a comprar,
 * si no, quien lo invitó a Jaikuaa. Nunca el mismo comprador.
 */
export function elegirAfiliado(o: { comprador: string; porCodigo: string | null; invitadoPor: string | null }): string | null {
  for (const c of [o.porCodigo, o.invitadoPor]) if (c && c !== o.comprador) return c;
  return null;
}

export type VentaReparto = { montoGs: number; autorId: string | null; pctAutor: number | null; afiliadoId: string | null; pctAfiliado: number | null };
export type Liquidacion = { beneficiarioId: string; rol: "autor" | "afiliado"; montoGs: number };
export type Saldo = { id: string; rol: "autor" | "afiliado"; ventas: number; devengadoGs: number; pagadoGs: number; saldoGs: number };

/**
 * Cuánto le corresponde a cada autor y embajador por las ventas cobradas, cuánto ya se le pagó y cuánto se le debe.
 * La parte del autor sale de su porcentaje de contrato; la del embajador sale de la parte de Jaikuaa.
 */
export function calcularSaldos(ventas: readonly VentaReparto[], pagos: readonly Liquidacion[]): Saldo[] {
  const m = new Map<string, Saldo>();
  const fila = (id: string, rol: Saldo["rol"]) => {
    const k = `${rol}|${id}`;
    let f = m.get(k);
    if (!f) {
      f = { id, rol, ventas: 0, devengadoGs: 0, pagadoGs: 0, saldoGs: 0 };
      m.set(k, f);
    }
    return f;
  };
  for (const v of ventas) {
    if (v.autorId && v.pctAutor !== null) {
      const f = fila(v.autorId, "autor");
      f.ventas += 1;
      f.devengadoGs += Math.round((v.montoGs * v.pctAutor) / 100);
    }
    if (v.afiliadoId && v.pctAfiliado) {
      const f = fila(v.afiliadoId, "afiliado");
      f.ventas += 1;
      f.devengadoGs += Math.round((v.montoGs * v.pctAfiliado) / 100);
    }
  }
  for (const p of pagos) fila(p.beneficiarioId, p.rol).pagadoGs += p.montoGs;
  for (const f of m.values()) f.saldoGs = f.devengadoGs - f.pagadoGs;
  return [...m.values()].sort((a, b) => b.saldoGs - a.saldoGs);
}

/* ───────────────────────── Pedidos impresos ───────────────────────── */

export const ESTADOS_PEDIDO = ["esperando_pago", "por_enviar", "enviado", "entregado", "cancelado"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const ESTADO_PEDIDO_NOMBRE: Record<EstadoPedido, string> = {
  esperando_pago: "Esperando el pago",
  por_enviar: "Pagado, por enviar",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Qué cambios de estado puede hacer el administrador a mano (el pago lo confirma solo Pagopar). */
export function puedePasarPedido(de: EstadoPedido, a: EstadoPedido): boolean {
  const ok: Record<EstadoPedido, EstadoPedido[]> = {
    esperando_pago: ["cancelado"],
    por_enviar: ["enviado", "cancelado"],
    enviado: ["entregado", "por_enviar"],
    entregado: ["enviado"],
    cancelado: [],
  };
  return ok[de].includes(a);
}
