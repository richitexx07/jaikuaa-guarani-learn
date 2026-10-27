import { useSyncExternalStore } from "react";
import { EXTRA } from "./i18n-extra";

/**
 * Idioma de la interfaz (ES/PT/EN). Solo traduce botones y textos de sistema;
 * nunca contenido en guaraní (eso lo validan los docentes).
 */
export type AppLang = "es" | "pt" | "en" | "de" | "fr" | "zh";
export const APP_LANGS: AppLang[] = ["es", "pt", "en", "de", "fr", "zh"];
/** Idiomas con traducción preliminar, pendiente de revisión por un hablante nativo. */
export const PRELIMINARY_LANGS: AppLang[] = ["de", "fr", "zh"];
const KEY = "jaikuaa_lang";
const listeners = new Set<() => void>();

export function isAppLang(v: unknown): v is AppLang {
  return v === "es" || v === "pt" || v === "en" || v === "de" || v === "fr" || v === "zh";
}

function read(): AppLang {
  try {
    const v = localStorage.getItem(KEY);
    return isAppLang(v) ? v : "es";
  } catch {
    return "es";
  }
}

export function setAppLang(lang: AppLang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // ignore
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang === "pt" ? "pt-BR" : lang === "zh" ? "zh-Hant-TW" : lang;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppLang(): AppLang {
  return useSyncExternalStore(subscribe, read, () => "es");
}

type BaseLang = "es" | "pt" | "en";
const DICT = {
  "nav.learn": { es: "Aprender", pt: "Aprender", en: "Learn" },
  "nav.games": { es: "Juegos", pt: "Jogos", en: "Games" },
  "nav.ranking": { es: "Ranking", pt: "Ranking", en: "Ranking" },
  "nav.achievements": { es: "Logros", pt: "Conquistas", en: "Achievements" },
  "nav.main": { es: "Navegación principal", pt: "Navegação principal", en: "Main navigation" },
  "lang.label": { es: "Idioma", pt: "Idioma", en: "Language" },
  "signOut": { es: "Cerrar sesión", pt: "Sair", en: "Sign out" },
  "dash.friend": { es: "amigo", pt: "amigo", en: "friend" },
  "dash.question": { es: "¿Qué querés hacer hoy? Tocá un botón.", pt: "O que você quer fazer hoje? Toque em um botão.", en: "What do you want to do today? Tap a button." },
  "dash.learnDesc": { es: "Seguí tu curso con voces reales", pt: "Continue seu curso com vozes reais", en: "Continue your course with real voices" },
  "dash.play": { es: "Jugar", pt: "Jogar", en: "Play" },
  "dash.playDesc": { es: "15 juegos para aprender jugando", pt: "15 jogos para aprender brincando", en: "15 games to learn while playing" },
  "dash.word": { es: "Palabra del día", pt: "Palavra do dia", en: "Word of the day" },
  "dash.wordDesc": { es: "Una palabra nueva, en 1 minuto", pt: "Uma palavra nova, em 1 minuto", en: "A new word, in 1 minute" },
  "dash.inviteTitle": { es: "¿Querés aprender y jugar?", pt: "Quer aprender e jogar?", en: "Want to learn and play?" },
  "dash.inviteDesc": { es: "Invitá a un amigo o familiar", pt: "Convide um amigo ou familiar", en: "Invite a friend or family member" },
  "dash.share": { es: "Compartir", pt: "Compartilhar", en: "Share" },
  "dash.xpStrong": { es: "Tus puntos no vencen.", pt: "Seus pontos não expiram.", en: "Your points never expire." },
  "dash.xpRest": { es: "Muy pronto vas a poder canjear tus XP por premios y descuentos con marcas y comercios paraguayos.", pt: "Em breve você poderá trocar seus XP por prêmios e descontos com marcas e lojas paraguaias.", en: "Soon you will be able to redeem your XP for rewards and discounts with Paraguayan brands and shops." },
  "dash.explore": { es: "Más cosas para explorar", pt: "Mais coisas para explorar", en: "More to explore" },
  "dash.tools": { es: "Herramientas", pt: "Ferramentas", en: "Tools" },
  "dash.news": { es: "Noticias", pt: "Notícias", en: "News" },
  "auth.login": { es: "Iniciar sesión", pt: "Entrar", en: "Sign in" },
  "auth.signup": { es: "Registrarse", pt: "Criar conta", en: "Sign up" },
  "auth.welcomeBack": { es: "Bienvenido de vuelta a Jaikuaa.", pt: "Bem-vindo de volta ao Jaikuaa.", en: "Welcome back to Jaikuaa." },
  "auth.createIntro": { es: "Creá tu cuenta y empezá a aprender hoy.", pt: "Crie sua conta e comece a aprender hoje.", en: "Create your account and start learning today." },
  "auth.challenged": { es: "¡Te desafiaron a un juego!", pt: "Você foi desafiado para um jogo!", en: "You've been challenged to a game!" },
  "auth.challengedDesc": { es: "Entrá con Google y vas directo a la sala de tu amigo.", pt: "Entre com o Google e vá direto para a sala do seu amigo.", en: "Sign in with Google and go straight to your friend's room." },
  "auth.google": { es: "Continuar con Google", pt: "Continuar com o Google", en: "Continue with Google" },
  "auth.oneTap": { es: "Entrás en un toque, sin contraseña.", pt: "Entre com um toque, sem senha.", en: "One tap, no password." },
  "auth.privacy1": { es: "Solo usamos tu nombre y tu correo. Nunca publicamos nada en tu nombre.", pt: "Usamos apenas seu nome e e-mail. Nunca publicamos nada em seu nome.", en: "We only use your name and email. We never post anything on your behalf." },
  "auth.privacy2": { es: "No vendemos tus datos ni los compartimos con terceros para publicidad.", pt: "Não vendemos seus dados nem os compartilhamos com terceiros para publicidade.", en: "We don't sell your data or share it with third parties for advertising." },
  "auth.orEmailLogin": { es: "¿Preferís no usar Google? Ingresá con tu correo", pt: "Prefere não usar o Google? Entre com seu e-mail", en: "Prefer not to use Google? Sign in with your email" },
  "auth.orEmailSignup": { es: "¿Preferís no usar Google? Registrate con tu correo", pt: "Prefere não usar o Google? Cadastre-se com seu e-mail", en: "Prefer not to use Google? Sign up with your email" },
  "auth.name": { es: "Nombre", pt: "Nome", en: "Name" },
  "auth.namePh": { es: "Tu nombre", pt: "Seu nome", en: "Your name" },
  "auth.password": { es: "Contraseña", pt: "Senha", en: "Password" },
  "auth.showPw": { es: "Mostrar contraseña", pt: "Mostrar senha", en: "Show password" },
  "auth.hidePw": { es: "Ocultar contraseña", pt: "Ocultar senha", en: "Hide password" },
  "auth.remember": { es: "Mantener sesión iniciada", pt: "Manter conectado", en: "Keep me signed in" },
  "auth.forgot": { es: "¿Olvidaste tu contraseña?", pt: "Esqueceu sua senha?", en: "Forgot your password?" },
  "auth.loading": { es: "Cargando...", pt: "Carregando...", en: "Loading..." },
  "auth.create": { es: "Crear cuenta", pt: "Criar conta", en: "Create account" },
  "auth.noAccount": { es: "¿No tenés cuenta? ", pt: "Não tem conta? ", en: "Don't have an account? " },
  "auth.haveAccount": { es: "¿Ya tenés cuenta? ", pt: "Já tem conta? ", en: "Already have an account? " },
  "auth.toSignup": { es: "Registrate", pt: "Cadastre-se", en: "Sign up" },
  "auth.toLogin": { es: "Iniciá sesión", pt: "Entre", en: "Sign in" },
  "auth.errInvalid": { es: "Email o contraseña incorrectos. Si te registraste con Google, iniciá sesión con Google.", pt: "E-mail ou senha incorretos. Se você se cadastrou com o Google, entre com o Google.", en: "Wrong email or password. If you signed up with Google, sign in with Google." },
  "auth.errConfirm": { es: "Tenés que confirmar tu email antes de iniciar sesión.", pt: "Você precisa confirmar seu e-mail antes de entrar.", en: "You need to confirm your email before signing in." },
  "auth.errLogin": { es: "No pudimos iniciar tu sesión. Intentá de nuevo.", pt: "Não conseguimos fazer seu login. Tente novamente.", en: "We couldn't sign you in. Please try again." },
  "auth.errExists": { es: "Ese email ya está registrado.", pt: "Esse e-mail já está cadastrado.", en: "That email is already registered." },
  "auth.errCreate": { es: "No pudimos crear tu cuenta.", pt: "Não conseguimos criar sua conta.", en: "We couldn't create your account." },
  "auth.created": { es: "¡Cuenta creada! Revisá tu email si te lo pide.", pt: "Conta criada! Verifique seu e-mail se for solicitado.", en: "Account created! Check your email if asked." },
  "auth.errUnexpected": { es: "Ocurrió un error inesperado. Intentá de nuevo.", pt: "Ocorreu um erro inesperado. Tente novamente.", en: "An unexpected error occurred. Please try again." },
  "auth.errGoogle": { es: "No pudimos conectar con Google.", pt: "Não conseguimos conectar com o Google.", en: "We couldn't connect to Google." },
  "auth.errEmail": { es: "Email inválido", pt: "E-mail inválido", en: "Invalid email" },
  "auth.errPwLen": { es: "Mínimo 6 caracteres", pt: "Mínimo de 6 caracteres", en: "At least 6 characters" },
  "auth.errName": { es: "Ingresá tu nombre", pt: "Digite seu nome", en: "Enter your name" },
  "d.learnIntro": { es: "Contenido pedagógico ordenado, con audio humano.", pt: "Conteúdo pedagógico organizado, com áudio humano.", en: "Structured lessons with real human audio." },
  "d.course.t": { es: "Curso de Guaraní", pt: "Curso de Guarani", en: "Guarani Course" },
  "d.course.d": { es: "10 lecciones con audio humano real. Empezá desde cero y sumá XP.", pt: "10 lições com áudio humano real. Comece do zero e ganhe XP.", en: "10 lessons with real human audio. Start from scratch and earn XP." },
  "d.school.t": { es: "Guaraní Escolar", pt: "Guarani Escolar", en: "School Guarani" },
  "d.school.d": { es: "Organizado según los grados escolares.", pt: "Organizado por séries escolares.", en: "Organized by school grade." },
  "d.ach.t": { es: "Mis logros", pt: "Minhas conquistas", en: "My achievements" },
  "d.ach.d": { es: "Tus insignias, racha y avance.", pt: "Suas insígnias, sequência e progresso.", en: "Your badges, streak and progress." },
  "d.invite.t": { es: "Invitar a alguien", pt: "Convidar alguém", en: "Invite someone" },
  "d.invite.d": { es: "¿Querés invitar a un amigo o familiar? Compartí tu enlace acá.", pt: "Quer convidar um amigo ou familiar? Compartilhe seu link aqui.", en: "Want to invite a friend or family member? Share your link here." },
  "d.cert.t": { es: "Certificado", pt: "Certificado", en: "Certificate" },
  "d.cert.d": { es: "Terminá el Curso de Guaraní y descargá tu certificado.", pt: "Conclua o Curso de Guarani e baixe seu certificado.", en: "Finish the Guarani Course and download your certificate." },
  "d.playIntro": { es: "Practicá lo aprendido jugando. Todo gratis.", pt: "Pratique o que aprendeu jogando. Tudo grátis.", en: "Practice what you learned by playing. All free." },
  "d.trivia.t": { es: "Preguntados paraguayo", pt: "Quiz paraguaio", en: "Paraguayan quiz" },
  "d.trivia.d": { es: "Recorré el Sendero de Jai: gastronomía, mitos, deportes, música y más.", pt: "Percorra a Trilha do Jai: gastronomia, mitos, esportes, música e mais.", en: "Follow Jai's Trail: food, myths, sports, music and more." },
  "d.games.t": { es: "15 juegos", pt: "15 jogos", en: "15 games" },
  "d.games.d": { es: "Karaoke, cocina, penales, duelos, ventanilla, chacra y más.", pt: "Karaokê, cozinha, pênaltis, duelos, guichê, roça e mais.", en: "Karaoke, cooking, penalties, duels, service counter, farm and more." },
  "d.rank.t": { es: "Ranking semanal", pt: "Ranking semanal", en: "Weekly ranking" },
  "d.rank.d": { es: "Mirá quiénes estudiaron más esta semana en tu grupo.", pt: "Veja quem estudou mais nesta semana no seu grupo.", en: "See who studied the most this week in your group." },
  "d.more.t": { es: "Vienen más juegos", pt: "Mais jogos a caminho", en: "More games coming" },
  "d.more.d": { es: "A medida que la comunidad vaya creciendo, iremos sumando más juegos en guaraní.", pt: "À medida que a comunidade crescer, vamos adicionar mais jogos em guarani.", en: "As the community grows, we will keep adding more Guarani games." },
  "d.more.link": { es: "Ver todos los juegos", pt: "Ver todos os jogos", en: "See all games" },
  "d.toolsIntro": { es: "Apoyo y consulta.", pt: "Apoio e consulta.", en: "Support and reference." },
  "d.aula.t": { es: "Mi aula", pt: "Minha turma", en: "My class" },
  "d.aula.d": { es: "Entrá con el código de tu docente y mirá tus tareas.", pt: "Entre com o código do seu professor e veja suas tarefas.", en: "Join with your teacher's code and see your tasks." },
  "d.pron.t": { es: "Grabate y compará", pt: "Grave-se e compare", en: "Record and compare" },
  "d.pron.d": { es: "Escuchá a un hablante, grabate y compará las dos voces.", pt: "Ouça um falante, grave-se e compare as duas vozes.", en: "Listen to a speaker, record yourself and compare both voices." },
  "d.mostr.t": { es: "Atendé en guaraní", pt: "Atenda em guarani", en: "Serve customers in Guarani" },
  "d.mostr.d": { es: "Modo mostrador: hacé escuchar frases grabadas por hablantes al atender.", pt: "Modo balcão: toque frases gravadas por falantes ao atender.", en: "Counter mode: play phrases recorded by speakers while serving." },
  "d.kb.t": { es: "Teclado Guaraní", pt: "Teclado Guarani", en: "Guarani keyboard" },
  "d.kb.d": { es: "Escribí con ã, g̃ y puso, y mandalo por WhatsApp.", pt: "Escreva com ã, g̃ e puso, e envie pelo WhatsApp.", en: "Type ã, g̃ and puso, and send it on WhatsApp." },
  "d.gloss.t": { es: "Glosario", pt: "Glossário", en: "Glossary" },
  "d.gloss.d": { es: "Las palabras publicadas, con su significado y su audio.", pt: "As palavras publicadas, com significado e áudio.", en: "Published words, with their meaning and audio." },
  "d.agro.d": { es: "Guaraní técnico del campo: suelo, cultivos y ganado.", pt: "Guarani técnico do campo: solo, cultivos e gado.", en: "Technical farm Guarani: soil, crops and livestock." },
  "d.street.d": { es: "El guaraní que se habla en la calle.", pt: "O guarani falado nas ruas.", en: "The Guarani spoken on the street." },
  "ea.strong": { es: "Todavía no lanzamos oficialmente.", pt: "Ainda não lançamos oficialmente.", en: "We haven't officially launched yet." },
  "ea.rest": { es: "Igual ya podés usarlo gratis, y lo que aprendas desde hoy queda guardado.", pt: "Mesmo assim você já pode usar grátis, e o que aprender a partir de hoje fica salvo.", en: "You can already use it for free, and everything you learn from today is saved." },
  "pl.strong": { es: "Acceso anticipado:", pt: "Acesso antecipado:", en: "Early access:" },
  "pl.rest": { es: "Jaikuaa todavía no se lanzó oficialmente. Las palabras están en revisión por docentes especialistas; si ves un error, avisanos.", pt: "O Jaikuaa ainda não foi lançado oficialmente. As palavras estão em revisão por professores especialistas; se vir um erro, avise-nos.", en: "Jaikuaa has not officially launched yet. Words are being reviewed by specialist teachers; if you spot a mistake, let us know." },
  "val.badge": { es: "En validación", pt: "Em validação", en: "Under review" },
  "lang.preliminary": { es: "Traducción preliminar, en validación", pt: "Tradução preliminar, em validação", en: "Preliminary translation, under review" },
} as const satisfies Record<string, Record<BaseLang, string>>;

export type TKey = keyof typeof DICT;

export function translate(lang: AppLang, key: TKey): string {
  if (lang === "de" || lang === "fr" || lang === "zh") return EXTRA[lang][key];
  return DICT[key][lang];
}

export function useT() {
  const lang = useAppLang();
  return { lang, t: (key: TKey) => translate(lang, key) };
}
