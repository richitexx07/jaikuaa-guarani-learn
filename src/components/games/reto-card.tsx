/**
 * «Retá a alguien»: la tarjeta para invitar a jugar por WhatsApp (antes era un botón verde solo).
 * Se elige a qué juego retar, se ve «Vos contra ?», y se manda por WhatsApp o por cualquier app.
 * Si la persona tiene cuenta, el enlace lleva su código de embajador: cada amigo que entra le suma.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { getAmbassadorInfo } from "@/lib/ambassador.functions";
import { COVER_IMAGE } from "@/components/games/game-cover-images";
import jaiEmbajador from "@/assets/jai/jai-embajador.webp";
import jaiGamer from "@/assets/jai-gamer.webp";

type L = Record<AppLang, string>;
type Opcion = { id: "todos" | "penales" | "consultorio" | "karaoke"; ruta: string; emoji: string; nombre: L; mensaje: L };

const OPCIONES: Opcion[] = [
  {
    id: "todos", ruta: "/juegos", emoji: "🎮",
    nombre: { es: "Cualquiera", pt: "Qualquer um", en: "Any game", de: "Beliebig", fr: "N'importe lequel", zh: "任何遊戲" },
    mensaje: {
      es: "Mba'éichapa! Te reto a jugar en guaraní con voces reales, gratis y sin descargar nada. ¿Me ganás?",
      pt: "Mba'éichapa! Te desafio a jogar em guarani com vozes reais, grátis e sem baixar nada. Me supera?",
      en: "Mba'éichapa! I challenge you to play in Guaraní with real voices, free and with nothing to download. Can you beat me?",
      de: "Mba'éichapa! Ich fordere dich heraus, auf Guaraní mit echten Stimmen zu spielen, kostenlos und ohne Download. Schlägst du mich?",
      fr: "Mba'éichapa ! Je te défie de jouer en guarani avec de vraies voix, gratuit et sans rien télécharger. Tu me bats ?",
      zh: "Mba'éichapa！我挑戰你用瓜拉尼語玩遊戲，真人發音、免費、不用下載。你能贏我嗎？",
    },
  },
  {
    id: "penales", ruta: "/juegos/penales", emoji: "⚽",
    nombre: { es: "Penales", pt: "Pênaltis", en: "Penalties", de: "Elfmeter", fr: "Penalties", zh: "點球" },
    mensaje: {
      es: "Mba'éichapa! Te reto a una tanda de penales en guaraní contra el Jai arquero. Elegí la camiseta de tu país. ¿Me ganás?",
      pt: "Mba'éichapa! Te desafio a uma disputa de pênaltis em guarani contra o Jai goleiro. Escolha a camisa do seu país. Me supera?",
      en: "Mba'éichapa! I challenge you to a penalty shootout in Guaraní against Jai the goalkeeper. Pick your country's jersey. Can you beat me?",
      de: "Mba'éichapa! Ich fordere dich zum Elfmeterschießen auf Guaraní gegen Torwart Jai heraus. Wähl das Trikot deines Landes. Schlägst du mich?",
      fr: "Mba'éichapa ! Je te défie aux tirs au but en guarani contre Jai le gardien. Choisis le maillot de ton pays. Tu me bats ?",
      zh: "Mba'éichapa！我挑戰你用瓜拉尼語和守門員 Jai 踢點球。選你國家的球衣。你能贏我嗎？",
    },
  },
  {
    id: "consultorio", ruta: "/juegos/consultorio", emoji: "🩺",
    nombre: { es: "Consultorio", pt: "Consultório", en: "Doctor's office", de: "Arztpraxis", fr: "Cabinet", zh: "診所" },
    mensaje: {
      es: "Mba'éichapa! Te reto al Consultorio del Jai: atendé pacientes en guaraní. ¿Me ganás?",
      pt: "Mba'éichapa! Te desafio no Consultório do Jai: atenda pacientes em guarani. Me supera?",
      en: "Mba'éichapa! I challenge you at Jai's Doctor's Office: see patients in Guaraní. Can you beat me?",
      de: "Mba'éichapa! Ich fordere dich in Jais Arztpraxis heraus: Behandle Patienten auf Guaraní. Schlägst du mich?",
      fr: "Mba'éichapa ! Je te défie au cabinet de Jai : reçois des patients en guarani. Tu me bats ?",
      zh: "Mba'éichapa！我挑戰你到 Jai 的診所，用瓜拉尼語看病人。你能贏我嗎？",
    },
  },
  {
    id: "karaoke", ruta: "/juegos/karaoke", emoji: "🎤",
    nombre: { es: "Karaoke", pt: "Karaokê", en: "Karaoke", de: "Karaoke", fr: "Karaoké", zh: "卡拉OK" },
    mensaje: {
      es: "Mba'éichapa! Te reto al karaoke en guaraní con arpa paraguaya. ¿Me ganás?",
      pt: "Mba'éichapa! Te desafio no karaokê em guarani com harpa paraguaia. Me supera?",
      en: "Mba'éichapa! I challenge you to Guaraní karaoke with a Paraguayan harp. Can you beat me?",
      de: "Mba'éichapa! Ich fordere dich zum Guaraní-Karaoke mit paraguayischer Harfe heraus. Schlägst du mich?",
      fr: "Mba'éichapa ! Je te défie au karaoké en guarani avec la harpe paraguayenne. Tu me bats ?",
      zh: "Mba'éichapa！我挑戰你用巴拉圭豎琴唱瓜拉尼語卡拉OK。你能贏我嗎？",
    },
  },
];

const T: Record<"titulo" | "bajada" | "vos" | "aQue" | "whatsapp" | "otras" | "copiar" | "copiado" | "embajador", L> = {
  titulo: { es: "¿Quién sabe más guaraní?", pt: "Quem sabe mais guarani?", en: "Who knows more Guaraní?", de: "Wer kann mehr Guaraní?", fr: "Qui connaît le mieux le guarani ?", zh: "誰的瓜拉尼語比較強？" },
  bajada: {
    es: "Retá a alguien: juega gratis desde su celular, sin descargar nada.",
    pt: "Desafie alguém: joga grátis pelo celular, sem baixar nada.",
    en: "Challenge someone: they play free on their phone, nothing to download.",
    de: "Fordere jemanden heraus: kostenlos am Handy, ohne Download.",
    fr: "Défie quelqu'un : il joue gratuitement sur son téléphone, sans rien télécharger.",
    zh: "挑戰別人：用手機免費玩，不用下載。",
  },
  vos: { es: "Vos", pt: "Você", en: "You", de: "Du", fr: "Toi", zh: "你" },
  aQue: { es: "¿A qué lo retás?", pt: "Desafiar em quê?", en: "Challenge them to…", de: "Herausfordern bei…", fr: "Le défier à…", zh: "挑戰什麼？" },
  whatsapp: { es: "Retar por WhatsApp", pt: "Desafiar pelo WhatsApp", en: "Challenge on WhatsApp", de: "Per WhatsApp herausfordern", fr: "Défier sur WhatsApp", zh: "用 WhatsApp 挑戰" },
  otras: { es: "Otras apps", pt: "Outros apps", en: "Other apps", de: "Andere Apps", fr: "Autres apps", zh: "其他應用" },
  copiar: { es: "Copiar enlace", pt: "Copiar link", en: "Copy link", de: "Link kopieren", fr: "Copier le lien", zh: "複製連結" },
  copiado: { es: "Enlace copiado", pt: "Link copiado", en: "Link copied", de: "Link kopiert", fr: "Lien copié", zh: "已複製連結" },
  embajador: {
    es: "El enlace lleva tu código: cada amigo que entra te suma como embajador.",
    pt: "O link leva seu código: cada amigo que entra conta para você como embaixador.",
    en: "The link carries your code: every friend who joins counts for you as an ambassador.",
    de: "Der Link enthält deinen Code: Jeder Freund, der mitmacht, zählt für dich als Botschafter.",
    fr: "Le lien contient ton code : chaque ami qui rejoint compte pour toi comme ambassadeur.",
    zh: "連結帶有你的代碼：每個加入的朋友都算你的大使成績。",
  },
};

const CSS = `
.rc-jai { animation: rc-bob 2.6s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes rc-bob { 0%,100% { transform: rotate(-2deg) } 50% { transform: translateY(-6px) rotate(2deg) } }
.rc-vs { animation: rc-vs 1.6s ease-in-out infinite; }
@keyframes rc-vs { 50% { transform: scale(1.15) rotate(-6deg) } }
.rc-pulse { position: relative; }
.rc-pulse::after { content: ""; position: absolute; inset: -4px; border-radius: 1.2rem; border: 2px solid rgba(255,255,255,.75); animation: rc-ring 2s ease-out infinite; pointer-events: none; }
@keyframes rc-ring { 0% { opacity: .9; transform: scale(.97) } 100% { opacity: 0; transform: scale(1.08) } }
.rc-q { animation: rc-q 2.4s ease-in-out infinite; }
@keyframes rc-q { 0%,100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
.rc-chispa { position: absolute; width: 6px; height: 6px; border-radius: 9999px; background: #F6C445; animation: rc-chispa 2.8s ease-in-out infinite; }
@keyframes rc-chispa { 0%,100% { opacity: 0; transform: scale(.4) } 50% { opacity: 1; transform: scale(1.2) } }
@media (prefers-reduced-motion: reduce) { .rc-jai, .rc-vs, .rc-q, .rc-chispa, .rc-pulse::after { animation: none !important; } }
`;

export function RetoCard({ guest }: { guest: boolean }) {
  const lang = useAppLang();
  const t = (k: keyof typeof T) => T[k][lang] ?? T[k].es;
  const [elegido, setElegido] = useState<Opcion["id"]>("todos");
  const op = OPCIONES.find((o) => o.id === elegido)!;
  const fetchInfo = useServerFn(getAmbassadorInfo);
  const { data } = useQuery({ queryKey: ["ambassador"], queryFn: () => fetchInfo(), enabled: !guest, retry: false, staleTime: 10 * 60 * 1000 });
  const codigo = !guest && data?.code && /^[A-F0-9]{8}$/i.test(data.code) ? data.code.toUpperCase() : null;
  const enlace = useMemo(() => `https://www.jaikuaa.com${op.ruta}?de=reto${codigo ? `&ref=${codigo}` : ""}`, [op.ruta, codigo]);
  const texto = `${op.mensaje[lang] ?? op.mensaje.es} ${enlace}`;
  const [nativo, setNativo] = useState(false);
  useEffect(() => setNativo(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  return (
    <section
      className="relative mt-5 overflow-hidden rounded-3xl p-4 text-white shadow-2xl ring-1 ring-white/15 sm:p-6"
      style={{ background: "radial-gradient(120% 90% at 0% 0%, #1FA855 0%, #0E7A3D 45%, #0A3D24 100%)" }}
    >
      <style>{CSS}</style>
      {/* Chispitas doradas */}
      {[[12, 18], [86, 14], [70, 58], [24, 78], [52, 10], [93, 70]].map(([x, y], i) => (
        <span key={i} className="rc-chispa" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.45}s` }} aria-hidden />
      ))}
      <div className="relative grid grid-cols-[auto_1fr] items-center gap-3 sm:gap-5">
        <img src={jaiEmbajador} alt="Jai invita con un megáfono" className="rc-jai h-28 w-auto object-contain drop-shadow-2xl sm:h-40" />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{t("titulo")}</h2>
          <p className="mt-1 text-sm text-white/85 sm:text-base">{t("bajada")}</p>
          {/* Vos contra ? */}
          <div className="mt-3 flex items-center gap-2" aria-hidden>
            <span className="grid h-11 min-w-11 place-items-center rounded-full bg-white px-3 font-display text-sm font-bold text-[#0A3D24]">{t("vos")}</span>
            <span className="rc-vs grid h-9 w-9 place-items-center rounded-full bg-[#F6C445] font-display text-sm font-black text-[#3A1A05] shadow-lg">VS</span>
            <span className="rc-q grid h-11 w-11 place-items-center rounded-full border-2 border-dashed border-white/80 font-display text-xl font-bold">?</span>
          </div>
        </div>
      </div>

      <p className="relative mt-4 text-xs font-semibold text-white/80">{t("aQue")}</p>
      <div className="relative mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-label={t("aQue")}>
        {OPCIONES.map((o) => {
          const on = o.id === elegido;
          const img = o.id === "todos" ? null : COVER_IMAGE[o.id];
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setElegido(o.id)}
              className="relative overflow-hidden rounded-2xl text-center transition active:scale-95"
              style={{ boxShadow: on ? "0 0 0 3px #F6C445" : "0 0 0 1px rgba(255,255,255,.25)", background: "rgba(0,0,0,.25)" }}
            >
              {img ? (
                <img src={img} alt="" className="aspect-[4/3] w-full object-cover" style={{ opacity: on ? 1 : 0.7 }} loading="lazy" />
              ) : (
                <span className="grid aspect-[4/3] w-full place-items-center" style={{ background: "radial-gradient(circle at 50% 40%, #2B4F8A, #0D1B33)", opacity: on ? 1 : 0.7 }}>
                  <img src={jaiGamer} alt="" className="h-[92%] w-auto object-contain" loading="lazy" />
                </span>
              )}
              <span className="block truncate px-1 py-1 text-[11px] font-bold sm:text-xs">{o.nombre[lang] ?? o.nombre.es}</span>
            </button>
          );
        })}
      </div>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rc-pulse relative mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 font-display text-lg font-bold text-[#0E7A3D] shadow-xl transition active:scale-[.98]"
      >
        <MessageCircle className="h-6 w-6" fill="#25D366" stroke="#0E7A3D" /> {t("whatsapp")} {op.emoji}
      </a>
      <div className="relative mt-2 grid grid-cols-2 gap-2">
        {nativo && (
          <button
            type="button"
            onClick={() => void navigator.share({ title: "Jaikuaa", text: op.mensaje[lang] ?? op.mensaje.es, url: enlace }).catch(() => {})}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-black/25 text-sm font-semibold ring-1 ring-white/25"
          >
            <Share2 className="h-4 w-4" /> {t("otras")}
          </button>
        )}
        <button
          type="button"
          onClick={() => { void navigator.clipboard?.writeText(enlace); toast.success(t("copiado")); }}
          className={`flex h-11 items-center justify-center gap-1.5 rounded-xl bg-black/25 text-sm font-semibold ring-1 ring-white/25 ${nativo ? "" : "col-span-2"}`}
        >
          <Copy className="h-4 w-4" /> {t("copiar")}
        </button>
      </div>
      {codigo && <p className="relative mt-3 text-center text-xs text-white/80">{t("embajador")}</p>}
    </section>
  );
}
