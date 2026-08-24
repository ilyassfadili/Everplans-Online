import { LineChart, ListChecks, PiggyBank, Sparkles, Target, Wallet } from "lucide-react";

import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * Budget Planner's real, stable product identity for commerce - the fixed
 * ids `@/lib/orders.ts`, `@/lib/entitlements.ts`, and the checkout flow all
 * key off. `plannerId` matches the literal id seeded by
 * `supabase/migrations/20260904000000_orders.sql`'s `planner_definitions`
 * insert (a `status = 'draft'` row, deliberately invisible to the generic
 * catalog/Store discovery reads - see that migration's own comment for why
 * a hand-built product still needs one of these rows for entitlements to
 * key off). `priceCents`/`currency` are the one canonical price the
 * checkout Server Action actually charges - never re-typed as a second
 * number anywhere else.
 */
export const BUDGET_PLANNER_PRODUCT = {
  plannerId: "22222222-2222-4222-8222-222222222222",
  slug: "budget-planner",
  name: "Budget Planner",
  priceCents: 2900,
  currency: "USD",
} as const;

/**
 * The Budget Planner's Product Landing Page content - the second real
 * implementation of `ProductLandingConfig`, following `wedding-planner.ts`'s
 * exact shape. Every capability named below is a real, already-shipped
 * module (income sources, budget categories, planned vs. actual spending,
 * financial goals, accounts, a unified transactions view - see
 * `src/types/budget.ts` and `src/lib/budget/`).
 *
 * `pricing.model` is `"one-time"` at `BUDGET_PLANNER_PRODUCT.priceCents`
 * (Everplans Money Prompt 3) - a real, announced, chargeable price, not the
 * `"pending"` placeholder this config carried before checkout existed.
 * `ctaHref` points at `/app/budget-planner/checkout`, which itself resolves
 * "already owns this" (redirects straight into the workspace) vs. "needs to
 * buy this" (starts a real PayPal Sandbox/Live checkout) server-side - the
 * same single link works correctly for both a first-time visitor and an
 * existing customer, since this page itself stays fully public/static with
 * no per-viewer state of its own.
 *
 * No image assets exist for this product yet - `coverImageSrc` and every
 * `image.src` are left unset, rendering the honest "not supplied yet"
 * placeholder every `ProductImagePlaceholder` already supports.
 */
