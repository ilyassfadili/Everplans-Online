/**
 * Single source of truth for the Public Website's navigation. The desktop
 * header, mobile menu, and footer all read from this rather than each
 * maintaining their own list - three lists drift apart, one doesn't.
 */

export interface NavItem {
  label: string;
  href: string;
}

/** The public discovery pages, in header/menu order. */
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Planners", href: "/planners" },
  { label: "Categories", href: "/categories" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

export const authNav = {
  signIn: { label: "Sign In", href: "/sign-in" } satisfies NavItem,
  signUp: { label: "Sign Up", href: "/sign-up" } satisfies NavItem,
};
