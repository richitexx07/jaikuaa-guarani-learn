import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAGOPAR_API, tokenInicio, urlPagoPagopar } from "@/lib/pagopar";
import { cleanRefCode } from "@/lib/ambassador";
import { elegirAfiliado, puedePasarPedido, calcularSaldos, ESTADOS_PEDIDO, type EstadoPedido, type TipoObra } from "@/lib/obras";
import {
  CATEGORIAS_PRODUCTO,
  ENTREGAS,
  aplicarDescuento,
  cuponValido,
  hayStock,
  normalizarCupon,
  promedioEstrellas,
  type Categoria,
  type CategoriaProducto,
  type Cupon,
  type Entrega,
  type ItemMercado,
  type ItemTipo,
} from "@/lib/mercado";
import { confirmarOrden } from "@/lib/mercado.server";
import { enviarAviso } from "@/lib/avisos";

/**
 * Mercado Jaikuaa: el mercado de todo el ecosistema dentro de Jaikuaa.
 * - Catálogo público: obras publicadas de la Librería + productos publicados (artesanía, música, clases,
 *   traducciones, experiencias, propuestas para empresas). Las fotos de productos son públicas; las portadas de obras
 *   y los archivos digitales llegan con enlaces firmados.
 * - Carrito: varias cosas, un solo pago con Pagopar. Cada producto queda como una fila en «pagos» (para el reparto)
 *   unida a una «orden»; lo que se entrega a mano queda como pedido por atender.
 * - Opiniones solo de quien compró. Vendedores: se postulan, el administrador los aprueba, cargan sus productos y los
 *   mandan a revisión; publicar exige la autorización firmada (también la base de datos).
 */

// Las tablas nuevas todavía no están en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function esAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exigirAdmin(supabase: any, userId: string) {
  if (!(await esAdmin(supabase, userId))) throw new Error("Forbidden");
}

async function vendedorHabilitado(userId: string): Promise<{ nombre: string } | null> {
  const db = await admin();
  const { data } = await db.from("autores").select("nombre, habilitado").eq("user_id", userId).maybeSingle();
  return data && data.habilitado ? { nombre: (data.nombre as string) ?? "" } : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mercadoAbierto(db: any): Promise<boolean> {
  const { data } = await db.from("libreria_ajustes").select("mercado_abierto").eq("id", 1).maybeSingle();
  return data?.mercado_abierto === true;
}
const VENTAS_PRONTO = "Las ventas del Mercado abren pronto. Dejanos tu contacto en la portada del Mercado y te avisamos.";

const uuid = z.string().uuid();
const itemTipoZ = z.enum(["obra", "producto"]);

/** URL pública de una foto del depósito «mercado» (o de Tembiapo/Librería, firmada). */
async function urlsFotos(paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const db = await admin();
  const out = new Map<string, string>();
  const privados = new Map<string, string[]>();
  for (const p of paths) {
    if (!p || out.has(p)) continue;
    const [bucket, ...resto] = p.split("/");
    const path = resto.join("/");
    if (!path) continue;
    if (bucket === "mercado") out.set(p, db.storage.from("mercado").getPublicUrl(path).data.publicUrl as string);
    else if (bucket === "libros" || bucket === "tembiapo") privados.set(bucket, [...(privados.get(bucket) ?? []), path]);
  }
  for (const [bucket, lista] of privados) {
    const { data } = await db.storage.from(bucket).createSignedUrls([...new Set(lista)], 60 * 60);
    for (const s of (data ?? []) as { path: string | null; signedUrl: string }[]) if (s.path && s.signedUrl) out.set(`${bucket}/${s.path}`, s.signedUrl);
  }
  return out;
}

const CAT_OBRA: Record<TipoObra, Categoria> = { libro: "libros", modulo: "modulos", curso: "cursos" };

type ProductoRow = {
  id: string;
  vendedor_id: string | null;
  vendedor_nombre: string;
  categoria: CategoriaProducto;
  entrega: Entrega;
  titulo: string;
  descripcion: string;
  fotos: string[];
  archivo_path: string | null;
  precio_gs: number | null;
  precio_anterior_gs: number | null;
  stock: number | null;
  ciudad: string;
  lugar: string;
  fecha_evento: string | null;
  duracion: string;
  envio: string;
  ref_pieza: string | null;
  ref_artista: string | null;
  estado_revision: "borrador" | "en_revision" | "observado" | "aprobado";
  nota_revision: string;
  autorizacion_firmada: boolean;
  porcentaje_vendedor: number | null;
  publicado: boolean;
  destacado: boolean;
  created_at: string;
};
const COLS_PRODUCTO =
  "id, vendedor_id, vendedor_nombre, categoria, entrega, titulo, descripcion, fotos, archivo_path, precio_gs, precio_anterior_gs, stock, ciudad, lugar, fecha_evento, duracion, envio, ref_pieza, ref_artista, estado_revision, nota_revision, autorizacion_firmada, porcentaje_vendedor, publicado, destacado, created_at";

type ObraRow = {
  id: string;
  titulo: string;
  autor: string;
  descripcion: string;
  portada_path: string | null;
  precio_gs: number | null;
  tipo: TipoObra;
  autor_id: string | null;
  created_at: string;
  en_preventa: boolean;
};
const COLS_OBRA = "id, titulo, autor, descripcion, portada_path, precio_gs, tipo, autor_id, created_at, en_preventa";

/** Valoraciones y ventas por ítem («tipo:id»). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function estadisticas(db: any, ids: string[]) {
  const est = new Map<string, number[]>();
  const ventas = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 300) {
    const parte = ids.slice(i, i + 300);
    const [r, v] = await Promise.all([
      db.from("mercado_resenas").select("item_tipo, item_id, estrellas").in("item_id", parte).eq("oculta", false).limit(20000),
      db.from("pagos").select("ref_id, cantidad").in("ref_id", parte).eq("estado", "pagado").neq("modo", "prueba").limit(50000),
    ]);
    for (const x of (r.data ?? []) as { item_tipo: string; item_id: string; estrellas: number }[]) {
      const k = `${x.item_tipo}:${x.item_id}`;
      est.set(k, [...(est.get(k) ?? []), x.estrellas]);
    }
    for (const x of (v.data ?? []) as { ref_id: string; cantidad: number | null }[]) ventas.set(x.ref_id, (ventas.get(x.ref_id) ?? 0) + (x.cantidad ?? 1));
  }
  return { est, ventas };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function slugsVendedores(db: any, ids: (string | null)[]): Promise<Map<string, string>> {
  const u = [...new Set(ids.filter((x): x is string => !!x))];
  const out = new Map<string, string>();
  if (!u.length) return out;
  const { data } = await db.from("autores").select("user_id, slug").in("user_id", u).eq("vitrina", true).eq("habilitado", true).not("slug", "is", null);
  for (const a of (data ?? []) as { user_id: string; slug: string }[]) out.set(a.user_id, a.slug);
  return out;
}

async function aItems(obras: ObraRow[], productos: ProductoRow[]): Promise<ItemMercado[]> {
  const db = await admin();
  const [fotos, { est, ventas }, slugs] = await Promise.all([
    urlsFotos([...obras.map((o) => o.portada_path), ...productos.map((p) => p.fotos?.[0])]),
    estadisticas(db, [...obras.map((o) => o.id), ...productos.map((p) => p.id)]),
    slugsVendedores(db, [...obras.map((o) => o.autor_id), ...productos.map((p) => p.vendedor_id)]),
  ]);
  const deObras = obras.map<ItemMercado>((o) => {
    const e = est.get(`obra:${o.id}`) ?? [];
    return {
      tipo: "obra",
      id: o.id,
      titulo: o.titulo,
      descripcion: o.descripcion ?? "",
      categoria: CAT_OBRA[o.tipo ?? "libro"],
      entrega: "lectura",
      precioGs: o.precio_gs,
      precioAnteriorGs: null,
      foto: o.portada_path ? (fotos.get(o.portada_path) ?? null) : null,
      vendedor: o.autor ?? "",
      vendedorSlug: o.autor_id ? (slugs.get(o.autor_id) ?? null) : null,
      ciudad: "",
      fechaEvento: null,
      estrellas: promedioEstrellas(e),
      resenas: e.length,
      ventas: ventas.get(o.id) ?? 0,
      creado: o.created_at,
      destacado: false,
      agotado: false,
    };
  });
  const deProductos = productos.map<ItemMercado>((p) => {
    const e = est.get(`producto:${p.id}`) ?? [];
    return {
      tipo: "producto",
      id: p.id,
      titulo: p.titulo,
      descripcion: p.descripcion ?? "",
      categoria: p.categoria,
      entrega: p.entrega,
      precioGs: p.precio_gs,
      precioAnteriorGs: p.precio_anterior_gs,
      foto: p.fotos?.[0] ? (fotos.get(p.fotos[0]) ?? null) : null,
      vendedor: p.vendedor_nombre || "Mercado Jaikuaa",
      vendedorSlug: p.vendedor_id ? (slugs.get(p.vendedor_id) ?? null) : null,
      ciudad: p.ciudad ?? "",
      fechaEvento: p.fecha_evento,
      estrellas: promedioEstrellas(e),
      resenas: e.length,
      ventas: ventas.get(p.id) ?? 0,
      creado: p.created_at,
      destacado: !!p.destacado,
      agotado: p.stock !== null && p.stock <= 0,
    };
  });
  return [...deObras, ...deProductos];
}

/* ───────────────────────── Catálogo y ficha (públicos) ───────────────────────── */

export const catalogoMercado = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const [o, p] = await Promise.all([
    db.from("libros").select(COLS_OBRA).eq("publicado", true).order("created_at", { ascending: false }).limit(500),
    db.from("mercado_productos").select(COLS_PRODUCTO).eq("publicado", true).order("created_at", { ascending: false }).limit(1000),
  ]);
  return { items: await aItems((o.data ?? []) as ObraRow[], (p.data ?? []) as ProductoRow[]) };
});

