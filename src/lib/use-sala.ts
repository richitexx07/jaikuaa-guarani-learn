import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sala en vivo para jugar a distancia: los dos celulares se conectan al mismo canal con un código.
 * Quien crea la sala es el anfitrión (arma la partida y decide los puntos); quien entra por el
 * enlace es el invitado.
 */
export function useSala({
  ns,
  code,
  host,
  events,
  onEvent,
}: {
  ns: string;
  code: string;
  host: boolean;
  events: readonly string[];
  onEvent: (event: string, payload: Record<string, unknown>) => void;
}) {
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [rivalName, setRivalName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(host);
  const hostRef = useRef(host);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const eventsKey = events.join(",");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const full = (u.user_metadata?.full_name as string | undefined) ?? u.email?.split("@")[0] ?? "Jugador";
      setMe({ id: u.id, name: full.trim().split(/\s+/)[0]!.slice(0, 16) || "Jugador" });
    });
  }, []);

  useEffect(() => {
    if (!me) return;
    const ch = supabase.channel(`${ns}:${code}`, { config: { presence: { key: me.id }, broadcast: { self: false } } });
    channelRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ name: string; host: boolean }>();
      const other = Object.entries(state).find(([k]) => k !== me.id)?.[1]?.[0];
      setRivalName(other?.name ?? null);
      // Si ninguno quedó como anfitrión (los dos entraron por enlace), lo es el primero en orden.
      if (other && !hostRef.current && !other.host) {
        const first = Object.keys(state).sort()[0];
        if (first === me.id) {
          hostRef.current = true;
          setIsHost(true);
        }
      }
    });
    for (const e of eventsKey.split(",")) {
      ch.on("broadcast", { event: e }, ({ payload }) => onEventRef.current(e, (payload ?? {}) as Record<string, unknown>));
    }
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") void ch.track({ name: me.name, host: hostRef.current });
    });
    return () => {
      void supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [me, ns, code, eventsKey]);

  const send = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    void channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  return { me, rivalName, isHost, hostRef, send };
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
