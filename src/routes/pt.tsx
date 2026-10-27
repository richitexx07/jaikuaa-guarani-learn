import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Aprenda Guarani para viver, investir e liderar no Paraguai";
const DESC =
  "Aprenda Guarani com vozes humanas reais, lições curtas e certificado verificável. A língua da confiança no trabalho e nos negócios no Paraguai.";

export const Route = createFileRoute("/pt")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:url", content: "https://www.jaikuaa.com/pt" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/pt" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

const COPY: IntlCopy = {
  lang: "pt",
  eyebrow: "Guarani para negócios e convivência",
  title: "Aprenda Guarani para viver, investir e",
  titleAccent: "liderar no Paraguai.",
  subtitle:
    "A língua do coração e do trabalho no Paraguai. Ganhe a confiança da sua equipe, feche melhores negócios e integre-se de verdade, com pronúncias de vozes humanas reais.",
  cta: "Começar agora",
  login: "Entrar",
  pillarsTitle: "Por que aprender Guarani com a Jaikuaa",
  pillars: [
    {
      title: "Liderança e confiança no campo e na empresa",
      body: "No agro e no comércio paraguaio, quem fala guarani deixa de ser apenas um investidor e passa a ser alguém próximo da comunidade e da sua equipe.",
    },
    {
      title: "Vozes humanas reais, sem robôs",
      body: "Cada palavra é gravada por pessoas no Paraguai. Nada de voz sintética: você ouve a entonação como ela é falada no dia a dia.",
    },
    {
      title: "Poucos minutos por dia",
      body: "Lições curtas e práticas no celular ou no computador, focadas no uso real: cumprimentar, conversar e trabalhar.",
    },
  ],
  trustTitle: "Seriedade institucional",
  trust: [
    "Declarada de interesse nacional e educativo pela Câmara de Deputados do Paraguai (Decl. N.° 2001).",
    "Declaração do Senado do Paraguai (Decl. 547/2026) e Resolução 116/2026 da Secretaria de Políticas Linguísticas.",
    "Certificado de conclusão com código de verificação pública.",
  ],
  closingTitle: "Comece hoje a falar a língua do Paraguai",
  closingBody: "Crie sua conta em menos de um minuto e faça sua primeira lição.",
  imageAlt: "Celular com uma lição da Jaikuaa e o mascote Jai, um jaguaretê",
};