export type ResenaPublica = { nombre: string; estrellas: number; texto: string; fecha: string };
export type FichaMercado = ItemMercado & {
  fotos: string[];
  lugar: string;
  duracion: string;
  envio: string;
  stock: number | null;
  vendedorCiudad: string;
  paginas: number;
  enPreventa: boolean;
  resenasLista: ResenaPublica[];
  distribucion: number[];
  parecidos: ItemMercado[];
  vitrina: { tipo: "tembiapo" | "purahei"; slug: string; nombre: string } | null;
};

export const verItemMercado = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ tipo: itemTipoZ, id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    let obra: ObraRow | null = null;
    let prod: ProductoRow | null = null;
    if (data.tipo === "obra") {
      const { data: o } = await db.from("libros").select(COLS_OBRA).eq("id", data.id).eq("publicado", true).maybeSingle();
      obra = (o as ObraRow) ?? null;
    } else {
      const { data: p } = await db.from("mercado_productos").select(COLS_PRODUCTO).eq("id", data.id).eq("publicado", true).maybeSingle();
      prod = (p as ProductoRow) ?? null;
    }
    if (!obra && !prod) return { estado: "no-existe" as const };
    const [base] = await aItems(obra ? [obra] : [], prod ? [prod] : []);
    const [res, fotos, pags, vend, vitrina, cercanos] = await Promise.all([
      db.from("mercado_resenas").select("user_id, estrellas, texto, created_at").eq("item_tipo", data.tipo).eq("item_id", data.id).eq("oculta", false).order("created_at", { ascending: false }).limit(50),
      urlsFotos(prod ? prod.fotos : [obra?.portada_path]),
      obra ? db.from("libro_paginas").select("n", { count: "exact", head: true }).eq("libro_id", obra.id) : Promise.resolve({ count: 0 }),
      (prod?.vendedor_id ?? obra?.autor_id) ? db.from("autores").select("ciudad").eq("user_id", prod?.vendedor_id ?? obra?.autor_id).maybeSingle() : Promise.resolve({ data: null }),
      prod?.ref_pieza
        ? db.from("tembiapo_piezas").select("artesano_id").eq("id", prod.ref_pieza).maybeSingle().then(async (r: { data: { artesano_id: string } | null }) => {
            if (!r.data) return null;
            const { data: a } = await db.from("tembiapo_artesanos").select("slug, nombre, publicado").eq("id", r.data.artesano_id).maybeSingle();
            return a?.publicado ? { tipo: "tembiapo" as const, slug: a.slug as string, nombre: a.nombre as string } : null;
          })
        : prod?.ref_artista
          ? db.from("purahei_artistas").select("slug, nombre, publicado").eq("id", prod.ref_artista).maybeSingle().then((r: { data: { slug: string; nombre: string; publicado: boolean } | null }) =>
              r.data?.publicado ? { tipo: "purahei" as const, slug: r.data.slug, nombre: r.data.nombre } : null,
            )
          : Promise.resolve(null),
      prod
        ? db.from("mercado_productos").select(COLS_PRODUCTO).eq("publicado", true).eq("categoria", prod.categoria).neq("id", prod.id).limit(8)
        : db.from("libros").select(COLS_OBRA).eq("publicado", true).neq("id", obra!.id).limit(8),
    ]);
    const filas = (res.data ?? []) as { user_id: string; estrellas: number; texto: string; created_at: string }[];
    const nombres = new Map<string, string>();
    if (filas.length) {
      const { data: ps } = await db.from("profiles").select("id, full_name").in("id", filas.map((f) => f.user_id));
      for (const p of (ps ?? []) as { id: string; full_name: string | null }[]) nombres.set(p.id, (p.full_name ?? "").trim().split(/\s+/)[0] || "Comprador");
    }
    const distribucion = [1, 2, 3, 4, 5].map((n) => filas.filter((f) => f.estrellas === n).length);
    const parecidos = prod ? await aItems([], (cercanos.data ?? []) as ProductoRow[]) : await aItems((cercanos.data ?? []) as ObraRow[], []);
    const ficha: FichaMercado = {
      ...base,
      fotos: (prod ? prod.fotos : [obra?.portada_path]).map((f) => (f ? fotos.get(f) : undefined)).filter((x): x is string => !!x),
      lugar: prod?.lugar ?? "",
      duracion: prod?.duracion ?? "",
      envio: prod?.envio ?? "",
      stock: prod?.stock ?? null,
      vendedorCiudad: (vend.data?.ciudad as string | undefined) ?? "",
      paginas: (pags as { count: number | null }).count ?? 0,
      enPreventa: !!obra?.en_preventa,
      resenasLista: filas.map((f) => ({ nombre: nombres.get(f.user_id) ?? "Comprador", estrellas: f.estrellas, texto: f.texto, fecha: f.created_at })),
      distribucion,
      parecidos,
      vitrina: vitrina as FichaMercado["vitrina"],
    };
    return { estado: "ok" as const, ficha };
  });

