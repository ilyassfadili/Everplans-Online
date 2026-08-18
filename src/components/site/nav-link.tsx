"use client";

import { usePathname } from "next/navigation";

import { Link } from "@/components/ui/link";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/config/navigation";

interface NavLinkProps {
  item: NavItem;
  className?: string;
  onNavigate?: () => void;
}

/**
 * A nav item that knows whether it's the current page. Isolated as its own
 * small Client Component (rather than making the whole header client-side)
 * because `usePathname()` is the only thing here that actually needs the
 * browser - everything else in the header can stay server-rendered.
 */
export function NavLink({ item, className, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const isCurrent = pathname === item.href;

  return (
    <Link
      href={item.href}
      variant="nav"
      aria-current={isCurrent ? "page" : undefined}
      onClick={onNavigate}
      className={cn("text-body-sm", className)}
    >
      {item.label}
    </Link>
  );
}
