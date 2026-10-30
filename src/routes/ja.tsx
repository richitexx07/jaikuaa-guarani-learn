import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — パラグアイの生きた言語、グアラニー語を学ぶ";
const DESC = "本物の人の声、短いレッスン、検証可能な修了証でグアラニー語を学び、パラグアイの人々・文化・ビジネスとつながりましょう。";

export const Route = createFileRoute("/ja")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ja_JP" },
      { property: "og:url", content: "https://www.jaikuaa.com/ja" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/ja" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "pt-BR", href: "https://www.jaikuaa.com/pt" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "ja",
  "notice": "日本語プレビュー版・ネイティブスピーカーによる確認中 · Traducción preliminar, en revisión",
  "eyebrow": "プロフェッショナルのためのグアラニー語",
  "title": "グアラニー語を身につけよう：",
  "titleAccent": "南米で今も生きる言語。",
  "subtitle": "パラグアイでは多くの人がグアラニー語を話します。本物の人の声と短いレッスンで、この国の文化・ビジネス・人々とつながりましょう。",
  "cta": "学び始める",
  "login": "ログイン",
  "pillarsTitle": "Jaikuaaでグアラニー語を学ぶ理由",
  "pillars": [
    {
      "title": "文化とビジネスの本当のつながり",
      "body": "パラグアイでは、グアラニー語は信頼を築く言葉です。投資、農業、技術、外交のどの分野でも、スペイン語や英語では開かない扉を開いてくれます。"
    },
    {
      "title": "100%本物の人の声",
      "body": "音声合成は使いません。すべての言葉をパラグアイの人が録音しているので、本物の発音が聞けます。"
    },
    {
      "title": "忙しい方のために",
      "body": "1日数分、スマートフォンでもパソコンでも。進み具合を記録し、自分のペースで検証可能な修了証を取得できます。"
    }
  ],
  "trustTitle": "公的な認定",
  "trust": [
    "パラグアイ下院が国家的・教育的関心事として宣言（宣言第2001号）。",
    "パラグアイ上院宣言（第547/2026号）および言語政策庁決議第116/2026号。",
    "修了証には公開の確認コードが付いています。"
  ],
  "closingTitle": "今日からパラグアイの言葉を話そう",
  "closingBody": "アカウント作成は1分もかかりません。すぐに最初のレッスンを始められます。",
  "imageAlt": "Jaikuaaのレッスンを表示したスマートフォンと、ジャガーのマスコットJai"
};
