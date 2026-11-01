/**
 * Recordatorio diario sin servidor: un evento de calendario que se repite todos los días
 * a la hora que la persona elige, con alarma y el enlace a la Palabra del día.
 * Hora «flotante» (sin zona): suena a esa hora en el celular, esté donde esté.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export function clampTime(h: number, m: number): { h: number; m: number } {
  const hh = Number.isFinite(h) ? Math.min(23, Math.max(0, Math.trunc(h))) : 20;
  const mm = Number.isFinite(m) ? Math.min(59, Math.max(0, Math.trunc(m))) : 0;
  return { h: hh, m: mm };
}

export function buildReminderIcs(hour: number, minute: number, now = new Date()): string {
  const { h, m } = clampTime(hour, minute);
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000); // desde mañana
  const day = `${start.getUTCFullYear()}${pad(start.getUTCMonth() + 1)}${pad(start.getUTCDate())}`;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = "https://www.jaikuaa.com/juegos/palabra-del-dia";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jaikuaa//Recordatorio diario//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:jaikuaa-palabra-del-dia-${pad(h)}${pad(m)}@jaikuaa.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${day}T${pad(h)}${pad(m)}00`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Jaikuaa: tu palabra del día",
    `DESCRIPTION:Un minuto de guaraní con voces reales. Abrí: ${url}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tu palabra del día te espera en Jaikuaa",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
