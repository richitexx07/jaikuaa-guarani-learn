/**
 * El anuncio de la Librería Jaikuaa en el panel.
 *
 * Una estantería de verdad, de noche y con encaje de ñandutí: cada lomo es un área de la Librería
 * (Salud, Derecho, Gramática, Literatura, Escolar), de los libros sale la onda dorada de la voz
 * («libros que hablan») y el Jai lector los presenta. Dos caminos claros: entrar a la Librería
 * o postular una obra.
 */
import { Link } from "@tanstack/react-router";
import { BookOpen, Feather, GraduationCap, Languages, PenLine, Scale, Stethoscope, type LucideIcon } from "lucide-react";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { LIB_COLORES as C, Nanduti } from "@/components/libreria/arte";
import jaiProfe from "@/assets/jai-profe.webp";

type L = Record<AppLang, string>;

const T: Record<"badge" | "dev" | "titulo" | "lema" | "cuerpo" | "entrar" | "postular", L> = {
  badge: { es: "Novedad", pt: "Novidade", en: "New", de: "Neu", fr: "Nouveau", zh: "新功能" },
  dev: { es: "En desarrollo", pt: "Em desenvolvimento", en: "In development", de: "In Entwicklung", fr: "En développement", zh: "開發中" },
  titulo: { es: "Librería Jaikuaa", pt: "Livraria Jaikuaa", en: "Jaikuaa Bookstore", de: "Jaikuaa-Buchhandlung", fr: "Librairie Jaikuaa", zh: "Jaikuaa 書店" },
  lema: { es: "Libros que hablan", pt: "Livros que falam", en: "Books that speak", de: "Bücher, die sprechen", fr: "Des livres qui parlent", zh: "會說話的書" },
  cuerpo: {
    es: "Leé en el celular y escuchá cada página con voz humana real: la del autor o la de un docente.",
    pt: "Leia no celular e ouça cada página com voz humana real: a do autor ou a de um professor.",
    en: "Read on your phone and hear every page in a real human voice: the author's or a teacher's.",
    de: "Lies am Handy und hör jede Seite mit echter menschlicher Stimme: der des Autors oder einer Lehrkraft.",
    fr: "Lisez sur votre téléphone et écoutez chaque page avec une vraie voix humaine : celle de l'auteur ou d'un enseignant.",
    zh: "在手機上閱讀，並以真人聲音聆聽每一頁：作者或老師的聲音。",
  },
  entrar: { es: "Entrar a la Librería", pt: "Entrar na Livraria", en: "Visit the Bookstore", de: "Zur Buchhandlung", fr: "Entrer dans la librairie", zh: "進入書店" },
  postular: { es: "Soy autor: postular mi obra", pt: "Sou autor: inscrever minha obra", en: "I'm an author: submit my work", de: "Ich bin Autor: Werk einreichen", fr: "Je suis auteur : proposer mon œuvre", zh: "我是作者：投稿作品" },
};

type Lomo = { icon: LucideIcon; nombre: L; bg: string; alto: number; giro?: number };

/** Los lomos: uno por área de la Librería, con su color y su altura. */
const LOMOS: Lomo[] = [
  { icon: Stethoscope, bg: "#1F6F6B", alto: 136, nombre: { es: "Salud", pt: "Saúde", en: "Health", de: "Gesundheit", fr: "Santé", zh: "醫學" } },
  { icon: Scale, bg: "#2B4F8A", alto: 146, nombre: { es: "Derecho", pt: "Direito", en: "Law", de: "Recht", fr: "Droit", zh: "法律" } },
  { icon: Languages, bg: "#8E1B2A", alto: 142, nombre: { es: "Gramática", pt: "Gramática", en: "Grammar", de: "Grammatik", fr: "Grammaire", zh: "語法" } },
  { icon: Feather, bg: "#B8741A", alto: 148, nombre: { es: "Literatura", pt: "Literatura", en: "Literature", de: "Literatur", fr: "Littérature", zh: "文學" } },
  { icon: GraduationCap, bg: "#3C4E8C", alto: 128, giro: 9, nombre: { es: "Escolar", pt: "Escolar", en: "School", de: "Schule", fr: "Scolaire", zh: "學校" } },
];

