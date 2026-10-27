import { describe, expect, it } from "vitest";
import { ganadorRonda, GRACE_ME_MS, GRACE_RIVAL_MS } from "./live-duel";

describe("duelo en vivo", () => {
  it("el punto es del que reaccionó más rápido en su propio celular", () => {
    expect(ganadorRonda({ host: 900, guest: 700 })).toBe("guest");
    expect(ganadorRonda({ host: 500, guest: 700 })).toBe("host");
    expect(ganadorRonda({ host: 500 })).toBe("host");
    expect(ganadorRonda({ guest: 1200 })).toBe("guest");
    expect(ganadorRonda({})).toBe("none");
  });

  it("al rival se lo espera un rato razonable antes de dar el abandono", () => {
    expect(GRACE_RIVAL_MS).toBeGreaterThanOrEqual(20000);
    expect(GRACE_ME_MS).toBeGreaterThan(GRACE_RIVAL_MS);
  });
});
