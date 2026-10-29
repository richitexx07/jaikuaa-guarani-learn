import { createFileRoute } from "@tanstack/react-router";
import { IntlLanding, type IntlCopy } from "@/components/marketing/intl-landing";

const TITLE = "Jaikuaa — Guarani सीखें, पराग्वे की जीवंत भाषा";
const DESC = "100% वास्तविक मानवीय आवाज़ों, छोटे पाठों और सत्यापन योग्य प्रमाणपत्र के साथ Guarani सीखें। पराग्वे के लोगों, संस्कृति और व्यवसाय से जुड़ें।";

export const Route = createFileRoute("/hi")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "hi_IN" },
      { property: "og:url", content: "https://www.jaikuaa.com/hi" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.jaikuaa.com/hi" },
      { rel: "alternate", hrefLang: "es", href: "https://www.jaikuaa.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://www.jaikuaa.com/en" },
    ],
  }),
  component: () => <IntlLanding c={COPY} />,
});

// Traducción preliminar: pendiente de revisión por un hablante nativo.
const COPY: IntlCopy = {
  "lang": "hi",
  "eyebrow": "पेशेवरों के लिए Guarani",
  "title": "Guarani में महारत हासिल करें:",
  "titleAccent": "दक्षिण अमेरिका की जीवंत भाषा।",
  "subtitle": "Guarani पराग्वे के अधिकांश लोगों द्वारा बोली जाती है। वास्तविक मानवीय आवाज़ों और छोटे इंटरैक्टिव पाठों के माध्यम से देश की संस्कृति, व्यवसाय और लोगों से जुड़ें।",
  "cta": "सीखना शुरू करें",
  "login": "साइन इन करें",
  "pillarsTitle": "Jaikuaa के साथ Guarani क्यों सीखें",
  "pillars": [
    {
      "title": "सच्चा सांस्कृतिक और व्यावसायिक जुड़ाव",
      "body": "पराग्वे में Guarani विश्वास की भाषा है। चाहे आप निवेश कर रहे हों, कूटनीति में काम कर रहे हों या इस क्षेत्र की यात्रा कर रहे हों, यह ऐसे द्वार खोलती है जो स्पैनिश और अंग्रेज़ी नहीं खोल सकते।"
    },
    {
      "title": "100% वास्तविक मानवीय आवाज़",
      "body": "कोई टेक्स्ट-टू-स्पीच नहीं। प्रत्येक शब्द पराग्वे के मूल निवासियों द्वारा रिकॉर्ड किया गया है, ताकि आप इसे बिल्कुल वैसे ही सुनें जैसे यह बोला जाता है।"
    },
    {
      "title": "व्यस्त पेशेवरों के लिए निर्मित",
      "body": "मोबाइल या डेस्कटॉप पर दिन में बस कुछ मिनट। अपनी प्रगति ट्रैक करें और अपनी गति से सत्यापन योग्य प्रमाणपत्र प्राप्त करें।"
    }
  ],
  "trustTitle": "संस्थागत मान्यता",
  "trust": [
    "पराग्वे के चैंबर ऑफ डेप्युटीज़ द्वारा राष्ट्रीय और शैक्षिक हित का घोषित (Decl. No. 2001)।",
    "पराग्वे की सीनेट का घोषणपत्र (Decl. 547/2026) और भाषा नीति सचिवालय का संकल्प (Resolution 116/2026)।",
    "सार्वजनिक सत्यापन कोड के साथ पूर्णता प्रमाणपत्र।"
  ],
  "closingTitle": "आज ही पराग्वे की भाषा बोलना शुरू करें",
  "closingBody": "एक मिनट से भी कम समय में अपना खाता बनाएं और अपना पहला पाठ लें।",
  "imageAlt": "स्मार्टफोन जिसमें Jai, जैगुआर मैस्कॉट, के बगल में Jaikuaa का पाठ दिखाया गया है"
};
