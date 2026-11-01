import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sala en vivo para jugar a distancia: los dos celulares se conectan al mismo canal con un código.
 *
 * Además de mandar mensajes, la sala avisa lo que pasa con cada jugador, para que el juego nunca
 * siga como si nada cuando el otro ya no está:
 * - «se fue»: salió del juego a propósito (tocó Salir, volvió atrás o cerró la pantalla del juego);
 * - «afuera»: cambió de app (por ejemplo, a WhatsApp) o apagó la pantalla;
 * - «sin señal»: se cortó su conexión (deja de aparecer en la sala);
 * - y también si soy yo el que perdió la conexión.
 */

export type SalaPeer = { key: string; uid: string; name: string; host: boolean; at: number };
export type SalaConn = "connecting" | "online" | "offline";

const INTERNAL = ["_bye", "_away", "_back"] as const;

// Para las pruebas automáticas se puede enchufar otro «cable» (dos pestañas en la misma compu).
// En la app real siempre es Supabase.
type Win = { __salaTransport?: typeof supabase; __salaMe?: { uid: string; name: string } };
function transport(): typeof supabase {
  return (typeof window !== "undefined" && (window as unknown as Win).__salaTransport) || supabase;
}

function tabId(): string {
  try {
    const k = "jaikuaa:tab-id";
    const have = window.sessionStorage.getItem(k);
    if (have) return have;
    const id = Math.random().toString(36).slice(2, 10);
    window.sessionStorage.setItem(k, id);
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export function useSala({
  ns,
  code,
  host,
  events,
  onEvent,
  rivalUid = null,
}: {
  ns: string;
  code: string;
  host: boolean;
  events: readonly string[];
  onEvent: (event: string, payload: Record<string, unknown>, fromUid: string | null) => void;
  /** El rival ya elegido (cuando la partida arrancó). Si no, el primero que entró. */
  rivalUid?: string | null;
}) {
  const [me, setMe] = useState<{ uid: string; name: string; key: string } | null>(null);
  const [peers, setPeers] = useState<SalaPeer[]>([]);
  const [conn, setConn] = useState<SalaConn>("connecting");
  const [isHost, setIsHost] = useState(host);
  const [awayUids, setAwayUids] = useState<Set<string>>(new Set());
  const [byeUids, setByeUids] = useState<Set<string>>(new Set());
  const hostRef = useRef(host);
  const meRef = useRef<typeof me>(null);
  const joinedAt = useRef(Date.now());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const leftRef = useRef(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const eventsKey = events.join(",");

  useEffect(() => {
    const fake = (window as unknown as Win).__salaMe;
    if (fake) {
      const m = { ...fake, key: `${fake.uid}:${tabId()}` };
      meRef.current = m;
      setMe(m);
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) {
        // Sin cuenta (llegó por una invitación): juega como «Invitado» con un número propio de este celular.
        const gid = guestUid();
        const m = { uid: gid, name: "Invitado", key: `${gid}:${tabId()}` };
        meRef.current = m;
        setMe(m);
        return;
      }
      const full = (u.user_metadata?.full_name as string | undefined) ?? u.email?.split("@")[0] ?? "Jugador";
      const m = { uid: u.id, name: full.trim().split(/\s+/)[0]!.slice(0, 16) || "Jugador", key: `${u.id}:${tabId()}` };
      meRef.current = m;
      setMe(m);
    });
  }, []);

  const track = useCallback(() => {
    const m = meRef.current;
    const ch = channelRef.current;
    if (!m || !ch || leftRef.current) return;
    void ch.track({ uid: m.uid, name: m.name, host: hostRef.current, at: joinedAt.current });
  }, []);

  const rawSend = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    const m = meRef.current;
    void channelRef.current?.send({ type: "broadcast", event, payload: { ...payload, _from: m?.uid ?? null } });
  }, []);

  useEffect(() => {
    if (!me) return;
    leftRef.current = false;
    const ch = transport().channel(`${ns}:${code}`, { config: { presence: { key: me.key }, broadcast: { self: false } } });
    channelRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ uid: string; name: string; host: boolean; at: number }>();
      const list: SalaPeer[] = Object.entries(state)
        .filter(([k]) => k !== me.key)
        .map(([key, metas]) => ({ key, uid: metas[0]?.uid ?? key.split(":")[0]!, name: metas[0]?.name ?? "Jugador", host: !!metas[0]?.host, at: Number(metas[0]?.at ?? 0) }))
        .filter((p) => p.uid !== me.uid) // la misma cuenta en otra pestaña no cuenta como rival
        .sort((a, b) => a.at - b.at || (a.key < b.key ? -1 : 1));
      setPeers(list);
      // Si alguien vuelve a aparecer, ya no está «afuera» ni «se fue».
      setAwayUids((s) => (list.some((p) => s.has(p.uid)) ? new Set([...s].filter((u) => !list.some((p) => p.uid === u))) : s));
      setByeUids((s) => (list.some((p) => s.has(p.uid)) ? new Set([...s].filter((u) => !list.some((p) => p.uid === u))) : s));
      // Si ninguno quedó como anfitrión (los dos entraron por enlace), lo es el que entró primero.
      if (list.length && !hostRef.current && !list.some((p) => p.host)) {
        const first = [...list.map((p) => ({ key: p.key, at: p.at })), { key: me.key, at: joinedAt.current }].sort((a, b) => a.at - b.at || (a.key < b.key ? -1 : 1))[0];
        if (first?.key === me.key) {
          hostRef.current = true;
          setIsHost(true);
          track();
        }
      }
    });

    for (const e of INTERNAL) {
      ch.on("broadcast", { event: e }, ({ payload }) => {
        const uid = (payload as { _from?: string })?._from;
        if (!uid) return;
        if (e === "_bye") setByeUids((s) => new Set(s).add(uid));
        if (e === "_away") setAwayUids((s) => new Set(s).add(uid));
        if (e === "_back") {
          setAwayUids((s) => { const n = new Set(s); n.delete(uid); return n; });
          setByeUids((s) => { const n = new Set(s); n.delete(uid); return n; });
        }
      });
    }
    for (const e of eventsKey.split(",")) {
      ch.on("broadcast", { event: e }, ({ payload }) => {
        const p = (payload ?? {}) as Record<string, unknown>;
        onEventRef.current(e, p, typeof p._from === "string" ? p._from : null);
      });
    }
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConn("online");
        track();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        if (!leftRef.current) setConn("offline");
      }
    });

    // Cambió de app o apagó la pantalla: se avisa al rival; al volver, se vuelve a anunciar.
    const onVis = () => {
      if (document.visibilityState === "hidden") rawSend("_away");
      else {
        rawSend("_back");
        track();
      }
    };
    const onOffline = () => setConn("offline");
    const onOnline = () => {
      setConn("connecting");
      window.setTimeout(() => {
        if (channelRef.current === ch && !leftRef.current) {
          track();
          rawSend("_back");
          setConn("online");
        }
      }, 1500);
    };
    const onPageHide = () => rawSend("_away");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", onPageHide);
      // Salir de la pantalla del juego es irse de la partida: se avisa antes de cortar.
      if (!leftRef.current) rawSend("_bye");
      leftRef.current = true;
      const c = ch;
      window.setTimeout(() => void transport().removeChannel(c), 150);
      if (channelRef.current === ch) channelRef.current = null;
    };
  }, [me, ns, code, eventsKey, rawSend, track]);

  /** Salir de la sala a propósito (el rival se entera al instante). */
  const leave = useCallback(() => {
    if (leftRef.current) return;
    rawSend("_bye");
    leftRef.current = true;
    const c = channelRef.current;
    channelRef.current = null;
    if (c) window.setTimeout(() => void transport().removeChannel(c), 150);
  }, [rawSend]);

  const rival = useMemo(() => {
    const p = rivalUid ? peers.find((x) => x.uid === rivalUid) : peers[0];
    const uid = rivalUid ?? p?.uid ?? null;
    return {
      uid,
      name: p?.name ?? null,
      present: !!p,
      away: !!uid && awayUids.has(uid),
      bye: !!uid && byeUids.has(uid),
    };
  }, [peers, rivalUid, awayUids, byeUids]);

  return { me, peers, rival, conn, isHost, hostRef, send: rawSend, leave };
}

/** Código corto de sala, sin letras que se confunden. */
export function nuevoCodigoSala(): string {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
}

/** Código que vino en el enlace (?sala=ABCD), si hay. */
export function salaDeLaUrl(): string | null {
  if (typeof window === "undefined") return null;
  const s = new URLSearchParams(window.location.search).get("sala");
  return s && /^[A-Za-z]{4,6}$/.test(s) ? s.toUpperCase() : null;
}

/** Deja el código en la dirección: si se recarga la página, se vuelve a la misma sala. */
export function ponerSalaEnLaUrl(code: string | null) {
  if (typeof window === "undefined") return;
  const u = new URL(window.location.href);
  if (code) u.searchParams.set("sala", code);
  else u.searchParams.delete("sala");
  window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
}

/** Número de invitado de este celular (no es una cuenta: solo para reconocerse en la sala). */
function guestUid(): string {
  const KEY = "jaikuaa:invitado-id";
  try {
    const v = localStorage.getItem(KEY);
    if (v) return v;
    const n = `invitado-${(crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/[^a-z0-9]/gi, "").slice(0, 12)}`;
    localStorage.setItem(KEY, n);
    return n;
  } catch {
    return `invitado-${Math.random().toString(36).slice(2, 10)}`;
  }
}
