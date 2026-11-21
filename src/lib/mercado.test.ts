import { describe, expect, it } from "vitest";
import {
  agregarAlCarrito,
  aplicarDescuento,
  cambiarCantidad,
  cuponValido,
  filtrarMercado,
  hayStock,
  normalizarCupon,
  ordenarMercado,
  promedioEstrellas,
  sanearCarrito,
  type ItemMercado,
} from "./mercado";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

const item = (o: Partial<ItemMercado>): ItemMercado => ({
  tipo: "producto",
  id: A,
  titulo: "Producto de prueba",
  descripcion: "",
  categoria: "artesania",
  entrega: "fisico",
  precioGs: 100000,
  precioAnteriorGs: null,
  foto: null,
  vendedor: "Vendedor de prueba",
  vendedorSlug: null,
  ciudad: "Itauguá",
  fechaEvento: null,
  estrellas: null,
  resenas: 0,
  ventas: 0,
  creado: "2026-11-01T00:00:00Z",
  destacado: false,
  agotado: false,
  ...o,
});

describe("catálogo del Mercado", () => {
  const lista = [
    item({ id: A, titulo: "Carpeta de ñandutí", precioGs: 250000, estrellas: 4.8, resenas: 12, creado: "2026-10-01T00:00:00Z" }),
    item({ id: B, titulo: "Clase de prueba", categoria: "clases", entrega: "servicio", precioGs: 80000, ciudad: "Asunción", creado: "2026-11-20T00:00:00Z" }),
    item({ id: "33333333-3333-4333-8333-333333333333", titulo: "Propuesta para empresas", categoria: "empresas", entrega: "cotizacion", precioGs: null }),
  ];

  it("busca sin tildes en título, ciudad y categoría", () => {
    expect(filtrarMercado(lista, { texto: "nanduti" })).toHaveLength(1);
    expect(filtrarMercado(lista, { texto: "itaugua artesania" })).toHaveLength(1);
    expect(filtrarMercado(lista, { texto: "itaugua" })).toHaveLength(2);
    expect(filtrarMercado(lista, { categoria: "clases" })).toHaveLength(1);
    expect(filtrarMercado(lista, { precioMax: 100000 }).map((i) => i.titulo)).toEqual(["Clase de prueba"]);
  });

  it("ordena por precio (lo «a cotizar» al final), novedad y valoración", () => {
    expect(ordenarMercado(lista, "precio_asc").map((i) => i.precioGs)).toEqual([80000, 250000, null]);
    expect(ordenarMercado(lista, "precio_desc").map((i) => i.precioGs)).toEqual([250000, 80000, null]);
    expect(ordenarMercado(lista, "nuevos")[0].titulo).toBe("Clase de prueba");
    expect(ordenarMercado(lista, "valorados")[0].titulo).toBe("Carpeta de ñandutí");
  });

  it("lo agotado nunca encabeza por relevancia", () => {
    const l = [item({ id: A, agotado: true, destacado: true }), item({ id: B })];
    expect(ordenarMercado(l, "relevancia")[0].id).toBe(B);
  });

  it("promedia estrellas con un decimal", () => {
    expect(promedioEstrellas([5, 4, 4])).toBe(4.3);
    expect(promedioEstrellas([])).toBeNull();
  });
});

describe("carrito", () => {
  it("suma cantidades, las obras van de a una, y quita con cantidad 0", () => {
    let c = agregarAlCarrito([], { tipo: "producto", id: A, cantidad: 2 });
    c = agregarAlCarrito(c, { tipo: "producto", id: A, cantidad: 1 });
    c = agregarAlCarrito(c, { tipo: "obra", id: B, cantidad: 3 });
    expect(c).toEqual([
      { tipo: "producto", id: A, cantidad: 3 },
      { tipo: "obra", id: B, cantidad: 1 },
    ]);
    expect(cambiarCantidad(c, { tipo: "producto", id: A }, 0)).toHaveLength(1);
    expect(cambiarCantidad(c, { tipo: "producto", id: A }, 99)[0].cantidad).toBe(10);
  });

  it("descarta basura del almacenamiento", () => {
    expect(sanearCarrito("x")).toEqual([]);
    expect(sanearCarrito([{ tipo: "producto", id: A, cantidad: 2 }, { tipo: "hack", id: A }, { tipo: "obra", id: "no-uuid" }, null])).toEqual([
      { tipo: "producto", id: A, cantidad: 2 },
    ]);
  });
});

describe("cupones y totales", () => {
  it("valida vencimiento, usos y estado", () => {
    const c = { codigo: "LANZA", porcentaje: 10, vence: "2026-12-31", usosMax: 2, usos: 0, activo: true };
    expect(cuponValido(c, "2026-12-01").ok).toBe(true);
    expect(cuponValido(c, "2027-01-01").ok).toBe(false);
    expect(cuponValido({ ...c, usos: 2 }, "2026-12-01").ok).toBe(false);
    expect(cuponValido({ ...c, activo: false }, "2026-12-01").ok).toBe(false);
    expect(cuponValido(null, "2026-12-01").ok).toBe(false);
  });

  it("reparte el descuento exacto entre las líneas", () => {
    const r = aplicarDescuento([100000, 45000, 33333], 10);
    expect(r.descuento).toBe(Math.round(178333 * 0.1));
    expect(r.montos.reduce((s, m) => s + m, 0)).toBe(178333 - r.descuento);
    expect(r.montos.every((m) => m >= 1000)).toBe(true);
  });

  it("ninguna línea baja del mínimo", () => {
    const r = aplicarDescuento([1000, 50000], 50);
    expect(r.montos[0]).toBe(1000);
    expect(r.montos.reduce((s, m) => s + m, 0)).toBe(51000 - r.descuento);
  });

  it("normaliza códigos y revisa stock", () => {
    expect(normalizarCupon(" lanza-2026 ")).toBe("LANZA2026");
    expect(normalizarCupon("x")).toBeNull();
    expect(hayStock(null, 5)).toBe(true);
    expect(hayStock(2, 3)).toBe(false);
  });
});
