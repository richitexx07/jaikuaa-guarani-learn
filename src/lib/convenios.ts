/**
 * Convenios firmados en línea (Purahéi Jaikuaa y Librería Jaikuaa).
 *
 * El texto de cada convenio vive acá, con su versión. Cuando se firma, el servidor guarda una «huella»
 * (SHA-256) del texto exacto que se aceptó: si después el abogado cambia una cláusula, se sube la versión
 * y quien ya firmó queda con la que aceptó. Nunca se escribe guaraní en estos textos.
 *
 * Validez: aceptación con firma electrónica (Ley N.° 6822/2021) desde una cuenta con el correo confirmado.
 * Quien tenga firma electrónica cualificada puede adjuntar además el convenio firmado.
 */
import { normalizarWhatsapp } from "@/lib/purahei";

export type Programa = "purahei" | "libreria";
export const PROGRAMAS: Programa[] = ["purahei", "libreria"];
export const esPrograma = (v: unknown): v is Programa => v === "purahei" || v === "libreria";

export type Opcion = { id: string; label: string; ayuda?: string };
export type Clausula = { t: string; x: string };
export type Convenio = {
  programa: Programa;
  version: string;
  titulo: string;
  subtitulo: string;
  /** Cómo se llama lo que se autoriza: «obra» o «libro». */
  obra: { singular: string; plural: string; campos: { id: keyof ObraFirmada; label: string }[] };
  roles: Opcion[];
  permisos: Opcion[];
  /** Permisos que no pueden faltar para que el convenio tenga sentido (al menos uno de la lista). */
  alMenosUno: string[];
  clausulas: Clausula[];
};

export type ObraFirmada = { titulo: string; autor: string; interprete: string; productor: string };

const PARTES = "Guaraní Global Tech E.A.S., RUC 80174299-4, creadora de Jaikuaa (en adelante, «Jaikuaa»), y la persona que firma este convenio (en adelante, «el Titular»)";

const FIRMA: Clausula = {
  t: "Firma electrónica",
  x: "El Titular acepta este convenio con firma electrónica, conforme a la Ley N.° 6822/2021, desde su cuenta de Jaikuaa con el correo confirmado. Jaikuaa guarda la fecha y hora, el correo, el dispositivo y una huella del texto aceptado, y entrega una constancia con un código que cualquiera puede verificar en www.jaikuaa.com. El Titular puede además adjuntar este convenio firmado con firma electrónica cualificada o a mano.",
};
const DATOS: Clausula = {
  t: "Datos personales",
  x: "La cédula, el correo y los datos del dispositivo se usan solo para este convenio y no se publican. En la verificación pública se muestran solamente el nombre, la fecha, la versión y el estado del convenio.",
};
const DIALOGO: Clausula = {
  t: "Diálogo",
  x: "Cualquier diferencia se conversa primero entre las partes. Si no se resuelve, quedan competentes los tribunales de la ciudad de Asunción.",
};

