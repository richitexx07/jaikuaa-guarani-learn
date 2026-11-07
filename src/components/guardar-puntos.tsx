/**
 * «Guardá tus puntos»: el momento de alegría para pedir la cuenta.
 *
 * Quien juega sin cuenta, al ganar sus primeros puntos, ve una tarjeta abajo con el Jai: «¡Ganaste N puntos!
 * Guardalos y empezá tu racha». Con «Después» bien visible (así lo hizo Duolingo: pedir la cuenta después
 * de la primera alegría, sin muro). Si dice «Después», no vuelve a aparecer hasta el día siguiente.
 * Aparece un ratito después de terminar la partida, para no tapar el resultado.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { authMode } from "@/lib/guest";
import { rememberAfterLogin } from "@/lib/after-login";
import jaiTrofeo from "@/assets/jai/jai-trofeo.webp";

export const EVENTO_PUNTOS_INVITADO = "jaikuaa:puntos-invitado";
const POSPUESTO = "jaikuaa:guardar-pospuesto";
const DIA = 24 * 60 * 60 * 1000;

type L = Record<AppLang, string>;
const T: Record<"gano" | "info" | "guardar" | "despues", L> = {
  gano: { es: "¡Ganaste {n} puntos!", pt: "Você ganhou {n} pontos!", en: "You earned {n} points!", de: "Du hast {n} Punkte gewonnen!", fr: "Vous avez gagné {n} points !", zh: "你贏得 {n} 分！" },
  info: {
    es: "Guardalos gratis y empezá tu racha. Es en un toque, con Google.",
    pt: "Salve grátis e comece sua sequência. É num toque, com Google.",
    en: "Save them for free and start your streak. One tap with Google.",
    de: "Sichere sie kostenlos und starte deine Serie. Ein Tipp mit Google.",
    fr: "Gardez-les gratuitement et commencez votre série. Un seul geste avec Google.",
    zh: "免費儲存並開始你的連續紀錄。用 Google 一鍵完成。",
  },
  guardar: { es: "Guardar mis puntos", pt: "Salvar meus pontos", en: "Save my points", de: "Punkte sichern", fr: "Garder mes points", zh: "儲存我的分數" },
  despues: { es: "Después", pt: "Depois", en: "Later", de: "Später", fr: "Plus tard", zh: "稍後" },
};

/** ¿Se puede mostrar ahora? (no si dijo «Después» hace menos de un día). */
export function puedeMostrar(ahora: number, pospuesto: number | null): boolean {
  return pospuesto === null || ahora - pospuesto >= DIA;
}

function leerPospuesto(): number | null {
  try {
    const v = Number(localStorage.getItem(POSPUESTO));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function GuardarPuntos() {
  const lang = useAppLang();
  const t = (k: keyof typeof T) => T[k][lang] ?? T[k].es;
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const al = (e: Event) => {
      const d = (e as CustomEvent<{ total: number; ganado: number }>).detail;
      if (!d || d.ganado <= 0 || !puedeMostrar(Date.now(), leerPospuesto())) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTotal(d.total), 2200);
    };
    window.addEventListener(EVENTO_PUNTOS_INVITADO, al);
    return () => { window.removeEventListener(EVENTO_PUNTOS_INVITADO, al); window.clearTimeout(timer); };
  }, []);

  if (total === null) return null;
  const despues = () => {
    try { localStorage.setItem(POSPUESTO, String(Date.now())); } catch { /* sin almacenamiento */ }
    setTotal(null);
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 print:hidden" role="dialog" aria-modal="false" aria-label={t("guardar")}>
      <style>{`.gp-in{animation:gp-in .45s cubic-bezier(.2,.9,.25,1.1) both}@keyframes gp-in{from{transform:translateY(110%)}}@media (prefers-reduced-motion: reduce){.gp-in{animation:none}}`}</style>
      <div className="gp-in flex w-full max-w-md items-center gap-3 rounded-3xl bg-[#1E3A5F] p-4 text-white shadow-2xl ring-1 ring-white/15">
        <img src={jaiTrofeo} alt="" className="h-20 w-auto shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight text-[#F6C445]">{t("gano").replace("{n}", String(total))}</p>
          <p className="mt-0.5 text-sm text-white/85">{t("info")}</p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/auth"
              search={{ mode: authMode() }}
              onClick={() => { rememberAfterLogin(window.location.pathname + window.location.search); setTotal(null); }}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#F6C445] px-3 text-sm font-bold text-[#1E3A5F]"
            >
              {t("guardar")}
            </Link>
            <button type="button" onClick={despues} className="h-11 rounded-xl px-4 text-sm font-semibold text-white ring-1 ring-white/30">
              {t("despues")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
