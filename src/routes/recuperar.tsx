import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Recuperar contraseña" },
      { name: "description", content: "Recuperá el acceso a tu cuenta de Jaikuaa." },
      { property: "og:title", content: "Jaikuaa — Recuperar contraseña" },
      { property: "og:description", content: "Recuperá el acceso a tu cuenta de Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecuperarPage,
});

const schema = z.object({ email: z.string().trim().email("Email inválido").max(255) });

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setErrorMsg("No pudimos enviar el correo. Intentá de nuevo.");
        return;
      }
      setSent(true);
    } catch (err) {
      console.error("Reset error:", err);
      setErrorMsg("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
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
              Recuperar contraseña
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresá tu email y te enviamos un enlace para restablecerla.
            </p>
          </div>

          {sent ? (
            <div className="mt-8 rounded-md border border-accent/30 bg-accent/5 px-4 py-6 text-center">
              <p className="text-base font-medium text-foreground">
                Te enviamos un correo para restablecer tu contraseña. Revisá tu bandeja de entrada 📧
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Si no lo encontrás, mirá también la carpeta de spam.
              </p>
              <Link
                to="/auth"
                search={{ mode: "login" }}
                className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@email.com"
                  autoComplete="email"
                  required
                />
              </div>
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
                {loading ? "Enviando..." : "Enviar correo de recuperación"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/auth" search={{ mode: "login" }} className="font-medium text-accent hover:underline">
                  Volver a iniciar sesión
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
