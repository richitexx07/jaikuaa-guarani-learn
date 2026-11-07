import { describe, expect, it } from "vitest";
import { hoyPy, puntosDeHoy } from "./meta-diaria";
import { puedeMostrar } from "@/components/guardar-puntos";

describe("meta diaria", () => {
  it("los puntos de otro día no cuentan para hoy", () => {
    expect(puntosDeHoy({ dia: "2026-11-05", pts: 30 }, "2026-11-06")).toBe(0);
    expect(puntosDeHoy({ dia: "2026-11-06", pts: 30 }, "2026-11-06")).toBe(30);
    expect(puntosDeHoy(null, "2026-11-06")).toBe(0);
  });
  it("el día se cuenta con la hora de Paraguay", () => {
    // 01:30 en UTC del 7 = 22:30 del 6 en Paraguay
    expect(hoyPy(new Date("2026-11-07T01:30:00Z"))).toBe("2026-11-06");
  });
});

describe("guardá tus puntos", () => {
  it("si dijo «Después», no vuelve a aparecer hasta el día siguiente", () => {
    const ahora = Date.UTC(2026, 10, 6, 12);
    expect(puedeMostrar(ahora, null)).toBe(true);
    expect(puedeMostrar(ahora, ahora - 60 * 60 * 1000)).toBe(false);
    expect(puedeMostrar(ahora, ahora - 25 * 60 * 60 * 1000)).toBe(true);
  });
});
