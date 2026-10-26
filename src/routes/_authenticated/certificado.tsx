import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Loader2, Printer } from "lucide-react";
import QRCode from "qrcode";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCertificateStatus } from "@/lib/community.functions";
import { issueCertificate } from "@/lib/certificates.functions";
import { isOffline, readOfflineCopy, withOfflineCache } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import { pendingLessonRefs } from "@/lib/gamification";
import { pendingCertificateName, queueCertificate } from "@/lib/offline-sync";
import jaiGraduado from "@/assets/jai/jai-graduado.webp";

type CertStatus = {
  eligible: boolean;
  completed: number;
  required: number;
  name?: string | null;
  code?: string | null;
  issuedAt?: string | null;
};

/**
 * Estado del certificado. Sin señal se usa la última copia y se suman las lecciones terminadas
 * en el teléfono que todavía no llegaron al servidor.
 */
async function loadStatus(fn: () => Promise<CertStatus>): Promise<CertStatus & { offline?: boolean }> {
  const d = await withOfflineCache(K.certificate, fn, { label: "El certificado" });
  if (!isOffline() || d.eligible) return d;
  const lessons = (await readOfflineCopy<{ lessons: { n: number; completed: boolean }[] }>(K.lessons))?.lessons ?? [];
  const pend = pendingLessonRefs();
  const doneHere = lessons.filter((l) => l.completed || pend.has(`guarani:${l.n}`)).length;
  const completed = Math.max(d.completed, doneHere);
  return { ...d, completed, eligible: d.required > 0 && completed >= d.required, offline: true };
}

