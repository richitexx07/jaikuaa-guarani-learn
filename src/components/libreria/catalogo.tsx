/**
 * Las obras publicadas de la Librería: módulos de especialización, cursos con video y libros.
 * Con buscador (título, autor, rubro) y filtros por tipo, rubro, lengua y edición impresa.
 * Cada obra: comprar (digital o impresa), muestra gratis, pedirla por WhatsApp y, si tiene precio para
 * instituciones, pedir una cotización. Si todavía no hay obras publicadas, no muestra nada.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Headphones, MessageCircle, Search, X } from "lucide-react";
import { catalogoLibros, type LibroCard } from "@/lib/libros.functions";
import { AREAS, AREA_NOMBRE, TIPO_NOMBRE, VARIANTES, VARIANTE_NOMBRE, filtrarObras, type Area, type TipoObra, type Variante } from "@/lib/obras";
import { formatoGs } from "@/lib/pagopar";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { Portada } from "@/components/libreria/portada";
import { ComprarImpreso, ComprarLibro } from "@/components/libreria/comprar-libro";
import { LIB_COLORES as C } from "@/components/libreria/arte";

const GRUPOS: { tipo: TipoObra; id: string; titulo: string; bajada: string }[] = [
  {
    tipo: "modulo",
    id: "lb-modulos",
    titulo: "Módulos de especialización",
    bajada: "Guaraní para tu trabajo: salud, justicia, finanzas y más. Con voz humana real en cada página, en tu celular.",
  },
  { tipo: "curso", id: "lb-cursos", titulo: "Cursos con video", bajada: "Clases en video con su material, para avanzar a tu ritmo." },
  {
    tipo: "libro",
    id: "lb-catalogo",
    titulo: "Libros disponibles",
    bajada: "Pedí el tuyo y lo leés en el celular, con voz humana real en cada página. Queda guardado en «Mis libros».",
  },
];

const queEs = (t: TipoObra) => (t === "modulo" ? "el módulo" : t === "curso" ? "el curso" : "el libro");
const wa = (texto: string) => `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(texto)}`;

export function fechaCorta(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-PY", { day: "numeric", month: "long" });
}

export function CatalogoLibreria() {
  const cargar = useServerFn(catalogoLibros);
  const { data } = useQuery({ queryKey: ["catalogo-libros"], queryFn: () => cargar(), staleTime: 5 * 60 * 1000 });
  const obras = data?.libros ?? [];
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<TipoObra | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [variante, setVariante] = useState<Variante | null>(null);
  const [impreso, setImpreso] = useState(false);
  const filtrando = !!(texto.trim() || tipo || area || variante || impreso);
  const resultado = useMemo(() => filtrarObras(obras, { texto, tipo, area, variante, impreso }), [obras, texto, tipo, area, variante, impreso]);

  if (obras.length === 0) return null;
  const hay = (t: TipoObra) => obras.some((o) => o.tipo === t);
  const rubros = AREAS.filter((a) => obras.some((o) => o.area === a));
  const lenguas = VARIANTES.filter((v) => obras.some((o) => o.variante === v));
  const conImpreso = obras.some((o) => o.precioFisicoGs);
  const limpiar = () => {
    setTexto("");
    setTipo(null);
    setArea(null);
    setVariante(null);
    setImpreso(false);
  };

  return (
    <section className="px-4 pb-14 pt-2 sm:px-6" style={{ background: C.papel }} aria-label="Obras disponibles">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-3 shadow-elegant sm:p-4" role="search" aria-label="Buscar en la Librería">
          <label className="relative block">
            <span className="sr-only">Buscar por título, autor o tema</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1B2433]/50" aria-hidden />
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar por título, autor o tema"
              className="h-12 w-full rounded-xl border border-[#1B2433]/20 bg-white pl-10 pr-3 text-base text-[#1B2433]"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(["modulo", "curso", "libro"] as const)
              .filter(hay)
              .map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tipo === t}
                  onClick={() => setTipo(tipo === t ? null : t)}
                  className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                  style={tipo === t ? { background: C.tinta, color: C.papel, borderColor: C.tinta } : { borderColor: "#1B243333", color: C.tinta }}
                >
                  {t === "modulo" ? "Módulos" : t === "curso" ? "Cursos" : "Libros"}
                </button>
              ))}
            {rubros.length > 1 && (
              <select aria-label="Rubro" value={area ?? ""} onChange={(e) => setArea((e.target.value || null) as Area | null)} className="h-9 rounded-full border border-[#1B2433]/20 bg-white px-3 text-sm text-[#1B2433]">
                <option value="">Todos los rubros</option>
                {rubros.map((a) => (
                  <option key={a} value={a}>{AREA_NOMBRE[a]}</option>
                ))}
              </select>
            )}
            {lenguas.length > 1 && (
              <select aria-label="Lengua" value={variante ?? ""} onChange={(e) => setVariante((e.target.value || null) as Variante | null)} className="h-9 rounded-full border border-[#1B2433]/20 bg-white px-3 text-sm text-[#1B2433]">
                <option value="">Todas las lenguas</option>
                {lenguas.map((v) => (
                  <option key={v} value={v}>{VARIANTE_NOMBRE[v]}</option>
                ))}
              </select>
            )}
            {conImpreso && (
              <label className="flex items-center gap-1.5 text-sm font-semibold text-[#1B2433]">
                <input type="checkbox" checked={impreso} onChange={(e) => setImpreso(e.target.checked)} className="h-4 w-4" /> Con edición impresa
              </label>
            )}
            {filtrando && (
              <button type="button" onClick={limpiar} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-[#1B2433]/70 hover:underline">
                <X className="h-4 w-4" /> Limpiar
              </button>
            )}
          </div>
        </div>

        {filtrando ? (
          <div className="mt-8">
            <p className="text-sm font-semibold text-[#1B2433]/80" aria-live="polite">
              {resultado.length === 0 ? "No encontramos obras con esa búsqueda." : resultado.length === 1 ? "1 obra encontrada" : `${resultado.length} obras encontradas`}
            </p>
            {resultado.length > 0 && <ListaObras obras={resultado} />}
          </div>
        ) : (
          <div className="space-y-12 pt-10">
            {GRUPOS.filter((g) => hay(g.tipo)).map((g) => (
              <div key={g.tipo} aria-labelledby={g.id}>
                <h2 id={g.id} className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>
                  {g.titulo}
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-center text-[15px] text-muted-foreground">{g.bajada}</p>
                <ListaObras obras={obras.filter((o) => o.tipo === g.tipo)} />
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-muted-foreground">
          ¿Ya compraste?{" "}
          <Link to="/mis-libros" className="font-semibold underline" style={{ color: C.tinta }}>
            Tus libros, módulos y cursos están en «Mis libros»
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          ¿Buscás artesanía, música, clases o experiencias?{" "}
          <Link to="/mercado" className="font-semibold underline" style={{ color: C.tinta }}>
            Entrá al Mercado Jaikuaa
          </Link>
        </p>
      </div>
    </section>
  );
}

export function ListaObras({ obras }: { obras: LibroCard[] }) {
  return (
    <ul className="mt-6 grid gap-5 sm:grid-cols-2">
      {obras.map((l) => (
        <li key={l.id}>
          <TarjetaObra obra={l} />
        </li>
      ))}
    </ul>
  );
}

export function TarjetaObra({ obra: l }: { obra: LibroCard }) {
  const etiquetas = [
    l.tipo !== "libro" ? (l.area ? AREA_NOMBRE[l.area] : TIPO_NOMBRE[l.tipo]) : null,
    l.variante ? VARIANTE_NOMBRE[l.variante] : null,
  ].filter((x): x is string => !!x);
  return (
    <article className="flex h-full gap-4 rounded-2xl bg-white p-4 shadow-elegant">
      <div className="w-28 shrink-0">
        <Portada libro={l} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex flex-wrap gap-1.5">
          {l.enPreventa && (
            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: C.rojo, color: "#fff" }}>
              Preventa{l.fechaDisponible ? ` · desde el ${fechaCorta(l.fechaDisponible)}` : ""}
            </span>
          )}
          {etiquetas.map((t) => (
            <span key={t} className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: C.dorado, color: C.noche }}>
              {t}
            </span>
          ))}
        </div>
        <h3 className="font-display text-lg font-bold leading-tight" style={{ color: C.tinta }}>{l.titulo}</h3>
        {l.autor &&
          (l.autorSlug ? (
            <Link to="/autor/$slug" params={{ slug: l.autorSlug }} className="mt-0.5 text-sm text-muted-foreground underline-offset-2 hover:underline">
              {l.autor}
            </Link>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">{l.autor}</p>
          ))}
        {l.descripcion && <p className="mt-2 line-clamp-4 text-sm text-foreground/80">{l.descripcion}</p>}
        {l.publico && <p className="mt-1 text-xs text-muted-foreground">Para: {l.publico}</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {l.precioGs && !l.tengo && <ComprarLibro libroId={l.id} precioGs={l.precioGs} preventa={l.enPreventa} />}
          {l.paginas > 0 && (
            <Link
              to="/muestra/$id"
              params={{ id: l.id }}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold"
              style={{ borderColor: C.tinta, color: C.tinta }}
            >
              <Headphones className="h-4 w-4" /> Muestra gratis
            </Link>
          )}
          {l.precioFisicoGs && <ComprarImpreso libroId={l.id} precioGs={l.precioFisicoGs} />}
          <a
            href={wa(`Mba'éichapa! Quiero ${queEs(l.tipo)} «${l.titulo}» de la Librería Jaikuaa.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold"
            style={{ background: C.dorado, color: C.noche }}
          >
            <MessageCircle className="h-4 w-4" /> Pedirlo
          </a>
        </div>
        {l.precioInstitucionalGs && (
          <a
            href={wa(`Mba'éichapa! Quiero ${queEs(l.tipo)} «${l.titulo}» para mi institución. Somos ___ personas.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
            style={{ color: C.azul }}
          >
            <Building2 className="h-4 w-4" /> Para instituciones: {formatoGs(l.precioInstitucionalGs)} por persona · pedir cotización
          </a>
        )}
      </div>
    </article>
  );
}
