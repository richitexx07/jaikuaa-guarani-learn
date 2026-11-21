import { describe, expect, it } from "vitest";
import { esRutaDeLaObra, informeVentas, mesPy, nombreMes, puedeEditarObra, puedePublicar, puedeVerSinComprar } from "./obras";

const ID = "11111111-1111-1111-1111-111111111111";

describe("permisos de obras", () => {
  it("el autor edita su obra solo en borrador u observada y sin publicar", () => {
    const base = { autorId: "ana", publicado: false } as const;
    expect(puedeEditarObra({ ...base, estado: "borrador" }, "ana", false)).toBe(true);
    expect(puedeEditarObra({ ...base, estado: "observado" }, "ana", false)).toBe(true);
    expect(puedeEditarObra({ ...base, estado: "en_revision" }, "ana", false)).toBe(false);
    expect(puedeEditarObra({ ...base, estado: "aprobado" }, "ana", false)).toBe(false);
    expect(puedeEditarObra({ ...base, estado: "borrador", publicado: true }, "ana", false)).toBe(false);
    expect(puedeEditarObra({ ...base, estado: "borrador" }, "otro", false)).toBe(false);
    expect(puedeEditarObra({ autorId: null, estado: "borrador", publicado: false }, "ana", false)).toBe(false);
  });

  it("el administrador siempre puede editar y ver", () => {
    expect(puedeEditarObra({ autorId: "ana", estado: "aprobado", publicado: true }, "admin", true)).toBe(true);
    expect(puedeVerSinComprar({ autorId: null }, "admin", true)).toBe(true);
  });

  it("solo el autor de la obra la ve sin comprarla", () => {
    expect(puedeVerSinComprar({ autorId: "ana" }, "ana", false)).toBe(true);
    expect(puedeVerSinComprar({ autorId: "ana" }, "beto", false)).toBe(false);
    expect(puedeVerSinComprar({ autorId: null }, "beto", false)).toBe(false);
  });

  it("sin autorización firmada no se publica", () => {
    expect(puedePublicar({ autorizacionFirmada: false })).toBe(false);
    expect(puedePublicar({ autorizacionFirmada: true })).toBe(true);
  });

  it("las páginas del autor solo apuntan a archivos de su obra", () => {
    expect(esRutaDeLaObra(`libros/${ID}/p0001-x.webp`, ID)).toBe(true);
    expect(esRutaDeLaObra(`libros/22222222-2222-2222-2222-222222222222/p0001.webp`, ID)).toBe(false);
    expect(esRutaDeLaObra("guarani-audio/aguyje.mp3", ID)).toBe(false);
    expect(esRutaDeLaObra(`libros/${ID}/../otro/p.webp`, ID)).toBe(false);
    expect(esRutaDeLaObra(null, ID)).toBe(false);
  });
});

describe("informe de ventas del autor", () => {
  it("usa la hora de Paraguay para el mes", () => {
    expect(mesPy("2026-12-01T02:00:00Z")).toBe("2026-11");
    expect(nombreMes("2026-11")).toBe("noviembre de 2026");
  });

  it("agrupa por mes y obra y calcula la parte del contrato", () => {
    const obras = [
      { id: "a", titulo: "Guaraní médico I", porcentajeAutor: 50 },
      { id: "b", titulo: "Libro de prueba", porcentajeAutor: null },
    ];
    const ventas = [
      { refId: "a", montoGs: 50000, pagadoAt: "2026-11-10T15:00:00Z" },
      { refId: "a", montoGs: 50000, pagadoAt: "2026-11-20T15:00:00Z" },
      { refId: "b", montoGs: 30000, pagadoAt: "2026-11-05T15:00:00Z" },
      { refId: "a", montoGs: 45001, pagadoAt: "2026-12-03T15:00:00Z" },
      { refId: "x", montoGs: 99999, pagadoAt: "2026-12-03T15:00:00Z" },
    ];
    expect(informeVentas(ventas, obras)).toEqual([
      { mes: "2026-12", obraId: "a", titulo: "Guaraní médico I", ventas: 1, cobradoGs: 45001, parteAutorGs: 22501 },
      { mes: "2026-11", obraId: "a", titulo: "Guaraní médico I", ventas: 2, cobradoGs: 100000, parteAutorGs: 50000 },
      { mes: "2026-11", obraId: "b", titulo: "Libro de prueba", ventas: 1, cobradoGs: 30000, parteAutorGs: null },
    ]);
  });
});
