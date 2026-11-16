import { describe, expect, it } from "vitest";
import { avanzar, retroceder } from "./modo-clase";

describe("modo aula (proyectar)", () => {
  it("cada palabra pasa por ver, repetir y significado, y después sigue la próxima", () => {
    expect(avanzar({ i: 0, paso: "ver" }, 3)).toEqual({ i: 0, paso: "repetir" });
    expect(avanzar({ i: 0, paso: "repetir" }, 3)).toEqual({ i: 0, paso: "significado" });
    expect(avanzar({ i: 0, paso: "significado" }, 3)).toEqual({ i: 1, paso: "ver" });
    expect(avanzar({ i: 2, paso: "significado" }, 3)).toBe("fin");
  });

  it("volver atrás no se pasa del principio", () => {
    expect(retroceder({ i: 1, paso: "ver" })).toEqual({ i: 0, paso: "significado" });
    expect(retroceder({ i: 0, paso: "ver" })).toEqual({ i: 0, paso: "ver" });
  });
});