/** Datos de los ítems del carrito (precio y disponibilidad actuales). */
export const itemsDelCarrito = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ lineas: z.array(z.object({ tipo: itemTipoZ, id: uuid })).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const obras = data.lineas.filter((l) => l.tipo === "obra").map((l) => l.id);
    const prods = data.lineas.filter((l) => l.tipo === "producto").map((l) => l.id);
    const [o, p] = await Promise.all([
      obras.length ? db.from("libros").select(COLS_OBRA).in("id", obras).eq("publicado", true) : { data: [] },
      prods.length ? db.from("mercado_productos").select(COLS_PRODUCTO).in("id", prods).eq("publicado", true) : { data: [] },
    ]);
    const items = await aItems((o.data ?? []) as ObraRow[], (p.data ?? []) as ProductoRow[]);
    const stock = new Map(((p.data ?? []) as ProductoRow[]).map((x) => [x.id, x.stock]));
    return { items: items.map((i) => ({ ...i, stock: i.tipo === "producto" ? (stock.get(i.id) ?? null) : null })) };
  });

export const validarCupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ codigo: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => {
    const codigo = normalizarCupon(data.codigo);
    if (!codigo) return { ok: false as const, motivo: "Ese cupón no existe." };
    const c = await leerCupon(codigo);
    const v = cuponValido(c, hoyPy());
    return v.ok ? { ok: true as const, codigo, porcentaje: c!.porcentaje } : { ok: false as const, motivo: v.motivo };
  });

