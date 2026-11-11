/**
 * Arma las fuentes con las que el motor confirma palabras y raíces (ver FuentesMotor en motor-local).
 * Solo fuentes hechas por personas, en este orden:
 *  1. «vocabulario-jaikuaa»: palabras publicadas en Jaikuaa (las cargaron y revisan docentes).
 *  2. «diccionario-academia»: entradas del Diccionario de la Academia de la Lengua Guaraní (SPL).
 *  3. «gramatica-alg-2020»: formas impresas en la Gramática de la Academia.
 * Nada de esto escribe guaraní: solo compara con lo que ya escribieron personas.
 */
import { normalizeWord } from "./analyzer";
import type { FuentesMotor } from "./motor-local";

const sinTilde = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

export interface DatosFuentes {
  vocabulario?: string[];
  diccionario?: [string, string, string, number, string[]?][];
  gramatica?: Record<string, number[]>;
}

export function armarFuentes(d: DatosFuentes): FuentesMotor {
  const capas: [string, Set<string>][] = [];
  const agregar = (nombre: string, palabras: Iterable<string>) => {
    const set = new Set<string>();
    for (const p of palabras) {
      // Solo palabras sueltas: los afijos sueltos («-pe», «a-») no son raíces.
      if (!p || p.includes("-") || /\s/.test(p.trim())) continue;
      const k = normalizeWord(p);
      if (k) {
        set.add(k);
        set.add(sinTilde(k));
      }
    }
    capas.push([nombre, set]);
  };
  if (d.vocabulario) agregar("vocabulario-jaikuaa", d.vocabulario);
  if (d.diccionario) agregar("diccionario-academia", d.diccionario.flatMap(([h, , , , formas]) => (formas && formas.length ? formas : [h])));
  if (d.gramatica) agregar("gramatica-alg-2020", Object.keys(d.gramatica));
  return {
    conoce(palabra) {
      const k = normalizeWord(palabra);
      if (!k) return null;
      for (const [nombre, set] of capas) if (set.has(k) || set.has(sinTilde(k))) return nombre;
      return null;
    },
  };
}
