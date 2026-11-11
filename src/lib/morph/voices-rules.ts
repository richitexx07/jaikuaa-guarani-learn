/**
 * Voces del verbo — transcripción de "Guarani Ñe'ẽtekuaa / Gramática Guaraní",
 * Academia de la Lengua Guaraní, versión corregida 2020 (Servilibro), págs. 117–123.
 *
 * El libro dice (pág. 117) que la voz "se indica generalmente con partículas que se
 * ubican entre el lexema y la partícula de número y persona". Por eso el analizador
 * las busca justo después del prefijo personal.
 *
 * Los ejemplos son formas literales del libro (sin los guiones con que las separa).
 * Todo queda "pending_validation" hasta la ficha de regla de los especialistas.
 */
import type { RuleStatus } from "./academia-rules";

export interface VoiceRule {
  id: string;
  /** Formas tal como aparecen en el libro (puso normalizado a '). */
  forms: string[];
  /** Nombre que le da el libro. */
  meaning: string;
  /** Página donde el libro define la voz. */
  page: number;
  /** Página de los ejemplos, si es otra. */
  examplesPage?: number;
  /** Formas literales del libro (fila "Che" o la primera disponible). */
  examples: string[];
  /** Lo que el libro aclara sobre la partícula. */
  note: string;
  /** El libro dice que solo se conjuga en plural. */
  pluralOnly?: boolean;
  status: RuleStatus;
}

const pending: RuleStatus = "pending_validation";

export const VOICE_RULES: VoiceRule[] = [
  {
    id: "voz-pasiva",
    forms: ["je", "ñe"],
    meaning: "Voz pasiva",
    page: 117,
    examplesPage: 119,
    examples: ["ajeja'o", "añemosẽ"],
    note: "«je» para verbos orales y «ñe» para verbos nasales. La pasiva refleja usa las mismas partículas y solo se distingue por el contexto (pág. 123: ajejapi, añekytĩ).",
    status: pending,
  },
  {
    id: "voz-coactiva",
    forms: ["mbo", "mo"],
    meaning: "Voz coactiva",
    page: 119,
    examples: ["amboguata", "amoñe'ẽ"],
    note: "El sujeto manda a realizar la acción a otra persona. «mbo» para verbos orales y «mo» para verbos nasales.",
    status: pending,
  },
  {
    id: "voz-reciproca",
    forms: ["jo", "ño"],
    meaning: "Voz recíproca",
    page: 119,
    examplesPage: 121,
    examples: ["jajojuhu", "ñañomoirũ"],
    note: "Necesita dos sujetos y se conjuga solamente en plural. «jo» para verbos orales y «ño» para verbos nasales.",
    pluralOnly: true,
    status: pending,
  },
  {
    id: "voz-objetiva",
    forms: ["poro", "mba'e"],
    meaning: "Voz objetiva",
    page: 121,
    examples: ["aporohayhu", "aporomosẽ", "amba'ejuka"],
    note: "Acción sobre personas o animales indeterminados: «poro» con personas y «mba'e» con animales.",
    status: pending,
  },
  {
    id: "voz-subsuntiva",
    forms: ["guero", "ro"],
    meaning: "Voz subsuntiva",
    page: 121,
    examplesPage: 123,
    examples: ["reguerosapukái", "aguerotĩ"],
    note: "El sujeto realiza la acción para conseguir que el paciente realice la misma acción. «guero» o su apócope «ro».",
    status: pending,
  },
];

/**
 * Cuántas partículas de voz seguidas acepta el analizador. El libro no fija un máximo
 * en estas páginas; se permiten dos (por ejemplo pasiva + coactiva) y queda pendiente
 * de confirmación de los especialistas.
 */
export const VOICE_ORDER = { status: pending, maxVoices: 2 };
