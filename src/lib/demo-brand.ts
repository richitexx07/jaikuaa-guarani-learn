import { useEffect, useState } from "react";

/** Marca de demostración para reuniones: vive solo en esta pestaña (sessionStorage), nunca en la base. */
export type DemoBrand = { name: string; slogan: string };
const KEY = "jaikuaa:demo-brand";
const EVT = "jaikuaa:demo-brand";

export function readDemoBrand(): DemoBrand | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as DemoBrand;
    return v?.name?.trim() ? { name: v.name.trim().slice(0, 40), slogan: (v.slogan ?? "").trim().slice(0, 60) } : null;
  } catch {
    return null;
  }
}

export function setDemoBrand(v: DemoBrand | null) {
  try {
    if (v && v.name.trim()) sessionStorage.setItem(KEY, JSON.stringify(v));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento: no hay demo */
  }
  window.dispatchEvent(new Event(EVT));
}

/** Texto de la valla LED con la marca de demostración. */
export function demoLedText(b: DemoBrand) {
  const name = b.name.toUpperCase();
  return b.slogan ? `${name} · ${b.slogan.toUpperCase()}` : `${name} · PRESENTA EL ESTADIO JAIKUAA`;
}

export function useDemoBrand() {
  const [brand, setBrand] = useState<DemoBrand | null>(null);
  useEffect(() => {
    const sync = () => setBrand(readDemoBrand());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return brand;
}
