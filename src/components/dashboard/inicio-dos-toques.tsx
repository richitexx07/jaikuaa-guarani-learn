/**
 * Inicio a dos toques: un solo botón protagonista para seguir aprendiendo, los juegos con sus portadas
 * en una fila que se desliza y las novedades guardadas en la campana (no compiten con la lección).
 * Pedido de Alan y Richard (nov 2026): «todo tiene que ser en 2 o 3 toques».
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Award, BadgeCheck, Bell, BookA, BookOpen, Check, ChevronRight, Clapperboard, Gamepad2, GraduationCap, HandHeart,
  Keyboard, Languages, Library, MapPin, Medal, MessageCircleQuestion, MessagesSquare, Mic2, Music2, NotebookPen, Play,
  School, Scissors, Sparkles, Store, Tractor, Trophy, Users, type LucideIcon,
} from "lucide-react";
import { listCourseLessons } from "@/lib/lessons.functions";
import { getWordOfDay } from "@/lib/games.functions";
import { withOfflineCache } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import { pendingLessonRefs, useStats } from "@/lib/gamification";
import { hoyPy } from "@/lib/meta-diaria";
import { SpeakerButton } from "@/components/audio/speaker-button";
import jaiSaluda from "@/assets/jai/jai-saluda.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiTrofeo from "@/assets/jai/jai-trofeo.webp";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { useLastPlace } from "@/lib/last-place";
import { NandutiDisc } from "@/components/nanduti-disc";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import coverPenales from "@/assets/covers/cover-penales.webp";
import coverPalabra from "@/assets/covers/cover-palabra-del-dia.webp";
import coverMemoria from "@/assets/covers/cover-memoria.webp";
import coverKaraoke from "@/assets/covers/cover-karaoke.webp";
import coverTembiu from "@/assets/covers/cover-tembiu.webp";
import coverTrivia from "@/assets/covers/cover-trivia-duelo.webp";

type L = Record<AppLang, string>;
const T = {
  seguir: { es: "Seguí donde quedaste", pt: "Continue de onde parou", en: "Pick up where you left off", de: "Mach weiter, wo du aufgehört hast", fr: "Reprenez où vous en étiez", zh: "從上次的地方繼續" },
  empezar: { es: "Tu curso de guaraní", pt: "Seu curso de guarani", en: "Your Guarani course", de: "Dein Guarani-Kurs", fr: "Votre cours de guarani", zh: "你的瓜拉尼語課程" },
  cursoTitulo: { es: "Lecciones de guaraní", pt: "Lições de guarani", en: "Guarani lessons", de: "Guarani-Lektionen", fr: "Leçons de guarani", zh: "瓜拉尼語課程" },
  sub: { es: "Lecciones cortas, con voces reales", pt: "Lições curtas, com vozes reais", en: "Short lessons with real voices", de: "Kurze Lektionen mit echten Stimmen", fr: "Leçons courtes, avec de vraies voix", zh: "簡短課程，真人發音" },
  continuar: { es: "Continuar lección", pt: "Continuar lição", en: "Continue lesson", de: "Lektion fortsetzen", fr: "Continuer la leçon", zh: "繼續上課" },
  empezarBtn: { es: "Empezar a aprender", pt: "Começar a aprender", en: "Start learning", de: "Jetzt lernen", fr: "Commencer à apprendre", zh: "開始學習" },
  volverJuego: { es: "Volver a {t}", pt: "Voltar a {t}", en: "Back to {t}", de: "Zurück zu {t}", fr: "Retour à {t}", zh: "回到 {t}" },
  jugar: { es: "Jugá y repasá", pt: "Jogue e revise", en: "Play and review", de: "Spielen und wiederholen", fr: "Jouez et révisez", zh: "邊玩邊複習" },
  verTodos: { es: "Ver todos", pt: "Ver todos", en: "See all", de: "Alle ansehen", fr: "Tout voir", zh: "查看全部" },
  novedades: { es: "Novedades", pt: "Novidades", en: "What's new", de: "Neuigkeiten", fr: "Nouveautés", zh: "最新消息" },
  novedadesD: { es: "Lo nuevo de Jaikuaa, en un solo lugar.", pt: "O que há de novo no Jaikuaa, num só lugar.", en: "What's new in Jaikuaa, in one place.", de: "Neues von Jaikuaa an einem Ort.", fr: "Les nouveautés de Jaikuaa, au même endroit.", zh: "Jaikuaa 的最新消息都在這裡。" },
  penales: { es: "Penales", pt: "Pênaltis", en: "Penalties", de: "Elfmeter", fr: "Penalties", zh: "點球" },
  penalesD: { es: "Un toque y pateás", pt: "Um toque e você chuta", en: "One tap and you shoot", de: "Ein Tipp und du schießt", fr: "Un geste et vous tirez", zh: "點一下就射門" },
  palabra: { es: "Palabra del día", pt: "Palavra do dia", en: "Word of the day", de: "Wort des Tages", fr: "Mot du jour", zh: "每日一詞" },
  palabraD: { es: "Una nueva cada día", pt: "Uma nova a cada dia", en: "A new one every day", de: "Jeden Tag ein neues", fr: "Un nouveau chaque jour", zh: "每天一個新詞" },
  memoria: { es: "Memoria", pt: "Memória", en: "Memory", de: "Memory", fr: "Mémoire", zh: "記憶" },
  memoriaD: { es: "Pares de palabras", pt: "Pares de palavras", en: "Word pairs", de: "Wortpaare", fr: "Paires de mots", zh: "詞語配對" },
  karaoke: { es: "Karaoke", pt: "Karaokê", en: "Karaoke", de: "Karaoke", fr: "Karaoké", zh: "卡拉OK" },
  karaokeD: { es: "Cantá en guaraní", pt: "Cante em guarani", en: "Sing in Guarani", de: "Sing auf Guarani", fr: "Chantez en guarani", zh: "用瓜拉尼語唱歌" },
  tembiu: { es: "Tembi'u", pt: "Tembi'u", en: "Tembi'u", de: "Tembi'u", fr: "Tembi'u", zh: "Tembi'u" },
  tembiuD: { es: "Cocina paraguaya", pt: "Cozinha paraguaia", en: "Paraguayan cooking", de: "Paraguayische Küche", fr: "Cuisine paraguayenne", zh: "巴拉圭料理" },
  trivia: { es: "Trivia", pt: "Trivia", en: "Trivia", de: "Quiz", fr: "Quiz", zh: "問答" },
  tuNanduti: { es: "Tu ñandutí", pt: "Seu ñandutí", en: "Your ñandutí", de: "Dein Ñandutí", fr: "Votre ñandutí", zh: "你的 ñandutí 蕾絲" },
  tejido: { es: "{d} de {t} pétalos tejidos", pt: "{d} de {t} pétalas tecidas", en: "{d} of {t} petals woven", de: "{d} von {t} Blüten gewebt", fr: "{d} pétales tissés sur {t}", zh: "已織 {d}／{t} 片花瓣" },
  cadaLeccion: { es: "Cada lección que terminás teje un pétalo.", pt: "Cada lição que você termina tece uma pétala.", en: "Every lesson you finish weaves a petal.", de: "Jede abgeschlossene Lektion webt eine Blüte.", fr: "Chaque leçon terminée tisse un pétale.", zh: "每完成一課，就織上一片花瓣。" },
  completo: { es: "¡Tejiste tu ñandutí completo!", pt: "Você teceu seu ñandutí completo!", en: "You wove your whole ñandutí!", de: "Du hast dein ganzes Ñandutí gewebt!", fr: "Vous avez tissé tout votre ñandutí !", zh: "你織完了整個 ñandutí！" },
  leccionN: { es: "Lección {n}: {t}", pt: "Lição {n}: {t}", en: "Lesson {n}: {t}", de: "Lektion {n}: {t}", fr: "Leçon {n} : {t}", zh: "第 {n} 課：{t}" },
  palabraHoy: { es: "La palabra de hoy", pt: "A palavra de hoje", en: "Today's word", de: "Das Wort des Tages", fr: "Le mot du jour", zh: "今日一詞" },
  adivina: { es: "¿Sabés qué significa? Adiviná", pt: "Sabe o que significa? Adivinhe", en: "Know what it means? Guess", de: "Weißt du, was es heißt? Rate mal", fr: "Vous savez ce que ça veut dire ? Devinez", zh: "知道意思嗎？猜猜看" },
  significa: { es: "Significa «{a}»", pt: "Significa «{a}»", en: "It means “{a}”", de: "Es bedeutet „{a}“", fr: "Ça veut dire « {a} »", zh: "意思是「{a}」" },
  hechoHoy: { es: "Ya la jugaste hoy. Mañana hay otra.", pt: "Você já jogou hoje. Amanhã tem outra.", en: "You played it today. A new one tomorrow.", de: "Heute schon gespielt. Morgen gibt es ein neues.", fr: "Déjà joué aujourd'hui. Un nouveau demain.", zh: "今天已經玩過了，明天還有新的。" },
  jaiPrimera: { es: "Tu primera lección te espera.", pt: "Sua primeira lição te espera.", en: "Your first lesson is waiting.", de: "Deine erste Lektion wartet.", fr: "Votre première leçon vous attend.", zh: "你的第一課在等你。" },
  jaiHoy: { es: "¡Ya practicaste hoy! Jai te aplaude.", pt: "Você já praticou hoje! O Jai te aplaude.", en: "You already practiced today! Jai is cheering.", de: "Heute schon geübt! Jai applaudiert.", fr: "Vous avez déjà pratiqué aujourd'hui ! Jai applaudit.", zh: "今天已經練習了！Jai 為你鼓掌。" },
  jaiRacha: { es: "¡{n} días seguidos! Jai levanta la copa por vos.", pt: "{n} dias seguidos! O Jai ergue a taça por você.", en: "{n} days in a row! Jai raises the cup for you.", de: "{n} Tage am Stück! Jai hebt den Pokal für dich.", fr: "{n} jours d'affilée ! Jai lève la coupe pour vous.", zh: "連續 {n} 天！Jai 為你舉起獎盃。" },
  jaiVolver: { es: "¡Qué bueno verte! ¿Seguimos?", pt: "Que bom te ver! Vamos continuar?", en: "Great to see you! Shall we continue?", de: "Schön, dich zu sehen! Machen wir weiter?", fr: "Content de vous revoir ! On continue ?", zh: "很高興見到你！我們繼續吧？" },
  todo: { es: "Todo Jaikuaa", pt: "Todo o Jaikuaa", en: "All of Jaikuaa", de: "Ganz Jaikuaa", fr: "Tout Jaikuaa", zh: "Jaikuaa 全部功能" },
  todoD: { es: "Todo a la vista, en un toque.", pt: "Tudo à vista, num toque.", en: "Everything in sight, one tap away.", de: "Alles auf einen Blick, mit einem Tipp.", fr: "Tout en vue, en un geste.", zh: "一目了然，點一下就到。" },
  gAprender: { es: "Aprender", pt: "Aprender", en: "Learn", de: "Lernen", fr: "Apprendre", zh: "學習" },
  gJugar: { es: "Jugar", pt: "Jogar", en: "Play", de: "Spielen", fr: "Jouer", zh: "遊戲" },
  gCultura: { es: "Cultura paraguaya", pt: "Cultura paraguaia", en: "Paraguayan culture", de: "Paraguayische Kultur", fr: "Culture paraguayenne", zh: "巴拉圭文化" },
  gMas: { es: "Comunidad y trabajo", pt: "Comunidade e trabalho", en: "Community and work", de: "Gemeinschaft und Arbeit", fr: "Communauté et travail", zh: "社群與工作" },
  enRevision: { es: "en revisión docente", pt: "em revisão docente", en: "in teacher review", de: "in Prüfung durch Lehrkräfte", fr: "en révision par des enseignants", zh: "教師審閱中" },
  iCurso: { es: "Curso", pt: "Curso", en: "Course", de: "Kurs", fr: "Cours", zh: "課程" },
  iEscolar: { es: "Escolar", pt: "Escolar", en: "School", de: "Schule", fr: "Scolaire", zh: "學校" },
  iPronunciar: { es: "Pronunciar", pt: "Pronunciar", en: "Pronounce", de: "Aussprache", fr: "Prononcer", zh: "發音" },
  iGlosario: { es: "Glosario", pt: "Glossário", en: "Glossary", de: "Glossar", fr: "Glossaire", zh: "詞彙表" },
  iCuaderno: { es: "Cuaderno", pt: "Caderno", en: "Notebook", de: "Heft", fr: "Cahier", zh: "筆記本" },
  iClase: { es: "Mi clase", pt: "Minha turma", en: "My class", de: "Meine Klasse", fr: "Ma classe", zh: "我的班級" },
  iTeclado: { es: "Teclado", pt: "Teclado", en: "Keyboard", de: "Tastatur", fr: "Clavier", zh: "鍵盤" },
  iJuegos: { es: "Juegos", pt: "Jogos", en: "Games", de: "Spiele", fr: "Jeux", zh: "遊戲" },
  iRanking: { es: "Ranking", pt: "Ranking", en: "Ranking", de: "Rangliste", fr: "Classement", zh: "排行榜" },
  iLogros: { es: "Mis logros", pt: "Conquistas", en: "Achievements", de: "Erfolge", fr: "Succès", zh: "成就" },
  iLibreria: { es: "Librería", pt: "Livraria", en: "Bookstore", de: "Bücher", fr: "Librairie", zh: "書店" },
  iTurismo: { es: "Turismo", pt: "Turismo", en: "Tourism", de: "Tourismus", fr: "Tourisme", zh: "旅遊" },
  iCine: { es: "Cine", pt: "Cinema", en: "Cinema", de: "Kino", fr: "Cinéma", zh: "電影" },
  iEmbajadores: { es: "Invitar", pt: "Convidar", en: "Invite", de: "Einladen", fr: "Inviter", zh: "邀請" },
  iCertificado: { es: "Certificado", pt: "Certificado", en: "Certificate", de: "Zertifikat", fr: "Certificat", zh: "證書" },
  iMostrador: { es: "Atender", pt: "Atender", en: "Serve customers", de: "Kunden", fr: "Accueil", zh: "接待顧客" },
  iAgro: { es: "Agro", pt: "Agro", en: "Farming", de: "Landwirtschaft", fr: "Agro", zh: "農業" },
  iExpertos: { es: "Expertos", pt: "Especialistas", en: "Experts", de: "Fachleute", fr: "Experts", zh: "專家" },
  iTraductor: { es: "Traductor", pt: "Tradutor", en: "Translator", de: "Übersetzer", fr: "Traducteur", zh: "翻譯" },
  iTutor: { es: "Tutor", pt: "Tutor", en: "Tutor", de: "Tutor", fr: "Tuteur", zh: "導師" },
  triviaD: { es: "Preguntas y respuestas", pt: "Perguntas e respostas", en: "Questions and answers", de: "Fragen und Antworten", fr: "Questions et réponses", zh: "問與答" },
} satisfies Record<string, L>;

function useTD() {
  const lang = useAppLang();
  return (k: keyof typeof T, v?: Record<string, string>) =>
    (T[k][lang] ?? T[k].es).replace(/\{(\w+)\}/g, (_, x) => v?.[x] ?? "");
}

type LeccionCurso = { n: number; title: string; completed: boolean; publishedWords: number };

/** Las lecciones del curso de guaraní con lo que ya terminó la persona (misma caché que la página del curso). */
function useCursoGuarani() {
  const listFn = useServerFn(listCourseLessons);
  const q = useQuery({
    queryKey: ["course-lessons"],
    queryFn: () => withOfflineCache(K.lessons, () => listFn(), { label: "El curso" }),
    staleTime: 60_000,
  });
  const pend = pendingLessonRefs();
  const lessons: LeccionCurso[] = (q.data?.lessons ?? []).map((l) =>
    pend.has(`guarani:${l.n}`) ? { ...l, completed: true } : l,
  );
  const done = lessons.filter((l) => l.completed).length;
  const next = lessons.find((l, i) => !l.completed && l.publishedWords > 0 && (i === 0 || lessons[i - 1]!.completed));
  return { lessons, done, total: lessons.length, next };
}

