import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Check, Delete, Send, Wand2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { getGameWords } from "@/lib/games.functions";
import { buildIndex, clean, isNasal, lastWord, PARES, type Fix } from "@/lib/limpiador";
import { PageHero } from "@/components/page-hero";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";
import jaiImg from "@/assets/jai-tradicional.webp";

export const Route = createFileRoute("/teclado")({
  head: () => ({
    meta: [
      { title: "Teclado Guaraní | Jaikuaa" },
      { name: "description", content: "Escribí en guaraní con vocales nasales, g̃ y puso en un toque, y mandalo por WhatsApp." },
      { property: "og:title", content: "Teclado Guaraní | Jaikuaa" },
      { property: "og:description", content: "Escribí & Mandá: el teclado guaraní de Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TecladoPage,
});

const NASALES = ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ", "g̃", "'"];
const DIGRAFOS = ["ch", "mb", "nd", "ng", "nt", "rr", "ñ"];
const ACENTOS = ["á", "é", "í", "ó", "ú", "ý"];

function TecladoPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fetchWords = useServerFn(getGameWords);
  const [words, setWords] = useState<string[] | null>(null);
  const [fixes, setFixes] = useState<Fix[] | null>(null);
  const [card, setCard] = useState<string | null>(null);
  useEffect(() => {
    fetchWords({ data: { lesson: null } }).then((r) => setWords(r.words.map((w) => w.gn))).catch(() => setWords([]));
  }, [fetchWords]);
  const index = useMemo(() => buildIndex(words ?? []), [words]);
  const prev = lastWord(text);
  const nasal = prev ? isNasal(prev) : false;

  function limpiar() {
    const r = clean(text, index);
    setText(r.text);
    setFixes(r.fixes);
  }
  function sufijo(s: string) {
    setText((t) => t.replace(/\s*$/, "") + s);
  }
  async function makeCard() {
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1920;
    const g = c.getContext("2d")!;
    const navy = "#1E3A5F", red = "#C8102E";
    g.fillStyle = navy; g.fillRect(0, 0, 1080, 1920);
    // ñandutí sutil
    g.strokeStyle = "rgba(255,255,255,0.08)"; g.lineWidth = 3;
    for (const [cx, cy] of [[160, 220], [920, 1700], [940, 260]]) {
      for (let r = 40; r <= 260; r += 44) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); }
      for (let a = 0; a < 24; a++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a * Math.PI / 12) * 260, cy + Math.sin(a * Math.PI / 12) * 260); g.stroke(); }
    }
    g.fillStyle = red; g.fillRect(0, 0, 1080, 24);
    g.fillStyle = "#ffffff"; g.fillRect(0, 24, 1080, 24);
    g.fillStyle = "#2B5BA8"; g.fillRect(0, 48, 1080, 24);
    // texto
    g.fillStyle = "#ffffff"; g.textAlign = "center";
    const size = text.length > 120 ? 54 : text.length > 60 ? 68 : 86;
    g.font = `700 ${size}px "Space Grotesk", sans-serif`;
    const lines: string[] = []; let line = "";
    for (const w of text.split(/\s+/)) {
      const t = line ? line + " " + w : w;
      if (g.measureText(t).width > 900 && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    const top = 560 - (lines.length * size * 1.25) / 2;
    lines.slice(0, 12).forEach((l, i) => g.fillText(l, 540, top + i * size * 1.25));
    const img = new Image(); img.src = jaiImg;
    await img.decode().catch(() => undefined);
    if (img.complete) g.drawImage(img, 240, 1000, 600, 600);
    g.font = `600 44px "Space Grotesk", sans-serif`;
    g.fillText("jaikuaa.com", 540, 1780);
    setCard(c.toDataURL("image/png"));
  }
  async function shareCard() {
    if (!card) return;
    const blob = await (await fetch(card)).blob();
    const file = new File([blob], "jaikuaa-tarjeta.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: "Desde Jaikuaa 🇵🇾" }); return; } catch { /* cancelado */ }
    }
    const a = document.createElement("a"); a.href = card; a.download = "jaikuaa-tarjeta.png"; a.click();
  }

  function insert(s: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + s + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus({ preventScroll: true });
      el?.setSelectionRange(start + s.length, start + s.length);
    });
  }
  function backspace() {
    const el = ref.current;
    const pos = el?.selectionStart ?? text.length;
    if (pos === 0) return;
    const chars = Array.from(text.slice(0, pos).normalize("NFC"));
    // g̃ es dos códigos: borrar ambos juntos
    let cut = 1;
    if (chars.length >= 2 && chars[chars.length - 1] === "\u0303") cut = 2;
    const before = chars.slice(0, -cut).join("");
    setText(before + text.slice(pos));
    requestAnimationFrame(() => { el?.focus({ preventScroll: true }); el?.setSelectionRange(before.length, before.length); });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sin permiso */ }
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;

  const Key = ({ k, wide }: { k: string; wide?: boolean }) => (
    <Button type="button" variant="outline" onPointerDown={(e) => e.preventDefault()} onClick={() => insert(k)}
      className={`h-12 text-lg font-bold ${wide ? "col-span-2" : ""}`}>{k}</Button>
  );

  return (
    <main className="mx-auto max-w-xl px-4 py-6 pb-28">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      <PageHero img={jaiBienvenida} imgAlt="Jai con su celular" title="Teclado Guaraní">
        Usá estas teclas para las letras del Achegety y después copiá o mandá por WhatsApp.
      </PageHero>

      <Textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} rows={5}
        placeholder="Mba'éichapa…" className="mt-4 text-lg" aria-label="Texto en guaraní" />

      <section className="mt-4 space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nasales y puso</p>
          <div className="grid grid-cols-4 gap-2">{NASALES.map((k) => <Key key={k} k={k} />)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dígrafos</p>
          <div className="grid grid-cols-4 gap-2">{DIGRAFOS.map((k) => <Key key={k} k={k} />)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acento (palabras llanas)</p>
          <div className="grid grid-cols-6 gap-2">{ACENTOS.map((k) => <Key key={k} k={k} />)}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button type="button" variant="outline" className="col-span-3 h-12" onPointerDown={(e) => e.preventDefault()} onClick={() => insert(" ")}>espacio</Button>
          <Button type="button" variant="outline" className="h-12" onPointerDown={(e) => e.preventDefault()} onClick={backspace} aria-label="Borrar"><Delete aria-hidden /> Borrar</Button>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => void copy()} disabled={!text}>{copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}</Button>
        <Button asChild disabled={!text}>
          <a href={text ? wa : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!text}><Send /> WhatsApp</a>
        </Button>
      </div>
      <section className="mt-6 space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><Wand2 className="h-5 w-5 text-primary" aria-hidden /> Ayudas mágicas</h2>
        <Button className="w-full" variant="secondary" onClick={limpiar} disabled={!text || !words}>
          <Wand2 /> Limpiador Guaraní (pusó y nasales)
        </Button>
        {fixes && (
          <p className="text-sm text-muted-foreground">
            {fixes.length === 0
              ? "No encontré nada para corregir con las palabras del corpus de Jaikuaa."
              : `Corregí ${fixes.length}: ` + fixes.map((f) => `${f.from} → ${f.to}`).join(", ")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Solo usa palabras del corpus de Jaikuaa, que está en revisión por docentes especialistas. Si una palabra no está en el corpus, la deja igual.</p>

        {prev && (
          <div>
            <p className="mb-1 text-sm text-foreground">
              Armonía nasal para «{prev}»: {nasal ? "suena nasal → usá la forma nasal" : "suena oral → usá la forma oral"}
            </p>
            <div className="flex flex-wrap gap-2">
              {PARES.map((p) => {
                const s = nasal ? p.nasal : p.oral;
                return (
                  <Button key={p.oral} size="sm" variant="outline" onClick={() => sufijo(s)}>
                    -{s} <span className="text-xs text-muted-foreground">({p.sentido})</span>
                  </Button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Regla general orientativa; ante dudas, consultá con tu docente.</p>
          </div>
        )}

        <Button className="w-full" onClick={() => void makeCard()} disabled={!text}>
          <ImageIcon /> Crear tarjeta con Jai
        </Button>
        {card && (
          <div className="space-y-2">
            <img src={card} alt="Tarjeta con tu frase y Jai" className="mx-auto w-48 rounded-lg shadow" />
            <Button className="w-full" variant="secondary" onClick={() => void shareCard()}><Send /> Compartir o guardar</Button>
          </div>
        )}
      </section>

      <div className="mt-6 rounded-lg border bg-card p-4 text-center">
        <p className="text-sm text-foreground">¿Querés aprender guaraní jugando? Es gratis para paraguayos.</p>
        <Link to="/comenzar" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">Creá tu cuenta gratis →</Link>
      </div>
    </main>
  );
}
