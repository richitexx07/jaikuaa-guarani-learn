/**
 * Navegadores de adentro de Facebook, Instagram, TikTok, etc.
 * Google no deja entrar con «Continuar con Google» desde ahí (muestra un error 403),
 * y justo de ahí llega la gente de la pauta. Por eso se avisa y se ofrece abrir en el navegador del celular.
 */
export type InAppBrowser = "facebook" | "instagram" | "tiktok" | "otra" | null;

export function inAppBrowser(ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent): InAppBrowser {
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger/i.test(ua)) return "facebook";
  if (/musical_ly|TikTok|Bytedance|BytedanceWebview/i.test(ua)) return "tiktok";
  if (/\bLine\/|Snapchat|Pinterest/i.test(ua)) return "otra";
  return null;
}

export function isAndroid(ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent): boolean {
  return /Android/i.test(ua);
}

/** Enlace que en Android abre la misma página en Chrome (si no está, el sistema elige el navegador). */
export function chromeIntentUrl(href: string): string {
  const u = new URL(href);
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`;
}
