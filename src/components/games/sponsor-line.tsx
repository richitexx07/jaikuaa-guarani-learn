import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSlotSponsor, recordSponsorImpression } from "@/lib/sponsors.functions";
import type { SponsorSlot } from "@/lib/sponsor-slots";
import { useDemoBrand } from "@/lib/demo-brand";
import { useIsGuest } from "@/lib/guest";

function todayPy() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

/** "Presentado por …" de un espacio de auspiciante. No muestra nada si no hay auspiciante. */
export function SponsorLine({ slot }: { slot: SponsorSlot }) {
  const fn = useServerFn(getSlotSponsor);
  const recordFn = useServerFn(recordSponsorImpression);
  const guest = useIsGuest();
  // Sin cuenta no se consulta ni se cuenta la impresión (el conteo es por persona registrada).
  const q = useQuery({ queryKey: ["slot-sponsor", slot], enabled: !guest, queryFn: () => fn({ data: { slot } }), staleTime: 5 * 60_000 });
  const demo = useDemoBrand();
  const realName = q.data?.name ?? "";
  const name = demo && slot === "penales" ? demo.name : realName;

  useEffect(() => {
    if (!realName || (demo && slot === "penales")) return;
    const key = `jaikuaa:sponsor-imp:${slot}`;
    const day = todayPy();
    try {
      if (localStorage.getItem(key) === day) return;
      localStorage.setItem(key, day);
    } catch {
      return;
    }
    recordFn({ data: { slot } }).catch(() => {});
  }, [realName, demo, slot, recordFn]);

  if (!name) return null;
  const prefix = slot === "palabra-del-dia" ? "Presentada por" : "Presentado por";
  return (
    <p className="mt-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {prefix} <span className="font-bold text-foreground">{name}</span>
    </p>
  );
}
