import { describe, expect, it } from "vitest";
import { marcaDeAgua, partirRuta } from "./libros";

describe("partirRuta", () => {
  it("acepta solo los depósitos permitidos", () => {
    expect(partirRuta("libros/abc/p0001.webp")).toEqual({ bucket: "libros", path: "abc/p0001.webp" });
    expect(partirRuta("guarani-audio/nemonare.mp3")).toEqual({ bucket: "guarani-audio", path: "nemonare.mp3" });
    expect(partirRuta("otro/x.webp")).toBeNull();
    expect(partirRuta("libros/../secreto")).toBeNull();
    expect(partirRuta("libros/")).toBeNull();
    expect(partirRuta(null)).toBeNull();
  });
});

describe("marcaDeAgua", () => {
  it("muestra el nombre y el correo a medias", () => {
    expect(marcaDeAgua("Ana Benítez", "anabenitez@gmail.com")).toBe("Ejemplar de Ana Benítez · an***@gmail.com");
    expect(marcaDeAgua("", "x@y.com")).toBe("Ejemplar de x***@y.com");
    expect(marcaDeAgua("", "")).toBe("Ejemplar personal");
  });
});
