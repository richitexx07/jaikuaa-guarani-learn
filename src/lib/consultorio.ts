/**
 * Consultorio de Jai: juego de guaraní médico.
 * Todo el guaraní sale de contenido publicado con voz humana (palabras del cuerpo y frases del Modo mostrador).
 * Este archivo no tiene guaraní: solo castellano, portugués y la lógica del turno.
 */

export type Idioma = "es" | "pt";

/** Partes del cuerpo que se pueden señalar en el dibujo. La clave es el significado en castellano. */
export const REGIONES = [
  { id: "cabeza", es: ["cabeza"], pt: "Cabeça" },
  { id: "ojo", es: ["ojo", "ojos"], pt: "Olho" },
  { id: "oreja", es: ["oreja", "oido", "oreja / oido"], pt: "Orelha" },
  { id: "nariz", es: ["nariz"], pt: "Nariz" },
  { id: "boca", es: ["boca"], pt: "Boca" },
  { id: "corazon", es: ["corazon", "pecho"], pt: "Coração" },
  { id: "panza", es: ["panza", "estomago", "barriga", "vientre"], pt: "Barriga" },
  { id: "mano", es: ["mano"], pt: "Mão" },
  { id: "pie", es: ["pie", "pies"], pt: "Pé" },
] as const;

export type RegionId = (typeof REGIONES)[number]["id"];

function plano(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.]/g, "")
    .trim();
}

/** ¿A qué parte del dibujo corresponde este significado? (null si no está en el dibujo) */
export function regionDe(es: string): RegionId | null {
  const p = plano(es);
  const r = REGIONES.find((x) => (x.es as readonly string[]).includes(p));
  return r ? r.id : null;
}

/** Traducciones al portugués para estudiantes brasileños. Si una frase no está, se muestra en castellano. */
const PT_ORIGINAL: [string, string][] = [
  ["Cabeza", "Cabeça"], ["Ojo", "Olho"], ["Boca", "Boca"], ["Nariz", "Nariz"], ["Oreja", "Orelha"], ["Corazón", "Coração"],
  ["Pie", "Pé"], ["Mano", "Mão"], ["Panza", "Barriga"],
  ["Buen día. ¿Cómo se llama?", "Bom dia. Como o senhor se chama?"],
  ["¿Cuántos años tiene?", "Quantos anos o senhor tem?"],
  ["¿Dónde vive?", "Onde o senhor mora?"],
  ["¿Vino con alguien?", "Veio acompanhado?"],
  ["Espere un momento, por favor.", "Espere um momento, por favor."],
  ["¿Qué le pasa?", "O que o senhor está sentindo?"],
  ["¿Dónde le duele?", "Onde dói?"],
  ["Muéstreme con el dedo dónde le duele.", "Mostre com o dedo onde dói."],
  ["¿Desde cuándo le duele?", "Desde quando dói?"],
  ["¿Tiene fiebre?", "Está com febre?"],
  ["¿Tomó algún remedio?", "Tomou algum remédio?"],
  ["¿Es alérgico a algún remedio?", "É alérgico a algum remédio?"],
  ["¿Está embarazada?", "A senhora está grávida?"],
  ["Siéntese aquí, por favor.", "Sente-se aqui, por favor."],
  ["Acuéstese aquí, por favor.", "Deite-se aqui, por favor."],
  ["Respire hondo.", "Respire fundo."],
  ["Abra la boca.", "Abra a boca."],
  ["Le voy a tomar la presión.", "Vou medir a sua pressão."],
  ["Le voy a revisar. No se preocupe.", "Vou examinar o senhor. Não se preocupe."],
  ["Tome este remedio cada ocho horas.", "Tome este remédio a cada oito horas."],
  ["Tome mucha agua.", "Beba bastante água."],
  ["Necesita hacerse un análisis de sangre.", "Precisa fazer um exame de sangue."],
  ["Vuelva en una semana.", "Volte daqui a uma semana."],
  ["Si se siente peor, vuelva enseguida.", "Se piorar, volte imediatamente."],
  ["Firme aquí, por favor.", "Assine aqui, por favor."],
  ["Me duele la cabeza.", "Estou com dor de cabeça."],
  ["Me duele la panza.", "Estou com dor de barriga."],
  ["Me duele el pecho.", "Estou com dor no peito."],
  ["Tengo fiebre.", "Estou com febre."],
  ["Tengo tos.", "Estou com tosse."],
  ["Estoy mareado.", "Estou tonto."],
  ["Me duele mucho.", "Dói muito."],
  ["Desde ayer.", "Desde ontem."],
  ["Desde hace una semana.", "Faz uma semana."],
  ["Sí.", "Sim."],
  ["No.", "Não."],
  ["No entiendo.", "Não entendo."],
];
function clave(es: string) {
  return plano(es).replace(/\s+/g, " ");
}
const PT = new Map(PT_ORIGINAL.map(([es, pt]) => [clave(es), pt]));

