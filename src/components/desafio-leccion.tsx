import { useEffect, useRef, useState } from "react";
import { MessageCircle, Swords, Trophy } from "lucide-react";
import { Compartir, useMiNombre } from "@/components/games/reto";
import { celebrate } from "@/lib/confetti";
import { GUEST_LESSONS } from "@/lib/guest-lessons";
import { compararDesafio, decodeDesafio, desafioUrl, leerAciertos, limpiarNombre, type Desafio } from "@/lib/desafio-leccion";

const KEY_NOMBRE = "jaikuaa:mi-nombre";

/** El desafío que trajo el enlace (?desafio=), solo si es de esta misma lección. */
export function useDesafioRecibido(n: number | undefined): Desafio | null {
  const [d, setD] = useState<Desafio | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || !n) return;
    const r = decodeDesafio(new URLSearchParams(window.location.search).get("desafio"));
    setD(r && r.l === n ? r : null);
  }, [n]);
  return d;
}

/** Arriba de la lección: quién te desafió y cuánto hizo. */
export function DesafioRecibido({ d }: { d: Desafio }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#F6C445] bg-[#FFF8DB] p-4 text-left text-[#13233F]">
      <Swords className="h-8 w-8 shrink-0 text-[#C98A00]" aria-hidden />
      <div>
        <p className="font-display text-lg font-bold leading-tight">{d.n} te desafía</p>
        <p className="text-sm">
          Hizo {d.p} de {d.t} respuestas bien en esta lección. ¿Podés superarlo?
        </p>
      </div>
    </div>
  );
}

/** Al terminar: tu puntaje, quién ganó (si vino desafiado) y el botón para desafiar por WhatsApp. */
export function DesafioCompartir({ lang, lesson, recibido }: { lang: string; lesson: { n: number; title: string }; recibido: Desafio | null }) {
  const deCuenta = useMiNombre();
  const [nombre, setNombre] = useState("");
  const [mio] = useState(() => leerAciertos(lang, lesson.n));
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(KEY_NOMBRE);
      if (guardado) { setNombre(guardado); return; }
    } catch { /* sin almacenamiento */ }
    if (deCuenta) setNombre(deCuenta);
  }, [deCuenta]);
  const resultado = recibido && mio.t > 0 ? compararDesafio(mio, recibido) : null;
  const festejado = useRef(false);
  useEffect(() => {
    if (resultado === "gane" && !festejado.current) { festejado.current = true; celebrate("big"); }
  }, [resultado]);

  if (mio.t === 0) return null;
  const limpio = limpiarNombre(nombre);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.jaikuaa.com";
  const url = desafioUrl(origin, lang, { n: limpio || "Tu amigo", p: mio.p, t: mio.t, l: lesson.n });
  const sinCuenta = (GUEST_LESSONS as readonly number[]).includes(lesson.n);
  const cierre = sinCuenta ? "No necesitás cuenta." : "Es gratis.";
  const texto =
    resultado === "gane" && recibido
      ? `¡Le gané a ${recibido.n} en la Lección ${lesson.n} de Jaikuaa! Hice ${mio.p} de ${mio.t} respuestas bien. ¿Vos te animás a superarme? ${cierre}\n${url}\n🇵🇾`
      : `Terminé la Lección ${lesson.n} de Jaikuaa («${lesson.title}») con ${mio.p} de ${mio.t} respuestas bien. ¿Te animás a superarme? ${cierre}\n${url}\n🇵🇾`;

  return (
    <div className="mt-6 space-y-3 rounded-2xl bg-[#EEF3FB] p-4 text-left text-[#13233F]">
      {resultado && recibido ? (
        <div className="text-center">
          <Trophy className="mx-auto h-9 w-9" style={{ color: resultado === "perdi" ? "#8A94A6" : "#E0A100" }} aria-hidden />
          <p className="mt-1 font-display text-2xl font-bold">
            {resultado === "gane" ? `¡Le ganaste a ${recibido.n}!` : resultado === "perdi" ? `${recibido.n} te ganó… ¡revancha!` : `¡Empate con ${recibido.n}!`}
          </p>
          <p className="text-sm opacity-75">
            Vos {mio.p} de {mio.t} · {recibido.n} {recibido.p} de {recibido.t}
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="font-display text-xl font-bold">Hiciste {mio.p} de {mio.t} respuestas bien</p>
          <p className="text-sm opacity-75">Desafiá a un amigo: le llega esta misma lección y ve tu puntaje.</p>
        </div>
      )}
      <label className="block text-sm font-semibold">
        Tu nombre (para que sepa quién lo desafía)
        <input
          value={nombre}
          maxLength={20}
          onChange={(e) => {
            setNombre(e.target.value);
            try { localStorage.setItem(KEY_NOMBRE, e.target.value); } catch { /* sin almacenamiento */ }
          }}
          placeholder="Tu nombre"
          className="mt-1 h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-base font-normal"
        />
      </label>
      {/* WhatsApp primero y bien grande: es por donde más se comparte en Paraguay. */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1FA855] font-display text-lg font-bold text-white shadow"
      >
        <MessageCircle className="h-6 w-6" aria-hidden /> Desafiar por WhatsApp
      </a>
      <Compartir url={url} texto={texto} titulo="Desafío de Jaikuaa" />
    </div>
  );
}
