import { useAppLang, type AppLang } from "./i18n";

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
} satisfies Record<string, L>;

export type SDKey = keyof typeof T;
export function useSDT() {
  const lang = useAppLang();
  return (k: SDKey, v?: Record<string, string | number>) =>
    T[k][lang].replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
}
