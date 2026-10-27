import { useAppLang, type AppLang } from "./i18n";

/**
 * Textos de interfaz de Trivia en 6 idiomas. Las preguntas, opciones y
 * explicaciones son contenido y siguen en castellano hasta su validación.
 * de/fr/zh son preliminares. Las palabras en guaraní se conservan tal cual.
 */
type L = Record<AppLang, string>;

const ERR: Record<AppLang, string[]> = {
  es: [
    "¡Casi! La respuesta era **{a}**.\n\nNo te preocupés, el guaraní ya está en vos. Solo hay que despertarlo. 🐆",
    "¡Uy, esa era difícil! Era **{a}**.\n\nNadie nace sabiendo. Cada guaraní que aprendés es una raíz que recuperás. 💙",
    "¡Casi la tenés! Era **{a}**.\n\nEl jaguaréte también tropieza, pero siempre se levanta. Seguí. 🐆",
    "El guaraní es como el mate: se aprende tomando. 🧉\n\nLa correcta era **{a}**. ¡Otra más!",
    "¡No pasa nada! Era **{a}**.\n\nEn Paraguay nadie te juzga por equivocarte. Acá se aprende junto. 💙",
    "Era **{a}**.\n\nCada error es una palabra que ya no se te olvida. Tu ñe'ẽ crece. ✨",
    "¡Casi! Era **{a}**.\n\nVos no estás aprendiendo un idioma. Estás recuperando lo que siempre fue tuyo. 🐆",
    "Era **{a}**.\n\nEl que nunca se equivoca, nunca aprende. Vos ya estás un paso adelante. 💪",
  ],
  pt: [
    "Quase! A resposta era **{a}**.\n\nNão se preocupe, cada tentativa te aproxima do guarani. 🐆",
    "Essa era difícil! Era **{a}**.\n\nNinguém nasce sabendo. Continue. 💙",
    "Quase lá! Era **{a}**.\n\nO jaguaretê também tropeça, mas sempre se levanta. 🐆",
    "Era **{a}**.\n\nCada erro é uma palavra que você não esquece mais. 💪",
  ],
  en: [
    "So close! The answer was **{a}**.\n\nDon't worry, every try brings you closer to Guarani. 🐆",
    "That was a tough one! It was **{a}**.\n\nNobody is born knowing. Keep going. 💙",
    "Almost! It was **{a}**.\n\nThe jaguar stumbles too, but always gets back up. 🐆",
    "It was **{a}**.\n\nEvery mistake is a word you won't forget. 💪",
  ],
  de: [
    "Fast! Die Antwort war **{a}**.\n\nKeine Sorge, jeder Versuch bringt dich dem Guaraní näher. 🐆",
    "Das war schwer! Es war **{a}**.\n\nNiemand wird als Meister geboren. Mach weiter. 💙",
    "Beinahe! Es war **{a}**.\n\nAuch der Jaguar stolpert, steht aber immer wieder auf. 🐆",
    "Es war **{a}**.\n\nJeder Fehler ist ein Wort, das du nicht mehr vergisst. 💪",
  ],
  fr: [
    "Presque ! La réponse était **{a}**.\n\nPas d'inquiétude, chaque essai vous rapproche du guarani. 🐆",
    "Celle-ci était difficile ! C'était **{a}**.\n\nPersonne ne naît savant. Continuez. 💙",
    "Presque ! C'était **{a}**.\n\nLe jaguar trébuche aussi, mais se relève toujours. 🐆",
    "C'était **{a}**.\n\nChaque erreur est un mot que vous n'oublierez plus. 💪",
  ],
  zh: [
    "差一點！答案是 **{a}**。\n\n別擔心，每次嘗試都讓你更接近瓜拉尼語。🐆",
    "這題很難！答案是 **{a}**。\n\n沒有人天生就會，繼續加油。💙",
    "快答對了！答案是 **{a}**。\n\n美洲豹也會跌倒，但總會站起來。🐆",
    "答案是 **{a}**。\n\n每個錯誤都是你不會再忘記的詞。💪",
  ],
};

