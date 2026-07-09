"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function scrollWindowToTop() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function shouldPreserveHash(hash: string, pathname: string): boolean {
  if (!hash) {
    return false;
  }

  const id = decodeURIComponent(hash.slice(1));
  if (!id) {
    return false;
  }

  // Old Calculator menu used #category-* and jumped to lower sections.
  // Always open /calculators at the top unless it's a specific calculator card slug.
  if (pathname === "/calculators" && id.startsWith("category-")) {
    return false;
  }

  return Boolean(document.getElementById(id));
}

/**
 * Force soft navigations to open at the top of the page
 * (title + first section), matching the expected Calculators landing view.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useIsoLayoutEffect(() => {
    const hash = window.location.hash;

    if (shouldPreserveHash(hash, pathname)) {
      return;
    }

    if (hash && pathname === "/calculators" && hash.startsWith("#category-")) {
      window.history.replaceState(null, "", pathname + (search ? `?${search}` : ""));
    }

    scrollWindowToTop();

    const timeouts = [0, 50, 150, 300].map((ms) => window.setTimeout(scrollWindowToTop, ms));
    const frame = requestAnimationFrame(scrollWindowToTop);

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      cancelAnimationFrame(frame);
    };
  }, [pathname, search]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      // Same-route menu clicks (Calculator → /calculators while already there).
      if (url.pathname === window.location.pathname && !url.hash) {
        scrollWindowToTop();
        [0, 50, 150].forEach((ms) => window.setTimeout(scrollWindowToTop, ms));
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
