/**
 * Lugar para el relato del gol grabado por una persona (nunca voz sintética).
 * Por ahora la carpeta está vacía y no suena nada. Cuando haya una grabación con el texto aprobado,
 * se copia en src/assets/penales/relato/ con estos nombres y empieza a sonar sola:
 *   gol-1.mp3, gol-2.mp3…       → cualquier gol
 *   golazo-1.mp3, golazo-2.mp3… → golazo al ángulo (si no hay, usa los de gol)
 * El texto del relato en guaraní lo escriben y aprueban los docentes; el código no genera ni traduce nada.
 */
import { pedirTurno, sonarUnico } from "@/lib/voz-unica";
const RELATOS = import.meta.glob<string>("/src/assets/penales/relato/*.{mp3,m4a,ogg,webm,wav}", { eager: true, import: "default" });

export function relatosDe(tipo: "gol" | "golazo", lista: Record<string, string> = RELATOS): string[] {
  const de = (t: string) => Object.entries(lista).filter(([k]) => (k.split("/").pop() ?? "").startsWith(`${t}-`)).map(([, v]) => v);
  const propios = de(tipo);
  return propios.length || tipo === "gol" ? propios : de("gol");
}

export function hayRelato(): boolean {
  return relatosDe("gol").length > 0;
}

/** Hace sonar un relato al azar, si hay grabaciones. Si no hay, no hace nada. Nunca se encima con otra voz. */
export function relatarGol(tipo: "gol" | "golazo"): void {
  const urls = relatosDe(tipo);
  if (!urls.length) return;
  void sonarUnico(urls[Math.floor(Math.random() * urls.length)]!, pedirTurno());
}