function hoyPy(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

async function leerCupon(codigo: string): Promise<Cupon | null> {
  const db = await admin();
  const { data } = await db.from("mercado_cupones").select("codigo, porcentaje, vence, usos_max, usos, activo").eq("codigo", codigo).maybeSingle();
  return data ? { codigo: data.codigo, porcentaje: data.porcentaje, vence: data.vence, usosMax: data.usos_max, usos: data.usos, activo: data.activo } : null;
}

/* ───────────────────────── Comprar (carrito) ───────────────────────── */

function claves() {
  const pub = process.env["PAGOPAR_PUBLIC_KEY"];
  const priv = process.env["PAGOPAR_PRIVATE_KEY"];
  return pub && priv ? { pub, priv } : null;
}

const Contacto = z.object({
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().trim().min(6).max(30),
  ciudad: z.string().trim().max(80).default(""),
  direccion: z.string().trim().max(200).default(""),
  referencia: z.string().trim().max(200).default(""),
});

export const pagarCarrito = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        lineas: z.array(z.object({ tipo: itemTipoZ, id: uuid, cantidad: z.number().int().min(1).max(10) })).min(1).max(20),
        cupon: z.string().max(40).nullable().optional(),
        contacto: Contacto.optional(),
        ref: z.string().trim().max(20).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const db = await admin();
    const obrasIds = data.lineas.filter((l) => l.tipo === "obra").map((l) => l.id);
    const prodIds = data.lineas.filter((l) => l.tipo === "producto").map((l) => l.id);
    // En preinscripción solo se venden las obras de la Librería; los productos esperan a que se abran las ventas.
    if (prodIds.length && !(await mercadoAbierto(db)) && !(await esAdmin(context.supabase, context.userId))) throw new Error(VENTAS_PRONTO);
    const [o, p, ya] = await Promise.all([
      obrasIds.length ? db.from("libros").select("id, titulo, precio_gs, tipo, publicado").in("id", obrasIds) : { data: [] },
      prodIds.length ? db.from("mercado_productos").select(COLS_PRODUCTO).in("id", prodIds) : { data: [] },
      obrasIds.length ? db.from("libro_accesos").select("libro_id").eq("user_id", context.userId).in("libro_id", obrasIds) : { data: [] },
    ]);
    const obras = new Map(((o.data ?? []) as { id: string; titulo: string; precio_gs: number | null; tipo: TipoObra; publicado: boolean }[]).map((x) => [x.id, x]));
    const prods = new Map(((p.data ?? []) as ProductoRow[]).map((x) => [x.id, x]));
    const tengo = new Set(((ya.data ?? []) as { libro_id: string }[]).map((x) => x.libro_id));

    type Linea = { tipo: ItemTipo; id: string; titulo: string; cantidad: number; unitario: number; tipoPago: string; formato: "digital" | "fisico"; entrega: Entrega | "lectura"; vendedorId: string | null };
    const lineas: Linea[] = [];
    for (const l of data.lineas) {
      if (l.tipo === "obra") {
        const x = obras.get(l.id);
        if (!x || !x.publicado || !x.precio_gs) throw new Error("Una de las obras del carrito ya no está a la venta. Sacala y probá de nuevo.");
        if (tengo.has(l.id)) throw new Error(`Ya tenés «${x.titulo}»: sacala del carrito.`);
        lineas.push({ tipo: "obra", id: x.id, titulo: x.titulo, cantidad: 1, unitario: x.precio_gs, tipoPago: x.tipo ?? "libro", formato: "digital", entrega: "lectura", vendedorId: null });
      } else {
        const x = prods.get(l.id);
        if (!x || !x.publicado || x.entrega === "cotizacion" || !x.precio_gs) throw new Error("Uno de los productos del carrito ya no está a la venta. Sacalo y probá de nuevo.");
        if (!hayStock(x.stock, l.cantidad)) throw new Error(`De «${x.titulo}» quedan ${x.stock ?? 0}. Bajá la cantidad.`);
        const cantidad = x.entrega === "digital" ? 1 : l.cantidad;
        lineas.push({ tipo: "producto", id: x.id, titulo: x.titulo, cantidad, unitario: x.precio_gs, tipoPago: "producto", formato: x.entrega === "fisico" ? "fisico" : "digital", entrega: x.entrega, vendedorId: x.vendedor_id });
      }
    }
    const aMano = lineas.filter((l) => l.entrega === "fisico" || l.entrega === "servicio" || l.entrega === "experiencia");
    const conEnvio = lineas.some((l) => l.entrega === "fisico");
    if (aMano.length && !data.contacto) throw new Error("Faltan tus datos de contacto para coordinar la entrega.");
    if (conEnvio && (!data.contacto || data.contacto.direccion.length < 4 || data.contacto.ciudad.length < 2)) throw new Error("Falta la dirección de envío.");

    let pct = 0;
    let codigo: string | null = null;
    if (data.cupon) {
      codigo = normalizarCupon(data.cupon);
      const c = codigo ? await leerCupon(codigo) : null;
      const v = cuponValido(c, hoyPy());
      if (!v.ok) throw new Error(v.motivo);
      pct = c!.porcentaje;
    }
    const brutos = lineas.map((l) => l.unitario * l.cantidad);
    const { montos, descuento } = aplicarDescuento(brutos, pct);
    const total = montos.reduce((s, m) => s + m, 0);

    // Embajador: el del código con el que llegó o quien lo invitó (sale de la parte de Jaikuaa).
    const ref = cleanRefCode(data.ref);
    const [porCodigo, invito, ajustes] = await Promise.all([
      ref ? db.from("ambassador_codes").select("user_id").eq("code", ref).maybeSingle() : Promise.resolve({ data: null }),
      db.from("referrals").select("referrer_id").eq("referred_user_id", context.userId).maybeSingle(),
      db.from("libreria_ajustes").select("porcentaje_afiliado").eq("id", 1).maybeSingle(),
    ]);
    const afiliado = elegirAfiliado({ comprador: context.userId, porCodigo: porCodigo.data?.user_id ?? null, invitadoPor: invito.data?.referrer_id ?? null });
    const pctAfiliado = afiliado ? Number(ajustes.data?.porcentaje_afiliado ?? 0) || null : null;

    const k = claves();
    if (!k && !(await esAdmin(context.supabase, context.userId))) return { estado: "pronto" as const };
    const modo = k ? "pagopar" : "prueba";

    const { data: orden, error: e1 } = await db
      .from("mercado_ordenes")
      .insert({ user_id: context.userId, total_gs: total, descuento_gs: descuento, cupon: pct ? codigo : null, modo })
      .select("id")
      .single();
    if (e1) throw new Error(e1.message);
    const filas = lineas.map((l, i) => ({
      user_id: context.userId,
      ref_id: l.id,
      tipo: l.tipoPago,
      item_tipo: l.tipo,
      formato: l.formato,
      cantidad: l.cantidad,
      descripcion: (l.cantidad > 1 ? `${l.titulo} (x${l.cantidad})` : l.titulo).slice(0, 300),
      monto_gs: montos[i],
      orden_id: orden.id,
      modo,
      afiliado_id: pctAfiliado ? afiliado : null,
      porcentaje_afiliado: pctAfiliado,
    }));
    const { data: pagos, error: e2 } = await db.from("pagos").insert(filas).select("id, ref_id");
    if (e2) throw new Error(e2.message);
    const pagoDe = new Map(((pagos ?? []) as { id: string; ref_id: string }[]).map((x) => [x.ref_id, x.id]));
    if (aMano.length && data.contacto) {
      const ped = aMano.map((l) => ({
        pago_id: pagoDe.get(l.id),
        user_id: context.userId,
        libro_id: null,
        producto_id: l.id,
        vendedor_id: l.vendedorId,
        entrega: l.entrega,
        cantidad: l.cantidad,
        titulo: l.titulo,
        nombre: data.contacto!.nombre,
        telefono: data.contacto!.telefono,
        ciudad: data.contacto!.ciudad,
        direccion: l.entrega === "fisico" ? data.contacto!.direccion : "",
        referencia: data.contacto!.referencia,
        estado: "esperando_pago",
      }));
      const { error: e3 } = await db.from("pedidos_fisicos").insert(ped);
      if (e3) throw new Error(e3.message);
    }

    if (!k) {
      await confirmarOrden(db, orden.id, "Compra de prueba");
      return { estado: "prueba-ok" as const, ordenId: orden.id as string };
    }

    const { data: perfil } = await db.from("profiles").select("full_name, email").eq("id", context.userId).maybeSingle();
    const vence = new Date(Date.now() + 2 * 24 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
    const cuerpo = {
      token: await tokenInicio(k.priv, orden.id, total),
      public_key: k.pub,
      monto_total: total,
      tipo_pedido: "VENTA-COMERCIO",
      id_pedido_comercio: orden.id,
      descripcion_resumen: `Mercado Jaikuaa: ${lineas.length === 1 ? lineas[0].titulo : `${lineas.length} productos`}`.slice(0, 100),
      fecha_maxima_pago: vence,
      forma_pago: 9,
      comprador: {
        nombre: data.contacto?.nombre || perfil?.full_name || "Cliente Jaikuaa",
        correo_electronico: perfil?.email || "",
        documento: "", tipo_documento: "CI", telefono: data.contacto?.telefono ?? "", direccion: data.contacto?.direccion ?? "", ruc: "", razon_social: "",
        ubicacion: "", direccion_referencia: data.contacto?.referencia ?? "", coordenadas: "", ciudad: null,
      },
      compras_items: lineas.map((l, i) => ({
        ciudad: "1", nombre: l.titulo.slice(0, 100), cantidad: l.cantidad, categoria: "909", public_key: k.pub,
        url_imagen: "", descripcion: l.tipo === "obra" ? "Obra digital con voz humana" : "Producto del Mercado Jaikuaa", id_producto: l.id, precio_total: montos[i],
        vendedor_telefono: "", vendedor_direccion: "", vendedor_direccion_referencia: "", vendedor_direccion_coordenadas: "",
      })),
    };
    const r = await fetch(PAGOPAR_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    const j = (await r.json().catch(() => null)) as { respuesta?: boolean; resultado?: { data?: string }[] | string } | null;
    const hash = j?.respuesta && Array.isArray(j.resultado) ? j.resultado[0]?.data : undefined;
    const ahora = new Date().toISOString();
    if (!hash) {
      await db.from("mercado_ordenes").update({ estado: "cancelado", updated_at: ahora }).eq("id", orden.id);
      await db.from("pagos").update({ estado: "cancelado", updated_at: ahora }).eq("orden_id", orden.id);
      await db.from("pedidos_fisicos").update({ estado: "cancelado", updated_at: ahora }).in("pago_id", [...pagoDe.values()]);
      console.error("Pagopar rechazó la orden", j);
      throw new Error("No se pudo iniciar el pago. Probá de nuevo en un rato.");
    }
    await db.from("mercado_ordenes").update({ hash_pedido: hash, updated_at: ahora }).eq("id", orden.id);
    await enviarAviso("pedido.creado", {
      pedido: orden.id,
      obra: lineas.map((l) => l.titulo).join(", ").slice(0, 300),
      tipo: "mercado",
      formato: conEnvio ? "fisico" : "digital",
      montoGs: total,
      comprador: perfil?.full_name ?? "",
      correo: perfil?.email ?? "",
      ciudad: data.contacto?.ciudad ?? null,
      conEmbajador: !!pctAfiliado,
    });
    return { estado: "pagar" as const, url: urlPagoPagopar(hash) };
  });

/* ───────────────────────── Lo de cada persona ───────────────────────── */

export const miEstadoItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tipo: itemTipoZ, id: uuid }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const [fav, compra, acceso, res] = await Promise.all([
      db.from("mercado_favoritos").select("item_id").eq("user_id", context.userId).eq("item_tipo", data.tipo).eq("item_id", data.id).maybeSingle(),
      db.from("pagos").select("id").eq("user_id", context.userId).eq("ref_id", data.id).eq("estado", "pagado").limit(1),
      data.tipo === "obra" ? db.from("libro_accesos").select("id").eq("user_id", context.userId).eq("libro_id", data.id).maybeSingle() : Promise.resolve({ data: null }),
      db.from("mercado_resenas").select("estrellas, texto").eq("user_id", context.userId).eq("item_tipo", data.tipo).eq("item_id", data.id).maybeSingle(),
    ]);
    const comprado = ((compra.data ?? []) as unknown[]).length > 0 || !!acceso.data;
    return { favorito: !!fav.data, comprado, miResena: (res.data as { estrellas: number; texto: string } | null) ?? null };
  });

export const alternarFavorito = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tipo: itemTipoZ, id: uuid }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const { data: ya } = await db.from("mercado_favoritos").select("item_id").eq("user_id", context.userId).eq("item_tipo", data.tipo).eq("item_id", data.id).maybeSingle();
    if (ya) await db.from("mercado_favoritos").delete().eq("user_id", context.userId).eq("item_tipo", data.tipo).eq("item_id", data.id);
    else await db.from("mercado_favoritos").insert({ user_id: context.userId, item_tipo: data.tipo, item_id: data.id });
    return { favorito: !ya };
  });

