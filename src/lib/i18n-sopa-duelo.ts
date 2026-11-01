import { useAppLang, type AppLang } from "./i18n";
import { withOverlay } from "./i18n-overlay";

/** Textos de Sopa de letras y Duelo en 6 idiomas (de/fr/zh preliminares, en validación). Nunca toca guaraní. */
type L = Record<AppLang, string>;
const T = {
  // Sopa de letras
  allFound: { es: "¡Las encontraste todas!", pt: "Você encontrou todas!", en: "You found them all!", de: "Du hast alle gefunden!", fr: "Vous les avez toutes trouvées !", zh: "你全部找到了！" },
  left: { es: "¡Bien! Te faltan {n}.", pt: "Muito bem! Faltam {n}.", en: "Nice! {n} to go.", de: "Gut! Noch {n}.", fr: "Bien ! Il en reste {n}.", zh: "很好！還剩 {n} 個。" },
  swipe: { es: "Deslizá el dedo sobre cada palabra, en línea recta (horizontal o vertical).", pt: "Deslize o dedo sobre cada palavra, em linha reta (horizontal ou vertical).", en: "Swipe over each word in a straight line (horizontal or vertical).", de: "Wische in gerader Linie über jedes Wort (waagrecht oder senkrecht).", fr: "Glissez le doigt sur chaque mot, en ligne droite (horizontale ou verticale).", zh: "沿直線（橫向或縱向）滑過每個詞。" },
  foundTitle: { es: "¡Encontraste todas!", pt: "Encontrou todas!", en: "All found!", de: "Alle gefunden!", fr: "Toutes trouvées !", zh: "全部找到！" },
  inSeconds: { es: "En {n} segundos", pt: "Em {n} segundos", en: "In {n} seconds", de: "In {n} Sekunden", fr: "En {n} secondes", zh: "用時 {n} 秒" },
  stars3: { es: "3 de 3 estrellas", pt: "3 de 3 estrelas", en: "3 of 3 stars", de: "3 von 3 Sternen", fr: "3 étoiles sur 3", zh: "3 顆星（滿分）" },
  jaiCheers: { es: "Jai festeja", pt: "Jai comemora", en: "Jai celebrates", de: "Jai feiert", fr: "Jai fête", zh: "Jai 在慶祝" },
  anotherSoup: { es: "Otra sopa", pt: "Outro caça-palavras", en: "Another puzzle", de: "Neues Rätsel", fr: "Une autre grille", zh: "再來一局" },
  // Duelo
  duelTitle: { es: "Duelo Cara a Cara", pt: "Duelo Cara a Cara", en: "Face-to-Face Duel", de: "Duell von Angesicht zu Angesicht", fr: "Duel face à face", zh: "面對面對決" },
  tablePhone: { es: "Apoyen el celular sobre la mesa", pt: "Coloquem o celular sobre a mesa", en: "Place the phone on the table", de: "Legt das Handy auf den Tisch", fr: "Posez le téléphone sur la table", zh: "把手機平放在桌上" },
  rules: { es: "Cada uno se sienta de un lado. Suena una palabra en guaraní: el primero que toca su traducción gana el punto. Si te equivocás, quedás bloqueado un segundo. Gana quien llega a {n}.", pt: "Cada um senta de um lado. Toca uma palavra em guarani: quem tocar primeiro a tradução ganha o ponto. Se errar, fica bloqueado por um segundo. Vence quem chegar a {n}.", en: "Sit on opposite sides. A Guarani word plays: the first to tap its meaning wins the point. Miss and you're locked for a second. First to {n} wins.", de: "Jeder sitzt auf einer Seite. Ein Wort auf Guaraní ertönt: Wer zuerst die Übersetzung tippt, bekommt den Punkt. Bei einem Fehler bist du eine Sekunde gesperrt. Wer zuerst {n} hat, gewinnt.", fr: "Chacun s'assoit d'un côté. Un mot en guarani est prononcé : le premier qui touche sa traduction gagne le point. En cas d'erreur, vous êtes bloqué une seconde. Le premier à {n} gagne.", zh: "兩人各坐一邊。播放一個瓜拉尼語詞：先點對意思的人得分。點錯會被鎖定一秒。先得 {n} 分者獲勝。" },
  startDuel: { es: "¡Empezar duelo!", pt: "Começar duelo!", en: "Start duel!", de: "Duell starten!", fr: "Lancer le duel !", zh: "開始對決！" },
  player: { es: "Jugador {n}", pt: "Jogador {n}", en: "Player {n}", de: "Spieler {n}", fr: "Joueur {n}", zh: "玩家 {n}" },
  wonDuel: { es: "¡{n} ganó el duelo!", pt: "{n} venceu o duelo!", en: "{n} won the duel!", de: "{n} hat das Duell gewonnen!", fr: "{n} a gagné le duel !", zh: "{n} 贏得對決！" },
  xpNote: { es: "El XP se suma a la cuenta con sesión iniciada (Jugador 1).", pt: "O XP vai para a conta com sessão iniciada (Jogador 1).", en: "XP goes to the signed-in account (Player 1).", de: "Die XP gehen an das angemeldete Konto (Spieler 1).", fr: "Les XP vont au compte connecté (Joueur 1).", zh: "XP 計入已登入的帳號（玩家 1）。" },
  rematch: { es: "Revancha ya", pt: "Revanche já", en: "Rematch now", de: "Sofort Revanche", fr: "Revanche !", zh: "立即再戰" },
  share: { es: "¡Jugamos un Duelo Cara a Cara en guaraní en Jaikuaa y terminó {a} a {b}! ¿Te animás a desafiarme? 🇵🇾", pt: "Jogamos um Duelo Cara a Cara em guarani no Jaikuaa e terminou {a} a {b}! Topa me desafiar? 🇵🇾", en: "We played a Guarani Face-to-Face Duel on Jaikuaa and it ended {a}–{b}! Dare to challenge me? 🇵🇾", de: "Wir haben auf Jaikuaa ein Guaraní-Duell gespielt: {a} zu {b}! Traust du dich, mich herauszufordern? 🇵🇾", fr: "On a joué un duel face à face en guarani sur Jaikuaa : {a} à {b} ! Tu oses me défier ? 🇵🇾", zh: "我們在 Jaikuaa 玩了瓜拉尼語面對面對決，比分 {a} 比 {b}！敢來挑戰我嗎？🇵🇾" },
  exit: { es: "Salir del duelo", pt: "Sair do duelo", en: "Leave duel", de: "Duell verlassen", fr: "Quitter le duel", zh: "離開對決" },
  listen: { es: "Escuchar otra vez", pt: "Ouvir de novo", en: "Listen again", de: "Nochmal anhören", fr: "Réécouter", zh: "再聽一次" },
  scoreSr: { es: "{a} a {b}", pt: "{a} a {b}", en: "{a} to {b}", de: "{a} zu {b}", fr: "{a} à {b}", zh: "{a} 比 {b}" },
  point: { es: "¡Punto!", pt: "Ponto!", en: "Point!", de: "Punkt!", fr: "Point !", zh: "得分！" },
  rivalPoint: { es: "Punto rival", pt: "Ponto do rival", en: "Rival's point", de: "Punkt für Gegner", fr: "Point adverse", zh: "對手得分" },
  locked: { es: "Bloqueado…", pt: "Bloqueado…", en: "Locked…", de: "Gesperrt…", fr: "Bloqué…", zh: "鎖定中…" },
  meaning: { es: "¿Qué significa?", pt: "O que significa?", en: "What does it mean?", de: "Was bedeutet das?", fr: "Que veut dire ce mot ?", zh: "這是什麼意思？" },
  // Árbitro de mesa (duelos en un mismo celular)
  pause: { es: "Pausa: tablas, rendirse o salir", pt: "Pausa: empate, desistir ou sair", en: "Pause: draw, resign or leave", de: "Pause: Remis, aufgeben oder verlassen", fr: "Pause : nul, abandon ou quitter", zh: "暫停：和局、認輸或離開" },
  refereeTitle: { es: "Partida en pausa", pt: "Partida em pausa", en: "Game paused", de: "Spiel pausiert", fr: "Partie en pause", zh: "對局暫停" },
  refereeHint: { es: "¿Qué hacemos con esta partida?", pt: "O que fazemos com esta partida?", en: "What should we do with this game?", de: "Was machen wir mit diesem Spiel?", fr: "Que fait-on de cette partie ?", zh: "這局要怎麼處理？" },
  keepPlaying: { es: "Seguir jugando", pt: "Continuar jogando", en: "Keep playing", de: "Weiterspielen", fr: "Continuer à jouer", zh: "繼續比賽" },
  draw: { es: "Tablas: empate de común acuerdo", pt: "Empate de comum acordo", en: "Draw by agreement", de: "Remis im Einvernehmen", fr: "Match nul d'un commun accord", zh: "雙方同意和局" },
  forfeit: { es: "Se rinde el Jugador {n}", pt: "O Jogador {n} desiste", en: "Player {n} resigns", de: "Spieler {n} gibt auf", fr: "Le joueur {n} abandonne", zh: "玩家 {n} 認輸" },
  exitToGames: { es: "Salir a los juegos", pt: "Sair para os jogos", en: "Back to games", de: "Zurück zu den Spielen", fr: "Retour aux jeux", zh: "回到遊戲列表" },
  confirmDraw: { es: "¿Los dos aceptan las tablas?", pt: "Os dois aceitam o empate?", en: "Do both players agree to a draw?", de: "Sind beide mit Remis einverstanden?", fr: "Les deux acceptent le match nul ?", zh: "雙方都同意和局嗎？" },
  confirmForfeit: { es: "¿El Jugador {n} se rinde?", pt: "O Jogador {n} desiste?", en: "Does Player {n} resign?", de: "Gibt Spieler {n} auf?", fr: "Le joueur {n} abandonne ?", zh: "玩家 {n} 確定認輸嗎？" },
  confirmExit: { es: "¿Salir? Esta partida no se guarda.", pt: "Sair? Esta partida não será salva.", en: "Leave? This game won't be saved.", de: "Verlassen? Dieses Spiel wird nicht gespeichert.", fr: "Quitter ? Cette partie ne sera pas enregistrée.", zh: "要離開嗎？這局不會儲存。" },
  yes: { es: "Sí", pt: "Sim", en: "Yes", de: "Ja", fr: "Oui", zh: "是" },
  no: { es: "No, volver", pt: "Não, voltar", en: "No, go back", de: "Nein, zurück", fr: "Non, revenir", zh: "不，返回" },
  drawTitle: { es: "¡Tablas! Empate de común acuerdo", pt: "Empate de comum acordo!", en: "Draw by agreement!", de: "Remis im Einvernehmen!", fr: "Match nul d'un commun accord !", zh: "雙方同意和局！" },
  forfeitTitle: { es: "Gana el Jugador {w}: el Jugador {l} se rindió", pt: "Vence o Jogador {w}: o Jogador {l} desistiu", en: "Player {w} wins: Player {l} resigned", de: "Spieler {w} gewinnt: Spieler {l} hat aufgegeben", fr: "Le joueur {w} gagne : le joueur {l} a abandonné", zh: "玩家 {w} 獲勝：玩家 {l} 認輸" },
  series: { es: "Partida {m} · Serie: Jugador 1 {a} — Jugador 2 {b}", pt: "Partida {m} · Série: Jogador 1 {a} — Jogador 2 {b}", en: "Game {m} · Series: Player 1 {a} — Player 2 {b}", de: "Spiel {m} · Serie: Spieler 1 {a} — Spieler 2 {b}", fr: "Partie {m} · Série : joueur 1 {a} — joueur 2 {b}", zh: "第 {m} 局 · 系列賽：玩家 1 {a} — 玩家 2 {b}" },
  seriesDraws: { es: "{d} tablas", pt: "{d} empates", en: "{d} draws", de: "{d} Remis", fr: "{d} nuls", zh: "{d} 次和局" },
  remoteRematch: { es: "¿Revancha cada uno en su celular?", pt: "Revanche cada um no seu celular?", en: "Rematch, each on your own phone?", de: "Revanche, jeder am eigenen Handy?", fr: "Revanche, chacun sur son téléphone ?", zh: "要各用自己的手機再戰嗎？" },
  // Sopa de letras: pista y rendirse
  hint: { es: "Pista", pt: "Dica", en: "Hint", de: "Tipp", fr: "Indice", zh: "提示" },
  hintNote: { es: "Te marqué dónde empieza una palabra.", pt: "Marquei onde começa uma palavra.", en: "I marked where a word starts.", de: "Ich habe markiert, wo ein Wort beginnt.", fr: "J'ai marqué où commence un mot.", zh: "我標出了一個詞的開頭。" },
  showRest: { es: "Rendirme y ver las que faltan", pt: "Desistir e ver as que faltam", en: "Give up and show the rest", de: "Aufgeben und den Rest zeigen", fr: "Abandonner et voir les mots restants", zh: "放棄並顯示剩下的詞" },
  confirmShowRest: { es: "¿Seguro? Sí, mostrarlas", pt: "Tem certeza? Sim, mostrar", en: "Sure? Yes, show them", de: "Sicher? Ja, zeigen", fr: "Sûr ? Oui, les montrer", zh: "確定嗎？是，顯示" },
  restTitle: { es: "Estas eran las que faltaban", pt: "Estas eram as que faltavam", en: "These were the missing ones", de: "Das waren die fehlenden", fr: "Voici les mots qui manquaient", zh: "這些就是剩下的詞" },
  restNote: { es: "Tranquilo: equivocarse también es aprender. Escuchalas, repasalas y probá con otra sopa.", pt: "Calma: errar também é aprender. Ouça, revise e tente outro caça-palavras.", en: "Relax: mistakes are part of learning. Listen, review and try another puzzle.", de: "Keine Sorge: Fehler gehören zum Lernen. Hör sie dir an, wiederhole sie und versuch ein neues Rätsel.", fr: "Pas de souci : se tromper fait partie de l'apprentissage. Écoutez, révisez et essayez une autre grille.", zh: "別擔心：犯錯也是學習。聽一聽、複習一下，再試一局。" },
} satisfies Record<string, L>;

export type SDKey = keyof typeof T;
export function useSDT() {
  const lang = useAppLang();
  return (k: SDKey, v?: Record<string, string | number>) =>
    T[k][lang].replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
}

// ja/ru/ko (preliminares, en validación).
withOverlay([T]);
