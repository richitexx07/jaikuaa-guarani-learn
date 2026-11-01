import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { answerWordOfDay, getWordOfDay } from "@/lib/games.functions";
import { playGuarani } from "@/lib/audio";
import { syncStats } from "@/lib/gamification";
import { logAnswer } from "@/lib/answer-log";
import { useAppLang } from "@/lib/i18n";
import { markWelcomeSeen } from "@/lib/welcome";
import jaiSaluda from "@/assets/jai/jai-saluda.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiAnimo from "@/assets/jai/jai-animo.webp";

/**
 * «Tu primera palabra en 30 segundos»: lo primero que ve quien acaba de crear su cuenta.
 * Una sola cosa para hacer: escuchar la Palabra del día (voz real) y elegir qué significa.
 * Usa la misma Palabra del día del servidor: los puntos los decide el servidor.
 */
export const Route = createFileRoute("/_authenticated/bienvenida")({
  head: () => ({ meta: [{ title: "Tu primera palabra | Jaikuaa" }, { name: "robots", content: "noindex" }] }),
  component: Bienvenida,
});

const TX = {
  hi: { es: "¡Mba'éichapa{n}!", pt: "Mba'éichapa{n}!", en: "Mba'éichapa{n}!" },
  intro: {
    es: "Empecemos con algo cortito: tu primera palabra en guaraní, con la voz de un paraguayo de verdad.",
    pt: "Vamos começar com algo curtinho: sua primeira palavra em guarani, com a voz de um paraguaio de verdade.",
    en: "Let's start with something short: your first Guarani word, in a real Paraguayan voice.",
  },
  listen: { es: "Escuchar la palabra", pt: "Ouvir a palavra", en: "Listen to the word" },
  question: { es: "¿Qué significa?", pt: "O que significa?", en: "What does it mean?" },
  right: { es: "¡Muy bien! Ya aprendiste tu primera palabra.", pt: "Muito bem! Você já aprendeu sua primeira palavra.", en: "Well done! You learned your first word." },
  wrong: { es: "¡Casi! Esta palabra significa:", pt: "Quase! Esta palavra significa:", en: "Almost! This word means:" },
  points: { es: "+5 puntos y empezó tu racha", pt: "+5 pontos e sua sequência começou", en: "+5 points and your streak started" },
  tryLesson: { es: "Errar también es aprender. En la primera lección la vas a practicar de nuevo.", pt: "Errar também é aprender. Na primeira lição você vai praticar de novo.", en: "Mistakes are part of learning. You'll practise it again in the first lesson." },
  next: { es: "Seguir con la primera lección", pt: "Seguir para a primeira lição", en: "Go to the first lesson" },
  panel: { es: "Ir a mi panel", pt: "Ir para o meu painel", en: "Go to my dashboard" },
  games: { es: "Prefiero jugar", pt: "Prefiro jogar", en: "I'd rather play" },
  skip: { es: "Saltar", pt: "Pular", en: "Skip" },
  none: { es: "¡Bienvenido a Jaikuaa! Empecemos por la primera lección.", pt: "Bem-vindo ao Jaikuaa! Vamos começar pela primeira lição.", en: "Welcome to Jaikuaa! Let's start with the first lesson." },
};

type Played = { choice: string; correct: boolean; answer: string };

