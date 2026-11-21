import { describe, expect, it } from "vitest";
import { calcularSaldos, elegirAfiliado, filtrarObras, idYoutube, normalizar, puedePasarPedido, slugAutor } from "./obras";

const obra = (o: Partial<Parameters<typeof filtrarObras>[0][number]>) => ({
  titulo: "Libro de prueba",
  autor: "Autora de prueba",
  descripcion: "",
  tipo: "libro" as const,
  area: null,
  variante: null,
  precioFisicoGs: null,
  ...o,
});

describe("buscador de la Librería", () => {
  const lista = [
    obra({ titulo: "Módulo para el consultorio", tipo: "modulo", area: "medico", variante: "bilingue" }),
    obra({ titulo: "Cuentos para leer", autor: "Ana Pérez", precioFisicoGs: 80000 }),
    obra({ titulo: "Curso para el banco", tipo: "curso", area: "financiero" }),
  ];

  it("busca sin importar tildes ni mayúsculas, en título, autor y rubro", () => {
    expect(filtrarObras(lista, { texto: "MODULO" }).map((o) => o.titulo)).toEqual(["Módulo para el consultorio"]);
    expect(filtrarObras(lista, { texto: "perez" })).toHaveLength(1);
    expect(filtrarObras(lista, { texto: "guarani medico" })).toHaveLength(1);
    expect(filtrarObras(lista, { texto: "consultorio banco" })).toHaveLength(0);
  });

  it("filtra por tipo, rubro, variante e impreso", () => {
    expect(filtrarObras(lista, { tipo: "curso" })).toHaveLength(1);
    expect(filtrarObras(lista, { area: "medico" })).toHaveLength(1);
    expect(filtrarObras(lista, { variante: "bilingue" })).toHaveLength(1);
    expect(filtrarObras(lista, { impreso: true }).map((o) => o.titulo)).toEqual(["Cuentos para leer"]);
    expect(filtrarObras(lista, {})).toHaveLength(3);
  });

  it("normaliza texto", () => {
    expect(normalizar("  Árbol ÑANDÚ ")).toBe("arbol nandu");
  });
});

describe("vitrina del autor", () => {
  it("arma un enlace limpio con el nombre", () => {
    expect(slugAutor("María José Benítez")).toBe("maria-jose-benitez");
    expect(slugAutor("  Editorial Ñandutí & Cía. ")).toBe("editorial-nanduti-cia");
    expect(slugAutor("!!!")).toBe("");
    expect(slugAutor("a".repeat(80)).length).toBeLessThanOrEqual(50);
  });
});

describe("video de YouTube", () => {
  it("acepta los enlaces comunes y devuelve el id", () => {
    const id = "dQw4w9WgXcQ";
    for (const u of [
      id,
      `https://www.youtube.com/watch?v=${id}&t=10s`,
      `https://youtu.be/${id}?si=abc`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube.com/live/${id}`,
    ])
      expect(idYoutube(u)).toBe(id);
  });

  it("rechaza lo que no es YouTube", () => {
    expect(idYoutube("https://vimeo.com/12345")).toBeNull();
    expect(idYoutube("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(idYoutube("javascript:alert(1)")).toBeNull();
    expect(idYoutube("")).toBeNull();
    expect(idYoutube(null)).toBeNull();
  });
});

describe("reparto", () => {
  it("el embajador es el del código; si no, quien invitó; nunca el comprador", () => {
    expect(elegirAfiliado({ comprador: "c", porCodigo: "a", invitadoPor: "b" })).toBe("a");
    expect(elegirAfiliado({ comprador: "c", porCodigo: null, invitadoPor: "b" })).toBe("b");
    expect(elegirAfiliado({ comprador: "c", porCodigo: "c", invitadoPor: "b" })).toBe("b");
    expect(elegirAfiliado({ comprador: "c", porCodigo: "c", invitadoPor: "c" })).toBeNull();
  });

  it("calcula lo que corresponde, lo pagado y el saldo", () => {
    const s = calcularSaldos(
      [
        { montoGs: 50000, autorId: "ana", pctAutor: 50, afiliadoId: "eze", pctAfiliado: 10 },
        { montoGs: 30000, autorId: "ana", pctAutor: 50, afiliadoId: null, pctAfiliado: null },
        { montoGs: 20000, autorId: "beto", pctAutor: null, afiliadoId: "eze", pctAfiliado: 10 },
      ],
      [{ beneficiarioId: "ana", rol: "autor", montoGs: 15000 }],
    );
    const ana = s.find((x) => x.id === "ana" && x.rol === "autor");
    const eze = s.find((x) => x.id === "eze" && x.rol === "afiliado");
    expect(ana).toMatchObject({ ventas: 2, devengadoGs: 40000, pagadoGs: 15000, saldoGs: 25000 });
    expect(eze).toMatchObject({ ventas: 2, devengadoGs: 7000, saldoGs: 7000 });
    expect(s.find((x) => x.id === "beto")).toBeUndefined();
  });
});

describe("pedidos impresos", () => {
  it("solo permite los pasos que tienen sentido", () => {
    expect(puedePasarPedido("por_enviar", "enviado")).toBe(true);
    expect(puedePasarPedido("enviado", "entregado")).toBe(true);
    expect(puedePasarPedido("esperando_pago", "enviado")).toBe(false);
    expect(puedePasarPedido("cancelado", "por_enviar")).toBe(false);
  });
});
