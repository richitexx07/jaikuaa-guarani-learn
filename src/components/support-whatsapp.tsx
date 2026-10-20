import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronUp, MessageCircle, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { showsBottomNav } from "@/lib/bottom-nav";
import {
  JAI_CATEGORIES,
  JAI_FAQS,
  faqsForPath,
  findFaq,
  getFaq,
  suggestFaqs,
  whatsappLink,
  type JaiFaq,
} from "@/lib/jai-faq";
import { logJaiQuestion } from "@/lib/jai.functions";
import { JAI_OPEN_EVENT } from "@/lib/jai-events";
import jaiImg from "@/assets/jai-atencion-3d.webp";

// En los juegos y en el panel de administración el botón molestaría, así que no se muestra.
const HIDDEN_PREFIXES = ["/juegos", "/admin", "/piloto-ateneo", "/certificado"];


type Msg =
  | {
      id: number;
      from: "jai";
      text: string;
      lead?: string;
      faqId?: string;
      /** Texto para derivar a WhatsApp. */
      human?: string;
      /** «¿Te referís a…?» */
      options?: string[];
      rated?: "up" | "down";
    }
  | { id: number; from: "user"; text: string };

const LEADS = ["¡Buena pregunta! 😊", "¡Claro que sí! Te cuento:", "¡Con gusto te ayudo!", "¡Mirá qué fácil!"];
const STORE_KEY = "jaikuaa:jai-chat:v1";
const TEASER_KEY = "jaikuaa:jai-teaser:v1";

let nextId = 1;
const greeting = (): Msg => ({
  id: nextId++,
  from: "jai",
  text: "Soy Jai, el jaguareté de Jaikuaa 🐆. Estoy acá para darte una mano. Elegí una pregunta o escribime con tus palabras.",
  lead: "¡Hola! ¡Qué lindo que estés por acá!",
});

function loadChat(): Msg[] {
  if (typeof window === "undefined") return [greeting()];
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    const saved = raw ? (JSON.parse(raw) as Msg[]) : null;
    if (saved?.length) {
      nextId = Math.max(...saved.map((m) => m.id)) + 1;
      return saved;
    }
  } catch {}
  return [greeting()];
}

