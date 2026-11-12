import { describe, expect, it } from "vitest";
import {
  CONVENIOS, codigoConvenio, esCodigoConvenio, faltaParaFirmar, FIRMA_VACIA, normalizarCI, obrasLlenas, textoCanonico, type Firma,
} from "@/lib/convenios";

const llena: Firma = {
  nombre: "Ana Prueba", ci: "1.234.567", whatsapp: "0981 123 456", ciudad: "Asunción",
  roles: ["autor"], permisos: ["obra", "imagen"], obras: [{ titulo: "Obra de prueba", autor: "Ana", interprete: "", productor: "" }], acepto: true,
};

describe("convenios", () => {
  it("cada programa tiene versión, cláusulas y la firma electrónica", () => {
    for (const c of Object.values(CONVENIOS)) {
      expect(c.version).toMatch(new RegExp(`^${c.programa}-`));
      expect(c.clausulas.some((k) => k.t === "Firma electrónica" && k.x.includes("6822"))).toBe(true);
      expect(c.alMenosUno.every((id) => c.permisos.some((p) => p.id === id))).toBe(true);
    }
  });

  it("el texto canónico cambia si cambia una cláusula", () => {
    const c = CONVENIOS.purahei;
    const otro = { ...c, clausulas: c.clausulas.map((k, i) => (i === 1 ? { ...k, x: `${k.x} ` } : k)) };
    expect(textoCanonico(otro)).not.toBe(textoCanonico(c));
    expect(textoCanonico(c)).toContain(c.version);
  });

  it("no usa palabras prohibidas en los textos", () => {
    const todo = Object.values(CONVENIOS).map(textoCanonico).join(" ").toLowerCase();
    for (const w of ["validado", "homologado", "certificado", "pionero", "único", "che "]) expect(todo).not.toContain(w);
  });

  it("pide lo necesario para firmar", () => {
    expect(faltaParaFirmar(CONVENIOS.purahei, llena)).toEqual([]);
    const falta = faltaParaFirmar(CONVENIOS.purahei, FIRMA_VACIA);
    expect(falta).toContain("Tu número de cédula");
    expect(falta).toContain("Marcar que leíste y aceptás el convenio");
    expect(faltaParaFirmar(CONVENIOS.purahei, { ...llena, permisos: ["imagen"] })).toEqual(["Qué autorizás de tus obras"]);
    expect(faltaParaFirmar(CONVENIOS.libreria, { ...llena, roles: ["interprete"], permisos: ["texto"] })).toEqual(["En qué carácter firmás"]);
  });

  it("limpia cédula y obras", () => {
    expect(normalizarCI("1.234.567")).toBe("1234567");
    expect(normalizarCI("12")).toBeNull();
    expect(obrasLlenas([{ titulo: "  ", autor: "", interprete: "", productor: "" }, { titulo: " A ", autor: "", interprete: "", productor: "" }]))
      .toEqual([{ titulo: "A", autor: "", interprete: "", productor: "" }]);
  });

  it("arma códigos verificables", () => {
    const c = codigoConvenio(2026, new Uint8Array([0, 1, 2, 31, 32, 255]));
    expect(esCodigoConvenio(c)).toBe(true);
    expect(esCodigoConvenio("CV-2026-0OI111")).toBe(false);
  });
});
