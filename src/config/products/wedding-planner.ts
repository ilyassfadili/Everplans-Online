import {
  BookOpen,
  Calendar,
  Heart,
  ListChecks,
  Link2,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * The Wedding Planner's Product Landing Page content - the first, and
 * currently only, real implementation of `ProductLandingConfig`. Every
 * capability named below is a real, already-shipped module (checklist,
 * timeline, budget, expenses, guests, RSVP, vendors, vendor financial
 * tracking, events, venues, notes, decisions, documents, search - see
 * `src/types/wedding.ts` and `src/lib/wedding/`).
 *
 * `pricing.model` is `"one-time"` - Wedding Planner is a paid product at a
 * real, announced price ($29, `priceCents: 2900`); Everplans planners are
 * chosen and priced individually, not bundled free with an account (see
 * `Planner.isFree`'s own comment, `@/types/planner`). `priceCents` is the
 * one canonical number every price-showing surface reads from - the Product
 * Landing Page's own pricing card (`ProductPricing`), the Store listing
 * (`store/page.tsx`), and the public catalog card (`PlannerCard`,
 * `@/lib/planner-catalog`) - never a second, independently-typed "$29"
 * string that could drift from this one. Note the gap this still leaves:
 * nothing in `.../wedding-planner/onboarding/actions.ts` actually enforces
 * payment yet (no commerce backend is wired up - see
 * `commerce-provisioning.ts`), so `ctaHref` still leads to a real,
 * currently-unpaywalled workspace - the price is real and announced, the
 * checkout that would collect it is the still-pending piece, the same
 * "real code, pending backend" status the contact form and OAuth buttons
 * already carry elsewhere in this app.
 */
export const weddingPlannerLanding: ProductLandingConfig = {
  slug: "wedding-planner",
  name: "Wedding Planner",
  coverImageSrc: "/products/wedding-planner/cover.png",
  category: "Wedding",
  categorySlug: "wedding",
  seo: {
    title: "Wedding Planner",
    description:
      "An interactive wedding planning workspace from Everplans - checklist, timeline, budget, guests, vendors, and events, all in one place.",
  },
  hero: {
    eyebrow: "Wedding Planner",
    headline: "Plan your wedding without losing track of it.",
    subhead:
      "One interactive workspace for your checklist, budget, guests, vendors, and events - everything in one place, ready in under a minute.",
    primaryCtaLabel: "Start Planning",
    secondaryCtaLabel: "See what's included",
    secondaryCtaHref: "#included",
    image: {
      label: "Wedding Planner - dashboard overview",
      aspectRatio: "16/10",
      src: "/products/wedding-planner/hero.png",
    },
  },
  valueProps: [
    {
      icon: ListChecks,
      title: "Know what needs to happen next",
      body: "A checklist and timeline built for wedding planning, so you're never wondering where you left off.",
    },
    {
      icon: Wallet,
      title: "Stay on top of spending",
      body: "Budget categories and expenses in one place, with vendor costs tracked against what you've actually paid.",
    },
    {
      icon: Users,
      title: "Keep vendors and guests together",
      body: "Guest list, RSVPs, and your vendor pipeline - no more digging through a messaging thread to find an answer.",
    },
    {
      icon: Heart,
      title: "Feel in control, not overwhelmed",
      body: "Every important detail lives in one connected workspace instead of five different apps.",
    },
  ],
  problem: {
    heading: "Wedding planning turns into five different apps fast.",
    withoutBody:
      "A checklist here, a budget spreadsheet there, guest replies in a messaging thread, vendor contracts buried in your inbox. Nothing about any single piece is wrong - the problem is that none of it lives anywhere together.",
    withBody:
      "Everplans Wedding Planner keeps your checklist, budget, guests, vendors, and events in one connected workspace, so you always know what's done and what's still ahead.",
  },
  featureStories: [
    {
      eyebrow: "Plan everything",
      title: "Tasks, milestones, and a timeline built for a wedding",
      body: "Break the wedding down into a checklist you can actually work through, grouped around the milestones that matter, with a timeline that pulls your wedding date and important dates together in one view.",
      bullets: ["Checklist with tasks and milestones", "Timeline of important dates", "Always know what's done and what's next"],
      image: {
        label: "Checklist and timeline",
        aspectRatio: "4/3",
        src: "/products/wedding-planner/checklist-timeline.png",
      },
      imagePosition: "right",
    },
    {
      eyebrow: "Stay in control of money",
      title: "A budget that reflects what you've actually spent",
      body: "Set up budget categories, log expenses as they happen, and see vendor costs tracked against what's been paid and what's still owed - not a static spreadsheet that goes stale the day after you build it.",
      bullets: ["Budget categories and expenses", "Vendor financial tracking", "See what's left before it surprises you"],
      image: {
        label: "Budget and expenses",
        aspectRatio: "4/3",
        src: "/products/wedding-planner/budget.png",
      },
      imagePosition: "left",
    },
    {
      eyebrow: "Manage people and suppliers",
      title: "Guests, RSVPs, and vendors in one pipeline",
      body: "Keep your guest list and RSVP status in one place, and track every vendor from first conversation to booked - no more piecing it together from old messages.",
      bullets: ["Guest list with RSVP status", "Vendor booking pipeline", "Guest and vendor details linked together"],
      image: {
        label: "Guests and vendors",
        aspectRatio: "4/3",
        src: "/products/wedding-planner/guests-vendors.png",
      },
      imagePosition: "right",
    },
    {
      eyebrow: "Organize the wedding itself",
      title: "Events and venues, each with their own details",
      body: "Whether it's the ceremony, the reception, or a rehearsal dinner, give each event its own space - venue, timing, and the vendors and guests tied to it.",
      bullets: ["Multiple wedding events", "Venue details per event", "Vendors and guests linked to the right event"],
      image: {
        label: "Events and venues",
        aspectRatio: "4/3",
        src: "/products/wedding-planner/events-venues.png",
      },
      imagePosition: "left",
    },
    {
      eyebrow: "Keep everything together",
      title: "Notes, decisions, and documents that stay connected",
      body: "Capture notes and decisions as you go, keep the documents that matter close by, and link any of it back to the guest, vendor, or event it's actually about. Search pulls all of it back up in seconds.",
      bullets: ["Notes and decisions", "Documents in one place", "Search across your whole workspace"],
      image: {
        label: "Notes, decisions, and documents",
        aspectRatio: "4/3",
        src: "/products/wedding-planner/notes-documents.png",
      },
      imagePosition: "right",
    },
  ],
  howItWorksHeading: "From sign-in to organized",
  howItWorks: [
    { title: "Start your planner", body: "Create your Wedding Planner workspace in under a minute." },
    { title: "Set up your wedding", body: "Add your names and wedding date to get your workspace organized from day one." },
    { title: "Organize the important details", body: "Work through your checklist, budget, guests, vendors, and events at your own pace." },
    { title: "Plan with confidence", body: "Come back anytime to see what's done and what's still ahead." },
  ],
  whoItsFor: {
    heading: "Built for couples planning their own wedding",
    body: "If you want one organized, modern place to manage your checklist, budget, guests, vendors, and events - instead of five different apps that don't talk to each other - this is built for you.",
  },
  differentiators: [
    {
      icon: Link2,
      title: "Everything connected",
      body: "Notes, decisions, and documents link back to the guest, vendor, or event they're actually about - not a pile of disconnected files.",
    },
    {
      icon: Sparkles,
      title: "Purpose-built, not generic",
      body: "Built specifically around how wedding planning actually works, not a generic template stretched to fit.",
    },
    {
      icon: BookOpen,
      title: "One place for the important details",
      body: "Checklist, budget, guests, vendors, and events live in one workspace instead of scattered across notes and spreadsheets.",
    },
    {
      icon: Calendar,
      title: "Designed to reduce planning friction",
      body: "Your workspace is ready in under a minute, with no setup to configure before you can start using it.",
    },
  ],
  included: [
    { title: "Checklist & timeline", body: "Tasks, milestones, and a timeline of every important date." },
    { title: "Budget & expenses", body: "Budget categories, expense tracking, and vendor cost tracking." },
    { title: "Guests & RSVPs", body: "Your full guest list with RSVP status." },
    { title: "Vendors", body: "A booking pipeline for every vendor, linked to what you've paid them." },
    { title: "Events & venues", body: "Every wedding event, each with its own venue and details." },
    { title: "Notes, decisions & documents", body: "Captured and linked back to the guest, vendor, or event they're about." },
    { title: "Search", body: "Find anything across your workspace in seconds." },
  ],
  pricing: {
    model: "one-time",
    priceCents: 2900,
    priceLabel: "$29",
    billingNote: "One-time payment - no subscription, no renewal.",
    ctaLabel: "Get Wedding Planner",
    included: [
      "Every module: checklist, timeline, budget & expenses, guests & RSVP, vendors, events & venues, notes, decisions, and documents",
      "One workspace, ready in under a minute",
      "Yours for good - one payment, not a recurring charge",
    ],
  },
  faq: [
    {
      question: "What is Everplans Wedding Planner?",
      answer:
        "An interactive workspace for planning your wedding end to end - checklist, timeline, budget, guests, vendors, events, and notes, all in one place instead of spread across separate apps.",
    },
    {
      question: "Who is it for?",
      answer:
        "Couples planning their own wedding who want a simple, organized, modern way to manage their plans in one place.",
    },
    {
      question: "What can I manage with it?",
      answer:
        "Your checklist and milestones, a timeline of important dates, your budget and expenses, your guest list and RSVPs, your vendors, your wedding events and venues, and any notes, decisions, or documents tied to them.",
    },
    {
      question: "Can I manage my budget?",
      answer:
        "Yes - set up budget categories, log expenses, and track vendor costs against what you've actually paid.",
    },
    {
      question: "Can I manage my guest list and RSVPs?",
      answer: "Yes - your full guest list lives in your workspace, with RSVP status for each guest.",
    },
    {
      question: "Can I manage vendors?",
      answer:
        "Yes - track every vendor from first conversation through booking, and see their costs tracked against your budget.",
    },
    {
      question: "Can I organize multiple wedding events?",
      answer: "Yes - add as many events as your wedding has (ceremony, reception, rehearsal dinner, and more), each with its own venue and details.",
    },
    {
      question: "How much does it cost?",
      answer: "$29, one time - no subscription, no renewal. That one payment includes every module.",
    },
    {
      question: "How does access work?",
      answer:
        "Sign in to Everplans, get Wedding Planner, and fill in a short one-screen form with your names and wedding date - your workspace is ready immediately.",
    },
    {
      question: "Is my information private?",
      answer: "Yes - your wedding planning workspace is private to your account. Only you can see it once you're signed in.",
    },
  ],
  finalCta: {
    heading: "Your wedding, organized in one place.",
    body: "Create your Wedding Planner workspace and start working through your checklist, budget, guests, vendors, and events today.",
  },
  ctaHref: "/app/wedding-planner",
};