const CSS = `
.nl-lomo { transition: transform .35s cubic-bezier(.2,.9,.3,1.25); transform-origin: 0 100%; }
.nl-caja:hover .nl-lomo:nth-child(odd), .nl-caja:focus-within .nl-lomo:nth-child(odd) { transform: translateY(-8px) rotate(var(--giro, 0deg)); }
.nl-onda i { display: block; width: 4px; border-radius: 4px; background: linear-gradient(${C.dorado}, #E59A2B); animation: nl-onda 1.5s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes nl-onda { 0%,100% { transform: scaleY(.3); opacity: .7 } 50% { transform: scaleY(1); opacity: 1 } }
.nl-nota { animation: nl-nota 3.2s ease-in-out infinite; opacity: 0; }
@keyframes nl-nota { 0% { opacity: 0; transform: translate(0, 6px) scale(.8) } 25% { opacity: 1 } 100% { opacity: 0; transform: translate(10px, -26px) scale(1.05) } }
.nl-jai { animation: nl-flota 5s ease-in-out infinite; }
@keyframes nl-flota { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
.nl-brillo { animation: nl-brillo 6s ease-in-out infinite; }
@keyframes nl-brillo { 0%,70%,100% { transform: translateX(-120%) skewX(-12deg) } 85% { transform: translateX(320%) skewX(-12deg) } }
@media (prefers-reduced-motion: reduce) { .nl-onda i, .nl-nota, .nl-jai, .nl-brillo { animation: none !important; } .nl-nota { opacity: .8 } }
`;

/** Un lomo de libro: tapa con bandas doradas, ícono del área y el nombre de costado. */
function LomoLibro({ lomo, nombre }: { lomo: Lomo; nombre: string }) {
  const Icono = lomo.icon;
  return (
    <span
      className="nl-lomo relative flex w-[34px] shrink-0 flex-col items-center rounded-b-[2px] rounded-t-[5px] pb-2 pt-2 sm:w-[37px]"
      style={{
        height: lomo.alto,
        background: `linear-gradient(90deg, rgba(0,0,0,.28), rgba(255,255,255,.12) 22%, rgba(0,0,0,0) 45%, rgba(0,0,0,.22)), ${lomo.bg}`,
        boxShadow: "0 6px 14px rgba(0,0,0,.35)",
        transform: lomo.giro ? `rotate(${lomo.giro}deg)` : undefined,
        ["--giro" as string]: lomo.giro ? `${lomo.giro}deg` : "0deg",
      }}
    >
      <i className="block h-[3px] w-[70%] rounded-full" style={{ background: C.dorado }} />
      <i className="mt-[3px] block h-[1px] w-[70%] rounded-full" style={{ background: C.dorado, opacity: 0.7 }} />
      <Icono className="mt-2 h-4 w-4 shrink-0" style={{ color: C.dorado }} strokeWidth={2.2} />
      <span
        className="mt-1.5 min-h-0 flex-1 overflow-hidden whitespace-nowrap font-display text-[10px] font-bold uppercase tracking-[0.06em] text-white/90"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        {nombre}
      </span>
      <i className="mt-1.5 block h-[1px] w-[70%] rounded-full" style={{ background: C.dorado, opacity: 0.7 }} />
      <i className="mt-[3px] block h-[3px] w-[70%] rounded-full" style={{ background: C.dorado }} />
    </span>
  );
}

