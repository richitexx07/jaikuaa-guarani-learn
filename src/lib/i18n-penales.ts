import { useAppLang, type AppLang } from "./i18n";
import { withOverlay } from "./i18n-overlay";
import type { Outcome } from "@/components/games/penalties/physics";

/** Textos de Penales en 6 idiomas (de/fr/zh preliminares, en validación). Nunca toca guaraní. */
type L = Record<AppLang, string>;
const T = {
  loadErr: { es: "No se pudieron cargar las palabras. Volvé a intentar.", pt: "Não foi possível carregar as palavras. Tente de novo.", en: "Couldn't load the words. Please try again.", de: "Die Wörter konnten nicht geladen werden. Bitte erneut versuchen.", fr: "Impossible de charger les mots. Réessayez.", zh: "無法載入詞彙，請再試一次。" },
  title: { es: "Penales", pt: "Pênaltis", en: "Penalties", de: "Elfmeter", fr: "Tirs au but", zh: "點球大戰" },
  tagline: { es: "Respondé bien y el arquero llega tarde.", pt: "Responda certo e o goleiro chega atrasado.", en: "Answer right and the keeper is too late.", de: "Antworte richtig und der Torwart kommt zu spät.", fr: "Répondez juste et le gardien arrive trop tard.", zh: "答對了，守門員就來不及撲救。" },
  modeGroup: { es: "Modo de juego", pt: "Modo de jogo", en: "Game mode", de: "Spielmodus", fr: "Mode de jeu", zh: "遊戲模式" },
  solo: { es: "Solo", pt: "Sozinho", en: "Solo", de: "Allein", fr: "Solo", zh: "單人" },
  soloD: { es: "Vos contra el arquero", pt: "Você contra o goleiro", en: "You vs. the keeper", de: "Du gegen den Torwart", fr: "Vous contre le gardien", zh: "你對決守門員" },
  duel: { es: "Duelo", pt: "Duelo", en: "Duel", de: "Duell", fr: "Duel", zh: "對決" },
  duelD: { es: "Dos en el mismo celular", pt: "Dois no mesmo celular", en: "Two on one phone", de: "Zu zweit an einem Handy", fr: "À deux sur un téléphone", zh: "兩人共用一支手機" },
  remote: { es: "A distancia", pt: "À distância", en: "Remote", de: "Aus der Ferne", fr: "À distance", zh: "遠端" },
  remoteD: { es: "Cada uno en su celular", pt: "Cada um no seu celular", en: "Each on their own phone", de: "Jeder am eigenen Handy", fr: "Chacun sur son téléphone", zh: "各用自己的手機" },
  player: { es: "Jugador {n}", pt: "Jogador {n}", en: "Player {n}", de: "Spieler {n}", fr: "Joueur {n}", zh: "玩家 {n}" },
  playerName: { es: "Nombre del Jugador {n}", pt: "Nome do Jogador {n}", en: "Player {n} name", de: "Name von Spieler {n}", fr: "Nom du joueur {n}", zh: "玩家 {n} 的名字" },
  remoteInfo: { es: "Uno patea y el otro ataja, cada uno en su celular. Creás la sala e invitás por WhatsApp, Instagram o Facebook.", pt: "Um chuta e o outro defende, cada um no seu celular. Você cria a sala e convida pelo WhatsApp, Instagram ou Facebook.", en: "One shoots and the other saves, each on their own phone. Create the room and invite via WhatsApp, Instagram or Facebook.", de: "Einer schießt, der andere hält, jeder am eigenen Handy. Erstelle den Raum und lade per WhatsApp, Instagram oder Facebook ein.", fr: "L'un tire, l'autre arrête, chacun sur son téléphone. Créez la salle et invitez via WhatsApp, Instagram ou Facebook.", zh: "一人射門、一人撲救，各用自己的手機。建立房間後透過 WhatsApp、Instagram 或 Facebook 邀請。" },
  haveCode: { es: "¿Tenés un código?", pt: "Tem um código?", en: "Have a code?", de: "Hast du einen Code?", fr: "Vous avez un code ?", zh: "有房間代碼嗎？" },
  roomCode: { es: "Código de sala", pt: "Código da sala", en: "Room code", de: "Raumcode", fr: "Code de salle", zh: "房間代碼" },
  join: { es: "Unirme", pt: "Entrar", en: "Join", de: "Beitreten", fr: "Rejoindre", zh: "加入" },
  createRoom: { es: "📲 Crear sala e invitar", pt: "📲 Criar sala e convidar", en: "📲 Create room and invite", de: "📲 Raum erstellen und einladen", fr: "📲 Créer une salle et inviter", zh: "📲 建立房間並邀請" },
  start: { es: "⚽ Empezar tanda", pt: "⚽ Começar a disputa", en: "⚽ Start shootout", de: "⚽ Elfmeterschießen starten", fr: "⚽ Lancer la séance", zh: "⚽ 開始點球" },
  yourPens: { es: "Tus penales", pt: "Seus pênaltis", en: "Your penalties", de: "Deine Elfmeter", fr: "Vos tirs", zh: "你的點球" },
  goalsOf: { es: "Goles de {n}", pt: "Gols de {n}", en: "Goals by {n}", de: "Tore von {n}", fr: "Buts de {n}", zh: "{n} 的進球" },
  theRound: { es: "la tanda", pt: "a disputa", en: "the shootout", de: "der Runde", fr: "la séance", zh: "本輪" },
  draw: { es: "Empate", pt: "Empate", en: "Draw", de: "Unentschieden", fr: "Égalité", zh: "平手" },
  won: { es: "Ganó {n}", pt: "{n} venceu", en: "{n} wins", de: "{n} gewinnt", fr: "{n} gagne", zh: "{n} 獲勝" },
  ofFive: { es: "{n} de 5 goles", pt: "{n} de 5 gols", en: "{n} of 5 goals", de: "{n} von 5 Toren", fr: "{n} buts sur 5", zh: "5 球進 {n} 球" },
  goal: { es: "Gol", pt: "Gol", en: "Goal", de: "Tor", fr: "But", zh: "進球" },
  missed: { es: "Errado", pt: "Perdido", en: "Missed", de: "Verschossen", fr: "Raté", zh: "未進" },
  rematch: { es: "Revancha", pt: "Revanche", en: "Rematch", de: "Revanche", fr: "Revanche", zh: "再戰" },
  again: { es: "Otra tanda", pt: "Outra disputa", en: "Another shootout", de: "Noch eine Runde", fr: "Une autre séance", zh: "再來一輪" },
  changeMode: { es: "Cambiar modo", pt: "Mudar modo", en: "Change mode", de: "Modus wechseln", fr: "Changer de mode", zh: "切換模式" },
  sudden: { es: "Muerte súbita · ronda {n} de 3", pt: "Morte súbita · rodada {n} de 3", en: "Sudden death · round {n} of 3", de: "Sudden Death · Runde {n} von 3", fr: "Mort subite · manche {n} sur 3", zh: "驟死賽 · 第 {n} / 3 輪" },
  penN: { es: "Penal {n} de 5", pt: "Pênalti {n} de 5", en: "Penalty {n} of 5", de: "Elfmeter {n} von 5", fr: "Tir {n} sur 5", zh: "第 {n} / 5 球" },
  howSay: { es: "¿Cómo se dice en guaraní?", pt: "Como se diz em guarani?", en: "How do you say it in Guarani?", de: "Wie sagt man das auf Guaraní?", fr: "Comment le dit-on en guarani ?", zh: "瓜拉尼語怎麼說？" },
  answer: { es: "Respuesta:", pt: "Resposta:", en: "Answer:", de: "Antwort:", fr: "Réponse :", zh: "答案：" },
  aim: { es: "¡Ahora tocá en el arco adonde querés patear!", pt: "Agora toque no gol onde quer chutar!", en: "Now tap the spot in the goal where you want to shoot!", de: "Tippe jetzt auf die Stelle im Tor, wohin du schießen willst!", fr: "Touchez maintenant l'endroit du but où vous voulez tirer !", zh: "現在點擊球門中你想射的位置！" },
  result: { es: "Ver resultado", pt: "Ver resultado", en: "See result", de: "Ergebnis ansehen", fr: "Voir le résultat", zh: "查看結果" },
  nextPen: { es: "Siguiente penal", pt: "Próximo pênalti", en: "Next penalty", de: "Nächster Elfmeter", fr: "Tir suivant", zh: "下一球" },
  keeperTurn: { es: "Turno del arquero", pt: "Vez do goleiro", en: "Keeper's turn", de: "Der Torwart ist dran", fr: "Au tour du gardien", zh: "輪到守門員" },
  keeperPick: { es: "{k}, elegí en secreto hacia dónde te tirás", pt: "{k}, escolha em segredo para onde vai pular", en: "{k}, secretly choose where to dive", de: "{k}, wähle heimlich, wohin du springst", fr: "{k}, choisissez en secret où plonger", zh: "{k}，偷偷選擇你要撲向哪邊" },
  keeperInfo: { es: "Que {s} no mire. Si adivinás el lado y la altura del tiro, ¡lo atajás!", pt: "Que {s} não olhe. Se acertar o lado e a altura do chute, você defende!", en: "Don't let {s} look. Guess the side and height to save the shot!", de: "{s} darf nicht hinsehen. Errätst du Seite und Höhe, hältst du den Schuss!", fr: "Que {s} ne regarde pas. Devinez le côté et la hauteur pour arrêter le tir !", zh: "別讓 {s} 偷看。猜中方向和高度就能撲出！" },
  high: { es: "Arriba", pt: "Alto", en: "High", de: "Oben", fr: "En haut", zh: "上方" },
  low: { es: "Abajo", pt: "Baixo", en: "Low", de: "Unten", fr: "En bas", zh: "下方" },
  passPhone: { es: "Después pasale el celular a {s}.", pt: "Depois passe o celular para {s}.", en: "Then hand the phone to {s}.", de: "Gib dann das Handy an {s} weiter.", fr: "Ensuite, passez le téléphone à {s}.", zh: "然後把手機交給 {s}。" },
  left: { es: "Izquierda", pt: "Esquerda", en: "Left", de: "Links", fr: "Gauche", zh: "左" },
  center: { es: "Centro", pt: "Centro", en: "Center", de: "Mitte", fr: "Centre", zh: "中" },
  right: { es: "Derecha", pt: "Direita", en: "Right", de: "Rechts", fr: "Droite", zh: "右" },
  drawMsg: { es: "¡Empate! Un duelo muy parejo.", pt: "Empate! Um duelo muito equilibrado.", en: "Draw! A very close duel.", de: "Unentschieden! Ein sehr knappes Duell.", fr: "Égalité ! Un duel très serré.", zh: "平手！勢均力敵的對決。" },
  wonMsg: { es: "¡{n} ganó el duelo!", pt: "{n} venceu o duelo!", en: "{n} won the duel!", de: "{n} hat das Duell gewonnen!", fr: "{n} a gagné le duel !", zh: "{n} 贏得對決！" },
  doneMsg: { es: "¡Tanda completa! Cada palabra suma práctica.", pt: "Disputa completa! Cada palavra soma prática.", en: "Shootout complete! Every word adds practice.", de: "Runde geschafft! Jedes Wort ist Übung.", fr: "Séance terminée ! Chaque mot compte.", zh: "完成一輪！每個詞都是練習。" },
  rightMsg: { es: "¡Respuesta correcta! El arquero reacciona tarde.", pt: "Resposta correta! O goleiro reage tarde.", en: "Correct! The keeper reacts too late.", de: "Richtig! Der Torwart reagiert zu spät.", fr: "Bonne réponse ! Le gardien réagit trop tard.", zh: "答對了！守門員反應慢了。" },
  wrongMsg: { es: "Esta vez no. El arquero está atento, pero todavía podés marcar.", pt: "Desta vez não. O goleiro está atento, mas você ainda pode marcar.", en: "Not this time. The keeper is alert, but you can still score.", de: "Diesmal nicht. Der Torwart passt auf, aber du kannst noch treffen.", fr: "Pas cette fois. Le gardien est attentif, mais vous pouvez encore marquer.", zh: "這次沒答對。守門員很警覺，但你仍有機會進球。" },
  goNext: { es: "¡Vamos por el próximo penal!", pt: "Vamos para o próximo pênalti!", en: "On to the next penalty!", de: "Auf zum nächsten Elfmeter!", fr: "Au tir suivant !", zh: "準備下一球！" },
  kitTitle: { es: "Tu camiseta", pt: "Sua camisa", en: "Your shirt", de: "Dein Trikot", fr: "Votre maillot", zh: "你的球衣" },
  kitInfo: { es: "Un amistoso con el Jai: elegí los colores de tu país y poné tu nombre en la espalda.", pt: "Um amistoso com o Jai: escolha as cores do seu país e coloque seu nome nas costas.", en: "A friendly match with Jai: pick your country's colors and put your name on the back.", de: "Ein Freundschaftsspiel mit Jai: Wähle die Farben deines Landes und deinen Namen für den Rücken.", fr: "Un match amical avec Jai : choisissez les couleurs de votre pays et mettez votre nom dans le dos.", zh: "和 Jai 的友誼賽：選擇你國家的顏色，把名字印在背後。" },
  kitHe: { es: "Jugador", pt: "Jogador", en: "Player (he)", de: "Spieler", fr: "Joueur", zh: "男球員" },
  kitShe: { es: "Jugadora", pt: "Jogadora", en: "Player (she)", de: "Spielerin", fr: "Joueuse", zh: "女球員" },
  kitName: { es: "Nombre en la espalda", pt: "Nome nas costas", en: "Name on the back", de: "Name auf dem Rücken", fr: "Nom dans le dos", zh: "背後的名字" },
  kitNumber: { es: "Número", pt: "Número", en: "Number", de: "Nummer", fr: "Numéro", zh: "號碼" },
  kitCountry: { es: "País", pt: "País", en: "Country", de: "Land", fr: "Pays", zh: "國家" },
  kitSouth: { es: "Sudamérica", pt: "América do Sul", en: "South America", de: "Südamerika", fr: "Amérique du Sud", zh: "南美洲" },
  kitWorld: { es: "Del mundo", pt: "Do mundo", en: "Around the world", de: "Aus aller Welt", fr: "Du monde entier", zh: "世界各地" },
  kitWho: { es: "¿Quién patea?", pt: "Quem chuta?", en: "Who's shooting?", de: "Wer schießt?", fr: "Qui tire ?", zh: "誰來踢？" },
} satisfies Record<string, L>;

