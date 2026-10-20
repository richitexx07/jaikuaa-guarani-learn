import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Send, X } from "lucide-react";
import { showsBottomNav } from "@/lib/bottom-nav";
import { JAI_FAQS, findFaq, whatsappLink, type JaiFaq } from "@/lib/jai-faq";
import jaiImg from "@/assets/jai-tradicional.png";

// En los juegos y en el panel de administración el botón molestaría, así que no se muestra.
const HIDDEN_PREFIXES = ["/juegos", "/admin", "/piloto-ateneo", "/certificado"];

type Msg =
  | { from: "jai"; text: string; faq?: JaiFaq; human?: string }
  | { from: "user"; text: string };

const GREETING: Msg = {
  from: "jai",
  text: "¡Hola! Soy Jai, el jaguareté de Jaikuaa. Tocá una pregunta o escribime tu consulta.",
};

/** Atención al cliente: Jai responde preguntas frecuentes y deriva a WhatsApp lo complejo. */
export function SupportWhatsApp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, open]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  const pos = showsBottomNav(pathname) ? "bottom-20 md:bottom-4" : "bottom-4";

  const answer = (faq: JaiFaq) =>
    setMsgs((m) => [
      ...m,
      { from: "user", text: faq.question },
      { from: "jai", text: faq.answer, faq, human: faq.escalate ? faq.question : undefined },
    ]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    const faq = findFaq(text);
    setMsgs((m) => [
      ...m,
      { from: "user", text },
      faq
        ? { from: "jai", text: faq.answer, faq, human: faq.escalate ? text : undefined }
        : {
            from: "jai",
            text: "Esa consulta merece que la vea una persona del equipo. Te paso directo por WhatsApp, ya con tu pregunta escrita.",
            human: text,
          },
    ]);
  };

  return (
    <div className={`fixed ${pos} right-4 z-40 print:hidden`}>
      {open && (
        <div
          role="dialog"
          aria-label="Atención al cliente con Jai"
          className="mb-3 flex h-[min(560px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <img src={jaiImg} alt="" className="h-10 w-10 rounded-full bg-background object-contain" />
            <div className="flex-1">
              <p className="text-base font-bold leading-tight">Jai · Atención</p>
              <p className="text-xs opacity-80">Respuestas al instante</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="rounded-full p-1.5 hover:bg-primary-foreground/15"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-3">
            {msgs.map((m, i) =>
              m.from === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {m.text}
                </div>
              ) : (
                <div key={i} className="max-w-[90%] space-y-2 rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm shadow-sm">
                  <p>{m.text}</p>
                  {m.faq?.link && (
                    <Link
                      to={m.faq.link.to}
                      onClick={() => setOpen(false)}
                      className="inline-block rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                    >
                      {m.faq.link.label} →
                    </Link>
                  )}
                  {m.human !== undefined && (
                    <a
                      href={whatsappLink(m.human)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:brightness-95"
                    >
                      <MessageCircle className="h-4 w-4" /> Hablar con una persona por WhatsApp
                    </a>
                  )}
                </div>
              ),
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {JAI_FAQS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => answer(f)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs hover:border-primary hover:text-primary"
                >
                  {f.question}
                </button>
              ))}
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#25D366] bg-card px-3 py-1.5 text-xs font-semibold text-[#128C7E]"
              >
                💬 Hablar con una persona
              </a>
            </div>
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-border bg-card p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta…"
              aria-label="Tu consulta"
              className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" aria-label="Enviar" className="rounded-full bg-primary p-2.5 text-primary-foreground hover:opacity-90">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir atención al cliente con Jai"
          className="ml-auto flex items-center gap-2 rounded-full bg-primary py-1.5 pl-1.5 pr-4 text-sm font-semibold text-primary-foreground shadow-lg transition hover:scale-105"
        >
          <img src={jaiImg} alt="" className="h-10 w-10 rounded-full bg-background object-contain" />
          <span className="hidden sm:inline">¿Consultas? Preguntale a Jai</span>
          <span className="sm:hidden">Jai</span>
        </button>
      )}
    </div>
  );
}