export const CONVENIOS: Record<Programa, Convenio> = {
  purahei: {
    programa: "purahei",
    version: "purahei-1.0",
    titulo: "Convenio de Difusión Cultural y Fomento de Autores",
    subtitulo: "Purahéi Jaikuaa, vitrina de artistas y cantores paraguayos",
    obra: {
      singular: "obra",
      plural: "obras",
      campos: [
        { id: "titulo", label: "Título de la obra" },
        { id: "autor", label: "Autor" },
        { id: "interprete", label: "Intérprete" },
        { id: "productor", label: "Productor de la grabación" },
      ],
    },
    roles: [
      { id: "autor", label: "Autor o heredero" },
      { id: "interprete", label: "Intérprete" },
      { id: "productor", label: "Productor de la grabación" },
      { id: "representante", label: "Representante" },
    ],
    permisos: [
      { id: "obra", label: "La letra y la música", ayuda: "Si sos el autor o su heredero." },
      { id: "voz", label: "La grabación con mi voz", ayuda: "Si sos el intérprete." },
      { id: "grabacion", label: "La grabación original", ayuda: "Si sos el productor de la grabación." },
      { id: "imagen", label: "Mi nombre, foto e historia en la ficha" },
      { id: "whatsapp", label: "Publicar mi WhatsApp para contrataciones" },
    ],
    alMenosUno: ["obra", "voz", "grabacion"],
    clausulas: [
      { t: "Partes", x: `Este convenio se celebra entre ${PARTES}.` },
      { t: "Objeto", x: "El Titular autoriza a Jaikuaa a mostrar en www.jaikuaa.com las obras que detalla, en la ficha del artista, en el visor de letras y en el juego Purahéi Karaoke, con fines culturales y educativos, solo en lo que marca como autorizado." },
      { t: "Sin exclusividad", x: "El Titular conserva todos sus derechos y puede seguir usando y licenciando sus obras con quien quiera." },
      { t: "Sin costo y sin comisiones", x: "Aparecer en la vitrina no tiene costo para el Titular. Las contrataciones se hacen directo con el Titular o su representante, y Jaikuaa no cobra comisión sobre ellas." },
      { t: "Ingresos", x: "Si una obra genera ingresos (por ejemplo, el auspicio de una canción o un cancionero pago), el reparto se acuerda por escrito en una adenda firmada antes de empezar. Sin esa adenda, no hay ningún uso pago." },
      { t: "La letra y el guaraní", x: "La letra, su traducción y el glosario los revisan docentes especialistas antes de publicarse. Jaikuaa no usa voces sintéticas ni traducción automática. El Titular puede revisar su ficha y sus obras antes de que salgan a la vitrina." },
      { t: "Créditos", x: "Cada obra muestra a su autor, su intérprete y su productor." },
      { t: "Plazo y retiro", x: "Este convenio dura un año desde su firma y se renueva solo por períodos iguales. El Titular puede pedir el retiro de una obra o de su ficha en cualquier momento desde su constancia, por WhatsApp o por correo, y Jaikuaa la retira en un plazo máximo de siete días." },
      { t: "Derechos de terceros", x: "El Titular declara que tiene los derechos que autoriza. Si una obra tiene otros dueños (por ejemplo, una sociedad de autores o un sello), Jaikuaa no la publica hasta tener también su autorización escrita." },
      { t: "Informe", x: "Jaikuaa envía al Titular un informe privado sobre el uso de sus obras cuando lo pida. Esos datos no se publican." },
      FIRMA,
      DATOS,
      DIALOGO,
    ],
  },
  libreria: {
    programa: "libreria",
    version: "libreria-1.0",
    titulo: "Autorización de Publicación Digital",
    subtitulo: "Librería Jaikuaa, libros que se leen y libros que hablan",
    obra: {
      singular: "libro",
      plural: "libros",
      campos: [
        { id: "titulo", label: "Título del libro" },
        { id: "autor", label: "Autor" },
        { id: "productor", label: "Editorial (si tiene)" },
      ],
    },
    roles: [
      { id: "autor", label: "Autor o heredero" },
      { id: "editorial", label: "Editorial" },
      { id: "representante", label: "Representante" },
    ],
    permisos: [
      { id: "texto", label: "Mostrar el libro para leer en el celular, dentro de la Librería" },
      { id: "voz", label: "Que el libro también hable, con voz humana real (la del autor o la de un docente)" },
      { id: "portada", label: "Usar la portada y los datos del libro para presentarlo" },
      { id: "imagen", label: "Mi nombre, foto y biografía de autor" },
    ],
    alMenosUno: ["texto", "voz"],
    clausulas: [
      { t: "Partes", x: `Esta autorización se celebra entre ${PARTES}.` },
      { t: "Objeto", x: "El Titular autoriza a Jaikuaa a mostrar los libros que detalla en la Librería Jaikuaa de www.jaikuaa.com, para leer en pantalla y, si lo marca, para escucharlos con voz humana real, solo en lo que marca como autorizado. Jaikuaa no ofrece la descarga del archivo del libro." },
      { t: "Sin exclusividad", x: "El Titular conserva todos sus derechos y puede seguir publicando y vendiendo sus libros por cualquier otro medio." },
      { t: "Venta e ingresos", x: "Aparecer en la Librería no tiene costo para el Titular. Si un libro se vende, el precio y el reparto se acuerdan por escrito en una adenda firmada antes de ponerlo a la venta. Sin esa adenda, no hay venta." },
      { t: "Voz humana", x: "Jaikuaa no usa voces sintéticas. La lectura la graba el autor o un docente que el Titular conozca y acepte antes." },
      { t: "Revisión", x: "El texto en guaraní lo revisan docentes especialistas antes de publicarse. El Titular ve su libro y su ficha antes de que salgan a la Librería." },
      { t: "Créditos", x: "Cada libro muestra a su autor y, si corresponde, a su editorial y a quien le pone la voz." },
      { t: "Plazo y retiro", x: "Esta autorización dura un año desde su firma y se renueva sola por períodos iguales. El Titular puede pedir el retiro de un libro en cualquier momento desde su constancia, por WhatsApp o por correo, y Jaikuaa lo retira en un plazo máximo de siete días. Si el libro ya fue vendido, la adenda define qué pasa con quienes lo compraron." },
      { t: "Derechos de terceros", x: "El Titular declara que tiene los derechos que autoriza. Si el libro tiene otros dueños (por ejemplo, una editorial o coautores), Jaikuaa no lo publica hasta tener también su autorización escrita." },
      { t: "Informe", x: "Jaikuaa envía al Titular un informe privado sobre las lecturas de sus libros cuando lo pida. Esos datos no se publican." },
      FIRMA,
      DATOS,
      DIALOGO,
    ],
  },
};

