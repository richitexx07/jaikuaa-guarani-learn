import { beforeEach, describe, expect, it, vi } from "vitest";

const signing = vi.hoisted(() => vi.fn());
vi.mock("./audio.functions", () => ({ getAudioSignedUrl: signing }));

describe("Recuperación de grabaciones humanas", () => {
  beforeEach(() => {
    vi.resetModules();
    signing.mockReset();
  });

  it("reintenta después de una respuesta temporal sin URL", async () => {
    signing.mockResolvedValueOnce({ signedUrl: null, denied: null });
    signing.mockResolvedValueOnce({ signedUrl: "https://audio.example/recording.mp3", denied: null });
    const { getHumanAudioUrl } = await import("./audio");
    expect(await getHumanAudioUrl("existing-recording")).toBeNull();
    expect(await getHumanAudioUrl("existing-recording")).toBe("https://audio.example/recording.mp3");
    expect(signing).toHaveBeenCalledTimes(2);
  });

  it("comparte la solicitud simultánea y reutiliza una URL vigente", async () => {
    signing.mockResolvedValue({ signedUrl: "https://audio.example/recording.mp3", denied: null });
    const { getHumanAudioUrl } = await import("./audio");
    await Promise.all([getHumanAudioUrl("existing-recording"), getHumanAudioUrl("existing-recording")]);
    await getHumanAudioUrl("existing-recording");
    expect(signing).toHaveBeenCalledTimes(1);
  });
});