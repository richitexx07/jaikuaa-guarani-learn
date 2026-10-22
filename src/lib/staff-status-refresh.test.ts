import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { staffStatusRefreshInterval } from "./staff-status-refresh";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("staff approval refresh", () => {
  it("checks pending requests every five seconds", () => {
    expect(staffStatusRefreshInterval({ request: { status: "pendiente" } })).toBe(5_000);
  });

  it("stops polling once approved or rejected, or without a request", () => {
    expect(staffStatusRefreshInterval({ request: { status: "aprobado" } })).toBe(false);
    expect(staffStatusRefreshInterval({ request: { status: "rechazado" } })).toBe(false);
    expect(staffStatusRefreshInterval({ request: null })).toBe(false);
    expect(staffStatusRefreshInterval(undefined)).toBe(false);
  });

  it("does not poll without connectivity", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(staffStatusRefreshInterval({ request: { status: "pendiente" } })).toBe(false);
  });

  it("reads newly granted practice permissions instead of preserving the pending result", async () => {
    const client = new QueryClient();
    const pending = { isPractice: false, request: { status: "pendiente" } };
    const approved = { isPractice: true, request: { status: "aprobado" } };
    client.setQueryData(["my-staff-status"], pending);
    const observer = new QueryObserver(client, {
      queryKey: ["my-staff-status"],
      queryFn: async () => approved,
      refetchInterval: (query) => staffStatusRefreshInterval(query.state.data),
    });
    const unsubscribe = observer.subscribe(() => {});
    const result = await observer.refetch();
    expect(result.data?.isPractice).toBe(true);
    expect(result.data?.request.status).toBe("aprobado");
    expect(staffStatusRefreshInterval(result.data)).toBe(false);
    unsubscribe();
    client.clear();
  });
});