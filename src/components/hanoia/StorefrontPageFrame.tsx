import type { ReactNode } from "react";

import Footer from "@/components/hanoia/Footer";
import Header from "@/components/hanoia/Header";

/**
 * Shared EVERIE storefront page structure.
 * Routes using this frame also share the StorefrontLayout providers,
 * mobile navigation, settings and the authenticated customer session.
 */
export function StorefrontPageFrame({
  children,
  mainClassName = "",
}: {
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100">
      <Header />
      <main className={"flex-1 " + mainClassName}>{children}</main>
      <Footer />
    </div>
  );
}
