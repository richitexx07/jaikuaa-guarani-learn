import { OpenInBrowser } from "@/components/open-in-browser";
import { inAppBrowser } from "@/lib/in-app-browser";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, TrustBadges } from "@/components/site-footer";
import { cleanRefCode, REF_STORAGE_KEY } from "@/lib/ambassador";
import { createAfterLoginRedirect, peekAfterLogin } from "@/lib/after-login";
import { EarlyAccessBadge } from "@/components/early-access-badge";
import { NandutiDisc } from "@/components/nanduti-disc";
import { RespaldosStrip } from "@/components/respaldos-strip";
import { AppLanguageToggle } from "@/components/app-language-toggle";
import { translate, useT } from "@/lib/i18n";
import jaiSaluda from "@/assets/jai/jai-saluda.webp";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "login" ? "login" : "signup",
  }),
  head: () => ({
    meta: [
      { title: "Jaikuaa — Aprendé y jugá en guaraní" },
      { name: "description", content: "Sumate gratis a Jaikuaa: aprendé guaraní con voces reales, juegos y desafíos diarios." },
      { property: "og:title", content: "Te invito a Jaikuaa — Aprendé y jugá en guaraní" },
      { property: "og:description", content: "Sumate gratis: voces reales, juegos y desafíos diarios en guaraní." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg" },
    ],
  }),
  component: AuthPage,
});

type Lang = Parameters<typeof translate>[0];
const loginSchemaFor = (l: Lang) => z.object({
  email: z.string().trim().email(translate(l, "auth.errEmail")).max(255),
  password: z.string().min(6, translate(l, "auth.errPwLen")).max(72),
});

const signupSchemaFor = (l: Lang) => loginSchemaFor(l).extend({
  name: z.string().trim().min(1, translate(l, "auth.errName")).max(100),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const { t, lang } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Registro con correo que pide confirmar: se muestra «Revisá tu correo» en vez de rebotar al inicio de sesión.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const ref = cleanRefCode(new URLSearchParams(window.location.search).get("ref"));
    if (ref) localStorage.setItem(REF_STORAGE_KEY, ref);
  }, []);

  const [invitedToGame, setInvitedToGame] = useState(false);
  useEffect(() => { setInvitedToGame(!!peekAfterLogin()?.includes("sala=")); }, []);
  const [goNext] = useState(() => createAfterLoginRedirect(
    (href) => navigate({ href, replace: true }),
  ));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goNext();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        goNext();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [goNext]);

  // Reset error when switching between login/signup
  useEffect(() => {
    setErrorMsg(null);
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (isLogin) {
        const parsed = loginSchemaFor(lang).safeParse({ email, password });
        if (!parsed.success) {
          setErrorMsg(parsed.error.issues[0].message);
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          const code = (error as { code?: string }).code;
          const msg = error.message?.toLowerCase() ?? "";
          if (code === "invalid_credentials" || msg.includes("invalid login")) {
            setErrorMsg(t("auth.errInvalid"));
          } else if (msg.includes("email not confirmed")) {
            setErrorMsg(t("auth.errConfirm"));
          } else {
            setErrorMsg(t("auth.errLogin"));
          }
          return;
        }
        if (!data.session) {
          setErrorMsg(t("auth.errLogin"));
          return;
        }
        try {
          localStorage.setItem("aranduka_remember", rememberMe ? "1" : "0");
        } catch {
          // ignore storage errors
        }
        goNext();
      } else {
        const parsed = signupSchemaFor(lang).safeParse({ name, email, password });
        if (!parsed.success) {
          setErrorMsg(parsed.error.issues[0].message);
          return;
        }
        const { data: signed, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.name },
          },
        });
        if (error) {
          setErrorMsg(error.message.includes("registered") ? t("auth.errExists") : t("auth.errCreate"));
          return;
        }
        if (!signed.session) {
          setSentTo(parsed.data.email);
          return;
        }
        toast.success(t("auth.created"));
        goNext();
      }
    } catch (err) {
      setErrorMsg(t("auth.errUnexpected"));
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    // Dentro de Facebook, Instagram o TikTok, Google bloquea el ingreso: se muestra el aviso en lugar de un error.
    if (inAppBrowser()) {
      document.getElementById("abrir-en-navegador")?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.message(lang === "pt" ? "Abra o Jaikuaa no navegador do celular para entrar com Google." : lang === "en" ? "Open Jaikuaa in your phone's browser to use Google." : "Abrí Jaikuaa en el navegador del celular para entrar con Google.");
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      toast.error(t("auth.errGoogle"));
      return;
    }
    if (result.redirected) return;
    goNext();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <AppLanguageToggle />
        </div>
      </header>
      <main className="flex flex-1 justify-center px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
        <div className="w-full max-w-md">
          <div className="relative mx-auto h-36 w-36 sm:h-40 sm:w-40">
            <NandutiDisc className="absolute inset-0 h-full w-full text-primary" />
            <img
              src={isLogin ? jaiSaluda : jaiBienvenida}
              alt={isLogin ? "Jai te saluda" : "Jai te da la bienvenida"}
              className="relative h-full w-full object-contain drop-shadow-xl"
            />
          </div>
          <div className="mt-2 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {isLogin ? t("auth.login") : t("auth.signup")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? t("auth.welcomeBack") : t("auth.createIntro")}
            </p>
          </div>
          <EarlyAccessBadge className="mt-5" />
          {invitedToGame && (
            <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/10 p-4 text-center">
              <p className="font-display text-lg font-bold text-primary">{t("auth.challenged")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("auth.challengedDesc")}</p>
            </div>
          )}

          {sentTo ? (
            <CheckEmail
              email={sentTo}
              lang={lang}
              resent={resent}
              onResend={async () => {
                await supabase.auth.resend({ type: "signup", email: sentTo, options: { emailRedirectTo: `${window.location.origin}/dashboard` } }).catch(() => {});
                setResent(true);
              }}
              onGoogle={handleGoogle}
              onBack={() => { setSentTo(null); setResent(false); }}
            />
          ) : (
          <>
          <div id="abrir-en-navegador"><OpenInBrowser lang={lang} className="mt-6" /></div>
          <Button type="button" variant="outline" size="lg" className="mt-8 h-14 w-full border-2 text-base font-semibold" onClick={handleGoogle}>
            <GoogleIcon /> {t("auth.google")}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{t("auth.oneTap")}</p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {t("auth.privacy1")}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {t("auth.privacy2")}
          </p>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">{isLogin ? t("auth.orEmailLogin") : t("auth.orEmailSignup")}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.namePh")} autoComplete="name" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground focus:text-foreground focus:outline-none"
                  aria-label={showPassword ? t("auth.hidePw") : t("auth.showPw")}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
              </div>
            </div>
            {isLogin && (
              <div className="flex items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-input accent-accent"
                  />
                  {t("auth.remember")}
                </label>
                <Link to="/recuperar" className="text-sm font-medium text-accent hover:underline">
                  {t("auth.forgot")}
                </Link>
              </div>
            )}
            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
              >
                {errorMsg}
              </div>
            )}
            <Button type="submit" variant="cta" size="lg" className="w-full" disabled={loading}>
              {loading ? t("auth.loading") : isLogin ? t("auth.login") : t("auth.create")}
            </Button>
          </form>
          </>
          )}


          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
            <Link to="/auth" search={{ mode: isLogin ? "signup" : "login" }} className="font-medium text-accent hover:underline">
              {isLogin ? t("auth.toSignup") : t("auth.toLogin")}
            </Link>
          </p>

          <TrustBadges className="mt-8" />
          <RespaldosStrip className="mt-8" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

