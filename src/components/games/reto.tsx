import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, MessageCircle, Share2, Swords, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { crearReto, guardarResultadoReto, verReto, verRetoPublico, type RetoGuardado, type RetoResultado } from "@/lib/reto.functions";
import { useIsGuest } from "@/lib/guest";
import { rememberAfterLogin } from "@/lib/after-login";
import { decodeReto, newSeed, RETO_NOMBRE, RETO_RUTA, retoUrl, veredicto, type RetoJuego } from "@/lib/reto";
import { celebrate } from "@/lib/confetti";

const INK = "#13233F";

/** Primer nombre de la cuenta, para firmar el reto. */
export function useMiNombre(): string {
  const [n, setN] = useState("");
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const full = (u?.user_metadata?.full_name as string | undefined) ?? u?.email?.split("@")[0] ?? "";
      setN(full.trim().split(/\s+/)[0]?.slice(0, 16) ?? "");
    });
  }, []);
  return n;
}

/** Un reto activo: guardado en la base (con su tabla) o de los enlaces viejos (solo el puntaje de quien retó). */
export type RetoActivo = {
  id?: string;
  /** Semilla */
  s: number;
  /** Dato extra (lección, canción, categoría) */
  x?: string;
  /** Quién retó */
  n: string;
  /** Puntaje máximo */
  t: number;
  u?: string;
  m?: boolean;
  /** Puntaje de quien retó (enlaces viejos) */
  p?: number;
  resultados?: RetoResultado[];
  miPuntaje?: number | null;
  creadorEsYo?: boolean;
};

export type MetaReto = { total: number; unidad?: string; menosEsMejor?: boolean };

const ID_RE = /^[A-Za-z0-9]{6,12}$/;

function retoParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("reto");
}

function ponerRetoEnLaUrl(id: string | null) {
  if (typeof window === "undefined") return;
  const u = new URL(window.location.href);
  if (id) u.searchParams.set("reto", id);
  else u.searchParams.delete("reto");
  window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
}

function desdeGuardado(r: RetoGuardado): RetoActivo {
  return {
    id: r.id,
    s: r.semilla,
    x: r.extra ?? undefined,
    n: r.creador,
    t: r.total,
    u: r.unidad ?? undefined,
    m: r.menos,
    resultados: r.resultados,
    miPuntaje: r.miPuntaje,
    creadorEsYo: r.creadorEsYo,
  };
}

export function retoLink(juego: RetoJuego, id: string, extra?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.jaikuaa.com";
  const path = juego === "trivia" && extra ? `/trivia/${encodeURIComponent(extra)}` : RETO_RUTA[juego];
  return `${origin}${path}?reto=${id}`;
}

export function puntajeDe(r: Pick<RetoActivo, "t" | "u">, p: number) {
  return r.u ? `${p} ${r.u}` : `${p} de ${r.t}`;
}

/**
 * La partida actual. Si entraste por un reto, usa su semilla (la misma partida que tus amigos);
 * si no, una nueva. `crear()` arma un reto con esta partida para invitar amigos (antes o después
 * de jugar) y `otra()` arranca otra partida dejando el reto atrás.
 */
