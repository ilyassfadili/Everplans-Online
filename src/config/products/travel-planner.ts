import {
  CalendarRange,
  Compass,
  Luggage,
  MapPin,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";

import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * The Travel Planner's real, stable product identity for commerce - same
 * shape as `BUDGET_PLANNER_PRODUCT` (`./budget-planner.ts`). `plannerId`
 * matches the literal id seeded by
 * `supabase/migrations/20260916000000_travel_planner_commerce.sql`'s
 * `planner_definitions` insert (a `status = 'draft'` row, deliberately
 * invisible to the generic catalog/Store discovery reads - see that
 * migration's own comment for why a hand-built product still needs one of
 * these rows for entitlements to key off) - reserved back in Prompt 5 with
 * this exact value precisely so this later seeding wouldn't need to
 * renumber anything `orders.planner_id`/`entitlements.planner_id` already
 * pointed at. `priceCents`/`currency` are the one canonical price the
 * checkout Server Action (`checkout/actions.ts`) actually charges.
 */
export const TRAVEL_PLANNER_PRODUCT = {
  plannerId: "33333333-3333-4333-8333-333333333333",
  slug: "travel-planner",
  name: "Travel Planner",
  priceCents: 2900,
  currency: "USD",
} as const;

/**
 * The Travel Planner's Product Landing Page content - the third real
 * implementation of `ProductLandingConfig`, following `wedding-planner.ts`/
 * `budget-planner.ts`'s exact shape. Every capability named below is a
 * real, already-shipped module from Prompts 1-4: trip setup, itinerary
 * with activities and a chronological timeline, a total budget broken into
 * categories with real expense tracking, a centralized booking organizer,
 * a packing checklist, a document-readiness checklist, and a travel
 * information page (see `src/types/travel.ts` and `src/lib/travel/`).
 *
 * `pricing.model` is `"one-time"` at `TRAVEL_PLANNER_PRODUCT.priceCents` -
 * the same $29 one-time price point Wedding/Budget Planner both use, for
 * consistency across the platform's pricing, not because a different price
 * was evaluated and rejected. `ctaHref` points at
 * `/app/travel-planner/checkout` (Prompt 6) - it itself resolves "already
 * owns this" (redirects straight into the workspace) vs. "needs to buy
 * this" (starts a real PayPal Card Fields/Buttons checkout) server-side,
 * the same shape `budget-planner.ts`'s own `ctaHref` already establishes -
 * so this one link works correctly for both a first-time visitor and an
 * existing customer, since this page itself stays fully public/static with
 * no per-viewer state of its own.
 *
 * No image assets exist for this product yet - `coverImageSrc` and every
 * `image.src` are left unset, rendering the honest "not supplied yet"
 * placeholder every `ProductImagePlaceholder` already supports, the same
 * choice Budget Planner's config makes.
 */
export const travelPlannerLanding: ProductLandingConfig = {
  slug: "travel-planner",
  name: "Travel Planner",
  category: "Travel & Adventures",
  categorySlug: "travel",
  seo: {
    title: "Travel Planner",
    description:
      "An organized trip-planning workspace from Everplans - itinerary, budget, bookings, packing, and documents, all in one place.",
  },
  hero: {
    eyebrow: "Travel Planner",
    headline: "Plan your trip without the scattered tabs.",
    subhead:
      "One workspace for your itinerary, budget, bookings, packing list, and travel documents - everything in one place, ready in under a minute.",
    primaryCtaLabel: "Start Planning",
    secondaryCtaLabel: "See what's included",
    secondaryCtaHref: "#included",
    image: {
      label: "Travel Planner - dashboard overview",
      aspectRatio: "16/10",
    },
  },
  valueProps: [
    {
      icon: Compass,
      title: "Build your trip day by day",
      body: "An itinerary that automatically lays out every day of your trip, with activities, times, and locations organized as an actual timeline.",
    },
    {
      icon: Wallet,
      title: "Know where your money is going",
      body: "Set a total budget, break it into categories, and track real spending against it - planned, spent, and remaining, always clear.",
    },
    {
      icon: Ticket,
      title: "Keep every reservation together",
      body: "Flights, hotels, activities, and more, organized in one place with confirmation numbers and status - not spread across a dozen emails.",
    },
    {
      icon: Luggage,
      title: "Pack with confidence",
      body: "A checklist built for quick use - check items off, add anything custom, and always know what's left before you go.",
    },
  ],
  problem: {
    heading: "Trip planning turns into a dozen open tabs fast.",
    withoutBody:
      "A spreadsheet for the budget, a notes app for the itinerary, email confirmations for every booking, a mental packing list you're sure you'll remember. Nothing about any single piece is wrong - the problem is that none of it lives anywhere together.",
    withBody:
      "Everplans Travel Planner keeps your itinerary, budget, bookings, packing, and documents in one connected workspace, so you always know what's planned and what's still ahead.",
  },
  featureStories: [
    {
      eyebrow: "Start with the basics",
      title: "Trip setup that takes a minute, not an hour",
      body: "Add your destination, dates, travelers, and trip type, and your workspace is ready - a clean dashboard shows where you're going, when, and how prepared you are, based only on what you've actually set up.",
      bullets: ["Destination, dates, and travelers", "Trip type and goals", "A dashboard that reflects real progress"],
      image: { label: "Trip setup and dashboard", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Plan every day",
      title: "An itinerary that's an actual timeline",
      body: "Every day of your trip is laid out automatically from your travel dates. Add activities with a time, location, and category, and see them in chronological order - with untimed plans grouped separately instead of guessing where they fit.",
      bullets: ["Automatic day-by-day layout", "Activities with time, location, and category", "A real chronological timeline"],
      image: { label: "Itinerary timeline", aspectRatio: "4/3" },
      imagePosition: "left",
    },
    {
      eyebrow: "Stay in control of money",
      title: "A budget that reflects what you've actually spent",
      body: "Set a total budget, break it into categories like transportation and food, and log real expenses against them. See planned, spent, and remaining at a glance - not a static spreadsheet that goes stale the day after you build it.",
      bullets: ["Total budget and category breakdown", "Real expense tracking", "Planned vs. actual, per category"],
      image: { label: "Budget and expenses", aspectRatio: "4/3" },
      imagePosition: "right",
    },
    {
      eyebrow: "Organize what you've already booked",
      title: "Every reservation in one place",
      body: "Flights, trains, hotels, car rentals, activities, restaurants - log what you've booked with confirmation numbers, cost, and status, and see everything organized by date instead of scattered across confirmation emails.",
      bullets: ["Every booking type in one list", "Confirmation numbers and status", "Organized by date"],
      image: { label: "Bookings overview", aspectRatio: "4/3" },
      imagePosition: "left",
    },
    {
      eyebrow: "Prepare with confidence",
      title: "Packing and documents, without the stress",
      body: "A quick-to-use packing checklist grouped by category, plus a document readiness tracker for your passport, visa, and insurance - not a secure vault, just an honest view of what's ready and what still needs attention.",
      bullets: ["Packing checklist with progress", "Document status and expiry tracking", "Emergency contacts and trip notes in one place"],
      image: { label: "Packing and documents", aspectRatio: "4/3" },
      imagePosition: "right",
    },
  ],
  howItWorksHeading: "From sign-in to organized",
  howItWorks: [
    { title: "Start your planner", body: "Create your Travel Planner workspace in under a minute." },
    { title: "Set up your trip", body: "Add your destination, dates, travelers, and trip type to get organized from day one." },
    { title: "Build it out", body: "Work through your itinerary, budget, bookings, and packing list at your own pace." },
    { title: "Travel with confidence", body: "Come back anytime to see what's planned, what's booked, and what's left to do." },
  ],
  whoItsFor: {
    heading: "Built for anyone planning a trip worth organizing",
    body: "Vacations, family trips, couple getaways, solo travel, road trips, or a mix of all of it - if you want one organized, modern place to manage your plans instead of five different apps, this is built for you.",
  },
  differentiators: [
    {
      icon: Sparkles,
      title: "Calm by design",
      body: "No overwhelming spreadsheets, no cluttered checklists - just what you need to plan clearly and know what's next.",
    },
    {
      icon: MapPin,
      title: "Built around the actual trip",
      body: "Your itinerary derives from your real travel dates, your budget from your real spending - nothing to keep manually in sync.",
    },
    {
      icon: CalendarRange,
      title: "Everything connected",
      body: "Accommodation and transportation information reuse your real bookings - never a second, disconnected copy of the same details.",
    },
    {
      icon: Compass,
      title: "One connected workspace",
      body: "Itinerary, budget, bookings, packing, and documents all read from the same trip - nothing to reconcile between screens.",
    },
  ],
  included: [
    { title: "Trip setup & dashboard", body: "Destination, dates, travelers, trip type, and a dashboard that reflects real progress." },
    { title: "Itinerary & timeline", body: "Day-by-day activities with time, location, and category, shown as a real chronological timeline." },
    { title: "Budget & expenses", body: "A total budget, category breakdown, and real expense tracking with planned-vs-actual." },
    { title: "Bookings", body: "Every reservation organized in one place - flights, hotels, activities, and more." },
    { title: "Packing checklist", body: "A quick-to-use checklist grouped by category, with progress tracking." },
    { title: "Document checklist", body: "Passport, visa, insurance, and more, tracked by status and expiry - not a vault." },
    { title: "Travel information", body: "Accommodation, transportation, emergency contacts, and trip notes in one place." },
  ],
  pricing: {
    model: "one-time",
    priceCents: TRAVEL_PLANNER_PRODUCT.priceCents,
    priceLabel: "$29 one-time",
    billingNote: "Pay once with PayPal. Permanent access to your Travel Planner workspace - no subscription.",
    ctaLabel: "Start Planning",
    included: [
      "Trip setup, itinerary, and timeline",
      "Budget, expenses, bookings, packing, and documents",
      "One workspace, ready in under a minute",
    ],
  },
  faq: [
    {
      question: "What is Everplans Travel Planner?",
      answer:
        "A workspace for planning a trip end to end - itinerary, budget, bookings, packing, and documents, all in one connected place instead of spread across separate apps.",
    },
    {
      question: "Who is it for?",
      answer: "Anyone planning a trip worth organizing - vacations, family trips, couple getaways, solo travel, road trips, and more.",
    },
    {
      question: "What can I manage with it?",
      answer:
        "Your trip's destination, dates, and travelers; a day-by-day itinerary with activities; a total budget broken into categories with real expenses; every booking you've made; a packing checklist; and a document readiness tracker.",
    },
    {
      question: "Does it build my itinerary for me?",
      answer:
        "It lays out every day of your trip automatically from your travel dates, and you add the activities - it doesn't generate an itinerary or recommend places to go.",
    },
    {
      question: "Can it book flights or hotels for me?",
      answer:
        "No - Travel Planner helps you organize reservations you've already made elsewhere. It doesn't connect to any booking provider or process any bookings itself.",
    },
    {
      question: "Is the document checklist a secure vault?",
      answer:
        "No - it's a planning and status checklist (document type, status, and expiry). It's not built to store passport numbers, card numbers, or other sensitive identifiers, and you shouldn't enter them there.",
    },
    {
      question: "How much does it cost?",
      answer: "$29, one time, via PayPal. No subscription - you keep permanent access to your workspace after purchase.",
    },
    {
      question: "Is my information private?",
      answer: "Yes - your trip workspace is private to your account. Only you can see it once you're signed in.",
    },
  ],
  finalCta: {
    heading: "Your trip, organized in one place.",
    body: "Create your Travel Planner workspace and start building your itinerary, budget, and bookings today.",
  },
  ctaHref: "/app/travel-planner/checkout",
};
