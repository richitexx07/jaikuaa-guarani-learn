/**
 * Carrito del Mercado: vive en este celular (comodidad de quien compra, no dato importante).
 * Si el almacenamiento no está disponible, funciona en memoria mientras la página esté abierta.
 */
import { useSyncExternalStore } from "react";
import { agregarAlCarrito, cambiarCantidad, sanearCarrito, type LineaCarrito } from "@/lib/mercado";

const CLAVE = "jaikuaa_carrito";
const EVENTO = "jaikuaa-carrito";
let enMemoria: LineaCarrito[] = [];
let cache: { raw: string | null; valor: LineaCarrito[] } = { raw: null, valor: [] };

function leer(): LineaCarrito[] {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw === cache.raw) return cache.valor;
    cache = { raw, valor: sanearCarrito(raw ? JSON.parse(raw) : []) };
    return cache.valor;
  } catch {
    return enMemoria;
  }
}

function escribir(v: LineaCarrito[]) {
  enMemoria = v;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(v));
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

const VACIO: LineaCarrito[] = [];

export function useCarrito() {
  const lineas = useSyncExternalStore(suscribir, leer, () => VACIO);
  return {
    lineas,
    cantidad: lineas.reduce((s, l) => s + l.cantidad, 0),
    agregar: (l: LineaCarrito) => escribir(agregarAlCarrito(leer(), l)),
    cambiar: (l: Pick<LineaCarrito, "tipo" | "id">, n: number) => escribir(cambiarCantidad(leer(), l, n)),
    vaciar: () => escribir([]),
  };
}
