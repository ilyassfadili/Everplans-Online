import type { ReactNode } from "react";

import { Logo } from "@/components/site/logo";
import { Heading, Text } from "@/components/ui";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * A single centered card - not a two-column split. Sign In and Sign Up are
 * short, single-purpose forms; a dark brand sidebar was more chrome than a
 * page this size needs. `bg-surface-muted` on the page against `bg-surface`
 * on the card is what gives the card its edge, rather than reaching for a
 * heavier shadow than a page this minimal calls for.
 *
 * Both routes render this one component so they stay visually identical.
 */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line-subtle bg-surface p-8 shadow-sm sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <Heading as="h1" size="h2" className="mt-6">
            {title}
          </Heading>
          <Text tone="muted" className="mt-1.5">
            {subtitle}
          </Text>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
