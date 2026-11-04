import { useAppLang, type AppLang } from "./i18n";
import { withOverlay } from "./i18n-overlay";

/**
 * Textos de interfaz de los juegos en los 6 idiomas (de/fr/zh: traducción
 * preliminar, en validación). Nunca traduce ni cambia palabras en guaraní:
 * los nombres propios en guaraní (Purahéi, Tembi'u, Ta'anga, Tekojoja, Ñe'ẽ Rape) se mantienen.
 */
export type L = Record<AppLang, string>;

export const GT = {
  back: { es: "← Juegos", pt: "← Jogos", en: "← Games", de: "← Spiele", fr: "← Jeux", zh: "← 遊戲" },
  backBoard: { es: "← Tablero", pt: "← Painel", en: "← Dashboard", de: "← Übersicht", fr: "← Tableau de bord", zh: "← 主頁" },
  games: { es: "Juegos", pt: "Jogos", en: "Games", de: "Spiele", fr: "Jeux", zh: "遊戲" },
  countSuffix: {
    es: "juegos para aprender guaraní jugando, solo o de a dos.",
    pt: "jogos para aprender guarani brincando, sozinho ou em dupla.",
    en: "games to learn Guarani while playing, alone or in pairs.",
    de: "Spiele, um spielerisch Guaraní zu lernen, allein oder zu zweit.",
    fr: "jeux pour apprendre le guarani en jouant, seul ou à deux.",
    zh: "款遊戲，邊玩邊學瓜拉尼語，可單人或雙人遊玩。",
  },
  nuevo: { es: "Nuevo", pt: "Novo", en: "New", de: "Neu", fr: "Nouveau", zh: "新" },
  startShift: { es: "Empezar el turno", pt: "Começar o turno", en: "Start your shift", de: "Schicht beginnen", fr: "Commencer le service", zh: "開始值班" },
  howTo: { es: "¿Cómo se juega?", pt: "Como se joga?", en: "How to play?", de: "Wie spielt man?", fr: "Comment jouer ?", zh: "怎麼玩？" },
  letsPlay: { es: "¡A jugar!", pt: "Vamos jogar!", en: "Let's play!", de: "Los geht's!", fr: "On joue !", zh: "開始玩！" },
  words: { es: "Palabras:", pt: "Palavras:", en: "Words:", de: "Wörter:", fr: "Mots :", zh: "詞彙：" },
  allWords: { es: "Todas las palabras", pt: "Todas as palavras", en: "All words", de: "Alle Wörter", fr: "Tous les mots", zh: "全部詞彙" },
  lesson: { es: "Lección", pt: "Lição", en: "Lesson", de: "Lektion", fr: "Leçon", zh: "課程" },
  notEnough: {
    es: "No hay suficientes palabras publicadas para este juego (se necesitan {n}). Probá con «Todas las palabras».",
    pt: "Não há palavras publicadas suficientes para este jogo (são necessárias {n}). Tente «Todas as palavras».",
    en: "There aren't enough published words for this game ({n} needed). Try «All words».",
    de: "Für dieses Spiel gibt es nicht genug veröffentlichte Wörter ({n} nötig). Versuche «Alle Wörter».",
    fr: "Il n'y a pas assez de mots publiés pour ce jeu ({n} nécessaires). Essayez «Tous les mots».",
    zh: "此遊戲已發布的詞彙不足（需要 {n} 個）。請試試「全部詞彙」。",
  },
  fullscreen: { es: "Pantalla completa", pt: "Tela cheia", en: "Full screen", de: "Vollbild", fr: "Plein écran", zh: "全螢幕" },
  exitFullscreen: { es: "Salir de pantalla completa", pt: "Sair da tela cheia", en: "Exit full screen", de: "Vollbild beenden", fr: "Quitter le plein écran", zh: "退出全螢幕" },
  attempts: { es: "Intentos:", pt: "Tentativas:", en: "Attempts:", de: "Versuche:", fr: "Essais :", zh: "嘗試次數：" },
  playAgain: { es: "Jugar de nuevo", pt: "Jogar de novo", en: "Play again", de: "Nochmal spielen", fr: "Rejouer", zh: "再玩一次" },
  hiddenCard: { es: "Carta oculta", pt: "Carta oculta", en: "Hidden card", de: "Verdeckte Karte", fr: "Carte cachée", zh: "隱藏的卡片" },
  spanishTag: { es: "Español", pt: "Espanhol", en: "Spanish", de: "Spanisch", fr: "Espagnol", zh: "西班牙語" },
  pairsFound: { es: "Pares encontrados: {a} de {b}", pt: "Pares encontrados: {a} de {b}", en: "Pairs found: {a} of {b}", de: "Gefundene Paare: {a} von {b}", fr: "Paires trouvées : {a} sur {b}", zh: "已找到配對：{a} / {b}" },
  memoryDone: { es: "¡Tejiste los {p} pares en {a} intentos!", pt: "Você formou os {p} pares em {a} tentativas!", en: "You matched all {p} pairs in {a} attempts!", de: "Du hast alle {p} Paare in {a} Versuchen gefunden!", fr: "Tu as trouvé les {p} paires en {a} essais !", zh: "你用 {a} 次嘗試完成了 {p} 組配對！" },
  stars: { es: "{n} de 3 estrellas", pt: "{n} de 3 estrelas", en: "{n} of 3 stars", de: "{n} von 3 Sternen", fr: "{n} étoiles sur 3", zh: "3 顆星中的 {n} 顆" },
  hintEs: { es: "Pista en español", pt: "Dica em espanhol", en: "Hint in Spanish", de: "Hinweis auf Spanisch", fr: "Indice en espagnol", zh: "西班牙語提示" },
  chipasLeftLabel: { es: "Chipas restantes: {n}", pt: "Chipas restantes: {n}", en: "Chipas left: {n}", de: "Verbleibende Chipas: {n}", fr: "Chipas restantes : {n}", zh: "剩餘 Chipa：{n}" },
  oneChipa: { es: "¡Queda 1 chipa!", pt: "Resta 1 chipa!", en: "Only 1 chipa left!", de: "Nur noch 1 Chipa!", fr: "Plus qu'une chipa !", zh: "只剩 1 個 Chipa！" },
  nChipas: { es: "Quedan {n} chipas", pt: "Restam {n} chipas", en: "{n} chipas left", de: "Noch {n} Chipas", fr: "Il reste {n} chipas", zh: "還剩 {n} 個 Chipa" },
  wellDone: { es: "¡Muy bien!", pt: "Muito bem!", en: "Well done!", de: "Sehr gut!", fr: "Très bien !", zh: "太棒了！" },
  outOfChipas: { es: "Se acabaron las chipas", pt: "Acabaram as chipas", en: "You ran out of chipas", de: "Keine Chipas mehr", fr: "Plus de chipas", zh: "Chipa 用完了" },
  helpShort: { es: "Ayuda", pt: "Ajuda", en: "Help", de: "Hilfe", fr: "Aide", zh: "說明" },
  soundOn: { es: "Sonido", pt: "Som", en: "Sound", de: "Ton", fr: "Son", zh: "聲音" },
  soundOff: { es: "Sin sonido", pt: "Sem som", en: "Muted", de: "Stumm", fr: "Muet", zh: "靜音" },
  fullShort: { es: "Pantalla completa", pt: "Tela cheia", en: "Full screen", de: "Vollbild", fr: "Plein écran", zh: "全螢幕" },
  backHome: { es: "← Inicio", pt: "← Início", en: "← Home", de: "← Start", fr: "← Accueil", zh: "← 首頁" },
  quitGame: { es: "Terminar la partida y ver el resultado", pt: "Encerrar a partida e ver o resultado", en: "End the game and see the result", de: "Spiel beenden und Ergebnis sehen", fr: "Terminer la partie et voir le résultat", zh: "結束遊戲並查看結果" },
  quitShift: { es: "Terminar la guardia y ver el resultado", pt: "Encerrar o plantão e ver o resultado", en: "End the shift and see the result", de: "Schicht beenden und Ergebnis sehen", fr: "Terminer la garde et voir le résultat", zh: "結束值班並查看結果" },
  quitSong: { es: "Terminar la canción y ver el resultado", pt: "Encerrar a música e ver o resultado", en: "End the song and see the result", de: "Lied beenden und Ergebnis sehen", fr: "Terminer la chanson et voir le résultat", zh: "結束歌曲並查看結果" },
  quitSure: { es: "¿Seguro? Tocá otra vez para terminar", pt: "Tem certeza? Toque de novo para encerrar", en: "Sure? Tap again to end", de: "Sicher? Tippe noch einmal zum Beenden", fr: "Sûr ? Touchez encore pour terminer", zh: "確定嗎？再點一次結束" },
  giveUpPairs: { es: "Rendirme y ver las parejas", pt: "Desistir e ver os pares", en: "Give up and see the pairs", de: "Aufgeben und die Paare sehen", fr: "Abandonner et voir les paires", zh: "放棄並查看配對" },
  giveUpPairsSure: { es: "¿Seguro? Tocá otra vez para ver todas las parejas", pt: "Tem certeza? Toque de novo para ver todos os pares", en: "Sure? Tap again to see all the pairs", de: "Sicher? Tippe noch einmal, um alle Paare zu sehen", fr: "Sûr ? Touchez encore pour voir toutes les paires", zh: "確定嗎？再點一次查看全部配對" },
  gaveUpPairsTitle: { es: "¡Tranqui! Errar es parte de aprender.", pt: "Tudo bem! Errar faz parte de aprender.", en: "No worries! Mistakes are part of learning.", de: "Keine Sorge! Fehler gehören zum Lernen.", fr: "Pas de souci ! Se tromper fait partie de l'apprentissage.", zh: "別擔心！犯錯是學習的一部分。" },
  gaveUpPairsNote: { es: "Estas son todas las parejas. Repasalas y volvé a intentarlo (sin XP).", pt: "Estes são todos os pares. Revise e tente de novo (sem XP).", en: "Here are all the pairs. Review them and try again (no XP).", de: "Das sind alle Paare. Wiederhole sie und versuch es noch einmal (ohne XP).", fr: "Voici toutes les paires. Révisez-les et réessayez (sans XP).", zh: "這是全部配對。複習後再試一次（不計 XP）。" },
  listenShort2: { es: "Escuchar", pt: "Ouvir", en: "Listen", de: "Anhören", fr: "Écouter", zh: "聆聽" },
  giveUpRecipe: { es: "Rendirme y ver la receta", pt: "Desistir e ver a receita", en: "Give up and see the recipe", de: "Aufgeben und das Rezept sehen", fr: "Abandonner et voir la recette", zh: "放棄並查看食譜" },
  giveUpRecipeSure: { es: "¿Seguro? Tocá otra vez para ver la receta", pt: "Tem certeza? Toque de novo para ver a receita", en: "Sure? Tap again to see the recipe", de: "Sicher? Tippe noch einmal, um das Rezept zu sehen", fr: "Sûr ? Touchez encore pour voir la recette", zh: "確定嗎？再點一次查看食譜" },
  recipeShown: { es: "Esta es la receta: los ingredientes marcados en verde. Este plato no suma.", pt: "Esta é a receita: os ingredientes marcados em verde. Este prato não conta.", en: "This is the recipe: the ingredients marked in green. This dish doesn't count.", de: "Das ist das Rezept: die grün markierten Zutaten. Dieses Gericht zählt nicht.", fr: "Voici la recette : les ingrédients en vert. Ce plat ne compte pas.", zh: "這是食譜：綠色標記的食材。這道菜不計分。" },
  exitToGames: { es: "Listo · Volver a los juegos", pt: "Pronto · Voltar aos jogos", en: "Done · Back to games", de: "Fertig · Zurück zu den Spielen", fr: "Terminé · Retour aux jeux", zh: "完成 · 返回遊戲" },
  exitToPanel: { es: "Listo · Volver al panel", pt: "Pronto · Voltar ao painel", en: "Done · Back to dashboard", de: "Fertig · Zurück zur Übersicht", fr: "Terminé · Retour au tableau de bord", zh: "完成 · 返回主頁" },
  freePlay: { es: "Jugá sin cuenta", pt: "Jogue sem conta", en: "Play without an account", de: "Ohne Konto spielen", fr: "Jouez sans compte", zh: "免註冊遊玩" },
  needsAccount: { es: "Con tu cuenta gratis", pt: "Com sua conta grátis", en: "With your free account", de: "Mit deinem kostenlosen Konto", fr: "Avec votre compte gratuit", zh: "需要免費帳號" },
  giveUp: { es: "Rendirme y ver la palabra", pt: "Desistir e ver a palavra", en: "Give up and see the word", de: "Aufgeben und das Wort sehen", fr: "Abandonner et voir le mot", zh: "放棄並看答案" },
  confirmGiveUp: { es: "¿Seguro? Sí, mostrarla", pt: "Tem certeza? Sim, mostrar", en: "Sure? Yes, show it", de: "Sicher? Ja, zeigen", fr: "Sûr ? Oui, le montrer", zh: "確定嗎？是，顯示" },
  gaveUpTitle: { es: "Esta era la palabra", pt: "Esta era a palavra", en: "This was the word", de: "Das war das Wort", fr: "Voici le mot", zh: "答案是這個詞" },
  gaveUpNote: { es: "Tranquilo: equivocarse también es aprender. Escuchala, repasala y probá con otra.", pt: "Calma: errar também é aprender. Ouça, revise e tente outra.", en: "Relax: mistakes are part of learning. Listen, review and try another one.", de: "Keine Sorge: Fehler gehören zum Lernen. Hör es dir an, wiederhole es und versuch ein anderes.", fr: "Pas de souci : se tromper fait partie de l'apprentissage. Écoutez, révisez et essayez un autre mot.", zh: "別擔心：犯錯也是學習。聽一聽、複習一下，再試一個。" },
  anotherWord: { es: "Otra palabra", pt: "Outra palavra", en: "Another word", de: "Noch ein Wort", fr: "Un autre mot", zh: "換一個詞" },
  wotdOffline: { es: "Sin conexión: la Palabra del día de hoy no está descargada. Con señal, tocá «Descargar para usar sin internet» en tu panel.", pt: "Sem conexão: a Palavra do dia de hoje não foi baixada. Com sinal, toque em «Baixar para usar sem internet» no seu painel.", en: "Offline: today's Word of the Day isn't downloaded. When you have signal, tap «Download to use offline» on your dashboard.", de: "Offline: Das heutige Wort des Tages ist nicht heruntergeladen. Mit Empfang tippe in deiner Übersicht auf «Für die Offline-Nutzung herunterladen».", fr: "Hors ligne : le Mot du jour n'est pas téléchargé. Avec du réseau, touchez «Télécharger pour utiliser hors ligne» sur votre tableau de bord.", zh: "離線：今天的每日一詞尚未下載。有訊號時，請在主頁點選「下載以離線使用」。" },
  wotdNoAudio: { es: "Todavía no hay palabras con audio publicadas.", pt: "Ainda não há palavras com áudio publicadas.", en: "There are no published words with audio yet.", de: "Es gibt noch keine veröffentlichten Wörter mit Audio.", fr: "Il n'y a pas encore de mots publiés avec audio.", zh: "目前還沒有已發布的有聲詞彙。" },
  wotdListen: { es: "Escuchá la palabra de hoy y elegí qué significa", pt: "Ouça a palavra de hoje e escolha o que significa", en: "Listen to today's word and choose what it means", de: "Hör dir das heutige Wort an und wähle, was es bedeutet", fr: "Écoutez le mot du jour et choisissez sa signification", zh: "聽聽今天的詞，選出它的意思" },
  wotdSame: { es: "La misma palabra para todos hoy", pt: "A mesma palavra para todos hoje", en: "The same word for everyone today", de: "Heute dasselbe Wort für alle", fr: "Le même mot pour tout le monde aujourd'hui", zh: "今天大家都是同一個詞" },
  correct: { es: "¡Correcto!", pt: "Correto!", en: "Correct!", de: "Richtig!", fr: "Correct !", zh: "答對了！" },
  itWas: { es: "Era: {a}", pt: "Era: {a}", en: "It was: {a}", de: "Es war: {a}", fr: "C'était : {a}", zh: "答案是：{a}" },
  wotdSaved: { es: "Sin conexión: tu jugada quedó guardada y se envía cuando vuelva la señal.", pt: "Sem conexão: sua jogada foi salva e será enviada quando o sinal voltar.", en: "Offline: your answer was saved and will be sent when the signal returns.", de: "Offline: Deine Antwort wurde gespeichert und wird gesendet, sobald wieder Empfang da ist.", fr: "Hors ligne : votre réponse est enregistrée et sera envoyée au retour du réseau.", zh: "離線：你的作答已儲存，恢復訊號後會送出。" },
  wotdShare: { es: "¡Acerté la Palabra del día en guaraní de Jaikuaa! ¿Vos la sabés? 🇵🇾", pt: "Acertei a Palavra do dia em guarani da Jaikuaa! Você sabe? 🇵🇾", en: "I got Jaikuaa's Guarani Word of the Day right! Do you know it? 🇵🇾", de: "Ich habe das Guaraní-Wort des Tages von Jaikuaa erraten! Kennst du es? 🇵🇾", fr: "J'ai trouvé le Mot du jour en guarani de Jaikuaa ! Et vous ? 🇵🇾", zh: "我答對了 Jaikuaa 的瓜拉尼語每日一詞！你知道嗎？🇵🇾" },
  wotdTomorrow: { es: "Volvé mañana para una palabra nueva.", pt: "Volte amanhã para uma nova palavra.", en: "Come back tomorrow for a new word.", de: "Komm morgen für ein neues Wort wieder.", fr: "Revenez demain pour un nouveau mot.", zh: "明天再來看新的詞吧。" },
} satisfies Record<string, L>;

