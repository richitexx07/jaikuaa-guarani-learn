import { describe, expect, it } from "vitest";
import { estadoTarea, fechaCorta, mensajeInvitacion, normalizarCodigo, nuevoCodigo, refLeccion, tareaHecha, type Avance } from "./aula";

describe("aula", () => {
  it("genera códigos de 6 letras sin O, 0, I ni 1", () => {
    for (let i = 0; i < 200; i++) {
      const c = nuevoCodigo();
      expect(c).toMatch(/^[A-Z0-9]{6}$/);
      expect(c).not.toMatch(/[O0I1]/);
    }
  });

  it("normaliza lo que escribe el alumno", () => {
    expect(normalizarCodigo(" k7m-2qx ")).toBe("K7M2QX");
    expect(normalizarCodigo("abcdefgh")).toBe("ABCDEF");
  });

  it("una lección cuenta si se terminó alguna vez; un juego, solo si se jugó después de asignarlo", () => {
    const av: Avance[] = [
      { userId: "u", source: "lesson", ref: refLeccion(3), at: "2026-10-01T10:00:00Z" },
      { userId: "u", source: "game", ref: "memoria", at: "2026-10-01T10:00:00Z" },
    ];
    expect(tareaHecha({ tipo: "leccion", ref: "guarani:3", createdAt: "2026-10-20T00:00:00Z" }, av)).toBe(true);
    expect(tareaHecha({ tipo: "leccion", ref: "guarani:4", createdAt: "2026-10-20T00:00:00Z" }, av)).toBe(false);
    expect(tareaHecha({ tipo: "juego", ref: "memoria", createdAt: "2026-10-20T00:00:00Z" }, av)).toBe(false);
    expect(tareaHecha({ tipo: "juego", ref: "memoria", createdAt: "2026-09-20T00:00:00Z" }, av)).toBe(true);
  });

  it("marca vencida la tarea sin hacer con fecha pasada", () => {
    expect(estadoTarea(false, "2026-10-01", "2026-10-26")).toBe("vencida");
    expect(estadoTarea(false, "2026-10-30", "2026-10-26")).toBe("pendiente");
    expect(estadoTarea(true, "2026-10-01", "2026-10-26")).toBe("hecha");
    expect(estadoTarea(false, null, "2026-10-26")).toBe("pendiente");
  });

  it("arma la invitación con el enlace y el código", () => {
    const m = mensajeInvitacion("2.º Media", "K7M2QX");
    expect(m).toContain("https://www.jaikuaa.com/aula?codigo=K7M2QX");
    expect(m).toContain("K7M2QX");
    expect(fechaCorta("2026-11-05")).toBe("5/11/2026");
  });
});
