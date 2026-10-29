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
    expect(contentLang("ru")).toBe("en");
  });
});