export const misFavoritos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { data } = await db.from("mercado_favoritos").select("item_tipo, item_id").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(200);
    const filas = (data ?? []) as { item_tipo: ItemTipo; item_id: string }[];
    const ob = filas.filter((f) => f.item_tipo === "obra").map((f) => f.item_id);
    const pr = filas.filter((f) => f.item_tipo === "producto").map((f) => f.item_id);
    const [o, p] = await Promise.all([
      ob.length ? db.from("libros").select(COLS_OBRA).in("id", ob).eq("publicado", true) : { data: [] },
      pr.length ? db.from("mercado_productos").select(COLS_PRODUCTO).in("id", pr).eq("publicado", true) : { data: [] },
    ]);
    return { items: await aItems((o.data ?? []) as ObraRow[], (p.data ?? []) as ProductoRow[]) };
  });

/** Opinión de quien compró (una por persona y producto; se puede cambiar). */
export const dejarResena = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tipo: itemTipoZ, id: uuid, estrellas: z.number().int().min(1).max(5), texto: z.string().trim().max(1000).default("") }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const [compra, acceso] = await Promise.all([
      db.from("pagos").select("id").eq("user_id", context.userId).eq("ref_id", data.id).eq("estado", "pagado").limit(1),
      data.tipo === "obra" ? db.from("libro_accesos").select("id").eq("user_id", context.userId).eq("libro_id", data.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (!((compra.data ?? []) as unknown[]).length && !acceso.data) throw new Error("Solo pueden opinar quienes lo compraron.");
    const { error } = await db
      .from("mercado_resenas")
      .upsert(
        { item_tipo: data.tipo, item_id: data.id, user_id: context.userId, estrellas: data.estrellas, texto: data.texto, updated_at: new Date().toISOString() },
        { onConflict: "item_tipo,item_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type CompraLinea = {
  pagoId: string;
  ordenId: string | null;
  tipo: ItemTipo;
  id: string;
  titulo: string;
  cantidad: number;
  montoGs: number;
  estado: string;
  prueba: boolean;
  fecha: string;
  entrega: Entrega | "lectura" | "impreso";
  pedido: { estado: EstadoPedido } | null;
  descargable: boolean;
};

/** Todo lo que compró la persona, en el Mercado y en la Librería. */
export const misCompras = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { data } = await db
      .from("pagos")
      .select("id, orden_id, ref_id, item_tipo, formato, cantidad, descripcion, monto_gs, estado, modo, created_at")
      .eq("user_id", context.userId)
      .in("estado", ["pagado", "pendiente"])
      .order("created_at", { ascending: false })
      .limit(200);
    const pagos = (data ?? []) as {
      id: string; orden_id: string | null; ref_id: string; item_tipo: ItemTipo; formato: string; cantidad: number;
      descripcion: string; monto_gs: number; estado: string; modo: string; created_at: string;
    }[];
    const prodIds = [...new Set(pagos.filter((p) => p.item_tipo === "producto").map((p) => p.ref_id))];
    const [prods, peds] = await Promise.all([
      prodIds.length ? db.from("mercado_productos").select("id, entrega, archivo_path").in("id", prodIds) : { data: [] },
      pagos.length ? db.from("pedidos_fisicos").select("pago_id, estado").in("pago_id", pagos.map((p) => p.id)) : { data: [] },
    ]);
    const prod = new Map(((prods.data ?? []) as { id: string; entrega: Entrega; archivo_path: string | null }[]).map((x) => [x.id, x]));
    const ped = new Map(((peds.data ?? []) as { pago_id: string; estado: EstadoPedido }[]).map((x) => [x.pago_id, x.estado]));
    // Los pendientes viejos (más de 3 días) no se muestran: el pago nunca se hizo.
    const limite = Date.now() - 3 * 86_400_000;
    const compras = pagos
      .filter((p) => p.estado === "pagado" || new Date(p.created_at).getTime() > limite)
      .map<CompraLinea>((p) => {
        const pr = prod.get(p.ref_id);
        return {
          pagoId: p.id,
          ordenId: p.orden_id,
          tipo: p.item_tipo,
          id: p.ref_id,
          titulo: p.descripcion,
          cantidad: p.cantidad ?? 1,
          montoGs: p.monto_gs,
          estado: p.estado,
          prueba: p.modo === "prueba",
          fecha: p.created_at,
          entrega: p.item_tipo === "obra" ? (p.formato === "fisico" ? "impreso" : "lectura") : (pr?.entrega ?? "fisico"),
          pedido: ped.has(p.id) ? { estado: ped.get(p.id)! } : null,
          descargable: p.estado === "pagado" && pr?.entrega === "digital" && !!pr.archivo_path,
        };
      });
    return { compras };
  });

export const descargarProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const { data: pagado } = await db.from("pagos").select("id").eq("user_id", context.userId).eq("ref_id", data.id).eq("estado", "pagado").limit(1);
    const { data: p } = await db.from("mercado_productos").select("archivo_path, titulo, vendedor_id").eq("id", data.id).maybeSingle();
    const dueno = p?.vendedor_id === context.userId || (await esAdmin(context.supabase, context.userId));
    if (!p?.archivo_path || (!((pagado ?? []) as unknown[]).length && !dueno)) throw new Error("Forbidden");
    const { data: s, error } = await db.storage.from("mercado-archivos").createSignedUrl((p.archivo_path as string).replace(/^mercado-archivos\//, ""), 10 * 60, { download: true });
    if (error) throw new Error(error.message);
    return { url: s.signedUrl as string };
  });

/** Pantalla de vuelta de una orden del carrito. */
export const verOrden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ref: z.string().trim().min(4).max(200) }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const esUuid = /^[0-9a-f-]{36}$/i.test(data.ref);
    const { data: o } = await db
      .from("mercado_ordenes")
      .select("id, total_gs, estado, modo")
      .eq(esUuid ? "id" : "hash_pedido", data.ref)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!o) return { orden: null };
    const { data: ps } = await db.from("pagos").select("ref_id, item_tipo, formato, descripcion").eq("orden_id", o.id);
    return { orden: { id: o.id as string, totalGs: o.total_gs as number, estado: o.estado as string, modo: o.modo as string, items: (ps ?? []) as { ref_id: string; item_tipo: ItemTipo; formato: string; descripcion: string }[] } };
  });

/* ───────────────────────── Vender en el Mercado ───────────────────────── */

const categoriaPostZ = z.enum(["libreria", ...CATEGORIAS_PRODUCTO] as [string, ...string[]]);

export const postularVendedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        nombre: z.string().trim().min(2).max(120),
        categoria: categoriaPostZ,
        descripcion: z.string().trim().max(2000).default(""),
        whatsapp: z.string().trim().min(6).max(30),
        ciudad: z.string().trim().max(80).default(""),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const db = await admin();
    if (await vendedorHabilitado(context.userId)) return { estado: "ya-vendes" as const };
    const { data: pend } = await db.from("mercado_postulaciones").select("id").eq("user_id", context.userId).eq("estado", "pendiente").maybeSingle();
    if (pend) {
      await db.from("mercado_postulaciones").update({ ...data, updated_at: new Date().toISOString() }).eq("id", pend.id);
      return { estado: "actualizada" as const };
    }
    const { error } = await db.from("mercado_postulaciones").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { estado: "enviada" as const };
  });

