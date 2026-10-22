import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Share2, Users, Award, Sparkles } from "lucide-react";
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
  const shareText = `Te invito a aprender guaraní gratis en Jaikuaa: ${link}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Enlace copiado");
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Jaikuaa", text: shareText }); } catch { /* cancelado */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="font-display text-xl font-bold text-primary"><BrandLogo /></Link>
          <Button asChild variant="outline" size="sm"><Link to="/dashboard">← Volver al panel</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground">¿Querés invitar a un amigo o familiar?</h1>
        <p className="mt-2 text-muted-foreground">
          Compartí tu enlace acá para que también aprenda guaraní en Jaikuaa.
        </p>

        {isLoading && <p className="mt-6 text-muted-foreground">Cargando tu enlace…</p>}
        {isError && <p className="mt-6 text-destructive">No pudimos cargar tu enlace. Probá de nuevo con señal.</p>}

        {data && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <Button size="lg" className="h-14 w-full text-base" onClick={share}>
              <Share2 className="mr-2 h-5 w-5" /> Invitar a alguien
            </Button>
            <p className="mt-4 text-sm font-semibold text-foreground">Tu enlace</p>
            <p className="mt-2 break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm text-foreground">{link}</p>
            <Button variant="outline" className="mt-3 w-full" onClick={copy}>
              <Copy className="mr-2 h-4 w-4" /> Copiar enlace
            </Button>
          </section>
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
