import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSlotSponsor } from "@/lib/sponsors.functions";
import { useDemoBrands } from "@/lib/demo-brand";
import { useIsGuest } from "@/lib/guest";
import { SEGUNDOS_POR_MARCA } from "@/lib/valla-led";
import { VITRINAS, marcaEn, type VitrinaSlot } from "@/lib/vitrina";

const CSS = `
.vt{position:relative;overflow:hidden;border-radius:14px;background:#05080f;border:2px solid #1b2433;box-shadow:inset 0 0 18px rgba(0,0,0,.8)}
.vt::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,.28) .8px,transparent 1.2px);background-size:4px 4px;pointer-events:none;z-index:2}
.vt-txt{white-space:nowrap;font-family:'Space Grotesk',sans-serif;font-weight:800;letter-spacing:.06em;text-transform:uppercase;animation:vt-in .5s ease-out}
.vt-sweep{position:absolute;inset:0;z-index:3;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);animation:vt-sw .7s ease-out forwards;pointer-events:none}
@keyframes vt-in{from{opacity:0;transform:translateY(60%)}to{opacity:1;transform:none}}
@keyframes vt-sw{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.vt-txt,.vt-sweep{animation:none}.vt-sweep{display:none}}
`;

/** Vitrina LED rotativa (hasta 5 marcas, 7 s cada una). Sin marcas no muestra nada. */
export function VitrinaMarcas({ slot }: { slot: VitrinaSlot }) {
  const fn = useServerFn(getSlotSponsor);
  const guest = useIsGuest();
  const q = useQuery({ queryKey: ["slot-sponsor", slot], enabled: !guest, queryFn: () => fn({ data: { slot } }), staleTime: 5 * 60_000 });
  const demo = useDemoBrands();
  const marcas = demo.length ? demo : q.data?.name ? [{ name: q.data.name }] : [];
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (marcas.length < 2) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), SEGUNDOS_POR_MARCA * 1000);
    return () => window.clearInterval(id);
  }, [marcas.length]);
  const v = marcaEn(marcas, now);
  if (!v) return null;
  return (
    <div className="mx-auto my-2 max-w-3xl px-4" aria-live="polite">
      <style>{CSS}</style>
      <div className="vt px-3 py-2 text-center" style={{ boxShadow: `inset 0 0 18px rgba(0,0,0,.8), 0 0 18px ${v.color}55` }}>
        <p className="relative z-[1] text-[10px] font-semibold uppercase tracking-widest" style={{ color: `${v.color}bb` }}>
          {VITRINAS[slot].lugar} · Presentado por
        </p>
        <p key={v.i} className="vt-txt relative z-[1] truncate text-lg sm:text-xl" style={{ color: v.color, textShadow: `0 0 8px ${v.color}` }}>
          {v.marca.name}
          {v.marca.slogan ? <span className="ml-2 text-xs font-semibold opacity-80">{v.marca.slogan}</span> : null}
        </p>
        {v.total > 1 && <span key={`s${v.i}`} className="vt-sweep" aria-hidden />}
      </div>
    </div>
  );
}
