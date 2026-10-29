import { describe, expect, it } from "vitest";
import { PUBLIC_SLUGS, filterPlayableSlugs } from "./audio-access";

const published = new Set(["jaguarete-rabo", "kuatia"]);

describe("acceso a las grabaciones", () => {
  it("el público no escucha una palabra en borrador", () => {
    expect(
      filterPlayableSlugs(["mboehara-borrador"], { isStaff: false, published }),
    ).toEqual([]);
  });

  it("el público escucha una palabra publicada", () => {
    expect(filterPlayableSlugs(["kuatia"], { isStaff: false, published })).toEqual([
      "kuatia",
    ]);
  });

  it("las muestras de la portada suenan aunque no estén en la lista de publicadas", () => {
    expect(
      filterPlayableSlugs(["aguyje", "secreto"], {
        isStaff: false,
        published: new Set<string>(),
      }),
    ).toEqual(["aguyje"]);
  });

  it("la cadena de validación sí escucha los borradores", () => {
    expect(
      filterPlayableSlugs(["mboehara-borrador", "kuatia"], {
        isStaff: true,
        published: new Set<string>(),
      }),
    ).toEqual(["mboehara-borrador", "kuatia"]);
  });

  it("con el corpus todavía vacío solo suenan las muestras públicas", () => {
    expect(
      filterPlayableSlugs(["aguyje", "jagua", "che-vya", "propuesta-pendiente"], {
        isStaff: false,
        published: new Set<string>(),
      }),
    ).toEqual(["aguyje", "che-vya"]);
  });
});