export type GKey = keyof typeof GT;

export function useGT() {
  const lang = useAppLang();
  return { lang, g: (k: GKey, vars?: Record<string, string | number>) => fill(GT[k][lang], vars) };
}

function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

/** Títulos de juego (clave = título en castellano usado por cada juego). */
export const GAME_TITLES: Record<string, L> = {
  "Juegos": GT.games,
  "Consultorio de Jai": { es: "Consultorio de Jai", pt: "Consultório do Jai", en: "Jai's Clinic", de: "Jais Arztpraxis", fr: "Le cabinet de Jai", zh: "Jai 的診所" },
  "Ventanilla de Jai": { es: "Ventanilla de Jai", pt: "Guichê do Jai", en: "Jai's Service Desk", de: "Jais Schalter", fr: "Le guichet de Jai", zh: "Jai 的服務窗口" },
  "Jai en la chacra": { es: "Jai en la chacra", pt: "Jai na roça", en: "Jai on the Farm", de: "Jai auf dem Hof", fr: "Jai à la ferme", zh: "Jai 在農場" },
  "Purahéi Karaoke": { es: "Purahéi Karaoke", pt: "Purahéi Karaokê", en: "Purahéi Karaoke", de: "Purahéi Karaoke", fr: "Purahéi Karaoké", zh: "Purahéi 卡拉OK" },
  "Tembi'u Paraguái": { es: "Tembi'u Paraguái", pt: "Tembi'u Paraguái", en: "Tembi'u Paraguái", de: "Tembi'u Paraguái", fr: "Tembi'u Paraguái", zh: "Tembi'u Paraguái" },
  "Ta'anga · Claqueta de Jai": { es: "Ta'anga · Claqueta de Jai", pt: "Ta'anga · Claquete do Jai", en: "Ta'anga · Jai's Clapperboard", de: "Ta'anga · Jais Filmklappe", fr: "Ta'anga · Le clap de Jai", zh: "Ta'anga · Jai 的場記板" },
  "Tekojoja · Juzgado de Paz": { es: "Tekojoja · Juzgado de Paz", pt: "Tekojoja · Juizado de Paz", en: "Tekojoja · Justice of the Peace", de: "Tekojoja · Friedensgericht", fr: "Tekojoja · Justice de paix", zh: "Tekojoja · 治安法庭" },
  "Ñe'ẽ Rape · A distancia": { es: "Ñe'ẽ Rape · A distancia", pt: "Ñe'ẽ Rape · À distância", en: "Ñe'ẽ Rape · Remote", de: "Ñe'ẽ Rape · Aus der Ferne", fr: "Ñe'ẽ Rape · À distance", zh: "Ñe'ẽ Rape · 遠距對戰" },
  "Penales": { es: "Penales", pt: "Pênaltis", en: "Penalties", de: "Elfmeter", fr: "Tirs au but", zh: "點球大戰" },
  "Duelo Cara a Cara": { es: "Duelo Cara a Cara", pt: "Duelo Cara a Cara", en: "Face-to-Face Duel", de: "Duell von Angesicht zu Angesicht", fr: "Duel face à face", zh: "面對面對決" },
  "Duelo de Trivia": { es: "Duelo de Trivia", pt: "Duelo de Perguntas", en: "Trivia Duel", de: "Quiz-Duell", fr: "Duel de quiz", zh: "問答對決" },
  "Ahorcado con chipas": { es: "Ahorcado con chipas", pt: "Forca com chipas", en: "Hangman with chipas", de: "Galgenraten mit Chipas", fr: "Pendu aux chipas", zh: "Chipa 猜字遊戲" },
  "Sopa de letras": { es: "Sopa de letras", pt: "Caça-palavras", en: "Word Search", de: "Buchstabensalat", fr: "Mots mêlés", zh: "找字遊戲" },
  "Memoria": { es: "Memoria", pt: "Memória", en: "Memory", de: "Memory", fr: "Mémoire", zh: "記憶配對" },
  "Palabra del día": { es: "Palabra del día", pt: "Palavra do dia", en: "Word of the Day", de: "Wort des Tages", fr: "Mot du jour", zh: "每日一詞" },
};

