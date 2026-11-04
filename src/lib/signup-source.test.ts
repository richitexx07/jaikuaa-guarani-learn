import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { cleanSource, sourceToClaim } from "./signup-source";

describe("origen de los registros", () => {
  it("limpia el nombre del lugar", () => {
    expect(cleanSource(" Facebook ")).toBe("facebook");
    expect(cleanSource("WhatsApp-Estado")).toBe("whatsapp-estado");
    expect(cleanSource("Televisión")).toBe("television");
    expect(cleanSource("<script>")).toBe("script");
    expect(cleanSource("x")).toBeNull();
    expect(cleanSource(null)).toBeNull();
  });

  it("anota el origen solo en cuentas nuevas y una sola vez", () => {
    const now = Date.parse("2026-11-01T00:00:00Z");
    const nueva = "2026-10-31T22:00:00Z";
    expect(sourceToClaim({}, nueva, "facebook", now)).toBe("facebook");
    expect(sourceToClaim({}, nueva, null, now)).toBe("directo");
    expect(sourceToClaim({ signup_source: "whatsapp" }, nueva, "facebook", now)).toBeNull();
    expect(sourceToClaim({}, "2026-10-01T00:00:00Z", "facebook", now)).toBeNull();
    expect(sourceToClaim(undefined, undefined, "facebook", now)).toBeNull();
  });
});

import { sourceFromReferrer as fromRef } from "./signup-source";
describe("origen por la página de donde vino", () => {
  it("reconoce Facebook e Instagram sin ?de=", () => {
    expect(fromRef("https://l.facebook.com/l.php?u=x")).toBe("facebook");
    expect(fromRef("https://l.instagram.com/")).toBe("instagram");
    expect(fromRef("https://www.jaikuaa.com/")).toBeNull();
    expect(fromRef("")).toBeNull();
  });
});
