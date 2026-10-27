import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Learn Guarani, the living language of Paraguay";
const DESC =
  "Learn Guarani with 100% real human voices, bite-sized lessons and a verifiable certificate. Connect with Paraguay's people, culture and business.";

export const Route = createFileRoute("/en")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: "https://www.jaikuaa.com/en" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/en" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "pt-BR", href: "https://www.jaikuaa.com/pt" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

const COPY: IntlCopy = {
  lang: "en",
  eyebrow: "Guarani for professionals",
  title: "Master Guarani:",
  titleAccent: "the living language of South America.",
  subtitle:
    "Guarani is spoken by most people in Paraguay. Connect with the country's culture, business and people through real human voices and bite-sized interactive lessons.",
  cta: "Start learning",
  login: "Sign in",
  pillarsTitle: "Why learn Guarani with Jaikuaa",
  pillars: [
    {
      title: "Real cultural and business connection",
      body: "Guarani is the language of trust in Paraguay. Whether you invest, work in diplomacy or explore the region, it opens doors Spanish and English cannot.",
    },
    {
      title: "100% real human audio",
      body: "No text-to-speech. Every word is recorded by people in Paraguay, so you hear it exactly as it is spoken.",
    },
    {
      title: "Built for busy professionals",
      body: "A few minutes a day on mobile or desktop. Track your progress and earn a verifiable certificate at your own pace.",
    },
  ],
  trustTitle: "Institutional recognition",
  trust: [
    "Declared of national and educational interest by Paraguay's Chamber of Deputies (Decl. No. 2001).",
    "Declaration of the Paraguayan Senate (Decl. 547/2026) and Resolution 116/2026 of the Secretariat of Language Policy.",
    "Completion certificate with a public verification code.",
  ],
  closingTitle: "Start speaking Paraguay's language today",
  closingBody: "Create your account in under a minute and take your first lesson.",
  imageAlt: "Smartphone showing a Jaikuaa lesson next to Jai, the jaguar mascot",
};
