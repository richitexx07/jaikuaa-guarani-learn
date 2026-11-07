/**
 * Aula para docentes: grupos con código, tareas (lecciones y juegos) y avance de cada alumno.
 * Este archivo solo tiene datos y cálculos puros, para usarlos en el servidor, en la pantalla y en las pruebas.
 */

/** Juegos que se pueden asignar como tarea (mismo nombre que registra el juego al terminar). */
export const JUEGOS_ASIGNABLES = [
  { ref: "consultorio", titulo: "Consultorio de Jai (guaraní médico)" },
  { ref: "ahorcado", titulo: "Ahorcado con chipas" },
  { ref: "sopa-de-letras", titulo: "Sopa de letras" },
  { ref: "memoria", titulo: "Memoria" },
  { ref: "penales", titulo: "Penales" },
  { ref: "tembiu", titulo: "Tembi'u Paraguái" },
  { ref: "karaoke", titulo: "Purahéi Karaoke" },
  { ref: "taanga", titulo: "Ta'anga · Claqueta de Jai" },
  { ref: "tekojoja", titulo: "Tekojoja · Juzgado de Paz" },
  { ref: "duelo", titulo: "Duelo Cara a Cara" },
  { ref: "trivia-duelo", titulo: "Duelo de Trivia" },
  { ref: "nee-rape", titulo: "Ñe'ẽ Rape · A distancia" },
] as const;

export type TareaTipo = "leccion" | "juego";

export type Tarea = {
  id: string;
  tipo: TareaTipo;
  ref: string;
  titulo: string;
  nota: string;
  fechaLimite: string | null;
  createdAt: string;
};

/** Registro de avance: lo que el juego o la lección guardó al terminar. */
export type Avance = { userId: string; source: "lesson" | "game"; ref: string; at: string };

/** Letras sin O/0 ni I/1 para que el código se dicte sin confusiones. */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function azarSeguro(): number {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0]! / 2 ** 32;
}

export function nuevoCodigo(rand: () => number = azarSeguro): string {
  let c = "";
  for (let i = 0; i < 6; i++) c += ALFABETO[Math.floor(rand() * ALFABETO.length)];
  return c;
}

export function normalizarCodigo(x: string): string {
  return x.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

/** Lo que guarda la lección al terminar (por ejemplo «guarani:3»). */
export function refLeccion(n: number): string {
  return `guarani:${n}`;
}

/**
 * ¿El alumno hizo la tarea?
 * - Lección: cuenta si la terminó alguna vez (no hace falta repetirla).
 * - Juego: cuenta si lo jugó después de que se asignó la tarea.
 */
export function tareaHecha(t: Pick<Tarea, "tipo" | "ref" | "createdAt">, avances: Avance[]): boolean {
  if (t.tipo === "leccion") return avances.some((a) => a.source === "lesson" && a.ref === t.ref);
  return avances.some((a) => a.source === "game" && a.ref === t.ref && a.at >= t.createdAt);
}

/** «hoy» en Paraguay, como AAAA-MM-DD. */
export function hoyPy(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

export type EstadoTarea = "hecha" | "pendiente" | "vencida";

export function estadoTarea(hecha: boolean, fechaLimite: string | null, hoy: string): EstadoTarea {
  if (hecha) return "hecha";
  if (fechaLimite && fechaLimite < hoy) return "vencida";
  return "pendiente";
}

export function linkAula(codigo: string): string {
  return `https://www.jaikuaa.com/aula?codigo=${codigo}`;
}

export function mensajeInvitacion(nombreAula: string, codigo: string): string {
  return `Sumate a mi aula «${nombreAula}» en Jaikuaa para estudiar guaraní: ${linkAula(codigo)} (código ${codigo}) 🇵🇾`;
}

/** 2026-11-05 → «5/11/2026». */
export function fechaCorta(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}
