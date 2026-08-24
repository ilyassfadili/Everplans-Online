import { Briefcase, GraduationCap, HeartPulse, Home, PiggyBank, Plane, Sparkles, User, Users, type LucideIcon } from "lucide-react";

import type { LifeAreaColorKey, LifeAreaIconKey } from "@/types/life-planner";

/**
 * Resolves a Life Area's serializable `iconKey`/`colorKey` back into
 * something render-able - the same "data carries a string key, a lookup map
 * resolves it" split `PLANNER_WORKSPACE_ICONS`
 * (`@/app/(app)/_components/planner-workspace-icons`) already establishes,
 * here scoped to the icons/colors an individual Life Area can carry rather
 * than a whole workspace nav.
 *
 * Plain, framework-agnostic module (no `"use client"`) so both the Areas
 * page (Server Component) and its client-side card/form pieces can import
 * it directly.
 */
export const AREA_ICONS: Record<LifeAreaIconKey, LucideIcon> = {
  personal: User,
  career: Briefcase,
  education: GraduationCap,
  finance: PiggyBank,
  health: HeartPulse,
  relationships: Users,
  home: Home,
  travel: Plane,
  other: Sparkles,
};

export const AREA_ICON_OPTIONS: { value: LifeAreaIconKey; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "career", label: "Career" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "health", label: "Health & Wellness" },
  { value: "relationships", label: "Relationships" },
  { value: "home", label: "Home" },
  { value: "travel", label: "Travel" },
  { value: "other", label: "Other" },
];

// Tailwind's scanner needs every class name to appear as a complete literal
// somewhere in source (AGENTS.md's own "Tailwind gotcha") - an explicit
// `Record` here instead of building the string from `colorKey` at runtime,
// the same pattern `container.tsx`'s `alignClass`/`justifyClass` use.
export const AREA_COLOR_CHIP_CLASS: Record<LifeAreaColorKey, string> = {
  neutral: "bg-surface-muted text-ink-muted",
  brand: "bg-accent-subtle text-brand",
  accent: "bg-brand/10 text-brand",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error: "bg-error-subtle text-error",
};

export const AREA_COLOR_OPTIONS: { value: LifeAreaColorKey; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "brand", label: "Brand" },
  { value: "accent", label: "Accent" },
  { value: "success", label: "Green" },
  { value: "warning", label: "Amber" },
  { value: "error", label: "Red" },
];
