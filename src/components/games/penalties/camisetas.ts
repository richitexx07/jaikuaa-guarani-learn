import { useCallback, useSyncExternalStore } from "react";

/**
 * Camisetas por país para el pateador de Penales.
 * Solo los colores de cada país: sin escudos, sin marcas y sin banderas (un amistoso con el Jai, nunca rivales).
 * Primero Paraguay y los países de la MICSUR; después, uno o más por cada idioma de la app (si está el idioma, está la camiseta).
 * El nombre de cada país lo da el navegador en el idioma elegido (Intl.DisplayNames), sin traducir a mano.
 */
export type Diseno = {
  /** Color de fondo de la camiseta. */
  base: string;
  /** Rayas verticales (Paraguay, Argentina). */
  rayas?: string;
  /** Banda cruzada (Perú). */
  banda?: string;
  /** Ribete en cuello, mangas y ruedo. */
  vivo?: string;
  /** Color del nombre y el número de la espalda. */
  numero: string;
};

export const CAMISETAS = {
  PY: { base: "#FFFFFF", rayas: "#D52B1E", numero: "#0B2E7A" },
  AR: { base: "#FFFFFF", rayas: "#6CACE4", numero: "#1B1B1B" },
  BO: { base: "#007A3D", vivo: "#F9E300", numero: "#FFFFFF" },
  BR: { base: "#FEDD00", vivo: "#009C3B", numero: "#0B5E2E" },
  CL: { base: "#D52B1E", vivo: "#0039A6", numero: "#FFFFFF" },
  CO: { base: "#FCD116", vivo: "#003893", numero: "#003893" },
  EC: { base: "#FFD100", vivo: "#EF3340", numero: "#034EA2" },
  PE: { base: "#FFFFFF", banda: "#D91023", numero: "#1B1B1B" },
  UY: { base: "#55B5E5", vivo: "#FFFFFF", numero: "#1B1B1B" },
  VE: { base: "#7A1E2C", vivo: "#F2C94C", numero: "#FFFFFF" },
  MX: { base: "#006847", vivo: "#CE1126", numero: "#FFFFFF" },
  ES: { base: "#C60B1E", vivo: "#FFC400", numero: "#FFC400" },
  PT: { base: "#8E1B2A", vivo: "#046A38", numero: "#F2C94C" },
  US: { base: "#FFFFFF", vivo: "#B22234", numero: "#1F2A5C" },
  DE: { base: "#FFFFFF", vivo: "#1B1B1B", numero: "#1B1B1B" },
  FR: { base: "#1F2C5C", vivo: "#FFFFFF", numero: "#FFFFFF" },
  IT: { base: "#1A5BC4", vivo: "#D4AF37", numero: "#FFFFFF" },
  JP: { base: "#1E3C8C", vivo: "#BC002D", numero: "#FFFFFF" },
  KR: { base: "#C8102E", vivo: "#003478", numero: "#FFFFFF" },
  MA: { base: "#C1272D", vivo: "#006233", numero: "#FFFFFF" },
  TW: { base: "#1F4FA3", vivo: "#FFFFFF", numero: "#FFFFFF" },
  RU: { base: "#FFFFFF", vivo: "#D52B1E", numero: "#0039A6" },
  IL: { base: "#FFFFFF", vivo: "#0038B8", numero: "#0038B8" },
  IN: { base: "#1F5FAF", vivo: "#FF9933", numero: "#FFFFFF" },
  TR: { base: "#E30A17", vivo: "#FFFFFF", numero: "#FFFFFF" },
  KE: { base: "#BB0000", vivo: "#006600", numero: "#FFFFFF" },
} satisfies Record<string, Diseno>;

export type Pais = keyof typeof CAMISETAS;
export const PAISES = Object.keys(CAMISETAS) as Pais[];
/** Los de la MICSUR (Paraguay primero). */
export const PAISES_MICSUR: Pais[] = ["PY", "AR", "BO", "BR", "CL", "CO", "EC", "PE", "UY", "VE"];