export function useRetoPartida(juego: RetoJuego, meta: MetaReto) {
  const qc = useQueryClient();
  const verConCuenta = useServerFn(verReto);
  const verSinCuenta = useServerFn(verRetoPublico);
  const esInvitado = useIsGuest();
  const verFn = esInvitado ? verSinCuenta : verConCuenta;
  const crearFn = useServerFn(crearReto);
  const inicial = useRef(retoParam());
  const legacy = inicial.current && !ID_RE.test(inicial.current) ? decodeReto(inicial.current) : null;
  const [id, setId] = useState<string | null>(() => (inicial.current && ID_RE.test(inicial.current) ? inicial.current : null));
  const [viejo, setViejo] = useState<RetoActivo | null>(() =>
    legacy && legacy.j === juego ? { s: legacy.s, x: legacy.x, n: legacy.n, t: legacy.t, u: legacy.u, m: !!legacy.m, p: legacy.p } : null,
  );
  const [seedLocal, setSeedLocal] = useState<number>(() => viejo?.s ?? newSeed());

  const q = useQuery({
    queryKey: ["reto", id, esInvitado],
    enabled: !!id,
    queryFn: () => verFn({ data: { id: id! } }),
    refetchInterval: 20_000,
    retry: 1,
  });
  const guardado = q.data?.reto && q.data.reto.juego === juego ? desdeGuardado(q.data.reto) : null;
  const reto: RetoActivo | null = id ? guardado : viejo;
  const seed = guardado?.s ?? seedLocal;
  const cargando = !!id && q.isLoading;
  const noExiste = !!id && !q.isLoading && !guardado;

  const otra = useCallback((): number => {
    const s = newSeed();
    setId(null);
    setViejo(null);
    setSeedLocal(s);
    ponerRetoEnLaUrl(null);
    return s;
  }, []);

  /** Crea un reto con una partida (nueva, o la que acabás de jugar con tu puntaje). Devuelve el enlace. */
  const crear = useCallback(
    async (opts: { extra?: string; total?: number; puntaje?: number; mismaPartida?: boolean } = {}): Promise<string | null> => {
      const s = opts.mismaPartida ? seed : newSeed();
      try {
        const { id: nuevo } = await crearFn({
          data: {
            juego,
            semilla: s,
            extra: opts.extra,
            total: opts.total ?? meta.total,
            unidad: meta.unidad,
            menos: !!meta.menosEsMejor,
            puntaje: opts.puntaje,
          },
        });
        setViejo(null);
        setSeedLocal(s);
        setId(nuevo);
        ponerRetoEnLaUrl(nuevo);
        void qc.invalidateQueries({ queryKey: ["reto", nuevo] });
        return retoLink(juego, nuevo, opts.extra);
      } catch (e) {
        toast.error(e instanceof Error && e.message ? e.message : "No se pudo crear el reto.");
        return null;
      }
    },
    [crearFn, juego, meta.total, meta.unidad, meta.menosEsMejor, qc, seed],
  );

  const actualizar = useCallback((r: RetoGuardado) => qc.setQueryData(["reto", r.id, false], { reto: r }), [qc]);

  return { juego, meta, reto, seed, cargando, noExiste, otra, crear, actualizar };
}

export type Partida = ReturnType<typeof useRetoPartida>;

/** Mensaje para invitar. */
function invitacion(juego: RetoJuego, url: string, puntaje?: string) {
  return puntaje
    ? `¡Te reto en ${RETO_NOMBRE[juego]} de Jaikuaa! Hice ${puntaje}. Jugá la misma partida y a ver si me ganás:\n${url}`
    : `¡Te reto en ${RETO_NOMBRE[juego]} de Jaikuaa! Jugamos la misma partida, cada uno cuando pueda, y gana el que hace más:\n${url}`;
}

/**
 * Botones para compartir: el menú del celular (ahí aparecen Instagram, Facebook, Messenger,
 * Telegram y todo lo que tenga instalado), WhatsApp, Facebook y copiar el enlace.
 */
