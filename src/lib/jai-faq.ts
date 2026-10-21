/**
 * Preguntas frecuentes de Jai (atención al cliente).
 * Respuestas fijas y verificadas: sin IA, sin texto en guaraní generado.
 * Ante dudas complejas, se deriva al WhatsApp de soporte con la consulta ya escrita.
 *
 * Cómo entiende Jai: separa la consulta en palabras (sin tildes ni mayúsculas), ignora las
 * palabras vacías y compara contra frases y palabras clave, tolerando errores de tipeo chicos
 * («contrasenia», «aplicasion») y formas parecidas («escucho», «escuchar»). Si dos respuestas
 * empatan o la coincidencia es débil, en vez de adivinar ofrece «¿Te referís a…?».
 */
import { SUPPORT_WHATSAPP } from "@/lib/contact";

export type JaiCategory = "Empezar" | "Problemas" | "Docentes e instituciones" | "Sobre Jaikuaa";

export type JaiFaq = {
  id: string;
  category: JaiCategory;
  question: string;
  answer: string;
  /** Palabras o frases que disparan esta respuesta. Las frases pesan más que las palabras sueltas. */
  keywords: string[];
  link?: { label: string; to: string };
  /** Si es true, se sugiere hablar con una persona después de responder. */
  escalate?: boolean;
  /** Preguntas relacionadas que Jai ofrece después de responder. */
  related?: string[];
};