/**
 * El ñandutí propio: un pétalo por lección del curso. Los terminados se tejen en los colores de la
 * bandera y el oro de la marca; el siguiente late suave para invitar a tejerlo.
 */
export function MiNanduti({ lessons, className = "" }: { lessons: LeccionCurso[]; className?: string }) {
  const total = Math.max(lessons.length, 1);
  const nextIdx = lessons.findIndex((l) => !l.completed);
  const tonos = ["#F6C445", "#FFFFFF", "#E8483C", "#7FA7E8"];
  // Con muchas lecciones los pétalos se afinan para no pisarse.
  const w = Math.min(11, ((Math.PI * 60) / total) * 0.95);
  const petalo = `M0,-30 C${w},-44 ${w},-66 0,-90 C${-w},-66 ${-w},-44 0,-30 Z`;
  let tejidos = 0;
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
      <style>{`.mn-late{animation:mn-late 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes mn-late{50%{opacity:.35}}.mn-gira{animation:mn-gira 160s linear infinite;transform-box:view-box;transform-origin:0 0}@keyframes mn-gira{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.mn-late,.mn-gira{animation:none}}`}</style>
      <g className="mn-gira">
        <g fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="0.7">
          {[22, 46, 70, 94].map((r) => <circle key={r} r={r} />)}
          {Array.from({ length: 32 }, (_, i) => (
            <line key={i} x1="0" y1="-22" x2="0" y2="-94" transform={`rotate(${(i * 360) / 32})`} />
          ))}
        </g>
        {lessons.map((l, i) => {
          const a = (i * 360) / total;
          const color = l.completed ? tonos[tejidos++ % tonos.length] : "none";
          const isNext = i === nextIdx;
          return (
            <path
              key={l.n}
              d={petalo}
              transform={`rotate(${a})`}
              fill={color}
              fillOpacity={l.completed ? 0.95 : 0}
              stroke={isNext ? "#F6C445" : "#FFFFFF"}
              strokeOpacity={l.completed ? 0 : isNext ? 1 : 0.55}
              strokeWidth={isNext ? 2.4 : 1}
              strokeDasharray={l.completed || isNext ? undefined : "3 3"}
              className={isNext ? "mn-late" : undefined}
            />
          );
        })}
      </g>
      <circle r="20" fill="#F6C445" />
      <circle r="13" fill="none" stroke="#13233A" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle r="5" fill="#13233A" fillOpacity="0.55" />
    </svg>
  );
}

