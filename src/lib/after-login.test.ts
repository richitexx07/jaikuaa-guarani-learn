import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAfterLoginRedirect, peekAfterLogin, rememberAfterLogin, takeAfterLogin } from "./after-login";

const room = "/juegos/nee-rape?sala=K7M2QP";

describe("regreso a la invitación después del ingreso", () => {
  beforeEach(() => {
    const items = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => { items.set(key, value); },
      removeItem: (key: string) => { items.delete(key); },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("conserva el código de sala y consume la invitación una sola vez", () => {
    rememberAfterLogin(room);
    expect(peekAfterLogin()).toBe(room);
    expect(takeAfterLogin()).toBe(room);
    expect(peekAfterLogin()).toBeNull();
    expect(takeAfterLogin()).toBe("/dashboard");
  });

  it.each(["Google: getSession + INITIAL_SESSION", "correo: SIGNED_IN + formulario"])(
    "%s no reemplaza la sala por el Panel",
    () => {
      rememberAfterLogin(room);
      const navigate = vi.fn();
      const goNext = createAfterLoginRedirect(navigate);
      goNext();
      goNext();
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(room);
      expect(peekAfterLogin()).toBeNull();
    },
  );

  it("sin invitación va al Panel una sola vez", () => {
    const navigate = vi.fn();
    const goNext = createAfterLoginRedirect(navigate);
    goNext();
    goNext();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it.each(["https://example.com", "//example.com", "/auth?mode=login"])(
    "rechaza destinos no permitidos: %s",
    (href) => {
      rememberAfterLogin(href);
      expect(takeAfterLogin()).toBe("/dashboard");
    },
  );
});