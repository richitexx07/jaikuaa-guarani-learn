import { describe, expect, it } from "vitest";
import { priorizarNuevas } from "./rotacion";

describe("rotación de palabras", () => {
  it("las palabras vistas hace poco van al final, la más reciente última", () => {
    const mazo = ["a", "b", "c", "d", "e"];
    expect(priorizarNuevas(mazo, ["b", "d"], (x) => x)).toEqual(["a", "c", "e", "d", "b"]);
  });
  it("si todas se vieron, primero la que se vio hace más tiempo", () => {
    expect(priorizarNuevas(["a", "b", "c"], ["c", "a", "b"], (x) => x)).toEqual(["b", "a", "c"]);
  });
  it("sin historial, el mazo queda igual", () => {
    expect(priorizarNuevas(["x", "y"], [], (x) => x)).toEqual(["x", "y"]);
  });
});
