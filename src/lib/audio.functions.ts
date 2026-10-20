import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const Input = z.object({ gn: z.string().min(1).max(120) });

/** Audios que se escuchan sin sesión: los de /comenzar y las seis palabras de muestra de la portada. */
const PUBLIC_SLUGS = new Set(["mbaeichapa", "ipora", "aguyje", "jaguarete", "kuarahy", "yvoty", "che-vya"]);
const URL_TTL_SECONDS = 60 * 60; // 1 hora como máximo
const LIMIT_SIGNED_IN = 300; // por hora por usuario
const LIMIT_ANON = 30; // por hora por IP

function slugifyAudio(gn: string): string {
  let x = gn.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  x = x.toLowerCase();
  x = x.replace(/ñ/g, "n");
  x = x.replace(/['\u2019\u02BC\u02B9\u2018]/g, "");
  x = x.replace(/[^a-z0-9]+/g, "-");
  x = x.replace(/^-+|-+$/g, "");
  return x;
}

export const getAudioSignedUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const slug = slugifyAudio(data.gn);
    const { verifyBearer, consumeRateLimit, clientIp } = await import(
      "@/lib/server-guards.server"
    );
    const headers = getRequest()?.headers ?? new Headers();
    const user = await verifyBearer(headers).catch(() => null);

    if (!user && !PUBLIC_SLUGS.has(slug)) {
      return { signedUrl: null as string | null, denied: "auth" as const };
    }
    const allowed = user
      ? await consumeRateLimit(`audio:user:${user.userId}`, LIMIT_SIGNED_IN, 3600)
      : await consumeRateLimit(`audio:ip:${clientIp(headers)}`, LIMIT_ANON, 3600);
    if (!allowed) return { signedUrl: null as string | null, denied: "rate" as const };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed, error } = await supabaseAdmin.storage
        .from("guarani-audio")
        .createSignedUrl(`${slug}.mp3`, URL_TTL_SECONDS);

      if (error || !signed?.signedUrl) return { signedUrl: null as string | null, denied: null };
      return { signedUrl: signed.signedUrl as string | null, denied: null };
    } catch {
      // Missing object / storage unavailable: keep the app stable, no robotic fallback.
      return { signedUrl: null as string | null, denied: null };
    }
  });

const BatchInput = z.object({ gns: z.array(z.string().min(1).max(120)).min(1).max(60) });
const LIMIT_BATCH_SIGNED_IN = 400; // tandas por hora por usuario
const LIMIT_BATCH_ANON = 60; // tandas por hora por IP

/**
 * Enlaces firmados para VARIAS palabras en un solo viaje al servidor (una tanda por pantalla).
 * Sin sesión solo se firman las palabras públicas; las demás vuelven en `denied`.
 * Las palabras sin grabación vuelven como null (silencio intencional, nunca voz de máquina).
 */
export const getAudioSignedUrls = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BatchInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyBearerUserId, consumeRateLimit, clientIp } = await import(
      "@/lib/server-guards.server"
    );
    const headers = getRequest()?.headers ?? new Headers();
    const userId = await verifyBearerUserId(headers).catch(() => null);
    const user = userId ? { userId } : null;

    const slugs = [...new Set(data.gns.map(slugifyAudio).filter(Boolean))];
    const allowed = user ? slugs : slugs.filter((s) => PUBLIC_SLUGS.has(s));
    const denied = slugs.filter((s) => !allowed.includes(s));
    const urls: Record<string, string | null> = {};
    if (allowed.length === 0) return { urls, denied, limited: false };

    const ok = user
      ? await consumeRateLimit(`audio-batch:user:${user.userId}`, LIMIT_BATCH_SIGNED_IN, 3600)
      : await consumeRateLimit(`audio-batch:ip:${clientIp(headers)}`, LIMIT_BATCH_ANON, 3600);
    if (!ok) return { urls, denied: slugs, limited: true };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed } = await supabaseAdmin.storage
        .from("guarani-audio")
        .createSignedUrls(allowed.map((s) => `${s}.mp3`), URL_TTL_SECONDS);
      for (const s of allowed) urls[s] = null;
      for (const item of signed ?? []) {
        const slug = (item.path ?? "").replace(/\.mp3$/, "");
        if (slug && !item.error && item.signedUrl) urls[slug] = item.signedUrl;
      }
    } catch {
      for (const s of allowed) urls[s] = null;
    }
    return { urls, denied, limited: false };
  });
