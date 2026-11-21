import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ESTADOS_PEDIDO, calcularSaldos, puedePasarPedido, type EstadoPedido, type Saldo } from "@/lib/obras";

/**
 * Tienda de la Librería, parte de administración y de cada persona:
 * - Pedidos impresos: el administrador ve los pagados y los marca enviados o entregados; el comprador ve su estado.
 * - Reparto: cuánto le corresponde a cada autor y embajador por ventas cobradas, cuánto ya se le pagó y el saldo.
 *   El sistema no mueve dinero: el administrador registra los pagos que hizo.
 * - Ajustes: porcentaje fijo de los embajadores.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exigirAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

type PagoFila = { id: string; ref_id: string; monto_gs: number; afiliado_id: string | null; porcentaje_afiliado: number | null };

/** Ventas cobradas de verdad (sin pruebas ni cancelados), con el autor y porcentaje de cada obra. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ventasParaReparto(db: any, filtro?: { afiliado?: string }) {
  let q = db.from("pagos").select("id, ref_id, monto_gs, afiliado_id, porcentaje_afiliado").eq("estado", "pagado").neq("modo", "prueba").limit(50000);
  if (filtro?.afiliado) q = q.eq("afiliado_id", filtro.afiliado);
  const { data } = await q;
  const pagos = (data ?? []) as PagoFila[];
  const ids = [...new Set(pagos.map((p) => p.ref_id))];
  const obras = new Map<string, { autor_id: string | null; porcentaje_autor: number | null }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data: ls } = await db.from("libros").select("id, autor_id, porcentaje_autor").in("id", ids.slice(i, i + 200));
    for (const l of (ls ?? []) as { id: string; autor_id: string | null; porcentaje_autor: number | null }[]) obras.set(l.id, l);
  }
  return pagos.map((p) => ({
    montoGs: p.monto_gs,
    autorId: obras.get(p.ref_id)?.autor_id ?? null,
    pctAutor: obras.get(p.ref_id)?.porcentaje_autor ?? null,
    afiliadoId: p.afiliado_id,
    pctAfiliado: p.porcentaje_afiliado,
  }));
}

export type PedidoAdmin = {
  id: string;
  titulo: string;
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  referencia: string;
  estado: EstadoPedido;
  nota: string;
  fecha: string;
  montoGs: number;
  prueba: boolean;
};
export type SaldoConNombre = Saldo & { nombre: string; correo: string };

/** Todo lo de la tienda para el administrador: pedidos impresos, reparto y ajustes. */
export const adminTienda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const [ped, liq, aj, ventas] = await Promise.all([
      db
        .from("pedidos_fisicos")
        .select("id, pago_id, titulo, nombre, telefono, ciudad, direccion, referencia, estado, nota, created_at")
        .in("estado", ["por_enviar", "enviado", "entregado"])
        .order("created_at", { ascending: false })
        .limit(300),
      db.from("liquidaciones").select("beneficiario_id, rol, monto_gs").limit(20000),
      db.from("libreria_ajustes").select("porcentaje_afiliado").eq("id", 1).maybeSingle(),
      ventasParaReparto(db),
    ]);
    const pedRows = (ped.data ?? []) as (Omit<PedidoAdmin, "fecha" | "montoGs" | "prueba"> & { pago_id: string; created_at: string })[];
    const pagoIds = pedRows.map((p) => p.pago_id);
    const montos = new Map<string, { monto_gs: number; modo: string }>();
    if (pagoIds.length) {
      const { data: ps } = await db.from("pagos").select("id, monto_gs, modo").in("id", pagoIds);
      for (const p of (ps ?? []) as { id: string; monto_gs: number; modo: string }[]) montos.set(p.id, p);
    }
    const saldos = calcularSaldos(
      ventas,
      ((liq.data ?? []) as { beneficiario_id: string; rol: "autor" | "afiliado"; monto_gs: number }[]).map((l) => ({
        beneficiarioId: l.beneficiario_id,
        rol: l.rol,
        montoGs: l.monto_gs,
      })),
    );
    const personas = [...new Set(saldos.map((x) => x.id))];
    const perfiles = new Map<string, { full_name: string | null; email: string | null }>();
    for (let i = 0; i < personas.length; i += 200) {
      const { data: ps } = await db.from("profiles").select("id, full_name, email").in("id", personas.slice(i, i + 200));
      for (const p of (ps ?? []) as { id: string; full_name: string | null; email: string | null }[]) perfiles.set(p.id, p);
    }
    return {
      pedidos: pedRows.map<PedidoAdmin>((p) => ({
        id: p.id,
        titulo: p.titulo,
        nombre: p.nombre,
        telefono: p.telefono,
        ciudad: p.ciudad,
        direccion: p.direccion,
        referencia: p.referencia,
        estado: p.estado,
        nota: p.nota,
        fecha: p.created_at,
        montoGs: montos.get(p.pago_id)?.monto_gs ?? 0,
        prueba: montos.get(p.pago_id)?.modo === "prueba",
      })),
      saldos: saldos.map<SaldoConNombre>((x) => ({ ...x, nombre: perfiles.get(x.id)?.full_name ?? "", correo: perfiles.get(x.id)?.email ?? "" })),
      porcentajeAfiliado: Number(aj.data?.porcentaje_afiliado ?? 0),
    };
  });

