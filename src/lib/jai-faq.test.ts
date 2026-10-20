import { describe, it, expect } from "vitest";
import { findFaq, whatsappLink, JAI_FAQS } from "./jai-faq";

describe("Jai FAQ", () => {
  it("encuentra la respuesta sobre gratuidad sin tildes", () => {
    expect(findFaq("cuanto cuesta?")?.id).toBe("gratis");
  });
  it("encuentra recuperación de contraseña", () => {
    expect(findFaq("me olvidé la contraseña")?.id).toBe("contrasena");
  });
  it("sin coincidencia devuelve null para derivar a una persona", () => {
    expect(findFaq("quiero hablar de un contrato raro")).toBeNull();
  });
  it("deriva al número de soporte con el tema", () => {
    const url = whatsappLink("convenio");
    expect(url.startsWith("https://wa.me/595982418732?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("convenio");
  });
  it("nunca usa palabras prohibidas sobre el Ateneo", () => {
    const all = JAI_FAQS.map((f) => f.answer).join(" ").toLowerCase();
    for (const w of ["aval", "homologad", "respaldo del ateneo", "certificado por el ateneo"]) {
      expect(all).not.toContain(w);
    }
  });
});