export const JAI_FAQS: JaiFaq[] = [
  {
    id: "audio",
    category: "Problemas",
    question: "No escucho los audios",
    answer:
      "Probá esto, en orden: 1) subí el volumen y, en iPhone, revisá que el botón lateral de silencio no esté activado; 2) actualizá la página; 3) iniciá sesión: sin cuenta solo se escuchan las palabras de muestra. Si una palabra muestra el parlante tachado, todavía no tiene grabación humana: nunca usamos voces de máquina.",
    keywords: [
      "no escucho", "no se escucha", "no se oye", "no suena", "sin sonido", "no tiene sonido",
      "audio", "audios", "sonido", "voz", "voces", "escuchar", "parlante", "volumen", "mudo",
    ],
    related: ["no-carga", "empezar"],
    escalate: true,
  },
  {
    id: "gratis",
    category: "Empezar",
    question: "¿Es gratis aprender en Jaikuaa?",
    answer:
      "Sí. Aprender guaraní básico en Jaikuaa es gratis. Se pagan solo las especializaciones, los servicios para instituciones y los espacios de auspicio.",
    keywords: ["gratis", "gratuito", "precio", "costo", "cuesta", "cuanto sale", "cuanto vale", "pagar", "pago", "plata", "tarifa", "suscripcion"],
    related: ["empezar", "certificado"],
  },
  {
    id: "empezar",
    category: "Empezar",
    question: "¿Cómo empiezo?",
    answer:
      "Creá tu cuenta gratis y arrancá con la primera lección. Vas a escuchar voces reales de hablantes paraguayos y vas a poder jugar para practicar.",
    keywords: ["empezar", "empiezo", "comenzar", "arrancar", "registrarme", "registro", "crear cuenta", "abrir cuenta", "inscribirme", "primera leccion"],
    link: { label: "Comenzar ahora", to: "/comenzar" },
    related: ["instalar", "gratis"],
  },
  {
    id: "instalar",
    category: "Empezar",
    question: "¿Cómo instalo la app en mi celular?",
    answer:
      "Abrí www.jaikuaa.com en tu celular. En Android tocá el menú del navegador (⋮) y elegí «Instalar app» o «Agregar a pantalla principal». En iPhone, en Safari tocá Compartir y luego «Agregar a inicio».",
    keywords: ["instalar", "instalo", "instalarla", "descargar", "bajar la app", "app", "aplicacion", "play store", "app store", "iphone", "android", "pantalla de inicio"],
    related: ["offline", "empezar"],
  },
  {
    id: "offline",
    category: "Empezar",
    question: "¿Funciona sin internet?",
    answer:
      "Sí. Con señal, entrá a tu panel y tocá «Descargar para usar sin internet»: se bajan las lecciones, los audios, los juegos, el glosario y la Palabra del día de las próximas semanas. Después estudiás sin señal y tus avances se envían solos cuando vuelve la conexión. Lo único que necesita internet es crear la cuenta, jugar contra otra persona a distancia y ver el ranking al día. En iPhone, agregá Jaikuaa a la pantalla de inicio para que lo descargado no se borre.",
    keywords: ["sin internet", "sin señal", "sin conexion", "offline", "fuera de linea", "sin datos", "sin wifi", "descargar"],
    link: { label: "Ir a mi panel", to: "/dashboard" },
    related: ["instalar", "audio"],
  },
  {
    id: "extranjero",
    category: "Empezar",
    question: "¿Puedo usarlo desde otro país?",
    answer:
      "¡Claro! Jaikuaa funciona desde cualquier país: solo necesitás internet para crear tu cuenta. Es una linda forma de mantener vivo el guaraní estés donde estés.",
    keywords: ["otro pais", "exterior", "extranjero", "extranjera", "desde españa", "argentina", "brasil", "estados unidos", "europa", "fuera del paraguay", "vivo afuera"],
    related: ["empezar", "gratis"],
  },
  {
    id: "contrasena",
    category: "Problemas",
    question: "No puedo entrar / olvidé mi contraseña",
    answer:
      "Podés recuperarla con tu correo: te enviamos un enlace para crear una nueva contraseña. Revisá también la carpeta de spam o «Promociones».",
    keywords: ["contraseña", "clave", "password", "no puedo entrar", "no puedo ingresar", "iniciar sesion", "login", "olvide", "acceso", "recuperar cuenta"],
    link: { label: "Recuperar contraseña", to: "/recuperar" },
    related: ["no-carga"],
  },
  {
    id: "no-carga",
    category: "Problemas",
    question: "La página no carga o se traba",
    answer:
      "Actualizá la página (o cerrá y volvé a abrir la app). Si sigue igual, revisá tu conexión y probá con otro navegador. Si el problema continúa, contanos por WhatsApp en qué pantalla pasa y te ayudamos.",
    keywords: ["no carga", "no anda", "no funciona", "se traba", "se tilda", "se colgo", "pantalla blanca", "error", "falla", "lento", "no abre", "se cierra"],
    related: ["audio", "contrasena"],
    escalate: true,
  },
  {
    id: "teclado",
    category: "Empezar",
    question: "¿Cómo escribo las letras del guaraní?",
    answer:
      "Usá nuestro teclado guaraní gratuito: tocás las letras especiales (ã, ẽ, g̃, el puso…), copiás el texto y lo pegás donde quieras, por ejemplo en WhatsApp.",
    keywords: ["teclado", "letras", "escribir", "tilde", "puso", "caracteres", "nasal", "acento"],
    link: { label: "Abrir teclado", to: "/teclado" },
    related: ["glosario"],
  },
  {
    id: "glosario",
    category: "Empezar",
    question: "¿Dónde busco una palabra?",
    answer:
      "En el Glosario (Inicio → Herramientas) buscás en guaraní o en castellano y escuchás cada palabra publicada. Todas las palabras las revisan especialistas.",
    keywords: ["glosario", "diccionario", "buscar palabra", "significado", "vocabulario", "lista de palabras"],
    link: { label: "Abrir glosario", to: "/glosario" },
    related: ["error-palabra", "traductor"],
  },
  {
    id: "error-palabra",
    category: "Problemas",
    question: "Encontré un error en una palabra",
    answer:
      "¡Gracias por avisar! Tocá la banderita que aparece al lado de la palabra (en las lecciones o en el glosario), elegí qué parece estar mal y contalo en pocas palabras. Lo revisa el equipo docente: nada se cambia sin su aprobación.",
    keywords: ["error en una palabra", "esta mal escrita", "mal escrito", "palabra mal", "corregir", "correccion", "equivocada", "incorrecta", "banderita", "reportar", "señalar"],
    related: ["glosario", "traductor"],
  },
  {
    id: "certificado",
    category: "Sobre Jaikuaa",
    question: "¿Dan certificado?",
    answer:
      "Sí. Al completar el curso recibís un certificado con código único y QR, que cualquiera puede verificar. No constituye un título oficial.",
    keywords: ["certificado", "diploma", "constancia", "titulo", "acreditar"],
    related: ["gratis", "empezar"],
  },
  {
    id: "docente",
    category: "Docentes e instituciones",
    question: "Soy docente, ¿cómo lo uso con mis alumnos?",
    answer:
      "Tenés el Cuaderno del docente y juegos para la clase. Jaikuaa acompaña al docente, no lo reemplaza. Para usarlo con tu escuela o institución, escribinos y lo coordinamos.",
    keywords: ["docente", "profesor", "profe", "maestro", "maestra", "escuela", "colegio", "alumnos", "estudiantes", "clase", "aula"],
    link: { label: "Ver instituciones", to: "/instituciones" },
    escalate: true,
    related: ["instituciones", "error-palabra"],
  },
  {
    id: "instituciones",
    category: "Docentes e instituciones",
    question: "Quiero Jaikuaa para mi institución",
    answer:
      "Trabajamos con instituciones públicas y privadas para acercarlas al guaraní: capacitación, materiales y herramientas para atender en guaraní. Mirá las opciones y coordinamos una reunión.",
    keywords: ["institucion", "municipio", "ministerio", "gobernacion", "oficina", "funcionarios", "convenio", "capacitacion", "personal"],
    link: { label: "Ver instituciones", to: "/instituciones" },
    escalate: true,
    related: ["auspicio", "docente"],
  },
  {
    id: "auspicio",
    category: "Docentes e instituciones",
    question: "Quiero auspiciar o colaborar",
    answer:
      "¡Gracias! Hay espacios para auspiciantes en juegos y en la palabra del día, y un muro de fundadores. Mirá las opciones y lo coordinamos por WhatsApp.",
    keywords: ["auspicio", "auspiciar", "auspiciante", "empresa", "marca", "publicidad", "colaborar", "apoyar", "sponsor", "patrocinar", "donar"],
    link: { label: "Ver auspicios", to: "/auspiciantes" },
    escalate: true,
    related: ["instituciones", "respaldo"],
  },
  {
    id: "que-es",
    category: "Sobre Jaikuaa",
    question: "¿Qué es Jaikuaa?",
    answer:
      "Jaikuaa es una plataforma paraguaya para aprender y usar el guaraní, con voces reales de paraguayos, lecciones, juegos y herramientas. La desarrolla Guaraní Global Tech E.A.S.",
    keywords: ["que es jaikuaa", "que es esto", "de que se trata", "quienes son", "quien hizo", "quien esta detras", "para que sirve"],
    link: { label: "Sobre Jaikuaa", to: "/sobre" },
    related: ["respaldo", "gratis"],
  },
  {
    id: "respaldo",
    category: "Sobre Jaikuaa",
    question: "¿Qué respaldo tiene Jaikuaa?",
    answer:
      "Jaikuaa fue declarada de Interés Nacional y Educativo por la Honorable Cámara de Senadores (Declaración N.° 547/2026) y de interés lingüístico por la Secretaría de Políticas Lingüísticas (Resolución N.° 116/2026). Además, Jaikuaa desarrolla un plan piloto con el Ateneo de Lengua y Cultura Guaraní.",
    keywords: ["respaldo", "senado", "spl", "ateneo", "oficial", "declaracion", "interes nacional", "es confiable", "es serio"],
    link: { label: "Sobre Jaikuaa", to: "/sobre" },
    related: ["que-es", "traductor"],
  },
  {
    id: "traductor",
    category: "Sobre Jaikuaa",
    question: "¿Jaikuaa traduce textos?",
    answer:
      "No. Jaikuaa no es un traductor automático y ninguna inteligencia artificial escribe guaraní. Todo el contenido en guaraní lo revisan especialistas; lo que todavía se está revisando aparece como «En validación».",
    keywords: ["traducir", "traductor", "traduccion", "como se dice", "que significa", "inteligencia artificial", "chatgpt"],
    related: ["glosario", "error-palabra"],
  },
  {
    id: "privacidad",
    category: "Sobre Jaikuaa",
    question: "¿Qué hacen con mis datos? / Quiero borrar mi cuenta",
    answer:
      "Solo usamos tu nombre y correo para que funcione tu cuenta; no vendemos ni compartimos tus datos. Si querés borrar tu cuenta, escribinos por WhatsApp y la eliminamos.",
    keywords: ["mis datos", "datos personales", "privacidad", "borrar mi cuenta", "eliminar mi cuenta", "dar de baja", "baja", "borrar cuenta"],
    link: { label: "Política de privacidad", to: "/privacidad" },
    escalate: true,
    related: ["contrasena"],
  },
];

