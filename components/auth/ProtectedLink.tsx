"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useLoginRequired } from "@/components/auth/LoginRequiredProvider";
import { requiresAuthForNavigation } from "@/lib/auth/publicRoutes";
import { buildSignInUrl } from "@/lib/auth/signInRedirect";

type ProtectedLinkProps = ComponentProps<typeof Link>;

export function ProtectedLink({ href, onClick, ...props }: ProtectedLinkProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { showLoginRequired } = useLoginRequired();
  const router = useRouter();

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
    const destination = buildSignInUrl(hrefString);
    showLoginRequired(() => {
      router.push(destination);
    });
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
