export type Language = {
  slug: string;
  name: string;
  flag: string;
  featured?: boolean;
};

// Jaikuaa es solo guaraní.
export const LANGUAGES: Language[] = [
  { slug: "guarani", name: "Guaraní", flag: "🇵🇾", featured: true },
];

export function getLanguage(slug: string): Language | undefined {
  return LANGUAGES.find((l) => l.slug === slug);
}
