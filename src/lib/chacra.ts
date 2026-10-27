/**
 * Jai en la chacra: guaraní para el trabajo con productores (MAG, escuelas agrícolas, extensión).
 *
 * Los casos están en castellano. La palabra clave sale del vocabulario de Jaikuaa Agro-Rural
 * (contenido en revisión por docentes). Lo que dice el productor en guaraní lo escriben los
 * docentes en «Guaraní de los juegos»; mientras tanto se muestra solo el caso en castellano.
 * Nadie del equipo técnico escribe guaraní acá.
 */
import { TEMAS_AGRO } from "@/lib/guarani-tema-agro";
import { orderedBy, shufflerFor } from "@/lib/reto";

export type CasoChacra = {
  emoji: string;
  productor: string;
  /** Lo que cuenta el productor, en castellano. */
  historia: string;
  pregunta: string;
  /** Palabra del vocabulario Agro-Rural que responde la pregunta (tal cual figura ahí). */
  palabra: string;
  /** Qué le aconseja el técnico (castellano). */
  consejo: string;
};

// El orden no debe cambiar: el número de cada caso es la clave de lo que escriben los docentes.
export const CASOS_CHACRA: CasoChacra[] = [
  { emoji: "🌽", productor: "Don Pedro", historia: "La helada quemó las hojas de mi cultivo y tengo miedo de perder la cosecha.", pregunta: "¿Qué cultivo se le quemó? Mirá el dibujo.", palabra: "Avati", consejo: "Si el tallo sigue sano, la planta puede rebrotar. Conviene esperar unos días antes de decidir." },
  { emoji: "🐄", productor: "Ña Rosa", historia: "Mi vaca está dando mucho menos leche esta semana.", pregunta: "¿Qué está dando menos la vaca?", palabra: "Kamby", consejo: "Revisar que tenga agua limpia y buen pasto, y si sigue así, llamar al veterinario." },
  { emoji: "☀️", productor: "Don Julián", historia: "Hace un mes que no cae una gota y la tierra está seca como piedra.", pregunta: "¿Qué es lo que falta?", palabra: "Amana", consejo: "Cubrir el suelo con rastrojo ayuda a guardar la humedad hasta que vuelva a llover." },
  { emoji: "🌱", productor: "Ña Teresa", historia: "Me regalaron semillas nuevas y no sé cuándo ponerlas.", pregunta: "¿Qué le regalaron?", palabra: "Ra'ỹi", consejo: "Sembrar con la tierra húmeda y según el calendario de la zona. El técnico le puede dar el calendario." },
  { emoji: "🐔", productor: "Doña Lidia", historia: "Mis gallinas dejaron de poner huevos de un día para otro.", pregunta: "¿Qué animales tiene en el gallinero?", palabra: "Ryguasu", consejo: "Darles agua fresca, alimento con calcio y un lugar tranquilo. El calor fuerte también las afecta." },
  { emoji: "🍠", productor: "Don Eusebio", historia: "Este año la mandioca salió chiquita y con pocas raíces.", pregunta: "¿Qué cultivo salió chico?", palabra: "Mandi'o", consejo: "Rotar el cultivo y abonar el suelo. Plantar siempre lo mismo en el mismo lugar cansa la tierra." },
  { emoji: "🐖", productor: "Ña Juana", historia: "Mi animal más gordo no quiere comer desde ayer.", pregunta: "¿Qué animal no quiere comer? Mirá el dibujo.", palabra: "Kure", consejo: "Separarlo de los demás, darle agua y llamar al veterinario si no mejora." },
  { emoji: "🫘", productor: "Don Cirilo", historia: "Quiero llevar mi cosecha de poroto a vender a la feria.", pregunta: "¿Qué quiere vender?", palabra: "Kumanda", consejo: "Limpiar y secar bien el grano antes de embolsar: así se paga mejor." },
  { emoji: "🌾", productor: "Ña Petrona", historia: "Ya está todo listo para levantar lo que sembramos. ¿Cuándo empezamos?", pregunta: "¿De qué trabajo está hablando?", palabra: "Ñemono'õ", consejo: "Mejor en días secos, y guardar en un lugar ventilado para que no se arruine." },
  { emoji: "🌳", productor: "Don Ramiro", historia: "Mi vecino quiere quemar el monte para hacer más chacra.", pregunta: "¿Qué quiere quemar el vecino?", palabra: "Ka'aguy", consejo: "Quemar el monte daña el suelo y está regulado por ley. Hay otras formas de ampliar la chacra." },
  { emoji: "🐴", productor: "Don Faustino", historia: "Mi animal de trabajo se lastimó una pata en el alambrado.", pregunta: "¿Qué animal se lastimó? Mirá el dibujo.", palabra: "Kavaju", consejo: "Limpiar bien la herida, dejarlo descansar y no hacerlo trabajar hasta que sane." },
  { emoji: "🧉", productor: "Ña Dora", historia: "Las plantas de mi yerbal tienen las hojas amarillas.", pregunta: "¿Qué planta tiene las hojas amarillas?", palabra: "Ka'a", consejo: "Puede faltar abono o haber demasiado sol. Conviene que un técnico vea el suelo." },
];

export const VISITAS_POR_DIA = 5;

/** Todo el vocabulario Agro-Rural (sin repetir), para armar las opciones. */
export function vocabAgro() {
  const seen = new Set<string>();
  const out: { gn: string; es: string; tema: string }[] = [];
  for (const t of TEMAS_AGRO) for (const v of t.vocab) if (!seen.has(v.gn)) { seen.add(v.gn); out.push({ gn: v.gn, es: v.es, tema: t.slug }); }
  return out;
}

export type VisitaChacra = { n: number; caso: CasoChacra; es: string; opciones: string[] };

/** Arma el día de visitas (con la misma semilla, las mismas visitas y opciones). */
export function armarVisitas(seed: number): VisitaChacra[] {
  const vocab = orderedBy(vocabAgro(), (v) => v.gn);
  const casos = shufflerFor(seed)(CASOS_CHACRA.map((caso, n) => ({ caso, n }))).slice(0, VISITAS_POR_DIA);
  return casos.map(({ caso, n }, i) => {
    const mezclar = shufflerFor(seed, i + 1);
    const v = vocab.find((x) => x.gn === caso.palabra);
    const mismoTema = vocab.filter((x) => x.gn !== caso.palabra && x.tema === v?.tema);
    const resto = vocab.filter((x) => x.gn !== caso.palabra && x.tema !== v?.tema);
    const otras = [...mezclar(mismoTema), ...mezclar(resto)].slice(0, 3).map((x) => x.gn);
    return { n, caso, es: v?.es ?? "", opciones: mezclar([caso.palabra, ...otras]) };
  });
}
