import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAGOPAR_API, tokenInicio, urlPagoPagopar } from "@/lib/pagopar";

/**
 * Pagos de la Librería con Pagopar.
 * - Sin claves PAGOPAR_PUBLIC_KEY / PAGOPAR_PRIVATE_KEY: modo prueba, solo el administrador puede simular la compra.
 * - Con claves: se crea el pedido en Pagopar y se manda a pagar; el acceso lo da el aviso (/api/public/pagopar).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const claves = () => {
  const pub = process.env["PAGOPAR_PUBLIC_KEY"];
  const priv = process.env["PAGOPAR_PRIVATE_KEY"];
  return pub && priv ? { pub, priv } : null;
};

/** ¿Está activo el cobro en línea? (no revela claves) */
export const estadoPagos = createServerFn({ method: "GET" }).handler(async () => ({ activo: claves() !== null }));

export const comprarLibro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ libroId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const { data: libro } = await db.from("libros").select("id, titulo, precio_gs, publicado").eq("id", data.libroId).maybeSingle();
    if (!libro || !libro.publicado || !libro.precio_gs) throw new Error("Este libro no está a la venta en línea.");
    const { data: ya } = await db.from("libro_accesos").select("id").eq("libro_id", libro.id).eq("user_id", context.userId).maybeSingle();
    if (ya) return { estado: "ya-lo-tenes" as const };

    const k = claves();
    if (!k) {
      const { data: esAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (esAdmin !== true) return { estado: "pronto" as const };
      const { data: pago, error } = await db
        .from("pagos")
        .insert({ user_id: context.userId, ref_id: libro.id, descripcion: libro.titulo, monto_gs: libro.precio_gs, modo: "prueba", estado: "pagado", pagado_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      await db.from("libro_accesos").upsert({ libro_id: libro.id, user_id: context.userId, nota: `Compra de prueba ${pago.id}` }, { onConflict: "libro_id,user_id" });
      return { estado: "prueba-ok" as const, pagoId: pago.id as string };
    }

    const { data: perfil } = await db.from("profiles").select("full_name, email").eq("id", context.userId).maybeSingle();
    const { data: pago, error } = await db
      .from("pagos")
      .insert({ user_id: context.userId, ref_id: libro.id, descripcion: libro.titulo, monto_gs: libro.precio_gs })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const vence = new Date(Date.now() + 2 * 24 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
    const cuerpo = {
      token: await tokenInicio(k.priv, pago.id, libro.precio_gs),
      public_key: k.pub,
      monto_total: libro.precio_gs,
      tipo_pedido: "VENTA-COMERCIO",
      id_pedido_comercio: pago.id,
      descripcion_resumen: `Librería Jaikuaa: ${libro.titulo}`.slice(0, 100),
      fecha_maxima_pago: vence,
      forma_pago: 9,
      comprador: {
        nombre: perfil?.full_name || "Lector Jaikuaa",
        correo_electronico: perfil?.email || "",
        documento: "", tipo_documento: "CI", telefono: "", direccion: "", ruc: "", razon_social: "",
        ubicacion: "", direccion_referencia: "", coordenadas: "", ciudad: null,
      },
      compras_items: [{
        ciudad: "1", nombre: libro.titulo.slice(0, 100), cantidad: 1, categoria: "909", public_key: k.pub,
        url_imagen: "", descripcion: "Libro digital con voz humana", id_producto: libro.id, precio_total: libro.precio_gs,
        vendedor_telefono: "", vendedor_direccion: "", vendedor_direccion_referencia: "", vendedor_direccion_coordenadas: "",
      }],
    };
    const r = await fetch(PAGOPAR_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    const j = (await r.json().catch(() => null)) as { respuesta?: boolean; resultado?: { data?: string }[] | string } | null;
    const hash = j?.respuesta && Array.isArray(j.resultado) ? j.resultado[0]?.data : undefined;
    if (!hash) {
      await db.from("pagos").update({ estado: "cancelado", updated_at: new Date().toISOString() }).eq("id", pago.id);
      console.error("Pagopar rechazó el pedido", j);
      throw new Error("No se pudo iniciar el pago. Probá de nuevo en un rato.");
    }
    await db.from("pagos").update({ hash_pedido: hash, updated_at: new Date().toISOString() }).eq("id", pago.id);
    return { estado: "pagar" as const, url: urlPagoPagopar(hash) };
  });

/** Pantalla de vuelta: estado del pago de la persona (por hash de Pagopar o id del pedido). */
export const verPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ref: z.string().trim().min(4).max(200) }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const esUuid = /^[0-9a-f-]{36}$/i.test(data.ref);
    const { data: p } = await db
      .from("pagos")
      .select("id, ref_id, descripcion, monto_gs, estado, modo")
      .eq(esUuid ? "id" : "hash_pedido", data.ref)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { pago: (p ?? null) as null | { id: string; ref_id: string; descripcion: string; monto_gs: number; estado: string; modo: string } };
  });
