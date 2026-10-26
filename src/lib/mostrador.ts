/**
 * Modo mostrador «Atendé en guaraní»: frases para que quien atiende (médico, funcionario, cajero)
 * le haga escuchar a la persona la frase grabada por un hablante paraguayo.
 * El castellano lo carga el equipo; el guaraní lo escribe un docente y lo valida otro.
 */

export const RUBROS = [
  { id: "salud", label: "Salud", emoji: "🩺", desc: "Consultorio, guardia y enfermería." },
  { id: "atencion", label: "Atención al público", emoji: "🏛️", desc: "Ventanilla, trámites y comercio." },
] as const;

export type RubroId = (typeof RUBROS)[number]["id"];
export type FraseTipo = "decir" | "escuchar";
export type FraseStatus = "pendiente" | "publicada";

export type Frase = {
  id: string;
  rubro: RubroId;
  situacion: string;
  tipo: FraseTipo;
  es: string;
  gn: string | null;
  hasAudio: boolean;
  orden: number;
  status: FraseStatus;
  /** Solo para el equipo: quién escribió el guaraní y quién validó (para la regla de dos personas). */
  gnByMe?: boolean;
  validatedByMe?: boolean;
};

export function isRubro(x: string): x is RubroId {
  return RUBROS.some((r) => r.id === x);
}

export type Situacion = { nombre: string; tipo: FraseTipo; frases: Frase[] };

/** Agrupa por situación respetando el orden: primero lo que se dice, al final lo que se escucha. */
export function agruparPorSituacion(frases: Frase[]): Situacion[] {
  const sorted = [...frases].sort(
    (a, b) => (a.tipo === b.tipo ? 0 : a.tipo === "decir" ? -1 : 1) || a.orden - b.orden,
  );
  const out: Situacion[] = [];
  for (const f of sorted) {
    let g = out.find((s) => s.nombre === f.situacion);
    if (!g) {
      g = { nombre: f.situacion, tipo: f.tipo, frases: [] };
      out.push(g);
    }
    g.frases.push(f);
  }
  return out;
}

/** Qué le falta a una frase para poder publicarse (vacío = lista para validar). */
export function faltantes(f: Pick<Frase, "gn" | "hasAudio">): string[] {
  const out: string[] = [];
  if (!f.gn) out.push("guaraní");
  if (!f.hasAudio) out.push("grabación");
  return out;
}
