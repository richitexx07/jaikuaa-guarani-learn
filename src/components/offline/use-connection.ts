import { useEffect, useState } from "react";
import { PENDING_EVENT } from "@/lib/gamification";
import { totalPending } from "@/lib/offline-sync";

/** Si hay señal y cuántas cosas esperan para enviarse. */
export function useConnection() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setPending(totalPending());
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener(PENDING_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener(PENDING_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return { online, pending };
}