export const miPostulacion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    if (await vendedorHabilitado(context.userId)) return { estado: "vendedor" as const };
    const { data } = await db.from("mercado_postulaciones").select("estado, nota").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return data ? { estado: data.estado as "pendiente" | "aprobada" | "rechazada", nota: (data.nota as string) ?? "" } : { estado: "ninguna" as const };
  });

/* ───────────────────────── Mi tienda (vendedor) ───────────────────────── */

export type ProductoTienda = Omit<ProductoRow, "fotos"> & { fotos: { ruta: string; url: string }[]; editable: boolean; ventas: number };
export type PedidoTienda = {
  id: string;
  titulo: string;
  cantidad: number;
  entrega: string;
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  referencia: string;
  estado: EstadoPedido;
  fecha: string;
};

function editableProducto(p: Pick<ProductoRow, "publicado" | "estado_revision">): boolean {
  return !p.publicado && (p.estado_revision === "borrador" || p.estado_revision === "observado");
}

export const miTienda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const vendedor = await vendedorHabilitado(context.userId);
    if (!vendedor) return { estado: "no-vendedor" as const };
    const db = await admin();
    const [p, ped, liq] = await Promise.all([
      db.from("mercado_productos").select(COLS_PRODUCTO).eq("vendedor_id", context.userId).order("created_at", { ascending: false }).limit(300),
      db
        .from("pedidos_fisicos")
        .select("id, titulo, cantidad, entrega, nombre, telefono, ciudad, direccion, referencia, estado, created_at")
        .eq("vendedor_id", context.userId)
        .in("estado", ["por_enviar", "enviado", "entregado"])
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("liquidaciones").select("monto_gs").eq("beneficiario_id", context.userId).eq("rol", "autor").limit(5000),
    ]);
    const rows = (p.data ?? []) as ProductoRow[];
    const ids = rows.map((r) => r.id);
    const [urls, ventasRes] = await Promise.all([
      urlsFotos(rows.flatMap((r) => r.fotos ?? [])),
      ids.length ? db.from("pagos").select("ref_id, monto_gs, cantidad").in("ref_id", ids).eq("estado", "pagado").neq("modo", "prueba").limit(50000) : { data: [] },
    ]);
    const vendidas = (ventasRes.data ?? []) as { ref_id: string; monto_gs: number; cantidad: number }[];
    const pct = new Map(rows.map((r) => [r.id, r.porcentaje_vendedor]));
    const [saldo] = calcularSaldos(
      vendidas.map((v) => ({ montoGs: v.monto_gs, autorId: context.userId, pctAutor: pct.get(v.ref_id) ?? null, afiliadoId: null, pctAfiliado: null })),
      ((liq.data ?? []) as { monto_gs: number }[]).map((l) => ({ beneficiarioId: context.userId, rol: "autor" as const, montoGs: l.monto_gs })),
    ).filter((x) => x.rol === "autor");
    const cuenta = new Map<string, number>();
    for (const v of vendidas) cuenta.set(v.ref_id, (cuenta.get(v.ref_id) ?? 0) + (v.cantidad ?? 1));
    return {
      estado: "ok" as const,
      nombre: vendedor.nombre,
      productos: rows.map<ProductoTienda>((r) => ({
        ...r,
        fotos: (r.fotos ?? []).map((ruta) => ({ ruta, url: urls.get(ruta) ?? "" })),
        editable: editableProducto(r),
        ventas: cuenta.get(r.id) ?? 0,
      })),
      pedidos: ((ped.data ?? []) as (Omit<PedidoTienda, "fecha"> & { created_at: string })[]).map<PedidoTienda>((x) => ({ ...x, fecha: x.created_at })),
      saldo: { devengadoGs: saldo?.devengadoGs ?? 0, pagadoGs: saldo?.pagadoGs ?? 0, saldoGs: saldo?.saldoGs ?? 0 },
    };
  });

const DatosProducto = z.object({
  titulo: z.string().trim().min(1).max(160),
  descripcion: z.string().trim().max(4000).default(""),
  categoria: z.enum(CATEGORIAS_PRODUCTO),
  entrega: z.enum(ENTREGAS),
  precioGs: z.number().int().min(1000).max(100000000).nullable().default(null),
  precioAnteriorGs: z.number().int().min(1000).max(100000000).nullable().default(null),
  stock: z.number().int().min(0).max(100000).nullable().default(null),
  ciudad: z.string().trim().max(80).default(""),
  lugar: z.string().trim().max(200).default(""),
  fechaEvento: z.string().datetime({ offset: true }).nullable().default(null),
  duracion: z.string().trim().max(80).default(""),
  envio: z.string().trim().max(300).default(""),
});

function aFila(d: Partial<z.infer<typeof DatosProducto>>): Record<string, unknown> {
  const f: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const m: [keyof typeof d, string][] = [
    ["titulo", "titulo"], ["descripcion", "descripcion"], ["categoria", "categoria"], ["entrega", "entrega"], ["precioGs", "precio_gs"],
    ["precioAnteriorGs", "precio_anterior_gs"], ["stock", "stock"], ["ciudad", "ciudad"], ["lugar", "lugar"], ["fechaEvento", "fecha_evento"],
    ["duracion", "duracion"], ["envio", "envio"],
  ];
  for (const [k, col] of m) if (d[k] !== undefined) f[col] = d[k];
  return f;
}

