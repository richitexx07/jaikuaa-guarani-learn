import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { AI_GUARANI_TOOLS_ENABLED } from "@/lib/features";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftRight, Languages, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { translateText } from "@/lib/translate.functions";

export const Route = createFileRoute("/_authenticated/traductor")({
  // Apagado: la IA no genera ni traduce guaraní (ver src/lib/features.ts).
  beforeLoad: () => {
    if (!AI_GUARANI_TOOLS_ENABLED) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Jaikuaa — Traductor no disponible" },
      { name: "description", content: "La herramienta de traducción automática está deshabilitada. Jaikuaa prioriza el contenido revisado por especialistas." },
      { property: "og:title", content: "Jaikuaa — Traductor no disponible" },
      { property: "og:description", content: "Herramienta deshabilitada; el aprendizaje de Jaikuaa prioriza contenido revisado por especialistas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TraductorPage,
});

function TraductorPage() {
  const translateFn = useServerFn(translateText);
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<"es-gn" | "gn-es">("es-gn");
  const [result, setResult] = useState("");
  const [limitMsg, setLimitMsg] = useState("");
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (input: { text: string; direction: "es-gn" | "gn-es" }) =>
      translateFn({ data: input }),
    onSuccess: (data) => {
      if (data.limited) {
        setResult("");
        setLimitMsg(data.message);
        return;
      }
      setLimitMsg("");
      setResult(data.translation);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "";
      if (/unauthorized/i.test(msg)) {
        void navigate({ to: "/auth", search: { mode: "login" } });
        return;
      }
      setResult(`Error: ${msg || "intentá de nuevo"}`);
    },
  });

  const [from, to] = direction === "es-gn" ? ["Español", "Guaraní"] : ["Guaraní", "Español"];

  function swap() {
    setDirection((d) => (d === "es-gn" ? "gn-es" : "es-gn"));
    if (result) {
      setText(result);
      setResult("");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    mutation.mutate({ text: text.trim(), direction });
  }

  return (
    <div className="min-h-screen bg-background">
      <div role="note" className="sticky top-0 z-20 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-900 sm:text-sm">
        ⚠️ Función experimental. Este contenido lo genera una inteligencia artificial y no está validado por especialistas en lengua guaraní. Puede contener errores: no lo uses como referencia oficial.
      </div>
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Experimental
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Languages className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Traductor gratuito</h1>
            <p className="text-sm text-muted-foreground">Traducí entre español paraguayo y guaraní al instante.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="flex items-center justify-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
            <span className="flex-1 text-center font-display text-lg font-semibold text-foreground">{from}</span>
            <Button type="button" variant="outline" size="icon" onClick={swap} aria-label="Cambiar dirección">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center font-display text-lg font-semibold text-foreground">{to}</span>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={direction === "es-gn" ? "Escribí en español..." : "Ehai guaraníme..."}
            className="min-h-[140px] resize-none text-base"
            maxLength={1000}
          />

          <Button type="submit" variant="cta" size="lg" className="w-full" disabled={mutation.isPending || !text.trim()}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Traduciendo...
              </>
            ) : (
              "Traducir"
            )}
          </Button>
        </form>

        {limitMsg && (
          <div role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {limitMsg}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">{to}</div>
            <p className="mt-2 whitespace-pre-wrap text-lg text-foreground">{result}</p>
            <p className="mt-3 text-xs text-muted-foreground">Traducción automática no validada.</p>
          </div>
        )}
      </main>
    </div>
  );
}