const CE = {
  title: { es: "¡Listo! Revisá tu correo", pt: "Pronto! Confira seu e-mail", en: "Done! Check your email" },
  body: {
    es: "Te mandamos un enlace a {e}. Abrilo y tocá el enlace para entrar a Jaikuaa.",
    pt: "Enviamos um link para {e}. Abra e toque no link para entrar no Jaikuaa.",
    en: "We sent a link to {e}. Open it and tap the link to enter Jaikuaa.",
  },
  spam: { es: "¿No aparece? Mirá en «Spam» o «Promociones».", pt: "Não aparece? Veja em «Spam» ou «Promoções».", en: "Not there? Check «Spam» or «Promotions»." },
  gmail: { es: "Abrir Gmail", pt: "Abrir o Gmail", en: "Open Gmail" },
  resend: { es: "Mandármelo de nuevo", pt: "Enviar de novo", en: "Send it again" },
  resent: { es: "Listo, te lo mandamos de nuevo.", pt: "Pronto, enviamos de novo.", en: "Done, we sent it again." },
  google: { es: "Mejor entrar con Google (un toque, sin correo)", pt: "Melhor entrar com Google (um toque, sem e-mail)", en: "Use Google instead (one tap, no email)" },
  back: { es: "Corregir el correo", pt: "Corrigir o e-mail", en: "Fix the email" },
};

function CheckEmail({ email, lang, resent, onResend, onGoogle, onBack }: {
  email: string; lang: string; resent: boolean; onResend: () => void; onGoogle: () => void; onBack: () => void;
}) {
  const l = (lang === "pt" || lang === "en" ? lang : "es") as "es" | "pt" | "en";
  const isGmail = /@(gmail|googlemail)\.com$/i.test(email);
  return (
    <div className="mt-8 space-y-4 rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-center" role="status">
      <p className="text-5xl" aria-hidden>📩</p>
      <h2 className="font-display text-2xl font-bold">{CE.title[l]}</h2>
      <p className="text-base">{CE.body[l].replace("{e}", email)}</p>
      <p className="text-sm text-muted-foreground">{CE.spam[l]}</p>
      {isGmail && (
        <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-6 font-bold text-primary-foreground">
          {CE.gmail[l]}
        </a>
      )}
      <Button type="button" variant="outline" size="lg" className="h-12 w-full border-2 font-semibold" onClick={onGoogle}>
        <GoogleIcon /> {CE.google[l]}
      </Button>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        {resent ? (
          <span className="font-medium text-primary">{CE.resent[l]}</span>
        ) : (
          <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={onResend}>{CE.resend[l]}</button>
        )}
        <button type="button" className="text-muted-foreground underline underline-offset-4" onClick={onBack}>{CE.back[l]}</button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
