import { describe, expect, it } from "vitest";
import { tiroDelRival, tiroResuelto } from "./atajar";

describe("atajá", () => {
  it("si entendés la palabra, siempre atajás; si no, siempre es gol del rival", () => {
    for (let seed = 1; seed < 60; seed++)
      for (let n = 0; n < 5; n++) {
        const aim = tiroDelRival(seed, n);
        expect(tiroResuelto(aim, true, 1000 + n, false).shot.outcome).toBe("save");
        expect(["goal", "angle"]).toContain(tiroResuelto(aim, false, 1001 + n, false).shot.outcome);
      }
  });
});
