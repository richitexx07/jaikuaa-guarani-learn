import { describe, expect, it } from "vitest";
import { armarAviso, firmarAviso, urlAvisoValida } from "./avisos";

describe("avisos al CRM", () => {
  it("firma igual que HMAC-SHA256 estándar", async () => {
    // Vector conocido: HMAC_SHA256("key", "The quick brown fox jumps over the lazy dog")
    expect(await firmarAviso("key", "The quick brown fox jumps over the lazy dog")).toBe(
      "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    );
  });

  it("arma el aviso con id, evento, fecha y datos", () => {
    expect(armarAviso("pago.confirmado", { montoGs: 50000 }, "id-1", "2026-11-21T12:00:00Z")).toEqual({
      id: "id-1",
      evento: "pago.confirmado",
      fecha: "2026-11-21T12:00:00Z",
      datos: { montoGs: 50000 },
    });
  });

  it("solo acepta https públicas", () => {
    expect(urlAvisoValida("https://hook.make.com/abc")).toBe("https://hook.make.com/abc");
    expect(urlAvisoValida("http://hook.make.com/abc")).toBeNull();
    expect(urlAvisoValida("https://localhost/x")).toBeNull();
    expect(urlAvisoValida("https://192.168.0.10/x")).toBeNull();
    expect(urlAvisoValida("no es url")).toBeNull();
    expect(urlAvisoValida(undefined)).toBeNull();
  });
});
