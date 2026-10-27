import { useTX, type TXKey } from "@/lib/i18n-pages";
import { EarlyAccessBadge } from "@/components/early-access-badge";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Users, Award, Sparkles } from "lucide-react";
import jaiImg from "@/assets/jai/jai-embajador.webp";
import { JaiPaw } from "@/components/py-icons";
import { WhatsAppIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon } from "@/components/social-icons";
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
  const tx = useTX();
  const fetchInfo = useServerFn(getAmbassadorInfo);
  const { data, isLoading, isError } = useQuery({ queryKey: ["ambassador"], queryFn: () => fetchInfo() });
  const link = data ? `https://www.jaikuaa.com/auth?ref=${data.code}` : "";
  const level = levelFor(data?.started ?? 0);
  const shareText = tx("amShareText", { l: link });

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success(tx("amCopied"));
  };
  const share = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  };
  const open = (url: string) => window.open(url, "_blank", "noopener");
  const shareFacebook = () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
  const shareX = () =>
    open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="font-display text-xl font-bold text-primary"><BrandLogo /></Link>
          <Button asChild variant="outline" size="sm"><Link to="/dashboard">{tx("backPanel")}</Link></Button>
        </div>
      </header>
      {/* pb-36: deja lugar para Jai, que flota abajo y tapaba las últimas reglas. */}
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-36">
        <EarlyAccessBadge className="mb-4" />
        <section className="amb-hero amb-rise shadow-xl">
          <div className="amb-stripe relative" />
          {[["12%", "20%", "0s"], ["70%", "15%", ".8s"], ["85%", "60%", "1.6s"], ["30%", "78%", "1.1s"], ["55%", "40%", "2s"]].map(([l, t, d], i) => (
            <span key={i} className="amb-spark" style={{ left: l, top: t, animationDelay: d }} />
          ))}
          <div className="relative flex items-center gap-3 p-5 sm:p-7">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
                <Award className="h-4 w-4" /> {tx("amBadge")}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
                {tx("amTitle")}
              </h1>
              <p className="mt-2 text-sm opacity-90 sm:text-base">
                {tx("amIntro", { x: XP_PER_ACTIVATED_INVITE })}
              </p>
            </div>
            <img src={jaiImg} alt={tx("amJaiAlt")} className="amb-jai h-32 w-32 shrink-0 object-contain sm:h-44 sm:w-44" />
          </div>
        </section>

        {isLoading && <p className="mt-6 text-muted-foreground">{tx("amLoading")}</p>}
        {isError && <p className="mt-6 text-destructive">{tx("amError")}</p>}

        {data && (
          <>
            <section className="amb-rise mt-5 rounded-3xl border border-border bg-card p-5 shadow-lg" style={{ animationDelay: ".15s" }}>
              <p className="font-display text-lg font-bold text-foreground">{tx("amShareNets")}</p>
              <p className="text-sm text-muted-foreground">{tx("amChoose")}</p>
              <button type="button" onClick={share} className="social-btn social-wa amb-pulse mt-4 w-full !flex-row !gap-3 !py-4 text-base">
                <WhatsAppIcon className="h-7 w-7" /> {tx("amWa")}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={shareFacebook} className="social-btn social-fb" style={{ animationDelay: ".25s" }}>
                  <FacebookIcon className="h-7 w-7" /> Facebook
                </button>
                <button type="button" onClick={shareX} className="social-btn social-x" style={{ animationDelay: ".35s" }}>
                  <XIcon className="h-6 w-6" /> X
                </button>
              </div>
              <p className="mt-5 text-sm font-semibold text-foreground">{tx("amLink")}</p>
              <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-2">
                <p className="flex-1 break-all px-1 font-mono text-xs text-foreground sm:text-sm">{link}</p>
                <Button size="sm" onClick={copy}><Copy className="mr-1 h-4 w-4" /> {tx("amCopy")}</Button>
              </div>
              <div className="mt-3 rounded-xl border border-border bg-muted/50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="social-ig inline-flex h-7 w-7 items-center justify-center rounded-lg"><InstagramIcon className="h-4 w-4" /></span>
                  <span className="social-tt inline-flex h-7 w-7 items-center justify-center rounded-lg"><TikTokIcon className="h-4 w-4" /></span>
                  {tx("amIgTt")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tx("amIgTip")}
                </p>
              </div>
            </section>

            <section className="mt-4 grid grid-cols-3 gap-3">
              <Stat delay=".3s" icon={<Users className="h-5 w-5" />} label={tx("amRegistered")} value={data.invited} />
              <Stat delay=".4s" icon={<Sparkles className="h-5 w-5" />} label={tx("amStarted")} value={data.started} />
              <Stat delay=".5s" icon={<Award className="h-5 w-5" />} label={tx("amXp")} value={data.ambassadorXp} />
            </section>

            <section className="amb-rise mt-4 overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-5" style={{ animationDelay: ".55s" }}>
              <p className="flex items-center gap-2 font-display text-lg font-bold text-primary"><JaiPaw size={22} /> {tx("amNoExpire")}</p>
              <p className="mt-1 text-sm text-foreground">
                {tx("amFuture")}
              </p>
            </section>




            <section className="amb-rise mt-4 rounded-3xl border border-border bg-card p-5" style={{ animationDelay: ".65s" }}>
              <p className="text-sm text-muted-foreground">{tx("amLevel")}</p>
              <p className="font-display text-2xl font-bold text-primary">{tx(`lvl.${level.current.name}` as TXKey)}</p>
              {level.next && (() => {
                const faltan = Math.max(0, level.next.min - data.started);
                const pct = Math.min(100, Math.round((data.started / level.next.min) * 100));
                return (
                  <>
                    <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="amb-bar h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {faltan === 1 ? tx("amLeft1", { a: data.started, b: level.next.min, n: tx(`lvl.${level.next.name}` as TXKey) }) : tx("amLeftN", { a: data.started, b: level.next.min, f: faltan, n: tx(`lvl.${level.next.name}` as TXKey) })}
                    </p>
                  </>
                );
              })()}
            </section>

            <section className="mt-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{tx("amRules")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>{tx("amR1")}</li>
                <li>{tx("amR2", { n: MAX_REWARDED_INVITES_PER_MONTH })}</li>
                <li>{tx("amR3")}</li>
                <li>{tx("amR4")}</li>
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: number; delay: string }) {
  return (
    <div className="amb-rise rounded-2xl border border-border bg-card p-3 text-center shadow-sm transition-transform hover:-translate-y-1" style={{ animationDelay: delay }}>
      <div className="mx-auto flex w-fit rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
