import { beforeEach, describe, expect, it, vi } from "vitest";

// Entorno mínimo de navegador (sin jsdom).
function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}
const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = memoryStorage();
g.window = globalThis;
if (typeof g.CustomEvent === "undefined") {
  g.CustomEvent = class extends Event {
    constructor(type: string) {
      super(type);
    }
  };
}
const nav = { onLine: true };
Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true, writable: true });

const netError = () => Object.assign(new TypeError("Failed to fetch"));
const validate = vi.fn(async (_: unknown) => ({ ok: true, prevStatus: "draft", already: false }));
const report = vi.fn(async (_: unknown) => ({ ok: true }));
const propose = vi.fn(async (_: unknown): Promise<{ ok: true } | { ok: false; error: string }> => ({ ok: true }));
vi.mock("./corpus.functions", () => ({ quickValidateWord: (a: unknown) => validate(a) }));
vi.mock("./content-reports.functions", () => ({ reportContentError: (a: unknown) => report(a) }));
vi.mock("./validation-circuit.functions", () => ({ proposeContent: (a: unknown) => propose(a) }));
vi.mock("./gamification", () => ({ PENDING_EVENT: "jaikuaa:pending" }));

import {
  flushStaff,
  proposalFailures,
  queueProposal,
  queueReport,
  queueValidation,
  queuedProposalWords,
  queuedValidationIds,
  staffPendingCount,
  unqueueValidation,
} from "./staff-offline";

beforeEach(() => {
  (g.localStorage as { clear: () => void }).clear();
  validate.mockClear();
  report.mockClear();
  propose.mockClear();
  nav.onLine = true;
});

describe("trabajo del piloto sin señal", () => {
  it("guarda aprobaciones sin repetir y «Deshacer» las saca antes de enviarse", () => {
    queueValidation("w1", "Aguyje");
    queueValidation("w1", "Aguyje");
    queueValidation("w2", "Kuarahy");
    expect([...queuedValidationIds()]).toEqual(["w1", "w2"]);
    expect(unqueueValidation("w1")).toBe(true);
    expect(unqueueValidation("w1")).toBe(false);
    expect(staffPendingCount()).toBe(1);
  });

  it("al volver la señal envía todo y vacía la fila", async () => {
    queueValidation("w1", "Aguyje");
    queueReport({ gn: "Aguyje", es: "Gracias", lugar: "Validación rápida", tipo: "audio", mensaje: "Se corta" });
    queueProposal({ gn: "ohasa", es: "pasa", notes: "", source: "Common Voice" });
    expect(staffPendingCount()).toBe(3);
    await flushStaff();
    expect(validate).toHaveBeenCalledWith({ data: { id: "w1", action: "approve" } });
    expect(report).toHaveBeenCalledTimes(1);
    expect(propose).toHaveBeenCalledTimes(1);
    expect(staffPendingCount()).toBe(0);
  });

  it("si sigue sin señal no pierde nada", async () => {
    validate.mockImplementationOnce(async () => {
      throw netError();
    });
    report.mockImplementationOnce(async () => {
      throw netError();
    });
    queueValidation("w1", "Aguyje");
    queueReport({ gn: "Aguyje", es: "Gracias", lugar: "x", tipo: "otro", mensaje: "abc" });
    await flushStaff();
    expect(staffPendingCount()).toBe(2);
  });

  it("una aprobación que el servidor rechaza se descarta (no se reintenta para siempre)", async () => {
    validate.mockImplementationOnce(async () => {
      throw new Error("Forbidden");
    });
    queueValidation("w1", "Aguyje");
    await flushStaff();
    expect(staffPendingCount()).toBe(0);
  });

  it("la palabra que el servidor no acepta queda avisada; el límite del día se reintenta", async () => {
    propose
      .mockImplementationOnce(async () => ({ ok: false, error: "Esa palabra ya está en el corpus." }))
      .mockImplementationOnce(async () => ({ ok: false, error: "Llegaste al máximo de 20 propuestas por día." }));
    queueProposal({ gn: "ary", es: "año", notes: "", source: "x" });
    queueProposal({ gn: "mama", es: "mamá", notes: "", source: "x" });
    await flushStaff();
    expect(proposalFailures().map((f) => f.gn)).toEqual(["ary"]);
    expect([...queuedProposalWords()]).toEqual(["mama"]);
  });
});
