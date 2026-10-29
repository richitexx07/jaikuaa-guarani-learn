import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Paraguay'ın Yaşayan Dili Guarani'yi Öğrenin";
const DESC = "Gerçek insan sesleri ve interaktif derslerle Jaikuaa üzerinden Paraguay'ın dili olan Guarani'yi öğrenin.";

export const Route = createFileRoute("/tr")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "tr_TR" },
      { property: "og:url", content: "https://www.jaikuaa.com/tr" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/tr" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "tr",
  "eyebrow": "Profesyoneller için Guarani",
  "title": "Guarani dilinde uzmanlaşın:",
  "titleAccent": "Güney Amerika'nın yaşayan dili.",
  "subtitle": "Guarani, Paraguay halkının çoğunluğu tarafından konuşulmaktadır. Gerçek insan sesleri ve kısa, etkileşimli derslerle ülkenin kültürüne, iş dünyasına ve insanlarına bağlanın.",
  "cta": "Öğrenmeye Başlayın",
  "login": "Giriş Yap",
  "pillarsTitle": "Neden Jaikuaa ile Guarani Öğrenmelisiniz?",
  "pillars": [
    {
      "title": "Gerçek Kültürel ve Ticari Bağlantı",
      "body": "Paraguay'da Guarani, güvenin dilidir. İster yatırım yapıyor, ister diplomaside çalışıyor, ister bölgeye seyahat ediyor olun; İspanyolca ve İngilizcenin açamadığı kapıları açar."
    },
    {
      "title": "%100 Gerçek İnsan Sesleri",
      "body": "Yapay seslendirme yok. Her kelime, tam olarak konuşulduğu gibi duyabilmeniz için Paraguay'ın yerlileri tarafından kaydedilmiştir."
    },
    {
      "title": "Yoğun Profesyoneller İçin Tasarlandı",
      "body": "Mobil cihazlarda veya masaüstünde günde sadece birkaç dakika. İlerlemenizi takip edin ve kendi hızınızda doğrulanabilir sertifikalar kazanın."
    }
  ],
  "trustTitle": "Kurumsal Tanınırlık",
  "trust": [
    "Paraguay Temsilciler Meclisi tarafından Ulusal ve Eğitsel İlgi Alanı ilan edilmiştir (Bildiri No. 2001).",
    "Paraguay Senatosu Bildirisi (Bildiri 547/2026) ve Dil Politikaları Sekreterliği Kararı (Karar 116/2026).",
    "Herkese açık doğrulama koduna sahip tamamlama sertifikaları."
  ],
  "closingTitle": "Paraguay'ın Dilini Bugün Konuşmaya Başlayın",
  "closingBody": "Bir dakikadan kısa sürede hesabınızı oluşturun ve ilk dersinize başlayın.",
  "imageAlt": "Jaguar maskotu Jai'nin yanında Jaikuaa dersini gösteren akıllı telefon"
};