export function gameTitle(es: string, lang: AppLang) {
  return GAME_TITLES[es]?.[lang] ?? es;
}

/** Descripciones del catálogo (por id de juego). */
export const GAME_DESC: Record<string, L> = {
  consultorio: { es: "Guaraní médico: atendé pacientes que hablan guaraní. En español y portugués.", pt: "Guarani médico: atenda pacientes que falam guarani. Em espanhol e português.", en: "Medical Guarani: care for patients who speak Guarani.", de: "Medizinisches Guaraní: Behandle Patienten, die Guaraní sprechen.", fr: "Guarani médical : soignez des patients qui parlent guarani.", zh: "醫療瓜拉尼語：接待說瓜拉尼語的病人。" },
  ventanilla: { es: "Atención al público: atendé la fila en guaraní, como en un banco o una oficina.", pt: "Atendimento ao público: atenda a fila em guarani, como num banco ou escritório.", en: "Customer service: serve the queue in Guarani, like at a bank or office.", de: "Kundenservice: Bediene die Warteschlange auf Guaraní, wie in einer Bank oder einem Amt.", fr: "Accueil du public : servez la file en guarani, comme à la banque ou au bureau.", zh: "櫃台服務：用瓜拉尼語接待排隊的民眾，就像在銀行或辦公室。" },
  chacra: { es: "Sos técnico de campo: entendé lo que necesita cada productor.", pt: "Você é técnico de campo: entenda o que cada produtor precisa.", en: "You're a field technician: understand what each farmer needs.", de: "Du bist Agrartechniker: Verstehe, was jeder Landwirt braucht.", fr: "Vous êtes technicien agricole : comprenez ce dont chaque producteur a besoin.", zh: "你是農業技術員：了解每位農民的需求。" },
  karaoke: { es: "Cantá al ritmo del arpa y completá el verso a tiempo.", pt: "Cante no ritmo da harpa e complete o verso a tempo.", en: "Sing to the harp's rhythm and complete the verse in time.", de: "Singe im Rhythmus der Harfe und vervollständige den Vers rechtzeitig.", fr: "Chantez au rythme de la harpe et complétez le vers à temps.", zh: "跟著豎琴的節奏唱歌，及時完成歌詞。" },
  tembiu: { es: "Armá los platos típicos con sus ingredientes.", pt: "Monte os pratos típicos com seus ingredientes.", en: "Build traditional dishes with their ingredients.", de: "Stelle typische Gerichte mit ihren Zutaten zusammen.", fr: "Préparez les plats typiques avec leurs ingrédients.", zh: "用食材組合出傳統料理。" },
  taanga: { es: "Sé guionista: completá el diálogo de cada escena.", pt: "Seja roteirista: complete o diálogo de cada cena.", en: "Be a screenwriter: complete each scene's dialogue.", de: "Sei Drehbuchautor: Vervollständige den Dialog jeder Szene.", fr: "Devenez scénariste : complétez le dialogue de chaque scène.", zh: "當編劇：完成每一幕的對白。" },
  tekojoja: { es: "Resolvé casos y aprendé términos jurídicos.", pt: "Resolva casos e aprenda termos jurídicos.", en: "Solve cases and learn legal terms.", de: "Löse Fälle und lerne juristische Begriffe.", fr: "Résolvez des affaires et apprenez des termes juridiques.", zh: "解決案件，學習法律用語。" },
  "nee-rape": { es: "Desafiá por WhatsApp: cada uno desde su celular.", pt: "Desafie pelo WhatsApp: cada um no seu celular.", en: "Challenge via WhatsApp: each player on their own phone.", de: "Fordere per WhatsApp heraus: jeder auf seinem Handy.", fr: "Défiez par WhatsApp : chacun sur son téléphone.", zh: "透過 WhatsApp 挑戰：各自用自己的手機。" },
  penales: { es: "Respondé la palabra y pateá al arco. Solo o en duelo.", pt: "Responda a palavra e chute ao gol. Sozinho ou em duelo.", en: "Answer the word and shoot at goal. Solo or as a duel.", de: "Beantworte das Wort und schieß aufs Tor. Allein oder im Duell.", fr: "Répondez au mot et tirez au but. Seul ou en duel.", zh: "答對詞彙後射門。單人或對決模式。" },
  duelo: { es: "Dos jugadores, un celular: el más rápido gana.", pt: "Dois jogadores, um celular: o mais rápido ganha.", en: "Two players, one phone: the fastest wins.", de: "Zwei Spieler, ein Handy: Der Schnellste gewinnt.", fr: "Deux joueurs, un téléphone : le plus rapide gagne.", zh: "兩位玩家，一支手機：最快的人獲勝。" },
  "trivia-duelo": { es: "¿Quién sabe más del Paraguay?", pt: "Quem sabe mais sobre o Paraguai?", en: "Who knows more about Paraguay?", de: "Wer weiß mehr über Paraguay?", fr: "Qui en sait le plus sur le Paraguay ?", zh: "誰最了解巴拉圭？" },
  ahorcado: { es: "Adiviná la palabra antes de quedarte sin chipas.", pt: "Adivinhe a palavra antes de ficar sem chipas.", en: "Guess the word before you run out of chipas.", de: "Errate das Wort, bevor dir die Chipas ausgehen.", fr: "Devinez le mot avant d'être à court de chipas.", zh: "在 chipa 吃完之前猜出詞彙。" },
  "sopa-de-letras": { es: "Encontrá 6 palabras escondidas.", pt: "Encontre 6 palavras escondidas.", en: "Find 6 hidden words.", de: "Finde 6 versteckte Wörter.", fr: "Trouvez 6 mots cachés.", zh: "找出 6 個隱藏的詞彙。" },
  memoria: { es: "Uní cada palabra con su significado.", pt: "Ligue cada palavra ao seu significado.", en: "Match each word with its meaning.", de: "Verbinde jedes Wort mit seiner Bedeutung.", fr: "Associez chaque mot à son sens.", zh: "將每個詞彙與其意思配對。" },
  "palabra-del-dia": { es: "Escuchala y elegí su significado.", pt: "Ouça e escolha o significado.", en: "Listen and choose its meaning.", de: "Hör zu und wähle die Bedeutung.", fr: "Écoutez et choisissez son sens.", zh: "聆聽並選出它的意思。" },
};

