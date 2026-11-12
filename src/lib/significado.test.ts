import { describe, expect, it } from "vitest";
import { localizarVocab, significado } from "@/lib/significado";

describe("significado en el idioma de la persona", () => {
  const v = { gn: "Palabra", es: "Gracias", sig: { en: "Thank you", pt: "  " } };
  it("usa lo aprobado y si falta muestra el castellano", () => {
    expect(significado(v, "en")).toBe("Thank you");
    expect(significado(v, "pt")).toBe("Gracias");
    expect(significado(v, "de")).toBe("Gracias");
    expect(significado(v, "es")).toBe("Gracias");
    expect(significado({ es: "Sí" }, "fr")).toBe("Sí");
  });
  it("nunca toca el guaraní y guarda el castellano original", () => {
    const [x] = localizarVocab([v], "en");
    expect(x).toMatchObject({ gn: "Palabra", es: "Thank you", orig: "Gracias" });
  });
});
