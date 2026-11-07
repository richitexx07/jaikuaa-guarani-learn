/**
 * «Compartí tu canción»: la tarjeta con el resultado y, si se cantó con micrófono, el audio con la voz
 * y el arpa. En el celular abre el menú de compartir (WhatsApp, Instagram, Facebook…) con los archivos;
 * donde no se puede, quedan WhatsApp con el enlace y los botones para bajar los archivos.
 */
import { useEffect, useState } from "react";
import { Download, MessageCircle, Share2 } from "lucide-react";
import { useJU } from "@/lib/i18n-juegos-ui";
import { dibujarTarjeta } from "./tarjeta";
import { JAI_KARAOKE, K } from "./escenario";

const ENLACE = "https://www.jaikuaa.com/juegos/karaoke?de=karaoke";

function nombreArchivo(cancion: string, ext: string) {
  const base = cancion.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "cancion";
  return `jaikuaa-karaoke-${base}.${ext}`;
}

export function CompartirCancion({
  cancion,
  estrellas,
  detalle,
  audio,
  mezclando,
}: {
  cancion: string;
  estrellas: number;
  detalle: string;
  audio: Blob | null;
  mezclando: boolean;
}) {
  const tt = useJU();
  const [tarjeta, setTarjeta] = useState<Blob | null>(null);
  const [verTarjeta, setVerTarjeta] = useState<string | null>(null);
  const [verAudio, setVerAudio] = useState<string | null>(null);
  const [puedeArchivos, setPuedeArchivos] = useState(false);

  useEffect(() => {
    let vivo = true;
    let u: string | null = null;
    void dibujarTarjeta({ titulo: tt("kkTarjetaTitulo"), cancion, estrellas, detalle, cta: tt("kkMeGanas"), jai: JAI_KARAOKE.festeja }).then((b) => {
      if (!vivo || !b) return;
      setTarjeta(b);
      u = URL.createObjectURL(b);
      setVerTarjeta(u);
    });
    return () => { vivo = false; if (u) URL.revokeObjectURL(u); };
  }, [cancion, estrellas, detalle]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!audio) return;
    const u = URL.createObjectURL(audio);
    setVerAudio(u);
    return () => URL.revokeObjectURL(u);
  }, [audio]);

  const archivos = (): File[] => {
    const f: File[] = [];
    if (tarjeta) f.push(new File([tarjeta], nombreArchivo(cancion, "png"), { type: "image/png" }));
    if (audio) f.push(new File([audio], nombreArchivo(cancion, "wav"), { type: "audio/wav" }));
    return f;
  };

  useEffect(() => {
    try {
      const f = archivos();
      setPuedeArchivos(f.length > 0 && typeof navigator.canShare === "function" && navigator.canShare({ files: f }));
    } catch {
      setPuedeArchivos(false);
    }
  }, [tarjeta, audio]); // eslint-disable-line react-hooks/exhaustive-deps

  const texto = `${tt("kkCompTexto", { n: cancion })} ${ENLACE}`;

  async function compartir() {
    const f = archivos();
    try {
      // Algunos celulares no aceptan imagen y audio juntos: se prueba con los dos y, si no, solo la tarjeta.
      if (f.length > 1 && !navigator.canShare({ files: f })) f.splice(1);
      await navigator.share({ files: f, text: texto });
    } catch {
      /* canceló o no se pudo: no pasa nada */
    }
  }

  return (
    <div className="rounded-3xl bg-white/[.07] p-5 text-left ring-1 ring-white/10">
      <p className="flex items-center gap-2 font-display text-lg font-bold"><Share2 className="h-5 w-5" style={{ color: K.oro }} /> {tt("kkCompTitulo")}</p>
      <p className="mb-4 text-sm text-white/70">{tt("kkCompInfo")}</p>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
        {verTarjeta ? (
          <img src={verTarjeta} alt={tt("kkTarjetaTitulo")} className="mx-auto w-44 rounded-2xl shadow-2xl ring-1 ring-white/15 sm:w-full" />
        ) : (
          <div className="mx-auto aspect-[4/5] w-44 animate-pulse rounded-2xl bg-white/10 sm:w-full" />
        )}
        <div className="space-y-3">
          {mezclando && <p className="text-sm text-white/75">{tt("kkMezclando")}</p>}
          {verAudio && (
            <div>
              <p className="mb-1 text-sm font-semibold" style={{ color: K.oro }}>{tt("kkTuCancion")}</p>
              <audio className="w-full" controls src={verAudio} />
            </div>
          )}
          {puedeArchivos && (
            <button
              type="button"
              onClick={() => void compartir()}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold shadow-lg transition active:scale-[.98]"
              style={{ background: K.oro, color: K.noche }}
            >
              <Share2 className="h-5 w-5" /> {tt("kkCompBtn")}
            </button>
          )}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1FA855] font-bold text-white"
          >
            <MessageCircle className="h-5 w-5" /> WhatsApp
          </a>
          <div className="grid grid-cols-2 gap-2">
            {verTarjeta && (
              <a href={verTarjeta} download={nombreArchivo(cancion, "png")} className="flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ring-1 ring-white/25">
                <Download className="h-4 w-4" /> {tt("kkBajarTarjeta")}
              </a>
            )}
            {verAudio && (
              <a href={verAudio} download={nombreArchivo(cancion, "wav")} className="flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ring-1 ring-white/25">
                <Download className="h-4 w-4" /> {tt("kkBajarCancion")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