/** Productos que el usuario puede tocar: el vendedor los suyos en borrador u observados; el administrador todos. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exigirProducto(supabase: any, userId: string, id: string): Promise<{ admin: boolean; row: ProductoRow }> {
  const db = await admin();
  const { data } = await db.from("mercado_productos").select(COLS_PRODUCTO).eq("id", id).maybeSingle();
  if (!data) throw new Error("No existe ese producto.");
  if (await esAdmin(supabase, userId)) return { admin: true, row: data as ProductoRow };
  if (data.vendedor_id !== userId || !editableProducto(data as ProductoRow)) throw new Error("Forbidden");
  return { admin: false, row: data as ProductoRow };
}

export const crearProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DatosProducto.extend({ vendedorNombre: z.string().trim().max(120).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const soyAdmin = await esAdmin(context.supabase, context.userId);
    const vendedor = await vendedorHabilitado(context.userId);
    if (!vendedor && !soyAdmin) throw new Error("Forbidden");
    const db = await admin();
    if (vendedor) {
      const { count } = await db.from("mercado_productos").select("id", { count: "exact", head: true }).eq("vendedor_id", context.userId).neq("estado_revision", "aprobado");
      if ((count ?? 0) >= 50) throw new Error("Tenés muchos productos sin terminar. Mandá alguno a revisión antes de crear otro.");
    }
    const fila = {
      ...aFila(data),
      vendedor_id: vendedor ? context.userId : null,
      vendedor_nombre: vendedor ? vendedor.nombre : (data.vendedorNombre ?? "Mercado Jaikuaa"),
      estado_revision: "borrador",
    };
    const { data: row, error } = await db.from("mercado_productos").insert(fila).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const editarProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    DatosProducto.partial()
      .extend({ id: uuid, fotos: z.array(z.string().max(300)).max(8).optional(), archivoPath: z.string().max(300).nullable().optional() })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { admin: soyAdmin } = await exigirProducto(context.supabase, context.userId, data.id);
    const fila = aFila(data);
    if (data.fotos !== undefined) {
      if (!soyAdmin && data.fotos.some((f) => !f.startsWith(`mercado/productos/${data.id}/`))) throw new Error("Ruta inválida");
      if (soyAdmin && data.fotos.some((f) => !/^(mercado\/productos\/|tembiapo\/)/.test(f))) throw new Error("Ruta inválida");
      fila.fotos = data.fotos;
    }
    if (data.archivoPath !== undefined) {
      if (data.archivoPath !== null && !data.archivoPath.startsWith(`mercado-archivos/productos/${data.id}/`)) throw new Error("Ruta inválida");
      fila.archivo_path = data.archivoPath;
    }
    const db = await admin();
    const { error } = await db.from("mercado_productos").update(fila).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const MIME_FOTO = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" } as const;
const MIME_ARCHIVO = { "application/pdf": "pdf", "application/zip": "zip", "audio/mpeg": "mp3", "audio/mp4": "m4a", "image/png": "png", "image/jpeg": "jpg", "application/epub+zip": "epub" } as const;

export const urlSubidaProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ id: uuid, uso: z.enum(["foto", "archivo"]), mime: z.string().max(60) })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirProducto(context.supabase, context.userId, data.id);
    const tabla = data.uso === "foto" ? MIME_FOTO : MIME_ARCHIVO;
    const ext = (tabla as Record<string, string>)[data.mime];
    if (!ext) throw new Error(data.uso === "foto" ? "La foto tiene que ser JPG, PNG o WebP." : "Ese tipo de archivo no se puede vender acá (PDF, ZIP, MP3, M4A, EPUB o imagen).");
    const bucket = data.uso === "foto" ? "mercado" : "mercado-archivos";
    const path = `productos/${data.id}/${data.uso === "foto" ? "f" : "a"}-${Date.now().toString(36)}.${ext}`;
    const db = await admin();
    const { data: s, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { bucket, path, ruta: `${bucket}/${path}`, token: s.token as string };
  });

export const enviarProductoARevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ context, data }) => {
    const { row } = await exigirProducto(context.supabase, context.userId, data.id);
    if (!row.fotos?.length) throw new Error("Subí al menos una foto antes de mandarlo a revisión.");
    if (row.entrega !== "cotizacion" && !row.precio_gs) throw new Error("Poné el precio antes de mandarlo a revisión.");
    if (row.entrega === "digital" && !row.archivo_path) throw new Error("Subí el archivo que se va a descargar.");
    const db = await admin();
    const { error } = await db.from("mercado_productos").update({ estado_revision: "en_revision", updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await enviarAviso("obra.en_revision", { obra: row.titulo, tipo: `mercado:${row.categoria}`, autor: row.vendedor_nombre, paginas: row.fotos.length });
    return { ok: true };
  });

export const borrarProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirProducto(context.supabase, context.userId, data.id);
    const db = await admin();
    const { count } = await db.from("pagos").select("id", { count: "exact", head: true }).eq("ref_id", data.id).eq("estado", "pagado");
    if (count) throw new Error("Este producto ya tiene ventas: para darlo de baja, sacalo del Mercado.");
    for (const b of ["mercado", "mercado-archivos"]) {
      const { data: archivos } = await db.storage.from(b).list(`productos/${data.id}`, { limit: 100 });
      const paths = ((archivos ?? []) as { name: string }[]).map((f) => `productos/${data.id}/${f.name}`);
      if (paths.length) await db.storage.from(b).remove(paths);
    }
    const { error } = await db.from("mercado_productos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** El vendedor marca sus pedidos (enviado, entregado). */
export const marcarPedidoVendedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, estado: z.enum(ESTADOS_PEDIDO) }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const { data: p } = await db.from("pedidos_fisicos").select("estado, vendedor_id").eq("id", data.id).maybeSingle();
    if (!p || p.vendedor_id !== context.userId) throw new Error("Forbidden");
    if (data.estado === "cancelado" || !puedePasarPedido(p.estado as EstadoPedido, data.estado)) throw new Error("Ese cambio de estado no se puede hacer.");
    const { error } = await db.from("pedidos_fisicos").update({ estado: data.estado, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────────────────────── Administración del Mercado ───────────────────────── */

export type InteresadoAdmin = { id: string; nombre: string; contacto: string; interes: string; avisado: boolean; fecha: string };
export type PostulacionAdmin = { id: string; nombre: string; categoria: string; descripcion: string; whatsapp: string; ciudad: string; correo: string; fecha: string };

export const adminMercado = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const [post, prods, cup, aj, inter] = await Promise.all([
      db.from("mercado_postulaciones").select("id, user_id, nombre, categoria, descripcion, whatsapp, ciudad, created_at").eq("estado", "pendiente").order("created_at").limit(200),
      db.from("mercado_productos").select(COLS_PRODUCTO).order("created_at", { ascending: false }).limit(500),
      db.from("mercado_cupones").select("codigo, porcentaje, vence, usos_max, usos, activo").order("created_at", { ascending: false }).limit(200),
      db.from("libreria_ajustes").select("mercado_abierto").eq("id", 1).maybeSingle(),
      db.from("mercado_interesados").select("id, nombre, contacto, interes, avisado, created_at").order("created_at", { ascending: false }).limit(1000),
    ]);
    const posts = (post.data ?? []) as { id: string; user_id: string; nombre: string; categoria: string; descripcion: string; whatsapp: string; ciudad: string; created_at: string }[];
    const correos = new Map<string, string>();
    if (posts.length) {
      const { data: ps } = await db.from("profiles").select("id, email").in("id", posts.map((x) => x.user_id));
      for (const p of (ps ?? []) as { id: string; email: string | null }[]) correos.set(p.id, p.email ?? "");
    }
    const rows = (prods.data ?? []) as ProductoRow[];
    const urls = await urlsFotos(rows.flatMap((r) => r.fotos ?? []));
    return {
      abierto: aj.data?.mercado_abierto === true,
      interesados: ((inter.data ?? []) as { id: string; nombre: string; contacto: string; interes: string; avisado: boolean; created_at: string }[]).map<InteresadoAdmin>((x) => ({
        id: x.id, nombre: x.nombre, contacto: x.contacto, interes: x.interes, avisado: x.avisado, fecha: x.created_at,
      })),
      postulaciones: posts.map<PostulacionAdmin>((x) => ({ id: x.id, nombre: x.nombre, categoria: x.categoria, descripcion: x.descripcion, whatsapp: x.whatsapp, ciudad: x.ciudad, correo: correos.get(x.user_id) ?? "", fecha: x.created_at })),
      productos: rows.map<ProductoTienda>((r) => ({ ...r, fotos: (r.fotos ?? []).map((ruta) => ({ ruta, url: urls.get(ruta) ?? "" })), editable: true, ventas: 0 })),
      cupones: ((cup.data ?? []) as { codigo: string; porcentaje: number; vence: string | null; usos_max: number | null; usos: number; activo: boolean }[]).map<Cupon>((c) => ({
        codigo: c.codigo, porcentaje: c.porcentaje, vence: c.vence, usosMax: c.usos_max, usos: c.usos, activo: c.activo,
      })),
    };
  });

