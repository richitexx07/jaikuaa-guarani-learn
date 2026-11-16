import { describe, expect, it } from "vitest";
import { castellano, localizarVocab, significado } from "@/lib/significado";

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
  it("castellano() identifica la palabra por su castellano, no por la traducción", () => {
    const [x] = localizarVocab([{ gn: "Oga", es: "Cabeza", sig: { pt: "Cabeça" } }], "pt");
    expect(x.es).toBe("Cabeça"); // lo que ve la persona
    expect(castellano(x)).toBe("Cabeza"); // lo que usa el juego para saber de qué palabra se trata
    expect(castellano({ es: "Mano" })).toBe("Mano"); // sin traducción aprobada
  });
  it("dos palabras distintas que comparten traducción no se borran del juego", () => {
    // «Cabeza» y «Testa» pueden traducirse igual al portugués: ninguna de las dos debe perderse.
    const vocab = localizarVocab(
      [
        { gn: "Oga", es: "Cabeza", sig: { pt: "Cabeça" } },
        { gn: "Akã", es: "Testa", sig: { pt: "Cabeça" } },
      ],
      "pt",
    );
    const seen = new Set<string>();
    const pool = vocab.filter((w) => {
      const k = castellano(w).trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    expect(pool.map((w) => w.gn)).toEqual(["Oga", "Akã"]);
  });
});
