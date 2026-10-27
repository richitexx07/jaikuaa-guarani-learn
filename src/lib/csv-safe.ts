/** Celda CSV segura: comillas escapadas y sin fórmulas (=, +, -, @, tab, retorno) al abrir en planillas. */
export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
