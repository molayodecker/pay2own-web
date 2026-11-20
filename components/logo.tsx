import Image from "next/image";
import Link from "next/link";

export function Logo({
  byline = false,
  className = "",
  imageClassName = "h-8 w-auto md:h-9",
}: {
  byline?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Link href="/" aria-label="Pay2Own by Instaclean, home" className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <Image src="/assets/logo.webp" alt="Pay2Own" width={2090} height={480} className={imageClassName} priority />
      {byline ? (
        <span className="pl-[2.3rem] text-xs leading-none font-semibold text-white/85 md:pl-[2.55rem]">by Instaclean</span>
      ) : null}
    </Link>
  );
}
