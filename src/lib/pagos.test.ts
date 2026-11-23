import { describe, expect, it } from "vitest";
import { obraParaLeer } from "./pagos";

const pago = { estado: "pagado", item_tipo: "obra", formato: "digital", ref_id: "libro-1" };

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