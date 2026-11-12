/**
 * El anuncio de Purahéi Jaikuaa en el panel (hermano del de la Librería).
 *
 * Un escenario de noche: un reflector dorado cae sobre el Jai cantor, el ñandutí brilla atrás,
 * del micrófono sale la onda de la voz y suben notitas. Dos caminos claros: ver los artistas
 * o, si sos artista, firmar en línea para sumarte.
 */
import { Link } from "@tanstack/react-router";
import { FileSignature, Mic2 } from "lucide-react";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { Nanduti } from "@/components/libreria/arte";
import { PH } from "@/components/purahei/partes";
import jaiCanta from "@/assets/karaoke/jai-canta.webp";

type L = Record<AppLang, string>;

const T: Record<"badge" | "lema" | "cuerpo" | "ver" | "sumarme" | "chips1" | "chips2" | "chips3", L> = {
  badge: { es: "Novedad", pt: "Novidade", en: "New", de: "Neu", fr: "Nouveau", zh: "新功能" },
  lema: {
    es: "La vitrina de artistas paraguayos",
    pt: "A vitrine de artistas paraguaios",
    en: "The showcase of Paraguayan artists",
    de: "Die Bühne für paraguayische Künstler",
    fr: "La vitrine des artistes paraguayens",
    zh: "巴拉圭藝人展示舞台",
  },
  cuerpo: {
    es: "Escuchá su voz real, leé sus letras en guaraní y castellano, cantalas en el karaoke y contratalos directo por WhatsApp.",
    pt: "Ouça a voz real deles, leia as letras em guarani e espanhol, cante no karaokê e contrate direto pelo WhatsApp.",
    en: "Hear their real voices, read their lyrics in Guarani and Spanish, sing them in karaoke and book them directly on WhatsApp.",
    de: "Hör ihre echten Stimmen, lies ihre Texte auf Guaraní und Spanisch, sing sie im Karaoke und buch sie direkt per WhatsApp.",
    fr: "Écoutez leur vraie voix, lisez leurs paroles en guarani et en espagnol, chantez-les au karaoké et réservez-les directement sur WhatsApp.",
    zh: "聆聽藝人的真實歌聲，閱讀瓜拉尼語與西班牙語歌詞，在卡拉OK中演唱，並直接透過 WhatsApp 邀約演出。",
  },
  ver: { es: "Ver los artistas", pt: "Ver os artistas", en: "See the artists", de: "Zu den Künstlern", fr: "Voir les artistes", zh: "查看藝人" },
  sumarme: { es: "Soy artista: quiero sumarme", pt: "Sou artista: quero participar", en: "I'm an artist: I want to join", de: "Ich bin Künstler: ich mache mit", fr: "Je suis artiste : je veux participer", zh: "我是藝人：我想加入" },
  chips1: { es: "Voz real", pt: "Voz real", en: "Real voice", de: "Echte Stimme", fr: "Vraie voix", zh: "真人歌聲" },
  chips2: { es: "Letra bilingüe", pt: "Letra bilíngue", en: "Bilingual lyrics", de: "Zweisprachige Texte", fr: "Paroles bilingues", zh: "雙語歌詞" },
  chips3: { es: "Contratación directa", pt: "Contratação direta", en: "Direct booking", de: "Direkt buchen", fr: "Réservation directe", zh: "直接邀約" },
};

const CSS = `
.np-luz { animation: np-luz 4.5s ease-in-out infinite; transform-origin: 50% 0; }
@keyframes np-luz { 0%,100% { transform: rotate(-4deg); opacity: .85 } 50% { transform: rotate(4deg); opacity: 1 } }
.np-onda i { display: block; width: 4px; border-radius: 4px; background: linear-gradient(${PH.dorado}, #E59A2B); animation: np-onda 1.2s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes np-onda { 0%,100% { transform: scaleY(.3); opacity: .7 } 50% { transform: scaleY(1); opacity: 1 } }
.np-nota { animation: np-nota 3s ease-in-out infinite; opacity: 0; }
@keyframes np-nota { 0% { opacity: 0; transform: translate(0, 8px) scale(.8) } 25% { opacity: 1 } 100% { opacity: 0; transform: translate(-14px, -34px) scale(1.1) } }
.np-jai { animation: np-canta 2.4s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes np-canta { 0%,100% { transform: rotate(-2deg) } 50% { transform: rotate(2deg) translateY(-3px) } }
.np-giro { animation: np-giro 40s linear infinite; }
@keyframes np-giro { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .np-luz, .np-onda i, .np-nota, .np-jai, .np-giro { animation: none !important; } .np-nota { opacity: .8 } }
`;

