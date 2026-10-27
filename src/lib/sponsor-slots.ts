/** Espacios de auspiciantes dentro de la plataforma (clave en app_settings). */
export const SPONSOR_SLOTS = {
  "palabra-del-dia": { key: "palabra_dia_sponsor", label: "Palabra del día" },
  ahorcado: { key: "juego_sponsor_ahorcado", label: "Ahorcado con chipas" },
  "sopa-de-letras": { key: "juego_sponsor_sopa", label: "Sopa de letras" },
  memoria: { key: "juego_sponsor_memoria", label: "Memoria" },
  penales: { key: "juego_sponsor_penales", label: "Penales" },
  duelo: { key: "juego_sponsor_duelo", label: "Duelo Cara a Cara" },
  "trivia-duelo": { key: "juego_sponsor_trivia_duelo", label: "Duelo de Trivia" },
  tekojoja: { key: "juego_sponsor_tekojoja", label: "Tekojoja · Juzgado de Paz" },
  taanga: { key: "juego_sponsor_taanga", label: "Ta'anga · Claqueta de Jai" },
  "nee-rape": { key: "juego_sponsor_nee_rape", label: "Ñe'ẽ Rape (desafío a distancia)" },
  tembiu: { key: "juego_sponsor_tembiu", label: "Tembi'u Paraguái (gastronomía)" },
  karaoke: { key: "juego_sponsor_karaoke", label: "Purahéi Karaoke (música)" },
  ventanilla: { key: "juego_sponsor_ventanilla", label: "Ventanilla de Jai (atención al público)" },
  chacra: { key: "juego_sponsor_chacra", label: "Jai en la chacra (campo)" },
} as const;

export type SponsorSlot = keyof typeof SPONSOR_SLOTS;
export const SPONSOR_SLOT_IDS = Object.keys(SPONSOR_SLOTS) as SponsorSlot[];
export const FOUNDERS_KEY = "auspiciantes_fundadores";
