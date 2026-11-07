/**
 * La tarjeta para compartir el resultado del karaoke (imagen vertical 1080×1350, como un posteo).
 * Se dibuja en el celular con el Jai, el nombre de la canción, las estrellas y la dirección de Jaikuaa.
 */
export type DatosTarjeta = {
  titulo: string; // «Canté en guaraní»
  cancion: string; // nombre de la canción
  estrellas: number; // 0 a 3
  detalle: string; // «4 de 4 versos perfectos · 20 puntos»
  cta: string; // «¿Me ganás?»
  jai: string; // imagen del Jai
};

const C = { noche: "#1A0B33", violeta: "#3A1670", magenta: "#E0457B", oro: "#F6C445", blanco: "#FFFFFF" };

function cargar(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = src;
  });
}

/** Texto que se achica hasta entrar en el ancho. */
function ajustar(ctx: CanvasRenderingContext2D, txt: string, max: number, tam: number, peso = 800) {
  let t = tam;
  do {
    ctx.font = `${peso} ${t}px "Space Grotesk", "Arial Black", system-ui, sans-serif`;
    t -= 4;
  } while (ctx.measureText(txt).width > max && t > 24);
}

export async function dibujarTarjeta(d: DatosTarjeta): Promise<Blob | null> {
  try {
    const W = 1080, H = 1350;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    await document.fonts?.load?.('800 80px "Space Grotesk"').catch(() => undefined);
    // Fondo: noche violeta con reflectores.
    const g = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 200, 1300);
    g.addColorStop(0, "#5A2596");
    g.addColorStop(0.45, C.violeta);
    g.addColorStop(1, C.noche);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const cono = (x: number, color: string) => {
      const gr = ctx.createLinearGradient(0, 0, 0, H * 0.8);
      gr.addColorStop(0, color + "88");
      gr.addColorStop(1, color + "00");
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(x - 30, 0);
      ctx.lineTo(x + 30, 0);
      ctx.lineTo(x + (x < W / 2 ? 380 : -20), H * 0.8);
      ctx.lineTo(x + (x < W / 2 ? 20 : -380), H * 0.8);
      ctx.closePath();
      ctx.fill();
    };
    cono(190, C.magenta);
    cono(890, C.oro);
    // Franja de colores arriba (rojo, blanco y azul) y abajo (oro y magenta).
    ["#D52B1E", "#FFFFFF", "#2F62C9"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect((W / 3) * i, 0, W / 3, 14);
    });
    for (let x = 0; x < W; x += 56) {
      ctx.fillStyle = (x / 56) % 2 ? C.magenta : C.oro;
      ctx.fillRect(x, H - 22, 28, 22);
    }
    // El Jai.
    const jai = await cargar(d.jai);
    if (jai) {
      const h = 560, w = (jai.naturalWidth / jai.naturalHeight) * h;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = 40;
      ctx.drawImage(jai, W / 2 - w / 2, 120, w, h);
      ctx.restore();
    }
    // Textos.
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.blanco;
    ajustar(ctx, d.titulo, W - 140, 92);
    ctx.fillText(d.titulo, W / 2, 780);
    ctx.fillStyle = C.oro;
    const cancion = `«${d.cancion}»`;
    ajustar(ctx, cancion, W - 140, 84);
    ctx.fillText(cancion, W / 2, 880);
    ctx.font = `800 96px system-ui, sans-serif`;
    const est = "★".repeat(d.estrellas) + "☆".repeat(Math.max(0, 3 - d.estrellas));
    ctx.fillText(est, W / 2, 1000);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ajustar(ctx, d.detalle, W - 160, 40, 600);
    ctx.fillText(d.detalle, W / 2, 1066);
    // Botón con la invitación.
    ctx.fillStyle = C.oro;
    const bw = 760, bh = 110, bx = W / 2 - bw / 2, by = 1130;
    ctx.beginPath();
    ctx.roundRect?.(bx, by, bw, bh, 55);
    if (!ctx.roundRect) ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.fillStyle = C.noche;
    ajustar(ctx, `${d.cta}  jaikuaa.com`, bw - 80, 50);
    ctx.fillText(`${d.cta}  jaikuaa.com`, W / 2, by + 72);
    return await new Promise((ok) => cv.toBlob((b) => ok(b), "image/png"));
  } catch {
    return null;
  }
}
