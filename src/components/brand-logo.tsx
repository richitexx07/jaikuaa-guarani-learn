import logoUrl from "@/assets/jaikuaa-logo.webp";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  /** En celulares angostos (o con letra grande) el nombre se oculta y queda solo el ícono. */
  wordmarkFromSm?: boolean;
};

export function BrandLogo({ className = "", size = 36, withWordmark = true, wordmarkFromSm = false }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold text-primary", className)}>
      <img
        src={logoUrl}
        alt="Jaikuaa"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-[22%] object-contain"
        draggable={false}
      />
      {withWordmark && <span className={cn("text-xl tracking-tight", wordmarkFromSm && "hidden sm:inline")}>Jaikuaa</span>}
    </span>
  );
}
