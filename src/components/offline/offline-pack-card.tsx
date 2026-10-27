import { useTX, type TXKey } from "@/lib/i18n-pages";
import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPack, getPackMeta, refreshPackIfStale, type PackMeta, type PackProgress } from "@/lib/offline-pack";
import { useConnection } from "./use-connection";

function ago(ts: number, tx: ReturnType<typeof useTX>): string {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 2) return tx("ofJustNow");
  if (min < 60) return tx("ofMin", { n: min });
  const h = Math.round(min / 60);
  if (h < 24) return tx("ofHour", { n: h });
  const d = Math.round(h / 24);
  return tx("ofDay", { n: d });
}

function isIosBrowserTab(): boolean {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/** Tarjeta del panel: «Descargar para usar sin internet». */
export function OfflinePackCard() {
  const { online } = useConnection();
  const tx = useTX();
  const [meta, setMeta] = useState<PackMeta | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<PackProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIosBrowserTab());
    void getPackMeta().then((m) => {
      setMeta(m);
      setLoaded(true);
      // Con señal y un paquete viejo, se actualiza solo y sin molestar.
      if (m) void refreshPackIfStale().then(() => getPackMeta().then(setMeta));
    });
  }, []);

  async function start() {
    setError(null);
    setProgress({ step: "Preparando", done: 0, total: 1 });
    try {
      const m = await downloadPack(setProgress);
      setMeta(m);
    } catch (e) {
      setError(
        (e as Error)?.message?.includes("conexión")
          ? tx("ofNeedSignal")
          : tx("ofFailed"),
      );
    } finally {
      setProgress(null);
    }
  }

  if (!loaded) return null;
  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;

  return (
    <section
      aria-label={tx("ofLabel")}
      className="rounded-2xl border border-border bg-card p-4 shadow-elegant sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}
          aria-hidden
        >
          {meta ? <WifiOff className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-foreground">
            {meta ? tx("ofReady") : tx("ofUse")}
          </h2>
          {meta ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tx("ofContents", { l: meta.lessons, a: meta.audios })}
              {meta.wotdUntil ? tx("ofUntil", { d: meta.wotdUntil.split("-").reverse().slice(0, 2).join("/") }) : ""}.{" "}
              {tx("ofUpdated", { t: ago(meta.savedAt, tx) })}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tx("ofInfo")}
            </p>
          )}
          {progress && (
            <div className="mt-3" aria-live="polite">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{tx("ofDownloading")} {progress.step}</span>
                <span>{pct} %</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {meta && meta.audiosMissing > 0 && !progress && (
            <p className="mt-1 text-xs text-muted-foreground">
              {tx("ofMissing", { n: meta.audiosMissing })}
            </p>
          )}
          {ios && (
            <p className="mt-2 text-xs text-muted-foreground">
              {tx("ofIos")}
            </p>
          )}
        </div>
      </div>
      {!progress && (
        <div className="mt-3 flex justify-end">
          <Button variant={meta ? "outline" : "cta"} size="sm" disabled={!online} onClick={() => void start()}>
            {meta ? <RefreshCw aria-hidden /> : <Download aria-hidden />}
            {online ? (meta ? tx("ofUpdate") : tx("ofDownload")) : tx("ofNeedSignalShort")}
          </Button>
        </div>
      )}
      {progress && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> {tx("ofDontClose")}
        </div>
      )}
    </section>
  );
}