/**
 * Camisetas especiales que se ganan con la racha de días seguidos (diseños propios de Jaikuaa, sin escudos ni marcas).
 * Una vez ganada, queda para siempre en ese celular: la racha premia, no castiga.
 */
export const ESPECIALES = {
  dorada: { racha: 3, diseno: { base: "#E7B53C", vivo: "#7A4B00", numero: "#3B2400" } },
  noche: { racha: 7, diseno: { base: "#0B1E3F", rayas: "#17407A", vivo: "#FFB23E", numero: "#FFB23E" } },
  fuego: { racha: 15, diseno: { base: "#D9480F", banda: "#FFB23E", numero: "#FFFFFF" } },
  leyenda: { racha: 30, diseno: { base: "#121212", rayas: "#2B2B2B", vivo: "#E7B53C", numero: "#E7B53C" } },
} satisfies Record<string, { racha: number; diseno: Diseno }>;
/**
 * Colores de club: diseños propios de Jaikuaa, libres para todos, SIN nombres de clubes, escudos ni marcas.
 * Cada uno elige "sus colores"; los nombres son genéricos (colores y rayas).
 */
export const CLUBES = {
  franja: { nombre: "Blanco y negro", diseno: { base: "#FFFFFF", banda: "#111111", numero: "#111111" } },
  azulgrana: { nombre: "Azul y rojo", diseno: { base: "#B5121B", rayas: "#123A8C", numero: "#FFFFFF" } },
  aurinegra: { nombre: "Amarillo y negro", diseno: { base: "#FFD200", rayas: "#111111", numero: "#111111" } },
  blancanegra: { nombre: "Rayas blanco y negro", diseno: { base: "#FFFFFF", rayas: "#111111", numero: "#C8102E" } },
  celeste: { nombre: "Celeste", diseno: { base: "#6EC1E4", vivo: "#FFFFFF", numero: "#0B2E7A" } },
  rojiblanca: { nombre: "Rojo y blanco", diseno: { base: "#D52B1E", vivo: "#FFFFFF", numero: "#FFFFFF" } },
  verdeblanca: { nombre: "Verde y blanco", diseno: { base: "#0E7A3B", rayas: "#FFFFFF", numero: "#0E7A3B" } },
  violeta: { nombre: "Violeta", diseno: { base: "#5B2A86", vivo: "#FFFFFF", numero: "#FFFFFF" } },
} satisfies Record<string, { nombre: string; diseno: Diseno }>;
export type Club = keyof typeof CLUBES;
export const LISTA_CLUBES = Object.keys(CLUBES) as Club[];

export type Especial = keyof typeof ESPECIALES | Club;
export const LISTA_ESPECIALES = Object.keys(ESPECIALES) as (keyof typeof ESPECIALES)[];
export function esEspecial(v: unknown): v is Especial {
  return typeof v === "string" && (v in ESPECIALES || v in CLUBES);
}
export function esClub(v: unknown): v is Club {
  return typeof v === "string" && v in CLUBES;
}

export type Figura = "chico" | "chica";
export type Kit = { pais: Pais; figura: Figura; nombre: string; numero: number; especial?: Especial };

/** Los colores con los que se pinta la camiseta: la especial si la eligió, si no la de su país. */
export function disenoDe(k: Kit): Diseno {
  if (esClub(k.especial)) return CLUBES[k.especial].diseno;
  if (k.especial && k.especial in ESPECIALES) return ESPECIALES[k.especial as keyof typeof ESPECIALES].diseno;
  return CAMISETAS[k.pais];
}

