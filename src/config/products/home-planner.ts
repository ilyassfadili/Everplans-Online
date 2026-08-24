import {
  Boxes,
  DoorOpen,
  Link2,
  ReceiptText,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * Home Planner's real, stable product identity for commerce - same shape
 * as `TRAVEL_PLANNER_PRODUCT` (`./travel-planner.ts`). `plannerId` matches
 * the literal id seeded by
 * `supabase/migrations/20260922000000_home_planner_commerce.sql`'s
 * `planner_definitions` insert (a `status = 'draft'` row, deliberately
 * invisible to the generic catalog/Store discovery reads - see that
 * migration's own comment for why a hand-built product still needs one of
 * these rows for entitlements to key off). `priceCents`/`currency` are the
 * one canonical price the checkout Server Action (`checkout/actions.ts`)
 * actually charges.
 */
export const HOME_PLANNER_PRODUCT = {
  plannerId: "77777777-7777-4777-8777-777777777777",
  slug: "home-planner",
  name: "Home Planner",
  priceCents: 2900,
  currency: "USD",
} as const;

/**
 * Home Planner's Product Landing Page content - the fifth real
 * implementation of `ProductLandingConfig`, following `wedding-planner.ts`/
 * `budget-planner.ts`/`travel-planner.ts`/`life-planner.ts`'s exact shape.
 * Every capability named below is a real, already-shipped module: a home
 * profile, rooms, inventory (with an "important items" view), maintenance
 * tasks with recurrence, bills, documents, projects with tasks, household
 * members, and contacts (see `src/types/home-planner.ts` and
 * `src/lib/home-planner/`).
 *
 * `pricing.model` is `"one-time"` at `HOME_PLANNER_PRODUCT.priceCents` -
 * the same $29 one-time price point every other Everplans product uses,
 * for consistency across the platform's pricing, not because a different
 * price was evaluated and rejected (see `travel-planner.ts`'s own comment
 * for the same reasoning). `ctaHref` points at `/app/home-planner/checkout`
 * (Prompt 6) - it itself resolves "already owns this" (redirects straight
 * into the workspace) vs. "needs to buy this" (starts a real PayPal Card
 * Fields/Buttons checkout) server-side, the same shape every other
 * product's `ctaHref` already establishes.
 *
 * No image assets exist for this product yet - `coverImageSrc` and every
 * `image.src` are left unset, rendering the honest "not supplied yet"
 * placeholder every `ProductImagePlaceholder` already supports, the same
 * choice every other product's config makes.
 */
export const homePlannerLanding: ProductLandingConfig = {
  slug: "home-planner",
  name: "Home Planner",
  category: "Home & Moving",
  categorySlug: "home",
  seo: {
    title: "Home Planner",
    description:
      "A connected home-organization workspace from Everplans - rooms, inventory, maintenance, bills, documents, and projects, all in one place.",
  },
  hero: {
    eyebrow: "Home Planner",
    headline: "Keep your home organized without the sticky notes.",
    subhead:
      "One connected workspace for your rooms, inventory, maintenance, bills, documents, and projects - everything in one place, ready in under a minute.",
    primaryCtaLabel: "Start Planning",
    secondaryCtaLabel: "See what's included",
    secondaryCtaHref: "#included",
    image: {
      label: "Home Planner - dashboard overview",
      aspectRatio: "16/10",
    },
  },
  valueProps: [
    {
      icon: DoorOpen,
      title: "Organize room by room",
      body: "Set up your home's rooms and keep everything about them - and what's in them - organized in one place.",
    },
    {
      icon: Boxes,
      title: "Know what you own",
      body: "Track your inventory and flag what matters most, so important items are never more than a search away.",
    },
    {
      icon: Wrench,
      title: "Stay ahead of maintenance",
      body: "Recurring maintenance tasks with real due dates, so nothing important gets forgotten until it becomes a problem.",
    },
    {
      icon: ReceiptText,
      title: "Keep bills and projects on track",
      body: "Household bills and home projects, each with their own status and budget - organized instead of scattered across apps.",
    },
  ],
  problem: {
    heading: "Home organization turns into scattered notes fast.",
    withoutBody:
      "A spreadsheet for the inventory, a reminders app for maintenance, bills tracked nowhere in particular, and project notes wherever you last wrote them. Nothing about any single piece is wrong - the problem is that none of it lives anywhere together.",
    withBody:
      "Everplans Home Planner keeps your rooms, inventory, maintenance, bills, documents, and projects in one connected workspace, so you always know what's going on with your home.",
  },
  featureStories: [
    {
      eyebrow: "Start with the basics",
      title: "A home profile and the rooms that make it up",
      body: "Set up your home profile - type, ownership, address - and break it down room by room, so everything else you track has somewhere real to attach to.",
      bullets: ["A home profile that's actually yours", "Rooms organized your way", "Everything else ties back to a real room"],
      image: { label: "Home profile and rooms", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Know what you have",
      title: "Inventory, with what matters flagged",
      body: "Track what you own room by room, and flag the items that matter most so they're always easy to find - for insurance, for peace of mind, or just to stop hunting for things.",
      bullets: ["Inventory organized by room", "Important items flagged and easy to find", "Real quantities and details, not guesses"],
      image: { label: "Inventory and important items", aspectRatio: "4/3" },
      imagePosition: "left",
    },
    {
      eyebrow: "Stay ahead of problems",
      title: "Maintenance tasks that actually recur",
      body: "Set up maintenance tasks with real due dates and recurrence, so filters, inspections, and seasonal upkeep happen on schedule instead of whenever you remember.",
      bullets: ["Maintenance tasks with priority and status", "Real recurrence, not a one-time reminder", "Nothing important slips through"],
      image: { label: "Maintenance tasks", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Keep the paperwork straight",
      title: "Bills and documents in one place",
      body: "Track household bills by status and category, and keep the documents that matter close by - organized instead of buried in email or a drawer.",
      bullets: ["Bills with status and category", "Documents linked to what they're about", "One place to check, not five"],
      image: { label: "Bills and documents", aspectRatio: "4/3" },
      imagePosition: "left",
    },
    {
      eyebrow: "Get projects done",
      title: "Home projects, with real tasks and budgets",
      body: "Plan renovations and home projects with their own tasks, status, and budget - planned versus used - so a project stays organized from start to finish.",
      bullets: ["Projects with their own task list", "Status and category tracking", "Planned vs. used budget, at a glance"],
      image: { label: "Home projects", aspectRatio: "4/3" },
      imagePosition: "right",
    },
  ],
  howItWorksHeading: "From sign-in to organized",
  howItWorks: [
    { title: "Start your planner", body: "Create your Home Planner workspace in under a minute." },
    { title: "Set up your home", body: "Add your home profile and rooms to get organized from day one." },
    { title: "Build it out", body: "Track inventory, maintenance, bills, documents, and projects at your own pace." },
    { title: "Stay on top of it", body: "Come back anytime to see what's due, what's tracked, and what's next." },
  ],
  whoItsFor: {
    heading: "Built for anyone who wants their home organized in one place",
    body: "Homeowners and renters alike - if you want a single, connected way to track your rooms, inventory, maintenance, bills, and projects instead of scattered notes and apps, this is built for you.",
  },
  differentiators: [
    {
      icon: Link2,
      title: "Everything connected",
      body: "Inventory, maintenance, bills, and documents all tie back to your real home and rooms - nothing is a disconnected list.",
    },
    {
      icon: Sparkles,
      title: "Calm by design",
      body: "No overwhelming spreadsheets, no cluttered checklists - just what you need to know your home is under control.",
    },
    {
      icon: Wrench,
      title: "Maintenance that actually recurs",
      body: "Real recurrence on maintenance tasks, not a single reminder you have to manually recreate every time.",
    },
    {
      icon: Users,
      title: "Room for the whole household",
      body: "Household members and contacts live right alongside everything else - not a separate app to keep in sync.",
    },
  ],
  included: [
    { title: "Home profile & rooms", body: "Your home profile and the rooms you break it down into." },
    { title: "Inventory & important items", body: "What you own, organized by room, with the important items flagged." },
    { title: "Maintenance", body: "Maintenance tasks with priority, status, and real recurrence." },
    { title: "Bills", body: "Household bills tracked by status and category." },
    { title: "Documents", body: "The documents that matter, linked to what they're about." },
    { title: "Projects", body: "Home projects with their own tasks, status, and budget." },
    { title: "Household & contacts", body: "Household members and important contacts, all in one place." },
  ],
  pricing: {
    model: "one-time",
    priceCents: HOME_PLANNER_PRODUCT.priceCents,
    priceLabel: "$29 one-time",
    billingNote: "Pay once with PayPal. Permanent access to your Home Planner workspace - no subscription.",
    ctaLabel: "Start Planning",
    included: [
      "Home profile, rooms, inventory, and important items",
      "Maintenance, bills, documents, and projects",
      "One workspace, ready in under a minute",
    ],
  },
  faq: [
    {
      question: "What is Everplans Home Planner?",
      answer:
        "A connected workspace for organizing your home end to end - rooms, inventory, maintenance, bills, documents, and projects, all in one place instead of spread across separate apps.",
    },
    {
      question: "Who is it for?",
      answer: "Homeowners and renters alike who want a single, organized place to track their home instead of scattered notes and apps.",
    },
    {
      question: "What can I manage with it?",
      answer:
        "Your home profile and rooms, your inventory (with important items flagged), maintenance tasks with recurrence, household bills, documents, home projects with their own tasks and budget, household members, and contacts.",
    },
    {
      question: "Does maintenance actually repeat?",
      answer: "Yes - maintenance tasks support real recurrence, so recurring upkeep stays on schedule instead of needing to be recreated each time.",
    },
    {
      question: "Can I track home project budgets?",
      answer: "Yes - each project tracks a planned budget against what's actually been used, alongside its own task list.",
    },
    {
      question: "How much does it cost?",
      answer: "$29, one time, via PayPal. No subscription - you keep permanent access to your workspace after purchase.",
    },
    {
      question: "Is my information private?",
      answer: "Yes - your Home Planner workspace is private to your account. Only you can see it once you're signed in.",
    },
  ],
  finalCta: {
    heading: "Your home, organized in one place.",
    body: "Create your Home Planner workspace and start tracking your rooms, inventory, maintenance, and projects today.",
  },
  ctaHref: "/app/home-planner/checkout",
};
