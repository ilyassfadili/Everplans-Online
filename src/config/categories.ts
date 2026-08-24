import {
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Plane,
  Sprout,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The real categories Everplans organizes planners into - static, not
 * DB-backed (there is no `categories` table any more than there's a real
 * multi-product commerce backend yet), same situation as `@/config/products`.
 * `getCategories()` (`@/lib/planner-catalog`) is what turns this list into
 * real `Category` values by attaching each one's actual published-planner
 * count - nothing here claims availability on its own.
 */
export interface CategoryDefinition {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

// `slug` must match the `categorySlug` a real product's `ProductLandingConfig`
// declares (see `@/config/products/wedding-planner.ts`'s `categorySlug:
// "wedding"`) - that's the join key `getCategories()` counts published
// planners by.
export const categoryDefinitions: CategoryDefinition[] = [
  {
    slug: "wedding",
    name: "Weddings & Celebrations",
    description: "Weddings, celebrations, and major events.",
    icon: Heart,
  },
  {
    slug: "money",
    name: "Money & Finances",
    description: "Budgets, savings, and financial organization.",
    icon: Wallet,
  },
  {
    slug: "travel",
    name: "Travel & Adventures",
    description: "Trips, itineraries, and travel organization.",
    icon: Plane,
  },
  {
    slug: "home",
    name: "Home & Moving",
    description: "Moving, home projects, renovations, and organization.",
    icon: Home,
  },
  {
    slug: "family",
    name: "Family & Life",
    description: "Family planning, life milestones, and personal organization.",
    icon: Users,
  },
  {
    slug: "education",
    name: "Education & Goals",
    description: "Study plans, learning, certifications, and personal goals.",
    icon: GraduationCap,
  },
  {
    slug: "business",
    name: "Business & Projects",
    description: "Projects, launches, small-business planning, and professional goals.",
    icon: Briefcase,
  },
  {
    slug: "personal-growth",
    name: "Personal Growth & Lifestyle",
    description: "Habits, routines, wellness goals, and lifestyle projects.",
    icon: Sprout,
  },
];