export function Compartir({ url, texto, titulo = "Jaikuaa", oscuro = false }: { url: string; texto: string; titulo?: string; oscuro?: boolean }) {
  const [puedeNativo, setPuedeNativo] = useState(false);
  useEffect(() => setPuedeNativo(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);
  const btn = `flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${oscuro ? "ring-1 ring-white/30 text-white" : "ring-1 ring-black/15"}`;
  return (
    <div className="space-y-2">
      {puedeNativo && (
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
          style={{ background: INK }}
          onClick={() => void navigator.share({ title: titulo, text: texto, url }).catch(() => {})}
        >
          <Share2 className="h-5 w-5" aria-hidden /> Compartir (Instagram, Facebook y más)
        </button>
      )}
      <div className="grid grid-cols-3 gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(texto.includes(url) ? texto : `${texto}\n${url}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#1FA855] text-sm font-bold text-white">
          <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#1877F2] text-sm font-bold text-white">
          Facebook
        </a>
        <button
          type="button"
          className={btn}
          onClick={() => {
            void navigator.clipboard?.writeText(url);
            toast.success("Enlace copiado. Pegalo en Instagram, Facebook o donde quieras.");
          }}
        >
          <Copy className="h-4 w-4" aria-hidden /> Copiar
        </button>
      </div>
      {!puedeNativo && <p className={`text-center text-[11px] ${oscuro ? "text-white/70" : "opacity-60"}`}>Para Instagram: copiá el enlace y pegalo en un mensaje o en tu historia.</p>}
    </div>
  );
}

function Tabla({ r, max = 5 }: { r: RetoActivo; max?: number }) {
  const lista = r.resultados ?? [];
  if (!lista.length) return <p className="text-sm opacity-70">Todavía nadie terminó la partida. ¡Sé el primero!</p>;
  return (
    <ol className="space-y-1">
      {lista.slice(0, max).map((x, k) => (
        <li key={k} className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-sm ${x.mio ? "bg-[#FFF3C4] font-bold" : "bg-[#EEF3FB]"}`}>
          <span className="truncate">{k + 1}. {x.mio ? "Vos" : x.nombre}</span>
          <span className="tabular-nums">{puntajeDe(r, x.puntaje)}</span>
        </li>
      ))}
      {lista.length > max && <li className="text-center text-xs opacity-60">y {lista.length - max} más</li>}
    </ol>
  );
}

/**
 * Arriba del juego: si entraste por un reto, de quién es y cómo va la tabla; si no, el botón
 * para retar a tus amigos ANTES de jugar.
 */
export function RetoBanner({ partida, extra, total, coincide = true, className = "", onJugar }: { partida: Partida; extra?: string; total?: number; coincide?: boolean; className?: string; onJugar?: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const r = coincide ? partida.reto : null;
  const guest = useIsGuest();

  // Sin cuenta: no se arman tablas, pero si llegó por el reto de un amigo, se le muestra quién lo retó.
  if (guest && !r && !partida.cargando) return null;

  if (partida.cargando) {
    return (
      <div className={`mx-auto flex max-w-xl items-center gap-2 rounded-2xl bg-white p-3 text-sm shadow-lg ${className}`} style={{ color: INK }}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando el reto…
      </div>
    );
  }

  if (r) {
    const link = r.id ? retoLink(partida.juego, r.id, r.x) : null;
    return (
      <div data-reto-banner className={`mx-auto max-w-xl rounded-2xl bg-white p-3 shadow-lg ${className}`} style={{ color: INK }} role="status">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: "#F6C445" }} aria-hidden>
            <Swords className="h-5 w-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm leading-snug">
            {r.id ? (
              r.creadorEsYo ? <>Tu reto está listo. Jugá la partida: tus amigos juegan la misma.</> : <><b>{r.n}</b> te retó. Jugá la misma partida y ganale.</>
            ) : (
              <><b>{r.n}</b> te retó: hizo <b>{puntajeDe(r, r.p ?? 0)}</b>. Jugá la misma partida y ganale.</>
            )}
          </p>
          {link && (
            <button type="button" onClick={() => setAbierto((v) => !v)} className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold ring-1 ring-black/15">
              Invitar
            </button>
          )}
        </div>
        {/* Quien llega por un reto entra a jugar con un toque (en los juegos que tienen pantalla de inicio). */}
        {onJugar && (
        <button
          type="button"
          onClick={onJugar}
          className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold text-white shadow-lg transition active:scale-[.98]"
          style={{ background: "#0B2545" }}
        >
          <Swords className="h-5 w-5" aria-hidden /> {r.creadorEsYo ? "Jugar la partida" : `Aceptar el reto de ${r.n}`}
        </button>
        )}
        {r.id && (r.resultados?.length ?? 0) > 0 && (
          <div className="mt-2">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold opacity-70"><Users className="h-3.5 w-3.5" aria-hidden /> {r.resultados!.length} ya jugaron</p>
            <Tabla r={r} max={3} />
          </div>
        )}
        {abierto && link && (
          <div className="mt-3">
            <Compartir url={link} texto={invitacion(partida.juego, link)} />
          </div>
        )}
      </div>
    );
  }

  // Sin reto: retar a los amigos antes de jugar.
  return (
    <div className={`mx-auto max-w-xl rounded-2xl bg-white/95 p-3 shadow-lg ${className}`} style={{ color: INK }}>
      {!url ? (
        <button
          type="button"
          disabled={creando}
          onClick={async () => {
            setCreando(true);
            const u = await partida.crear({ extra, total });
            setCreando(false);
            if (u) {
              setUrl(u);
              setAbierto(true);
            }
          }}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1FA855] text-white" aria-hidden>
            {creando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-bold leading-tight">Jugar con amigos</span>
            <span className="block text-xs opacity-75">Por turnos: cada uno juega su partida cuando puede y se arma una tabla.</span>
          </span>
          <Share2 className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
        </button>
      ) : (
        <Compartir url={url} texto={invitacion(partida.juego, url)} />
      )}
    </div>
  );
}

/**
 * Al terminar: se guarda tu puntaje en el reto y se ve la tabla; si no había reto, se ofrece
 * retar a tus amigos con esta misma partida.
 */
export function RetoFinal({
  partida,
  puntaje,
  total,
  extra,
  coincide = true,
  className = "",
}: {
  partida: Partida;
  puntaje: number;
  total?: number;
  extra?: string;
  coincide?: boolean;
  className?: string;
}) {
  const guardarFn = useServerFn(guardarResultadoReto);
  const guest = useIsGuest();
  const r = coincide ? partida.reto : null;
  const [url, setUrl] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const enviado = useRef(false);
  const { juego, meta } = partida;
  const t = total ?? meta.total;
  const vista: RetoActivo = r ?? { s: partida.seed, n: "", t, u: meta.unidad, m: meta.menosEsMejor };
  const mio = puntajeDe(vista, puntaje);

  // Guardar mi resultado en el reto (una sola vez; cuenta el primer intento).
  useEffect(() => {
    if (!r?.id || enviado.current) return;
    enviado.current = true;
    void guardarFn({ data: { id: r.id, puntaje } }).then((res) => { if (res.reto) partida.actualizar(res.reto); }).catch(() => {});
  }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const link = r?.id ? retoLink(juego, r.id, r.x ?? extra) : url;
  const yaJugado = r?.id && r.miPuntaje !== null && r.miPuntaje !== undefined && r.miPuntaje !== puntaje;

  // Enlaces viejos: comparación contra quien retó.
  const v = r && !r.id && r.p !== undefined ? veredicto(puntaje, { p: r.p, m: r.m ? 1 : undefined }) : null;

  if (guest) {
    return <RetoInvitado partida={partida} puntaje={puntaje} total={t} extra={extra} legado={r && !r.id ? r : r?.id ? (() => { const c = r.resultados?.find((x) => x.nombre === r.n); return c ? { ...r, p: c.puntaje } : null; })() : null} className={className} />;
  }

  return (
    <div className={`mx-auto w-full max-w-md space-y-3 rounded-3xl bg-white p-4 text-left shadow-xl ${className}`} style={{ color: INK }}>
      {r?.id ? (
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold"><Trophy className="h-5 w-5 text-[#E0A100]" aria-hidden /> Tabla del reto</p>
          {yaJugado && <p className="mb-1 text-xs opacity-70">En la tabla cuenta tu primer intento ({puntajeDe(r, r.miPuntaje!)}).</p>}
          <div className="mt-2"><Tabla r={r} max={10} /></div>
        </div>
      ) : v ? (
        <div className="text-center">
          <Trophy className="mx-auto h-8 w-8" style={{ color: v === "perdi" ? "#8A94A6" : "#E0A100" }} aria-hidden />
          <p className="mt-1 font-display text-2xl font-bold">{v === "gane" ? `¡Le ganaste a ${r!.n}!` : v === "perdi" ? `${r!.n} te ganó` : `Empate con ${r!.n}`}</p>
          <p className="text-sm opacity-75">Vos {mio} · {r!.n} {puntajeDe(r!, r!.p!)}</p>
        </div>
      ) : null}

      <div>
        <p className="font-display text-lg font-bold">{r?.id ? "Invitá a más amigos" : "Retá a tus amigos"}</p>
        <p className="text-sm opacity-75">
          {r?.id ? "Cada uno juega esta misma partida cuando quiera y aparece en la tabla." : "Les llega esta misma partida. Juegan cuando quieran y se arma una tabla con todos."}
        </p>
        <div className="mt-3">
          {link ? (
            <Compartir url={link} texto={invitacion(juego, link, r?.id ? undefined : mio)} />
          ) : (
            <button
              type="button"
              disabled={creando}
              onClick={async () => {
                setCreando(true);
                const u = await partida.crear({ extra, total: t, puntaje, mismaPartida: true });
                setCreando(false);
                if (u) setUrl(u);
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1FA855] font-bold text-white"
            >
              {creando ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Swords className="h-5 w-5" aria-hidden />} Retar con esta partida
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const KEY_NOMBRE = "jaikuaa:mi-nombre";

/**
 * Sin cuenta también se reta: el enlace lleva la partida y el puntaje (no se guarda nada en la base).
 * Si entró por el reto de un amigo, primero ve quién ganó. Abajo, la invitación a guardar sus puntos.
 */
function RetoInvitado({ partida, puntaje, total, extra, legado, className }: {
  partida: Partida; puntaje: number; total: number; extra?: string; legado: RetoActivo | null; className: string;
}) {
  const [nombre, setNombre] = useState("");
  useEffect(() => {
    try { setNombre(localStorage.getItem(KEY_NOMBRE) ?? ""); } catch { /* sin almacenamiento */ }
  }, []);
  const v = legado?.p !== undefined ? veredicto(puntaje, { p: legado.p, m: legado.m ? 1 : undefined }) : null;
  const festejado = useRef(false);
  useEffect(() => {
    if (v === "gane" && !festejado.current) { festejado.current = true; celebrate("big"); }
  }, [v]);
  const { juego, meta } = partida;
  const limpio = nombre.replace(/[<>]/g, "").trim().slice(0, 20);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.jaikuaa.com";
  const url = retoUrl(origin, {
    j: juego, s: partida.seed, p: puntaje, t: total, n: limpio || "Tu amigo",
    ...(extra ? { x: extra } : {}), ...(meta.menosEsMejor ? { m: 1 as const } : {}), ...(meta.unidad ? { u: meta.unidad } : {}),
  });
  const mio = puntajeDe({ t: total, u: meta.unidad }, puntaje);
  const texto = v === "gane" && legado
    ? `¡Le gané a ${legado.n} en ${RETO_NOMBRE[juego]} de Jaikuaa! Hice ${mio}. ¿Vos te animás? Jugá la misma partida:\n${url}`
    : invitacion(juego, url, mio);
  return (
    <div className={`mx-auto w-full max-w-md space-y-4 rounded-3xl bg-white p-4 text-center shadow-xl ${className}`} style={{ color: INK }}>
      {v && legado ? (
        <div>
          <Trophy className="mx-auto h-9 w-9" style={{ color: v === "perdi" ? "#8A94A6" : "#E0A100" }} aria-hidden />
          <p className="mt-1 font-display text-2xl font-bold">{v === "gane" ? `¡Le ganaste a ${legado.n}!` : v === "perdi" ? `${legado.n} te ganó… ¡revancha!` : `¡Empate con ${legado.n}!`}</p>
          <p className="text-sm opacity-75">Vos {mio} · {legado.n} {puntajeDe(legado, legado.p!)}</p>
        </div>
      ) : (
        <div>
          <p className="font-display text-xl font-bold">¿Quién sabe más guaraní?</p>
          <p className="text-sm opacity-75">Retá a un amigo: le llega esta misma partida y ve tu puntaje. No necesita cuenta.</p>
        </div>
      )}
      <label className="block text-left text-sm font-semibold" htmlFor="reto-nombre">
        Tu nombre en el reto
        <input
          id="reto-nombre"
          value={nombre}
          maxLength={20}
          placeholder="Por ejemplo: Ramona"
          onChange={(e) => {
            setNombre(e.target.value);
            try { localStorage.setItem(KEY_NOMBRE, e.target.value); } catch { /* nada */ }
          }}
          className="mt-1 h-12 w-full rounded-2xl border-2 border-black/15 bg-white px-4 text-base font-normal"
        />
      </label>
      <Compartir url={url} texto={texto} />
      <div className="rounded-2xl bg-[#EEF3FB] p-3">
        <p className="text-sm font-semibold">Guardá tus puntos y seguí mañana desde cualquier celular</p>
        <a
          href="/auth?mode=signup"
          onClick={() => rememberAfterLogin(window.location.pathname)}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold text-white"
          style={{ background: "#1E3A5F" }}
        >
          Crear mi cuenta gratis
        </a>
      </div>
    </div>
  );
}
