import { brand } from "@/app/config/brand";
import { cn } from "@/lib/utils";

/** Logo local (PNG) — remplace l’ancienne URL Lovable `/__l5e/...` qui ne chargeait pas hors Lovable. */
export function BrandLogo({
  className,
  markClassName,
  showWordmark = false,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={brand.logoUrl}
        alt=""
        aria-hidden={showWordmark ? true : undefined}
        className={cn("size-9 object-contain", markClassName)}
      />
      {showWordmark ? (
        <span className={cn("min-w-0", wordmarkClassName)}>
          <span className="block font-display text-base font-semibold tracking-tight text-foreground">
            {brand.name}
          </span>
          <span className="block text-[11px] font-medium tracking-wide text-primary uppercase">
            {brand.tagline}
          </span>
        </span>
      ) : (
        <span className="sr-only">{brand.name}</span>
      )}
    </span>
  );
}

/** Symbole SVG fallback — fonctionne sur fond clair et sombre. */
export function SolidCareMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-9", className)}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="24" cy="24" r="22" className="stroke-primary" strokeWidth="2" />
      <path
        d="M12 28c6-12 10-4 14-10s6 14 12 6"
        className="stroke-secondary"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="24" r="2.2" className="fill-primary" />
      <circle cx="26" cy="18" r="2.2" className="fill-secondary" />
      <circle cx="34" cy="26" r="2.2" className="fill-primary" />
    </svg>
  );
}