export const resolverPostulacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, aprobar: z.boolean(), nota: z.string().trim().max(500).default("") }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: p } = await db.from("mercado_postulaciones").select("user_id, nombre, whatsapp, ciudad, estado").eq("id", data.id).maybeSingle();
    if (!p || p.estado !== "pendiente") throw new Error("Esa postulación ya fue resuelta.");
    if (data.aprobar) {
      const { error } = await db.from("autores").upsert(
        { user_id: p.user_id, nombre: p.nombre, whatsapp: p.whatsapp, ciudad: p.ciudad, habilitado: true, habilitado_por: context.userId, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      if (error) throw new Error(error.message);
    }
    await db.from("mercado_postulaciones").update({ estado: data.aprobar ? "aprobada" : "rechazada", nota: data.nota, updated_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: true };
  });

/** Decisiones del administrador sobre un producto: revisión, autorización, porcentaje, publicar, destacar. */
export const decidirProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: uuid,
        estadoRevision: z.enum(["borrador", "en_revision", "observado", "aprobado"]).optional(),
        notaRevision: z.string().trim().max(2000).optional(),
        autorizacionFirmada: z.boolean().optional(),
        porcentajeVendedor: z.number().int().min(0).max(100).nullable().optional(),
        publicado: z.boolean().optional(),
        destacado: z.boolean().optional(),
        vendedorNombre: z.string().trim().max(120).optional(),
        refPieza: uuid.nullable().optional(),
        refArtista: uuid.nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: actual } = await db.from("mercado_productos").select("autorizacion_firmada, fotos, publicado, entrega, precio_gs").eq("id", data.id).maybeSingle();
    if (!actual) throw new Error("No existe ese producto.");
    const c: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.estadoRevision !== undefined) c.estado_revision = data.estadoRevision;
    if (data.notaRevision !== undefined) c.nota_revision = data.notaRevision;
    if (data.porcentajeVendedor !== undefined) c.porcentaje_vendedor = data.porcentajeVendedor;
    if (data.destacado !== undefined) c.destacado = data.destacado;
    if (data.vendedorNombre !== undefined) c.vendedor_nombre = data.vendedorNombre;
    if (data.refPieza !== undefined) c.ref_pieza = data.refPieza;
    if (data.refArtista !== undefined) c.ref_artista = data.refArtista;
    if (data.autorizacionFirmada !== undefined) {
      c.autorizacion_firmada = data.autorizacionFirmada;
      if (!data.autorizacionFirmada && actual.publicado) c.publicado = false;
    }
    if (data.publicado === true) {
      const firmada = data.autorizacionFirmada ?? actual.autorizacion_firmada;
      if (!firmada) throw new Error("Falta la autorización escrita del vendedor: marcala antes de publicar.");
      if (!(actual.fotos as string[]).length) throw new Error("Falta al menos una foto.");
      if (actual.entrega !== "cotizacion" && !actual.precio_gs) throw new Error("Falta el precio.");
      c.publicado = true;
      c.estado_revision = "aprobado";
    } else if (data.publicado === false) c.publicado = false;
    const { error } = await db.from("mercado_productos").update(c).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const guardarCupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        codigo: z.string().max(40),
        porcentaje: z.number().int().min(1).max(90),
        vence: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
        usosMax: z.number().int().min(1).max(100000).nullable().default(null),
        activo: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const codigo = normalizarCupon(data.codigo);
    if (!codigo) throw new Error("El código va de 3 a 20 letras o números, sin espacios.");
    const db = await admin();
    const { error } = await db
      .from("mercado_cupones")
      .upsert({ codigo, porcentaje: data.porcentaje, vence: data.vence, usos_max: data.usosMax, activo: data.activo }, { onConflict: "codigo" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const ocultarResena = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, oculta: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    await db.from("mercado_resenas").update({ oculta: data.oculta }).eq("id", data.id);
    return { ok: true };
  });

/** Piezas de Tembiapo y artistas de Purahéi publicados, para enlazar un producto con su vitrina. */
export const vitrinasParaEnlazar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const [pz, ar] = await Promise.all([
      db.from("tembiapo_piezas").select("id, titulo, fotos, artesano_id").eq("publicado", true).limit(1000),
      db.from("purahei_artistas").select("id, nombre").eq("publicado", true).limit(500),
    ]);
    return {
      piezas: ((pz.data ?? []) as { id: string; titulo: string; fotos: string[] }[]).map((p) => ({ id: p.id, titulo: p.titulo, fotos: p.fotos ?? [] })),
      artistas: (ar.data ?? []) as { id: string; nombre: string }[],
    };
  });

/** Productos publicados del Mercado enlazados a una pieza de Tembiapo o a un artista de Purahéi. */
export const productosEnlazados = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ pieza: uuid.optional(), artista: uuid.optional() }).parse(d))
  .handler(async ({ data }) => {
    if (!data.pieza && !data.artista) return { productos: [] as { id: string; titulo: string; precioGs: number | null; entrega: Entrega }[] };
    const db = await admin();
    let q = db.from("mercado_productos").select("id, titulo, precio_gs, entrega").eq("publicado", true).limit(20);
    q = data.pieza ? q.eq("ref_pieza", data.pieza) : q.eq("ref_artista", data.artista);
    const { data: rows } = await q;
    return {
      productos: ((rows ?? []) as { id: string; titulo: string; precio_gs: number | null; entrega: Entrega }[]).map((r) => ({ id: r.id, titulo: r.titulo, precioGs: r.precio_gs, entrega: r.entrega })),
    };
  });

// ---------------------------------------------------------------------------------------------
// Preinscripción: el Mercado se muestra como vitrina, recibe vendedores y anota a quienes esperan la apertura.

/** Si las ventas de productos del Mercado están abiertas (las obras de la Librería se venden siempre). */
export const estadoMercado = createServerFn({ method: "GET" }).handler(async () => ({ abierto: await mercadoAbierto(await admin()) }));

const INTERESES = ["todo", "libros", "modulos", "cursos", ...CATEGORIAS_PRODUCTO] as const;

/** «Avisame cuando abra»: nombre y WhatsApp o correo. Sin cuenta. Si el contacto ya estaba, se actualiza. */
export const anotarInteresado = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        nombre: z.string().trim().min(2).max(120),
        contacto: z
          .string()
          .trim()
          .min(5)
          .max(120)
          .refine((c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || c.replace(/\D/g, "").length >= 6, "Escribí un WhatsApp o un correo válido."),
        interes: z.enum(INTERESES).catch("todo"),
        trampa: z.string().max(0).optional(), // campo oculto: si un robot lo llena, se descarta
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: ya } = await db.from("mercado_interesados").select("id").ilike("contacto", data.contacto.replace(/[%_\\]/g, "\\$&")).maybeSingle();
    if (ya) await db.from("mercado_interesados").update({ nombre: data.nombre, interes: data.interes }).eq("id", ya.id);
    else {
      const { error } = await db.from("mercado_interesados").insert({ nombre: data.nombre, contacto: data.contacto, interes: data.interes });
      if (error && !String(error.message).includes("duplicate")) throw new Error("No pudimos anotarte. Probá de nuevo en un rato.");
    }
    return { ok: true };
  });

/** El administrador abre o cierra las ventas de productos del Mercado. */
export const abrirVentasMercado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ abierto: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db.from("libreria_ajustes").upsert({ id: 1, mercado_abierto: data.abierto, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** El administrador marca a un interesado como ya avisado. */
export const marcarInteresadoAvisado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid, avisado: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    await db.from("mercado_interesados").update({ avisado: data.avisado }).eq("id", data.id);
    return { ok: true };
  });
