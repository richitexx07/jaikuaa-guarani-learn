/**
 * Mercado Jaikuaa, solo servidor: qué pasa cuando un pago se confirma o se revierte.
 * Lo usan el aviso verificado de Pagopar y el modo prueba (solo administradores).
 * - Obra digital → acceso en «Mis libros».
 * - Algo que se entrega a mano (impreso, artesanía, servicio, experiencia) → el pedido pasa a «por atender».
 * - Producto con stock → se descuenta (y se devuelve si el pago se revierte).
 * - Archivo digital → no hace falta nada: la descarga se habilita sola al ver el pago confirmado.
 */
import { enviarAviso } from "@/lib/avisos";

export type PagoCumplir = {
  id: string;
  user_id: string;
  ref_id: string;
  item_tipo: "obra" | "producto";
  formato: "digital" | "fisico";
  cantidad: number;
  estado: string;
  monto_gs: number;
  descripcion: string;
};

export const COLS_PAGO_CUMPLIR = "id, user_id, ref_id, item_tipo, formato, cantidad, estado, monto_gs, descripcion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

async function moverStock(db: Db, productoId: string, delta: number) {
  const { data } = await db.from("mercado_productos").select("stock").eq("id", productoId).maybeSingle();
  if (!data || data.stock === null || data.stock === undefined) return;
  await db.from("mercado_productos").update({ stock: Math.max(0, Number(data.stock) + delta), updated_at: new Date().toISOString() }).eq("id", productoId);
}

/** Marca pagados y entrega lo que corresponde. Idempotente: un aviso repetido no duplica nada. */
export async function confirmarPagos(db: Db, pagos: PagoCumplir[], origen: string): Promise<void> {
  const ahora = new Date().toISOString();
  for (const p of pagos) {
    const yaEstaba = p.estado === "pagado";
    if (!yaEstaba) await db.from("pagos").update({ estado: "pagado", pagado_at: ahora, updated_at: ahora }).eq("id", p.id);
    await db.from("pedidos_fisicos").update({ estado: "por_enviar", updated_at: ahora }).eq("pago_id", p.id).eq("estado", "esperando_pago");
    if (p.item_tipo === "obra" && p.formato === "digital") {
      await db.from("libro_accesos").upsert({ libro_id: p.ref_id, user_id: p.user_id, nota: `${origen} ${p.id}` }, { onConflict: "libro_id,user_id" });
    }
    if (!yaEstaba && p.item_tipo === "producto") await moverStock(db, p.ref_id, -p.cantidad);
    if (!yaEstaba) await enviarAviso("pago.confirmado", { pedido: p.id, obra: p.descripcion, formato: p.formato, montoGs: p.monto_gs });
  }
}

/** Revierte pagos confirmados (devolución o contracargo): quita accesos, cancela entregas y devuelve stock. */
export async function revertirPagos(db: Db, pagos: PagoCumplir[]): Promise<void> {
  const ahora = new Date().toISOString();
  for (const p of pagos) {
    if (p.estado !== "pagado") continue;
    await db.from("pagos").update({ estado: "cancelado", updated_at: ahora }).eq("id", p.id);
    await db.from("pedidos_fisicos").update({ estado: "cancelado", updated_at: ahora }).eq("pago_id", p.id).in("estado", ["esperando_pago", "por_enviar"]);
    if (p.item_tipo === "obra" && p.formato === "digital") {
      await db.from("libro_accesos").delete().eq("libro_id", p.ref_id).eq("user_id", p.user_id).like("nota", `% ${p.id}`);
    }
    if (p.item_tipo === "producto") await moverStock(db, p.ref_id, p.cantidad);
    await enviarAviso("pago.revertido", { pedido: p.id, obra: p.descripcion, formato: p.formato, montoGs: p.monto_gs });
  }
}

/** Confirma una orden del carrito completa (y suma un uso al cupón la primera vez). */
export async function confirmarOrden(db: Db, ordenId: string, origen: string): Promise<void> {
  const { data: orden } = await db.from("mercado_ordenes").select("id, estado, cupon").eq("id", ordenId).maybeSingle();
  if (!orden) return;
  const ahora = new Date().toISOString();
  if (orden.estado !== "pagado") {
    await db.from("mercado_ordenes").update({ estado: "pagado", updated_at: ahora }).eq("id", ordenId);
    if (orden.cupon) {
      const { data: c } = await db.from("mercado_cupones").select("usos").eq("codigo", orden.cupon).maybeSingle();
      if (c) await db.from("mercado_cupones").update({ usos: Number(c.usos) + 1 }).eq("codigo", orden.cupon);
    }
  }
  const { data: pagos } = await db.from("pagos").select(COLS_PAGO_CUMPLIR).eq("orden_id", ordenId);
  await confirmarPagos(db, (pagos ?? []) as PagoCumplir[], origen);
}

export async function revertirOrden(db: Db, ordenId: string): Promise<void> {
  const { data: orden } = await db.from("mercado_ordenes").select("estado").eq("id", ordenId).maybeSingle();
  if (!orden || orden.estado !== "pagado") return;
  await db.from("mercado_ordenes").update({ estado: "cancelado", updated_at: new Date().toISOString() }).eq("id", ordenId);
  const { data: pagos } = await db.from("pagos").select(COLS_PAGO_CUMPLIR).eq("orden_id", ordenId);
  await revertirPagos(db, (pagos ?? []) as PagoCumplir[]);
}
