// Recuerda a dónde quería ir la persona antes de pedirle que inicie sesión
// (por ejemplo, el enlace de una sala de juego) para llevarla ahí después.
const KEY = "jaikuaa:after-login";

export function rememberAfterLogin(href: string) {
  try {
    if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/auth")) localStorage.setItem(KEY, href);
  } catch { /* sin almacenamiento */ }
}

export function peekAfterLogin(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
  } catch { return null; }
}

export function takeAfterLogin(): string {
  const v = peekAfterLogin();
  try { localStorage.removeItem(KEY); } catch { /* nada */ }
  return v ?? "/dashboard";
}