export const Route = createFileRoute("/_authenticated/certificado")({
  head: () => ({ meta: [{ title: "Jaikuaa — Certificado" },
      { name: "description", content: "Consultá tu certificado del curso de Jaikuaa y los requisitos para obtenerlo." },
      { property: "og:title", content: "Jaikuaa — Certificado" },
      { property: "og:description", content: "Consultá tu certificado del curso de Jaikuaa y los requisitos para obtenerlo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: CertificadoPage,
});

function CertificadoPage() {
  const fn = useServerFn(getCertificateStatus);
  const issue = useServerFn(issueCertificate);
  const q = useQuery({
    queryKey: ["certificate-status"],
    queryFn: () => loadStatus(() => fn() as Promise<CertStatus>),
  });
  const [queued, setQueued] = useState<string | null>(() => pendingCertificateName());
  const d = q.data;
  const [typedName, setTypedName] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const name = d?.name || typedName.trim();
  useEffect(() => {
    if (!d?.code) return;
    QRCode.toDataURL(`https://www.jaikuaa.com/verificar/${d.code}`, { margin: 0, width: 240, color: { dark: "#1E3A5F" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [d?.code]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <style>{`@media print { @page { size: A4 landscape; margin: 12mm; } }`}</style>
      <header className="border-b border-border/50 print:hidden">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver al panel</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-8 sm:px-6 print:p-0">
        <div className="mx-auto max-w-4xl">
          {q.error ? (
            <p className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Sin conexión. Cuando tengas señal vas a ver acá cuántas lecciones te faltan para tu certificado.
            </p>
          ) : q.isLoading || !d ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !d.eligible ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant">
              <img src={jaiGraduado} alt="Jai con birrete y su diploma" className="mx-auto h-40 w-auto object-contain drop-shadow-xl" />
              <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Tu certificado te espera</h1>
              <p className="mt-2 text-muted-foreground">
                Completaste <span className="font-semibold text-foreground">{d.completed}</span> de{" "}
                <span className="font-semibold text-foreground">{d.required}</span> lecciones del Curso de Guaraní.
                Terminá todas para descargar tu certificado.
              </p>
              <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${d.required ? Math.round((d.completed / d.required) * 100) : 0}%` }}
                />
              </div>
              <Button asChild variant="cta" className="mt-6">
                <Link to="/curso/$lang" params={{ lang: "guarani" }}>
                  Seguir con el curso
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center gap-2 text-center print:hidden">
                <img src={jaiGraduado} alt="Jai con birrete y su diploma" className="h-36 w-auto object-contain drop-shadow-xl" />
                <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">¡Terminaste el curso!</h1>
              </div>
              {!d.name && (
                <div className="mx-auto mb-6 max-w-md print:hidden">
                  <label className="text-sm font-semibold">
                    Tu nombre completo, como querés que figure
                    <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} maxLength={80} className="mt-2" />
                  </label>
                </div>
              )}
              <div className="mb-6 flex justify-center gap-2 print:hidden">
                {d.code ? (
                  <Button variant="cta" onClick={() => window.print()}>
                    <Printer aria-hidden /> Descargar o imprimir
                  </Button>
                ) : queued ? (
                  <p className="max-w-md rounded-xl border border-primary/30 bg-primary/5 p-4 text-center text-sm text-foreground">
                    📜 ¡Lo ganaste! Tu certificado a nombre de <strong>{queued}</strong> se emite solo cuando vuelva la
                    señal. Después lo descargás desde esta misma pantalla.
                  </p>
                ) : isOffline() ? (
                  <Button
                    variant="cta"
                    disabled={!name}
                    onClick={() => {
                      queueCertificate(name);
                      setQueued(name);
                    }}
                  >
                    <BadgeCheck aria-hidden /> Pedir mi certificado
                  </Button>
                ) : (
                  <Button
                    variant="cta"
                    disabled={!name || issuing}
                    onClick={async () => {
                      setIssuing(true);
                      try {
                        await issue({ data: { name } });
                        await q.refetch();
                      } finally {
                        setIssuing(false);
                      }
                    }}
                  >
                    {issuing ? <Loader2 className="animate-spin" aria-hidden /> : <BadgeCheck aria-hidden />} Emitir mi certificado
                  </Button>
                )}
              </div>
              <p className="mb-4 text-center text-xs text-muted-foreground print:hidden">
                En el celular o la computadora, elegí "Guardar como PDF" en la ventana de impresión.
              </p>
              <article className="relative mx-auto aspect-[1.414/1] w-full rounded-2xl border-[10px] border-double border-primary/70 bg-white p-8 text-center text-neutral-900 shadow-elegant sm:p-12 print:shadow-none">
                <div className="flex justify-center">
                  <BrandLogo />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 sm:text-sm">
                  Certificado de finalización
                </p>
                <p className="mt-6 text-sm text-neutral-600 sm:text-base">Jaikuaa certifica que</p>
                <p className="mt-3 font-display text-3xl font-bold text-[#1E3A5F] sm:text-5xl">{name || "—"}</p>
                <p className="mx-auto mt-5 max-w-xl text-sm text-neutral-700 sm:text-base">
                  completó las {d.required} lecciones del Curso de Guaraní de la plataforma Jaikuaa.
                </p>
                <p className="mt-6 text-sm text-neutral-600">
                  {d.issuedAt
                    ? new Date(d.issuedAt).toLocaleDateString("es-PY", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "America/Asuncion",
                      })
                    : ""}
                </p>
                <div className="mx-auto mt-8 w-56 border-t border-neutral-400 pt-2 text-xs font-semibold text-neutral-700">
                  Plataforma Jaikuaa
                </div>
                {d.code && qr && (
                  <div className="absolute bottom-8 right-6 flex flex-col items-center sm:bottom-10 sm:right-10">
                    <img src={qr} alt="Código QR de verificación" className="h-16 w-16 sm:h-24 sm:w-24" />
                    <span className="mt-1 font-mono text-[9px] text-neutral-600 sm:text-xs">{d.code}</span>
                  </div>
                )}
                <p className="absolute inset-x-0 bottom-4 px-6 text-[10px] text-neutral-400">
                  {d.code ? `Verificá su autenticidad en jaikuaa.com/verificar/${d.code} · ` : ""}
                  Certificado de finalización de un curso en línea. No constituye un título oficial.
                </p>
              </article>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
