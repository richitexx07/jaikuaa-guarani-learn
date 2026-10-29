import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Impara il guarani, la lingua viva del Paraguay";
const DESC = "Impara il guarani con voci umane al 100% reali, lezioni brevi e un certificato verificabile. Connettiti con le persone, la cultura e il mondo degli affari del Paraguay.";

export const Route = createFileRoute("/it")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "it_IT" },
      { property: "og:url", content: "https://www.jaikuaa.com/it" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/it" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "it",
  "eyebrow": "Il guarani per professionisti",
  "title": "Padroneggia il guarani:",
  "titleAccent": "la lingua viva del Sud America.",
  "subtitle": "Il guarani è parlato dalla maggior parte delle persone in Paraguay. Entra in contatto con la cultura, gli affari e la gente del Paese grazie a voci umane autentiche e lezioni interattive a piccoli passi.",
  "cta": "Inizia a imparare",
  "login": "Accedi",
  "pillarsTitle": "Perché imparare il guarani con Jaikuaa",
  "pillars": [
    {
      "title": "Autentica connessione culturale e professionale",
      "body": "Il guarani è la lingua della fiducia in Paraguay. Che tu voglia investire, lavorare nella diplomazia o esplorare la regione, apre porte inaccessibili allo spagnolo e all'inglese."
    },
    {
      "title": "Audio 100% da voci umane reali",
      "body": "Nessuna sintesi vocale. Ogni parola è registrata da persone in Paraguay, per farti ascoltare la pronuncia esattamente come viene parlata."
    },
    {
      "title": "Pensato per professionisti impegnati",
      "body": "Pochi minuti al giorno da mobile o desktop. Monitora i tuoi progressi e ottieni un certificato verificabile al tuo ritmo."
    }
  ],
  "trustTitle": "Riconoscimenti istituzionali",
  "trust": [
    "Dichiarato di interesse nazionale ed educativo dalla Camera dei Deputati del Paraguay (Decl. No. 2001).",
    "Dichiarazione del Senato paraguaiano (Decl. 547/2026) e Risoluzione 116/2026 della Segreteria delle Politiche Linguistiche.",
    "Certificato di completamento con codice di verifica pubblico."
  ],
  "closingTitle": "Inizia a parlare la lingua del Paraguay oggi stesso",
  "closingBody": "Crea il tuo account in meno di un minuto e completa la tua prima lezione.",
  "imageAlt": "Smartphone che mostra una lezione di Jaikuaa accanto a Jai, la mascotte giaguaro"
};
