import {
  BookOpen,
  CalendarDays,
  Link2,
  Repeat,
  Sparkles,
  Target,
} from "lucide-react";

import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * The Life Planner's real, stable product identity for commerce - same
 * shape as `TRAVEL_PLANNER_PRODUCT` (`./travel-planner.ts`). `plannerId`
 * matches the literal id seeded by
 * `supabase/migrations/20260921000000_life_planner_commerce.sql`'s
 * `planner_definitions` insert (a `status = 'draft'` row, deliberately
 * invisible to the generic catalog/Store discovery reads - see that
 * migration's own comment for why a hand-built product still needs one of
 * these rows for entitlements to key off). `priceCents`/`currency` are the
 * one canonical price the checkout Server Action (`checkout/actions.ts`)
 * actually charges.
 */
export const LIFE_PLANNER_PRODUCT = {
  plannerId: "66666666-6666-4666-8666-666666666666",
  slug: "life-planner",
  name: "Life Planner",
  priceCents: 2900,
  currency: "USD",
} as const;

/**
 * The Life Planner's Product Landing Page content - the fourth real
 * implementation of `ProductLandingConfig`, following `wedding-planner.ts`/
 * `budget-planner.ts`/`travel-planner.ts`'s exact shape. Every capability
 * named below is a real, already-shipped module (life profile, life areas,
 * goals with milestones, tasks, habits, routines, weekly & monthly
 * planning, journal, and important plans & information - see
 * `src/types/life-planner.ts` and `src/lib/life-planner/`).
 *
 * `pricing.model` is `"one-time"` at `LIFE_PLANNER_PRODUCT.priceCents` - the
 * same $29 one-time price point Wedding/Budget/Travel Planner all use, for
 * consistency across the platform's pricing, not because a different price
 * was evaluated and rejected (see `travel-planner.ts`'s own comment for the
 * same reasoning). `ctaHref` points at `/app/life-planner/checkout`
 * (Prompt 6 Phase 1) - it itself resolves "already owns this" (redirects
 * straight into the workspace) vs. "needs to buy this" (starts a real
 * PayPal Card Fields/Buttons checkout) server-side, the same shape
 * `travel-planner.ts`'s own `ctaHref` already establishes - so this one
 * link works correctly for both a first-time visitor and an existing
 * customer, since this page itself stays fully public/static with no
 * per-viewer state of its own.
 *
 * No image assets exist for this product yet - `coverImageSrc` and every
 * `image.src` are left unset, rendering the honest "not supplied yet"
 * placeholder every `ProductImagePlaceholder` already supports, the same
 * choice Budget/Travel Planner's configs make.
 */
