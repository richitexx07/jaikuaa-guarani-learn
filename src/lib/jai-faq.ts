/**
 * Preguntas frecuentes de Jai (atención al cliente).
 * Respuestas fijas y verificadas: sin IA, sin texto en guaraní generado.
 * Ante dudas complejas, se deriva al WhatsApp de soporte.
 */
import { SUPPORT_WHATSAPP } from "@/lib/contact";

export type JaiFaq = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  link?: { label: string; to: string };
  /** Si es true, se sugiere hablar con una persona después de responder. */
  escalate?: boolean;
};

export const JAI_FAQS: JaiFaq[] = [
  {
    id: "gratis",
    question: "¿Es gratis aprender en Jaikuaa?",
    answer:
      "Sí. El guaraní básico es gratis para los paraguayos. Se pagan solo las especializaciones, los servicios para instituciones y los espacios de auspicio.",
    keywords: ["gratis", "precio", "costo", "pagar", "cuesta", "plata", "pago"],
  },
  {
    id: "empezar",
    question: "¿Cómo empiezo?",
    answer:
      "Creá tu cuenta gratis y arrancá con la primera lección. Podés escuchar voces reales de hablantes paraguayos y jugar para practicar.",
    keywords: ["empezar", "comenzar", "registrar", "cuenta", "crear", "inicio"],
    link: { label: "Comenzar ahora", to: "/comenzar" },
  },
  {
    id: "instalar",
    question: "¿Cómo instalo la app en mi celular?",
    answer:
      "Abrí www.jaikuaa.com en tu celular. En Android tocá el menú del navegador (⋮) y elegí «Instalar app» o «Agregar a pantalla principal». En iPhone, en Safari tocá Compartir y luego «Agregar a inicio».",
    keywords: ["instalar", "app", "aplicacion", "aplicación", "descargar", "celular", "android", "iphone"],
  },
  {
    id: "offline",
    question: "¿Funciona sin internet?",
    answer:
      "Sí, en parte. Una vez instalada, la app guarda las páginas y audios que ya abriste, y tu avance se sincroniza cuando vuelve la señal.",
    keywords: ["internet", "señal", "offline", "conexion", "conexión", "datos"],
  },
  {
    id: "contrasena",
    question: "No puedo entrar / olvidé mi contraseña",
    answer:
      "Podés recuperarla con tu correo: te enviamos un enlace para crear una nueva contraseña. Revisá también la carpeta de spam.",
    keywords: ["contraseña", "contrasena", "clave", "entrar", "ingresar", "login", "olvide", "olvidé", "acceso"],
    link: { label: "Recuperar contraseña", to: "/recuperar" },
  },
  {
    id: "teclado",
    question: "¿Cómo escribo las letras del guaraní?",
    answer:
      "Usá nuestro teclado guaraní gratuito: tocás las letras especiales, copiás el texto y lo pegás donde quieras.",
    keywords: ["teclado", "letras", "escribir", "tilde", "puso", "caracteres"],
    link: { label: "Abrir teclado", to: "/teclado" },
  },
  {
    id: "certificado",
    question: "¿Dan certificado?",
    answer:
      "Sí. Al completar el curso recibís un certificado con código único y QR, que cualquiera puede verificar. No constituye un título oficial.",
    keywords: ["certificado", "diploma", "constancia", "titulo", "título"],
  },
  {
    id: "docente",
    question: "Soy docente, ¿cómo lo uso con mis alumnos?",
    answer:
      "Tenés el Cuaderno del docente y juegos para la clase. Jaikuaa acompaña al docente, no lo reemplaza. Para usarlo con tu escuela o institución, escribinos.",
    keywords: ["docente", "profesor", "maestro", "escuela", "colegio", "alumnos", "clase"],
    link: { label: "Ver instituciones", to: "/instituciones" },
    escalate: true,
  },
  {
    id: "auspicio",
    question: "Quiero auspiciar o colaborar",
    answer:
      "¡Gracias! Hay espacios para auspiciantes en juegos y en la palabra del día, y un muro de fundadores. Mirá las opciones y coordinamos por WhatsApp.",
    keywords: ["auspicio", "auspiciar", "auspiciante", "empresa", "marca", "publicidad", "colaborar", "apoyar", "sponsor"],
    link: { label: "Ver auspicios", to: "/auspiciantes" },
    escalate: true,
  },
  {
    id: "respaldo",
    question: "¿Qué respaldo tiene Jaikuaa?",
    answer:
      "Jaikuaa fue declarada de Interés Nacional y Educativo por el Senado (Decl. N.° 547/2026) y de interés lingüístico por la SPL (Res. N.° 116/2026). Además, Jaikuaa desarrolla un plan piloto con el Ateneo de Lengua y Cultura Guaraní (convenio firmado el 25/09/2026).",
    keywords: ["respaldo", "senado", "spl", "ateneo", "oficial", "declaracion", "declaración", "interes"],
    link: { label: "Sobre Jaikuaa", to: "/sobre" },
  },
  {
    id: "traductor",
    question: "¿Jaikuaa traduce textos?",
    answer:
      "No. Jaikuaa no es un traductor automático. Todo el contenido en guaraní lo revisan especialistas; lo que todavía se está revisando aparece como «En validación».",
    keywords: ["traducir", "traductor", "traduccion", "traducción", "significa", "como se dice"],
  },
];

/** Normaliza para comparar sin tildes ni mayúsculas. */
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Busca la pregunta frecuente que mejor coincide. Devuelve null si no hay coincidencia. */
export function findFaq(text: string): JaiFaq | null {
  const q = norm(text);
  if (q.trim().length < 2) return null;
  let best: JaiFaq | null = null;
  let bestScore = 0;
  for (const f of JAI_FAQS) {
    let score = 0;
    for (const k of f.keywords) if (q.includes(norm(k))) score += norm(k).length;
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best;
}

/** Enlace de WhatsApp con el tema de la consulta ya cargado. */
export function whatsappLink(topic?: string) {
  const text = topic
    ? `Hola, le consulté a Jai sobre: "${topic}" y me gustaría hablar con una persona del equipo Jaikuaa.`
    : "Hola, le consulté a Jai y me gustaría hablar con una persona del equipo Jaikuaa.";
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
