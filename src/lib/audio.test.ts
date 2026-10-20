import { beforeEach, describe, expect, it, vi } from "vitest";

// Entorno mínimo de navegador (sin depender de jsdom).
function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}
const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = memoryStorage();
g.sessionStorage = memoryStorage();
g.window = globalThis;

const calls: string[][] = [];
vi.mock("./audio.functions", () => ({
  getAudioSignedUrls: vi.fn(async ({ data }: { data: { gns: string[] } }) => {
    calls.push(data.gns);
    const urls: Record<string, string | null> = {};
    const denied: string[] = [];
    for (const gn of data.gns) {
      const slug = gn.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (slug.startsWith("privada")) denied.push(slug);
      else urls[slug] = slug.startsWith("muda") ? null : `https://audio.test/${slug}.mp3?token=x`;
    }
    return { urls, denied, limited: false };
  }),
}));

describe("Audios: un solo pedido por pantalla", () => {
  beforeEach(() => {
    calls.length = 0;
    vi.resetModules();
    (g.localStorage as { clear: () => void }).clear();
  });

  it("junta 20 palabras pedidas al mismo tiempo en una sola tanda", async () => {
    const { getHumanAudioUrl } = await import("./audio");
    const words = Array.from({ length: 20 }, (_, i) => `palabra${i}`);
    const urls = await Promise.all(words.map((w) => getHumanAudioUrl(w)));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(20);
    expect(urls[3]).toBe("https://audio.test/palabra3.mp3?token=x");
  });

  it("no repite el pedido de una palabra ya conocida ni de una pedida dos veces a la vez", async () => {
    const { getHumanAudioUrl } = await import("./audio");
    await Promise.all([getHumanAudioUrl("aguyje"), getHumanAudioUrl("aguyje")]);
    await getHumanAudioUrl("aguyje");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual(["aguyje"]);
  });

  it("una palabra sin grabación queda en silencio y no se pide de nuevo enseguida", async () => {
    const { getHumanAudioUrl } = await import("./audio");
    expect(await getHumanAudioUrl("muda")).toBeNull();
    expect(await getHumanAudioUrl("muda")).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it("después de una falla pasajera sin enlace, se vuelve a intentar pasados dos minutos", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const { getHumanAudioUrl } = await import("./audio");
      expect(await getHumanAudioUrl("muda-temporal")).toBeNull();
      vi.setSystemTime(Date.now() + 3 * 60 * 1000);
      await getHumanAudioUrl("muda-temporal");
      expect(calls).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("lo negado por falta de sesión no se guarda: se vuelve a intentar", async () => {
    const { getHumanAudioUrl } = await import("./audio");
    expect(await getHumanAudioUrl("privada")).toBeNull();
    await getHumanAudioUrl("privada");
    expect(calls).toHaveLength(2);
  });

  it("más de 60 palabras se parten en tandas de 60", async () => {
    const { getHumanAudioUrl } = await import("./audio");
    await Promise.all(Array.from({ length: 130 }, (_, i) => getHumanAudioUrl(`p${i}`)));
    expect(calls.map((c) => c.length)).toEqual([60, 60, 10]);
  });
});
