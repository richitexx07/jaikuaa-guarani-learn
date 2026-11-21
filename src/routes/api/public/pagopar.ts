import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { igualesSeguro, tokenAviso } from "@/lib/pagopar";
import { COLS_PAGO_CUMPLIR, confirmarOrden, confirmarPagos, revertirOrden, revertirPagos, type PagoCumplir } from "@/lib/mercado.server";

/**
 * Aviso de Pagopar cuando un pedido se paga (o se revierte). Se verifica el token
 * sha1(clave_privada + hash_pedido) antes de tocar nada; si es válido se entrega (o se revierte) lo comprado:
 * una compra suelta de la Librería o una orden completa del carrito del Mercado.
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Las tablas nuevas todavía no están en los tipos generados.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabaseAdmin as any;
        // Compra suelta (un libro): el pedido de Pagopar es el pago mismo.
        const { data: pago } = await db.from("pagos").select(COLS_PAGO_CUMPLIR).eq("hash_pedido", item.hash_pedido).maybeSingle();
        if (pago) {
          if (item.pagado === true) await confirmarPagos(db, [pago as PagoCumplir], "Pagopar");
          else await revertirPagos(db, [pago as PagoCumplir]);
          return Response.json(parsed.data.resultado);
        }
        // Carrito del Mercado: el pedido de Pagopar es la orden, con varios pagos adentro.
        const { data: orden } = await db.from("mercado_ordenes").select("id").eq("hash_pedido", item.hash_pedido).maybeSingle();
        if (orden) {
          if (item.pagado === true) await confirmarOrden(db, orden.id, "Pagopar");
          else await revertirOrden(db, orden.id);
        }
        return Response.json(parsed.data.resultado);
      },
    },
  },
});