/** Atención al cliente: Jai responde preguntas frecuentes y deriva a WhatsApp lo complejo. */
export function SupportWhatsApp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const logFn = useServerFn(logJaiQuestion);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => [greeting()]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastQuestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // La conversación se mantiene mientras la pestaña esté abierta.
  useEffect(() => setMsgs(loadChat()), []);
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-30)));
    } catch {}
  }, [msgs]);

  // Lleva la vista al comienzo de la última pregunta, así la respuesta se lee desde arriba.
  useEffect(() => {
    if (!open || msgs.length < 2) return;
    const box = scrollRef.current;
    const el = lastQuestionRef.current;
    if (box && el) box.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  }, [msgs, typing, open]);

  // Al abrir, el cursor va al campo de texto; Esc cierra y devuelve el foco al botón.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const log = useCallback(
    (texto: string, resultado: "respondida" | "opciones" | "derivada" | "no-util", faqId: string | null) => {
      void logFn({ data: { texto, ruta: pathname, resultado, faqId } }).catch(() => {});
    },
    [logFn, pathname],
  );

  const reply = useCallback(
    (userText: string, faq: JaiFaq | null, opts?: { fromChip?: boolean }) => {
      if (typing) return;
      setShowAll(false);
      setMsgs((m) => [...m, { id: nextId++, from: "user", text: userText }]);
      setTyping(true);
      clearTimeout(timer.current);
      const options = faq ? [] : suggestFaqs(userText).map((f) => f.id);
      if (!opts?.fromChip) log(userText, faq ? "respondida" : options.length ? "opciones" : "derivada", faq?.id ?? null);
      // Jai «piensa» un poco más cuando la respuesta es larga, sin hacer esperar de más.
      const delay = Math.min(900, 350 + (faq?.answer.length ?? 120) * 1.5);
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
                faqId: faq.id,
                human: faq.escalate ? userText : undefined,
              }
            : options.length
              ? {
                  id: nextId++,
                  from: "jai",
                  lead: "Quiero entenderte bien 🤔",
                  text: "¿Te referís a alguna de estas? Si no, te paso con una persona del equipo.",
                  options,
                  human: userText,
                }
              : {
                  id: nextId++,
                  from: "jai",
                  lead: "¡Gracias por escribirme! 💙",
                  text: "Tu consulta merece la atención de una persona del equipo. Te paso directo a WhatsApp con tu pregunta ya escrita, así no tenés que repetir nada.",
                  human: userText,
                },
        ]);
      }, delay);
    },
    [typing, log],
  );

  // Otras partes de la app pueden abrir a Jai con una respuesta (por ejemplo, si un audio no suena).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const faqId = (e as CustomEvent<{ faqId?: string }>).detail?.faqId;
      setOpen(true);
      setTeaser(false);
      const faq = faqId ? getFaq(faqId) : undefined;
      if (faq) window.setTimeout(() => reply(faq.question, faq, { fromChip: true }), 150);
    };
    window.addEventListener(JAI_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(JAI_OPEN_EVENT, onOpen);
  }, [reply]);

  // Una sola vez por navegador, en la portada: Jai saluda con un globito a los 20 segundos.
  useEffect(() => {
    if (pathname !== "/") return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(TEASER_KEY) === "1";
    } catch {}
    if (seen) return;
    const t = window.setTimeout(() => {
      setTeaser(true);
      try {
        window.localStorage.setItem(TEASER_KEY, "1");
      } catch {}
    }, 20000);
    const hide = window.setTimeout(() => setTeaser(false), 32000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(hide);
    };
  }, [pathname]);

  const suggested = useMemo(() => faqsForPath(pathname), [pathname]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  const pos = showsBottomNav(pathname) ? "bottom-20 md:bottom-4" : "bottom-4";

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    reply(text, findFaq(text));
  };

  const rate = (msg: Extract<Msg, { from: "jai" }>, value: "up" | "down") => {
    const question = getFaq(msg.faqId ?? "")?.question;
    setMsgs((m) =>
      m.map((x) =>
        x.id === msg.id && x.from === "jai"
          ? { ...x, rated: value, human: value === "down" ? (x.human ?? question ?? "") : x.human }
          : x,
      ),
    );
    if (value === "down") log(question ?? "respuesta", "no-util", msg.faqId ?? null);
  };

  const lastUserIdx = msgs.map((m) => m.from).lastIndexOf("user");
  const lastIdx = msgs.length - 1;

  const chip = (f: JaiFaq) => (
    <button
      key={f.id}
      type="button"
      onClick={() => reply(f.question, f, { fromChip: true })}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
    >
      {f.question}
    </button>
  );

  return (
    <div className={`fixed ${pos} right-4 z-40 print:hidden`}>
      {open && (
        <div
          role="dialog"
          aria-label="Atención al cliente con Jai"
          className="jai-msg-in mb-3 flex h-[min(600px,calc(100dvh-8rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-lift"
        >
          <header className="jai-header relative flex items-center gap-3 overflow-hidden px-4 py-3 text-primary-foreground">
            <div className="relative">
              <img src={jaiImg} alt="" width={56} height={56} className="jai-breathe h-14 w-14 rounded-full bg-gradient-to-b from-accent/40 to-background object-cover object-top ring-2 ring-primary-foreground/40" />
              <span className="jai-whatsapp absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-primary" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="font-display text-base font-bold leading-tight">Jai · Atención</p>
              <p className="text-xs opacity-85">En línea · te respondo al instante</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Cerrar"
              className="rounded-full p-1.5 hover:bg-primary-foreground/15"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} aria-live="polite" className="relative flex-1 space-y-3 overflow-y-auto bg-muted/50 p-3">
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
                <div key={m.id} className="jai-msg-in jai-welcome flex flex-col items-center rounded-3xl px-3 pb-4 pt-2 text-center">
                  <img src={jaiImg} alt="Jai, el jaguareté de Jaikuaa" width={128} height={137} className="jai-float h-40 w-40 object-contain drop-shadow-2xl" />
                  <p className="mt-1 font-display text-lg font-bold text-primary">{m.lead}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                </div>
              ) : (
                <div key={m.id} className="jai-msg-in flex items-end gap-2">
                  <img src={jaiImg} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full bg-background object-cover object-top ring-1 ring-border shadow-sm" />
                  <div className="max-w-[85%] space-y-2 rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm leading-relaxed shadow-elegant">
                    {m.lead && <p className="font-semibold text-primary">{m.lead}</p>}
                    <p>{m.text}</p>
                    {m.options && m.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.options.map((id) => {
                          const f = getFaq(id);
                          return f ? chip(f) : null;
                        })}
                      </div>
                    )}
                    {(() => {
                      const f = m.faqId ? getFaq(m.faqId) : undefined;
                      return f?.link ? (
                        <Link
                          to={f.link.to}
                          onClick={() => setOpen(false)}
                          className="inline-block rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                        >
                          {f.link.label} →
                        </Link>
                      ) : null;
                    })()}
                    {m.human !== undefined && (
                      <a
                        href={whatsappLink(m.human, pathname)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="jai-whatsapp flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold hover:brightness-95"
                      >
                        <MessageCircle className="h-4 w-4" /> Hablar con una persona por WhatsApp
                      </a>
                    )}
                    {m.faqId && (
                      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                        {m.rated ? (
                          <span>{m.rated === "up" ? "¡Gracias! Me alegra ayudarte 🐆" : "Perdón. Te paso con una persona 👆"}</span>
                        ) : (
                          <>
                            <span>¿Te sirvió?</span>
                            <button type="button" onClick={() => rate(m, "up")} aria-label="Sí, me sirvió" className="rounded-full p-1 hover:bg-muted hover:text-primary">
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => rate(m, "down")} aria-label="No me sirvió" className="rounded-full p-1 hover:bg-muted hover:text-destructive">
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {i === lastIdx && m.faqId && !typing && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(getFaq(m.faqId)?.related ?? []).map((id) => {
                          const f = getFaq(id);
                          return f ? chip(f) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}

            {typing && (
              <div className="jai-msg-in flex items-end gap-2" aria-label="Jai está escribiendo">
                <img src={jaiImg} alt="" width={32} height={32} className="h-8 w-8 rounded-full bg-background object-cover object-top ring-1 ring-border" />
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-elegant">
                  <span className="jai-dot h-2 w-2 rounded-full bg-primary" />
                  <span className="jai-dot h-2 w-2 rounded-full bg-primary" />
                  <span className="jai-dot h-2 w-2 rounded-full bg-primary" />
                </div>
              </div>
            )}

            {!typing && (
              <div className="pt-1">
                {msgs.length === 1 && <div className="mb-2 flex flex-wrap gap-2">{suggested.map(chip)}</div>}
                <button
                  type="button"
                  onClick={() => setShowAll((s) => !s)}
                  className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
                  aria-expanded={showAll}
                >
                  {showAll ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Todas las preguntas frecuentes
                </button>
                {showAll && (
                  <div className="space-y-3" ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    {JAI_CATEGORIES.map((cat) => (
                      <div key={cat}>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{cat}</p>
                        <div className="flex flex-wrap gap-2">{JAI_FAQS.filter((f) => f.category === cat).map(chip)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <a
                  href={whatsappLink(undefined, pathname)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="jai-whatsapp-outline mt-2 inline-block rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"
                >
                  💬 Hablar con una persona
                </a>
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-border bg-card p-2.5">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              placeholder="Escribime tu consulta…"
              aria-label="Tu consulta"
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" aria-label="Enviar" disabled={!input.trim() || typing} className="rounded-full bg-primary p-2.5 text-primary-foreground hover:opacity-90 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {!open && teaser && (
        <div className="jai-msg-in mb-2 ml-auto w-fit max-w-[240px] rounded-2xl rounded-br-md bg-card px-3.5 py-2.5 text-sm shadow-lift">
          <button type="button" onClick={() => setTeaser(false)} aria-label="Cerrar saludo" className="float-right -mr-1 -mt-1 ml-2 rounded-full p-0.5 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
          <p>¡Hola! Soy Jai 👋 ¿Tenés alguna duda? Te respondo al instante.</p>
        </div>
      )}

      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => {
            setOpen(true);
            setTeaser(false);
          }}
          aria-label="Abrir atención al cliente con Jai"
          className="group relative ml-auto block h-20 w-20 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:h-24 sm:w-24"
        >
          <span className="jai-halo absolute inset-x-2 bottom-1 top-6 rounded-full" aria-hidden />
          <span className="absolute inset-x-1 bottom-0 h-14 rounded-full bg-primary shadow-lift ring-4 ring-background transition group-hover:scale-105 sm:h-16" aria-hidden />
          <img src={jaiImg} alt="" width={96} height={98} decoding="async" className="jai-float-c absolute inset-x-0 bottom-1 mx-auto h-20 w-20 object-contain drop-shadow-xl transition group-hover:scale-110 sm:h-24 sm:w-24" />
          <span className="jai-whatsapp absolute bottom-2 right-2 h-4 w-4 rounded-full ring-2 ring-background" aria-hidden />
        </button>
      )}
    </div>
  );
}
