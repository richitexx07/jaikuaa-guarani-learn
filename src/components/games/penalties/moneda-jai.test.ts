import { describe, expect, it } from "vitest";
import { ladoQueCae } from "./moneda-jai";

describe("moneda de Jai", () => {
  it("si el que eligió gana el sorteo, cae lo que eligió", () => {
    expect(ladoQueCae("cara", "host")).toBe("cara");
    expect(ladoQueCae("cruz", "host")).toBe("cruz");
  });
  it("si gana el rival, cae el otro lado", () => {
    expect(ladoQueCae("cara", "guest")).toBe("cruz");
    expect(ladoQueCae("cruz", "guest")).toBe("cara");
  });
});
