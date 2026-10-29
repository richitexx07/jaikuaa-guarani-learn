import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — تعلّم لغة Guarani، اللغة الحيّة في باراغواي";
const DESC = "تعلّم لغة Guarani بأصوات بشرية حقيقية 100%، ودروس مقتضبة، وشهادة قابلة للتحقق. تواصل مع شعب باراغواي وثقافتها وعالم الأعمال فيها.";

export const Route = createFileRoute("/ar")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_AR" },
      { property: "og:url", content: "https://www.jaikuaa.com/ar" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/ar" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "ar",
  "eyebrow": "لغة Guarani للمهنيين",
  "title": "أتقن لغة Guarani:",
  "titleAccent": "اللغة الحيّة في أمريكا الجنوبية.",
  "subtitle": "يتحدث غالبية سكان باراغواي لغة Guarani. تواصل مع ثقافة البلاد وعالم أعمالها وشعبها عبر أصوات بشرية حقيقية ودروس تفاعلية قصيرة.",
  "cta": "ابدأ التعلّم",
  "login": "تسجيل الدخول",
  "pillarsTitle": "لماذا تتعلّم Guarani مع Jaikuaa",
  "pillars": [
    {
      "title": "تواصل ثقافي وتجاري حقيقي",
      "body": "Guarani هي لغة الثقة في باراغواي. سواء كنت تستثمر، أو تعمل في السلك الدبلوماسي، أو تستكشف المنطقة، فإنها تفتح لك أبواباً لا تستطيع الإسبانية أو الإنجليزية فتحها."
    },
    {
      "title": "تسجيلات صوتية بشرية حقيقية 100%",
      "body": "لا نستخدم التوليد الصوتي الآلي. كل كلمة سجّلها متحدثون في باراغواي، لتسمعها تماماً كما تُنطق في الواقع."
    },
    {
      "title": "مصممة للمهنيين المشغولين",
      "body": "بضع دقائق يومياً عبر الهاتف أو الحاسوب. تتبّع تقدمك واحصل على شهادة قابلة للتحقق وفق وتيرتك الخاصة."
    }
  ],
  "trustTitle": "اعتراف مؤسسي",
  "trust": [
    "أُعلنت ذات أهمية وطنية وتعليمية من قِبل مجلس النواب في باراغواي (Decl. No. 2001).",
    "إعلان من مجلس الشيوخ في باراغواي (Decl. 547/2026) والقرار Resolution 116/2026 الصادر عن أمانة السياسات اللغوية.",
    "شهادة إتمام مزودة برمز تحقق عام."
  ],
  "closingTitle": "ابدأ التحدث بلغة باراغواي اليوم",
  "closingBody": "أنشئ حسابك في أقل من دقيقة وابدأ درسك الأول.",
  "imageAlt": "هاتف ذكي يعرض درساً من تطبيق Jaikuaa بجانب Jai، تميمة اليغور"
};
