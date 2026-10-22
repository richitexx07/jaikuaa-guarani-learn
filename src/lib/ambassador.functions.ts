import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAmbassadorInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: code, error } = await supabase.rpc("get_ambassador_code", { _user_id: userId });
    if (error) throw new Error("No se pudo obtener tu enlace");
    const { data: sum } = await supabase.rpc("my_ambassador_summary", { _user_id: userId });
    const row = Array.isArray(sum) ? sum[0] : sum;
    return {
      code: code as string,
      invited: Number(row?.invited ?? 0),
      started: Number(row?.started ?? 0),
      ambassadorXp: Number(row?.ambassador_xp ?? 0),
    };
  });

export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(/^[A-F0-9]{8}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: result } = await context.supabase.rpc("claim_referral", {
      _user_id: context.userId,
      _code: data.code,
    });
    return { result: String(result ?? "invalid") };
  });
