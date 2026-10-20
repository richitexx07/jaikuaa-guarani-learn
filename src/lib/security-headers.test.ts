import { describe, expect, it } from "vitest";
import { shouldProtectFrame, withFrameProtection } from "./security-headers";

const html = { "content-type": "text/html; charset=utf-8" };

describe("Cabeceras contra mostrar el sitio dentro de otra página", () => {
  it("protege las páginas HTML de www.jaikuaa.com", () => {
    const res = withFrameProtection(new Request("https://www.jaikuaa.com/dashboard"), new Response("<p>hola</p>", { headers: html }));
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("content-security-policy")).toBe("frame-ancestors 'self'");
  });

  it("no toca la vista previa de Lovable, Studio ni respuestas que no son HTML", () => {
    expect(shouldProtectFrame(new URL("https://id-preview--x.lovable.app/"), "text/html")).toBe(false);
    expect(shouldProtectFrame(new URL("https://www.jaikuaa.com/studio/panel"), "text/html")).toBe(false);
    expect(shouldProtectFrame(new URL("https://jaikuaa.com/_serverFn/x"), "application/json")).toBe(false);
  });

  it("respeta una política de seguridad que ya exista", () => {
    const res = withFrameProtection(
      new Request("https://jaikuaa.com/"),
      new Response("x", { headers: { ...html, "content-security-policy": "default-src 'self'" } }),
    );
    expect(res.headers.get("content-security-policy")).toBe("default-src 'self'; frame-ancestors 'self'");
  });

  it("conserva el estado y el cuerpo de la respuesta", async () => {
    const res = withFrameProtection(new Request("https://www.jaikuaa.com/x"), new Response("no está", { status: 404, headers: html }));
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("no está");
  });
});
