import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — 學習瓜拉尼語，巴拉圭的活語言";
const DESC = "以百分之百真人錄音、短小互動課程與可驗證證書學習瓜拉尼語，連結巴拉圭的人民、文化與商業。";

export const Route = createFileRoute("/zh")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "zh_TW" },
      { property: "og:url", content: "https://www.jaikuaa.com/zh" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/zh" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "pt-BR", href: "https://www.jaikuaa.com/pt" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo de chino tradicional.
const COPY: IntlCopy = {
  lang: "zh",
  notice: "繁體中文預覽版 · 審核中（由母語人士審閱）· Traducción preliminar, en revisión",
  eyebrow: "專業人士的瓜拉尼語",
  title: "掌握瓜拉尼語：",
  titleAccent: "南美洲的活語言。",
  subtitle: "巴拉圭大多數人都說瓜拉尼語。透過真人錄音與短小的互動課程，連結這個國家的文化、商業與人民。",
  cta: "開始學習",
  login: "登入",
  pillarsTitle: "為什麼選擇 Jaikuaa 學習瓜拉尼語",
  pillars: [
    { title: "真正的文化與商業連結", body: "在巴拉圭，瓜拉尼語是建立信任的語言。無論您從事投資、科技或外交，它都能為您打開西班牙語與英語無法打開的門。" },
    { title: "百分之百真人錄音", body: "不使用語音合成。每個詞都由巴拉圭人親自錄製，讓您聽到最真實的發音。" },
    { title: "為忙碌的專業人士設計", body: "每天只需幾分鐘，手機或電腦皆可使用。追蹤學習進度，按照自己的步調取得可驗證的證書。" },
  ],
  trustTitle: "機構認可",
  trust: [
    "巴拉圭眾議院宣告為國家及教育利益項目（第 2001 號宣告）。",
    "巴拉圭參議院宣告（第 547/2026 號）及語言政策秘書處第 116/2026 號決議。",
    "結業證書附有公開驗證碼。",
  ],
  closingTitle: "今天就開始說巴拉圭的語言",
  closingBody: "不到一分鐘即可建立帳戶，並開始您的第一堂課。",
  imageAlt: "手機顯示 Jaikuaa 課程，旁邊是美洲豹吉祥物 Jai",
};
