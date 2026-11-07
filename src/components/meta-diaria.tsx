/**
 * La meta diaria en pantalla: un círculo que se va llenando con los puntos de hoy.
 * Si todavía no eligió meta, ofrece tres (5, 10 o 15 minutos por día).
 */
import { useState } from "react";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { METAS, elegirMeta, useMetaDiaria } from "@/lib/meta-diaria";

type L = Record<AppLang, string>;
const T: Record<"pregunta" | "bajada" | "min" | "pts" | "titulo" | "faltan" | "cumplida" | "cambiar" | "volve", L> = {
  pregunta: { es: "¿Cuánto querés jugar por día?", pt: "Quanto você quer jogar por dia?", en: "How much do you want to play each day?", de: "Wie viel willst du täglich spielen?", fr: "Combien voulez-vous jouer par jour ?", zh: "你每天想玩多久？" },
  bajada: { es: "Elegí tu meta: un círculo te muestra cuánto te falta hoy.", pt: "Escolha sua meta: um círculo mostra quanto falta hoje.", en: "Pick your goal: a circle shows how much is left today.", de: "Wähle dein Ziel: Ein Kreis zeigt, wie viel heute noch fehlt.", fr: "Choisissez votre objectif : un cercle montre ce qu'il reste aujourd'hui.", zh: "選擇目標：圓圈會顯示今天還差多少。" },
  min: { es: "{n} min", pt: "{n} min", en: "{n} min", de: "{n} Min.", fr: "{n} min", zh: "{n} 分鐘" },
  pts: { es: "{n} puntos", pt: "{n} pontos", en: "{n} points", de: "{n} Punkte", fr: "{n} points", zh: "{n} 分" },
  titulo: { es: "Meta de hoy", pt: "Meta de hoje", en: "Today's goal", de: "Heutiges Ziel", fr: "Objectif du jour", zh: "今日目標" },
  faltan: { es: "Te faltan {n} puntos. ¡Una partida más!", pt: "Faltam {n} pontos. Mais uma partida!", en: "{n} points to go. One more game!", de: "Noch {n} Punkte. Noch eine Runde!", fr: "Encore {n} points. Une partie de plus !", zh: "還差 {n} 分。再玩一局！" },
  cumplida: { es: "¡Meta cumplida! Mañana seguimos.", pt: "Meta cumprida! Amanhã tem mais.", en: "Goal reached! See you tomorrow.", de: "Ziel erreicht! Morgen geht's weiter.", fr: "Objectif atteint ! À demain.", zh: "目標達成！明天見。" },
  cambiar: { es: "Cambiar", pt: "Mudar", en: "Change", de: "Ändern", fr: "Changer", zh: "更改" },
  volve: { es: "Empezá con un juego cortito.", pt: "Comece com um jogo rapidinho.", en: "Start with a quick game.", de: "Fang mit einem kurzen Spiel an.", fr: "Commencez par une partie rapide.", zh: "從一個短遊戲開始吧。" },
};

export function MetaDiaria({ className = "" }: { className?: string }) {
  const lang = useAppLang();
  const t = (k: keyof typeof T, n?: number) => (T[k][lang] ?? T[k].es).replace("{n}", String(n ?? ""));
  const { meta, hoy } = useMetaDiaria();
  const [eligiendo, setEligiendo] = useState(false);

  if (meta === null || eligiendo) {
    return (
      <section className={`rounded-3xl bg-white/[.08] p-4 ring-1 ring-white/15 ${className}`}>
        <p className="font-display text-lg font-bold">{t("pregunta")}</p>
        <p className="text-sm text-white/70">{t("bajada")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {METAS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { elegirMeta(m.pts); setEligiendo(false); }}
              className="rounded-2xl px-2 py-3 text-center transition active:scale-95"
              style={{ background: meta === m.pts ? "#F6C445" : "rgba(255,255,255,.1)", color: meta === m.pts ? "#3A1A05" : "#fff" }}
            >
              <b className="block font-display text-xl">{t("min", m.min)}</b>
              <span className="text-xs opacity-80">{t("pts", m.pts)}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  const p = Math.min(1, hoy / meta);
  const listo = p >= 1;
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <section className={`flex items-center gap-4 rounded-3xl bg-white/[.08] p-4 ring-1 ring-white/15 ${className}`} aria-label={`${t("titulo")}: ${hoy}/${meta}`}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="7" />
        <circle
          cx="32" cy="32" r={R} fill="none"
          stroke={listo ? "#3DE0B0" : "#F6C445"} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${C * p} ${C}`}
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white/70">{t("titulo")}</p>
        <p className="font-display text-2xl font-bold leading-tight">
          {Math.min(hoy, meta)}<span className="text-base text-white/60"> / {meta}</span> {listo && <span aria-hidden>🔥</span>}
        </p>
        <p className="text-sm text-white/80">{listo ? t("cumplida") : hoy === 0 ? t("volve") : t("faltan", meta - hoy)}</p>
      </div>
      <button type="button" onClick={() => setEligiendo(true)} className="shrink-0 self-start text-xs font-semibold text-white/60 underline underline-offset-2">
        {t("cambiar")}
      </button>
    </section>
  );
}
