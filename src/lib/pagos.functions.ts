import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAGOPAR_API, tokenInicio, urlPagoPagopar } from "@/lib/pagopar";
import { cleanRefCode } from "@/lib/ambassador";
import { elegirAfiliado } from "@/lib/obras";
import { enviarAviso } from "@/lib/avisos";

/**
 * Pagos de la Librería con Pagopar: libros, módulos y cursos (digitales) y ediciones impresas (con envío manual).
 * - La venta se le acredita al embajador del código con el que llegó la persona, o a quien la invitó a Jaikuaa
 *   (comisión fija de libreria_ajustes, que sale de la parte de Jaikuaa).
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

const Envio = z.object({
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().trim().min(6).max(30),
  ciudad: z.string().trim().min(2).max(80),
  direccion: z.string().trim().min(4).max(200),
  referencia: z.string().trim().max(200).default(""),
});

/** Quién se lleva la comisión de embajador: el código con el que llegó o quien lo invitó a Jaikuaa. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function afiliadoDeLaCompra(db: any, comprador: string, codigo: string | null | undefined): Promise<{ id: string; pct: number } | null> {
  const ref = cleanRefCode(codigo);
  const [porCodigo, invito, ajustes] = await Promise.all([
    ref ? db.from("ambassador_codes").select("user_id").eq("code", ref).maybeSingle() : Promise.resolve({ data: null }),
    db.from("referrals").select("referrer_id").eq("referred_user_id", comprador).maybeSingle(),
    db.from("libreria_ajustes").select("porcentaje_afiliado").eq("id", 1).maybeSingle(),
  ]);
  const id = elegirAfiliado({ comprador, porCodigo: porCodigo.data?.user_id ?? null, invitadoPor: invito.data?.referrer_id ?? null });
  const pct = Number(ajustes.data?.porcentaje_afiliado ?? 0);
  return id && pct > 0 ? { id, pct } : null;
}

export const comprarLibro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        libroId: z.string().uuid(),
        formato: z.enum(["digital", "fisico"]).default("digital"),
        envio: Envio.optional(),
        ref: z.string().trim().max(20).nullable().optional(),
      })
      .refine((x) => x.formato === "digital" || !!x.envio, { message: "Faltan los datos de envío" })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const db = await admin();
    const { data: libro } = await db
      .from("libros")
      .select("id, titulo, precio_gs, precio_fisico_gs, publicado, tipo, autor_id, en_preventa")
      .eq("id", data.libroId)
      .maybeSingle();
    const fisico = data.formato === "fisico";
    const monto = (fisico ? libro?.precio_fisico_gs : libro?.precio_gs) as number | null | undefined;
    if (!libro || !libro.publicado || !monto) throw new Error(fisico ? "Esta obra no tiene edición impresa a la venta." : "Esta obra no está a la venta en línea.");
    const tipo = (libro.tipo ?? "libro") as "libro" | "modulo" | "curso";
    if (!fisico) {
      const { data: ya } = await db.from("libro_accesos").select("id").eq("libro_id", libro.id).eq("user_id", context.userId).maybeSingle();
      if (ya) return { estado: "ya-lo-tenes" as const };
    }
    const afiliado = await afiliadoDeLaCompra(db, context.userId, data.ref);
    const base = {
      user_id: context.userId,
      ref_id: libro.id,
      tipo,
      formato: data.formato,
      descripcion: fisico ? `${libro.titulo} (impreso)` : libro.titulo,
      monto_gs: monto,
      afiliado_id: afiliado?.id ?? null,
      porcentaje_afiliado: afiliado?.pct ?? null,
    };
    const crearPedido = async (pagoId: string, estado: "esperando_pago" | "por_enviar") => {
      if (!fisico || !data.envio) return;
      const { error } = await db.from("pedidos_fisicos").insert({ pago_id: pagoId, user_id: context.userId, libro_id: libro.id, titulo: libro.titulo, ...data.envio, estado });
      if (error) throw new Error(error.message);
    };

    const k = claves();
    if (!k) {
      const { data: esAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (esAdmin !== true) return { estado: "pronto" as const };
      const { data: pago, error } = await db
        .from("pagos")
        .insert({ ...base, modo: "prueba", estado: "pagado", pagado_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      if (fisico) await crearPedido(pago.id, "por_enviar");
      else await db.from("libro_accesos").upsert({ libro_id: libro.id, user_id: context.userId, nota: `Compra de prueba ${pago.id}` }, { onConflict: "libro_id,user_id" });
      return { estado: "prueba-ok" as const, pagoId: pago.id as string };
    }

    const { data: perfil } = await db.from("profiles").select("full_name, email").eq("id", context.userId).maybeSingle();
    const { data: pago, error } = await db.from("pagos").insert(base).select("id").single();
    if (error) throw new Error(error.message);
    await crearPedido(pago.id, "esperando_pago");

    const vence = new Date(Date.now() + 2 * 24 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
    const queEs = fisico ? "Libro impreso (envío a coordinar)" : tipo === "modulo" ? "Módulo de especialización con voz humana" : tipo === "curso" ? "Curso con video y voz humana" : "Libro digital con voz humana";
    const cuerpo = {
      token: await tokenInicio(k.priv, pago.id, monto),
      public_key: k.pub,
      monto_total: monto,
      tipo_pedido: "VENTA-COMERCIO",
      id_pedido_comercio: pago.id,
      descripcion_resumen: `Librería Jaikuaa: ${libro.titulo}`.slice(0, 100),
      fecha_maxima_pago: vence,
      forma_pago: 9,
      comprador: {
        nombre: data.envio?.nombre || perfil?.full_name || "Lector Jaikuaa",
        correo_electronico: perfil?.email || "",
        documento: "", tipo_documento: "CI", telefono: data.envio?.telefono ?? "", direccion: data.envio?.direccion ?? "", ruc: "", razon_social: "",
        ubicacion: "", direccion_referencia: data.envio?.referencia ?? "", coordenadas: "", ciudad: null,
      },
      compras_items: [{
        ciudad: "1", nombre: libro.titulo.slice(0, 100), cantidad: 1, categoria: "909", public_key: k.pub,
        url_imagen: "", descripcion: queEs, id_producto: libro.id, precio_total: monto,
        vendedor_telefono: "", vendedor_direccion: "", vendedor_direccion_referencia: "", vendedor_direccion_coordenadas: "",
      }],
    };
    const r = await fetch(PAGOPAR_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    const j = (await r.json().catch(() => null)) as { respuesta?: boolean; resultado?: { data?: string }[] | string } | null;
    const hash = j?.respuesta && Array.isArray(j.resultado) ? j.resultado[0]?.data : undefined;
    if (!hash) {
      const ahora = new Date().toISOString();
      await db.from("pagos").update({ estado: "cancelado", updated_at: ahora }).eq("id", pago.id);
      if (fisico) await db.from("pedidos_fisicos").update({ estado: "cancelado", updated_at: ahora }).eq("pago_id", pago.id);
      console.error("Pagopar rechazó el pedido", j);
      throw new Error("No se pudo iniciar el pago. Probá de nuevo en un rato.");
    }
    await db.from("pagos").update({ hash_pedido: hash, updated_at: new Date().toISOString() }).eq("id", pago.id);
    await enviarAviso("pedido.creado", {
      pedido: pago.id,
      obra: libro.titulo,
      tipo,
      formato: data.formato,
      montoGs: monto,
      comprador: perfil?.full_name ?? "",
      correo: perfil?.email ?? "",
      ciudad: data.envio?.ciudad ?? null,
      conEmbajador: !!afiliado,
    });
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
