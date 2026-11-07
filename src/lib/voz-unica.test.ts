import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeAudio {
  static vivos: FakeAudio[] = [];
  src: string;
  paused = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) { this.src = src; FakeAudio.vivos.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  terminar() { this.paused = true; this.onended?.(); }
}

describe("una sola voz a la vez", () => {
  beforeEach(() => { FakeAudio.vivos = []; vi.stubGlobal("Audio", FakeAudio); });
  afterEach(() => vi.unstubAllGlobals());

  it("la voz nueva corta la anterior (nunca se enciman)", async () => {
    const { pedirTurno, sonarUnico } = await import("./voz-unica");
    const a = sonarUnico("a.mp3", pedirTurno());
    void sonarUnico("b.mp3", pedirTurno());
    expect(FakeAudio.vivos[0]!.paused).toBe(true);
    expect(FakeAudio.vivos[1]!.paused).toBe(false);
    await expect(a).resolves.toBe(true);
  });

  it("un audio que llega tarde ya no suena", async () => {
    const { pedirTurno, sonarUnico } = await import("./voz-unica");
    const viejo = pedirTurno();
    const nuevo = pedirTurno();
    await sonarUnico("viejo.mp3", viejo);
    expect(FakeAudio.vivos).toHaveLength(0);
    void sonarUnico("nuevo.mp3", nuevo);
    expect(FakeAudio.vivos.map((x) => x.src)).toEqual(["nuevo.mp3"]);
  });

  it("callarVoz corta lo que suena y anula lo pendiente", async () => {
    const { callarVoz, pedirTurno, sonarUnico } = await import("./voz-unica");
    void sonarUnico("a.mp3", pedirTurno());
    const pendiente = pedirTurno();
    callarVoz();
    expect(FakeAudio.vivos[0]!.paused).toBe(true);
    await sonarUnico("tarde.mp3", pendiente);
    expect(FakeAudio.vivos).toHaveLength(1);
  });
});
