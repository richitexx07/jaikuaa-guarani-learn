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
