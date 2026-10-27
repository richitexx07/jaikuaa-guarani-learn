import { describe, expect, it } from "vitest";
import { translate } from "./i18n";
describe("idioma de la interfaz", () => {
  it("traduce el botón de ingreso a los tres idiomas", () => {
    expect(translate("es", "auth.login")).toBe("Iniciar sesión");
    expect(translate("pt", "auth.login")).toBe("Entrar");
    expect(translate("en", "auth.login")).toBe("Sign in");
  });
});