export const budgetPlannerLanding: ProductLandingConfig = {
  slug: "budget-planner",
  name: "Budget Planner",
  category: "Money & Finances",
  categorySlug: "money",
  seo: {
    title: "Budget Planner",
    description:
      "A calm, connected budgeting workspace from Everplans - income, categories, spending, and goals, all in one place.",
  },
  hero: {
    eyebrow: "Budget Planner",
    headline: "Understand your money without the spreadsheet.",
    subhead:
      "One workspace for your income, your budget, and what you're spending - built to feel calm and clear, not like accounting software.",
    primaryCtaLabel: "Start Budgeting",
    secondaryCtaLabel: "See what's included",
    secondaryCtaHref: "#included",
    image: {
      label: "Budget Planner - dashboard overview",
      aspectRatio: "16/10",
    },
  },
  valueProps: [
    {
      icon: Wallet,
      title: "See your income clearly",
      body: "Add every income source you have, whatever its schedule, and always know what to expect for the period you're planning around.",
    },
    {
      icon: PiggyBank,
      title: "Build a budget that fits your life",
      body: "Set up categories for however you actually spend - no forced methodology, no one-size-fits-all template.",
    },
    {
      icon: ListChecks,
      title: "Know what's planned vs. what's spent",
      body: "Log expenses against your categories and see, at a glance, what's left before it becomes a surprise.",
    },
    {
      icon: Target,
      title: "Keep goals connected to your plan",
      body: "Set targets for what you're working toward, and track progress right alongside the budget that gets you there.",
    },
  ],
  problem: {
    heading: "Budgeting apps tend to feel like a second job.",
    withoutBody:
      "A spreadsheet with a dozen tabs, an app full of charts you don't need, or a notes app with numbers that go stale the moment you stop updating them. None of it makes the actual decision - what to do next - any easier.",
    withBody:
      "Everplans Budget Planner keeps your income, categories, and spending in one connected workspace, calm enough to actually open every week.",
  },
  featureStories: [
    {
      eyebrow: "Start with the basics",
      title: "Income, on your terms",
      body: "Add as many income sources as you have - salary, freelance work, anything recurring or one-off - and set the schedule that actually matches how it arrives. Everplans translates it into what to expect for your budget period.",
      bullets: ["Multiple income sources", "Any frequency - weekly to yearly", "Always translated into your budget period"],
      image: { label: "Income sources", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Plan without the pressure",
      title: "Categories that reflect your life",
      body: "Create the categories that make sense for you - essentials, lifestyle, savings, or anything custom - and set what you plan to spend in each one.",
      bullets: ["Fully custom categories", "Planned amounts per category", "No forced budgeting methodology"],
      image: { label: "Budget categories", aspectRatio: "4/3" },
      imagePosition: "left",
    },
    {
      eyebrow: "Stay aware, not anxious",
      title: "Planned vs. actual, at a glance",
      body: "Log what you actually spend and see it land against what you planned - a calm read on where things stand, not a wall of numbers.",
      bullets: ["Quick expense entry", "Planned vs. actual by category", "Clear, non-alarming status"],
      image: { label: "Planned vs. actual spending", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Work toward something",
      title: "Goals that stay part of the plan",
      body: "Set a target, a date, and track progress right alongside the rest of your budget - so saving for something feels like part of the plan, not a separate list.",
      bullets: ["Target amount and date", "Progress tracked over time", "Connected to the rest of your budget"],
      image: { label: "Financial goals", aspectRatio: "4/3" },
      imagePosition: "left",
    },
  ],
  howItWorksHeading: "From sign-in to organized",
  howItWorks: [
    { title: "Start your planner", body: "Create your Budget Planner workspace in under a minute." },
    { title: "Set up your budget", body: "Tell us how often you're planning around, and add your income if you're ready to." },
    { title: "Shape it your way", body: "Add categories, log expenses, and set goals at your own pace." },
    { title: "Check in whenever", body: "Come back to see what's planned, what's spent, and what's left." },
  ],
  whoItsFor: {
    heading: "Built for anyone who wants clarity, not complexity",
    body: "If you want a calm, organized way to see your income, your spending, and your goals in one place - without turning it into a spreadsheet project - this is built for you.",
  },
  differentiators: [
    {
      icon: Sparkles,
      title: "Calm by design",
      body: "No alarm-heavy colors, no wall of charts - just what you need to understand your money and know what to do next.",
    },
    {
      icon: LineChart,
      title: "Flexible, not prescriptive",
      body: "Your categories, your priorities, your budget period - Everplans adapts to how you actually manage money.",
    },
    {
      icon: Target,
      title: "Goals built in, not bolted on",
      body: "Financial goals live alongside your budget from day one, not as a separate app you have to keep in sync yourself.",
    },
    {
      icon: PiggyBank,
      title: "One connected workspace",
      body: "Income, budget, spending, and goals all read from the same numbers - nothing to reconcile between screens.",
    },
  ],
  included: [
    { title: "Income sources", body: "Every income source you have, on whatever schedule it actually follows." },
    { title: "Budget categories", body: "Fully custom categories with planned amounts, shaped around how you actually spend." },
    { title: "Expense tracking", body: "Quick expense entry, compared against what you planned." },
    { title: "Financial goals", body: "Targets, dates, and progress, connected to the rest of your budget." },
  ],
  pricing: {
    model: "one-time",
    priceCents: BUDGET_PLANNER_PRODUCT.priceCents,
    priceLabel: "$29 one-time",
    billingNote: "Pay once with PayPal. Permanent access to your Budget Planner workspace - no subscription.",
    ctaLabel: "Start Budgeting",
    included: [
      "Income, expenses, transactions, categories, and accounts",
      "Budget categories, financial goals, and recurring items",
      "One workspace, ready in under a minute",
    ],
  },
  faq: [
    {
      question: "What is Everplans Budget Planner?",
      answer:
        "A workspace for planning your money end to end - income, budget categories, spending, and financial goals, all in one connected place.",
    },
    {
      question: "Who is it for?",
      answer: "Anyone who wants a calm, organized way to understand their money without spreadsheets or accounting software.",
    },
    {
      question: "What can I manage with it?",
      answer: "Your income sources, your budget categories and planned amounts, your actual expenses, and your financial goals.",
    },
    {
      question: "Do I have to use a specific budgeting method?",
      answer: "No - categories are fully custom, so your budget can reflect however you actually think about your money.",
    },
    {
      question: "How much does it cost?",
      answer: "$29, one time, via PayPal. No subscription - you keep permanent access to your workspace after purchase.",
    },
    {
      question: "Is my information private?",
      answer: "Yes - your budget workspace is private to your account. Only you can see it once you're signed in.",
    },
  ],
  finalCta: {
    heading: "Your money, organized in one place.",
    body: "Create your Budget Planner workspace and start understanding your income, budget, and goals today.",
  },
  ctaHref: "/app/budget-planner/checkout",
};
