import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import { hasSessionNow } from "@/lib/guest";
import { getMostradorAudioGuest, listMostradorGuest } from "@/lib/guest.functions";
import { getMostradorAudio, listMostrador } from "@/lib/mostrador.functions";
import type { RubroId } from "@/lib/mostrador";

/**
 * Frases de atención (Consultorio y Ventanilla) con o sin cuenta.
 * Sin cuenta se ven solo las publicadas, igual que cualquier cuenta común.
 */
export function useMostrador() {
  const listFn = useServerFn(listMostrador);
  const audioFn = useServerFn(getMostradorAudio);
  const listGuest = useServerFn(listMostradorGuest);
  const audioGuest = useServerFn(getMostradorAudioGuest);
  const listar = useCallback(
    async (rubro: RubroId, todas = false) =>
      (await hasSessionNow()) ? listFn({ data: { rubro, todas } }) : listGuest({ data: { rubro } }),
    [listFn, listGuest],
  );
  const audios = useCallback(
    async (ids: string[]) => ((await hasSessionNow()) ? audioFn({ data: { ids } }) : audioGuest({ data: { ids } })),
    [audioFn, audioGuest],
  );
  return { listar, audios };
}
