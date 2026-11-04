import { supabase } from "@/integrations/supabase/client";

/**
 * De dónde llega la gente: los enlaces que se comparten llevan ?de=facebook, ?de=whatsapp, etc.
 * Se guarda el primer origen en este celular y, al crear la cuenta, queda anotado en la cuenta
 * (solo el nombre del lugar, nada personal). El tablero de analíticas cuenta los registros por origen.
 */
export const SOURCE_KEY = "jaikuaa:de";
/** Solo se anota en cuentas nuevas: las viejas no se atribuyen después. */
const NEW_ACCOUNT_MS = 2 * 24 * 60 * 60 * 1000;

export function cleanSource(raw: string | null | undefined): string | null {
  const s = (raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);
  return s.length >= 2 ? s : null;
}

/** Lee ?de= (o utm_source=) de la dirección y lo guarda si todavía no había uno. */
/** Si el enlace no trae ?de=, se deduce de la página de donde vino (Facebook, Instagram…). */
export function sourceFromReferrer(ref: string): string | null {
  let host = "";
  try { host = new URL(ref).hostname.toLowerCase(); } catch { return null; }
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return "facebook";
  if (/(^|\.)tiktok\.com$/.test(host)) return "tiktok";
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return "whatsapp";
  if (/(^|\.)chatgpt\.com$/.test(host)) return "chatgptcom";
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  return null;
}

export function captureSource(
  search: string = typeof window === "undefined" ? "" : window.location.search,
  referrer: string = typeof document === "undefined" ? "" : document.referrer,
) {
  try {
    const q = new URLSearchParams(search);
    const s = cleanSource(q.get("de") ?? q.get("utm_source")) ?? sourceFromReferrer(referrer);
    if (s && !localStorage.getItem(SOURCE_KEY)) localStorage.setItem(SOURCE_KEY, s);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/** Qué origen anotar en una cuenta (null si no corresponde anotar nada). */
export function sourceToClaim(
  meta: Record<string, unknown> | undefined,
  createdAt: string | undefined,
  stored: string | null,
  now = Date.now(),
): string | null {
  if (meta && typeof meta.signup_source === "string") return null;
  const created = createdAt ? Date.parse(createdAt) : NaN;
  if (!Number.isFinite(created) || now - created > NEW_ACCOUNT_MS) return null;
  return cleanSource(stored) ?? "directo";
}

/** Al iniciar sesión: si la cuenta es nueva y no tiene origen, se lo anota una sola vez. */
export async function claimSource() {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(SOURCE_KEY); } catch { /* sin almacenamiento */ }
    const s = sourceToClaim(user.user_metadata, user.created_at, stored);
    if (!s) return;
    const { error } = await supabase.auth.updateUser({ data: { signup_source: s } });
    if (!error) {
      try { localStorage.removeItem(SOURCE_KEY); } catch { /* nada */ }
    }
  } catch {
    /* sin señal: se intenta la próxima vez */
  }
}
