import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — למדו Guarani, השפה החיה של פרגוואי";
const DESC = "למדו Guarani עם Jaikuaa באמצעות שיעורים אינטראקטיביים קצרים וקולות אנושיים אמיתיים, והתחברו לעם ולתרבות של פרגוואי.";

export const Route = createFileRoute("/he")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "he_IL" },
      { property: "og:url", content: "https://www.jaikuaa.com/he" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/he" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "he",
  "notice": "תרגום ראשוני · בבדיקה של דובר שפת אם · Traducción preliminar, en revisión",
  "eyebrow": "Guarani לאנשי מקצוע",
  "title": "שלטו ב-Guarani:",
  "titleAccent": "השפה החיה של דרום אמריקה.",
  "subtitle": "Guarani מדוברת על ידי רוב תושבי פרגוואי. התחברו לתרבות, לעסקים ולאנשי המדינה באמצעות קולות אנושיים אמיתיים ושיעורים אינטראקטיביים קצרים.",
  "cta": "התחילו ללמוד",
  "login": "התחברות",
  "pillarsTitle": "למה ללמוד Guarani עם Jaikuaa",
  "pillars": [
    {
      "title": "חיבור תרבותי ועסקי אמיתי",
      "body": "בפרגוואי, Guarani היא שפת האמון. בין אם אתם משקיעים, עובדים בדיפלומטיה או מטיילים באזור, היא פותחת דלתות שספרדית ואנגלית אינן יכולות לפתוח."
    },
    {
      "title": "100% קולות אנושיים אמיתיים",
      "body": "ללא הקראה ממוחשבת. כל מילה הוקלטה על ידי דוברים ילידיים מפרגוואי, כך שתוכלו לשמוע אותה בדיוק כפי שהיא מדוברת במציאות."
    },
    {
      "title": "נבנה עבור אנשי מקצוע עסוקים",
      "body": "רק כמה דקות ביום בנייד או במחשב. עקבו אחר ההתקדמות שלכם וקבלו תעודות הניתנות לאימות בקצב שלכם."
    }
  ],
  "trustTitle": "הכרה מוסדית",
  "trust": [
    "הוכרז כבעל עניין לאומי וחינוכי על ידי בית הנבחרים של פרגוואי (Decl. No. 2001).",
    "הצהרת הסנאט של פרגוואי (Decl. 547/2026) והחלטת המזכירות למדיניות לשונית (Resolution 116/2026).",
    "תעודת סיום עם קוד אימות ציבורי."
  ],
  "closingTitle": "התחילו לדבר את שפת פרגוואי עוד היום",
  "closingBody": "צרו חשבון בפחות מדקה והתחילו את השיעור הראשון שלכם.",
  "imageAlt": "סמארטפון המציג שיעור של Jaikuaa לצד Jai, קמע היגואר"
};