const T = {
  ok: { es: "¡Muy bien! **{a}**.\n\n{e}", pt: "Muito bem! **{a}**.\n\n{e}", en: "Well done! **{a}**.\n\n{e}", de: "Sehr gut! **{a}**.\n\n{e}", fr: "Très bien ! **{a}**.\n\n{e}", zh: "答得好！**{a}**。\n\n{e}" },
  ok_vocabulario: { es: "¡Añete! **{a}**.\n\n{e} Ahora podés decírselo a tu abuela. Ella va a sonreír. 🐆", pt: "Isso! **{a}**.\n\n{e} 🐆", en: "Yes! **{a}**.\n\n{e} 🐆", de: "Ja! **{a}**.\n\n{e} 🐆", fr: "Oui ! **{a}**.\n\n{e} 🐆", zh: "答對了！**{a}**。\n\n{e} 🐆" },
  ok_mitos: { es: "¡Sí! **{a}**.\n\n{e} Tu historia vive. 🔥", pt: "Sim! **{a}**.\n\n{e} 🔥", en: "Yes! **{a}**.\n\n{e} 🔥", de: "Ja! **{a}**.\n\n{e} 🔥", fr: "Oui ! **{a}**.\n\n{e} 🔥", zh: "對！**{a}**。\n\n{e} 🔥" },
  ok_cultura: { es: "¡Exacto! **{a}**.\n\n{e} Vos la seguís viva. 💙", pt: "Exato! **{a}**.\n\n{e} 💙", en: "Exactly! **{a}**.\n\n{e} 💙", de: "Genau! **{a}**.\n\n{e} 💙", fr: "Exactement ! **{a}**.\n\n{e} 💙", zh: "完全正確！**{a}**。\n\n{e} 💙" },
  s2: { es: "¡Vas bien! 🔥", pt: "Vai bem! 🔥", en: "Going well! 🔥", de: "Läuft gut! 🔥", fr: "Ça avance bien ! 🔥", zh: "不錯喔！🔥" },
  s3: { es: "¡Racha x3! El jaguaréte está orgulloso. 🐆", pt: "Sequência x3! O jaguaretê está orgulhoso. 🐆", en: "Streak x3! The jaguar is proud. 🐆", de: "Serie x3! Der Jaguar ist stolz. 🐆", fr: "Série x3 ! Le jaguar est fier. 🐆", zh: "連對 3 題！美洲豹為你驕傲。🐆" },
  s4: { es: "¡Imparable! ¿Vos ya sabías guaraní en otra vida? ✨", pt: "Imparável! ✨", en: "Unstoppable! ✨", de: "Unaufhaltsam! ✨", fr: "Inarrêtable ! ✨", zh: "勢不可擋！✨" },
  s5: { es: "¡PERFECTO! El jaguaréte te nombra guerrero del Ñe'ẽ. 🐆⚔️", pt: "PERFEITO! O jaguaretê te nomeia guerreiro do Ñe'ẽ. 🐆", en: "PERFECT! The jaguar names you a Ñe'ẽ warrior. 🐆", de: "PERFEKT! Der Jaguar ernennt dich zum Ñe'ẽ-Krieger. 🐆", fr: "PARFAIT ! Le jaguar vous nomme guerrier du Ñe'ẽ. 🐆", zh: "完美！美洲豹封你為 Ñe'ẽ 戰士。🐆" },
  exit: { es: "Salir", pt: "Sair", en: "Exit", de: "Beenden", fr: "Quitter", zh: "離開" },
  question: { es: "Pregunta {a} de {b}", pt: "Pergunta {a} de {b}", en: "Question {a} of {b}", de: "Frage {a} von {b}", fr: "Question {a} sur {b}", zh: "第 {a} 題，共 {b} 題" },
  timeout: { es: "⏱️ Se acabó el tiempo, che.", pt: "⏱️ O tempo acabou.", en: "⏱️ Time's up.", de: "⏱️ Die Zeit ist um.", fr: "⏱️ Temps écoulé.", zh: "⏱️ 時間到了。" },
  broken: { es: "Se cortó la racha... 😔\n\nPero no importa, che. El guaraní no se aprende de una. Tu abuela tampoco la acertó todo el primer día.\n\n**Volvé mañana. El jaguaréte te espera.** 🐆", pt: "A sequência acabou... 😔\n\nTudo bem. Ninguém aprende guarani de uma vez.\n\n**Volte amanhã. O jaguaretê te espera.** 🐆", en: "Your streak ended... 😔\n\nThat's okay. Nobody learns Guarani all at once.\n\n**Come back tomorrow. The jaguar is waiting.** 🐆", de: "Die Serie ist gerissen... 😔\n\nMacht nichts. Niemand lernt Guaraní auf einmal.\n\n**Komm morgen wieder. Der Jaguar wartet.** 🐆", fr: "La série est terminée... 😔\n\nCe n'est pas grave. Personne n'apprend le guarani d'un coup.\n\n**Revenez demain. Le jaguar vous attend.** 🐆", zh: "連對中斷了… 😔\n\n沒關係，沒有人能一次學會瓜拉尼語。\n\n**明天再來，美洲豹等你。** 🐆" },
  result: { es: "Ver resultado", pt: "Ver resultado", en: "See result", de: "Ergebnis ansehen", fr: "Voir le résultat", zh: "查看結果" },
  next: { es: "¡Seguimos! →", pt: "Vamos lá! →", en: "Next! →", de: "Weiter! →", fr: "On continue ! →", zh: "繼續！→" },
  live: { es: "🔥 Racha actual: {a}", pt: "🔥 Sequência atual: {a}", en: "🔥 Current streak: {a}", de: "🔥 Aktuelle Serie: {a}", fr: "🔥 Série actuelle : {a}", zh: "🔥 目前連對：{a}" },
  keep: { es: "¡Seguí practicando!", pt: "Continue praticando!", en: "Keep practicing!", de: "Übe weiter!", fr: "Continuez à pratiquer !", zh: "繼續練習！" },
  of: { es: "{a} de {b}", pt: "{a} de {b}", en: "{a} of {b}", de: "{a} von {b}", fr: "{a} sur {b}", zh: "{a} / {b}" },
  perfect: { es: "¡PERFECTO! 🐆🐆🐆", pt: "PERFEITO! 🐆🐆🐆", en: "PERFECT! 🐆🐆🐆", de: "PERFEKT! 🐆🐆🐆", fr: "PARFAIT ! 🐆🐆🐆", zh: "完美！🐆🐆🐆" },
  warrior: { es: "El jaguaréte te nombra <b>Guerrero del Ñe'ẽ</b>.", pt: "O jaguaretê te nomeia <b>Guerreiro do Ñe'ẽ</b>.", en: "The jaguar names you <b>Ñe'ẽ Warrior</b>.", de: "Der Jaguar ernennt dich zum <b>Ñe'ẽ-Krieger</b>.", fr: "Le jaguar vous nomme <b>Guerrier du Ñe'ẽ</b>.", zh: "美洲豹封你為 <b>Ñe'ẽ 戰士</b>。" },
  stars: { es: "Tu nombre queda grabado en las estrellas de Tupã.", pt: "Seu nome fica gravado nas estrelas de Tupã.", en: "Your name is written in Tupã's stars.", de: "Dein Name steht in den Sternen von Tupã.", fr: "Votre nom est gravé dans les étoiles de Tupã.", zh: "你的名字刻在 Tupã 的星空中。" },
  xp: { es: "XP ganado", pt: "XP ganho", en: "XP earned", de: "Erhaltene XP", fr: "XP gagnés", zh: "獲得 XP" },
  best: { es: "Mejor racha", pt: "Melhor sequência", en: "Best streak", de: "Beste Serie", fr: "Meilleure série", zh: "最佳連對" },
  again: { es: "Jugar de nuevo", pt: "Jogar de novo", en: "Play again", de: "Nochmal spielen", fr: "Rejouer", zh: "再玩一次" },
  other: { es: "Elegir otra categoría", pt: "Escolher outra categoria", en: "Choose another category", de: "Andere Kategorie wählen", fr: "Choisir une autre catégorie", zh: "選擇其他類別" },
  content: { es: "", pt: "As perguntas estão em espanhol enquanto a tradução é validada.", en: "Questions are in Spanish while their translation is validated.", de: "Die Fragen sind auf Spanisch, bis die Übersetzung geprüft ist.", fr: "Les questions sont en espagnol pendant la validation de leur traduction.", zh: "題目在翻譯驗證完成前以西班牙語顯示。" },
} satisfies Record<string, L>;

export type TriviaKey = keyof typeof T;

function fill(s: string, v?: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
}

export function useTriviaTx() {
  const lang = useAppLang();
  const tt = (k: TriviaKey, v?: Record<string, string | number>) => fill(T[k][lang] || T[k].es, v);
  const err = (a: string, i: number) => { const list = ERR[lang]; return fill(list[i % list.length], { a }); };
  const ok = (cat: string, a: string, e: string) => {
    const k = (`ok_${cat}` in T ? `ok_${cat}` : "ok") as TriviaKey;
    return fill(T[k][lang], { a, e });
  };
  const streak = (n: number) => (n >= 5 ? tt("s5") : n === 4 ? tt("s4") : n === 3 ? tt("s3") : n === 2 ? tt("s2") : null);
  return { tt, err, ok, streak, lang };
}