const MSG: Record<Outcome, L> = {
  goal: { es: "¡Gran gol! El público lo festeja con vos.", pt: "Golaço! A torcida comemora com você.", en: "Great goal! The crowd celebrates with you.", de: "Tolles Tor! Das Publikum jubelt mit dir.", fr: "Superbe but ! Le public fête avec vous.", zh: "漂亮進球！觀眾和你一起歡呼。" },
  angle: { es: "¡Al ángulo! Una definición espectacular.", pt: "No ângulo! Uma finalização espetacular.", en: "Top corner! A spectacular finish.", de: "In den Winkel! Ein spektakulärer Abschluss.", fr: "En lucarne ! Une finition spectaculaire.", zh: "直入上角！精彩的射門。" },
  save: { es: "El arquero llegó. La próxima buscá el rincón.", pt: "O goleiro pegou. Na próxima, busque o canto.", en: "The keeper got there. Aim for the corner next time.", de: "Der Torwart war da. Ziel nächstes Mal auf die Ecke.", fr: "Le gardien l'a eu. Visez le coin la prochaine fois.", zh: "被守門員撲到了。下次瞄準角落。" },
  post: { es: "¡Por centímetros! La pelota dio en el palo.", pt: "Por centímetros! A bola bateu na trave.", en: "So close! The ball hit the post.", de: "Um Zentimeter! Der Ball traf den Pfosten.", fr: "À quelques centimètres ! Le ballon a heurté le poteau.", zh: "差一點！球打中門柱。" },
  over: { es: "Se fue por arriba. Un poquito menos de fuerza.", pt: "Foi por cima. Um pouco menos de força.", en: "Over the bar. A little less power.", de: "Drüber. Etwas weniger Kraft.", fr: "Au-dessus. Un peu moins de puissance.", zh: "高出橫梁。力道小一點。" },
  wide: { es: "Se fue afuera. La revancha está cerca.", pt: "Foi para fora. A revanche está perto.", en: "Wide. Your comeback is close.", de: "Daneben. Die Revanche ist nah.", fr: "À côté. La revanche approche.", zh: "射偏了。扳回一城就在眼前。" },
};
const LABEL: Record<Outcome, L> = {
  goal: { es: "¡GOOOL!", pt: "GOOOL!", en: "GOOOAL!", de: "TOOOR!", fr: "BUUUT !", zh: "進球！" },
  angle: { es: "¡GOLAZO AL ÁNGULO!", pt: "GOLAÇO NO ÂNGULO!", en: "TOP-CORNER STUNNER!", de: "TRAUMTOR IN DEN WINKEL!", fr: "GOLAZO EN LUCARNE !", zh: "上角世界波！" },
  save: { es: "¡ATAJÓ!", pt: "DEFENDEU!", en: "SAVED!", de: "GEHALTEN!", fr: "ARRÊTÉ !", zh: "撲出！" },
  post: { es: "¡PALO!", pt: "TRAVE!", en: "POST!", de: "PFOSTEN!", fr: "POTEAU !", zh: "中柱！" },
  over: { es: "¡POR ARRIBA!", pt: "POR CIMA!", en: "OVER!", de: "DRÜBER!", fr: "AU-DESSUS !", zh: "高出！" },
  wide: { es: "¡AFUERA!", pt: "PARA FORA!", en: "WIDE!", de: "DANEBEN!", fr: "À CÔTÉ !", zh: "射偏！" },
};

export type PKey = keyof typeof T;
export function usePT() {
  const lang = useAppLang();
  const p = (k: PKey, v?: Record<string, string | number>) =>
    T[k][lang].replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
  return { p, msg: (o: Outcome) => MSG[o][lang], label: (o: Outcome) => LABEL[o][lang] };
}

// ja/ru/ko (preliminares, en validación).
withOverlay([T, MSG, LABEL]);
