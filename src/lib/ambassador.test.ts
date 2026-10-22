import { describe, expect, it } from "vitest";
import { cleanRefCode, levelFor } from "./ambassador";

describe("embajadores", () => {
  it("sin invitados que empezaron es Aprendiz embajador", () => {
    expect(levelFor(0).current.name).toBe("Aprendiz embajador");
  });
  it("con 5 invitados que empezaron es Embajador destacado", () => {
    expect(levelFor(5).current.name).toBe("Embajador destacado");
    expect(levelFor(5).next?.min).toBe(15);
  });
  it("solo acepta códigos de 8 caracteres válidos", () => {
    expect(cleanRefCode(" ab12cd34 ")).toBe("AB12CD34");
    expect(cleanRefCode("hola")).toBeNull();
  });
});