/** El botón protagonista: seguir la última lección o la siguiente del curso, con el ñandutí propio que se va tejiendo. */
export function HeroLeccion() {
  const t = useTD();
  const place = useLastPlace();
  const curso = useCursoGuarani();
  const leccion = place?.kind === "lesson" ? place : null;
  const juego = place?.kind === "game" ? place : null;
  const sig = curso.next;
  const href = leccion?.href ?? (sig ? `/curso/guarani/leccion/${sig.n}` : "/curso/guarani");
  const titulo = leccion?.title ?? (sig ? t("leccionN", { n: String(sig.n), t: sig.title }) : t("cursoTitulo"));
  const empezo = !!leccion || curso.done > 0;
  const completo = curso.total > 0 && curso.done >= curso.total;
  return (
    <section aria-label={empezo ? t("seguir") : t("empezar")} className="mt-5">
      <a
        href={href}
        className="relative block overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-lift transition active:scale-[0.99] sm:p-7"
      >
        <NandutiDisc className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 text-primary-foreground opacity-[0.08]" />
        <span className="relative flex items-start gap-4">
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold uppercase tracking-wide text-[#F6C445]">
              {empezo ? t("seguir") : t("empezar")}
            </span>
            <span className="mt-1.5 block font-display text-2xl font-bold leading-tight sm:text-3xl">{titulo}</span>
            <span className="mt-1 block text-sm opacity-85">{t("sub")}</span>
          </span>
          {curso.total > 0 && (
            <MiNanduti lessons={curso.lessons} className="h-28 w-28 shrink-0 drop-shadow sm:h-36 sm:w-36" />
          )}
        </span>
        {curso.total > 0 && (
          <span className="relative mt-4 block rounded-2xl bg-white/10 px-3 py-2 text-sm">
            <span className="font-semibold text-[#F6C445]">{t("tuNanduti")}</span>{" "}
            <span className="opacity-90">
              {completo
                ? t("completo")
                : curso.done === 0
                  ? t("cadaLeccion")
                  : `${t("tejido", { d: String(curso.done), t: String(curso.total) })}. ${t("cadaLeccion")}`}
            </span>
          </span>
        )}
        <span className="relative mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#F6C445] font-display text-lg font-bold text-[#13233A] shadow">
          <Play className="h-5 w-5 fill-current" aria-hidden />
          {empezo ? t("continuar") : t("empezarBtn")}
        </span>
      </a>
      {juego && (
        <a
          href={juego.href}
          className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition active:scale-[0.99]"
        >
          <Gamepad2 className="h-4 w-4 text-primary" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{t("volverJuego", { t: juego.title })}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </a>
      )}
    </section>
  );
}

/** La palabra de hoy con su voz real: la escuchás acá y adivinás su significado en el juego (no se revela antes). */
export function PalabraDeHoy() {
  const t = useTD();
  const fn = useServerFn(getWordOfDay);
  const q = useQuery({ queryKey: ["word-of-day", "inicio"], queryFn: () => fn(), staleTime: 60_000 });
  const w = q.data?.word;
  if (!w) return null;
  const jugada = q.data?.played;
  return (
    <section aria-labelledby="inicio-palabra" className="mt-4 flex items-center gap-3 rounded-3xl border border-[#F6C445]/50 bg-[#FDF1D3] p-4 text-[#13233A] dark:bg-[#2A2410] dark:text-[#FDF1D3]">
      <SpeakerButton gn={w.gn} size="md" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <h2 id="inicio-palabra" className="text-xs font-bold uppercase tracking-wide opacity-70">{t("palabraHoy")}</h2>
        <p className="truncate font-display text-2xl font-bold leading-tight">{w.gn}</p>
        <p className="text-sm opacity-80">
          {jugada ? (jugada.answer ? t("significa", { a: jugada.answer }) : t("hechoHoy")) : t("adivina")}
        </p>
      </div>
      {jugada ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1F7A4D] text-white" aria-label={t("hechoHoy")}>
          <Check className="h-5 w-5" aria-hidden />
        </span>
      ) : (
        <a href="/juegos/palabra-del-dia" aria-label={t("adivina")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#13233A] text-[#F6C445] transition active:scale-95">
          <ChevronRight className="h-6 w-6" aria-hidden />
        </a>
      )}
    </section>
  );
}

