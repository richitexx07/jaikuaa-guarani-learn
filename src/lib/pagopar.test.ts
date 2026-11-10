import { describe, expect, it } from "vitest";
import { igualesSeguro, montoTexto, sha1, tokenAviso, tokenInicio, urlPagoPagopar } from "./pagopar";

describe("pagopar", () => {
  it("sha1 conocido", async () => {
    expect(await sha1("abc")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });
  it("monto entero sin decimales", () => {
    expect(montoTexto(50000)).toBe("50000");
  });
  it("token de inicio = sha1(privada + pedido + monto)", async () => {
    expect(await tokenInicio("k", "p1", 50000)).toBe(await sha1("kp150000"));
  });
  it("token del aviso = sha1(privada + hash)", async () => {
    expect(await tokenAviso("k", "h")).toBe(await sha1("kh"));
  });
  it("comparación segura", () => {
    expect(igualesSeguro("abc", "abc")).toBe(true);
    expect(igualesSeguro("abc", "abd")).toBe(false);
  });
  it("url de pago", () => {
    expect(urlPagoPagopar("xyz")).toBe("https://www.pagopar.com/pagos/xyz");
  });
});
