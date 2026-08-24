import type { LucideIcon } from "lucide-react";

/**
 * The shape of one public Product Landing Page - the reusable sales/marketing
 * page architecture for an Everplans product, distinct from both the public
 * discovery catalog (`@/types/planner`, `(site)/planners`, still empty) and
 * the authenticated Store (`@/types/store`, `(app)/app/store`). A Product
 * Landing Page explains, presents, and markets exactly one real product -
 * today, only the Wedding Planner has one. Adding a second product means
 * writing a second `ProductLandingConfig` (see `@/config/products/`), never
 * touching the section components in `@/components/product-landing/`.
 *
 * Every string here is real copy about a real, already-implemented feature -
 * nothing on this page is allowed to describe capability the product doesn't
 * actually have (see each config file's own comments for what's verified).
 */

/** One image/screenshot slot - defined now, filled with a real asset later without touching the section that renders it. */
export interface ProductImagePlaceholder {
  /** What belongs here once supplied, e.g. "Dashboard overview" - doubles as the placeholder's accessible label (via `alt`, once `src` is set) and, while `src` is unset, the placeholder box's own caption. */
  label: string;
  /** CSS aspect-ratio value, e.g. "16/10", "4/3". */
  aspectRatio: string;
  /** Path under `public/` once a real asset exists, e.g. `/products/wedding-planner/hero.png`. Unset renders the honest "not supplied yet" placeholder box - see `ProductImageSlot`'s own comment. */
  src?: string;
}

export interface ProductValueProp {
  icon: LucideIcon;
  title: string;
  body: string;
}

/** One grouped feature story - several real capabilities told as one outcome, not a flat feature-dump. */
export interface ProductFeatureStory {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  image: ProductImagePlaceholder;
  /** Alternates left/right per story so the sequence has visual rhythm instead of repeating the same layout. */
  imagePosition: "left" | "right";
}

export interface ProductStep {
  title: string;
  body: string;
}

export interface ProductDifferentiator {
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface ProductIncludedItem {
  title: string;
  body: string;
}

/**
 * Purchase/access information - data-driven so a real commerce integration
 * can populate this later without a section rewrite. `model` records what's
 * verified true today; nothing here invents a price or a billing cadence
 * that doesn't exist yet (see `commerce-provisioning.ts`'s own comment on
 * why the product-wide commerce system isn't wired to anything yet).
 */
export interface ProductPricing {
  model: "free" | "one-time" | "subscription" | "pending";
  /** Integer minor units (cents) - the canonical numeric price `getPublishedPlanners()` reads for card-level lock/price display (`@/lib/planner-catalog`). `null` whenever `model` is `"free"` or `"pending"` - never a placeholder number standing in for a price that hasn't actually been set. */
  priceCents: number | null;
  priceLabel: string;
  billingNote: string;
  ctaLabel: string;
  included: string[];
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

export interface ProductLandingConfig {
  slug: string;
  name: string;
  /**
   * Path under `public/` for the small marketing image shown on this
   * product's *card* (the public `/planners` catalog and the authenticated
   * Store, `PlannerCard`/`StoreProductCard`) - a different asset from
   * `hero.image`/`featureStories[].image`, which are full product
   * screenshots for the landing page itself. A card is small and scanned
   * quickly, so this wants one evocative image, not a screenshot. Unset
   * renders the honest icon-in-a-box placeholder both cards already have.
   */
  coverImageSrc?: string;
  category: string;
  /** The same category, as a stable slug (e.g. `"wedding"` for `"Wedding"`) - kept alongside the display name rather than derived from it, so the public catalog (`@/lib/planner-catalog`) and any future category-scoped route have a real value to key off rather than slugifying display text at read time. */
  categorySlug: string;
  seo: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    /** Same-page anchor, e.g. "#included" - the secondary CTA orients rather than leaves the page. */
    secondaryCtaHref: string;
    image: ProductImagePlaceholder;
  };
  valueProps: ProductValueProp[];
  problem: {
    heading: string;
    withoutBody: string;
    withBody: string;
  };
  featureStories: ProductFeatureStory[];
  howItWorksHeading: string;
  howItWorks: ProductStep[];
  whoItsFor: {
    heading: string;
    body: string;
  };
  differentiators: ProductDifferentiator[];
  included: ProductIncludedItem[];
  pricing: ProductPricing;
  faq: ProductFaqItem[];
  finalCta: {
    heading: string;
    body: string;
  };
  /**
   * Where every CTA on this page sends a visitor - always the product's
   * real, already-correct access flow. For a product with no real checkout
   * yet (e.g. Wedding Planner), that's the workspace itself
   * (`/app/wedding-planner`, which redirects to sign-in or onboarding as
   * needed) - never a fabricated purchase route with nothing behind it. For
   * a product with a real commerce layer (Budget Planner,
   * `/app/budget-planner/checkout`), it's a route that itself resolves
   * "already owns this" vs. "needs to buy this" server-side, since this
   * page stays fully public/static with no per-viewer state of its own.
   */
  ctaHref: string;
}