/** Jai cambia según el momento: da la bienvenida, aplaude si ya practicaste hoy y levanta la copa con una buena racha. */
export function useJaiDelMomento(): { img: string; msg: string } {
  const t = useTD();
  const s = useStats();
  if (s.streak >= 7) return { img: jaiTrofeo, msg: t("jaiRacha", { n: String(s.streak) }) };
  if (s.lastActiveDate === hoyPy()) return { img: jaiAplaude, msg: t("jaiHoy") };
  if (s.guaraniLessonsCompleted === 0 && s.xp === 0) return { img: jaiBienvenida, msg: t("jaiPrimera") };
  return { img: jaiSaluda, msg: t("jaiVolver") };
}

const JUEGOS = [
  { href: "/juegos/penales", img: coverPenales, t: "penales", d: "penalesD" },
  { href: "/juegos/palabra-del-dia", img: coverPalabra, t: "palabra", d: "palabraD" },
  { href: "/juegos/memoria", img: coverMemoria, t: "memoria", d: "memoriaD" },
  { href: "/juegos/karaoke", img: coverKaraoke, t: "karaoke", d: "karaokeD" },
  { href: "/juegos/tembiu", img: coverTembiu, t: "tembiu", d: "tembiuD" },
  { href: "/trivia", img: coverTrivia, t: "trivia", d: "triviaD" },
] as const;

