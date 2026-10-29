import { describe, expect, it } from "vitest";
import { translate } from "./i18n";
describe("idioma de la interfaz", () => {
  it("traduce el botón de ingreso a los tres idiomas", () => {
    expect(translate("es", "auth.login")).toBe("Iniciar sesión");
    expect(translate("pt", "auth.login")).toBe("Entrar");
    expect(translate("en", "auth.login")).toBe("Sign in");
  });
});
describe("japonés y ruso", () => {
  it("traducen el ingreso y usan inglés en pantallas sin traducir", async () => {
    const { contentLang } = await import("./i18n");
    expect(translate("ja", "auth.login")).toBe("ログイン");
    expect(translate("ru", "auth.login")).toBe("Войти");
    expect(contentLang("ru")).toBe("ru");
  });
});
describe("japonés, ruso y coreano en pantallas internas", () => {
  it("el coreano traduce el ingreso y los juegos dejan de quedar en inglés", async () => {
    expect(translate("ko", "auth.login")).not.toBe("Sign in");
    const { GT } = await import("./i18n-games");
    const g = GT.games as Record<string, string>;
    expect(g.ru).not.toBe("Games");
    expect(g.ja).not.toBe("Games");
    expect(g.ko).not.toBe("Games");
  });
});

describe("árabe, italiano, quechua e hindi", () => {
  it("traducen el ingreso y quedan marcados como preliminares", async () => {
    const { PRELIMINARY_LANGS } = await import("./i18n");
    for (const l of ["ar", "it", "qu", "hi"] as const) {
      expect(translate(l, "auth.login")).not.toBe("Sign in");
      expect(PRELIMINARY_LANGS).toContain(l);
    }
  });
});
