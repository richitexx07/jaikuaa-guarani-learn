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
    expect(isGuestPath("/juegos/karaoke")).toBe(false);
    expect(isGuestPath("/dashboard")).toBe(false);
    expect(isGuestPath("/admin/corpus")).toBe(false);
  });
});

describe("seguí donde quedaste", () => {
  it("recuerda el último lugar y no acepta direcciones de afuera", () => {
    rememberPlace({ href: "/juegos/ahorcado", title: "Ahorcado con chipas", kind: "game" });
    expect(readPlace()?.title).toBe("Ahorcado con chipas");
    rememberPlace({ href: "//otro-sitio.com", title: "x", kind: "game" });
    expect(readPlace()?.href).toBe("/juegos/ahorcado");
    expect(readPlace(Date.now() + 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});
