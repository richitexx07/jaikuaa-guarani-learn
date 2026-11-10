import { useEffect, useState } from "react";
import { useAppLang, type AppLang } from "@/lib/i18n";

/**
 * Franja del lanzamiento oficial.
 * Mientras la fecha no está confirmada (LANZAMIENTO = null) muestra «Muy pronto», sin cuenta regresiva.
 * Con fecha: cuenta los días; el día dice «Hoy» y desde el siguiente desaparece sola.
 * Para fijar la fecha: LANZAMIENTO = Date.UTC(año, mes-1, día, 3) (medianoche de Paraguay, UTC−3) y completar FECHA.
 */
export const LANZAMIENTO: number | null = null;
const FECHA: Record<AppLang, string> | null = null;
const DIA = 24 * 60 * 60 * 1000;

type L = Record<AppLang, string>;
const T: Record<"titulo" | "pronto" | "hoy" | "manana" | "faltan", L> = {
  titulo: { es: "Lanzamiento oficial", pt: "Lançamento oficial", en: "Official launch", de: "Offizieller Start", fr: "Lancement officiel", zh: "正式上線" },
  pronto: { es: "Muy pronto", pt: "Em breve", en: "Coming soon", de: "Demnächst", fr: "Bientôt", zh: "即將推出" },
  hoy: { es: "¡Es hoy!", pt: "É hoje!", en: "It's today!", de: "Heute!", fr: "C'est aujourd'hui !", zh: "就是今天！" },
  manana: { es: "¡Es mañana!", pt: "É amanhã!", en: "It's tomorrow!", de: "Morgen!", fr: "C'est demain !", zh: "就在明天！" },
  faltan: { es: "Faltan {n} días", pt: "Faltam {n} dias", en: "{n} days to go", de: "Noch {n} Tage", fr: "J-{n}", zh: "還有 {n} 天" },
};

export function diasParaLanzamiento(ahora: number, fecha: number | null = LANZAMIENTO): number | null {
  if (fecha === null) return null;
  return Math.ceil((fecha - ahora) / DIA) + 0; // + 0 evita el «-0»
}

export function LanzamientoBanner({ oscuro = false, className = "" }: { oscuro?: boolean; className?: string }) {
  const lang = useAppLang();
  const [dias, setDias] = useState<number | null>(null);
  useEffect(() => {
    if (LANZAMIENTO === null) return;
    const calc = () => setDias(diasParaLanzamiento(Date.now()));
    calc();
    const id = window.setInterval(calc, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
  if (dias !== null && dias < 0) return null;
  const t = (k: keyof typeof T) => T[k][lang] ?? T[k].es;
  const fecha = FECHA ? (FECHA[lang] ?? FECHA.es) : t("pronto");
  const cuenta = dias === null ? "" : dias === 0 ? t("hoy") : dias === 1 ? t("manana") : t("faltan").replace("{n}", String(dias));

  return (
    <div
      role="note"
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl px-4 py-2.5 text-center ${className}`}
      style={
        oscuro
          ? { background: "linear-gradient(90deg, rgba(246,196,69,.16), rgba(255,255,255,.06))", boxShadow: "inset 0 0 0 1.5px rgba(246,196,69,.45)", color: "#fff" }
          : { background: "linear-gradient(90deg, #1E3A5F, #24497A)", color: "#fff" }
      }
    >
      <span aria-hidden className="flex gap-1">
        <i className="block h-1.5 w-4 rounded-full bg-[#D52B1E]" />
        <i className="block h-1.5 w-4 rounded-full bg-white" />
        <i className="block h-1.5 w-4 rounded-full bg-[#2F62C9]" />
      </span>
      <span className="text-sm font-semibold">
        {t("titulo")} · <span className="font-display font-bold text-[#F6C445]">{fecha}</span>
      </span>
      {cuenta && (
        <span className="rounded-full bg-[#F6C445] px-2.5 py-0.5 font-display text-xs font-bold text-[#0D1B33]">{cuenta}</span>
      )}
    </div>
  );
}
