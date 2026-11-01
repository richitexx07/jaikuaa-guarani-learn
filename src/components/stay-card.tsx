import { useEffect, useState } from "react";
import { AlarmClock, Check, Download, Share } from "lucide-react";
import { canPromptInstall, isIos, isStandalone, onInstallChange, promptInstall } from "@/lib/install-prompt";
import { useAppLang } from "@/lib/i18n";

/**
 * «Que no se te pase mañana»: se muestra justo después de un acierto (el momento más feliz).
 * Dos cosas, sin servidor ni permisos raros:
 *  1) Poner Jaikuaa en la pantalla de inicio (como una app).
 *  2) Recordatorio diario en el calendario del celular, a la hora que la persona elija.
 */
const KEY_REMINDER = "jaikuaa:recordatorio";

const TX = {
  title: { es: "Que no se te pase mañana", pt: "Para não esquecer amanhã", en: "Don't miss tomorrow" },
  install: { es: "Poner Jaikuaa en mi pantalla de inicio", pt: "Colocar o Jaikuaa na tela inicial", en: "Add Jaikuaa to my home screen" },
  iosHow: {
    es: "En iPhone: tocá Compartir y después «Agregar a inicio».",
    pt: "No iPhone: toque em Compartilhar e depois «Adicionar à Tela de Início».",
    en: "On iPhone: tap Share, then «Add to Home Screen».",
  },
  remind: { es: "Recordarme todos los días", pt: "Lembrar todos os dias", en: "Remind me every day" },
  at: { es: "¿A qué hora?", pt: "Que horas?", en: "What time?" },
  morning: { es: "Mañana 7:00", pt: "Manhã 7:00", en: "Morning 7:00" },
  noon: { es: "Siesta 13:00", pt: "Almoço 13:00", en: "Midday 13:00" },
  night: { es: "Noche 20:00", pt: "Noite 20:00", en: "Evening 20:00" },
  added: {
    es: "Listo: guardalo en tu calendario y Jai te avisa cada día.",
    pt: "Pronto: salve no seu calendário e o Jai avisa todo dia.",
    en: "Done: save it to your calendar and Jai will remind you daily.",
  },
};

export function StayCard({ className = "" }: { className?: string }) {
  const lang = useAppLang();
  const l = (lang === "pt" || lang === "en" ? lang : "es") as "es" | "pt" | "en";
  const [canInstall, setCanInstall] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [showIos, setShowIos] = useState(false);
  const [picking, setPicking] = useState(false);
  const [reminded, setReminded] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setIos(isIos());
    try { setReminded(!!localStorage.getItem(KEY_REMINDER)); } catch { /* nada */ }
    const update = () => { setCanInstall(canPromptInstall()); setStandalone(isStandalone()); };
    update();
    return onInstallChange(update);
  }, []);

  const showInstall = !standalone && (canInstall || ios);
  if (!showInstall && reminded) return null;

  function remind(h: number) {
    try { localStorage.setItem(KEY_REMINDER, String(h)); } catch { /* nada */ }
    setReminded(true);
    setPicking(false);
    window.location.href = `/api/recordatorio?h=${h}&m=0`;
  }

  const btn = "flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-base font-bold transition active:scale-[0.98]";
  return (
    <div className={`space-y-2 rounded-3xl border border-primary/20 bg-primary/5 p-4 text-left ${className}`}>
      <p className="text-center font-display text-lg font-bold">{TX.title[l]}</p>
      {showInstall && (
        <>
          <button
            type="button"
            className={`${btn} bg-primary text-primary-foreground`}
            onClick={async () => {
              if (canInstall) {
                const ok = await promptInstall();
                if (ok) setStandalone(true);
              } else setShowIos(true);
            }}
          >
            {ios && !canInstall ? <Share className="h-5 w-5" aria-hidden /> : <Download className="h-5 w-5" aria-hidden />}
            {TX.install[l]}
          </button>
          {showIos && <p className="text-center text-sm text-muted-foreground">{TX.iosHow[l]}</p>}
        </>
      )}
      {reminded ? (
        <p className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-[#2F7A4A]">
          <Check className="h-4 w-4" aria-hidden /> {TX.added[l]}
        </p>
      ) : picking ? (
        <div>
          <p className="mb-2 text-center text-sm font-semibold">{TX.at[l]}</p>
          <div className="grid grid-cols-3 gap-2">
            {([[7, "morning"], [13, "noon"], [20, "night"]] as const).map(([h, k]) => (
              <button key={h} type="button" className="min-h-12 rounded-2xl border-2 border-primary/30 bg-background px-2 text-sm font-bold" onClick={() => remind(h)}>
                {TX[k][l]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className={`${btn} border-2 border-primary/30 bg-background text-primary`} onClick={() => setPicking(true)}>
          <AlarmClock className="h-5 w-5" aria-hidden /> {TX.remind[l]}
        </button>
      )}
    </div>
  );
}
