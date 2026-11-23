import { describe, expect, it } from "vitest";
import { estadoPropiedadObra, obraParaLeer } from "./pagos";

const pago = { estado: "pagado", item_tipo: "obra", formato: "digital", ref_id: "libro-1" };

describe("storefront ownership", () => {
  it("a print-only buyer may review but cannot read digitally", () => {
    expect(estadoPropiedadObra(true, false)).toEqual({ comprado: true, accesoLectura: false });
  });
  it("a buyer with separate digital access can read", () => {
    expect(estadoPropiedadObra(true, true)).toEqual({ comprado: true, accesoLectura: true });
    expect(estadoPropiedadObra(false, true)).toEqual({ comprado: true, accesoLectura: true });
  });
});

describe("reading destination after payment", () => {
  it("never offers digital reading for a printed book", () => {
    expect(obraParaLeer({ ...pago, formato: "fisico" })).toBeNull();
  });
  it("keeps direct reading for a paid digital obra", () => {
    expect(obraParaLeer(pago)).toBe("libro-1");
  });
  it("does not treat a digital product as a readable obra", () => {
    expect(obraParaLeer({ ...pago, item_tipo: "producto" })).toBeNull();
  });
  it("requires confirmed payment", () => {
    for (const estado of ["pendiente", "cancelado"]) {
      expect(obraParaLeer({ ...pago, estado })).toBeNull();
    }
  });
  it("does not offer a destination when no single obra is identified", () => {
    expect(obraParaLeer({ ...pago, ref_id: "" })).toBeNull();
    expect(obraParaLeer(null)).toBeNull();
  });
});