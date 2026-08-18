import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { authNav, primaryNav } from "@/config/navigation";

import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

/*
  Header height is a hardcoded h-16 (64px), matched by MobileMenu's
  top-16/inset math - if this changes, update mobile-menu.tsx too.

  Sticky with a hairline bottom border and a translucent + backdrop-blur
  surface: the border is always present at low opacity rather than being
  toggled in by a scroll listener, so the header needs no client-side
  scroll JS to look intentional both at the very top of a page and once
  scrolled - one visual treatment, zero extra runtime cost.
*/
export function Header() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-line-subtle bg-surface/85 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between">
        <Logo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <NavLink item={item} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href={authNav.signIn.href} variant="outline" size="sm">
            {authNav.signIn.label}
          </Button>
          <Button href={authNav.signUp.href} variant="primary" size="sm">
            {authNav.signUp.label}
          </Button>
        </div>

        <MobileMenu />
      </Container>
    </header>
  );
}
