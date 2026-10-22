import { describe, expect, it } from "vitest";
import { FOUR_QUESTIONS, weeklyReminderText } from "./validation-checklist";

describe("cuatro preguntas", () => {
  it("son cuatro y cubren escritura, significado, audio y uso", () => {
    expect(FOUR_QUESTIONS.map((q) => q.id)).toEqual(["escritura", "significado", "audio", "uso"]);
  });
});

describe("recordatorio semanal", () => {
  it("lleva los números, el enlace y termina con las banderas", () => {
    const t = weeklyReminderText(79, 30, 2);
    expect(t).toContain("79 palabras");
    expect(t).toContain("30 son de las lecciones");
    expect(t).toContain("2 avisos de error");
    expect(t).toContain("www.jaikuaa.com/docente");
    expect(t.trim().endsWith("🇵🇾🚩")).toBe(true);
    expect(t).not.toContain("🌿");
    expect(t).not.toMatch(/\n\n\n/);
  });

  it("sin pendientes agradece y no menciona avisos", () => {
    const t = weeklyReminderText(0, 0, 0);
    expect(t).toContain("no quedan palabras pendientes");
    expect(t).not.toContain("aviso");
    expect(t).not.toMatch(/\n\n\n/);
  });

  it("usa singular con un solo aviso", () => {
    expect(weeklyReminderText(5, 0, 1)).toContain("1 aviso de error");
  });
});
