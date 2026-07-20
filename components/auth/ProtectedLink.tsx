"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useLoginRequired } from "@/components/auth/LoginRequiredProvider";
import { requiresAuthForNavigation } from "@/lib/auth/publicRoutes";

type ProtectedLinkProps = ComponentProps<typeof Link>;

export function ProtectedLink({ href, onClick, ...props }: ProtectedLinkProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { showLoginRequired } = useLoginRequired();

  const hrefString = typeof href === "string" ? href : (href.pathname ?? "/");

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (!isLoaded || isSignedIn || !requiresAuthForNavigation(hrefString)) {
      return;
    }

    event.preventDefault();
    showLoginRequired(hrefString);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
