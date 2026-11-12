/**
 * Tembiapo Jaikuaa: la vitrina de maestros artesanos y saberes vivos del Paraguay (Fase 1, estructura y diseño).
 * Los oficios y sus lugares son datos conocidos. Las palabras de cada oficio en guaraní no se escriben acá:
 * las traen los propios artesanos, con su voz, y las revisan docentes especialistas antes de publicarse.
 * Las rutas culturales se definen junto con el Instituto Paraguayo de Artesanía y los artesanos.
 */
import { SUPPORT_WHATSAPP } from "@/lib/contact";

/** Azul marino de Jaikuaa con acento rojo, sobre un fondo de lino. */
export const TB = { marino: "#1E3A5F", noche: "#0F2038", rojo: "#C8102E", lino: "#FBF7F0", hilo: "#E9E1D3" };

export type Oficio = {
  slug: string;
  nombre: string;
  /** Lugares donde el oficio es tradición. Vacío cuando hay que confirmarlos con los artesanos. */
  lugares: string[];
  resumen: string;
  detalle: string;
};

export const OFICIOS: Oficio[] = [
  {
    slug: "nanduti",
    nombre: "Ñandutí",
    lugares: ["Itauguá"],
    resumen: "El encaje de hilo que se teje en círculos, como una tela de araña.",
    detalle: "Se teje a mano sobre un bastidor, punto por punto, hasta formar ruedas que se unen en manteles, prendas y adornos. Cada diseño tiene su nombre y su historia, y se aprende de generación en generación.",
  },
  {
    slug: "ao-poi",
    nombre: "Ao po'i",
    lugares: ["Yataity, Guairá"],
    resumen: "La tela fina de algodón bordada a mano.",
    detalle: "Se teje la tela y después se borda con dibujos que cada artesana elige. Es una prenda fresca y elegante, que se usa en el día a día y en las ocasiones especiales.",
  },
  {
    slug: "filigrana",
    nombre: "Filigrana",
    lugares: ["Luque"],
    resumen: "Joyas de hilos finísimos de oro y plata.",
    detalle: "El orfebre estira el metal hasta convertirlo en hilos y los suelda con paciencia para formar flores, mariposas y rosarios. Es un oficio de taller, de pulso firme y mucha precisión.",
  },
  {
    slug: "ceramica",
    nombre: "Cerámica",
    lugares: ["Areguá", "Tobatí", "Itá"],
    resumen: "Piezas de barro modeladas a mano y cocidas al horno.",
    detalle: "Desde ollas y cántaros hasta figuras y piezas de arte. Cada pueblo tiene su barro, sus formas y su manera de cocer, que las familias de artesanos transmiten de padres a hijos.",
  },
  {
    slug: "poncho",
    nombre: "Poncho de 60 listas",
    lugares: ["Piribebuy"],
    resumen: "El poncho tejido en telar, con sus listas finas.",
    detalle: "Se teje en telar con hilos muy finos, lista por lista, en un trabajo largo y minucioso. Es una prenda de abrigo y de orgullo, ligada a la historia del Paraguay.",
  },
  {
    slug: "tallado",
    nombre: "Tallado en madera",
    lugares: ["Tobatí"],
    resumen: "Figuras, santos y utensilios tallados a mano.",
    detalle: "El tallador elige la madera, la desbasta y la trabaja con gubias y formones hasta dar con la figura. Muchas piezas guardan la tradición religiosa y popular de cada comunidad.",
  },
  {
    slug: "cuero",
    nombre: "Trabajo en cuero",
    lugares: [],
    resumen: "Prendas, aperos y accesorios de cuero hechos a mano.",
    detalle: "Desde los aperos del campo hasta bolsos y cinturones: el cuero se corta, se cose y se repuja a mano. Pronto sumamos los lugares y los maestros de este oficio.",
  },
  {
    slug: "indigena",
    nombre: "Arte de los pueblos indígenas",
    lugares: [],
    resumen: "Cestería, tallas, tejidos y plumería de cada pueblo.",
    detalle: "Cada pueblo indígena del Paraguay tiene su propia lengua y su propio arte. Este espacio se arma solo con el consentimiento de cada comunidad, con sus propias palabras y a su manera.",
  },
];

export function oficioPorSlug(slug: string): Oficio | undefined {
  return OFICIOS.find((o) => o.slug === slug);
}

/** Mensaje para sumarse a la vitrina, mientras el convenio artesanal en línea está en preparación. */
export function enlaceSumarme(oficio?: string): string {
  const texto = oficio
    ? `Mba'éichapa. Soy artesano/a de ${oficio} y quiero sumarme a Tembiapo Jaikuaa.`
    : "Mba'éichapa. Soy artesano/a y quiero sumarme a Tembiapo Jaikuaa.";
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

/** Los oficios que acepta la base de datos (los de la vitrina más «otro»). */
export const OFICIO_IDS = ["nanduti", "ao-poi", "filigrana", "ceramica", "poncho", "tallado", "cuero", "indigena", "otro"] as const;
export type OficioId = (typeof OFICIO_IDS)[number];
export const nombreOficio = (id: string) => OFICIOS.find((o) => o.slug === id)?.nombre ?? "Otro oficio";

/** WhatsApp directo con el artesano, con un saludo ya escrito. */
export function enlaceWhatsappArtesano(numero: string, artesano: string, pieza?: string): string {
  const texto = pieza
    ? `Mba'éichapa, ${artesano}. Vi tu pieza «${pieza}» en Tembiapo Jaikuaa y quiero consultarte.`
    : `Mba'éichapa, ${artesano}. Vi tu ficha en Tembiapo Jaikuaa y quiero consultarte por tus piezas.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/** Lo que impide publicar a un artesano (vacío = puede salir a la vitrina). */
export function faltaArtesano(a: { permiso_imagen: boolean; oficio: string; consentimiento_comunidad: boolean }): string[] {
  const f: string[] = [];
  if (!a.permiso_imagen) f.push("autorización de imagen");
  if (a.oficio === "indigena" && !a.consentimiento_comunidad) f.push("consentimiento de la comunidad");
  if (a.oficio === "otro") f.push("elegir el oficio");
  return f;
}

/** Avisos que no impiden publicar pero conviene completar. */
export function avisosArtesano(a: { whatsapp: string | null; bio: string; foto_path: string | null }): string[] {
  const f: string[] = [];
  if (!a.foto_path) f.push("sin foto");
  if (!a.bio.trim()) f.push("sin historia");
  if (!a.whatsapp) f.push("sin WhatsApp: no tendrá botón de compra");
  return f;
}
