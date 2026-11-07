/**
 * «Copa de los Departamentos» de Penales, para jugar solo.
 * Uno elige su departamento y juega octavos, cuartos, semifinal y final contra otros departamentos
 * (los maneja el juego). Cada rival ya pateó: hay que hacerle más goles. Si empata, un penal de desempate.
 * Es una copa amistosa entre departamentos del Paraguay. La tabla nacional queda para cuando haya más jugadores.
 */
import { hashTexto } from "@/lib/penal-dia";

export const DEPARTAMENTOS = [
  "Asunción",
  "Concepción",
  "San Pedro",
  "Cordillera",
  "Guairá",
  "Caaguazú",
  "Caazapá",
  "Itapúa",
  "Misiones",
  "Paraguarí",
  "Alto Paraná",
  "Central",
  "Ñeembucú",
  "Amambay",
  "Canindeyú",
  "Presidente Hayes",
  "Boquerón",
  "Alto Paraguay",
] as const;
export type Departamento = (typeof DEPARTAMENTOS)[number];

export const RONDAS = ["octavos", "cuartos", "semi", "final"] as const;
export type Ronda = (typeof RONDAS)[number];

export type Partido = { rival: Departamento; golesRival: number; mios?: number; desempate?: boolean; paso?: boolean };
export type Copa = { id: number; depto: Departamento; partidos: Partido[]; ronda: number; estado: "jugando" | "campeon" | "eliminado" };

const CLAVE = "jaikuaa:copa";

export function esDepartamento(v: unknown): v is Departamento {
  return typeof v === "string" && (DEPARTAMENTOS as readonly string[]).includes(v);
}

/** Los goles que hizo cada rival: la copa se pone más difícil ronda a ronda (máximo 4 de 5, siempre se puede ganar). */
function golesRival(id: number, ronda: number): number {
  const base = [2, 3, 3, 4][ronda] ?? 4;
  const baja = ronda < 3 && hashTexto(`copa:${id}:${ronda}`) % 3 === 0 ? 1 : 0;
  return base - baja;
}

/** Arma una copa nueva: cuatro rivales distintos, elegidos al azar entre los demás departamentos. */
export function nuevaCopa(depto: Departamento, id: number): Copa {
  const otros = DEPARTAMENTOS.filter((d) => d !== depto)
    .map((d) => ({ d, k: hashTexto(`copa:${id}:${d}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, RONDAS.length)
    .map((x) => x.d);
  return { id, depto, ronda: 0, estado: "jugando", partidos: otros.map((rival, i) => ({ rival, golesRival: golesRival(id, i) })) };
}

/**
 * Anota el resultado de la tanda de la ronda actual.
 * Si gana, pasa de ronda (o sale campeón); si pierde, queda eliminado; si empata, queda pendiente el desempate.
 */
export function anotar(c: Copa, mios: number): Copa {
  if (c.estado !== "jugando") return c;
  const partidos = c.partidos.map((p, i) => (i === c.ronda ? { ...p, mios } : p));
  const p = partidos[c.ronda]!;
  if (mios === p.golesRival) {
    partidos[c.ronda] = { ...p, desempate: true };
    return { ...c, partidos };
  }
  return avanzar({ ...c, partidos }, mios > p.golesRival);
}

/** El penal de desempate: gol, pasa; errado, queda afuera. */
export function anotarDesempate(c: Copa, gol: boolean): Copa {
  if (c.estado !== "jugando") return c;
  return avanzar(c, gol);
}

function avanzar(c: Copa, gano: boolean): Copa {
  const partidos = c.partidos.map((p, i) => (i === c.ronda ? { ...p, paso: gano } : p));
  if (!gano) return { ...c, partidos, estado: "eliminado" };
  if (c.ronda >= RONDAS.length - 1) return { ...c, partidos, estado: "campeon" };
  return { ...c, partidos, ronda: c.ronda + 1 };
}

/** ¿Hay que patear el desempate en la ronda actual? */
export function pideDesempate(c: Copa): boolean {
  const p = c.partidos[c.ronda];
  return c.estado === "jugando" && !!p?.desempate && p.paso === undefined;
}

export function leerCopa(): Copa | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as Copa | null;
    return v && esDepartamento(v.depto) && Array.isArray(v.partidos) ? v : null;
  } catch {
    return null;
  }
}

export function guardarCopa(c: Copa | null): void {
  try {
    if (c) localStorage.setItem(CLAVE, JSON.stringify(c));
    else localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: la copa dura mientras esté abierta la página */
  }
}
