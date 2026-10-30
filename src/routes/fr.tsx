import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Apprenez le guarani, la langue vivante du Paraguay";
const DESC = "Apprenez le guarani avec de vrais enregistrements humains, des leçons interactives courtes et des certificats vérifiables, pour vivre, travailler et investir au Paraguay.";

export const Route = createFileRoute("/fr")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fr_FR" },
      { property: "og:url", content: "https://www.jaikuaa.com/fr" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/fr" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "pt-BR", href: "https://www.jaikuaa.com/pt" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
      { rel: "alternate", hrefLang: "de", href: "https://www.jaikuaa.com/de" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traduction préliminaire : doit être relue par un locuteur natif francophone.
const COPY: IntlCopy = {
  lang: "fr",
  notice: "Traduction préliminaire · en cours de relecture par un locuteur natif · Traducción preliminar, en revisión",
  eyebrow: "Le guarani pour ceux qui arrivent au Paraguay",
  title: "Apprenez le guarani,",
  titleAccent: "la langue vivante du Paraguay.",
  subtitle: "La majorité des Paraguayens parlent guarani. Grâce à de vrais enregistrements et à des leçons interactives courtes, rapprochez-vous de la culture, des affaires et des habitants du pays.",
  cta: "Commencer",
  login: "Se connecter",
  pillarsTitle: "Pourquoi apprendre le guarani avec Jaikuaa",
  pillars: [
    { title: "Un vrai lien culturel et professionnel", body: "Au Paraguay, le guarani est la langue de la confiance. Que vous investissiez, entrepreniez ou vous installiez, il ouvre des portes que l'espagnol seul n'ouvre pas." },
    { title: "100 % d'enregistrements humains", body: "Aucune voix synthétique. Chaque mot est enregistré par des Paraguayens, pour entendre la prononciation authentique." },
    { title: "Pensé pour un quotidien chargé", body: "Quelques minutes par jour, sur mobile ou ordinateur. Suivez vos progrès et obtenez, à votre rythme, un certificat vérifiable." },
  ],
  trustTitle: "Reconnaissance institutionnelle",
  trust: [
    "Déclaré d'intérêt national et éducatif par la Chambre des députés du Paraguay (Déclaration n° 2001).",
    "Déclaration du Sénat du Paraguay (n° 547/2026) et Résolution 116/2026 du Secrétariat des politiques linguistiques.",
    "Certificats de fin de parcours avec code de vérification public.",
  ],
  closingTitle: "Parlez dès aujourd'hui la langue du Paraguay",
  closingBody: "Créez votre compte en moins d'une minute et commencez votre première leçon.",
  imageAlt: "Téléphone affichant une leçon Jaikuaa à côté de Jai, la mascotte jaguar",
};
