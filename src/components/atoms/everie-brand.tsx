import Link from "next/link";
import { Flower2 } from "lucide-react";

import { cn } from "@/lib/utils";

type EverieBrandProps = {
  href?: string | null;
  suffix?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function EverieBrand({
  href = "/",
  suffix,
  className,
  iconClassName,
  textClassName,
}: EverieBrandProps) {
  const content = (
    <>
      <Flower2 aria-hidden="true" className={cn("size-[1.05rem] shrink-0 text-[#C5A880]", iconClassName)} />
      <span
        className={cn(
          "whitespace-nowrap font-serif text-[1.08rem] font-medium uppercase tracking-[0.22em] text-white sm:text-[1.16rem]",
          textClassName,
        )}
      >
        EVERIE{suffix ? ` ${suffix}` : ""}
      </span>
    </>
  );

  if (!href) {
    return <span className={cn("inline-flex items-center gap-2.5", className)}>{content}</span>;
  }

  return (
    <Link
      href={href}
      aria-label={suffix ? `Everie ${suffix}` : "Everie home"}
      className={cn(
        "inline-flex items-center gap-2.5 opacity-90 transition-opacity duration-300 hover:opacity-100",
        className,
      )}
    >
      {content}
    </Link>
  );
}
