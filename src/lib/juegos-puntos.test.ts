import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GAME_REFS } from "./progress.functions";

/** Todos los archivos .ts/.tsx de src (sin los tests). */
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return archivos(p);
    return /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
}

describe("puntos de los juegos", () => {
  it("todo juego que manda puntos está aceptado por el servidor", () => {
    const usados = new Set<string>();
    for (const f of archivos(join(process.cwd(), "src"))) {
      const t = readFileSync(f, "utf8");
      for (const m of t.matchAll(/source:\s*"game",\s*sourceRef:\s*"([a-z-]+)"/g)) usados.add(m[1]!);
    }
    // La Palabra del día tiene su propio camino en el servidor (answerWordOfDay); sin cuenta, queda en el celular.
    usados.delete("palabra-del-dia");
    expect(usados.size).toBeGreaterThan(10);
    for (const j of usados) expect(GAME_REFS.has(j), `falta «${j}» en GAME_REFS`).toBe(true);
  });
});
