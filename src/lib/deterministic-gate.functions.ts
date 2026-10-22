import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Pregunta al motor determinista si acepta una palabra (solo personal con sesión). */
export const checkGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ gn: z.string().max(300) }).parse(d))
  .handler(async ({ data }) => {
    const { checkDeterministicAcceptance } = await import("@/lib/deterministic-gate.server");
    return checkDeterministicAcceptance(data.gn);
  });
