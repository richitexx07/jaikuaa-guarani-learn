/**
 * El lector de la Librería, pensado para el celular: página por página, con la voz humana de cada página.
 * - Protegido: no se descarga, no se arrastra, y cada página lleva marcado a quién pertenece el ejemplar.
 * - Recuerda en qué página quedaste (solo en este aparato).
 * Lo usan el lector de obras compradas (/leer/$id) y la muestra gratis (/muestra/$id).
 */
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Pause, Play } from "lucide-react";
import { callarVoz, pedirTurno, sonarUnico } from "@/lib/voz-unica";

const clave = (id: string) => `jaikuaa:lector:${id}`;

function leerProgreso(id: string): number {
  try {
    const v = Number(window.localStorage.getItem(clave(id)));
    return Number.isFinite(v) && v >= 0 ? v : 0;
  } catch {
    return 0;
  }
}
function guardarProgreso(id: string, i: number) {
  try {
    window.localStorage.setItem(clave(id), String(i));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export type Pagina = { n: number; imagen: string | null; audio: string | null; texto: string };

export function Lector({
  id,
  titulo,
  autor,
  marca,
  aviso = null,
  paginas,
  final = null,
  volver = "/mis-libros",
  recordar = true,
}: {
  id: string;
  titulo: string;
  autor: string;
  marca: string;
  /** Franja amarilla arriba (vista del administrador, muestra gratis…). */
  aviso?: string | null;
  paginas: Pagina[];
  /** Lo que aparece debajo de la última página (por ejemplo, «Comprar» en la muestra). */
  final?: ReactNode;
  volver?: "/mis-libros" | "/libreria";
  /** Recordar la página en este aparato (no en la muestra, para no pisar la del libro comprado). */
  recordar?: boolean;
}) {
  const total = paginas.length;
  const [i, setI] = useState(() => (recordar ? Math.min(leerProgreso(id), Math.max(0, total - 1)) : 0));
  const [sonando, setSonando] = useState(false);
  const [verTexto, setVerTexto] = useState(false);
  const turno = useRef(0);
  const pagina = paginas[i];

  useEffect(() => {
    if (recordar) guardarProgreso(id, i);
    callarVoz();
    setSonando(false);
    setVerTexto(false);
    // Adelanta la imagen de la página siguiente para que no haya espera.
    const sig = paginas[i + 1]?.imagen;
    if (sig) {
      const img = new Image();
      img.src = sig;
    }
  }, [i, id, paginas, recordar]);

  useEffect(() => () => callarVoz(), []);

  const ir = useCallback((d: number) => setI((x) => Math.min(Math.max(0, x + d), Math.max(0, total - 1))), [total]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ir]);

  const escuchar = useCallback(() => {
    if (!pagina?.audio) return;
    if (sonando) {
      callarVoz();
      setSonando(false);
      return;
    }
    const t = pedirTurno();
    turno.current = t;
    setSonando(true);
    void sonarUnico(pagina.audio, t).then(() => {
      if (turno.current === t) setSonando(false);
    });
  }, [pagina, sonando]);

  // Deslizar con el dedo para cambiar de página.
  const toque = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    toque.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const ini = toque.current;
    toque.current = null;
    if (!ini) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - ini.x;
    const dy = t.clientY - ini.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(dx < 0 ? 1 : -1);
  };

  const sinCopia = useMemo(
    () => ({
      onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
      onDragStart: (e: React.SyntheticEvent) => e.preventDefault(),
      style: { WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" } as React.CSSProperties,
    }),
    [],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0B1E3A] text-white" {...sinCopia}>
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/10 bg-[#0B1E3A]/95 px-3 py-2 backdrop-blur">
        <Link to={volver} aria-label={volver === "/libreria" ? "Volver a la Librería" : "Volver a Mis libros"} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{titulo}</p>
          {autor && <p className="truncate text-xs text-white/60">{autor}</p>}
        </div>
        <p className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums" aria-live="polite">
          {total ? `${i + 1} / ${total}` : "0 / 0"}
        </p>
      </header>

      {aviso && <p className="bg-[#F2C230] px-3 py-1.5 text-center text-xs font-semibold text-[#1B2A44]">{aviso}</p>}

      <main className="flex flex-1 items-start justify-center px-3 py-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {total === 0 ? (
          <p className="mt-16 text-center text-white/70">Este libro todavía no tiene páginas cargadas.</p>
        ) : (
          <div className="w-full max-w-[680px]">
            <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/20">
              {pagina.imagen ? (
                <img
                  key={pagina.n}
                  src={pagina.imagen}
                  alt={pagina.texto ? pagina.texto.slice(0, 300) : `Página ${pagina.n} de ${titulo}`}
                  draggable={false}
                  className="pointer-events-none block h-auto w-full select-none"
                />
              ) : (
                <div className="min-h-[60vh] whitespace-pre-wrap p-6 font-serif text-lg leading-relaxed text-[#1B2A44]">{pagina.texto}</div>
              )}
              <MarcaDeAgua texto={marca} />
            </div>
            <p className="mt-2 text-center text-[11px] text-white/45">{marca} · Prohibida su copia o reenvío</p>

            {pagina.imagen && pagina.texto && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setVerTexto((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-white/80 hover:bg-white/10"
                  aria-expanded={verTexto}
                >
                  <FileText className="h-4 w-4" /> {verTexto ? "Ocultar texto" : "Ver texto de la página"}
                </button>
                {verTexto && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-[15px] leading-relaxed text-white/90">{pagina.texto}</p>}
              </div>
            )}

            {final && i === total - 1 && <div className="mt-5">{final}</div>}
          </div>
        )}
      </main>

      {total > 0 && (
        <nav className="sticky bottom-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-white/10 bg-[#0B1E3A]/95 px-3 py-3 backdrop-blur" aria-label="Páginas">
          <button
            type="button"
            onClick={() => ir(-1)}
            disabled={i === 0}
            className="flex h-12 items-center justify-center gap-1 rounded-xl bg-white/10 font-semibold disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" /> Anterior
          </button>
          {pagina.audio ? (
            <button
              type="button"
              onClick={escuchar}
              className="flex h-14 items-center gap-2 rounded-2xl bg-[#F2C230] px-5 text-base font-bold text-[#1B2A44] shadow-lg active:scale-95"
              aria-pressed={sonando}
            >
              {sonando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {sonando ? "Pausa" : "Escuchar"}
            </button>
          ) : (
            <span className="w-2" />
          )}
          <button
            type="button"
            onClick={() => ir(1)}
            disabled={i >= total - 1}
            className="flex h-12 items-center justify-center gap-1 rounded-xl bg-white/10 font-semibold disabled:opacity-30"
          >
            Siguiente <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      )}
    </div>
  );
}

/** El nombre del dueño del ejemplar, en diagonal y muy suave, sobre toda la página. */
function MarcaDeAgua({ texto }: { texto: string }) {
  const filas = Array.from({ length: 9 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -inset-1/2 flex rotate-[-28deg] flex-col justify-around">
        {filas.map((_, k) => (
          <p key={k} className="whitespace-nowrap text-center text-[13px] font-semibold tracking-wide text-[#1E3A5F] opacity-[0.13]">
            {`${texto}     ${texto}     ${texto}`}
          </p>
        ))}
      </div>
    </div>
  );
}