export function NovedadLibreria() {
  const lang = useAppLang();
  const t = (k: keyof typeof T) => T[k][lang] ?? T[k].es;
  return (
    <section
      aria-labelledby="novedad-libreria"
      className="nl-caja relative mt-5 overflow-hidden rounded-3xl text-white shadow-2xl ring-1 ring-white/10"
      style={{ background: `radial-gradient(110% 80% at 85% 20%, #2B5590 0%, ${C.azul} 38%, ${C.noche} 100%)` }}
    >
      <style>{CSS}</style>
      <Nanduti className="pointer-events-none absolute -right-20 -top-24 h-[300px] w-[300px] text-white/[.09] sm:h-[380px] sm:w-[380px]" />
      <Nanduti className="pointer-events-none absolute -bottom-32 -left-28 h-[260px] w-[260px] text-white/[.05]" />
      <span aria-hidden className="nl-brillo pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative grid gap-2 p-5 pb-0 sm:grid-cols-[1fr_1.15fr] sm:items-end sm:gap-6 sm:p-7 sm:pb-0">
        {/* Texto */}
        <div className="sm:pb-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] shadow" style={{ background: C.dorado, color: C.noche }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full motion-safe:animate-ping" style={{ background: C.rojo, opacity: 0.7 }} />
                <span className="relative h-2 w-2 rounded-full" style={{ background: C.rojo }} />
              </span>
              {t("badge")}
            </span>
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/90">{t("dev")}</span>
          </div>
          <h2 id="novedad-libreria" className="mt-3 font-display text-[1.7rem] font-bold leading-[1.05] sm:text-4xl">
            {t("titulo")}
            <span className="mt-1 block" style={{ color: C.dorado }}>{t("lema")}</span>
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">{t("cuerpo")}</p>
          <div className="mt-5 flex max-w-sm flex-col gap-2">
            <Link
              to="/libreria"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 font-display text-base font-bold shadow-lg transition hover:brightness-105 active:scale-[.98]"
              style={{ background: C.dorado, color: C.noche }}
            >
              <BookOpen className="h-5 w-5" aria-hidden /> {t("entrar")}
            </Link>
            <Link
              to="/libreria"
              hash="postular"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/35 px-4 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[.98]"
            >
              <PenLine className="h-4 w-4" aria-hidden /> {t("postular")}
            </Link>
          </div>
        </div>

        {/* La estantería: lomos por área, la voz que sale de los libros y el Jai lector */}
        <div className="relative h-[216px] sm:h-[230px]" aria-hidden>
          <div className="absolute bottom-[14px] left-1 flex items-end gap-[3px] sm:left-2">
            {LOMOS.map((l) => <LomoLibro key={l.nombre.es} lomo={l} nombre={l.nombre[lang] ?? l.nombre.es} />)}
          </div>
          {/* La voz: una onda dorada que sale de los libros, con notitas que suben */}
          <div className="nl-onda absolute left-[64px] top-1 flex h-10 items-end gap-[3px] sm:left-[80px]">
            {Array.from({ length: 11 }, (_, i) => <i key={i} style={{ height: `${16 + ((i * 37) % 26)}px`, animationDelay: `${(i % 6) * 0.13}s` }} />)}
          </div>
          {["♪", "♫", "♪"].map((n, i) => (
            <span key={i} className="nl-nota absolute font-bold" style={{ left: `${40 + i * 52}px`, top: `${18 + (i % 2) * 10}px`, color: C.dorado, animationDelay: `${i * 1.05}s` }}>{n}</span>
          ))}
          {/* El estante de madera */}
          <div className="absolute inset-x-0 bottom-0 h-[14px] rounded-t-[3px]" style={{ background: "linear-gradient(#9A6A3A, #6B4220 55%, #4A2C14)", boxShadow: "0 -1px 0 rgba(255,255,255,.18) inset, 0 6px 14px rgba(0,0,0,.35)" }} />
          <img
            src={jaiProfe}
            alt=""
            width={537}
            height={720}
            loading="lazy"
            decoding="async"
            className="nl-jai absolute bottom-[4px] right-[-4px] h-[160px] w-auto drop-shadow-2xl sm:h-[184px]"
          />
        </div>
      </div>

      {/* La franja de la bandera */}
      <div className="relative flex h-1.5" aria-hidden>
        <i className="block flex-1" style={{ background: C.rojo }} />
        <i className="block flex-1 bg-white" />
        <i className="block flex-1" style={{ background: "#2F62C9" }} />
      </div>
    </section>
  );
}
