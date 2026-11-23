/** Fields needed to distinguish reading access from printed delivery. */
export const CAMPOS_RESULTADO_PAGO = "id, ref_id, item_tipo, formato, descripcion, monto_gs, estado, modo";

export type ResultadoPago = {
  id: string;
  ref_id: string;
  item_tipo: string;
  formato: string;
  descripcion: string;
  monto_gs: number;
  estado: string;
  modo: string;
};

/** Purchase ownership also permits reviews; only a separate access row permits reading. */
export function estadoPropiedadObra(compraPagada: boolean, accesoDigital: boolean) {
  return { comprado: compraPagada || accesoDigital, accesoLectura: accesoDigital };
}

/** Only a paid digital obra can lead directly to the reader. */
export function obraParaLeer(pago: Pick<ResultadoPago, "estado" | "item_tipo" | "formato" | "ref_id"> | null | undefined): string | null {
  return pago?.estado === "pagado" && pago.item_tipo === "obra" && pago.formato === "digital" && pago.ref_id
    ? pago.ref_id
    : null;
}