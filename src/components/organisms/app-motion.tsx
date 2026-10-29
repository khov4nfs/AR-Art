"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const REVEAL_SELECTOR =
  '.everie-section, main section:not([role="dialog"]), main article, [data-reveal]';
const ROUTE_LEAVE_MS = 260;

function isPlainLeftClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function shouldHandleRoute(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (!isPlainLeftClick(event) || event.defaultPrevented) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download") || anchor.dataset.noTransition !== undefined) return false;

  const rawHref = anchor.getAttribute("href");
  if (!rawHref || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return false;

  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin) return false;

  const current = new URL(window.location.href);
  const sameDocument =
    destination.pathname === current.pathname && destination.search === current.search;

  if (sameDocument) return false;

  return true;
}

export function AppMotion() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("route-leaving");
    root.classList.add("route-entering");

    const enterTimer = window.setTimeout(() => {
      root.classList.remove("route-entering");
    }, 680);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const registered = new WeakSet<Element>();
    let revealIndex = 0;

    const observer = reducedMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            });
          },
          { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
        );

    function registerElement(element: Element) {
      if (registered.has(element) || element.closest("[data-motion-skip]")) return;
      registered.add(element);

      const htmlElement = element as HTMLElement;
      htmlElement.classList.add("motion-reveal");
      if (htmlElement.tagName === "ARTICLE") htmlElement.classList.add("motion-reveal-card");

      const explicitDelay = htmlElement.dataset.revealDelay;
      const delay = explicitDelay ? Number(explicitDelay) : (revealIndex % 5) * 55;
      htmlElement.style.setProperty("--motion-delay", `${Number.isFinite(delay) ? delay : 0}ms`);
      revealIndex += 1;

      if (reducedMotion) htmlElement.classList.add("is-visible");
      else observer?.observe(htmlElement);
    }

    function registerWithin(scope: ParentNode) {
      scope.querySelectorAll(REVEAL_SELECTOR).forEach(registerElement);
    }

    registerWithin(document);

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(REVEAL_SELECTOR)) registerElement(node);
          registerWithin(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    let navigationFallback: number | null = null;

    function onDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !shouldHandleRoute(anchor, event)) return;

      event.preventDefault();
      const destination = new URL(anchor.href, window.location.href);
      const href = `${destination.pathname}${destination.search}${destination.hash}`;

      root.classList.remove("route-entering");
      root.classList.add("route-leaving");

      window.setTimeout(() => router.push(href), ROUTE_LEAVE_MS);
      if (navigationFallback) window.clearTimeout(navigationFallback);
      navigationFallback = window.setTimeout(() => {
        root.classList.remove("route-leaving");
        root.classList.add("route-entering");
        window.setTimeout(() => root.classList.remove("route-entering"), 620);
      }, 1100);
    }

    document.addEventListener("click", onDocumentClick, true);

    return () => {
      window.clearTimeout(enterTimer);
      if (navigationFallback) window.clearTimeout(navigationFallback);
      observer?.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [pathname, router]);

  return (
    <div className="route-curtain" aria-hidden="true">
      <span className="route-curtain-line" />
    </div>
  );
}
