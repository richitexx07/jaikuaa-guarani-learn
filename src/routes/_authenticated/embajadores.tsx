import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, MessageCircle, Users, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getAmbassadorInfo } from "@/lib/ambassador.functions";
import { levelFor, MAX_REWARDED_INVITES_PER_MONTH, XP_PER_ACTIVATED_INVITE } from "@/lib/ambassador";

export const Route = createFileRoute("/_authenticated/embajadores")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Embajadores" },
      { name: "description", content: "Invitá a otras personas a aprender guaraní y sumá XP de embajador." },
      { property: "og:title", content: "Embajadores de Jaikuaa" },
      { property: "og:description", content: "Invitá a aprender guaraní con tu enlace personal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmbajadoresPage,
});

function EmbajadoresPage() {
  const fetchInfo = useServerFn(getAmbassadorInfo);
  const { data, isLoading, isError } = useQuery({ queryKey: ["ambassador"], queryFn: () => fetchInfo() });
  const link = data ? `https://www.jaikuaa.com/auth?ref=${data.code}` : "";
  const level = levelFor(data?.started ?? 0);
  const shareText = `¡Te invito a jugar y aprender en Jaikuaa! Entrá acá: ${link}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Enlace copiado");
  };
  const share = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="font-display text-xl font-bold text-primary"><BrandLogo /></Link>
          <Button asChild variant="outline" size="sm"><Link to="/dashboard">← Volver al panel</Link></Button>
        </div>
      </header>
      {/* pb-36: deja lugar para Jai, que flota abajo y tapaba las últimas reglas. */}
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-36">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          <Award className="h-4 w-4" /> Embajadores de Jaikuaa
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground">Invitá a aprender y jugar guaraní</h1>
        <p className="mt-2 text-muted-foreground">
          Compartí tu enlace. Cuando la persona que invitaste crea su cuenta y hace su primera actividad,
          sumás {XP_PER_ACTIVATED_INVITE} XP de embajador. Este XP es aparte de tu avance de aprendizaje.
        </p>

        {isLoading && <p className="mt-6 text-muted-foreground">Cargando tu enlace…</p>}
        {isError && <p className="mt-6 text-destructive">No pudimos cargar tu enlace. Probá de nuevo con señal.</p>}

        {data && (
          <>
            <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Button size="lg" className="h-14 w-full text-base" onClick={share}>
                <MessageCircle className="mr-2 h-5 w-5" /> Compartir por WhatsApp
              </Button>
              <p className="mt-4 text-sm font-semibold text-foreground">Tu enlace personal</p>
              <p className="mt-2 break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm text-foreground">{link}</p>
              <Button variant="outline" className="mt-3 w-full" onClick={copy}>
                <Copy className="mr-2 h-4 w-4" /> Copiar enlace
              </Button>
            </section>

            <section className="mt-4 grid grid-cols-3 gap-3">
              <Stat icon={<Users className="h-5 w-5" />} label="Se registraron" value={data.invited} />
              <Stat icon={<Sparkles className="h-5 w-5" />} label="Ya empezaron" value={data.started} />
              <Stat icon={<Award className="h-5 w-5" />} label="XP de embajador" value={data.ambassadorXp} />
            </section>

            <section className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="font-display font-bold text-primary">Tus puntos no vencen.</p>
              <p className="mt-1 text-sm text-foreground">
                Seguí aprendiendo y compartiendo. Mientras la comunidad crece, estamos preparando alianzas con marcas y
                comercios paraguayos para que muy pronto puedas canjear tus XP por premios y descuentos reales.
              </p>
            </section>


            <section className="mt-4 rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Tu distinción</p>
              <p className="font-display text-2xl font-bold text-primary">{level.current.name}</p>
              {level.next && (() => {
                const faltan = Math.max(0, level.next.min - data.started);
                const pct = Math.min(100, Math.round((data.started / level.next.min) * 100));
                return (
                  <>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {data.started} de {level.next.min}. Te {faltan === 1 ? "falta 1 persona" : `faltan ${faltan} personas`} que empiecen para ser «{level.next.name}».
                    </p>
                  </>
                );
              })()}
            </section>

            <section className="mt-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Reglas claras</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Solo cuentan personas nuevas que hacen al menos una actividad real.</li>
                <li>Máximo {MAX_REWARDED_INVITES_PER_MONTH} invitaciones con XP por mes.</li>
                <li>No ves datos de las personas que invitaste, solo los totales.</li>
                <li>No hay ranking público de embajadores ni premios en dinero.</li>
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <div className="mx-auto flex w-fit text-primary">{icon}</div>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
