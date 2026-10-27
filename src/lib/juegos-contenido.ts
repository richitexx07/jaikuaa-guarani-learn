/**
 * Contenido propio de los juegos que todavía no sale del corpus validado.
 * Está acá (y no dentro de cada juego) para que la pantalla «Guaraní de los juegos» lo muestre a los
 * docentes y para que cada juego aplique lo que ellos escriban o corrijan (ver juego-textos.ts).
 * El orden de cada lista no se cambia: la posición es la clave con la que se guarda lo del docente.
 */

// Versos de práctica originales de Jaikuaa, PENDIENTES de validación docente.
// Cada palabra dura 1 tiempo; "gap" marca la palabra que el jugador completa.
export type Line = { words: string[]; es: string; gap: number; wrong: string[] };
export type Song = { id: string; title: string; style: string; bpm: number; chords: number[][]; lines: Line[] };
export const SONGS: Song[] = [
  {
    id: "mbaeichapa", title: "Mba'éichapa, che irũ", style: "Polca alegre", bpm: 104,
    chords: [[196, 247, 294], [262, 330, 392], [294, 370, 440], [196, 247, 294]],
    lines: [
      { words: ["Mba'éichapa", "che", "irũ"], es: "¿Cómo estás, mi amigo?", gap: 2, wrong: ["róga", "mba'e"] },
      { words: ["Iporã", "ko", "ára"], es: "Lindo es este día", gap: 2, wrong: ["pyhare", "ka'aru"] },
      { words: ["Jajapo", "ñande", "tembiapo"], es: "Hagamos nuestro trabajo", gap: 1, wrong: ["che", "nde"] },
      { words: ["Aguyje", "ndéve", "che", "irũ"], es: "Gracias a vos, mi amigo", gap: 0, wrong: ["Mba'e", "Ko'ẽ"] },
    ],
  },
  {
    id: "koe", title: "Ko'ẽ porã", style: "Guarania suave", bpm: 76,
    chords: [[220, 262, 330], [175, 220, 262], [262, 330, 392], [196, 247, 294]],
    lines: [
      { words: ["Ko'ẽ", "porã", "che", "retã"], es: "Buen día, mi patria", gap: 3, wrong: ["róga", "sy"] },
      { words: ["Kuarahy", "ohesape"], es: "El sol ilumina", gap: 0, wrong: ["Jasy", "Y"] },
      { words: ["Ñe'ẽ", "porã", "ñañe'ẽ"], es: "Hablemos lindo", gap: 0, wrong: ["Ka'a", "Óga"] },
      { words: ["Guaraní", "che", "korasõ"], es: "Guaraní, mi corazón", gap: 2, wrong: ["akã", "po"] },
    ],
  },
  {
    id: "terere", title: "Tereré jahupy", style: "Galopa", bpm: 116,
    chords: [[262, 330, 392], [349, 440, 523], [392, 494, 587], [262, 330, 392]],
    lines: [
      { words: ["Ejú", "ejú", "che", "irũ"], es: "Vení, vení, mi amigo", gap: 0, wrong: ["Aha", "Eke"] },
      { words: ["Jaha", "jaykue", "yvyra", "guýpe"], es: "Vamos a sentarnos bajo el árbol", gap: 2, wrong: ["óga", "yvága"] },
      { words: ["Y", "ro'ysã", "ha", "pohã"], es: "Agua fresca y yuyos", gap: 1, wrong: ["haku", "porã"] },
      { words: ["Javy'a", "ñande", "aty"], es: "Alegres en nuestra reunión", gap: 0, wrong: ["Jahupy", "Japyta"] },
    ],
  },
];

// Términos en guaraní PENDIENTES de validación docente (se muestra ValidationNotice).
export const ING: Record<string, { gn: string; es: string; emoji: string }> = {
  avatiKui: { gn: "Avati ku'i", es: "Harina de maíz", emoji: "🌾" },
  avatiKy: { gn: "Avati ky", es: "Choclo", emoji: "🌽" },
  kesu: { gn: "Kesu", es: "Queso", emoji: "🧀" },
  sevoi: { gn: "Sevói", es: "Cebolla", emoji: "🧅" },
  kamby: { gn: "Kamby", es: "Leche", emoji: "🥛" },
  rupia: { gn: "Ryguasu rupi'a", es: "Huevo", emoji: "🥚" },
  aramiro: { gn: "Aramirõ", es: "Almidón", emoji: "🥣" },
  nandy: { gn: "Ñandy", es: "Grasa", emoji: "🫙" },
  juky: { gn: "Juky", es: "Sal", emoji: "🧂" },
  ryguasu: { gn: "Ryguasu ro'o", es: "Gallina", emoji: "🐔" },
  mandio: { gn: "Mandi'o", es: "Mandioca", emoji: "🍠" },
  soo: { gn: "So'o", es: "Carne", emoji: "🥩" },
  andai: { gn: "Andai", es: "Zapallo", emoji: "🎃" },
  asuka: { gn: "Asuka", es: "Azúcar", emoji: "🍬" },
  pira: { gn: "Pira", es: "Pescado", emoji: "🐟" },
  kumanda: { gn: "Kumanda", es: "Poroto", emoji: "🫘" },
  pakova: { gn: "Pakova", es: "Banana", emoji: "🍌" },
  eira: { gn: "Eíra", es: "Miel", emoji: "🍯" },
  y: { gn: "Y", es: "Agua", emoji: "💧" },
  narã: { gn: "Narã", es: "Naranja", emoji: "🍊" },
};
export type Dish = { name: string; emoji: string; info: string; ok: string[] };
export const DISHES: Dish[] = [
  { name: "Sopa paraguaya", emoji: "🥮", info: "La única sopa sólida del mundo.", ok: ["avatiKui", "kesu", "sevoi", "kamby", "rupia"] },
  { name: "Chipa guasu", emoji: "🌽", info: "Se hace con avati ky (choclo fresco).", ok: ["avatiKy", "kesu", "sevoi", "kamby", "rupia"] },
  { name: "Mbeju", emoji: "🫓", info: "Torta de aramirõ dorada en la sartén.", ok: ["aramiro", "kesu", "nandy", "kamby", "juky"] },
  { name: "Vori vori", emoji: "🍲", info: "Caldo con bolitas de avati ku'i y kesu.", ok: ["ryguasu", "avatiKui", "kesu", "sevoi", "juky"] },
  { name: "Chipa", emoji: "🥯", info: "Infaltable en Semana Santa.", ok: ["aramiro", "kesu", "rupia", "nandy", "kamby"] },
  { name: "Pastel mandi'o", emoji: "🥟", info: "Empanada de masa de mandi'o.", ok: ["mandio", "soo", "sevoi", "rupia", "avatiKui"] },
  { name: "Kiveve", emoji: "🎃", info: "Crema dulce y salada de andai.", ok: ["andai", "avatiKui", "kesu", "kamby", "asuka"] },
];

