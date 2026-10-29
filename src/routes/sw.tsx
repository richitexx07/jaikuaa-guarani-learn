import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Jifunze Guarani, lugha hai ya Paraguay";
const DESC = "Jifunze Guarani ukitumia Jaikuaa kupitia sauti halisi za binadamu na masomo mafupi shirikishi ili kuungana na utamaduni, biashara na watu wa Paraguay.";

export const Route = createFileRoute("/sw")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "sw_KE" },
      { property: "og:url", content: "https://www.jaikuaa.com/sw" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/sw" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "sw",
  "eyebrow": "Guarani kwa Wataalamu",
  "title": "Mudu Guarani:",
  "titleAccent": "Lugha hai ya Amerika Kusini.",
  "subtitle": "Guarani inazungumzwa na watu wengi nchini Paraguay. Ungana na utamaduni, biashara na watu wa nchi hiyo kupitia sauti halisi za binadamu na masomo mafupi shirikishi.",
  "cta": "Anza Kujifunza",
  "login": "Ingia",
  "pillarsTitle": "Kwa nini Ujifunze Guarani ukitumia Jaikuaa",
  "pillars": [
    {
      "title": "Muungano Halisi wa Kitamaduni na Kibiashara",
      "body": "Nchini Paraguay, Guarani ni lugha ya kuaminiana. Iwe unawekeza, unafanya kazi ya kidiplomasia, au unasafiri katika eneo hili, inafungua milango ambayo Kihispania na Kiingereza haziwezi kufungua."
    },
    {
      "title": "Sauti 100% Halisi ya Binadamu",
      "body": "Hakuna sauti ya mashine (text-to-speech). Kila neno limerekodiwa na wazawa wa Paraguay, ili ulisikie vilevile linavyotamkwa katika uhalisia."
    },
    {
      "title": "Imeundwa kwa Ajili ya Wataalamu Wenye Kazi Nyingi",
      "body": "Dakika chache tu kwa siku kwenye simu au kompyuta. Fuatilia maendeleo yako na upate vyeti vinavyoweza kuthibitishwa kwa kasi yako mwenyewe."
    }
  ],
  "trustTitle": "Utambuzi wa Kitaasisi",
  "trust": [
    "Iliidhinishwa kuwa ya Maslahi ya Kitaifa na Kielimu na Baraza la Manaibu la Paraguay (Tamko Na. 2001).",
    "Tamko la Seneti ya Paraguay (Decl. 547/2026) na Azimio la Sekretarieti ya Sera za Lugha (Resolution 116/2026).",
    "Cheti cha kuhitimu chenye msimbo wa uthibitishaji wa umma."
  ],
  "closingTitle": "Anza Kuzungumza Lugha ya Paraguay Leo",
  "closingBody": "Fungua akaunti yako kwa chini ya dakika moja na uchukue somo lako la kwanza.",
  "imageAlt": "Simu mahiri inayoonyesha somo la Jaikuaa kando ya Jai, kinyago cha jaguar"
};
