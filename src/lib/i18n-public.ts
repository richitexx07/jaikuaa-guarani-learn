import { useAppLang, type AppLang } from "./i18n";

/**
 * Textos de páginas públicas en 6 idiomas: [es, pt, en, de, fr, zh].
 * de/fr/zh son preliminares (en validación). Las frases institucionales
 * (Ateneo, respaldos, DINAPI) se traducen fielmente, sin agregar nada.
 * Nunca contiene guaraní nuevo.
 */
type Row = readonly [string, string, string, string, string, string];
const ORDER: AppLang[] = ["es", "pt", "en", "de", "fr", "zh"];

const T = {
  backHome: ["Volver al inicio", "Voltar ao início", "Back to home", "Zur Startseite", "Retour à l'accueil", "返回首頁"],
  // Sobre
  soAlt: ["Jai, el jaguarete de Jaikuaa, saluda", "Jai, o jaguaretê do Jaikuaa, cumprimenta", "Jai, Jaikuaa's jaguar, says hello", "Jai, der Jaguar von Jaikuaa, grüßt", "Jai, le jaguar de Jaikuaa, salue", "Jaikuaa 的美洲豹 Jai 向你打招呼"],
  soTitle: ["Sobre Jaikuaa", "Sobre o Jaikuaa", "About Jaikuaa", "Über Jaikuaa", "À propos de Jaikuaa", "關於 Jaikuaa"],
  soIntro: [
    "Jaikuaa —que en guaraní significa \"conozcamos, aprendamos juntos\"— es una plataforma paraguaya para aprender guaraní, con voz humana real y hecha íntegramente en Paraguay. Nacimos de una convicción: nuestra lengua merece una herramienta digital a su altura.",
    "Jaikuaa —que em guarani significa \"conheçamos, aprendamos juntos\"— é uma plataforma paraguaia para aprender guarani, com voz humana real e feita inteiramente no Paraguai. Nascemos de uma convicção: nossa língua merece uma ferramenta digital à sua altura.",
    "Jaikuaa —which in Guarani means \"let's get to know, let's learn together\"— is a Paraguayan platform for learning Guarani, with real human voices and made entirely in Paraguay. We were born from a conviction: our language deserves a digital tool worthy of it.",
    "Jaikuaa —auf Guaraní etwa \"lasst uns kennenlernen, gemeinsam lernen\"— ist eine paraguayische Plattform zum Guaraní-Lernen, mit echten menschlichen Stimmen und vollständig in Paraguay entwickelt. Wir sind aus einer Überzeugung entstanden: Unsere Sprache verdient ein digitales Werkzeug auf ihrer Höhe.",
    "Jaikuaa —qui en guarani signifie « apprenons à connaître, apprenons ensemble »— est une plateforme paraguayenne pour apprendre le guarani, avec de vraies voix humaines et entièrement faite au Paraguay. Nous sommes nés d'une conviction : notre langue mérite un outil numérique à sa hauteur.",
    "Jaikuaa 在瓜拉尼語中意為「讓我們一起認識、一起學習」，是一個學習瓜拉尼語的巴拉圭平台，使用真人聲音，完全在巴拉圭製作。我們源於一個信念：我們的語言值得擁有與之相稱的數位工具。",
  ],
  soMission: ["Nuestra misión", "Nossa missão", "Our mission", "Unsere Mission", "Notre mission", "我們的使命"],
  soMissionText: [
    "Que cualquier paraguayo, en cualquier lugar, pueda aprender y fortalecer su guaraní de forma gratuita, moderna y con orgullo. Creemos que el guaraní no es una materia difícil ni un idioma del pasado: es identidad viva, y queremos que se aprenda con alegría.",
    "Que qualquer paraguaio, em qualquer lugar, possa aprender e fortalecer seu guarani de forma gratuita, moderna e com orgulho. Acreditamos que o guarani não é uma matéria difícil nem uma língua do passado: é identidade viva, e queremos que se aprenda com alegria.",
    "That any Paraguayan, anywhere, can learn and strengthen their Guarani for free, in a modern way and with pride. We believe Guarani is not a hard subject or a language of the past: it is living identity, and we want it to be learned with joy.",
    "Dass alle Paraguayer, überall, ihr Guaraní kostenlos, modern und mit Stolz lernen und stärken können. Wir glauben: Guaraní ist kein schwieriges Fach und keine Sprache der Vergangenheit, sondern lebendige Identität, und es soll mit Freude gelernt werden.",
    "Que tout Paraguayen, où qu'il soit, puisse apprendre et renforcer son guarani gratuitement, de façon moderne et avec fierté. Le guarani n'est ni une matière difficile ni une langue du passé : c'est une identité vivante, et nous voulons qu'on l'apprenne avec joie.",
    "讓每一位巴拉圭人，無論身在何處，都能免費、現代且自豪地學習並加強瓜拉尼語。我們相信瓜拉尼語不是困難的科目，也不是過去的語言，而是活生生的認同，我們希望大家快樂地學習。",
  ],
  soDiff: ["Qué nos hace diferentes", "O que nos torna diferentes", "What makes us different", "Was uns auszeichnet", "Ce qui nous distingue", "我們的不同之處"],
  soV1t: ["Voz humana real", "Voz humana real", "Real human voice", "Echte menschliche Stimme", "Vraie voix humaine", "真人聲音"],
  soV1: ["Pronunciación paraguaya auténtica. Nada de voz robótica.", "Pronúncia paraguaia autêntica. Nada de voz robótica.", "Authentic Paraguayan pronunciation. No robotic voices.", "Authentische paraguayische Aussprache. Keine Roboterstimme.", "Prononciation paraguayenne authentique. Pas de voix robotique.", "道地的巴拉圭發音，沒有機器人聲音。"],
  soV2t: ["Para toda la vida", "Para a vida toda", "For everyday life", "Fürs ganze Leben", "Pour toute la vie", "生活所需"],
  soV2: ["Contenido pensado para la escuela, la familia y el trabajo.", "Conteúdo pensado para a escola, a família e o trabalho.", "Content designed for school, family and work.", "Inhalte für Schule, Familie und Arbeit.", "Contenu pensé pour l'école, la famille et le travail.", "為學校、家庭與工作設計的內容。"],
  soV3t: ["Puro y jopara", "Puro e jopara", "Pure and jopara", "Rein und Jopara", "Pur et jopara", "純正與 jopara"],
  soV3: ["Distinción clara entre el guaraní puro (teete) y el jopara del habla cotidiana.", "Distinção clara entre o guarani puro (teete) e o jopara da fala cotidiana.", "A clear distinction between pure Guarani (teete) and everyday jopara.", "Klare Unterscheidung zwischen reinem Guaraní (teete) und dem Alltags-Jopara.", "Distinction claire entre le guarani pur (teete) et le jopara du quotidien.", "清楚區分純正瓜拉尼語（teete）與日常的 jopara。"],
  soV4t: ["Aprendizaje con juego", "Aprendizagem com jogos", "Learning through play", "Lernen mit Spielen", "Apprendre en jouant", "寓教於樂"],
  soV4: ["Para que enseñar y aprender no aburra.", "Para que ensinar e aprender não seja chato.", "So teaching and learning are never boring.", "Damit Lehren und Lernen nicht langweilig wird.", "Pour qu'enseigner et apprendre ne soit pas ennuyeux.", "讓教與學都不無聊。"],
  soV5t: ["Guaraní básico gratis", "Guarani básico grátis", "Free basic Guarani", "Grundkurs Guaraní kostenlos", "Guarani de base gratuit", "基礎瓜拉尼語免費"],
  soV5: ["El curso básico de guaraní es gratuito para los paraguayos.", "O curso básico de guarani é gratuito para os paraguaios.", "The basic Guarani course is free for Paraguayans.", "Der Guaraní-Grundkurs ist für Paraguayer kostenlos.", "Le cours de base de guarani est gratuit pour les Paraguayens.", "基礎瓜拉尼語課程對巴拉圭人免費。"],
  soCommit: ["Nuestro compromiso", "Nosso compromisso", "Our commitment", "Unser Engagement", "Notre engagement", "我們的承諾"],
  soInst: ["Con las instituciones", "Com as instituições", "With institutions", "Mit den Institutionen", "Avec les institutions", "與機構合作"],
  soInstText: [
    "Jaikuaa cree en construir junto a quienes cuidan nuestra lengua. Trabajamos con respeto y admiración hacia las instituciones que velan por el guaraní, y buscamos que el contenido de la plataforma se desarrolle y valide de la mano de los expertos, para que sea siempre riguroso y confiable.",
    "O Jaikuaa acredita em construir junto com quem cuida da nossa língua. Trabalhamos com respeito e admiração pelas instituições que zelam pelo guarani, e buscamos que o conteúdo seja desenvolvido e validado por especialistas, para ser sempre rigoroso e confiável.",
    "Jaikuaa believes in building alongside those who care for our language. We work with respect and admiration for the institutions that look after Guarani, and we seek to have the platform's content developed and validated by experts so it is always rigorous and reliable.",
    "Jaikuaa möchte gemeinsam mit denen aufbauen, die unsere Sprache pflegen. Wir arbeiten mit Respekt vor den Institutionen, die sich um Guaraní kümmern, und wollen, dass die Inhalte von Fachleuten entwickelt und geprüft werden, damit sie stets sorgfältig und verlässlich sind.",
    "Jaikuaa croit en une construction aux côtés de ceux qui prennent soin de notre langue. Nous travaillons avec respect envers les institutions qui veillent sur le guarani, et souhaitons que le contenu soit élaboré et validé par des experts, pour qu'il soit toujours rigoureux et fiable.",
    "Jaikuaa 相信與守護我們語言的人一起建設。我們尊重並敬佩守護瓜拉尼語的機構，並希望平台內容由專家開發與驗證，確保嚴謹可靠。",
  ],
  soData: ["Datos del proyecto", "Dados do projeto", "Project details", "Projektdaten", "Données du projet", "專案資料"],
  soMark: ["Marca en trámite", "Marca em trâmite", "Trademark pending", "Marke angemeldet", "Marque en cours d'enregistrement", "商標申請中"],
  soMarkV: ["DINAPI Solicitud Nº 2658897", "DINAPI Solicitação Nº 2658897", "DINAPI Application No. 2658897", "DINAPI Antrag Nr. 2658897", "DINAPI Demande N° 2658897", "DINAPI 申請號 2658897"],
  soDev: ["Desarrollo", "Desenvolvimento", "Development", "Entwicklung", "Développement", "開發"],
  soMade: ["Hecho en Paraguay", "Feito no Paraguai", "Made in Paraguay", "Made in Paraguay", "Fait au Paraguay", "巴拉圭製作"],
  soSite: ["Sitio oficial", "Site oficial", "Official site", "Offizielle Website", "Site officiel", "官方網站"],
  soContact: ["Contacto", "Contato", "Contact", "Kontakt", "Contact", "聯絡我們"],
  soContactText: ["¿Sos una institución, docente o empresa que quiere sumarse a la misión del guaraní? Escribinos.", "Você é uma instituição, docente ou empresa que quer se somar à missão do guarani? Escreva para nós.", "Are you an institution, teacher or company that wants to join the Guarani mission? Write to us.", "Bist du eine Institution, Lehrkraft oder ein Unternehmen und möchtest die Guaraní-Mission unterstützen? Schreib uns.", "Vous êtes une institution, un enseignant ou une entreprise et souhaitez rejoindre la mission du guarani ? Écrivez-nous.", "你是想加入瓜拉尼語使命的機構、教師或企業嗎？歡迎來信。"],
  soClose: ["Jaikuaa — conozcamos juntos.", "Jaikuaa — conheçamos juntos.", "Jaikuaa — let's learn together.", "Jaikuaa — gemeinsam kennenlernen.", "Jaikuaa — apprenons ensemble.", "Jaikuaa——一起認識。"],
  // Aviso para textos legales
  legalNote: ["", "Este texto legal está disponível apenas em espanhol, que é a versão oficial.", "This legal text is available only in Spanish, which is the official version.", "Dieser Rechtstext ist nur auf Spanisch verfügbar; das ist die offizielle Fassung.", "Ce texte juridique n'est disponible qu'en espagnol, qui est la version officielle.", "本法律文本僅提供西班牙語版本，該版本為正式版本。"],
} satisfies Record<string, Row>;

export type PubKey = keyof typeof T;

export function usePubTx() {
  const lang = useAppLang();
  const i = ORDER.indexOf(lang);
  return (k: PubKey, v?: Record<string, string | number>) =>
    (T[k][i] || T[k][0]).replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ""));
}
