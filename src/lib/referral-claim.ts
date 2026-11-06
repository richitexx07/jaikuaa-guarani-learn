import { claimReferral } from "@/lib/ambassador.functions";
import { cleanRefCode, REF_STORAGE_KEY } from "@/lib/ambassador";

/**
 * Acredita al embajador que invitó a esta persona.
 * Tiene que correr ANTES de subir los puntos que la persona hizo jugando sin cuenta:
 * la base solo acepta la invitación si la cuenta todavía no tiene puntos.
 */
export async function claimPendingReferral(): Promise<void> {
  try {
    const code = cleanRefCode(localStorage.getItem(REF_STORAGE_KEY));
    if (!code) return;
    const { result } = await claimReferral({ data: { code } });
    if (["ok", "already", "invalid", "self", "too_old"].includes(result)) localStorage.removeItem(REF_STORAGE_KEY);
  } catch {
    /* sin señal o sin almacenamiento: se reintenta en la próxima sincronización */
  }
}
