export type TriviaCategoryId =
  | "vocabulario"
  | "mitos"
  | "cultura"
  | "gastronomia"
  | "deportes"
  | "musica"
  | "historia"
  | "naturaleza";

export type TriviaQuestion = {
  q: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
};

export type TriviaCategory = {
  id: TriviaCategoryId;
  title: string;
  subtitle: string;
  emoji: string;
  questions: TriviaQuestion[];
};

export const TRIVIA: Record<TriviaCategoryId, TriviaCategory> = {
  vocabulario: {
    id: "vocabulario",
    title: "Vocabulario Guaraní",
    subtitle: "Palabras esenciales del ñe'ẽ",
    emoji: "📚",
    questions: [
      {
        q: '¿Qué significa "Kuarahy"?',
        options: ["Luna", "Sol", "Estrella", "Río"],
        answer: 1,
        explanation: "Kuarahy es el sol.",
      },
      {
        q: '¿Cómo se dice "agua"?',
        options: ["Yvy", "Y", "Yvoty", "Yvytu"],
        answer: 1,
        explanation: '"Y" significa agua; Yvy es tierra.',
      },
      {
        q: '¿Qué significa "Jaguarete"?',
        options: ["Perro", "Gato montés", "Jaguar", "Zorro"],
        answer: 2,
        explanation: "El jaguarete es el jaguar, símbolo de fuerza.",
      },
      {
        q: '¿Qué significa "Mba\'éichapa"?',
        options: ["Buenos días", "¿Cómo estás?", "Gracias", "Hasta luego"],
        answer: 1,
        explanation: "Es el saludo guaraní más usado.",
      },
      {
        q: '¿Cómo se dice "gracias"?',
        options: ["Aguyje", "Jajoecháta", "Iporã", "Ñandejára"],
        answer: 0,
        explanation: "Aguyje expresa gratitud.",
      },
      {
        q: '¿Cómo se dice "mandioca" en guaraní?',
        options: ["Mandi'o", "Kumanda", "Mba'y", "Ka'a"],
        answer: 0,
        explanation: "Mandi'o es la mandioca, alimento base de la cocina paraguaya.",
      },
      {
        q: '¿Cómo se dice "hermano" en guaraní?',
        options: ["Túva", "Kyra", "Hermano", "Kyvy"],
        answer: 3,
        explanation: "Kyvy significa hermano (de una mujer) / hermano varón en el uso común.",
      },
    ],
  },
  mitos: {
    id: "mitos",
    title: "Mitos y Leyendas",
    subtitle: "Los seres del imaginario paraguayo",
    emoji: "🌙",
    questions: [
      {
        q: "¿Cuál es uno de los siete mitos guaraníes?",
        options: ["El Pombéro", "El Chupacabras", "La Llorona", "El Basilisco"],
        answer: 0,
        explanation: "El Pombéro es uno de los seres míticos más conocidos.",
      },
      {
        q: "¿Cómo se describe tradicionalmente al Jasy Jateré?",
        options: [
          "Un espíritu del agua",
          "Un niño rubio que aparece en la siesta",
          "Un ave gigante",
          "Un árbol sagrado",
        ],
        answer: 1,
        explanation: "Se dice que rapta a los niños que no duermen la siesta.",
      },
      {
        q: "¿Quiénes son los padres de los siete seres míticos según la leyenda?",
        options: ["Tau y Kerana", "Ñande Ru y Arasy", "Jasy y Kuarahy", "Tupã y Sypave"],
        answer: 0,
        explanation: "De Tau y Kerana nacen los siete hijos míticos.",
      },
      {
        q: "¿Qué ser mítico es conocido como protector del monte y sus animales?",
        options: ["El Kurupi", "El Lobizón", "El Mbói Tu'ĩ", "El Ao Ao"],
        answer: 0,
        explanation: "Según la tradición, cuida el monte y sus criaturas.",
      },
      {
        q: "¿Qué es el Luisõ en la mitología popular?",
        options: [
          "Un pájaro nocturno",
          "Un hombre que se transforma (similar al lobizón)",
          "Una serpiente gigante",
          "Un duende del río",
        ],
        answer: 1,
        explanation: "Es la figura paraguaya del hombre lobo.",
      },
      {
        q: "¿Quién es el dios del trueno en la mitología guaraní?",
        options: ["Tupã", "Ñamandu", "Jasy", "Kuarahy"],
        answer: 0,
        explanation: "Tupã es el dios del trueno y de las tormentas en la cosmovisión guaraní.",
      },
      {
        q: "¿Qué criatura mitológica vive en el monte y tiene los pies al revés?",
        options: ["El Pombéro", "El Kurupi", "El Jasy Jateré", "El Ao Ao"],
        answer: 0,
        explanation: "Al Pombéro se lo describe con los pies al revés para confundir a quienes lo persiguen.",
      },
    ],
  },
  cultura: {
    id: "cultura",
    title: "Cultura y Lengua",
    subtitle: "Identidad paraguaya y ñe'ẽ",
    emoji: "🇵🇾",
    questions: [
      {
        q: "¿El guaraní es lengua oficial del Paraguay?",
        options: [
          "No",
          "Sí, junto con el español",
          "Solo en el interior",
          "Solo simbólicamente",
        ],
        answer: 1,
        explanation: "La Constitución reconoce ambas lenguas oficiales.",
      },
      {
        q: '¿Qué significa "Jaikuaa"?',
        options: ["Aprender", "Conozcamos juntos", "Enseñar", "Hablar"],
        answer: 1,
        explanation: "Es el espíritu de esta plataforma.",
      },
      {
        q: '¿Qué es el "jopara"?',
        options: [
          "Un plato típico solamente",
          "La mezcla de guaraní y español",
          "Un dialecto del norte",
          "Una danza",
        ],
        answer: 1,
        explanation: "Es la forma mixta en que se habla a diario.",
      },
      {
        q: '¿Qué es el "puso" en guaraní?',
        options: ["Un acento", "La pausa glotal", "Una letra muda", "Un sufijo"],
        answer: 1,
        explanation: "Como en Ñe'ẽ — corta el sonido entre vocales.",
      },
      {
        q: '¿Qué significa "Ñe\'ẽ"?',
        options: ["Palabra o lengua", "Canto", "Historia", "Silencio"],
        answer: 0,
        explanation: "Ñe'ẽ es palabra, lengua, el habla.",
      },
      {
        q: '¿Cuál es el verbo guaraní para "comer"?',
        options: ["Karu", "Guata", "Hecha", "Jaha"],
        answer: 0,
        explanation: "Karu es el verbo comer en guaraní.",
      },
      {
        q: '¿Cuál es el verbo guaraní para "caminar / andar"?',
        options: ["Guata", "Karu", "Hecha", "Jaha"],
        answer: 0,
        explanation: "Guata significa caminar o andar.",
      },
    ],
  },
  gastronomia: {
    id: "gastronomia",
    title: 'Gastronomía',
    subtitle: 'Sabores y costumbres de la mesa paraguaya',
    emoji: "🍲",
    questions: [
      { q: '¿Cuál es el ingrediente base de la chipa?', options: ['Harina de trigo', 'Almidón de mandioca', 'Arroz', 'Avena'], answer: 1, explanation: 'La chipa se hace con almidón de mandioca, queso y huevo.' },
      { q: '¿Qué tiene de curioso la sopa paraguaya?', options: ['Es un postre', 'Es sólida, como un pastel de maíz', 'Se toma fría', 'Lleva pescado'], answer: 1, explanation: "Es la 'sopa sólida' más famosa del mundo: un pastel de harina de maíz, queso y cebolla." },
      { q: '¿Con qué se prepara tradicionalmente el tereré?', options: ['Yerba mate y agua fría', 'Té negro caliente', 'Café y leche', 'Cacao'], answer: 0, explanation: 'El tereré es yerba mate con agua fría, muchas veces con yuyos.' },
      { q: "¿Qué comida se come tradicionalmente el 1 de agosto para 'espantar los males'?", options: ['Chipa guasu', 'Caña con ruda', 'Asado', 'Mbeju'], answer: 1, explanation: 'Se toma un traguito de caña con ruda el primero de agosto.' },
      { q: '¿En qué fecha se celebra el Día Nacional del Tereré?', options: ['El último sábado de febrero', 'El 15 de mayo', 'El 24 de junio', 'El 1 de enero'], answer: 0, explanation: 'Desde 2011 se celebra el último sábado de febrero.' },
      { q: 'La chipa guasu se hace principalmente con…', options: ['Choclo (maíz fresco)', 'Mandioca', 'Poroto', 'Papa'], answer: 0, explanation: 'La chipa guasu es un pastel de choclo con queso.' },
    ],
  },
  deportes: {
    id: "deportes",
    title: 'Deportes',
    subtitle: 'Fútbol, la Albirroja y grandes hazañas',
    emoji: "⚽",
    questions: [
      { q: '¿Qué medalla ganó la selección paraguaya de fútbol en Atenas 2004?', options: ['Oro', 'Plata', 'Bronce', 'Ninguna'], answer: 1, explanation: 'Paraguay ganó la medalla de plata olímpica en Atenas 2004.' },
      { q: '¿Cómo se le dice a la selección paraguaya de fútbol?', options: ['La Celeste', 'La Albirroja', 'La Verdeamarela', 'La Roja'], answer: 1, explanation: 'Por los colores rojo y blanco de su camiseta.' },
      { q: '¿Qué arquero paraguayo era famoso por patear tiros libres y penales?', options: ['José Luis Chilavert', 'Justo Villar', 'Roque Santa Cruz', 'Carlos Gamarra'], answer: 0, explanation: 'Chilavert convirtió muchos goles siendo arquero.' },
      { q: '¿En qué Mundial llegó Paraguay a cuartos de final?', options: ['Francia 1998', 'Sudáfrica 2010', 'Brasil 2014', 'Rusia 2018'], answer: 1, explanation: 'En Sudáfrica 2010 Paraguay alcanzó los cuartos de final, su mejor actuación.' },
      { q: '¿Cuántas Copas América ganó Paraguay?', options: ['Ninguna', 'Dos (1953 y 1979)', 'Cinco', 'Una'], answer: 1, explanation: 'Paraguay fue campeón de América en 1953 y 1979.' },
      { q: '¿Qué deporte con raqueta tiene gran tradición paraguaya gracias a Víctor Pecci?', options: ['Tenis', 'Bádminton', 'Ping pong', 'Pádel'], answer: 0, explanation: 'Víctor Pecci fue finalista de Roland Garros en 1979.' },
    ],
  },
  musica: {
    id: "musica",
    title: 'Música y Arte',
    subtitle: 'Polca, guarania, arpa y poesía',
    emoji: "🎵",
    questions: [
      { q: '¿Quién creó la guarania?', options: ['José Asunción Flores', 'Agustín Pío Barrios', 'Félix Pérez Cardozo', 'Herminio Giménez'], answer: 0, explanation: 'José Asunción Flores creó la guarania en 1925.' },
      { q: '¿Qué instrumento es símbolo de la música paraguaya?', options: ['El arpa', 'El bandoneón', 'La quena', 'El charango'], answer: 0, explanation: 'El arpa paraguaya es reconocida en todo el mundo.' },
      { q: '¿Qué guitarrista paraguayo es considerado uno de los más grandes del mundo?', options: ["Agustín Pío Barrios 'Mangoré'", 'Andrés Segovia', 'Paco de Lucía', 'Atahualpa Yupanqui'], answer: 0, explanation: "Mangoré compuso obras como 'La Catedral'." },
      { q: '¿Qué ritmo es el más característico de la música folclórica paraguaya?', options: ['La polca paraguaya', 'El tango', 'La cumbia', 'La samba'], answer: 0, explanation: 'La polca paraguaya es alegre y muy bailada.' },
      { q: "¿Quién compuso la música de 'Pájaro Campana'?", options: ['Félix Pérez Cardozo', 'Carlos Gardel', 'Mangoré', 'Emiliano R. Fernández'], answer: 0, explanation: 'Es una obra emblemática para arpa.' },
      { q: '¿Qué danza se baila con una botella en la cabeza?', options: ['Danza de la botella', 'Chamamé', 'Malambo', 'Cueca'], answer: 0, explanation: 'La danza de la botella es tradicional del folclore paraguayo.' },
    ],
  },
  historia: {
    id: "historia",
    title: 'Historia y Geografía',
    subtitle: 'El Paraguay de ayer y de hoy',
    emoji: "📜",
    questions: [
      { q: '¿En qué año se independizó Paraguay?', options: ['1811', '1810', '1816', '1825'], answer: 0, explanation: 'La independencia fue el 14 y 15 de mayo de 1811.' },
      { q: '¿Cuál es la capital del Paraguay?', options: ['Asunción', 'Encarnación', 'Ciudad del Este', 'Concepción'], answer: 0, explanation: "Asunción, fundada en 1537, es la 'Madre de Ciudades'." },
      { q: '¿Contra qué país fue la Guerra del Chaco (1932–1935)?', options: ['Bolivia', 'Argentina', 'Brasil', 'Uruguay'], answer: 0, explanation: 'Paraguay defendió el Chaco frente a Bolivia.' },
      { q: '¿Qué ríos rodean gran parte del territorio paraguayo?', options: ['Paraguay y Paraná', 'Amazonas y Orinoco', 'Uruguay y Negro', 'Bermejo y Salado'], answer: 0, explanation: 'El río Paraguay divide al país en dos regiones.' },
      { q: '¿Qué ruinas jesuíticas son Patrimonio de la Humanidad?', options: ['Trinidad y Jesús', 'Machu Picchu', 'Tiwanaku', 'Chan Chan'], answer: 0, explanation: 'Las misiones de Trinidad y Jesús de Tavarangue fueron declaradas por la UNESCO en 1993.' },
      { q: '¿Cuántos departamentos tiene Paraguay, sin contar la capital?', options: ['17', '12', '20', '9'], answer: 0, explanation: 'Paraguay tiene 17 departamentos y la capital Asunción.' },
    ],
  },
  naturaleza: {
    id: "naturaleza",
    title: 'Naturaleza',
    subtitle: 'Fauna y flora del Paraguay',
    emoji: "🌳",
    questions: [
      { q: '¿Cuál es el árbol nacional del Paraguay?', options: ['El lapacho', 'El ombú', 'El ceibo', 'El quebracho'], answer: 0, explanation: 'El lapacho florece en rosa, amarillo y blanco.' },
      { q: '¿Cuál es el ave nacional del Paraguay?', options: ['El pájaro campana', 'El cóndor', 'El hornero', 'El tucán'], answer: 0, explanation: 'El pájaro campana es famoso por su canto metálico.' },
      { q: '¿Qué animal en peligro, redescubierto en el Chaco en 1974, se creía extinto?', options: ['El taguá (pecarí chaqueño)', 'El dodo', 'El tigre de Tasmania', 'El mamut'], answer: 0, explanation: 'El taguá solo se conocía por fósiles hasta ser hallado vivo.' },
      { q: '¿Cuál es el felino más grande de América?', options: ['El jaguar', 'El puma', 'El ocelote', 'El gato montés'], answer: 0, explanation: 'El jaguar habita todavía algunos bosques y el Chaco paraguayo.' },
      { q: '¿Qué gran humedal comparte Paraguay con Brasil y Bolivia?', options: ['El Pantanal', 'Los Esteros del Iberá', 'El Delta', 'La Amazonía'], answer: 0, explanation: 'El Pantanal es uno de los humedales más grandes del mundo.' },
      { q: '¿Qué planta paraguaya endulza 300 veces más que el azúcar?', options: ["La stevia (ka'a he'ẽ)", 'La caña', 'La remolacha', 'El maíz'], answer: 0, explanation: 'La stevia es originaria del Paraguay.' },
    ],
  },
};

export const TRIVIA_ORDER: TriviaCategoryId[] = [
  "gastronomia",
  "mitos",
  "deportes",
  "musica",
  "historia",
  "naturaleza",
  "cultura",
  "vocabulario",
];

/** Categories shown on the roulette wheel. */
export const ROULETTE: TriviaCategoryId[] = ["gastronomia", "mitos", "deportes", "musica", "historia", "naturaleza"];

// XP economy
export const XP_PER_CORRECT = 10;
export const XP_TIMEOUT = 0;
export const XP_STREAK_BONUS = 5; // per correct answer while streak >= 3
export const QUESTION_SECONDS = 15;