// Frases básicas PENDIENTES de validación docente (se muestra ValidationNotice).
export type Scene = { place: string; who: string; es: string; before: string; after: string; ok: string; wrong: string[] };
export const SCENES: Scene[] = [
  { place: "Mercado 4 · Día", who: "Doña Rosa", es: "Saluda a su clienta de siempre.", before: "¡", after: ", che amiga!", ok: "Mba'éichapa", wrong: ["Jajotopata", "Ndaipóri", "Aguyje"] },
  { place: "Parada de colectivo · Noche", who: "Juan", es: "Agradece al chofer que lo esperó.", before: "¡", after: " ndéve, che ra'a!", ok: "Aguyje", wrong: ["Mba'éichapa", "Jaha", "Ajepa"] },
  { place: "Chacra · Amanecer", who: "Abuelo", es: "Llama a su nieto para tomar tereré.", before: "Ejúna, ", after: ", ja'u tereré.", ok: "che memby", wrong: ["kesu", "y", "pira"] },
  { place: "Cancha del barrio · Tarde", who: "Hinchada", es: "Invita al equipo a irse juntos.", before: "¡", after: ", ñande róga gotyo!", ok: "Jaha", wrong: ["Aguyje", "Mba'e", "Kesu"] },
  { place: "Cocina · Mediodía", who: "Mamá", es: "Pregunta si quieren chipa.", before: "¿Pereipota ", after: "?", ok: "chipa", wrong: ["y", "kuarahy", "jagua"] },
  { place: "Despedida · Puerto", who: "Ana", es: "Se despide hasta el próximo encuentro.", before: "¡", after: " ambuéve!", ok: "Jajotopata", wrong: ["Mba'éichapa", "Aguyje", "Jaha"] },
  { place: "Escuela · Mañana", who: "Profe", es: "Responde que está bien.", before: "Iporã, ", after: ".", ok: "aguyje", wrong: ["kesu", "pira", "jaha"] },
];

// Casos redactados en castellano como borrador. Los términos en guaraní NO se inventan:
// quedan vacíos hasta que la Facultad de Derecho (UNA) / ISL los carguen y validen en el corpus.
export type Case = { emoji: string; story: string; answer: string; wrong: string[]; why: string };
export const CASES: Case[] = [
  { emoji: "🐄", story: "Las vacas de Don Ramón entran cada semana a la chacra de su vecina y le comen el maíz.", answer: "Daños y perjuicios", wrong: ["Divorcio", "Herencia"], why: "Quien es dueño de los animales responde por el daño que causan." },
  { emoji: "🧱", story: "Dos vecinos discuten porque uno corrió el alambrado dos metros dentro del terreno del otro.", answer: "Conflicto de linderos", wrong: ["Contrato de alquiler", "Pensión alimentaria"], why: "Los límites se prueban con título, plano y mensura." },
  { emoji: "👶", story: "Una madre pide que el padre de su hijo aporte dinero cada mes para su crianza.", answer: "Asistencia alimentaria", wrong: ["Desalojo", "Usucapión"], why: "Los padres deben asistir a sus hijos según sus posibilidades." },
  { emoji: "🏠", story: "El inquilino no paga hace seis meses y el dueño quiere recuperar su casa.", answer: "Desalojo", wrong: ["Adopción", "Linderos"], why: "Se tramita ante el juez; nadie puede sacar a otro por la fuerza." },
  { emoji: "🤝", story: "Dos vecinas peleadas se sientan con el juez de paz y firman un acuerdo para convivir en paz.", answer: "Conciliación", wrong: ["Condena", "Embargo"], why: "La conciliación evita un juicio largo." },
  { emoji: "📜", story: "Un abuelo falleció y sus hijos deben repartir la casa y el terreno.", answer: "Sucesión", wrong: ["Desalojo", "Amparo"], why: "La sucesión define quiénes heredan y qué le toca a cada uno." },
  { emoji: "🗣️", story: "Una persona que solo habla guaraní debe declarar ante un tribunal.", answer: "Derecho a intérprete", wrong: ["Embargo", "Fianza"], why: "Nadie puede ser juzgado en un idioma que no entiende." },
  { emoji: "💰", story: "Juan prestó dinero con un pagaré firmado y el deudor no le devuelve.", answer: "Cobro de guaraníes", wrong: ["Adopción", "Linderos"], why: "El pagaré firmado sirve como prueba de la deuda." },
];
