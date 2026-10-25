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

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signupSchema = loginSchema.extend({
  name: z.string().trim().min(1, "Ingresá tu nombre").max(100),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          setErrorMsg(parsed.error.issues[0].message);
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          const code = (error as { code?: string }).code;
          const msg = error.message?.toLowerCase() ?? "";
          if (code === "invalid_credentials" || msg.includes("invalid login")) {
            setErrorMsg("Email o contraseña incorrectos. Si te registraste con Google, iniciá sesión con Google.");
          } else if (msg.includes("email not confirmed")) {
            setErrorMsg("Tenés que confirmar tu email antes de iniciar sesión.");
          } else {
            setErrorMsg("No pudimos iniciar tu sesión. Intentá de nuevo.");
          }
          return;
        }
        if (!data.session) {
          setErrorMsg("No pudimos iniciar tu sesión. Intentá de nuevo.");
          return;
        }
        try {
          localStorage.setItem("aranduka_remember", rememberMe ? "1" : "0");
        } catch {
          // ignore storage errors
        }
        goNext();
      } else {
        const parsed = signupSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          setErrorMsg(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.name },
          },
        });
        if (error) {
          setErrorMsg(error.message.includes("registered") ? "Ese email ya está registrado." : "No pudimos crear tu cuenta.");
          return;
        }
        toast.success("¡Cuenta creada! Revisá tu email si te lo pide.");
        goNext();
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error inesperado. Intentá de nuevo.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      toast.error("No pudimos conectar con Google.");
      return;
    }
    if (result.redirected) return;
    goNext();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {isLogin ? "Iniciar sesión" : "Registrarse"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? "Bienvenido de vuelta a Jaikuaa." : "Creá tu cuenta y empezá a aprender hoy."}
            </p>
          </div>
          {invitedToGame && (
            <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/10 p-4 text-center">
              <p className="font-display text-lg font-bold text-primary">¡Te desafiaron a un juego!</p>
              <p className="mt-1 text-sm text-muted-foreground">Entrá con Google y vas directo a la sala de tu amigo.</p>
            </div>
          )}

          <Button type="button" variant="outline" size="lg" className="mt-8 h-14 w-full border-2 text-base font-semibold" onClick={handleGoogle}>
            <GoogleIcon /> Continuar con Google
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Entrás en un toque, sin contraseña.</p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Solo usamos tu nombre y tu correo. Nunca publicamos nada en tu nombre.
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            No vendemos tus datos ni los compartimos con terceros para publicidad.
          </p>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">¿Preferís no usar Google? {isLogin ? "Ingresá" : "Registrate"} con tu correo</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
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
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                  Mantener sesión iniciada
                </label>
                <Link to="/recuperar" className="text-sm font-medium text-accent hover:underline">
                  ¿Olvidaste tu contraseña?
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
              {loading ? "Cargando..." : isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>


          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <Link to="/auth" search={{ mode: isLogin ? "signup" : "login" }} className="font-medium text-accent hover:underline">
              {isLogin ? "Registrate" : "Iniciá sesión"}
            </Link>
          </p>

          <TrustBadges className="mt-8" />
          {/* Solo respaldos vigentes (Senado, Diputados, SPL). El Ateneo y el ISL se suman cuando estén firmados y validados. */}
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            Declarada de interés nacional y educativo por la Cámara de Senadores (Declaración N.° 547/2026) y por la
            Cámara de Diputados (Declaración N.° 2001), y de interés lingüístico por la Secretaría de Políticas
            Lingüísticas (Resolución N.° 116/2026).{" "}
            <Link to="/respaldos" className="font-medium text-accent hover:underline">
              Ver respaldos
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
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
