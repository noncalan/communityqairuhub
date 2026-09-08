"use client";

import Link, { useLinkStatus } from "next/link";
import { forwardRef, type ComponentProps } from "react";

type ClientNavLinkProps = ComponentProps<typeof Link>;

export const ClientNavLink = forwardRef<HTMLAnchorElement, ClientNavLinkProps>(
  function ClientNavLink({ children, ...props }, ref) {
    return (
      <Link ref={ref} {...props}>
        {children}
        <LinkPendingIndicator />
      </Link>
    );
  },
);

function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-primary transition-opacity ${pending ? "animate-pulse opacity-100" : "opacity-0"}`}
    />
  );
}
