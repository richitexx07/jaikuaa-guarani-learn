import { toast } from "sonner";

/**
 * La primera vez que suena una voz en este celular, Jai avisa que suba el volumen:
 * muchos celulares están en silencio y la gente cree que la app «no tiene voz».
 */
const KEY = "jaikuaa:aviso-volumen";

const MSG: Record<string, string> = {
  es: "¿No se escucha? Subí el volumen y sacá el celular del modo silencio: las voces son de paraguayos de verdad.",
  pt: "Não está ouvindo? Aumente o volume e tire o celular do modo silencioso: as vozes são de paraguaios de verdade.",
  en: "Can't hear it? Turn up the volume and switch off silent mode: these are real Paraguayan voices.",
  de: "Nichts zu hören? Lauter stellen und den Lautlos-Modus ausschalten: Das sind echte Stimmen aus Paraguay.",
  fr: "Vous n'entendez rien ? Montez le volume et désactivez le mode silencieux : ce sont de vraies voix paraguayennes.",
  zh: "聽不到嗎？請調高音量並關閉靜音模式：這些都是真正巴拉圭人的聲音。",
};

export function maybeVolumeTip() {
  try {
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, "1");
  } catch {
    return;
  }
  const lang = (typeof document !== "undefined" ? document.documentElement.lang : "es").slice(0, 2).toLowerCase();
  toast(MSG[lang] ?? MSG.en!, { duration: 7000, icon: "🔊" });
}
