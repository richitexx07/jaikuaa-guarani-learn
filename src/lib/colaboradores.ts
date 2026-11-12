/**
 * Colaboradores de Jaikuaa: quién se puede postular, qué puede aportar y qué datos pedimos.
 * Los datos sirven para que el equipo elija a quién llamar según el lugar (cubrir todo el país)
 * y el perfil académico. Pedido del Prof. Carlos Ferreira (nov 2026).
 */

export const PERFILES = [
  { id: "docente", nombre: "Docente de guaraní" },
  { id: "supervisor", nombre: "Supervisor/a o directivo/a" },
  { id: "docente_indigena", nombre: "Docente de educación escolar indígena" },
  { id: "licenciado", nombre: "Licenciado/a o profesional de la lengua guaraní" },
  { id: "traductor", nombre: "Traductor/a o intérprete" },
  { id: "estudiante", nombre: "Estudiante de profesorado o licenciatura" },
  { id: "hablante", nombre: "Hablante de guaraní, sin título docente" },
  { id: "otro", nombre: "Otro" },
] as const;
export type PerfilId = (typeof PERFILES)[number]["id"];
export const PERFIL_IDS = PERFILES.map((p) => p.id) as unknown as [PerfilId, ...PerfilId[]];
export const nombrePerfil = (id: string) => PERFILES.find((p) => p.id === id)?.nombre ?? "Otro";

export const APORTES = [
  { id: "revisar", nombre: "Revisar palabras y textos en guaraní" },
  { id: "grabar", nombre: "Grabar mi voz para los audios" },
  { id: "traducir", nombre: "Traducir o escribir contenidos" },
  { id: "ensenar", nombre: "Dar clases en Jaikuaa" },
  { id: "difundir", nombre: "Llevar Jaikuaa a mi escuela o comunidad" },
  { id: "cultura", nombre: "Sumar libros, música o artesanía" },
] as const;
export type AporteId = (typeof APORTES)[number]["id"];
export const APORTE_IDS = APORTES.map((a) => a.id) as unknown as [AporteId, ...AporteId[]];
export const nombreAporte = (id: string) => APORTES.find((a) => a.id === id)?.nombre ?? id;

export const DEPARTAMENTOS = [
  "Asunción", "Central", "Concepción", "San Pedro", "Cordillera", "Guairá", "Caaguazú", "Caazapá", "Itapúa", "Misiones",
  "Paraguarí", "Alto Paraná", "Ñeembucú", "Amambay", "Canindeyú", "Presidente Hayes", "Boquerón", "Alto Paraguay", "Fuera del Paraguay",
] as const;

export const ESTADOS = [
  { id: "nuevo", nombre: "Nuevo" },
  { id: "contactado", nombre: "Contactado" },
  { id: "seleccionado", nombre: "Seleccionado" },
  { id: "descartado", nombre: "Descartado" },
] as const;
export type EstadoColaborador = (typeof ESTADOS)[number]["id"];
export const ESTADO_IDS = ESTADOS.map((e) => e.id) as unknown as [EstadoColaborador, ...EstadoColaborador[]];

export type Postulacion = {
  nombre: string; departamento: string; ciudad: string; whatsapp: string; email: string; perfil: string;
  institucion: string; lenguas: string; aportes: string[]; capacitacion: boolean | null; comentario: string; acepto: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Lo que falta para poder enviar la postulación (vacío = lista). */
export function faltaPostulacion(p: Postulacion, whatsappValido: (n: string) => boolean): string[] {
  const f: string[] = [];
  if (p.nombre.trim().length < 3) f.push("tu nombre completo");
  if (!DEPARTAMENTOS.includes(p.departamento as (typeof DEPARTAMENTOS)[number])) f.push("dónde vivís");
  const wa = p.whatsapp.trim(), em = p.email.trim();
  if (!wa && !em) f.push("un WhatsApp o un correo");
  if (wa && !whatsappValido(wa)) f.push("un WhatsApp válido");
  if (em && !EMAIL.test(em)) f.push("un correo válido");
  if (!PERFILES.some((x) => x.id === p.perfil)) f.push("tu perfil");
  if (!p.aportes.length) f.push("cómo querés colaborar");
  if (p.capacitacion === null) f.push("si querés capacitación");
  if (!p.acepto) f.push("tu autorización para que te contactemos");
  return f;
}

/** Texto para la planilla (CSV) que descarga el equipo. Separador «;» para que Excel en castellano la abra bien. */
export function aCsv(filas: Record<string, string | number | boolean>[]): string {
  if (!filas.length) return "";
  const cols = Object.keys(filas[0]);
  const esc = (v: string | number | boolean) => {
    const s = String(v ?? "");
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [cols.join(";"), ...filas.map((f) => cols.map((c) => esc(f[c])).join(";"))].join("\r\n");
}
