import { useSyncExternalStore } from "react";

/**
 * Idioma de la interfaz (ES/PT/EN). Solo traduce botones y textos de sistema;
 * nunca contenido en guaraní (eso lo validan los docentes).
 */
export type AppLang = "es" | "pt" | "en";
export const APP_LANGS: AppLang[] = ["es", "pt", "en"];
const KEY = "jaikuaa_lang";
const listeners = new Set<() => void>();

export function isAppLang(v: unknown): v is AppLang {
  return v === "es" || v === "pt" || v === "en";
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
  if (typeof document !== "undefined") document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
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
} as const satisfies Record<string, Record<AppLang, string>>;

export type TKey = keyof typeof DICT;

export function translate(lang: AppLang, key: TKey): string {
  return DICT[key][lang];
}

export function useT() {
  const lang = useAppLang();
  return { lang, t: (key: TKey) => translate(lang, key) };
}
