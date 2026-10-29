import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Guarani simita yachaqay, Paraguay suyup kawsashaq simin";
const DESC = "Guarani simita yachaqay 100% cheqaq runaq kunkanwan, pisi pisimanta yachachikuykunawan, chiqaqchay atina sut'inchay qillqawan ima. Paraguay llaqtawan, kawsayninwan, qhatuyninwanpas t'inkinakuy.";

export const Route = createFileRoute("/qu")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "qu_PE" },
      { property: "og:url", content: "https://www.jaikuaa.com/qu" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/qu" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "qu",
  "eyebrow": "Llank'aqkunapaq Guarani simi",
  "title": "Guarani simita allinta yachay:",
  "titleAccent": "Uran América k'itiypa kawsashaq simin.",
  "subtitle": "Guarani simitaqa Paraguay suyupi astawan runakunan rimanku. Suyup kawsayninwan, qhatuyninwan, runankunawanpas t'inkinakuy, cheqaq runaq kunkankunawan llamk'aspa, pisi pisimanta yachachikuykunawan ima.",
  "cta": "Yachaqayta qallariy",
  "login": "Haykuy",
  "pillarsTitle": "Imaraykutaq Jaikuaa nisqawan Guarani simita yachaqana",
  "pillars": [
    {
      "title": "Kawsaywan qhatuywan cheqaq t'inkinakuy",
      "body": "Guarani simiqa Paraguay suyupi sunqumanta iñiypa siminmi. Qullqita churanki, diplomacia nisqapi llank'anki icha suyukunata watukunki chaypas, kastilla simip, inlis simippas mana kichay atisqan punkukunatan kicharin."
    },
    {
      "title": "100% cheqaq runaq kunkankuna",
      "body": "Manan antachaqchu riman. Sapa rimaymi Paraguay suyupi tiyaq runakunap grabarparisqan kashan, chaymi rimakusqanman hinapuni uyarinki."
    },
    {
      "title": "Mana samariyuq llank'aqkunapaq ruwasqa",
      "body": "Sapa p'unchay celularpi icha computadopi pisi minutollata. Ñawparisqaykita qhaway, allin qhawana sut'inchay qillqatapas aypay munasqaykiman hina."
    }
  ],
  "trustTitle": "Kamachiq wasikunap riqsisqan",
  "trust": [
    "Paraguay suyup Cámara de Diputados nisqan suyuq, yachachiypaqpas allinninpaq ch'uyanchasqan (Decl. No. 2001).",
    "Paraguay Senado nisqap Kamachiynin (Decl. 547/2026), Secretaría de Políticas Lingüísticas nisqap Kamachikuynin (Resolución 116/2026) ima.",
    "Tukusqamanta sut'inchay qillqa, tukuypaq allinchana codigoyuq."
  ],
  "closingTitle": "Kunan p'unchay Paraguay suyup siminta rimayta qallariy",
  "closingBody": "Huk minutollapi cuentaykita ruway, ñawpaq yachachikuyniykitapas chaskiy.",
  "imageAlt": "Huk celular Jaikuaa yachachikuyta rikuchishan, Jai sutiyuq uturunku mascotap kinrayninpi"
};
