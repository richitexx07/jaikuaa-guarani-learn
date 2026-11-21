import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { igualesSeguro, tokenAviso } from "@/lib/pagopar";
import { enviarAviso } from "@/lib/avisos";

/**
 * Aviso de Pagopar cuando un pedido se paga (o se revierte). Se verifica el token
 * sha1(clave_privada + hash_pedido) antes de tocar nada; si es válido se da o quita el acceso al libro.
 * Pagopar espera de respuesta el mismo «resultado» que mandó.
 */
const Aviso = z.object({
  resultado: z.array(z.object({ hash_pedido: z.string().min(4).max(200), token: z.string().min(10).max(200), pagado: z.boolean().optional(), cancelado: z.boolean().optional() }).passthrough()).min(1).max(5),
}).passthrough();

export const Route = createFileRoute("/api/public/pagopar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const priv = process.env["PAGOPAR_PRIVATE_KEY"];
        if (!priv) return new Response("not configured", { status: 503 });
        const parsed = Aviso.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("bad request", { status: 400 });
        const item = parsed.data.resultado[0];
        if (!igualesSeguro(item.token, await tokenAviso(priv, item.hash_pedido))) return new Response("invalid token", { status: 401 });

        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pago } = await (db as any).from("pagos").select("id, user_id, ref_id, estado, formato, monto_gs, descripcion").eq("hash_pedido", item.hash_pedido).maybeSingle();
        if (!pago) return Response.json(parsed.data.resultado);
        const ahora = new Date().toISOString();
        const fisico = pago.formato === "fisico";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pedidos = () => (db as any).from("pedidos_fisicos");
        if (item.pagado === true) {
          const yaEstaba = pago.estado === "pagado";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).from("pagos").update({ estado: "pagado", pagado_at: ahora, updated_at: ahora }).eq("id", pago.id);
          if (fisico) await pedidos().update({ estado: "por_enviar", updated_at: ahora }).eq("pago_id", pago.id).eq("estado", "esperando_pago");
          else await db.from("libro_accesos").upsert({ libro_id: pago.ref_id, user_id: pago.user_id, nota: `Pagopar ${pago.id}` }, { onConflict: "libro_id,user_id" });
          if (!yaEstaba) await enviarAviso("pago.confirmado", { pedido: pago.id, obra: pago.descripcion, formato: pago.formato, montoGs: pago.monto_gs });
        } else if (pago.estado === "pagado") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).from("pagos").update({ estado: "cancelado", updated_at: ahora }).eq("id", pago.id);
          if (fisico) await pedidos().update({ estado: "cancelado", updated_at: ahora }).eq("pago_id", pago.id).in("estado", ["esperando_pago", "por_enviar"]);
          else await db.from("libro_accesos").delete().eq("libro_id", pago.ref_id).eq("user_id", pago.user_id).like("nota", `Pagopar ${pago.id}`);
          await enviarAviso("pago.revertido", { pedido: pago.id, obra: pago.descripcion, formato: pago.formato, montoGs: pago.monto_gs });
        }
        return Response.json(parsed.data.resultado);
      },
    },
  },
});
