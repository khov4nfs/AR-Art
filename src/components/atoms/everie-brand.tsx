import Link from "next/link";
import { Orbit } from "lucide-react";

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
      <Orbit
        aria-hidden="true"
        className={cn("size-[1.05rem] shrink-0 text-white/42", iconClassName)}
      />
      <span
        className={cn(
          "whitespace-nowrap text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-white/78 sm:text-[0.82rem]",
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
