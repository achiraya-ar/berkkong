export const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

export function BrandMark({
  size = 40,
  className = "",
  alt = "BerkKong",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={logoSrc}
      width={size}
      height={size}
      alt={alt}
      className={`brand-mark ${className}`.trim()}
      draggable={false}
    />
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-wordmark ${compact ? "brand-wordmark--compact" : ""}`}>
      <span className="brand-wordmark__berk">BERK</span>
      <span className="brand-wordmark__kong">KONG</span>
    </span>
  );
}