/** El texto exacto que se firma, en una sola cadena (de acá sale la huella). */
export function textoCanonico(c: Convenio): string {
  return [
    `Versión: ${c.version}`,
    c.titulo,
    c.subtitulo,
    ...c.clausulas.map((k, i) => `${i + 1}. ${k.t}. ${k.x}`),
    `Permisos posibles: ${c.permisos.map((p) => `[${p.id}] ${p.label}`).join(" | ")}`,
  ].join("\n");
}

/** Lo que el Titular llena para firmar. */
export type Firma = {
  nombre: string;
  ci: string;
  whatsapp: string;
  ciudad: string;
  roles: string[];
  permisos: string[];
  obras: ObraFirmada[];
  acepto: boolean;
};

export const FIRMA_VACIA: Firma = { nombre: "", ci: "", whatsapp: "", ciudad: "", roles: [], permisos: [], obras: [{ titulo: "", autor: "", interprete: "", productor: "" }], acepto: false };

export const MAX_OBRAS = 30;

/** La cédula solo con números (y una letra final si la tiene, como en algunos documentos extranjeros). */
export function normalizarCI(ci: string): string | null {
  const d = ci.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return /^[0-9A-Z]{4,15}$/.test(d) ? d : null;
}

export const obrasLlenas = (o: ObraFirmada[]) => o.map((x) => ({
  titulo: x.titulo.trim().slice(0, 200),
  autor: x.autor.trim().slice(0, 120),
  interprete: x.interprete.trim().slice(0, 120),
  productor: x.productor.trim().slice(0, 120),
})).filter((x) => x.titulo).slice(0, MAX_OBRAS);

