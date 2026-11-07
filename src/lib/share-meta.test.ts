import { describe, expect, it } from "vitest";
import { shareMetaFor } from "./share-meta";

describe("vista previa de los enlaces", () => {
  it("cada juego con portada muestra su propia imagen", () => {
    expect(shareMetaFor("/juegos/penales").image).toBe("https://www.jaikuaa.com/og/penales.jpg");
    expect(shareMetaFor("/juegos/karaoke/").image).toBe("https://www.jaikuaa.com/og/karaoke.jpg");
    expect(shareMetaFor("/juegos/consultorio").title).toContain("Consultorio");
  });
  it("las demás páginas usan la imagen general", () => {
    expect(shareMetaFor("/").image).toBeUndefined();
    expect(shareMetaFor("/juegos").image).toBeUndefined();
    expect(shareMetaFor("/juegos/inventado").image).toBeUndefined();
  });
});
