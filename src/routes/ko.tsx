import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — 파라과이의 살아 있는 언어, 과라니어를 배우세요";
const DESC = "실제 사람의 목소리, 짧은 수업, 확인 가능한 수료증으로 과라니어를 배우고 파라과이의 사람·문화·비즈니스와 연결되세요.";

export const Route = createFileRoute("/ko")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ko_KR" },
      { property: "og:url", content: "https://www.jaikuaa.com/ko" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/ko" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "pt-BR", href: "https://www.jaikuaa.com/pt" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "ko",
  "notice": "한국어 미리보기 · 원어민 검토 중 · Traducción preliminar, en revisión",
  "eyebrow": "전문가를 위한 과라니어",
  "title": "과라니어를 배우세요:",
  "titleAccent": "남미에서 지금도 살아 있는 언어.",
  "subtitle": "파라과이에서는 많은 사람이 과라니어를 사용합니다. 실제 사람의 목소리와 짧은 수업으로 이 나라의 문화, 비즈니스, 사람들과 연결되세요.",
  "cta": "지금 시작하기",
  "login": "로그인",
  "pillarsTitle": "Jaikuaa에서 과라니어를 배우는 이유",
  "pillars": [
    { "title": "문화와 비즈니스의 진정한 연결", "body": "파라과이에서 과라니어는 신뢰를 쌓는 언어입니다. 투자, 농업, 기술, 외교 어느 분야에서든 스페인어나 영어로는 열리지 않는 문을 열어 줍니다." },
    { "title": "100% 실제 사람의 목소리", "body": "음성 합성을 사용하지 않습니다. 모든 단어를 파라과이 사람이 직접 녹음해 진짜 발음을 들을 수 있습니다." },
    { "title": "바쁜 분들을 위해", "body": "하루 몇 분, 휴대폰이나 컴퓨터로. 진도를 기록하고 자신의 속도로 확인 가능한 수료증을 받으세요." }
  ],
  "trustTitle": "공식 인정",
  "trust": [
    "파라과이 하원이 국가적·교육적 관심 사안으로 선언(선언 제2001호).",
    "파라과이 상원 선언(제547/2026호) 및 언어정책청 결의 제116/2026호.",
    "수료증에는 공개 확인 코드가 있습니다."
  ],
  "closingTitle": "오늘부터 파라과이의 언어를 말해 보세요",
  "closingBody": "계정 만들기는 1분도 걸리지 않습니다. 바로 첫 수업을 시작할 수 있습니다.",
  "imageAlt": "Jaikuaa 수업이 표시된 스마트폰과 재규어 마스코트 Jai"
};