export const SHELF_TEXT: Record<string, { title: L; bajada: L }> = {
  cultura: {
    title: { es: "Cultura paraguaya", pt: "Cultura paraguaia", en: "Paraguayan culture", de: "Paraguayische Kultur", fr: "Culture paraguayenne", zh: "巴拉圭文化" },
    bajada: { es: "Música, cocina, cine y fútbol", pt: "Música, culinária, cinema e futebol", en: "Music, food, film and football", de: "Musik, Küche, Film und Fußball", fr: "Musique, cuisine, cinéma et football", zh: "音樂、美食、電影與足球" },
  },
  trabajo: {
    title: { es: "Guaraní para el trabajo", pt: "Guarani para o trabalho", en: "Guarani for work", de: "Guaraní für den Beruf", fr: "Le guarani au travail", zh: "職場瓜拉尼語" },
    bajada: { es: "Salud, atención al público, campo y justicia", pt: "Saúde, atendimento, campo e justiça", en: "Health, customer service, farming and justice", de: "Gesundheit, Kundenservice, Landwirtschaft und Justiz", fr: "Santé, accueil, agriculture et justice", zh: "醫療、櫃台服務、農業與司法" },
  },
  dos: {
    title: { es: "De a dos", pt: "Em dupla", en: "For two", de: "Zu zweit", fr: "À deux", zh: "雙人遊戲" },
    bajada: { es: "En el mismo celular o cada uno en el suyo", pt: "No mesmo celular ou cada um no seu", en: "On the same phone or each on their own", de: "Auf demselben Handy oder jeder auf seinem", fr: "Sur le même téléphone ou chacun le sien", zh: "同一支手機，或各用各的" },
  },
  clasicos: {
    title: { es: "Clásicos rápidos", pt: "Clássicos rápidos", en: "Quick classics", de: "Schnelle Klassiker", fr: "Classiques rapides", zh: "經典快玩" },
    bajada: { es: "Cinco minutos por día", pt: "Cinco minutos por dia", en: "Five minutes a day", de: "Fünf Minuten pro Tag", fr: "Cinq minutes par jour", zh: "每天五分鐘" },
  },
};

