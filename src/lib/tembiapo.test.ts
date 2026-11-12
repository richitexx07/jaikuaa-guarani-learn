import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { avisosArtesano, enlaceWhatsappArtesano, faltaArtesano, OFICIO_IDS, OFICIOS } from "@/lib/tembiapo";
import { CONVENIOS } from "@/lib/convenios";

describe("Tembiapo: qué hace falta para publicar", () => {
  it("sin autorización de imagen no se publica", () => {
    expect(faltaArtesano({ permiso_imagen: false, oficio: "nanduti", consentimiento_comunidad: false })).toContain("autorización de imagen");
    expect(faltaArtesano({ permiso_imagen: true, oficio: "nanduti", consentimiento_comunidad: false })).toEqual([]);
  });

  it("el arte indígena exige además el consentimiento de la comunidad", () => {
    expect(faltaArtesano({ permiso_imagen: true, oficio: "indigena", consentimiento_comunidad: false })).toContain("consentimiento de la comunidad");
    expect(faltaArtesano({ permiso_imagen: true, oficio: "indigena", consentimiento_comunidad: true })).toEqual([]);
  });

  it("«otro oficio» obliga a elegir el oficio antes de publicar", () => {
    expect(faltaArtesano({ permiso_imagen: true, oficio: "otro", consentimiento_comunidad: false })).toContain("elegir el oficio");
  });

  it("sin WhatsApp avisa que no tendrá botón de compra, pero no bloquea", () => {
    expect(avisosArtesano({ whatsapp: null, bio: "x", foto_path: "tembiapo/a.webp" })).toEqual(["sin WhatsApp: no tendrá botón de compra"]);
  });
});

describe("Tembiapo: contacto directo", () => {
  it("el mensaje saluda con «Mba'éichapa» y nombra la pieza", () => {
    const u = decodeURIComponent(enlaceWhatsappArtesano("595981123456", "Doña Ana", "Mantel de ñandutí"));
    expect(u.startsWith("https://wa.me/595981123456?text=")).toBe(true);
    expect(u).toContain("Mba'éichapa, Doña Ana");
    expect(u).toContain("«Mantel de ñandutí»");
  });
});

describe("Tembiapo: coherencia con la base de datos", () => {
  const sql = readFileSync("supabase/migrations/20261112190000_tembiapo.sql", "utf8");

  it("los oficios de la vitrina y de la base de datos son los mismos", () => {
    expect(OFICIO_IDS.filter((o) => o !== "otro")).toEqual(OFICIOS.map((o) => o.slug));
    const lista = OFICIO_IDS.map((o) => `'${o}'`).join(", ");
    expect(sql.split(lista).length - 1).toBe(2);
  });

  it("la base de datos exige revisión de otro docente y permiso de imagen", () => {
    expect(sql).toContain("revisado_por is distinct from cargado_por");
    expect(sql).toMatch(/not publicado or \(permiso_imagen/);
    expect(sql).toMatch(/insert into storage\.buckets[\s\S]*'tembiapo', 'tembiapo', false/);
  });

  it("las tablas no tienen políticas de lectura directa (el público lee por el servidor)", () => {
    expect(sql).not.toMatch(/create policy/i);
  });
});

describe("Tembiapo: textos públicos", () => {
  const archivos = [
    "src/lib/tembiapo.ts",
    "src/components/tembiapo/partes.tsx",
    "src/routes/tembiapo.index.tsx",
    "src/routes/tembiapo.oficio.$slug.tsx",
    "src/routes/tembiapo.maestro.$slug.tsx",
    "src/routes/tembiapo.pieza.$id.tsx",
    "src/routes/tembiapo.ruta.$slug.tsx",
  ];
  const textos = [...archivos.map((f) => readFileSync(f, "utf8")), JSON.stringify(CONVENIOS.tembiapo)].join("\n");

  it("no usan palabras que la marca no usa", () => {
    for (const p of [/validad[oa]/i, /\baval\b/i, /homologad/i, /certificad/i, /\búnic[oa]\b/i, /\bprimer proveedor/i, /pionero/i, /\blíder\b/i]) {
      expect(textos).not.toMatch(p);
    }
  });

  it("no prometen comisiones ni precios", () => {
    expect(textos).toContain("no cobra comisión");
    expect(textos).not.toMatch(/₲|Gs\.\s?\d|guaraníes/i);
    // Los porcentajes de CSS (degradados, tamaños) no cuentan: se revisan los textos del convenio y de los oficios.
    expect(JSON.stringify(CONVENIOS.tembiapo) + JSON.stringify(OFICIOS)).not.toMatch(/\d+\s?%/);
  });
});
