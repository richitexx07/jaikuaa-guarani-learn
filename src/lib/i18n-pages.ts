import { useAppLang, type AppLang } from "./i18n";

/**
 * Textos de interfaz de las pantallas internas en 6 idiomas: [es, pt, en, de, fr, zh].
 * de/fr/zh son preliminares (en validación). Nunca contiene guaraní.
 */
type Row = readonly [string, string, string, string, string, string];
const ORDER: AppLang[] = ["es", "pt", "en", "de", "fr", "zh"];

const T = {
  backPanel: ["← Volver al panel", "← Voltar ao painel", "← Back to dashboard", "← Zurück zum Bereich", "← Retour au tableau de bord", "← 返回主頁"],
  back: ["← Volver", "← Voltar", "← Back", "← Zurück", "← Retour", "← 返回"],
  loading: ["Cargando…", "Carregando…", "Loading…", "Wird geladen…", "Chargement…", "載入中…"],
  you: ["(vos)", "(você)", "(you)", "(du)", "(vous)", "（你）"],
  games: ["Juegos", "Jogos", "Games", "Spiele", "Jeux", "遊戲"],
  // Logros
  lgJaiAlt: ["Jai festeja con los brazos arriba", "Jai comemora com os braços para cima", "Jai celebrates with arms up", "Jai jubelt mit erhobenen Armen", "Jai fête les bras levés", "Jai 舉起雙手慶祝"],
  lgYours: ["Tus logros", "Suas conquistas", "Your achievements", "Deine Erfolge", "Vos succès", "你的成就"],
  lgTitle: ["¡Mirá cuánto avanzaste!", "Veja quanto você avançou!", "Look how far you've come!", "Schau, wie weit du gekommen bist!", "Regardez vos progrès !", "看看你進步了多少！"],
  lgSub: ["Sumá XP, mantené tu racha y desbloqueá logros mientras aprendés Guaraní.", "Some XP, mantenha sua sequência e desbloqueie conquistas enquanto aprende guarani.", "Earn XP, keep your streak and unlock achievements while you learn Guarani.", "Sammle XP, halte deine Serie und schalte Erfolge frei, während du Guaraní lernst.", "Gagnez des XP, gardez votre série et débloquez des succès en apprenant le guarani.", "邊學瓜拉尼語，邊累積 XP、維持連續紀錄並解鎖成就。"],
  lgHeading: ["Logros", "Conquistas", "Achievements", "Erfolge", "Succès", "成就"],
  lgUnlocked: ["Desbloqueaste {a} de {b}.", "Você desbloqueou {a} de {b}.", "You've unlocked {a} of {b}.", "Du hast {a} von {b} freigeschaltet.", "Vous avez débloqué {a} sur {b}.", "你已解鎖 {b} 個中的 {a} 個。"],
  lgEarned: ["Conseguido", "Conquistado", "Earned", "Erreicht", "Obtenu", "已獲得"],
  "badge.primer-paso": ["Primer paso", "Primeiro passo", "First step", "Erster Schritt", "Premier pas", "第一步"],
  "badgeD.primer-paso": ["Completaste tu primera lección.", "Você completou sua primeira lição.", "You completed your first lesson.", "Du hast deine erste Lektion abgeschlossen.", "Vous avez terminé votre première leçon.", "你完成了第一堂課。"],
  "badge.guaranihablante": ["Guaranihablante", "Falante de guarani", "Guarani speaker", "Guaraní-Sprecher/in", "Guaranophone", "瓜拉尼語使用者"],
  "badgeD.guaranihablante": ["Completaste 5 lecciones de Guaraní.", "Você completou 5 lições de guarani.", "You completed 5 Guarani lessons.", "Du hast 5 Guaraní-Lektionen abgeschlossen.", "Vous avez terminé 5 leçons de guarani.", "你完成了 5 堂瓜拉尼語課。"],
  "badge.estudiante-estrella": ["Estudiante estrella", "Estudante estrela", "Star student", "Musterschüler/in", "Élève vedette", "明星學生"],
  "badgeD.estudiante-estrella": ["Sacaste 5/5 en una prueba de Guaraní Escolar.", "Você tirou 5/5 em uma prova de Guarani Escolar.", "You scored 5/5 on a School Guarani quiz.", "Du hast 5/5 in einem Schul-Guaraní-Test erreicht.", "Vous avez obtenu 5/5 à un quiz de guarani scolaire.", "你在學校瓜拉尼語測驗中拿到 5/5。"],
  "badge.racha-fuego": ["Racha de fuego", "Sequência de fogo", "Fire streak", "Feuerserie", "Série de feu", "火力連勝"],
  "badgeD.racha-fuego": ["Mantuviste una racha de 7 días seguidos.", "Você manteve uma sequência de 7 dias seguidos.", "You kept a 7-day streak.", "Du hast 7 Tage in Folge gelernt.", "Vous avez tenu une série de 7 jours.", "你連續學習了 7 天。"],
  // Ranking
  rkTitle: ["Ranking semanal", "Ranking semanal", "Weekly ranking", "Wochenrangliste", "Classement de la semaine", "每週排行榜"],
  rkJaiAlt: ["Jai levanta un trofeo dorado sobre el podio", "Jai levanta um troféu dourado no pódio", "Jai lifts a golden trophy on the podium", "Jai hebt einen goldenen Pokal auf dem Podest", "Jai lève un trophée doré sur le podium", "Jai 在頒獎台上舉起金色獎盃"],
  rkPodium: ["Podio de la semana", "Pódio da semana", "This week's podium", "Podest der Woche", "Podium de la semaine", "本週頒獎台"],
  rkSince: ["desde el lunes {d}", "desde segunda-feira {d}", "since Monday {d}", "seit Montag {d}", "depuis lundi {d}", "自週一 {d} 起"],
  rkEmpty: ["Todavía nadie sumó puntos esta semana. ¡Hacé una lección y aparecé primero!", "Ninguém somou pontos ainda esta semana. Faça uma lição e apareça em primeiro!", "Nobody has scored points this week yet. Do a lesson and be first!", "Diese Woche hat noch niemand Punkte. Mach eine Lektion und sei Erste/r!", "Personne n'a encore marqué de points cette semaine. Faites une leçon et soyez premier !", "本週還沒有人得分。完成一堂課，搶下第一名！"],
  rkMine: ["Esta semana sumaste {x} XP. El ranking se reinicia cada lunes. Solo se muestra el nombre de pila.", "Esta semana você somou {x} XP. O ranking reinicia toda segunda-feira. Só aparece o primeiro nome.", "This week you earned {x} XP. The ranking resets every Monday. Only first names are shown.", "Diese Woche hast du {x} XP gesammelt. Die Rangliste startet jeden Montag neu. Es wird nur der Vorname angezeigt.", "Cette semaine, vous avez gagné {x} XP. Le classement repart chaque lundi. Seul le prénom est affiché.", "本週你獲得 {x} XP。排行榜每週一重置，只顯示名字。"],
  rkEarn: ["Sumar puntos", "Somar pontos", "Earn points", "Punkte sammeln", "Gagner des points", "去賺分數"],
  // Glosario
  glTitle: ["Glosario", "Glossário", "Glossary", "Glossar", "Glossaire", "詞彙表"],
  glJaiAlt: ["Jai, el profe, con su libro", "Jai, o professor, com seu livro", "Jai the teacher with his book", "Jai, der Lehrer, mit seinem Buch", "Jai, le prof, avec son livre", "拿著書的 Jai 老師"],
  glIntro: ["Las palabras publicadas, con su significado y su audio. Si ves algo raro, tocá la banderita.", "As palavras publicadas, com significado e áudio. Se vir algo estranho, toque na bandeirinha.", "Published words with their meaning and audio. If something looks wrong, tap the little flag.", "Die veröffentlichten Wörter mit Bedeutung und Audio. Wenn dir etwas komisch vorkommt, tippe auf das Fähnchen.", "Les mots publiés, avec leur sens et leur audio. Si quelque chose semble faux, touchez le petit drapeau.", "已發布的詞彙，附意思與音檔。若發現問題，請點小旗子。"],
  glSearch: ["Buscá en guaraní o en castellano", "Busque em guarani ou em espanhol", "Search in Guarani or Spanish", "Auf Guaraní oder Spanisch suchen", "Cherchez en guarani ou en espagnol", "用瓜拉尼語或西班牙語搜尋"],
  glSearchLabel: ["Buscar en el glosario", "Buscar no glossário", "Search the glossary", "Im Glossar suchen", "Chercher dans le glossaire", "搜尋詞彙表"],
  glOffline: ["Sin conexión: el glosario todavía no está descargado. Con señal, tocá «Descargar para usar sin internet» en tu panel.", "Sem conexão: o glossário ainda não foi baixado. Com sinal, toque em «Baixar para usar sem internet» no seu painel.", "Offline: the glossary isn't downloaded yet. When you have signal, tap «Download for offline use» on your dashboard.", "Offline: Das Glossar ist noch nicht heruntergeladen. Tippe mit Empfang im Bereich auf «Für offline herunterladen».", "Hors ligne : le glossaire n'est pas encore téléchargé. Avec du réseau, touchez « Télécharger pour hors ligne » sur votre tableau de bord.", "離線：詞彙表尚未下載。有訊號時，請在主頁點「下載離線使用」。"],
  glError: ["No se pudo cargar el glosario. Probá de nuevo en un momento.", "Não foi possível carregar o glossário. Tente de novo em instantes.", "Couldn't load the glossary. Try again in a moment.", "Das Glossar konnte nicht geladen werden. Versuch es gleich nochmal.", "Impossible de charger le glossaire. Réessayez dans un instant.", "無法載入詞彙表，請稍後再試。"],
  glCount: ["{n} palabras", "{n} palavras", "{n} words", "{n} Wörter", "{n} mots", "{n} 個詞"],
  glCountOf: ["{a} de {n} palabras", "{a} de {n} palavras", "{a} of {n} words", "{a} von {n} Wörtern", "{a} sur {n} mots", "{n} 個詞中的 {a} 個"],
  glNone: ["No encontramos esa palabra en el glosario.", "Não encontramos essa palavra no glossário.", "We couldn't find that word in the glossary.", "Dieses Wort ist nicht im Glossar.", "Ce mot n'est pas dans le glossaire.", "詞彙表中找不到這個詞。"],
  glReviewed: ["Revisada por docente", "Revisada por professor", "Teacher-reviewed", "Von Lehrkraft geprüft", "Vérifié par un enseignant", "已由教師審核"],
  // Curso
  csBanner: ["Jai camina con su mochila por un sendero de piedras entre lomas y lapachos", "Jai caminha com sua mochila por uma trilha de pedras entre morros e ipês", "Jai walks with his backpack along a stone path among hills and lapacho trees", "Jai wandert mit Rucksack über einen Steinpfad zwischen Hügeln und Lapacho-Bäumen", "Jai marche avec son sac à dos sur un sentier de pierres entre collines et lapachos", "Jai 背著背包走在山丘與風鈴木之間的石子路上"],
  csTitle: ["Curso de {n}", "Curso de {n}", "{n} course", "{n}-Kurs", "Cours de {n}", "{n}課程"],
  csFeatured: ["Destacado", "Destaque", "Featured", "Empfohlen", "À la une", "精選"],
  csLessons: ["{n} lecciones con voces humanas paraguayas", "{n} lições com vozes humanas paraguaias", "{n} lessons with real Paraguayan voices", "{n} Lektionen mit echten paraguayischen Stimmen", "{n} leçons avec de vraies voix paraguayennes", "{n} 堂課，使用巴拉圭真人語音"],
  csProgress: ["Tu progreso", "Seu progresso", "Your progress", "Dein Fortschritt", "Votre progression", "你的進度"],
  csOf: ["{a} de {b}", "{a} de {b}", "{a} of {b}", "{a} von {b}", "{a} sur {b}", "{a} / {b}"],
  csStartWith: ["Empezar con la Lección {n}", "Começar a Lição {n}", "Start Lesson {n}", "Lektion {n} starten", "Commencer la leçon {n}", "開始第 {n} 課"],
  csContinueWith: ["Continuar con la Lección {n}", "Continuar com a Lição {n}", "Continue with Lesson {n}", "Weiter mit Lektion {n}", "Continuer avec la leçon {n}", "繼續第 {n} 課"],
  csInValidation: ["En validación", "Em validação", "Under validation", "In Prüfung", "En validation", "審核中"],
  csDone: ["Completada · podés repasarla", "Concluída · pode revisar", "Completed · you can review it", "Abgeschlossen · du kannst sie wiederholen", "Terminée · vous pouvez la réviser", "已完成 · 可以複習"],
  csAvailable: ["Disponible", "Disponível", "Available", "Verfügbar", "Disponible", "可學習"],
  csLocked: ["Completá la anterior para abrirla", "Conclua a anterior para abrir", "Finish the previous one to unlock", "Schließe die vorherige ab, um sie zu öffnen", "Terminez la précédente pour l'ouvrir", "完成上一課即可解鎖"],
  csLesson: ["Lección {n}", "Lição {n}", "Lesson {n}", "Lektion {n}", "Leçon {n}", "第 {n} 課"],
  csReview: ["Repasar", "Revisar", "Review", "Wiederholen", "Réviser", "複習"],
  csStart: ["Empezar", "Começar", "Start", "Starten", "Commencer", "開始"],
  csLockedLabel: ["Bloqueada", "Bloqueada", "Locked", "Gesperrt", "Verrouillée", "未解鎖"],
} satisfies Record<string, Row>;

export type TXKey = keyof typeof T;
export function useTX() {
  const lang = useAppLang();
  const i = ORDER.indexOf(lang);
  return (k: TXKey, v?: Record<string, string | number>) =>
    (T[k][i] ?? T[k][0]).replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
}
