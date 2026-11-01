import { beforeAll, describe, expect, it } from "vitest";
import { translate } from "./i18n";
import { ensureOverlay } from "./i18n-overlay";

// Las traducciones de los idiomas extra se descargan bajo pedido (no viajan en el arranque).
beforeAll(async () => {
  await ensureOverlay("ja");
});
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

describe("hebreo, turco y suajili", () => {
  it("traducen el ingreso y quedan marcados como preliminares", async () => {
    const { PRELIMINARY_LANGS } = await import("./i18n");
    for (const l of ["he", "tr", "sw"] as const) {
      expect(translate(l, "auth.login")).not.toBe("Sign in");
      expect(PRELIMINARY_LANGS).toContain(l);
    }
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

describe("idiomas en pausa", () => {
  it("quechua y suajili no se ofrecen en el selector hasta la revisión nativa", async () => {
    const { UI_LANGS, PAUSED_LANGS, isAppLang } = await import("./i18n");
    for (const l of ["qu", "sw"] as const) {
      expect(PAUSED_LANGS).toContain(l);
      expect(UI_LANGS).not.toContain(l);
      expect(isAppLang(l)).toBe(false);
    }
    expect(UI_LANGS).toHaveLength(14);
  });
});
