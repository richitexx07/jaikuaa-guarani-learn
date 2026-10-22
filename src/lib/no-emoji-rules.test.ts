import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Reglas de la casa para toda la app:
 * - Nunca el banderín rojo: se lee como símbolo partidario y Jaikuaa es para todos.
 * - Nunca el emoji de planta.
 */
const PROHIBIDOS = ["\u{1F6A9}", "\u{1F33F}"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx|css|json|html)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

describe("emojis prohibidos", () => {
  it("no aparecen en ningún archivo de la app", () => {
    const root = join(__dirname, "..");
    const hits = files(root).filter((f) => PROHIBIDOS.some((e) => readFileSync(f, "utf8").includes(e)));
    expect(hits).toEqual([]);
  });
});