/** Lo que falta para poder firmar (vacío = se puede). */
export function faltaParaFirmar(c: Convenio, f: Firma): string[] {
  const falta: string[] = [];
  if (f.nombre.trim().length < 3) falta.push("Tu nombre completo");
  if (!normalizarCI(f.ci)) falta.push("Tu número de cédula");
  if (!normalizarWhatsapp(f.whatsapp)) falta.push("Tu WhatsApp");
  if (!f.roles.some((r) => c.roles.some((x) => x.id === r))) falta.push("En qué carácter firmás");
  if (!f.permisos.some((p) => c.alMenosUno.includes(p))) falta.push(`Qué autorizás de tus ${c.obra.plural}`);
  if (obrasLlenas(f.obras).length === 0) falta.push(`Al menos un ${c.obra.singular}`);
  if (!f.acepto) falta.push("Marcar que leíste y aceptás el convenio");
  return falta;
}

/** Código de la constancia: CV-2026-XXXXXX (sin letras que se confunden). */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function codigoConvenio(anio: number, bytes: Uint8Array): string {
  return `CV-${anio}-${Array.from(bytes.slice(0, 6), (b) => ALFABETO[b % ALFABETO.length]).join("")}`;
}
export const esCodigoConvenio = (v: string) => /^CV-[0-9]{4}-[A-Z2-9]{6}$/.test(v);

export const ESTADOS = ["pendiente", "aprobado", "rechazado", "retiro_pedido", "retirado"] as const;
export type Estado = (typeof ESTADOS)[number];
export const NOMBRE_ESTADO: Record<Estado, string> = {
  pendiente: "Firmado, en revisión",
  aprobado: "Vigente",
  rechazado: "No aceptado",
  retiro_pedido: "Retiro pedido",
  retirado: "Retirado",
};

export const NOMBRE_PROGRAMA: Record<Programa, string> = { purahei: "Purahéi Jaikuaa", libreria: "Librería Jaikuaa" };

/**
 * El borrador queda en el navegador mientras la persona entra o crea su cuenta.
 * Solo se guarda cuando la persona escribió o marcó algo ella misma (nunca por el nombre que se completa solo
 * desde su cuenta): así, quien entra solo a mirar no queda con un «borrador» ni con el aviso en el panel.
 */
export const BORRADOR_KEY = (p: Programa) => `jaikuaa:convenio:${p}`;
const OCULTO_KEY = (p: Programa) => `jaikuaa:convenio:${p}:aviso-oculto`;
export function leerBorrador(p: Programa): Firma | null {
  try {
    const v = JSON.parse(localStorage.getItem(BORRADOR_KEY(p)) ?? "null");
    // Los borradores viejos sin la marca «tocado» se descartan (los guardaba el autocompletado).
    if (!v || typeof v !== "object" || v.tocado !== true) return null;
    return { ...FIRMA_VACIA, ...v, acepto: false, obras: Array.isArray(v.obras) && v.obras.length ? v.obras : FIRMA_VACIA.obras };
  } catch { return null; }
}
export function guardarBorrador(p: Programa, f: Firma) {
  try {
    localStorage.setItem(BORRADOR_KEY(p), JSON.stringify({ ...f, acepto: false, tocado: true }));
    localStorage.removeItem(OCULTO_KEY(p)); // si vuelve a escribir, el aviso vuelve a valer
  } catch { /* sin almacenamiento */ }
}
export function borrarBorrador(p: Programa) {
  try { localStorage.removeItem(BORRADOR_KEY(p)); localStorage.removeItem(OCULTO_KEY(p)); } catch { /* nada */ }
}
/** La persona cerró el aviso del panel: el borrador sigue guardado por si vuelve al formulario. */
export function ocultarAviso(p: Programa) {
  try { localStorage.setItem(OCULTO_KEY(p), "1"); } catch { /* nada */ }
}
function avisoOculto(p: Programa): boolean {
  try { return localStorage.getItem(OCULTO_KEY(p)) === "1"; } catch { return false; }
}
/** Hay algo empezado a mano y sin firmar, y el aviso no fue cerrado. */
export function hayBorrador(): Programa | null {
  for (const p of PROGRAMAS) {
    if (avisoOculto(p)) continue;
    const b = leerBorrador(p);
    if (b && (b.nombre.trim() || obrasLlenas(b.obras).length)) return p;
  }
  return null;
}
