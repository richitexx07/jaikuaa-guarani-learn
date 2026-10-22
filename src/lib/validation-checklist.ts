/** Las cuatro preguntas que un docente se hace antes de aprobar una palabra. */
export const FOUR_QUESTIONS: { id: string; q: string; hint: string }[] = [
  { id: "escritura", q: "¿Está bien escrita?", hint: "Letras, tildes y nasales según la grafía oficial." },
  { id: "significado", q: "¿El significado es correcto?", hint: "La traducción al castellano dice lo mismo." },
  { id: "audio", q: "¿El audio suena bien?", hint: "Se entiende y está bien pronunciada (si tiene audio)." },
  { id: "uso", q: "¿Sirve para enseñar?", hint: "Es de uso real y apropiada para los alumnos." },
];

/** Texto para recordar a los docentes por WhatsApp. Lo envía Richard, nunca la plataforma. */
export function weeklyReminderText(pending: number, inLessons: number, reports: number): string {
  const parts = [
    "Buenas, profe 👋",
    "",
    pending > 0
      ? `Esta semana en Jaikuaa hay ${pending} palabras esperando su mirada${
          inLessons > 0 ? ` (${inLessons} son de las lecciones que los alumnos ven primero)` : ""
        }.`
      : "Esta semana no quedan palabras pendientes en Jaikuaa. ¡Gracias!",
    reports > 0 ? `También hay ${reports} ${reports === 1 ? "aviso de error" : "avisos de error"} para mirar.` : "",
    "",
    "Con 10 minutos alcanza: entre a www.jaikuaa.com/docente y toque «Validar palabras».",
    "",
    "¡Gracias por cuidar cada palabra! 🇵🇾🚩",
  ];
  return parts.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}
