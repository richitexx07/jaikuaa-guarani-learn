import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const AI_LIMITS = { tutor: 30, traductor: 50 } as const;
export const AI_LIMIT_MESSAGE =
  "Llegaste al límite diario de esta función experimental. Volvé mañana.";

function userClient(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Verifica el token Bearer en el servidor. Devuelve el usuario o null. */
export async function verifyBearer(
  headers: Headers,
): Promise<{ userId: string; isAdmin: boolean } | null> {
  const auth = headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (token.split(".").length !== 3) return null;
  const sb = userClient(token);
  const { data, error } = await sb.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  const { data: admin } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  return { userId, isAdmin: admin === true };
}

/** Solo el id del usuario de la sesión (sin consultar su rol): para pedidos rápidos como los audios. */
export async function verifyBearerUserId(headers: Headers): Promise<string | null> {
  const auth = headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (token.split(".").length !== 3) return null;
  const { data, error } = await userClient(token).auth.getClaims(token);
  const userId = data?.claims?.sub;
  return error || !userId ? null : userId;
}

/** Suma un uso de IA del día (hora de Paraguay). false = tope alcanzado. Admin sin tope. */
export async function consumeAiQuota(
  user: { userId: string; isAdmin: boolean },
  feature: keyof typeof AI_LIMITS,
): Promise<boolean> {
  if (user.isAdmin) return true;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_ai_quota", {
    _user_id: user.userId,
    _feature: feature,
    _limit: AI_LIMITS[feature],
  });
  if (error) throw new Error("quota check failed");
  return data === true;
}

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    _key: key,
    _limit: limit,
    _window_seconds: windowSeconds,
  });
  if (error) return false;
  return data === true;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown"
  );
}
