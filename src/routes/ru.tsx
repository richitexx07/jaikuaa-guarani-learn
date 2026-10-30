import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — учите гуарани, живой язык Парагвая";
const DESC = "Учите гуарани с живыми голосами, короткими уроками и проверяемым сертификатом — и станьте ближе к людям, культуре и бизнесу Парагвая.";

export const Route = createFileRoute("/ru")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ru_RU" },
      { property: "og:url", content: "https://www.jaikuaa.com/ru" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/ru" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "pt-BR", href: "https://www.jaikuaa.com/pt" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "ru",
  "notice": "Предварительная версия на русском · проверяется носителем языка · Traducción preliminar, en revisión",
  "eyebrow": "Гуарани для профессионалов",
  "title": "Освойте гуарани:",
  "titleAccent": "живой язык Южной Америки.",
  "subtitle": "Большинство жителей Парагвая говорят на гуарани. Живые голоса и короткие интерактивные уроки помогут вам стать ближе к культуре, бизнесу и людям этой страны.",
  "cta": "Начать учиться",
  "login": "Войти",
  "pillarsTitle": "Почему стоит учить гуарани с Jaikuaa",
  "pillars": [
    {
      "title": "Настоящая связь с культурой и бизнесом",
      "body": "В Парагвае гуарани — язык доверия. В инвестициях, сельском хозяйстве, технологиях или дипломатии он открывает двери, которые не открывают испанский и английский."
    },
    {
      "title": "100% живые голоса",
      "body": "Никакого синтеза речи. Каждое слово записано парагвайцами, чтобы вы слышали настоящее произношение."
    },
    {
      "title": "Для занятых людей",
      "body": "Несколько минут в день, на телефоне или компьютере. Следите за прогрессом и получите проверяемый сертификат в своём темпе."
    }
  ],
  "trustTitle": "Официальное признание",
  "trust": [
    "Палата депутатов Парагвая объявила проект представляющим национальный и образовательный интерес (Декларация № 2001).",
    "Декларация Сената Парагвая (№ 547/2026) и Резолюция Секретариата языковой политики № 116/2026.",
    "Сертификаты с открытым кодом проверки."
  ],
  "closingTitle": "Заговорите на языке Парагвая уже сегодня",
  "closingBody": "Создание аккаунта занимает меньше минуты, и вы сразу начнёте первый урок.",
  "imageAlt": "Телефон с уроком Jaikuaa рядом с талисманом Jai, ягуаром"
};