export const JAI_CATEGORIES: JaiCategory[] = ["Empezar", "Problemas", "Docentes e instituciones", "Sobre Jaikuaa"];

const byId = new Map(JAI_FAQS.map((f) => [f.id, f]));
export function getFaq(id: string): JaiFaq | undefined {
  return byId.get(id);
}

/* ------------------------------- Comprensión ------------------------------- */

/** Normaliza para comparar sin tildes, mayúsculas ni signos. */
export function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(
  "a al algo como con de del el en es esta este ese esa hay la las lo los me mi mis no o para pero por que se si sin su sus te tu un una uno y ya yo hola buenas buenos dias tardes noches gracias quiero puedo tengo necesito ayuda".split(
    " ",
  ),
);

/** Distancia de edición con tope (para errores de tipeo chicos). */
function close(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2 || Math.min(a.length, b.length) < 5) return false;
  const max = a.length >= 8 ? 2 : 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/** ¿Coincide una palabra clave suelta con alguna palabra de la consulta? */
function wordHit(kw: string, words: string[]): boolean {
  const stem = kw.length >= 6 ? kw.slice(0, kw.length - 2) : null;
  return words.some((w) => w === kw || (stem !== null && w.startsWith(stem)) || close(w, kw));
}

export type JaiMatch = { faq: JaiFaq; score: number };

