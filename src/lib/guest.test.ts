import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { isGuestPath } from "./guest";
import { readPlace, rememberPlace } from "./last-place";

describe("jugar sin cuenta", () => {
  it("solo los juegos elegidos se abren sin cuenta", () => {
    expect(isGuestPath("/juegos")).toBe(true);
    expect(isGuestPath("/juegos/")).toBe(true);
    expect(isGuestPath("/juegos/ahorcado")).toBe(true);
    expect(isGuestPath("/juegos/duelo")).toBe(true);
    expect(isGuestPath("/juegos/karaoke")).toBe(true);
    expect(isGuestPath("/trivia/historia")).toBe(true);
    expect(isGuestPath("/trivia/historia/otra")).toBe(false);
    // La Palabra del día, Pronunciá y Ñe'ẽ Rape se abrieron sin cuenta (noviembre 2026).
    expect(isGuestPath("/juegos/palabra-del-dia")).toBe(true);
    expect(isGuestPath("/juegos/nee-rape")).toBe(true);
    expect(isGuestPath("/pronunciar")).toBe(true);
    expect(isGuestPath("/cuaderno")).toBe(false);
    expect(isGuestPath("/dashboard")).toBe(false);
    expect(isGuestPath("/admin/corpus")).toBe(false);
  });

  it("solo la primera lección del curso se hace sin cuenta", () => {
    expect(isGuestPath("/curso/guarani/leccion/1")).toBe(true);
    expect(isGuestPath("/curso/guarani/leccion/1/")).toBe(true);
    expect(isGuestPath("/curso/guarani/leccion/2")).toBe(false);
    expect(isGuestPath("/curso/guarani")).toBe(false);
    expect(isGuestPath("/curso/ingles/leccion/1")).toBe(false);
  });
});

describe("seguí donde quedaste", () => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });

  it("recuerda el último lugar y no acepta direcciones de afuera", () => {
    rememberPlace({ href: "/juegos/ahorcado", title: "Ahorcado con chipas", kind: "game" });
    expect(readPlace()?.title).toBe("Ahorcado con chipas");
    rememberPlace({ href: "//otro-sitio.com", title: "x", kind: "game" });
    expect(readPlace()?.href).toBe("/juegos/ahorcado");
    expect(readPlace(Date.now() + 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});

import { shouldShowWelcome } from "./welcome";

describe("bienvenida para cuentas nuevas", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");
  it("solo cuentas de menos de 2 días que no la vieron", () => {
    expect(shouldShowWelcome("2026-11-01T11:00:00Z", false, now)).toBe(true);
    expect(shouldShowWelcome("2026-11-01T11:00:00Z", true, now)).toBe(false);
    expect(shouldShowWelcome("2026-10-20T11:00:00Z", false, now)).toBe(false);
    expect(shouldShowWelcome(undefined, false, now)).toBe(false);
  });
});