/** Texto para mostrar en el idioma elegido (castellano si no hay traducción). */
export function enIdioma(es: string, idioma: Idioma): string {
  if (idioma === "es") return es;
  return PT.get(clave(es)) ?? es;
}

export const TEXTO = {
  titulo: { es: "Consultorio de Jai", pt: "Consultório do Jai" },
  bajada: {
    es: "Turno de guardia: atendé a los pacientes que hablan guaraní. Escuchalos, entendé qué les pasa y respondé.",
    pt: "Plantão: atenda os pacientes que falam guarani. Escute, entenda o que sentem e responda.",
  },
  empezar: { es: "Empezar el turno", pt: "Começar o plantão" },
  escuchar: { es: "Escuchar al paciente", pt: "Ouvir o paciente" },
  dondeDuele: { es: "¿Dónde le duele? Tocá la parte del cuerpo.", pt: "Onde dói? Toque na parte do corpo." },
  quePasa: { es: "¿Qué le pasa? Elegí lo que dijo.", pt: "O que ele tem? Escolha o que ele disse." },
  queDecis: { es: "¿Cómo se lo decís en guaraní?", pt: "Como dizer isso em guarani?" },
  correcto: { es: "¡Bien atendido!", pt: "Bem atendido!" },
  incorrecto: { es: "No era eso", pt: "Não era isso" },
  seAcabo: { es: "Se acabó el tiempo", pt: "O tempo acabou" },
  siguiente: { es: "Siguiente paciente", pt: "Próximo paciente" },
  resumen: { es: "Fin del turno", pt: "Fim do plantão" },
  otroTurno: { es: "Otro turno", pt: "Outro plantão" },
  paciente: { es: "Paciente", pt: "Paciente" },
  de: { es: "de", pt: "de" },
  atendidos: { es: "pacientes bien atendidos", pt: "pacientes bem atendidos" },
  racha: { es: "mejor racha", pt: "melhor sequência" },
  puntos: { es: "puntos", pt: "pontos" },
  motivoCuerpo: { es: "Dolor localizado", pt: "Dor localizada" },
  motivoSintoma: { es: "Consulta", pt: "Consulta" },
  motivoIndicacion: { es: "Indicación", pt: "Orientação" },
  pedile: { es: "Tenés que decirle:", pt: "Você precisa dizer:" },
  pocos: {
    es: "Por ahora hay pocos pacientes: el equipo docente está grabando las frases de salud. Cada frase nueva suma pacientes al juego.",
    pt: "Por enquanto há poucos pacientes: a equipe de professores está gravando as frases de saúde. Cada frase nova traz mais pacientes ao jogo.",
  },
} as const;

export function t(k: keyof typeof TEXTO, idioma: Idioma): string {
  return TEXTO[k][idioma];
}

/* ------------------------------ El turno ------------------------------ */

export type PalabraCuerpo = { gn: string; es: string; region: RegionId };
export type FraseSalud = { id: string; tipo: "decir" | "escuchar"; es: string; gn: string };