/** Los juegos con sus portadas, en una fila que se desliza con el dedo. */
export function JuegosCarrusel() {
  const t = useTD();
  return (
    <section aria-labelledby="inicio-juegos" className="mt-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="inicio-juegos" className="font-display text-xl font-bold text-foreground">{t("jugar")}</h2>
        <Link to="/juegos" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          {t("verTodos")}
        </Link>
      </div>
      <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {JUEGOS.map((j) => (
          <li key={j.href} className="w-40 shrink-0 snap-start sm:w-auto">
            <a
              href={j.href}
              className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition active:scale-[0.98]"
            >
              <img src={j.img} alt="" width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              <span className="block px-3 pb-3 pt-2">
                <span className="block font-display text-base font-bold leading-tight text-foreground">{t(j.t)}</span>
                <span className="block truncate text-xs text-muted-foreground">{t(j.d)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const VISTO = "jaikuaa:novedades-vistas";
const hoy = () => new Date().toISOString().slice(0, 10);

/** La campana del encabezado: las novedades y avisos se abren aparte, sin tapar la lección. */
export function NovedadesCampana({ children }: { children: ReactNode }) {
  const t = useTD();
  const [punto, setPunto] = useState(false);
  useEffect(() => {
    try { setPunto(localStorage.getItem(VISTO) !== hoy()); } catch { setPunto(false); }
  }, []);
  return (
    <Sheet
      onOpenChange={(o) => {
        if (!o) return;
        setPunto(false);
        try { localStorage.setItem(VISTO, hoy()); } catch { /* sin almacenamiento */ }
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("novedades")}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-background text-primary transition hover:border-primary/40"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {punto && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" aria-hidden />}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-2xl">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden /> {t("novedades")}
          </SheetTitle>
          <SheetDescription>{t("novedadesD")}</SheetDescription>
        </SheetHeader>
        <div className="pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

type Atajo = { href: string; icon: LucideIcon; t: keyof typeof T | null; nombre?: string; revision?: boolean };
type Grupo = { titulo: keyof typeof T; tono: string; items: Atajo[] };

function gruposTodo(ia: boolean): Grupo[] {
  return [
    {
      titulo: "gAprender",
      tono: "bg-primary text-primary-foreground",
      items: [
        { href: "/curso/guarani", icon: GraduationCap, t: "iCurso" },
        { href: "/guarani-escolar", icon: School, t: "iEscolar", revision: true },
        { href: "/pronunciar", icon: Mic2, t: "iPronunciar" },
        { href: "/glosario", icon: BookA, t: "iGlosario" },
        { href: "/cuaderno", icon: NotebookPen, t: "iCuaderno" },
        { href: "/aula", icon: Users, t: "iClase" },
        { href: "/teclado", icon: Keyboard, t: "iTeclado" },
        { href: "/nhe-mbytepe", icon: MessagesSquare, t: null, nombre: "Ñe'ẽ Mbytépe", revision: true },
        ...(ia
          ? [
              { href: "/traductor", icon: Languages, t: "iTraductor" as const },
              { href: "/tutor", icon: Sparkles, t: "iTutor" as const },
            ]
          : []),
      ],
    },
    {
      titulo: "gJugar",
      tono: "bg-[#F6C445] text-[#13233A]",
      items: [
        { href: "/juegos", icon: Gamepad2, t: "iJuegos" },
        { href: "/trivia", icon: MessageCircleQuestion, t: "trivia", revision: true },
        { href: "/ranking", icon: Trophy, t: "iRanking" },
        { href: "/logros", icon: Medal, t: "iLogros" },
      ],
    },
    {
      titulo: "gCultura",
      tono: "bg-[#D52B1E] text-white",
      items: [
        { href: "/libreria", icon: Library, t: "iLibreria" },
        { href: "/purahei", icon: Music2, t: null, nombre: "Purahéi" },
        { href: "/tembiapo", icon: Scissors, t: null, nombre: "Tembiapo" },
        { href: "/turismo", icon: MapPin, t: "iTurismo" },
        { href: "/cine", icon: Clapperboard, t: "iCine" },
      ],
    },
    {
      titulo: "gMas",
      tono: "bg-[#0038A8] text-white",
      items: [
        { href: "/embajadores", icon: HandHeart, t: "iEmbajadores" },
        { href: "/certificado", icon: Award, t: "iCertificado" },
        { href: "/mostrador", icon: Store, t: "iMostrador", revision: true },
        { href: "/agro", icon: Tractor, t: "iAgro" },
        { href: "/expertos", icon: BadgeCheck, t: "iExpertos" },
      ],
    },
  ];
}

/**
 * Todo Jaikuaa a la vista: cada sección es un ícono chico con su nombre, agrupado por color
 * (como la pantalla de un celular). Nada queda escondido detrás de pestañas y nada compite con la lección.
 */
export function TodoJaikuaa({ ia = false }: { ia?: boolean }) {
  const t = useTD();
  return (
    <section aria-labelledby="inicio-todo" className="mt-10">
      <h2 id="inicio-todo" className="font-display text-xl font-bold text-foreground">{t("todo")}</h2>
      <p className="text-sm text-muted-foreground">{t("todoD")}</p>
      <div className="mt-4 space-y-5">
        {gruposTodo(ia).map((g) => (
          <div key={g.titulo}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t(g.titulo)}</h3>
            <ul className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6 lg:grid-cols-8">
              {g.items.map((it) => {
                const Icon = it.icon;
                const nombre = it.t ? t(it.t) : it.nombre!;
                return (
                  <li key={it.href}>
                    <a href={it.href} className="group flex flex-col items-center gap-1.5 rounded-2xl p-1 text-center transition active:scale-95">
                      <span className={`relative grid h-14 w-14 place-items-center rounded-2xl shadow-sm transition group-hover:-translate-y-0.5 ${g.tono}`}>
                        <Icon className="h-6 w-6" aria-hidden />
                        {it.revision && (
                          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-background" title={t("enRevision")} />
                        )}
                      </span>
                      <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
                        {nombre}
                        {it.revision && <span className="sr-only"> ({t("enRevision")})</span>}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden /> {t("enRevision")}
      </p>
    </section>
  );
}
