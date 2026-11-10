import { useEffect, useState } from "react";
import { MAX_MARCAS, SEPARADOR_MARCAS } from "./valla-led";

/** Marcas de demostración para reuniones: viven solo en esta pestaña (sessionStorage), nunca en la base. */
export type DemoBrand = { name: string; slogan: string };
const KEY = "jaikuaa:demo-brand";
const EVT = "jaikuaa:demo-brand";

export function limpiarMarcas(v: unknown): DemoBrand[] {
  const lista = Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
  return lista
    .map((b) => ({ name: String((b as DemoBrand)?.name ?? "").trim().slice(0, 40), slogan: String((b as DemoBrand)?.slogan ?? "").trim().slice(0, 60) }))
    .filter((b) => b.name)
    .slice(0, MAX_MARCAS);
}

export function readDemoBrands(): DemoBrand[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? limpiarMarcas(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function setDemoBrands(v: DemoBrand[]) {
  const l = limpiarMarcas(v);
  try {
    if (l.length) sessionStorage.setItem(KEY, JSON.stringify(l));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento: no hay demo */
  }
  window.dispatchEvent(new Event(EVT));
}

/** Texto de la valla LED: una línea por marca; la valla las va rotando. */
export function demoLedText(marcas: DemoBrand[]) {
  return marcas
    .map((b) => (b.slogan ? `${b.name.toUpperCase()} · ${b.slogan.toUpperCase()}` : `${b.name.toUpperCase()} · PRESENTA EL ESTADIO JAIKUAA`))
    .join(SEPARADOR_MARCAS);
}

export function useDemoBrands() {
  const [marcas, setMarcas] = useState<DemoBrand[]>([]);
  useEffect(() => {
    const sync = () => setMarcas(readDemoBrands());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return marcas;
}
