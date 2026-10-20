import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, MessageCircle, Send, X } from "lucide-react";
import { showsBottomNav } from "@/lib/bottom-nav";
import { JAI_FAQS, findFaq, whatsappLink, type JaiFaq } from "@/lib/jai-faq";
import jaiImg from "@/assets/jai-atencion.png";

// En los juegos y en el panel de administración el botón molestaría, así que no se muestra.
const HIDDEN_PREFIXES = ["/juegos", "/admin", "/piloto-ateneo", "/certificado"];

type Msg =
  | { id: number; from: "jai"; text: string; lead?: string; faq?: JaiFaq; human?: string }
  | { id: number; from: "user"; text: string };

const LEADS = ["¡Buena pregunta! 😊", "¡Claro que sí! Te cuento:", "¡Con gusto te ayudo!", "¡Mirá qué fácil!"];

let nextId = 1;
const greeting = (): Msg => ({
  id: nextId++,
  from: "jai",
  text: "Soy Jai, el jaguareté de Jaikuaa 🐆. Estoy acá para darte una mano con lo que necesités. Elegí una pregunta o escribime con tus palabras.",
  lead: "¡Hola! ¡Qué lindo que estés por acá!",
});

/** Atención al cliente: Jai responde preguntas frecuentes y deriva a WhatsApp lo complejo. */
export function SupportWhatsApp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => [greeting()]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastQuestionRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Lleva la vista al comienzo de la última pregunta, así la respuesta se lee desde arriba.
  useEffect(() => {
    if (!open || msgs.length < 2) return;
    const box = scrollRef.current;
    const el = lastQuestionRef.current;
    if (box && el) box.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  }, [msgs, typing, open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  const pos = showsBottomNav(pathname) ? "bottom-20 md:bottom-4" : "bottom-4";

  const reply = (userText: string, faq: JaiFaq | null) => {
    if (typing) return;
    setShowChips(false);
    setMsgs((m) => [...m, { id: nextId++, from: "user", text: userText }]);
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [
        ...m,
        faq
          ? {
              id: nextId++,
              from: "jai",
              lead: LEADS[m.length % LEADS.length],
              text: faq.answer,
              faq,
              human: faq.escalate ? userText : undefined,
            }
          : {
              id: nextId++,
              from: "jai",
              lead: "¡Gracias por escribirme! 💙",
              text: "Tu consulta merece la atención de una persona del equipo. Te paso directo a WhatsApp con tu pregunta ya escrita, así no tenés que repetir nada.",
              human: userText,
            },
      ]);
    }, 650);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    reply(text, findFaq(text));
  };

  const lastUserIdx = msgs.map((m) => m.from).lastIndexOf("user");

  return (
    <div className={`fixed ${pos} right-4 z-40 print:hidden`}>
      {open && (
        <div
          role="dialog"
          aria-label="Atención al cliente con Jai"
          className="jai-msg-in mb-3 flex h-[min(580px,calc(100dvh-8rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-lift"
        >
          <header className="flex items-center gap-3 bg-gradient-to-br from-primary to-primary/85 px-4 py-3 text-primary-foreground">
            <div className="relative">
              <img src={jaiImg} alt="" className="jai-wave h-12 w-12 rounded-full bg-background object-cover object-top ring-2 ring-primary-foreground/40" />
              <span className="jai-whatsapp absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-primary" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="font-display text-base font-bold leading-tight">Jai · Atención</p>
              <p className="text-xs opacity-85">En línea · te respondo al instante</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-full p-1.5 hover:bg-primary-foreground/15">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="relative flex-1 space-y-3 overflow-y-auto bg-muted/50 p-3">
            {msgs.map((m, i) =>
              m.from === "user" ? (
                <div
                  key={m.id}
                  ref={i === lastUserIdx ? lastQuestionRef : undefined}
                  className="jai-msg-in ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground shadow-sm"
                >
                  {m.text}
                </div>
              ) : i === 0 ? (
                <div key={m.id} className="jai-msg-in flex flex-col items-center px-2 pt-1 text-center">
                  <img src={jaiImg} alt="Jai, el jaguareté de Jaikuaa" className="jai-wave h-32 w-32 object-contain drop-shadow-xl" />
                  <p className="mt-1 font-display text-lg font-bold text-primary">{m.lead}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                </div>
              ) : (
                <div key={m.id} className="jai-msg-in flex items-end gap-2">
                  <img src={jaiImg} alt="" className="h-8 w-8 shrink-0 rounded-full bg-background object-cover object-top ring-1 ring-border shadow-sm" />
                  <div className="max-w-[85%] space-y-2 rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm leading-relaxed shadow-elegant">
                    {m.lead && <p className="font-semibold text-primary">{m.lead}</p>}
                    <p>{m.text}</p>
                    {m.faq?.link && (
                      <Link
                        to={m.faq.link.to}
                        onClick={() => setOpen(false)}
                        className="inline-block rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                      >
                        {m.faq.link.label} →
                      </Link>
                    )}
                    {m.human !== undefined && (
                      <a
                        href={whatsappLink(m.human)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="jai-whatsapp flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold hover:brightness-95"
                      >
                        <MessageCircle className="h-4 w-4" /> Hablar con una persona por WhatsApp
                      </a>
                    )}
                    {i > 0 && i === msgs.length - 1 && (
                      <p className="pt-1 text-xs text-muted-foreground">¿Te ayudo con algo más? Estoy acá 🤗</p>
                    )}
                  </div>
                </div>
              ),
            )}

            {typing && (
              <div className="jai-msg-in flex items-end gap-2" aria-label="Jai está escribiendo">
                <img src={jaiImg} alt="" className="h-8 w-8 rounded-full bg-background object-cover object-top ring-1 ring-border" />
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-elegant">
                  <span className="jai-dot h-2 w-2 rounded-full bg-primary" />
                  <span className="jai-dot h-2 w-2 rounded-full bg-primary" />
                  <span className="jai-dot h-2 w-2 rounded-full bg-primary" />
                </div>
              </div>
            )}

            {!typing && (
              <div className="pt-1">
                <button
                  onClick={() => setShowChips((s) => !s)}
                  className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
                >
                  {showChips ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {msgs.length > 1 ? "Otras preguntas frecuentes" : "Preguntas frecuentes"}
                </button>
                {showChips && (
                  <div className="flex flex-wrap gap-2">
                    {JAI_FAQS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => reply(f.question, f)}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                      >
                        {f.question}
                      </button>
                    ))}
                    <a
                      href={whatsappLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jai-whatsapp-outline rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"
                    >
                      💬 Hablar con una persona
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-border bg-card p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribime tu consulta…"
              aria-label="Tu consulta"
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
          className="ml-auto flex items-center gap-2 rounded-full bg-primary py-1.5 pl-1.5 pr-4 text-sm font-semibold text-primary-foreground shadow-lift transition hover:scale-105"
        >
          <img src={jaiImg} alt="" className="jai-wave h-12 w-12 rounded-full bg-background object-cover object-top ring-2 ring-primary-foreground/50" />
          <span className="hidden sm:inline">¿Te ayudo? Soy Jai</span>
          <span className="sm:hidden">Jai</span>
        </button>
      )}
    </div>
  );
}
