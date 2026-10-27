import { useAppLang, type AppLang } from "./i18n";

/**
 * Textos de interfaz de los juegos temáticos en 6 idiomas (de/fr/zh preliminares, en validación).
 * Solo la «cáscara»: nunca contiene guaraní, y los casos/historias siguen en castellano (Paso 2).
 */
type L = Record<AppLang, string>;
const T = {
  stars: { es: "{n} de 3 estrellas", pt: "{n} de 3 estrelas", en: "{n} of 3 stars", de: "{n} von 3 Sternen", fr: "{n} étoiles sur 3", zh: "{n} / 3 顆星" },
  // Chacra
  chTitle: { es: "Jai en la chacra", pt: "Jai na roça", en: "Jai on the farm", de: "Jai auf dem Hof", fr: "Jai à la ferme", zh: "Jai 在農場" },
  chLoading: { es: "Cargando la camioneta…", pt: "Carregando a caminhonete…", en: "Loading the truck…", de: "Der Pick-up wird beladen…", fr: "Chargement de la camionnette…", zh: "正在裝載貨車…" },
  chVisit: { es: "Visita {i} de {n}", pt: "Visita {i} de {n}", en: "Visit {i} of {n}", de: "Besuch {i} von {n}", fr: "Visite {i} sur {n}", zh: "第 {i} / {n} 次拜訪" },
  chJaiAlt: { es: "Jai con sombrero y una canasta de maíz y mandioca", pt: "Jai de chapéu com uma cesta de milho e mandioca", en: "Jai in a hat with a basket of corn and cassava", de: "Jai mit Hut und einem Korb Mais und Maniok", fr: "Jai avec un chapeau et un panier de maïs et de manioc", zh: "戴帽子、提著玉米和木薯籃的 Jai" },
  chDone: { es: "Terminó la recorrida", pt: "Fim da visita", en: "Round finished", de: "Rundgang beendet", fr: "Tournée terminée", zh: "巡訪結束" },
  chHelped: { es: "Ayudaste a {s} de {n} productores", pt: "Você ajudou {s} de {n} produtores", en: "You helped {s} of {n} farmers", de: "Du hast {s} von {n} Bauern geholfen", fr: "Vous avez aidé {s} producteurs sur {n}", zh: "你幫助了 {n} 位農民中的 {s} 位" },
  chAgain: { es: "Otra recorrida", pt: "Outra visita", en: "Another round", de: "Neuer Rundgang", fr: "Une autre tournée", zh: "再巡訪一次" },
  chRight: { es: "¡Bien! Entendiste al productor.", pt: "Muito bem! Você entendeu o produtor.", en: "Nice! You understood the farmer.", de: "Gut! Du hast den Bauern verstanden.", fr: "Bien ! Vous avez compris le producteur.", zh: "很好！你聽懂了農民的話。" },
  notThisTime: { es: "Esta vez no.", pt: "Desta vez não.", en: "Not this time.", de: "Diesmal nicht.", fr: "Pas cette fois.", zh: "這次沒答對。" },
  chTip: { es: "Consejo del técnico:", pt: "Dica do técnico:", en: "Technician's tip:", de: "Tipp vom Techniker:", fr: "Conseil du technicien :", zh: "技術員建議：" },
  chFinish: { es: "Terminar la recorrida", pt: "Terminar a visita", en: "Finish the round", de: "Rundgang beenden", fr: "Terminer la tournée", zh: "結束巡訪" },
  chNext: { es: "Ir al próximo productor", pt: "Ir ao próximo produtor", en: "Go to the next farmer", de: "Zum nächsten Bauern", fr: "Producteur suivant", zh: "前往下一位農民" },
  // Tekojoja
  tjLoading: { es: "Preparando el juzgado…", pt: "Preparando o juizado…", en: "Preparing the court…", de: "Das Gericht wird vorbereitet…", fr: "Préparation du tribunal…", zh: "正在準備法庭…" },
  tjHeader: { es: "Juzgado de Paz · Jaikuaa", pt: "Juizado de Paz · Jaikuaa", en: "Justice of the Peace · Jaikuaa", de: "Friedensgericht · Jaikuaa", fr: "Justice de paix · Jaikuaa", zh: "治安法庭 · Jaikuaa" },
  tjResolution: { es: "Resolución", pt: "Resolução", en: "Ruling", de: "Beschluss", fr: "Décision", zh: "裁決書" },
  tjResText: { es: "Visto el desempeño de la jornada, se resuelve que la persona a cargo del juzgado resolvió bien", pt: "Visto o desempenho do dia, resolve-se que a pessoa responsável pelo juizado resolveu bem", en: "Having reviewed the day's work, it is ruled that the person in charge of the court correctly resolved", de: "Nach Prüfung des Tages wird beschlossen, dass die zuständige Person richtig entschieden hat:", fr: "Vu le travail de la journée, il est décidé que la personne en charge du tribunal a bien résolu", zh: "經審視今日表現，裁定本庭負責人正確審理了" },
  tjCases: { es: "{s} de {n} casos", pt: "{s} de {n} casos", en: "{s} of {n} cases", de: "{s} von {n} Fällen", fr: "{s} affaires sur {n}", zh: "{n} 件中的 {s} 件案件" },
  tjJudge: { es: "Juez/a de paz", pt: "Juiz(a) de paz", en: "Justice of the peace", de: "Friedensrichter/in", fr: "Juge de paix", zh: "治安法官" },
  tjNew: { es: "Nuevos casos", pt: "Novos casos", en: "New cases", de: "Neue Fälle", fr: "Nouvelles affaires", zh: "新案件" },
  tjYouAre: { es: "Sos juez o jueza de paz", pt: "Você é juiz ou juíza de paz", en: "You are the justice of the peace", de: "Du bist Friedensrichter/in", fr: "Vous êtes juge de paix", zh: "你是治安法官" },
  tjRead: { es: "Leé el caso y elegí de qué se trata.", pt: "Leia o caso e escolha do que se trata.", en: "Read the case and choose what it's about.", de: "Lies den Fall und wähle, worum es geht.", fr: "Lisez l'affaire et choisissez de quoi il s'agit.", zh: "閱讀案件並選出它屬於哪一類。" },
  tjFile: { es: "Expediente N.º {n}/2026", pt: "Processo N.º {n}/2026", en: "Case file No. {n}/2026", de: "Akte Nr. {n}/2026", fr: "Dossier n° {n}/2026", zh: "案卷編號 {n}/2026" },
  tjCaseOf: { es: "Caso {i} de {n} · {s} bien", pt: "Caso {i} de {n} · {s} certos", en: "Case {i} of {n} · {s} right", de: "Fall {i} von {n} · {s} richtig", fr: "Affaire {i} sur {n} · {s} justes", zh: "第 {i} / {n} 案 · 答對 {s}" },
  tjOk: { es: "Bien resuelto", pt: "Bem resolvido", en: "Well ruled", de: "Gut entschieden", fr: "Bien jugé", zh: "判決正確" },
  tjReview: { es: "A revisar", pt: "A revisar", en: "To review", de: "Zu prüfen", fr: "À revoir", zh: "待複查" },
  tjTerm: { es: "Término en guaraní:", pt: "Termo em guarani:", en: "Guarani term:", de: "Begriff auf Guaraní:", fr: "Terme en guarani :", zh: "瓜拉尼語詞彙：" },
  tjBySpecialists: { es: "Escrito por docentes especialistas.", pt: "Escrito por professores especialistas.", en: "Written by specialist teachers.", de: "Von Fachlehrkräften verfasst.", fr: "Rédigé par des enseignants spécialistes.", zh: "由專業教師撰寫。" },
  tjPending: { es: "Término en guaraní: pendiente de carga y validación por especialistas en derecho.", pt: "Termo em guarani: pendente de cadastro e validação por especialistas em direito.", en: "Guarani term: pending upload and validation by legal specialists.", de: "Begriff auf Guaraní: wartet auf Eingabe und Prüfung durch Rechtsfachleute.", fr: "Terme en guarani : en attente de saisie et de validation par des spécialistes du droit.", zh: "瓜拉尼語詞彙：待法律專家輸入並審核。" },
  tjSeeRuling: { es: "Ver la resolución", pt: "Ver a resolução", en: "See the ruling", de: "Beschluss ansehen", fr: "Voir la décision", zh: "查看裁決書" },
  tjNext: { es: "Siguiente caso", pt: "Próximo caso", en: "Next case", de: "Nächster Fall", fr: "Affaire suivante", zh: "下一件案件" },
} satisfies Record<string, L>;

export type JUKey = keyof typeof T;
export function useJU() {
  const lang = useAppLang();
  return (k: JUKey, v?: Record<string, string | number>) =>
    T[k][lang].replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
}