export function NovedadPurahei() {
  const lang = useAppLang();
  const t = (k: keyof typeof T) => T[k][lang] ?? T[k].es;
  return (
    <section
      aria-labelledby="novedad-purahei"
      className="relative mt-5 overflow-hidden rounded-3xl text-white shadow-2xl ring-1 ring-white/10"
      style={{ background: `radial-gradient(110% 85% at 80% 10%, #2B527F 0%, ${PH.marino} 40%, ${PH.noche} 100%)` }}
    >
      <style>{CSS}</style>

      <div className="relative grid gap-2 p-5 pb-0 sm:grid-cols-[1fr_1.05fr] sm:items-end sm:gap-6 sm:p-7 sm:pb-0">
        {/* Texto */}
        <div className="relative z-10 sm:pb-7">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] shadow" style={{ background: PH.dorado, color: PH.noche }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full motion-safe:animate-ping" style={{ background: PH.rojo, opacity: 0.7 }} />
              <span className="relative h-2 w-2 rounded-full" style={{ background: PH.rojo }} />
            </span>
            {t("badge")}
          </span>
          <h2 id="novedad-purahei" className="mt-3 font-display text-[1.7rem] font-bold leading-[1.05] sm:text-4xl">
            Purahéi Jaikuaa
            <span className="mt-1 block text-xl sm:text-2xl" style={{ color: PH.dorado }}>{t("lema")}</span>
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">{t("cuerpo")}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
            {(["chips1", "chips2", "chips3"] as const).map((k) => (
              <li key={k} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-white/90">{t(k)}</li>
            ))}
          </ul>
          <div className="mt-5 flex max-w-sm flex-col gap-2">
            <Link
              to="/purahei"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 font-display text-base font-bold shadow-lg transition hover:brightness-105 active:scale-[.98]"
              style={{ background: PH.dorado, color: PH.noche }}
            >
              <Mic2 className="h-5 w-5" aria-hidden /> {t("ver")}
            </Link>
            <Link
              to="/convenio/$programa"
              params={{ programa: "purahei" }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/35 px-4 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[.98]"
            >
              <FileSignature className="h-4 w-4" aria-hidden /> {t("sumarme")}
            </Link>
          </div>
        </div>

        {/* El escenario: ñandutí que gira, reflector, el Jai cantor, la onda de la voz y las notas */}
        <div className="relative h-[230px] sm:h-[260px]" aria-hidden>
          <Nanduti className="np-giro absolute left-1/2 top-2 h-[210px] w-[210px] -translate-x-1/2 text-white/[.14] sm:h-[240px] sm:w-[240px]" />
          <div
            className="np-luz absolute left-1/2 top-0 h-full w-[200px] -translate-x-1/2"
            style={{ background: `linear-gradient(180deg, rgba(246,196,69,.55), rgba(246,196,69,.12) 70%, rgba(246,196,69,0))`, clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)", filter: "blur(2px)" }}
          />
          {/* El piso del escenario */}
          <div className="absolute inset-x-[8%] bottom-0 h-[30px] rounded-t-[50%]" style={{ background: "radial-gradient(closest-side, rgba(246,196,69,.55), rgba(246,196,69,.08) 70%, transparent)" }} />
          <img
            src={jaiCanta}
            alt=""
            width={768}
            height={768}
            decoding="async"
            className="np-jai absolute bottom-0 left-1/2 h-[200px] w-auto -translate-x-1/2 drop-shadow-2xl sm:h-[230px]"
          />
          <div className="np-onda absolute left-[8%] top-[38%] flex h-10 items-end gap-[3px]">
            {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ height: `${14 + ((i * 29) % 24)}px`, animationDelay: `${(i % 5) * 0.12}s` }} />)}
          </div>
          {["♪", "♫", "♪", "♫"].map((n, i) => (
            <span key={i} className="np-nota absolute text-lg font-bold" style={{ left: `${12 + i * 7}%`, top: `${22 + (i % 2) * 12}%`, color: PH.dorado, animationDelay: `${i * 0.75}s` }}>{n}</span>
          ))}
        </div>
      </div>

      {/* La franja de la bandera */}
      <div className="relative flex h-1.5" aria-hidden>
        <i className="block flex-1" style={{ background: PH.rojo }} />
        <i className="block flex-1 bg-white" />
        <i className="block flex-1" style={{ background: "#2F62C9" }} />
      </div>
    </section>
  );
}
