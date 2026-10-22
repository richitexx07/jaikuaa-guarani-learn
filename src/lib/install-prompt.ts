// Guarda el aviso de instalación del navegador apenas llega, para que cualquier pantalla
// (el aviso del inicio o el botón del panel) pueda ofrecer «Poner Jaikuaa en mi celular».

export type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let saved: PromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    saved = e as PromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    saved = null;
    notify();
  });
}

export function onInstallChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** Ya se abre como app (desde el ícono de la pantalla de inicio). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    installed ||
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

export function canPromptInstall(): boolean {
  return !!saved;
}

/** Abre el aviso de instalación. Devuelve true si la persona aceptó. */
export async function promptInstall(): Promise<boolean> {
  const p = saved;
  if (!p) return false;
  saved = null;
  await p.prompt();
  const { outcome } = await p.userChoice;
  notify();
  return outcome === "accepted";
}