function Bienvenida() {
  const lang = useAppLang();
  const l = (lang === "pt" || lang === "en" ? lang : "es") as "es" | "pt" | "en";
  const t = (k: keyof typeof TX, n = "") => TX[k][l].replace("{n}", n);

  const getFn = useServerFn(getWordOfDay);
  const answerFn = useServerFn(answerWordOfDay);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["word-of-day"], queryFn: () => getFn() });
  const [result, setResult] = useState<Played | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    markWelcomeSeen();
    void supabase.auth.getUser().then(({ data }) => {
      const full = (data.user?.user_metadata?.full_name as string | undefined) ?? "";
      const first = full.trim().split(/\s+/)[0] ?? "";
      if (first) setName(first.charAt(0).toUpperCase() + first.slice(1));
    });
  }, []);

  const d = q.data;
  const word = d?.word ?? null;
  const played = result ?? d?.played ?? null;

  async function choose(choice: string) {
    if (played || busy || !word) return;
    setBusy(true);
    setError(false);
    try {
      const r = await answerFn({ data: { choice } });
      setResult({ choice, correct: r.correct, answer: r.answer });
      logAnswer(word.gn, r.correct, "wotd", d!.day);
      if (word && !r.correct) void playGuarani(word.gn);
      void syncStats();
      void qc.invalidateQueries({ queryKey: ["word-of-day"] });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-10 pt-4">
      <div className="flex justify-end">
        <Link to="/dashboard" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          {t("skip")}
        </Link>
      </div>

      {q.isLoading ? (
        <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !word ? (
        <section className="mt-6 space-y-5 text-center">
          <img src={jaiSaluda} alt="Jai, el jaguarete, te saluda" className="mx-auto h-40 w-auto object-contain" />
          <h1 className="font-display text-3xl font-bold">{t("hi", name ? `, ${name}` : "")}</h1>
          <p className="text-muted-foreground">{t("none")}</p>
          <NextButtons t={t} />
        </section>
      ) : (
        <section className="mt-2 flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <img
              src={played ? (played.correct ? jaiAplaude : jaiAnimo) : jaiSaluda}
              alt=""
              className="h-24 w-24 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold leading-tight">{t("hi", name ? `, ${name}` : "")}</h1>
              {!played && <p className="mt-1 text-sm leading-snug text-muted-foreground">{t("intro")}</p>}
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-border bg-card p-5 text-center shadow-elegant">
            <p lang="gn" className="font-display text-4xl font-bold text-primary">{word.gn}</p>
            <button
              type="button"
              onClick={() => void playGuarani(word.gn)}
              className="mx-auto mt-4 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground shadow-lift active:scale-[0.98]"
            >
              <Volume2 className="h-5 w-5" aria-hidden /> {t("listen")}
            </button>
          </div>

          {!played ? (
            <div className="mt-5">
              <p className="mb-3 text-center font-display text-lg font-bold">{t("question")}</p>
              <div className="grid gap-2">
                {word.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    disabled={busy}
                    onClick={() => void choose(o)}
                    className="min-h-14 rounded-2xl border-2 border-border bg-background px-4 text-left text-lg font-semibold transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {o}
                  </button>
                ))}
              </div>
              {error && <p className="mt-3 text-center text-sm text-destructive">No se pudo guardar. Probá de nuevo.</p>}
            </div>
          ) : (
            <div className="mt-5 space-y-4 text-center">
              {played.correct ? (
                <>
                  <p className="font-display text-2xl font-bold">{t("right")}</p>
                  <p className="font-bold text-[#2F7A4A]">{t("points")}</p>
                </>
              ) : (
                <>
                  <p className="font-display text-xl font-bold">{t("wrong")}</p>
                  <p className="font-display text-3xl font-bold text-primary">{played.answer}</p>
                  <p className="text-sm text-muted-foreground">{t("tryLesson")}</p>
                </>
              )}
              <NextButtons t={t} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function NextButtons({ t }: { t: (k: keyof typeof TX) => string }) {
  return (
    <div className="grid gap-2 pt-2">
      <Link
        to="/curso/$lang/leccion/$n"
        params={{ lang: "guarani", n: "1" }}
        className="flex h-14 items-center justify-center rounded-2xl bg-accent px-6 text-lg font-bold text-accent-foreground shadow-lift"
      >
        {t("next")}
      </Link>
      <div className="grid grid-cols-2 gap-2">
        <Link to="/juegos" className="flex h-12 items-center justify-center rounded-2xl border border-border px-3 font-semibold">
          {t("games")}
        </Link>
        <Link to="/dashboard" className="flex h-12 items-center justify-center rounded-2xl border border-border px-3 font-semibold">
          {t("panel")}
        </Link>
      </div>
    </div>
  );
}