/** Todas las respuestas que coinciden con la consulta, de la más probable a la menos. */
export function rankFaqs(text: string): JaiMatch[] {
  const q = norm(text);
  if (q.length < 2) return [];
  const padded = ` ${q} `;
  const words = q.split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  const out: JaiMatch[] = [];
  for (const f of JAI_FAQS) {
    let score = 0;
    for (const raw of f.keywords) {
      const kw = norm(raw);
      if (!kw) continue;
      if (kw.includes(" ")) {
        // Frase: tiene que aparecer completa (o casi completa) y pesa más.
        if (padded.includes(` ${kw} `)) score += 3 + kw.length / 4;
        else {
          const parts = kw.split(" ").filter((p) => !STOP.has(p));
          if (parts.length > 1 && parts.every((p) => wordHit(p, words))) score += 2 + kw.length / 6;
        }
      } else if (!STOP.has(kw) && wordHit(kw, words)) {
        score += 1 + Math.min(kw.length, 10) / 10;
      }
    }
    if (score > 0) out.push({ faq: f, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** La respuesta más probable, solo si es clara. Devuelve null para ofrecer opciones o derivar. */
export function findFaq(text: string): JaiFaq | null {
  const [best, second] = rankFaqs(text);
  if (!best || best.score < 1.4) return null;
  if (second && second.score >= best.score * 0.85 && best.score < 4) return null;
  return best.faq;
}

/** Hasta 3 respuestas posibles para preguntar «¿Te referís a…?» cuando la consulta no es clara. */
export function suggestFaqs(text: string, max = 3): JaiFaq[] {
  return rankFaqs(text)
    .filter((m) => m.score >= 1)
    .slice(0, max)
    .map((m) => m.faq);
}

/** Preguntas sugeridas según la pantalla donde está la persona. */
export function faqsForPath(pathname: string): JaiFaq[] {
  const pick = (...ids: string[]) => ids.map(getFaq).filter((f): f is JaiFaq => !!f);
  if (pathname.startsWith("/curso") || pathname.startsWith("/guarani-escolar") || pathname.startsWith("/agro"))
    return pick("audio", "error-palabra", "certificado", "offline");
  if (pathname.startsWith("/glosario")) return pick("error-palabra", "audio", "traductor", "teclado");
  if (pathname.startsWith("/validacion") || pathname.startsWith("/cuaderno")) return pick("docente", "error-palabra", "audio");
  if (pathname.startsWith("/instituciones") || pathname.startsWith("/auspiciantes"))
    return pick("instituciones", "auspicio", "respaldo", "docente");
  if (pathname.startsWith("/auth") || pathname.startsWith("/recuperar") || pathname.startsWith("/reset"))
    return pick("contrasena", "empezar", "privacidad");
  if (pathname.startsWith("/dashboard")) return pick("audio", "instalar", "glosario", "certificado");
  return pick("gratis", "empezar", "audio", "que-es");
}

/** Enlace de WhatsApp con el tema de la consulta (y la pantalla) ya cargados. */
export function whatsappLink(topic?: string, pathname?: string) {
  const where = pathname && pathname !== "/" ? ` (estaba en ${pathname})` : "";
  const text = topic
    ? `Hola, le consulté a Jai sobre: "${topic}"${where} y me gustaría hablar con una persona del equipo Jaikuaa.`
    : `Hola, le consulté a Jai${where} y me gustaría hablar con una persona del equipo Jaikuaa.`;
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

/** Antes de guardar una consulta: sin correos, teléfonos ni números largos, y como máximo 200 letras. */
export function scrubJaiText(s: string): string {
  return s
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[correo]")
    .replace(/\+?\d[\d\s.-]{5,}\d/g, "[número]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}