type Help = { xp: L; steps: L[] };
const s = (es: string, pt: string, en: string, de: string, fr: string, zh: string): L => ({ es, pt, en, de, fr, zh });

/** Instrucciones de «¿Cómo se juega?» (clave = título en castellano). */
export const GAME_HELP: Record<string, Help> = {
  "Purahéi Karaoke": {
    xp: s("Hasta 20 XP según tus aciertos", "Até 20 XP conforme seus acertos", "Up to 20 XP based on your answers", "Bis zu 20 XP je nach Treffern", "Jusqu'à 20 XP selon vos bonnes réponses", "依答對數最多得 20 XP"),
    steps: [
      s("🎵 Elegí una canción y escuchá el arpa.", "🎵 Escolha uma canção e ouça a harpa.", "🎵 Pick a song and listen to the harp.", "🎵 Wähle ein Lied und hör der Harfe zu.", "🎵 Choisissez une chanson et écoutez la harpe.", "🎵 選一首歌，聆聽豎琴。"),
      s("🎤 Seguí la letra y completá el verso que falta a tiempo.", "🎤 Acompanhe a letra e complete o verso que falta a tempo.", "🎤 Follow the lyrics and fill in the missing line in time.", "🎤 Folge dem Text und ergänze rechtzeitig die fehlende Zeile.", "🎤 Suivez les paroles et complétez le vers manquant à temps.", "🎤 跟著歌詞，及時補上缺少的那一句。"),
      s("📼 Si querés, grabate cantando y escuchate.", "📼 Se quiser, grave-se cantando e ouça.", "📼 If you like, record yourself singing and listen back.", "📼 Wenn du willst, nimm dich beim Singen auf und hör es dir an.", "📼 Si vous voulez, enregistrez-vous en chantant et réécoutez-vous.", "📼 想的話，錄下自己唱歌再聽聽看。"),
    ],
  },
  "Ñe'ẽ Rape": {
    xp: s("3 XP por respuesta correcta · 5 XP más si ganás (máx. 20)", "3 XP por resposta certa · mais 5 XP se ganhar (máx. 20)", "3 XP per correct answer · 5 more XP if you win (max. 20)", "3 XP pro richtiger Antwort · 5 XP extra bei Sieg (max. 20)", "3 XP par bonne réponse · 5 XP de plus si vous gagnez (max. 20)", "每答對得 3 XP · 獲勝再加 5 XP（最多 20）"),
    steps: [
      s("📲 Creá una sala y mandá el código por WhatsApp a tu compañero.", "📲 Crie uma sala e mande o código pelo WhatsApp ao seu colega.", "📲 Create a room and send the code to your friend on WhatsApp.", "📲 Erstelle einen Raum und schick den Code per WhatsApp.", "📲 Créez une salle et envoyez le code par WhatsApp à votre ami.", "📲 建立房間，用 WhatsApp 把代碼傳給朋友。"),
      s("🧭 Elegí el sendero: ortografía, vocabulario, cultura o dichos.", "🧭 Escolha a trilha: ortografia, vocabulário, cultura ou ditados.", "🧭 Choose the path: spelling, vocabulary, culture or sayings.", "🧭 Wähle den Pfad: Rechtschreibung, Wortschatz, Kultur oder Sprichwörter.", "🧭 Choisissez le parcours : orthographe, vocabulaire, culture ou dictons.", "🧭 選擇路線：拼寫、詞彙、文化或俗語。"),
      s("⏱️ Los dos responden las mismas preguntas con el mismo reloj, cada uno en su celular.", "⏱️ Os dois respondem às mesmas perguntas com o mesmo relógio, cada um no seu celular.", "⏱️ You both answer the same questions on the same clock, each on your own phone.", "⏱️ Beide beantworten dieselben Fragen mit derselben Uhr, jeder am eigenen Handy.", "⏱️ Vous répondez tous les deux aux mêmes questions, même chrono, chacun sur son téléphone.", "⏱️ 兩人用各自的手機，在同樣的時間內回答同樣的問題。"),
    ],
  },
  "Ta'anga · Claqueta": {
    xp: s("4 XP por escena bien resuelta (máx. 20)", "4 XP por cena resolvida (máx. 20)", "4 XP per scene solved (max. 20)", "4 XP pro gelöster Szene (max. 20)", "4 XP par scène réussie (max. 20)", "每完成一場戲得 4 XP（最多 20）"),
    steps: [
      s("🎬 Jai dirige: leé qué pasa en la escena.", "🎬 Jai dirige: leia o que acontece na cena.", "🎬 Jai directs: read what happens in the scene.", "🎬 Jai führt Regie: Lies, was in der Szene passiert.", "🎬 Jai réalise : lisez ce qui se passe dans la scène.", "🎬 Jai 當導演：先看看這場戲發生了什麼。"),
      s("✍️ Completá el diálogo en guaraní que le falta a la escena.", "✍️ Complete o diálogo em guarani que falta na cena.", "✍️ Complete the scene's missing Guarani dialogue.", "✍️ Ergänze den fehlenden Guaraní-Dialog der Szene.", "✍️ Complétez le dialogue en guarani qui manque à la scène.", "✍️ 補上這場戲缺少的瓜拉尼語對白。"),
      s("⭐ Cada escena bien resuelta suma puntos.", "⭐ Cada cena bem resolvida soma pontos.", "⭐ Each scene you solve adds points.", "⭐ Jede gelöste Szene bringt Punkte.", "⭐ Chaque scène réussie rapporte des points.", "⭐ 每完成一場戲就加分。"),
    ],
  },
  "Tekojoja · Juzgado de Paz": {
    xp: s("4 XP por caso bien resuelto (máx. 20)", "4 XP por caso resolvido (máx. 20)", "4 XP per case solved (max. 20)", "4 XP pro gelöstem Fall (max. 20)", "4 XP par affaire résolue (max. 20)", "每解決一個案件得 4 XP（最多 20）"),
    steps: [
      s("⚖️ Leé el caso que llega al Juzgado de Paz.", "⚖️ Leia o caso que chega ao Juizado de Paz.", "⚖️ Read the case that reaches the Justice of the Peace.", "⚖️ Lies den Fall, der beim Friedensgericht ankommt.", "⚖️ Lisez l'affaire qui arrive au tribunal de paix.", "⚖️ 閱讀送到治安法庭的案件。"),
      s("📚 Elegí el término jurídico que corresponde.", "📚 Escolha o termo jurídico correto.", "📚 Choose the right legal term.", "📚 Wähle den passenden Rechtsbegriff.", "📚 Choisissez le bon terme juridique.", "📚 選出正確的法律用語。"),
      s("ℹ️ El contenido está en revisión por especialistas.", "ℹ️ O conteúdo está em revisão por especialistas.", "ℹ️ The content is being reviewed by specialists.", "ℹ️ Der Inhalt wird von Fachleuten geprüft.", "ℹ️ Le contenu est en cours de révision par des spécialistes.", "ℹ️ 內容正由專家審閱中。"),
    ],
  },
  "Tembi'u Paraguái": {
    xp: s("4 XP por plato bien armado (máx. 20)", "4 XP por prato montado (máx. 20)", "4 XP per dish made right (max. 20)", "4 XP pro richtigem Gericht (max. 20)", "4 XP par plat réussi (max. 20)", "每做對一道菜得 4 XP（最多 20）"),
    steps: [
      s("🍲 Mirá qué plato típico hay que preparar.", "🍲 Veja qual prato típico preparar.", "🍲 See which typical dish to cook.", "🍲 Schau, welches typische Gericht zu kochen ist.", "🍲 Regardez quel plat typique préparer.", "🍲 看看要做哪一道傳統料理。"),
      s("🧺 Tocá los ingredientes que lleva.", "🧺 Toque os ingredientes que ele leva.", "🧺 Tap the ingredients it needs.", "🧺 Tippe die Zutaten an, die hineingehören.", "🧺 Touchez les ingrédients qu'il contient.", "🧺 點選它需要的食材。"),
      s("✅ Si acertás, el plato queda listo y suma puntos.", "✅ Se acertar, o prato fica pronto e soma pontos.", "✅ Get it right and the dish is ready, adding points.", "✅ Wenn es stimmt, ist das Gericht fertig und bringt Punkte.", "✅ Si c'est juste, le plat est prêt et rapporte des points.", "✅ 答對了，料理完成並加分。"),
    ],
  },
  "Ahorcado con chipas": {
    xp: s("15 XP al ganar · 5 XP al terminar sin chipas", "15 XP ao ganhar · 5 XP ao terminar sem chipas", "15 XP for winning · 5 XP if you run out of chipas", "15 XP beim Sieg · 5 XP ohne Chipas am Ende", "15 XP en gagnant · 5 XP sans chipas à la fin", "獲勝得 15 XP · chipa 用完得 5 XP"),
    steps: [
      s("💡 Adiviná la palabra en guaraní con la pista en español.", "💡 Adivinhe a palavra em guarani com a dica em espanhol.", "💡 Guess the Guarani word using the Spanish clue.", "💡 Errate das Guaraní-Wort mit dem spanischen Hinweis.", "💡 Devinez le mot guarani grâce à l'indice en espagnol.", "💡 根據西班牙語提示猜出瓜拉尼語詞彙。"),
      s("👆 Tocá las letras: ch, mb y nd van en una sola tecla.", "👆 Toque as letras: ch, mb e nd ficam numa só tecla.", "👆 Tap the letters: ch, mb and nd are a single key.", "👆 Tippe die Buchstaben: ch, mb und nd sind je eine Taste.", "👆 Touchez les lettres : ch, mb et nd sont une seule touche.", "👆 點選字母：ch、mb 和 nd 各是一個按鍵。"),
      s("🥯 Cada error se come una chipa. Tenés 6.", "🥯 Cada erro come uma chipa. Você tem 6.", "🥯 Each mistake eats a chipa. You have 6.", "🥯 Jeder Fehler isst eine Chipa. Du hast 6.", "🥯 Chaque erreur mange une chipa. Vous en avez 6.", "🥯 每答錯一次就吃掉一個 chipa。你有 6 個。"),
      s("🏳️ ¿Trabado? Tocá «Rendirme y ver la palabra» para escucharla y aprenderla (sin XP).", "🏳️ Travou? Toque «Desistir e ver a palavra» para ouvi-la e aprender (sem XP).", "🏳️ Stuck? Tap «Give up and see the word» to hear it and learn it (no XP).", "🏳️ Festgefahren? Tippe «Aufgeben und das Wort sehen», um es zu hören und zu lernen (ohne XP).", "🏳️ Bloqué ? Touchez «Abandonner et voir le mot» pour l'écouter et l'apprendre (sans XP).", "🏳️ 卡住了？點「放棄並看答案」聽一聽、學起來（不加 XP）。"),
      s("💡 ¿No la ves? «Pista» marca dónde empieza una palabra.", "💡 Não acha? «Dica» marca onde começa uma palavra.", "💡 Can't find it? «Hint» marks where a word starts.", "💡 Nicht gefunden? «Tipp» markiert, wo ein Wort beginnt.", "💡 Introuvable ? «Indice» marque le début d'un mot.", "💡 找不到？「提示」會標出一個詞的開頭。"),
      s("⏸️ Botón de pausa: seguir, tablas de común acuerdo, rendirse o salir.", "⏸️ Botão de pausa: continuar, empate de comum acordo, desistir ou sair.", "⏸️ Pause button: keep playing, draw by agreement, resign or leave.", "⏸️ Pausetaste: weiterspielen, Remis, aufgeben oder verlassen.", "⏸️ Bouton pause : continuer, nul d'un commun accord, abandonner ou quitter.", "⏸️ 暫停鍵：繼續、雙方同意和局、認輸或離開。"),
      s("⏸️ Botón de pausa: seguir, tablas de común acuerdo, rendirse o salir.", "⏸️ Botão de pausa: continuar, empate de comum acordo, desistir ou sair.", "⏸️ Pause button: keep playing, draw by agreement, resign or leave.", "⏸️ Pausetaste: weiterspielen, Remis, aufgeben oder verlassen.", "⏸️ Bouton pause : continuer, nul d'un commun accord, abandonner ou quitter.", "⏸️ 暫停鍵：繼續、雙方同意和局、認輸或離開。"),
      s("⏸️ Botón de pausa: seguir, tablas de común acuerdo, rendirse o salir.", "⏸️ Botão de pausa: continuar, empate de comum acordo, desistir ou sair.", "⏸️ Pause button: keep playing, draw by agreement, resign or leave.", "⏸️ Pausetaste: weiterspielen, Remis, aufgeben oder verlassen.", "⏸️ Bouton pause : continuer, nul d'un commun accord, abandonner ou quitter.", "⏸️ 暫停鍵：繼續、雙方同意和局、認輸或離開。"),
    ],
  },
  "Sopa de letras": {
    xp: s("20 XP al encontrar las 6 palabras", "20 XP ao encontrar as 6 palavras", "20 XP for finding all 6 words", "20 XP für alle 6 Wörter", "20 XP en trouvant les 6 mots", "找到 6 個詞彙得 20 XP"),
    steps: [
      s("🔎 Buscá las palabras en guaraní a partir de las pistas en español.", "🔎 Procure as palavras em guarani a partir das dicas em espanhol.", "🔎 Find the Guarani words from the Spanish clues.", "🔎 Suche die Guaraní-Wörter anhand der spanischen Hinweise.", "🔎 Cherchez les mots guarani à partir des indices en espagnol.", "🔎 根據西班牙語提示找出瓜拉尼語詞彙。"),
      s("👆 Tocá la primera y la última letra de cada palabra.", "👆 Toque a primeira e a última letra de cada palavra.", "👆 Tap the first and last letter of each word.", "👆 Tippe den ersten und letzten Buchstaben jedes Wortes.", "👆 Touchez la première et la dernière lettre de chaque mot.", "👆 點選每個詞的第一個和最後一個字母。"),
      s("↔️ Las palabras están en horizontal o vertical.", "↔️ As palavras estão na horizontal ou vertical.", "↔️ Words run horizontally or vertically.", "↔️ Die Wörter stehen waagerecht oder senkrecht.", "↔️ Les mots sont à l'horizontale ou à la verticale.", "↔️ 詞彙為橫向或直向排列。"),
    ],
  },
  "Memoria": {
    xp: s("Entre 10 y 20 XP · menos intentos, más XP", "Entre 10 e 20 XP · menos tentativas, mais XP", "10 to 20 XP · fewer tries, more XP", "10 bis 20 XP · weniger Versuche, mehr XP", "Entre 10 et 20 XP · moins d'essais, plus d'XP", "10 至 20 XP · 嘗試越少，XP 越多"),
    steps: [
      s("🃏 Da vuelta dos tarjetas.", "🃏 Vire duas cartas.", "🃏 Flip two cards.", "🃏 Decke zwei Karten auf.", "🃏 Retournez deux cartes.", "🃏 翻開兩張卡片。"),
      s("🤝 Formá parejas de palabra en guaraní y su significado.", "🤝 Forme pares de palavra em guarani e seu significado.", "🤝 Match each Guarani word with its meaning.", "🤝 Bilde Paare aus Guaraní-Wort und Bedeutung.", "🤝 Associez le mot guarani et son sens.", "🤝 將瓜拉尼語詞彙與其意思配對。"),
      s("🔊 Escuchá el audio al abrir la tarjeta en guaraní.", "🔊 Ouça o áudio ao abrir a carta em guarani.", "🔊 Listen to the audio when you open the Guarani card.", "🔊 Hör das Audio beim Aufdecken der Guaraní-Karte.", "🔊 Écoutez l'audio en ouvrant la carte en guarani.", "🔊 翻開瓜拉尼語卡片時聆聽錄音。"),
      s("⭐ Completá los 6 pares con pocos intentos.", "⭐ Complete os 6 pares com poucas tentativas.", "⭐ Complete all 6 pairs in few tries.", "⭐ Finde alle 6 Paare mit wenigen Versuchen.", "⭐ Complétez les 6 paires en peu d'essais.", "⭐ 用最少的次數完成 6 對。"),
    ],
  },
  "Palabra del día": {
    xp: s("5 XP si acertás · una vez por día", "5 XP se acertar · uma vez por dia", "5 XP if correct · once a day", "5 XP bei richtiger Antwort · einmal pro Tag", "5 XP si c'est juste · une fois par jour", "答對得 5 XP · 每天一次"),
    steps: [
      s("🔊 Escuchá la palabra del día.", "🔊 Ouça a palavra do dia.", "🔊 Listen to the word of the day.", "🔊 Hör dir das Wort des Tages an.", "🔊 Écoutez le mot du jour.", "🔊 聆聽每日一詞。"),
      s("👆 Elegí su significado entre 4 opciones.", "👆 Escolha o significado entre 4 opções.", "👆 Choose its meaning from 4 options.", "👆 Wähle die Bedeutung aus 4 Optionen.", "👆 Choisissez son sens parmi 4 options.", "👆 從 4 個選項中選出意思。"),
      s("📅 Podés jugar una vez por día. Volvé mañana.", "📅 Você pode jogar uma vez por dia. Volte amanhã.", "📅 You can play once a day. Come back tomorrow.", "📅 Du kannst einmal pro Tag spielen. Komm morgen wieder.", "📅 Vous pouvez jouer une fois par jour. Revenez demain.", "📅 每天只能玩一次。明天再來。"),
    ],
  },
  "Penales": {
    xp: s("4 XP por gol · 6 XP al ángulo · máximo 20 XP por tanda para Jugador 1", "4 XP por gol · 6 XP no ângulo · máximo 20 XP por rodada para o Jogador 1", "4 XP per goal · 6 XP top corner · max 20 XP per round for Player 1", "4 XP pro Tor · 6 XP in den Winkel · max. 20 XP pro Runde für Spieler 1", "4 XP par but · 6 XP en lucarne · max 20 XP par série pour le Joueur 1", "每進一球 4 XP · 死角 6 XP · 玩家 1 每輪最多 20 XP"),
    steps: [
      s("💡 Respondé la palabra: si acertás, el arquero es más lento.", "💡 Responda a palavra: se acertar, o goleiro fica mais lento.", "💡 Answer the word: if you're right, the keeper is slower.", "💡 Beantworte das Wort: Bei richtiger Antwort ist der Torwart langsamer.", "💡 Répondez au mot : si c'est juste, le gardien est plus lent.", "💡 回答詞彙：答對的話守門員會變慢。"),
      s("🎯 Tocá el arco para apuntar.", "🎯 Toque o gol para mirar.", "🎯 Tap the goal to aim.", "🎯 Tippe aufs Tor, um zu zielen.", "🎯 Touchez le but pour viser.", "🎯 點選球門來瞄準。"),
      s("⚽ Tocá de nuevo cuando la barra de fuerza esté en verde.", "⚽ Toque de novo quando a barra de força estiver verde.", "⚽ Tap again when the power bar is green.", "⚽ Tippe erneut, wenn der Kraftbalken grün ist.", "⚽ Touchez à nouveau quand la barre de force est verte.", "⚽ 力量條變綠時再點一次。"),
      s("🤝 En Duelo, dos jugadores se turnan en el mismo celular.", "🤝 No Duelo, dois jogadores se revezam no mesmo celular.", "🤝 In Duel mode, two players take turns on the same phone.", "🤝 Im Duell wechseln sich zwei Spieler am selben Handy ab.", "🤝 En Duel, deux joueurs se relaient sur le même téléphone.", "🤝 對決模式中，兩位玩家輪流使用同一支手機。"),
    ],
  },
  "Duelo Cara a Cara": {
    xp: s("3 XP por punto + 5 XP al ganar · máximo 20 XP para Jugador 1", "3 XP por ponto + 5 XP ao ganhar · máximo 20 XP para o Jogador 1", "3 XP per point + 5 XP for winning · max 20 XP for Player 1", "3 XP pro Punkt + 5 XP beim Sieg · max. 20 XP für Spieler 1", "3 XP par point + 5 XP en gagnant · max 20 XP pour le Joueur 1", "每分 3 XP + 獲勝 5 XP · 玩家 1 最多 20 XP"),
    steps: [
      s("📱 Apoyen el celular en la mesa, uno de cada lado.", "📱 Apoiem o celular na mesa, um de cada lado.", "📱 Put the phone on the table, one player on each side.", "📱 Legt das Handy auf den Tisch, je einer auf jeder Seite.", "📱 Posez le téléphone sur la table, un de chaque côté.", "📱 把手機放在桌上，兩人各坐一邊。"),
      s("🔊 Suena una palabra en guaraní.", "🔊 Toca uma palavra em guarani.", "🔊 A Guarani word plays.", "🔊 Ein Guaraní-Wort ertönt.", "🔊 Un mot en guarani est prononcé.", "🔊 播放一個瓜拉尼語詞彙。"),
      s("👆 El primero que toca su traducción gana el punto.", "👆 O primeiro que tocar a tradução ganha o ponto.", "👆 The first to tap its translation wins the point.", "👆 Wer zuerst die Übersetzung tippt, bekommt den Punkt.", "👆 Le premier qui touche la traduction gagne le point.", "👆 最先點到正確翻譯的人得分。"),
      s("⛔ Si te equivocás, quedás bloqueado 1 segundo.", "⛔ Se errar, fica bloqueado 1 segundo.", "⛔ If you're wrong, you're locked for 1 second.", "⛔ Bei einem Fehler bist du 1 Sekunde gesperrt.", "⛔ En cas d'erreur, vous êtes bloqué 1 seconde.", "⛔ 答錯會被鎖定 1 秒。"),
      s("🏆 Gana quien llega a 5.", "🏆 Ganha quem chegar a 5.", "🏆 First to 5 wins.", "🏆 Wer zuerst 5 hat, gewinnt.", "🏆 Le premier à 5 gagne.", "🏆 先得 5 分者獲勝。"),
    ],
  },
  "Ventanilla de Jai": {
    xp: s("3 XP por persona bien atendida · máximo 20 XP", "3 XP por pessoa bem atendida · máximo 20 XP", "3 XP per person served well · max 20 XP", "3 XP pro gut bedienter Person · max. 20 XP", "3 XP par personne bien servie · max 20 XP", "每好好接待一位得 3 XP · 最多 20 XP"),
    steps: [
      s("🏛️ Sos quien atiende la ventanilla y la fila avanza.", "🏛️ Você atende o guichê e a fila avança.", "🏛️ You run the service desk while the queue moves.", "🏛️ Du bedienst den Schalter, und die Schlange rückt vor.", "🏛️ Vous tenez le guichet et la file avance.", "🏛️ 你負責服務窗口，隊伍持續前進。"),
      s("🔊 Si la persona te habla en guaraní, elegí qué te está diciendo.", "🔊 Se a pessoa falar em guarani, escolha o que ela está dizendo.", "🔊 If the person speaks Guarani, choose what they're saying.", "🔊 Spricht die Person Guaraní, wähle, was sie sagt.", "🔊 Si la personne parle guarani, choisissez ce qu'elle dit.", "🔊 如果對方說瓜拉尼語，選出他在說什麼。"),
      s("💬 Si vos le tenés que decir algo, elegí cómo se dice en guaraní.", "💬 Se você precisar dizer algo, escolha como se diz em guarani.", "💬 If you need to say something, choose how it's said in Guarani.", "💬 Musst du etwas sagen, wähle, wie man es auf Guaraní sagt.", "💬 Si vous devez dire quelque chose, choisissez comment le dire en guarani.", "💬 如果你要說話，選出瓜拉尼語的說法。"),
      s("⏳ No tardes: cada persona tiene su paciencia.", "⏳ Não demore: cada pessoa tem sua paciência.", "⏳ Don't take too long: everyone's patience is limited.", "⏳ Lass dir nicht zu viel Zeit: Jeder hat begrenzte Geduld.", "⏳ Ne traînez pas : chacun a sa patience.", "⏳ 別拖太久：每個人的耐心有限。"),
    ],
  },
  "Jai en la chacra": {
    xp: s("4 XP por productor ayudado · máximo 20 XP", "4 XP por produtor ajudado · máximo 20 XP", "4 XP per farmer helped · max 20 XP", "4 XP pro geholfenem Landwirt · max. 20 XP", "4 XP par producteur aidé · max 20 XP", "每幫助一位農民得 4 XP · 最多 20 XP"),
    steps: [
      s("🚙 Sos técnico de campo y visitás 5 productores.", "🚙 Você é técnico de campo e visita 5 produtores.", "🚙 You're a field technician visiting 5 farmers.", "🚙 Du bist Agrartechniker und besuchst 5 Landwirte.", "🚙 Vous êtes technicien agricole et visitez 5 producteurs.", "🚙 你是農業技術員，要拜訪 5 位農民。"),
      s("👂 Cada productor te cuenta su problema.", "👂 Cada produtor conta seu problema.", "👂 Each farmer tells you their problem.", "👂 Jeder Landwirt erzählt dir sein Problem.", "👂 Chaque producteur vous raconte son problème.", "👂 每位農民會告訴你他的問題。"),
      s("👆 Elegí la palabra en guaraní que necesitás para entenderlo.", "👆 Escolha a palavra em guarani que você precisa para entender.", "👆 Choose the Guarani word you need to understand it.", "👆 Wähle das Guaraní-Wort, das du zum Verstehen brauchst.", "👆 Choisissez le mot guarani dont vous avez besoin pour comprendre.", "👆 選出你理解問題所需的瓜拉尼語詞彙。"),
      s("🌱 Después leé el consejo del técnico.", "🌱 Depois leia o conselho do técnico.", "🌱 Then read the technician's advice.", "🌱 Lies danach den Rat des Technikers.", "🌱 Lisez ensuite le conseil du technicien.", "🌱 接著閱讀技術員的建議。"),
    ],
  },
  "Duelo de Trivia": {
    xp: s("3 XP por punto + 5 XP al ganar · máximo 20 XP para Jugador 1", "3 XP por ponto + 5 XP ao ganhar · máximo 20 XP para o Jogador 1", "3 XP per point + 5 XP for winning · max 20 XP for Player 1", "3 XP pro Punkt + 5 XP beim Sieg · max. 20 XP für Spieler 1", "3 XP par point + 5 XP en gagnant · max 20 XP pour le Joueur 1", "每分 3 XP + 獲勝 5 XP · 玩家 1 最多 20 XP"),
    steps: [
      s("📱 Apoyen el celular en la mesa, uno de cada lado.", "📱 Apoiem o celular na mesa, um de cada lado.", "📱 Put the phone on the table, one player on each side.", "📱 Legt das Handy auf den Tisch, je einer auf jeder Seite.", "📱 Posez le téléphone sur la table, un de chaque côté.", "📱 把手機放在桌上，兩人各坐一邊。"),
      s("❓ Aparece una pregunta sobre el Paraguay.", "❓ Aparece uma pergunta sobre o Paraguai.", "❓ A question about Paraguay appears.", "❓ Eine Frage über Paraguay erscheint.", "❓ Une question sur le Paraguay apparaît.", "❓ 出現一道關於巴拉圭的問題。"),
      s("👆 Cada uno tiene una sola chance: el primero que acierta gana el punto.", "👆 Cada um tem uma só chance: o primeiro que acertar ganha o ponto.", "👆 Each player gets one chance: the first correct answer wins the point.", "👆 Jeder hat nur eine Chance: Wer zuerst richtig liegt, bekommt den Punkt.", "👆 Chacun n'a qu'une chance : le premier qui trouve gagne le point.", "👆 每人只有一次機會：最先答對者得分。"),
      s("🤝 Si los dos fallan, nadie suma.", "🤝 Se os dois errarem, ninguém pontua.", "🤝 If both miss, nobody scores.", "🤝 Liegen beide falsch, punktet keiner.", "🤝 Si les deux se trompent, personne ne marque.", "🤝 兩人都答錯則都不得分。"),
      s("🏆 Gana quien llega a 5.", "🏆 Ganha quem chegar a 5.", "🏆 First to 5 wins.", "🏆 Wer zuerst 5 hat, gewinnt.", "🏆 Le premier à 5 gagne.", "🏆 先得 5 分者獲勝。"),
    ],
  },
};

// ja/ru/ko (preliminares, en validación).
withOverlay([GT, GAME_TITLES, GAME_DESC, SHELF_TEXT, GAME_HELP]);
