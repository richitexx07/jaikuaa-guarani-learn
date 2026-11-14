import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aCsv, APORTES, ESTADOS, faltaPostulacion, PERFILES, type Postulacion } from "@/lib/colaboradores";
import { normalizarWhatsapp } from "@/lib/purahei";

const ok = (n: string) => !!normalizarWhatsapp(n);
const base: Postulacion = {
  nombre: "Ana Benítez", departamento: "Central", ciudad: "Luque", whatsapp: "0981 123 456", email: "ana@escuela.edu.py", perfil: "docente",
  institucion: "", lenguas: "", aportes: ["revisar"], capacitacion: true, comentario: "", acepto: true,
};

describe("Colaboradores: postulación", () => {
  it("una postulación completa no tiene faltantes", () => {
    expect(faltaPostulacion(base, ok)).toEqual([]);
  });
  it("pide teléfono y correo, los dos, y que sean válidos", () => {
    expect(faltaPostulacion({ ...base, whatsapp: "" }, ok)).toContain("tu número de teléfono");
    expect(faltaPostulacion({ ...base, email: "" }, ok)).toContain("tu correo");
    expect(faltaPostulacion({ ...base, whatsapp: "12" }, ok)).toContain("un número de teléfono válido");
    expect(faltaPostulacion({ ...base, email: "ana" }, ok)).toContain("un correo válido");
  });
  it("pide lugar, perfil, cómo colaborar, capacitación y autorización", () => {
    const f = faltaPostulacion({ ...base, departamento: "", perfil: "", aportes: [], capacitacion: null, acepto: false }, ok);
    expect(f).toEqual(["dónde vivís", "tu perfil", "cómo querés colaborar", "si querés capacitación", "tu autorización para que te contactemos"]);
  });
});

describe("Colaboradores: coherencia con la base de datos", () => {
  const sql = readFileSync("supabase/migrations/20261112210000_colaboradores.sql", "utf8");
  it("los perfiles y estados son los mismos", () => {
    expect(sql).toContain(PERFILES.map((p) => `'${p.id}'`).join(", "));
    expect(sql).toContain(ESTADOS.map((e) => `'${e.id}'`).join(", "));
    expect(sql).toMatch(new RegExp(`cardinality\\(aportes\\) between 1 and ${APORTES.length}`));
  });
  it("la tabla no se lee desde el navegador", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).not.toMatch(/create policy/i);
  });
});

describe("Colaboradores: planilla", () => {
  it("separa con «;», escapa comillas y empieza con la marca para Excel", () => {
    const csv = aCsv([{ Nombre: 'Ana "la profe"', Ciudad: "Luque; Central" }]);
    expect(csv.startsWith("﻿Nombre;Ciudad\r\n")).toBe(true);
    expect(csv).toContain('"Ana ""la profe"""');
    expect(csv).toContain('"Luque; Central"');
  });
});