/* ---------------- la mejor racha vista en este celular ---------------- */
const KEY_RACHA = "jaikuaa:racha-max";
export function rachaMaxima(rachaActual = 0): number {
  let max = 0;
  try { max = Math.max(0, Math.round(Number(localStorage.getItem(KEY_RACHA) ?? 0)) || 0); } catch { /* sin almacenamiento */ }
  const n = Math.min(365, Math.max(0, Math.round(rachaActual) || 0));
  if (n > max) {
    max = n;
    try { localStorage.setItem(KEY_RACHA, String(n)); } catch { /* sin almacenamiento */ }
  }
  return max;
}
export const KIT_INICIAL: Kit = { pais: "PY", figura: "chico", nombre: "", numero: 10 };

const BANDERAS = import.meta.glob<string>("/src/assets/banderas/*.webp", { eager: true, import: "default" });
/** La bandera del país (para elegir); la camiseta en sí no lleva bandera. */
export function bandera(p: Pais): string | undefined {
  return BANDERAS[`/src/assets/banderas/${p.toLowerCase()}.webp`];
}

export function esPais(v: unknown): v is Pais {
  return typeof v === "string" && v in CAMISETAS;
}

/** Limpia lo que llega de afuera (otro celular, almacenamiento). */
export function kitSeguro(v: unknown, nombre = ""): Kit {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Kit>;
  const n = Math.round(Number(o.numero));
  return {
    pais: esPais(o.pais) ? o.pais : KIT_INICIAL.pais,
    figura: o.figura === "chica" ? "chica" : "chico",
    nombre: limpiarNombre(typeof o.nombre === "string" && o.nombre.trim() ? o.nombre : nombre),
    numero: n >= 1 && n <= 99 ? n : 10,
    ...(esEspecial(o.especial) ? { especial: o.especial } : {}),
  };
}

export function limpiarNombre(s: string): string {
  return s.replace(/[<>]/g, "").replace(/\s+/g, " ").replace(/^\s+/, "").slice(0, 12);
}

const nombres = new Map<string, Intl.DisplayNames | null>();
/** «Paraguay», «Paraguai», «パラグアイ»… según el idioma de la app. */
export function nombrePais(p: Pais, lang: string): string {
  const l = lang === "zh" ? "zh-Hant" : lang;
  if (!nombres.has(l)) {
    try { nombres.set(l, new Intl.DisplayNames([l, "es"], { type: "region" })); } catch { nombres.set(l, null); }
  }
  try { return nombres.get(l)?.of(p) ?? p; } catch { return p; }
}

/* ---------------- la camiseta elegida, guardada en el celular ---------------- */

const KEY = "jaikuaa:penales-kit";
const KEY_NOMBRE = "jaikuaa:mi-nombre";
const oyentes = new Set<() => void>();
let cacheTxt: string | null | undefined;
let cacheKit: Kit = KIT_INICIAL;

function leer(): Kit {
  let txt: string | null = null;
  let nombre = "";
  try {
    txt = localStorage.getItem(KEY);
    nombre = localStorage.getItem(KEY_NOMBRE) ?? "";
  } catch { /* sin almacenamiento */ }
  const clave = `${txt}|${nombre}`;
  if (clave === cacheTxt) return cacheKit;
  cacheTxt = clave;
  let crudo: unknown = null;
  try { crudo = txt ? JSON.parse(txt) : null; } catch { crudo = null; }
  cacheKit = kitSeguro(crudo, nombre);
  return cacheKit;
}

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => { oyentes.delete(cb); };
}

export function useMiKit(): [Kit, (k: Partial<Kit>) => void] {
  const kit = useSyncExternalStore(suscribir, leer, () => KIT_INICIAL);
  const guardar = useCallback((k: Partial<Kit>) => {
    const nuevo = kitSeguro({ ...leer(), ...k });
    if (k.pais !== undefined && k.especial === undefined) delete nuevo.especial;
    if (k.nombre !== undefined) nuevo.nombre = limpiarNombre(k.nombre);
    try { localStorage.setItem(KEY, JSON.stringify(nuevo)); } catch { /* sin almacenamiento */ }
    cacheTxt = undefined;
    oyentes.forEach((l) => l());
  }, []);
  return [kit, guardar];
}
