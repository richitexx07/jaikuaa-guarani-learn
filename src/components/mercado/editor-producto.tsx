/**
 * Editor de un producto del Mercado (lo usan el vendedor en «Mi tienda» y el administrador):
 * datos, precio, stock, entrega, fotos (hasta 8; la primera es la principal) y, si es digital, el archivo.
 */
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { editarProducto, urlSubidaProducto, type ProductoTienda } from "@/lib/mercado.functions";
import { CATEGORIAS_PRODUCTO, CATEGORIA_NOMBRE, ENTREGAS, ENTREGA_NOMBRE, type CategoriaProducto, type Entrega } from "@/lib/mercado";
import { prepararImagen } from "@/components/libreria/editor-obra";

const select = "h-11 w-full rounded-lg border border-input bg-background px-2 text-base";
const num = (v: FormDataEntryValue | null) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d ? Number(d) : null;
};

function aLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

export function EditorProducto({ p, onCambio, soloLectura = false }: { p: ProductoTienda; onCambio: () => void; soloLectura?: boolean }) {
  const editar = useServerFn(editarProducto);
  const pedirUrl = useServerFn(urlSubidaProducto);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [entrega, setEntrega] = useState<Entrega>(p.entrega);
  const inFotos = useRef<HTMLInputElement>(null);
  const inArchivo = useRef<HTMLInputElement>(null);
  const rutas = p.fotos.map((f) => f.ruta);

  async function correr(etiqueta: string, fn: () => Promise<void>) {
    setOcupado(etiqueta);
    setAviso(null);
    try {
      await fn();
      onCambio();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setAviso(m === "Forbidden" ? "Este producto ya no se puede cambiar (está en revisión o publicado)." : m || "Algo falló. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  }

  async function subir(uso: "foto" | "archivo", f: Blob, mime: string) {
    const u = await pedirUrl({ data: { id: p.id, uso, mime } });
    const { error } = await supabase.storage.from(u.bucket).uploadToSignedUrl(u.path, u.token, f, { contentType: mime });
    if (error) throw new Error(error.message);
    return u.ruta;
  }

  if (soloLectura) {
    return (
      <div className="flex flex-wrap gap-2">
        {p.fotos.map((f) => (
          <img key={f.ruta} src={f.url} alt="" className="h-20 w-20 rounded-lg object-cover" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const fecha = String(fd.get("fecha") ?? "");
          void correr("Guardando…", async () => {
            await editar({
              data: {
                id: p.id,
                titulo: String(fd.get("titulo") ?? ""),
                descripcion: String(fd.get("descripcion") ?? ""),
                categoria: String(fd.get("categoria")) as CategoriaProducto,
                entrega,
                precioGs: entrega === "cotizacion" ? null : num(fd.get("precio")),
                precioAnteriorGs: num(fd.get("antes")),
                stock: entrega === "fisico" ? num(fd.get("stock")) : null,
                ciudad: String(fd.get("ciudad") ?? ""),
                lugar: String(fd.get("lugar") ?? ""),
                fechaEvento: entrega === "experiencia" && fecha ? new Date(fecha).toISOString() : null,
                duracion: String(fd.get("duracion") ?? ""),
                envio: String(fd.get("envio") ?? ""),
              },
            });
          });
        }}
      >
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold">Nombre del producto</span>
          <Input name="titulo" defaultValue={p.titulo} required maxLength={160} className="mt-1 h-11" />
        </label>
        <label>
          <span className="text-sm font-semibold">Categoría</span>
          <select name="categoria" defaultValue={p.categoria} className={`${select} mt-1`}>
            {CATEGORIAS_PRODUCTO.map((c) => (
              <option key={c} value={c}>{CATEGORIA_NOMBRE[c]}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold">¿Cómo se entrega?</span>
          <select value={entrega} onChange={(e) => setEntrega(e.target.value as Entrega)} className={`${select} mt-1`}>
            {ENTREGAS.map((x) => (
              <option key={x} value={x}>{ENTREGA_NOMBRE[x]}</option>
            ))}
          </select>
        </label>
        {entrega !== "cotizacion" && (
          <>
            <label>
              <span className="text-sm font-semibold">Precio (Gs.)</span>
              <Input name="precio" inputMode="numeric" defaultValue={p.precio_gs ?? ""} className="mt-1 h-11" />
            </label>
            <label>
              <span className="text-sm font-semibold">Precio antes (opcional, para mostrar descuento)</span>
              <Input name="antes" inputMode="numeric" defaultValue={p.precio_anterior_gs ?? ""} className="mt-1 h-11" />
            </label>
          </>
        )}
        {entrega === "fisico" && (
          <>
            <label>
              <span className="text-sm font-semibold">Unidades disponibles (vacío = por pedido)</span>
              <Input name="stock" inputMode="numeric" defaultValue={p.stock ?? ""} className="mt-1 h-11" />
            </label>
            <label>
              <span className="text-sm font-semibold">Envío</span>
              <Input name="envio" defaultValue={p.envio} maxLength={300} placeholder="Ej. Envío a todo el país incluido" className="mt-1 h-11" />
            </label>
          </>
        )}
        {entrega === "experiencia" && (
          <label>
            <span className="text-sm font-semibold">Fecha y hora</span>
            <Input type="datetime-local" name="fecha" defaultValue={aLocal(p.fecha_evento)} className="mt-1 h-11" />
          </label>
        )}
        {(entrega === "experiencia" || entrega === "servicio") && (
          <>
            <label>
              <span className="text-sm font-semibold">Lugar o modalidad</span>
              <Input name="lugar" defaultValue={p.lugar} maxLength={200} placeholder="Ej. Casco Histórico de Asunción / En línea" className="mt-1 h-11" />
            </label>
            <label>
              <span className="text-sm font-semibold">Duración</span>
              <Input name="duracion" defaultValue={p.duracion} maxLength={80} placeholder="Ej. 2 horas" className="mt-1 h-11" />
            </label>
          </>
        )}
        <label>
          <span className="text-sm font-semibold">Ciudad</span>
          <Input name="ciudad" defaultValue={p.ciudad} maxLength={80} className="mt-1 h-11" />
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold">Descripción</span>
          <textarea name="descripcion" defaultValue={p.descripcion} maxLength={4000} rows={5} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base" placeholder="Qué es, cómo está hecho, materiales, medidas, qué incluye." />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={!!ocupado}>Guardar datos</Button>
        </div>
      </form>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Fotos ({rutas.length}/8)</p>
          <input
            ref={inFotos}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])].slice(0, 8 - rutas.length);
              e.target.value = "";
              if (!files.length) return;
              void correr(`Subiendo ${files.length} foto(s)…`, async () => {
                const nuevas: string[] = [];
                for (const f of files) {
                  const img = await prepararImagen(f);
                  nuevas.push(await subir("foto", img, img.type || "image/webp"));
                }
                await editar({ data: { id: p.id, fotos: [...rutas, ...nuevas] } });
              });
            }}
          />
          <Button size="sm" variant="outline" disabled={!!ocupado || rutas.length >= 8} onClick={() => inFotos.current?.click()}>
            <ImagePlus className="mr-1.5 h-4 w-4" /> Agregar fotos
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">La primera es la que se ve en el Mercado. Fotos claras, con luz natural y fondo liso venden más.</p>
        {rutas.length > 0 && (
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {p.fotos.map((f, i) => (
              <li key={f.ruta} className="relative overflow-hidden rounded-xl border border-border">
                <img src={f.url} alt={`Foto ${i + 1}`} className="aspect-square w-full object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 text-[10px] font-bold text-white">Principal</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                  {i > 0 ? (
                    <button
                      type="button"
                      aria-label="Hacer principal"
                      className="grid h-8 w-8 place-items-center text-white"
                      onClick={() => void correr("Guardando…", async () => void (await editar({ data: { id: p.id, fotos: [f.ruta, ...rutas.filter((r) => r !== f.ruta)] } })))}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    aria-label="Quitar foto"
                    className="grid h-8 w-8 place-items-center text-white"
                    onClick={() => void correr("Quitando…", async () => void (await editar({ data: { id: p.id, fotos: rutas.filter((r) => r !== f.ruta) } })))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {entrega === "digital" && (
        <div className="rounded-xl border border-border p-3">
          <p className="font-semibold">Archivo que se descarga</p>
          <p className="text-xs text-muted-foreground">PDF, ZIP, MP3, M4A, EPUB o imagen, hasta 50 MB. Solo lo baja quien compró.</p>
          <p className="mt-1 text-sm">{p.archivo_path ? "Archivo cargado ✓" : "Todavía no hay archivo."}</p>
          <input
            ref={inArchivo}
            type="file"
            accept=".pdf,.zip,.mp3,.m4a,.epub,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              void correr("Subiendo el archivo…", async () => {
                const ruta = await subir("archivo", f, f.type || "application/octet-stream");
                await editar({ data: { id: p.id, archivoPath: ruta } });
              });
            }}
          />
          <Button size="sm" variant="outline" className="mt-2" disabled={!!ocupado} onClick={() => inArchivo.current?.click()}>
            <FileUp className="mr-1.5 h-4 w-4" /> {p.archivo_path ? "Cambiar archivo" : "Subir archivo"}
          </Button>
        </div>
      )}

      {ocupado && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> {ocupado}
        </p>
      )}
      {aviso && <p className="text-sm text-destructive" role="alert">{aviso}</p>}
    </div>
  );
}
