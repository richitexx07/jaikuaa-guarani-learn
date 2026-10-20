import { describe, it, expect } from "vitest";
import { JAI_FAQS, faqsForPath, findFaq, scrubJaiText, suggestFaqs, whatsappLink } from "./jai-faq";

describe("Jai FAQ", () => {
  it("encuentra la respuesta sobre gratuidad sin tildes", () => {
    expect(findFaq("cuanto cuesta?")?.id).toBe("gratis");
    expect(findFaq("cuánto sale")?.id).toBe("gratis");
  });
  it("encuentra recuperación de contraseña, aun con errores de tipeo", () => {
    expect(findFaq("me olvidé la contraseña")?.id).toBe("contrasena");
    expect(findFaq("olvide mi contrasenia")?.id).toBe("contrasena");
  });
  it("sin coincidencia devuelve null para derivar a una persona", () => {
    expect(findFaq("quiero hablar de un contrato raro")).toBeNull();
  });
  it("deriva al número de soporte con el tema", () => {
    const url = whatsappLink("convenio");
    expect(url.startsWith("https://wa.me/595982418732?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("convenio");
  });
  it("incluye la pantalla en el mensaje de WhatsApp", () => {
    expect(decodeURIComponent(whatsappLink("audio", "/curso/guarani/leccion/3"))).toContain("/curso/guarani/leccion/3");
  });
  it("nunca usa palabras prohibidas sobre el Ateneo", () => {
    const all = JAI_FAQS.map((f) => f.answer).join(" ").toLowerCase();
    for (const w of ["aval", "homologad", "respaldo del ateneo", "certificado por el ateneo", "convenio firmado"]) {
      expect(all).not.toContain(w);
    }
  });

  // Consultas reales que antes Jai no entendía o respondía mal.
  it.each([
    ["no escucho los audios", "audio"],
    ["no se oye nada", "audio"],
    ["hola, no suena la voz de las palabras", "audio"],
    ["me di cuenta que no anda", "no-carga"],
    ["quiero borrar mis datos", "privacidad"],
    ["se puede usar desde españa?", "extranjero"],
    ["que es jaikuaa", "que-es"],
    ["soy profe de guarani", "docente"],
    ["encontré un error en una palabra", "error-palabra"],
    ["la página no carga", "no-carga"],
    ["quiero instalarla en mi iphone", "instalar"],
    ["como se dice perro", "traductor"],
  ])("«%s» → %s", (q, id) => {
    expect(findFaq(q)?.id).toBe(id);
  });

  it("ante una consulta ambigua ofrece opciones en vez de adivinar", () => {
    expect(suggestFaqs("app").length).toBeGreaterThan(0);
  });

  it("sugiere preguntas según la pantalla", () => {
    expect(faqsForPath("/curso/guarani/leccion/2")[0].id).toBe("audio");
    expect(faqsForPath("/glosario")[0].id).toBe("error-palabra");
  });

  it("cada pregunta relacionada existe", () => {
    const ids = new Set(JAI_FAQS.map((f) => f.id));
    for (const f of JAI_FAQS) for (const r of f.related ?? []) expect(ids.has(r)).toBe(true);
  });

  it("al guardar una consulta borra correos y teléfonos", () => {
    expect(scrubJaiText("escribime a juan.perez@gmail.com o al 0981 123 456")).toBe("escribime a [correo] o al [número]");
  });
});
