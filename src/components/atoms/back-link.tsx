import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export const backNavigationClassName =
  "group inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-white/42 transition-colors duration-300 hover:text-white/78";

type BackLinkProps = {
  href: string;
  label?: string;
  className?: string;
};

export function BackLink({ href, label = "Gallery", className }: BackLinkProps) {
  return (
    <Link href={href} className={cn(backNavigationClassName, className)}>
      <ArrowLeft
        aria-hidden="true"
        className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
      />
      <span>{label}</span>
    </Link>
  );
}
