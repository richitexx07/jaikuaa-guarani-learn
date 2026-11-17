/** Clave del servidor para firmar comprobantes de intento (nunca sale al navegador). */
export function secretoIntento(): string {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Servidor sin configurar");
  return k;
}
