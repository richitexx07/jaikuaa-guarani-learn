import { describe, expect, it } from "vitest";
import { chromeIntentUrl, inAppBrowser, isAndroid } from "./in-app-browser";

describe("navegador de adentro de las redes", () => {
  it("reconoce Facebook, Instagram y TikTok", () => {
    expect(inAppBrowser("Mozilla/5.0 (Linux; Android 13) ... [FB_IAB/FB4A;FBAV/440.0]")).toBe("facebook");
    expect(inAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) ... Instagram 300.0")).toBe("instagram");
    expect(inAppBrowser("Mozilla/5.0 (Linux; Android 12) ... musical_ly_2023")).toBe("tiktok");
  });
  it("Chrome y Safari normales no son navegadores de redes", () => {
    expect(inAppBrowser("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36")).toBeNull();
    expect(inAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17.0 Mobile/15E148 Safari/604.1")).toBeNull();
  });
  it("arma el enlace para abrir en Chrome", () => {
    expect(isAndroid("Mozilla/5.0 (Linux; Android 13)")).toBe(true);
    expect(chromeIntentUrl("https://www.jaikuaa.com/auth?mode=signup")).toBe(
      "intent://www.jaikuaa.com/auth?mode=signup#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fwww.jaikuaa.com%2Fauth%3Fmode%3Dsignup;end",
    );
  });
});