export type Ronda =
  | { tipo: "cuerpo"; palabra: PalabraCuerpo }
  | { tipo: "sintoma"; frase: FraseSalud; opciones: FraseSalud[] }
  | { tipo: "indicacion"; frase: FraseSalud; opciones: FraseSalud[] };

export const PACIENTES_POR_TURNO = 8;
export const SEGUNDOS_POR_PACIENTE = 20;
export const VIDAS = 3;

function mezclar<T>(a: T[], rnd: () => number): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [x[i], x[j]] = [x[j]!, x[i]!];
  }
  return x;
}

/** Arma el turno con lo que haya publicado: mezcla dolores, síntomas e indicaciones. */
export function armarTurno(
  cuerpo: PalabraCuerpo[],
  frases: FraseSalud[],
  rnd: () => number = Math.random,
  n = PACIENTES_POR_TURNO,
): Ronda[] {
  const escuchar = frases.filter((f) => f.tipo === "escuchar");
  const decir = frases.filter((f) => f.tipo === "decir");
  const tipos: Ronda["tipo"][] = [];
  if (cuerpo.length >= 3) tipos.push("cuerpo");
  if (escuchar.length >= 4) tipos.push("sintoma");
  if (decir.length >= 4) tipos.push("indicacion");
  if (tipos.length === 0) return [];

  const colas = {
    cuerpo: mezclar(cuerpo, rnd),
    sintoma: mezclar(escuchar, rnd),
    indicacion: mezclar(decir, rnd),
  };
  const usados = { cuerpo: 0, sintoma: 0, indicacion: 0 };
  const out: Ronda[] = [];
  for (let i = 0; i < n; i++) {
    const tipo = tipos[i % tipos.length]!;
    const cola = colas[tipo];
    const k = usados[tipo]++ % cola.length;
    if (tipo === "cuerpo") {
      out.push({ tipo, palabra: cola[k] as PalabraCuerpo });
    } else {
      const frase = cola[k] as FraseSalud;
      const otras = mezclar(
        (cola as FraseSalud[]).filter((f) => f.id !== frase.id && f.es !== frase.es),
        rnd,
      ).slice(0, 3);
      out.push({ tipo, frase, opciones: mezclar([frase, ...otras], rnd) });
    }
  }
  return mezclar(out, rnd);
}

/** Puntos de un paciente bien atendido: base + rapidez, con multiplicador por racha (hasta ×2). */
export function puntosPorAcierto(segundosRestantes: number, racha: number): number {
  const mult = Math.min(2, 1 + 0.25 * Math.max(0, racha - 1));
  return Math.round((100 + 5 * Math.max(0, segundosRestantes)) * mult);
}

export function estrellas(aciertos: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0 || aciertos === 0) return 0;
  const r = aciertos / total;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
}

/** XP del turno (el servidor igual pone el tope de los juegos). */
export function xpDelTurno(aciertos: number): number {
  return Math.min(20, aciertos * 3);
}

const NOMBRES = [
  { n: "Ramona", f: true }, { n: "Isidoro", f: false }, { n: "Graciela", f: true }, { n: "Teodoro", f: false },
  { n: "Liliana", f: true }, { n: "Cirilo", f: false }, { n: "Rosalía", f: true }, { n: "Fermín", f: false },
  { n: "Celestina", f: true }, { n: "Anastacio", f: false }, { n: "Margarita", f: true }, { n: "Ruperto", f: false },
];

export type Paciente = { nombre: string; femenino: boolean; edad: number; piel: number; pelo: number };

export function paciente(i: number, rnd: () => number = Math.random): Paciente {
  const p = NOMBRES[(i + Math.floor(rnd() * NOMBRES.length)) % NOMBRES.length]!;
  return { nombre: p.n, femenino: p.f, edad: 8 + Math.floor(rnd() * 72), piel: Math.floor(rnd() * 4), pelo: Math.floor(rnd() * 4) };
}
