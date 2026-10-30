import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Guaraní lernen, die lebendige Sprache Paraguays";
const DESC = "Lernen Sie Guaraní mit echten menschlichen Aufnahmen, kurzen interaktiven Lektionen und überprüfbaren Zertifikaten – für Leben, Arbeit und Investitionen in Paraguay.";

export const Route = createFileRoute("/de")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "de_DE" },
      { property: "og:url", content: "https://www.jaikuaa.com/de" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/de" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "pt-BR", href: "https://www.jaikuaa.com/pt" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
      { rel: "alternate", hrefLang: "fr", href: "https://www.jaikuaa.com/fr" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Vorläufige Übersetzung: muss von einer deutschen Muttersprachlerin / einem Muttersprachler geprüft werden.
const COPY: IntlCopy = {
  lang: "de",
  notice: "Vorläufige Übersetzung · wird von Muttersprachlern geprüft · Traducción preliminar, en revisión",
  eyebrow: "Guaraní für Menschen, die in Paraguay ankommen",
  title: "Lernen Sie Guaraní,",
  titleAccent: "die lebendige Sprache Paraguays.",
  subtitle: "Die Mehrheit der Menschen in Paraguay spricht Guaraní. Mit echten Aufnahmen und kurzen interaktiven Lektionen verbinden Sie sich mit Kultur, Geschäft und Menschen des Landes.",
  cta: "Jetzt beginnen",
  login: "Anmelden",
  pillarsTitle: "Warum Guaraní mit Jaikuaa lernen",
  pillars: [
    { title: "Echte kulturelle und geschäftliche Nähe", body: "In Paraguay ist Guaraní die Sprache des Vertrauens. Ob Sie investieren, ein Unternehmen gründen oder sich niederlassen – sie öffnet Türen, die Spanisch allein nicht öffnet." },
    { title: "100 % menschliche Aufnahmen", body: "Keine synthetischen Stimmen. Jedes Wort wird von Menschen aus Paraguay aufgenommen, damit Sie die echte Aussprache hören." },
    { title: "Für einen vollen Alltag gemacht", body: "Wenige Minuten am Tag, auf Handy oder Computer. Verfolgen Sie Ihren Fortschritt und erhalten Sie in Ihrem Tempo ein überprüfbares Zertifikat." },
  ],
  trustTitle: "Institutionelle Anerkennung",
  trust: [
    "Von der Abgeordnetenkammer Paraguays zum Projekt von nationalem und bildungspolitischem Interesse erklärt (Erklärung Nr. 2001).",
    "Erklärung des Senats Paraguays (Nr. 547/2026) und Resolution 116/2026 des Sekretariats für Sprachpolitik.",
    "Abschlusszertifikate mit öffentlichem Prüfcode.",
  ],
  closingTitle: "Sprechen Sie noch heute die Sprache Paraguays",
  closingBody: "Erstellen Sie Ihr Konto in weniger als einer Minute und beginnen Sie Ihre erste Lektion.",
  imageAlt: "Handy mit einer Jaikuaa-Lektion neben dem Jaguar-Maskottchen Jai",
};