export const lifePlannerLanding: ProductLandingConfig = {
  slug: "life-planner",
  name: "Life Planner",
  category: "Personal Growth & Lifestyle",
  categorySlug: "personal-growth",
  seo: {
    title: "Life Planner",
    description:
      "A connected life-planning workspace from Everplans - life profile, goals, tasks, habits, routines, and planning, all in one place.",
  },
  hero: {
    eyebrow: "Life Planner",
    headline: "Plan your life without losing the big picture.",
    subhead:
      "One connected workspace for your goals, tasks, habits, routines, and weekly planning - everything organized together, not scattered across five different apps.",
    primaryCtaLabel: "Start Planning",
    secondaryCtaLabel: "See what's included",
    secondaryCtaHref: "#included",
    image: {
      label: "Life Planner - dashboard overview",
      aspectRatio: "16/10",
    },
  },
  valueProps: [
    {
      icon: Target,
      title: "Set goals that actually move",
      body: "Break big goals into milestones you can actually work through, tracked against real progress - not a wish list you write once and forget.",
    },
    {
      icon: Repeat,
      title: "Build habits and routines that stick",
      body: "Track recurring habits and routines side by side with everything else you're working on, so consistency has somewhere real to live.",
    },
    {
      icon: CalendarDays,
      title: "Plan your week and month with intention",
      body: "Turn your goals and priorities into an actual weekly and monthly plan, instead of reacting to whatever comes up.",
    },
    {
      icon: BookOpen,
      title: "Reflect and keep what matters",
      body: "A journal for reflection and a place for the important plans and information you don't want to lose, right alongside the rest of your life.",
    },
  ],
  problem: {
    heading: "Life doesn't come in one to-do list.",
    withoutBody:
      "Goals in a notes app, habits in a separate tracker, a to-do list that resets every Monday, and the important stuff - decisions, plans, information - scattered wherever you last wrote it down. Nothing about any single piece is wrong - the problem is that none of it lives anywhere together.",
    withBody:
      "Everplans Life Planner keeps your life profile, areas, goals, tasks, habits, routines, planning, and journal in one connected workspace, so you always know what matters and what's next.",
  },
  featureStories: [
    {
      eyebrow: "Start with the full picture",
      title: "A life profile and the areas that make it up",
      body: "Set up your life profile and break your life into the areas that actually matter to you - health, career, relationships, finances, whatever your life is made of - so everything else you plan has somewhere real to attach to.",
      bullets: ["A life profile that's actually yours", "Custom life areas, not a fixed template", "Every goal, task, and habit tied to a real area"],
      image: { label: "Life profile and areas", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Work toward something",
      title: "Goals and milestones you can actually track",
      body: "Set goals with real priorities and target dates, break them into milestones, and watch progress update as you complete the work - not a static list you write once and forget.",
      bullets: ["Goals with priority and target dates", "Milestones that track real progress", "Goals connected to the life area they belong to"],
      image: { label: "Goals and milestones", aspectRatio: "4/3" },
      imagePosition: "left",
    },
    {
      eyebrow: "Get it done",
      title: "Tasks that connect to the bigger picture",
      body: "Manage the tasks in front of you today without losing sight of the goal they're actually in service of - every task can trace back to the area or goal it belongs to.",
      bullets: ["Tasks with priority and status", "Linked to goals and life areas", "A clear view of what's next"],
      image: { label: "Tasks", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Make consistency easier",
      title: "Habits and routines that fit real life",
      body: "Track recurring habits on whatever schedule actually works for you, and build routines that group the small things you do regularly - so staying consistent doesn't depend on remembering.",
      bullets: ["Habits with flexible frequency", "Routines for recurring groups of items", "Streaks and progress you can actually see"],
      image: { label: "Habits and routines", aspectRatio: "4/3" },
      imagePosition: "left",
    },
    {
      eyebrow: "Stay grounded",
      title: "Weekly and monthly planning, plus a place to reflect",
      body: "Turn your goals, tasks, and habits into an actual weekly and monthly plan, journal your reflections along the way, and keep the important plans and information you don't want to lose close by.",
      bullets: ["Weekly and monthly planning", "A journal for reflection", "Important plans and information, organized and easy to find"],
      image: { label: "Weekly planning and journal", aspectRatio: "4/3" },
      imagePosition: "right",
    },
  ],
  howItWorksHeading: "From sign-in to organized",
  howItWorks: [
    { title: "Start your planner", body: "Create your Life Planner workspace in under a minute." },
    { title: "Set up your life", body: "Build your life profile and the life areas that matter to you, to get organized from day one." },
    { title: "Work through it your way", body: "Set goals, manage tasks, and build habits and routines at your own pace." },
    { title: "Plan and reflect", body: "Come back each week to plan ahead, journal, and see what's working." },
  ],
  whoItsFor: {
    heading: "Built for anyone who wants their life organized in one place",
    body: "If you want a single, connected way to manage your goals, habits, routines, and plans - instead of a notes app, a habit tracker, and a to-do list that don't talk to each other - this is built for you.",
  },
  differentiators: [
    {
      icon: Link2,
      title: "Everything connected",
      body: "Goals, tasks, habits, and routines all tie back to the life areas that matter to you - nothing is a disconnected list.",
    },
    {
      icon: Sparkles,
      title: "Flexible, not prescriptive",
      body: "Your life areas, your goals, your routines - Life Planner adapts to how you actually organize your life, not a fixed methodology.",
    },
    {
      icon: CalendarDays,
      title: "Planning built in, not bolted on",
      body: "Weekly and monthly planning pull straight from your real goals, tasks, and habits - nothing to keep manually in sync.",
    },
    {
      icon: BookOpen,
      title: "Room to reflect, not just execute",
      body: "A journal and a place for important information live right alongside your plans, not in a separate app you have to remember to open.",
    },
  ],
  included: [
    { title: "Life profile & areas", body: "Your life profile and the custom areas you break your life into." },
    { title: "Goals & milestones", body: "Goals with priority, target dates, and milestones that track real progress." },
    { title: "Tasks", body: "Tasks with priority and status, linked to the goals and areas they belong to." },
    { title: "Habits", body: "Recurring habits on whatever frequency fits, with streaks and progress." },
    { title: "Routines", body: "Routines that group the recurring items you want to stay consistent with." },
    { title: "Weekly & monthly planning", body: "Turn your goals, tasks, and habits into an actual plan for the week and month ahead." },
    { title: "Journal & important information", body: "A journal for reflection, plus a place for important plans and information you don't want to lose." },
  ],
  pricing: {
    model: "one-time",
    priceCents: LIFE_PLANNER_PRODUCT.priceCents,
    priceLabel: "$29 one-time",
    billingNote: "Pay once with PayPal. Permanent access to your Life Planner workspace - no subscription.",
    ctaLabel: "Get Life Planner",
    included: [
      "Life profile, life areas, goals, milestones, and tasks",
      "Habits, routines, weekly & monthly planning, and journal",
      "One workspace, ready in under a minute",
    ],
  },
  faq: [
    {
      question: "What is Everplans Life Planner?",
      answer:
        "A connected workspace for planning your life end to end - life profile, areas, goals, tasks, habits, routines, weekly and monthly planning, and journal, all in one place instead of spread across separate apps.",
    },
    {
      question: "Who is it for?",
      answer:
        "Anyone who wants a single, organized place to manage their goals, habits, routines, and plans - not a specific productivity methodology, just a connected way to keep your life together.",
    },
    {
      question: "What's the difference between goals, tasks, habits, and routines?",
      answer:
        "Goals are what you're working toward, broken into milestones. Tasks are the concrete things you need to do, often tied to a goal. Habits are things you do repeatedly on a schedule you set. Routines group related recurring items together - all of it connects back to your life areas.",
    },
    {
      question: "Can it help me plan my week and month?",
      answer: "Yes - weekly and monthly planning pulls from your real goals, tasks, and habits, so your plan reflects what's actually in front of you.",
    },
    {
      question: "Is there a journal?",
      answer: "Yes - a journal for reflection, alongside a place to keep important plans and information you want close by.",
    },
    {
      question: "How much does it cost?",
      answer: "$29, one time. No subscription - you keep permanent access to your workspace after purchase.",
    },
    {
      question: "Is my information private?",
      answer: "Yes - your Life Planner workspace is private to your account. Only you can see it once you're signed in.",
    },
  ],
  finalCta: {
    heading: "Your life, organized in one place.",
    body: "Create your Life Planner workspace and start working through your goals, habits, routines, and plans today.",
  },
  ctaHref: "/app/life-planner/checkout",
};
