import Link from "next/link";

/**
 * The mark is a 9x22 solid rectangle in the accent colour; the wordmark is live
 * text, not an image. Mobile steps both down one notch (8x19 / 17px).
 */
const Logo = ({ href = "/" }: { href?: string }) => (
  <Link className="flex items-center gap-[9px] md:gap-[11px]" href={href}>
    <span
      aria-hidden
      className="h-[19px] w-[8px] bg-signal md:h-[22px] md:w-[9px]"
    />
    <span className="font-semibold text-[17px] tracking-[-0.02em] md:text-[19px]">
      Digest
    </span>
  </Link>
);

export const LogoMark = ({ className = "" }: { className?: string }) => (
  <span
    aria-hidden
    className={`block h-[22px] w-[9px] bg-signal ${className}`}
  />
);

export default Logo;
