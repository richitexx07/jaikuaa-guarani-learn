import { useAppLang, type AppLang } from "./i18n";
import { withOverlay, ROW_ORDER } from "./i18n-overlay";

/**
 * Interfaz de Guaraní Escolar (temas, Plan Semanal, Modo Rescate) en 6 idiomas.
 * Explicaciones, vocabulario y preguntas son contenido: siguen en castellano
 * hasta su validación. de/fr/zh preliminares. Nunca contiene guaraní nuevo.
 */
type L = readonly [string, string, string, string, string, string];
const ORDER = ROW_ORDER as readonly string[];

const T = {
  notFound: ["Tema no encontrado", "Tema não encontrado", "Topic not found", "Thema nicht gefunden", "Thème introuvable", "找不到主題"],
  backTopics: ["← Volver a los temas", "← Voltar aos temas", "← Back to topics", "← Zurück zu den Themen", "← Retour aux thèmes", "← 返回主題"],
  backAgro: ["← Volver a Jaikuaa Agro-Rural", "← Voltar ao Jaikuaa Agro-Rural", "← Back to Jaikuaa Agro-Rural", "← Zurück zu Jaikuaa Agro-Rural", "← Retour à Jaikuaa Agro-Rural", "← 返回 Jaikuaa 農村"],
  error: ["Ocurrió un error", "Ocorreu um erro", "Something went wrong", "Ein Fehler ist aufgetreten", "Une erreur est survenue", "發生錯誤"],
  retry: ["Reintentar", "Tentar de novo", "Try again", "Erneut versuchen", "Réessayer", "重試"],
  practice: ["Práctica por Tema", "Prática por Tema", "Practice by Topic", "Üben nach Thema", "Pratique par thème", "主題練習"],
  about: ["¿De qué se trata?", "Do que se trata?", "What is it about?", "Worum geht es?", "De quoi s'agit-il ?", "這是關於什麼？"],
  vocab: ["Vocabulario", "Vocabulário", "Vocabulary", "Wortschatz", "Vocabulaire", "詞彙"],
  tap: ["Tocá el 🔊 para escuchar cada palabra.", "Toque no 🔊 para ouvir cada palavra.", "Tap 🔊 to hear each word.", "Tippe auf 🔊, um jedes Wort zu hören.", "Touchez 🔊 pour écouter chaque mot.", "點 🔊 收聽每個詞。"],
  contentEs: ["", "Explicações, significados e perguntas estão em espanhol enquanto a tradução é validada.", "Explanations, meanings and questions are in Spanish while their translation is validated.", "Erklärungen, Bedeutungen und Fragen sind auf Spanisch, bis die Übersetzung geprüft ist.", "Explications, sens et questions sont en espagnol pendant la validation de leur traduction.", "說明、意思與題目在翻譯驗證完成前以西班牙語顯示。"],
  startQuiz: ["Empezar el quiz →", "Começar o quiz →", "Start the quiz →", "Quiz starten →", "Commencer le quiz →", "開始測驗 →"],
  q: ["Pregunta {a} de {b}", "Pergunta {a} de {b}", "Question {a} of {b}", "Frage {a} von {b}", "Question {a} sur {b}", "第 {a} 題，共 {b} 題"],
  hits: ["Aciertos: {a}", "Acertos: {a}", "Correct: {a}", "Richtig: {a}", "Bonnes réponses : {a}", "答對：{a}"],
  correct: ["¡Correcto!", "Correto!", "Correct!", "Richtig!", "Correct !", "答對了！"],
  cont: ["Continuar", "Continuar", "Continue", "Weiter", "Continuer", "繼續"],
  f1t: ["¡Perfecto!", "Perfeito!", "Perfect!", "Perfekt!", "Parfait !", "完美！"],
  f1m: ["Sos un crack del guaraní. ¡Iporãiterei!", "Você arrasou no guarani. Iporãiterei!", "You're a Guarani star. Iporãiterei!", "Du bist ein Guaraní-Profi. Iporãiterei!", "Vous êtes un as du guarani. Iporãiterei !", "你是瓜拉尼語高手。Iporãiterei！"],
  f2t: ["¡Muy bien!", "Muito bem!", "Very good!", "Sehr gut!", "Très bien !", "很好！"],
  f2m: ["Ya casi lo dominás. Seguí practicando.", "Você quase domina. Continue praticando.", "You've almost mastered it. Keep practicing.", "Du hast es fast drauf. Übe weiter.", "Vous y êtes presque. Continuez à pratiquer.", "你快掌握了，繼續練習。"],
  f3t: ["¡Buen trabajo!", "Bom trabalho!", "Good job!", "Gute Arbeit!", "Beau travail !", "做得好！"],
  f3m: ["Vas bien encaminado. Repasá las que fallaste.", "Você está no caminho certo. Revise as que errou.", "You're on track. Review the ones you missed.", "Du bist auf gutem Weg. Wiederhole die falschen.", "Vous êtes sur la bonne voie. Revoyez vos erreurs.", "方向正確，複習答錯的題目吧。"],
  f4t: ["¡A seguir!", "Vamos em frente!", "Keep going!", "Weiter so!", "On continue !", "繼續努力！"],
  f4m: ["Con un poco más de práctica vas a mejorar.", "Com um pouco mais de prática você vai melhorar.", "With a bit more practice you'll improve.", "Mit etwas mehr Übung wirst du besser.", "Avec un peu plus de pratique, vous progresserez.", "再多練習一點就會進步。"],
  f5t: ["¡No te rindas!", "Não desista!", "Don't give up!", "Gib nicht auf!", "N'abandonnez pas !", "別放棄！"],
  f5m: ["Volvé a leer el tema y probá de nuevo. ¡Vos podés!", "Leia o tema de novo e tente outra vez. Você consegue!", "Read the topic again and try once more. You can do it!", "Lies das Thema nochmal und versuch es erneut. Du schaffst das!", "Relisez le thème et réessayez. Vous pouvez y arriver !", "再讀一次主題後重試，你做得到！"],
  scored: ["Sacaste {a}/{b}", "Você tirou {a}/{b}", "You scored {a}/{b}", "Du hast {a}/{b}", "Vous avez obtenu {a}/{b}", "你得到 {a}/{b}"],
  retryQuiz: ["Reintentar quiz", "Refazer quiz", "Retry quiz", "Quiz wiederholen", "Refaire le quiz", "重做測驗"],
  moreAgro: ["Más temas del Agro →", "Mais temas do Agro →", "More Agro topics →", "Mehr Agro-Themen →", "Plus de thèmes Agro →", "更多農業主題 →"],
  otherTopic: ["Otro tema →", "Outro tema →", "Another topic →", "Anderes Thema →", "Autre thème →", "其他主題 →"],
  // Plan semanal
  d0: ["Lunes", "Segunda", "Monday", "Montag", "Lundi", "星期一"],
  d1: ["Martes", "Terça", "Tuesday", "Dienstag", "Mardi", "星期二"],
  d2: ["Miércoles", "Quarta", "Wednesday", "Mittwoch", "Mercredi", "星期三"],
  d3: ["Jueves", "Quinta", "Thursday", "Donnerstag", "Jeudi", "星期四"],
  d4: ["Viernes", "Sexta", "Friday", "Freitag", "Vendredi", "星期五"],
  s0: ["Lun", "Seg", "Mon", "Mo", "Lun", "一"],
  s1: ["Mar", "Ter", "Tue", "Di", "Mar", "二"],
  s2: ["Mié", "Qua", "Wed", "Mi", "Mer", "三"],
  s3: ["Jue", "Qui", "Thu", "Do", "Jeu", "四"],
  s4: ["Vie", "Sex", "Fri", "Fr", "Ven", "五"],
  fb0: ["¡Arrancá hoy! Un día por vez 💪", "Comece hoje! Um dia de cada vez 💪", "Start today! One day at a time 💪", "Fang heute an! Ein Tag nach dem anderen 💪", "Commencez aujourd'hui ! Un jour à la fois 💪", "今天就開始！一次一天 💪"],
  fb1: ["¡Buen comienzo! Seguí así ✨", "Bom começo! Continue assim ✨", "Good start! Keep it up ✨", "Guter Start! Weiter so ✨", "Bon début ! Continuez ✨", "好的開始！保持下去 ✨"],
  fb2: ["¡Vas muy bien! Ya casi terminás la semana 🔥", "Indo muito bem! Quase terminando a semana 🔥", "Doing great! Almost done with the week 🔥", "Läuft super! Die Woche ist fast geschafft 🔥", "Très bien ! La semaine est presque finie 🔥", "很棒！這週快完成了 🔥"],
  fb3: ["¡Completaste toda la semana! Sos un crack 🎉", "Você completou a semana inteira! 🎉", "You completed the whole week! 🎉", "Du hast die ganze Woche geschafft! 🎉", "Vous avez terminé toute la semaine ! 🎉", "你完成了整週！🎉"],
  plan: ["Plan Semanal", "Plano Semanal", "Weekly Plan", "Wochenplan", "Plan hebdomadaire", "每週計畫"],
  organize: ["Organizá tu semana de Guaraní", "Organize sua semana de guarani", "Organize your Guarani week", "Plane deine Guaraní-Woche", "Organisez votre semaine de guarani", "安排你的瓜拉尼語學習週"],
  oneADay: ["Un tema por día, de lunes a viernes. Vos elegís a qué hora estudiar.", "Um tema por dia, de segunda a sexta. Você escolhe o horário.", "One topic a day, Monday to Friday. You choose when to study.", "Ein Thema pro Tag, Montag bis Freitag. Du wählst die Uhrzeit.", "Un thème par jour, du lundi au vendredi. Vous choisissez l'heure.", "週一到週五每天一個主題，時間由你決定。"],
  whichGrade: ["¿De qué grado sos?", "Qual é a sua série?", "What grade are you in?", "In welcher Klasse bist du?", "En quelle année êtes-vous ?", "你讀幾年級？"],
  seePlan: ["Ver mi plan de la semana →", "Ver meu plano da semana →", "See my weekly plan →", "Meinen Wochenplan ansehen →", "Voir mon plan de la semaine →", "查看我的每週計畫 →"],
  backEscolar: ["← Volver a Guaraní Escolar", "← Voltar ao Guarani Escolar", "← Back to School Guarani", "← Zurück zu Schul-Guaraní", "← Retour au guarani scolaire", "← 返回學校瓜拉尼語"],
  yourWeek: ["Tu semana de Guaraní", "Sua semana de guarani", "Your Guarani week", "Deine Guaraní-Woche", "Votre semaine de guarani", "你的瓜拉尼語週"],
  changeGrade: ["Cambiar grado", "Mudar série", "Change grade", "Klasse ändern", "Changer d'année", "更改年級"],
  doneDays: ["Completaste {a} de {b} días", "Você completou {a} de {b} dias", "You completed {a} of {b} days", "Du hast {a} von {b} Tagen geschafft", "Vous avez terminé {a} jours sur {b}", "你已完成 {b} 天中的 {a} 天"],
  review: ["Repaso", "Revisão", "Review", "Wiederholung", "Révision", "複習"],
  doTopic: ["Hacer {a}", "Fazer {a}", "Do {a}", "{a} machen", "Faire {a}", "進行 {a}"],
  doLesson: ["Hacer la lección", "Fazer a lição", "Do the lesson", "Lektion machen", "Faire la leçon", "進行課程"],
  unmark: ["Desmarcar", "Desmarcar", "Unmark", "Markierung entfernen", "Décocher", "取消標記"],
  mark: ["Marcar como completado ✅", "Marcar como concluído ✅", "Mark as done ✅", "Als erledigt markieren ✅", "Marquer comme terminé ✅", "標記為完成 ✅"],
  resetWeek: ["Reiniciar semana", "Reiniciar semana", "Reset week", "Woche zurücksetzen", "Recommencer la semaine", "重設本週"],
  // Modo Rescate
  "w.Hoy": ["Hoy", "Hoje", "Today", "Heute", "Aujourd'hui", "今天"],
  "w.Mañana": ["Mañana", "Amanhã", "Tomorrow", "Morgen", "Demain", "明天"],
  "w.En 3 días": ["En 3 días", "Em 3 dias", "In 3 days", "In 3 Tagen", "Dans 3 jours", "3 天後"],
  "w.Esta semana": ["Esta semana", "Esta semana", "This week", "Diese Woche", "Cette semaine", "本週"],
  nota5: ["¡Excelente! Estás listo/a para tu prueba 🎉", "Excelente! Você está pronto/a para a prova 🎉", "Excellent! You're ready for your test 🎉", "Ausgezeichnet! Du bist bereit für die Prüfung 🎉", "Excellent ! Vous êtes prêt(e) pour l'examen 🎉", "太棒了！你已準備好考試 🎉"],
  nota3: ["¡Vas bien! Repasá un poco más 💪", "Vai bem! Revise mais um pouco 💪", "You're doing well! Review a bit more 💪", "Gut! Wiederhole noch etwas 💪", "Ça va bien ! Révisez encore un peu 💪", "不錯！再複習一下 💪"],
  nota1: ["Sigamos practicando, vos podés 🙌", "Vamos continuar praticando, você consegue 🙌", "Let's keep practicing, you can do it 🙌", "Lass uns weiter üben, du schaffst das 🙌", "Continuons à pratiquer, vous pouvez y arriver 🙌", "繼續練習，你做得到 🙌"],
  testWhen: ["🚨 Prueba: {a}", "🚨 Prova: {a}", "🚨 Test: {a}", "🚨 Prüfung: {a}", "🚨 Examen : {a}", "🚨 考試：{a}"],
  rescue: ["Modo Rescate", "Modo Resgate", "Rescue Mode", "Rettungsmodus", "Mode Sauvetage", "救援模式"],
  calm: ["¡Tranquilo/a! Vamos a prepararte para aprobar 💪", "Calma! Vamos te preparar para passar 💪", "Relax! We'll get you ready to pass 💪", "Keine Sorge! Wir bereiten dich aufs Bestehen vor 💪", "Pas de panique ! On vous prépare à réussir 💪", "別緊張！我們幫你準備及格 💪"],
  tellUs: ["Contanos cuándo es tu prueba y armamos un repaso intensivo, enfocado en lo esencial.", "Conte quando é sua prova e montamos uma revisão intensiva, focada no essencial.", "Tell us when your test is and we'll build an intensive review focused on the essentials.", "Sag uns, wann deine Prüfung ist, und wir stellen eine intensive Wiederholung mit dem Wichtigsten zusammen.", "Dites-nous quand a lieu votre examen et nous préparons une révision intensive sur l'essentiel.", "告訴我們考試時間，我們會安排聚焦重點的密集複習。"],
  whenTest: ["¿Cuándo es tu prueba?", "Quando é sua prova?", "When is your test?", "Wann ist deine Prüfung?", "Quand a lieu votre examen ?", "你什麼時候考試？"],
  whichGrade2: ["¿De qué grado?", "De qual série?", "Which grade?", "Welche Klasse?", "Quelle année ?", "哪個年級？"],
  startRescue: ["Empezar el rescate →", "Começar o resgate →", "Start the rescue →", "Rettung starten →", "Commencer le sauvetage →", "開始救援 →"],
  adapted: ["Contenido adaptado para {a}.", "Conteúdo adaptado para {a}.", "Content adapted for {a}.", "Inhalt angepasst für {a}.", "Contenu adapté pour {a}.", "內容適用於 {a}。"],
  back: ["← Volver", "← Voltar", "← Back", "← Zurück", "← Retour", "← 返回"],
  yourPlan: ["Este es tu plan de rescate", "Este é seu plano de resgate", "This is your rescue plan", "Das ist dein Rettungsplan", "Voici votre plan de sauvetage", "這是你的救援計畫"],
  planSub: ["Vamos a repasar los 6 temas clave, uno por uno, y al final un simulacro de prueba de 10 preguntas.", "Vamos revisar os 6 temas principais, um por um, e no final um simulado de 10 perguntas.", "We'll review the 6 key topics one by one, then a 10-question practice test.", "Wir wiederholen die 6 Kernthemen nacheinander und am Ende gibt es eine Probeprüfung mit 10 Fragen.", "Nous révisons les 6 thèmes clés un par un, puis un examen blanc de 10 questions.", "我們會逐一複習 6 個重點主題，最後進行 10 題模擬考。"],
  mock: ["Simulacro de prueba", "Simulado de prova", "Practice test", "Probeprüfung", "Examen blanc", "模擬考"],
  mockSub: ["10 preguntas mezclando todos los temas", "10 perguntas misturando todos os temas", "10 questions mixing all topics", "10 Fragen aus allen Themen", "10 questions mêlant tous les thèmes", "混合所有主題的 10 題"],
  startReview: ["Empezar repaso →", "Começar revisão →", "Start review →", "Wiederholung starten →", "Commencer la révision →", "開始複習 →"],
  directMock: ["Ir directo al simulacro", "Ir direto ao simulado", "Go straight to the test", "Direkt zur Probeprüfung", "Aller directement à l'examen blanc", "直接進行模擬考"],
  topicN: ["Tema {a} de {b}", "Tema {a} de {b}", "Topic {a} of {b}", "Thema {a} von {b}", "Thème {a} sur {b}", "第 {a} 個主題，共 {b} 個"],
  essential: ["Lo esencial para tu prueba", "O essencial para sua prova", "The essentials for your test", "Das Wichtigste für deine Prüfung", "L'essentiel pour votre examen", "考試重點"],
  toMock: ["Ir al simulacro →", "Ir ao simulado →", "Go to the test →", "Zur Probeprüfung →", "Aller à l'examen blanc →", "前往模擬考 →"],
  nextTopic: ["Siguiente tema →", "Próximo tema →", "Next topic →", "Nächstes Thema →", "Thème suivant →", "下一個主題 →"],
  skipMock: ["Saltar al simulacro", "Pular para o simulado", "Skip to the test", "Zur Probeprüfung springen", "Passer à l'examen blanc", "跳到模擬考"],
  mockTag: ["📝 Simulacro", "📝 Simulado", "📝 Practice test", "📝 Probeprüfung", "📝 Examen blanc", "📝 模擬考"],
  score: ["Puntaje: {a}/{b}", "Pontuação: {a}/{b}", "Score: {a}/{b}", "Punkte: {a}/{b}", "Score : {a}/{b}", "分數：{a}/{b}"],
  seeResult: ["Ver resultado →", "Ver resultado →", "See result →", "Ergebnis ansehen →", "Voir le résultat →", "查看結果 →"],
  next: ["Siguiente →", "Próxima →", "Next →", "Weiter →", "Suivant →", "下一題 →"],
  grade: ["Nota", "Nota", "Grade", "Note", "Note", "成績"],
  redo: ["Rehacer simulacro", "Refazer simulado", "Retake the test", "Probeprüfung wiederholen", "Refaire l'examen blanc", "重做模擬考"],
  byTopic: ["Repasar por tema", "Revisar por tema", "Review by topic", "Nach Thema wiederholen", "Réviser par thème", "按主題複習"],
} satisfies Record<string, L>;

export type EscolarKey = keyof typeof T;

export function useEscolarTx() {
  const lang = useAppLang();
  const i = ORDER.indexOf(lang);
  return (k: EscolarKey, v?: Record<string, string | number>) =>
    (T[k][i] || T[k][0]).replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
}

// ja/ru/ko (preliminares, en validación).
withOverlay([T]);
