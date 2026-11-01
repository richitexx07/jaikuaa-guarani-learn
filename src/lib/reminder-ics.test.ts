import { describe, expect, it } from "vitest";
import { buildReminderIcs, clampTime } from "./reminder-ics";

describe("recordatorio diario", () => {
  it("arma un evento diario desde mañana a la hora elegida, con alarma", () => {
    const ics = buildReminderIcs(20, 0, new Date("2026-11-01T12:00:00Z"));
    expect(ics).toContain("DTSTART:20261102T200000");
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("https://www.jaikuaa.com/juegos/palabra-del-dia");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
  it("corrige horas imposibles", () => {
    expect(clampTime(25, 70)).toEqual({ h: 23, m: 59 });
    expect(clampTime(Number.NaN, -3)).toEqual({ h: 20, m: 0 });
  });
});
