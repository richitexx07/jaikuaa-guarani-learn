import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublishedNews, type NewsRow } from "@/lib/news.functions";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: "Cultura" | "Educación" | "Comunidad";
  emoji: string;
  source: string;
  url: string;
};

// Respaldo: se muestra mientras cargan las noticias de la base (tabla «noticias»), o si fallan.
// Las nuevas se cargan como «pendiente» y un administrador las publica desde /admin/noticias.
// Solo noticias verificadas, con enlace a la fuente original.
// Antes de agregar una, comprobá la fecha real del artículo (no la fecha de visita de la página).
// Quedaron fuera, hasta encontrar la fuente: "Rincón SPL" en la Biblioteca Nacional,
// convenio SPL–líderes indígenas del Bajo Chaco y convenio Cancillería–Academia.
const NEWS: NewsItem[] = [
  {
    id: "puka-miami-2026",
    title: "Una obra coral en guaraní se estrenó en Miami",
    summary:
      "La compositora y pianista paraguaya Nancy Luzko estrenó «Puká», una obra coral escrita en guaraní, con unas 150 voces de cuatro coros de los Estados Unidos.",
    date: "Octubre 2026",
    category: "Cultura",
    emoji: "🎶",
    source: "Fuente: ABC Color",
    url: "https://www.abc.com.py/espectaculos/musica/2026/10/18/nancy-luzko-estrenara-puka-una-obra-coral-en-guarani-en-miami/",
  },
  {
    id: "tesis-juridica-guarani-2026",
    title: "Tesis doctoral de contenido jurídico en guaraní",
    summary:
      "El Dr. Mario Milciades Pavetti Cristaldo defendió en el Ateneo de Lengua y Cultura Guaraní una tesis doctoral de contenido jurídico en guaraní, con la máxima calificación.",
    date: "Abril 2026",
    category: "Educación",
    emoji: "⚖️",
    source: "Fuente: TuCronista",
    url: "https://tucronista.com/info/2/notireel.php?id=1540",
  },
  {
    id: "arandupy-2026",
    title: "AranduPy 2026: premio a la mejor investigación lingüística",
    summary:
      "La SPL lanzó por tercer año consecutivo el premio AranduPy, que reconoce estudios sobre la riqueza lingüística del Paraguay. Primer premio: G. 10.000.000.",
    date: "Mayo 2026",
    category: "Cultura",
    emoji: "🏆",
    source: "Fuente: Agencia IP",
    url: "https://www.ip.gov.py/ip/?p=580557",
  },
  {
    id: "diccionario-monolingue",
    title: "Diccionario monolingüe de la lengua guaraní",
    summary:
      "La Academia de la Lengua Guaraní presentó una versión corregida y aumentada de su Diccionario, que describe el idioma en la propia lengua y rescata su uso actual.",
    date: "Febrero 2022",
    category: "Educación",
    emoji: "📖",
    source: "Fuente: Última Hora",
    url: "https://www.ultimahora.com/academia-la-lengua-guarani-lanza-nueva-version-diccionario-n2988284",
  },
  {
    id: "decenio-lenguas-indigenas",
    title: "Decenio Internacional de las Lenguas Indígenas",
    summary:
      "La UNESCO lanzó en diciembre de 2022 el Decenio Internacional de las Lenguas Indígenas (2022-2032), para preservar y revitalizar las lenguas originarias del mundo.",
    date: "2022-2032",
    category: "Educación",
    emoji: "🌍",
    source: "Fuente: Cultural Survival",
    url: "https://www.culturalsurvival.org/news/unesco-officially-launches-international-decade-indigenous-languages",
  },
];

const CATEGORY_STYLES: Record<NewsItem["category"], string> = {
  Cultura: "bg-accent/15 text-accent",
  Educación: "bg-emerald-100 text-emerald-700",
  Comunidad: "bg-amber-100 text-amber-800",
};


const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** «2026-10-18» → «Octubre 2026». */
export function monthYear(isoDate: string): string {
  const [y, m] = isoDate.split("-");
  const month = MONTHS[Number(m) - 1];
  return month && y ? `${month} ${y}` : isoDate;
}

function fromRow(r: NewsRow): NewsItem {
  return {
    id: r.id,
    title: r.titulo,
    summary: r.resumen,
    date: monthYear(r.fecha_nota),
    category: r.categoria,
    emoji: r.emoji,
    source: `Fuente: ${r.fuente}`,
    url: r.url,
  };
}

export function NhandeMarandu({ className = "mt-12" }: { className?: string }) {
  const fetchNews = useServerFn(listPublishedNews);
  const { data } = useQuery({
    queryKey: ["nhande-marandu"],
    queryFn: () => fetchNews(),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const items = data?.items.length ? data.items.slice(0, 12).map(fromRow) : NEWS;
  return (
    <section className={`${className} select-none`} style={{ WebkitTouchCallout: "none" }}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Ñande Marandu <span aria-hidden>📰</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Noticias de nuestra lengua.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((n) => (
          <article
            key={n.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-elegant card-hover hover:shadow-lift select-none"
            style={{ WebkitTouchCallout: "none" }}
          >
            <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-muted text-5xl" aria-hidden>
              {n.emoji}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide select-none ${CATEGORY_STYLES[n.category]}`}
                  style={{ WebkitTouchCallout: "none" }}
                >
                  {n.category}
                </span>
                <span className="text-xs text-muted-foreground select-none" style={{ WebkitTouchCallout: "none" }}>{n.date}</span>
              </div>
              <h3 className="font-display text-lg font-bold leading-snug text-foreground select-none" style={{ WebkitTouchCallout: "none" }}>
                {n.title}
              </h3>
              <p className="text-sm text-muted-foreground select-none" style={{ WebkitTouchCallout: "none" }}>{n.summary}</p>
              <div className="mt-auto pt-2">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-muted-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
                >
                  {n.source} ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