export const cambiarEstadoPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), estado: z.enum(ESTADOS_PEDIDO), nota: z.string().trim().max(500).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: p } = await db.from("pedidos_fisicos").select("estado").eq("id", data.id).maybeSingle();
    if (!p) throw new Error("No existe ese pedido.");
    if (!puedePasarPedido(p.estado as EstadoPedido, data.estado)) throw new Error("Ese cambio de estado no se puede hacer.");
    const cambios: Record<string, unknown> = { estado: data.estado, updated_at: new Date().toISOString() };
    if (data.nota !== undefined) cambios.nota = data.nota;
    const { error } = await db.from("pedidos_fisicos").update(cambios).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Registra un pago hecho a un autor o embajador (por transferencia, en mano…). No mueve dinero. */
export const registrarLiquidacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        beneficiarioId: z.string().uuid(),
        rol: z.enum(["autor", "afiliado"]),
        montoGs: z.number().int().min(1).max(1000000000),
        nota: z.string().trim().max(300).default(""),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db
      .from("liquidaciones")
      .insert({ beneficiario_id: data.beneficiarioId, rol: data.rol, monto_gs: data.montoGs, nota: data.nota, registrado_por: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const guardarAjustesTienda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ porcentajeAfiliado: z.number().int().min(0).max(50) }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db
      .from("libreria_ajustes")
      .upsert({ id: 1, porcentaje_afiliado: data.porcentajeAfiliado, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Los pedidos impresos de la persona y su estado. */
export const misPedidosImpresos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { data } = await db
      .from("pedidos_fisicos")
      .select("id, titulo, ciudad, estado, nota, created_at")
      .eq("user_id", context.userId)
      .neq("estado", "esperando_pago")
      .order("created_at", { ascending: false })
      .limit(50);
    return {
      pedidos: ((data ?? []) as { id: string; titulo: string; ciudad: string; estado: EstadoPedido; nota: string; created_at: string }[]).map((p) => ({
        id: p.id,
        titulo: p.titulo,
        ciudad: p.ciudad,
        estado: p.estado,
        nota: p.nota,
        fecha: p.created_at,
      })),
    };
  });

/** Comisiones del embajador por ventas de la Librería. */
export const misComisionesLibreria = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const [ventas, liq, aj] = await Promise.all([
      ventasParaReparto(db, { afiliado: context.userId }),
      db.from("liquidaciones").select("monto_gs").eq("beneficiario_id", context.userId).eq("rol", "afiliado").limit(5000),
      db.from("libreria_ajustes").select("porcentaje_afiliado").eq("id", 1).maybeSingle(),
    ]);
    const s = calcularSaldos(
      ventas,
      ((liq.data ?? []) as { monto_gs: number }[]).map((l) => ({ beneficiarioId: context.userId, rol: "afiliado" as const, montoGs: l.monto_gs })),
    ).find((x) => x.rol === "afiliado" && x.id === context.userId);
    return {
      porcentaje: Number(aj.data?.porcentaje_afiliado ?? 0),
      ventas: s?.ventas ?? 0,
      devengadoGs: s?.devengadoGs ?? 0,
      pagadoGs: s?.pagadoGs ?? 0,
      saldoGs: s?.saldoGs ?? 0,
    };
  });
