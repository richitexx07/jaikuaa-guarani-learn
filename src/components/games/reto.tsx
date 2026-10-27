import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, MessageCircle, Share2, Swords, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { crearReto, guardarResultadoReto, verReto, type RetoGuardado, type RetoResultado } from "@/lib/reto.functions";
import { decodeReto, newSeed, RETO_NOMBRE, RETO_RUTA, veredicto, type RetoJuego } from "@/lib/reto";

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
  const verFn = useServerFn(verReto);
  const crearFn = useServerFn(crearReto);
  const inicial = useRef(retoParam());
  const legacy = inicial.current && !ID_RE.test(inicial.current) ? decodeReto(inicial.current) : null;
  const [id, setId] = useState<string | null>(() => (inicial.current && ID_RE.test(inicial.current) ? inicial.current : null));
  const [viejo, setViejo] = useState<RetoActivo | null>(() =>
    legacy && legacy.j === juego ? { s: legacy.s, x: legacy.x, n: legacy.n, t: legacy.t, u: legacy.u, m: !!legacy.m, p: legacy.p } : null,
  );
  const [seedLocal, setSeedLocal] = useState<number>(() => viejo?.s ?? newSeed());

  const q = useQuery({
    queryKey: ["reto", id],
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

  const actualizar = useCallback((r: RetoGuardado) => qc.setQueryData(["reto", r.id], { reto: r }), [qc]);

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
export function RetoBanner({ partida, extra, total, coincide = true, className = "" }: { partida: Partida; extra?: string; total?: number; coincide?: boolean; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const r = coincide ? partida.reto : null;

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
      <div className={`mx-auto max-w-xl rounded-2xl bg-white p-3 shadow-lg ${className}`} style={{ color: INK }} role="status">
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
            <span className="block text-xs opacity-75">Invitalos ahora: todos juegan la misma partida y se arma una tabla.</span>
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
