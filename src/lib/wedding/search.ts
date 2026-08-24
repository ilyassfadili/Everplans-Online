"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";
import type { WeddingSearchResult } from "@/types/wedding";

/**
 * The Wedding Planner's global search (Prompt 5 Phase 4) - plain
 * case-insensitive partial matching (`ilike`) across every meaningful
 * user-created entity, not a search engine. Each entity type is queried
 * directly against its own real table (never a duplicated search index),
 * capped per type so one prolific category can't crowd out the rest, and
 * results resolve to the real page that entity already lives on - search
 * introduces no pages of its own.
 *
 * Resolves the wedding from the current session itself
 * (`getWeddingForCurrentUser`) rather than taking a `weddingId` param -
 * the same shape `searchWorkspace` (`@/lib/workspace-search`) already
 * uses for the marketplace's own search, so the calling component never
 * has to know or pass an id.
 */

const PER_TYPE_LIMIT = 5;

export async function searchWedding(query: string): Promise<WeddingSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const wedding = await getWeddingForCurrentUser();
  if (!wedding) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const pattern = `%${trimmed}%`;

  const [tasks, milestones, importantDates, guests, vendors, events, venues, notes, decisions, documents] = await Promise.all([
    supabase.from("wedding_tasks").select("id, title").eq("wedding_id", wedding.id).ilike("title", pattern).limit(PER_TYPE_LIMIT),
    supabase.from("wedding_milestones").select("id, title").eq("wedding_id", wedding.id).ilike("title", pattern).limit(PER_TYPE_LIMIT),
    supabase.from("wedding_important_dates").select("id, title").eq("wedding_id", wedding.id).ilike("title", pattern).limit(PER_TYPE_LIMIT),
    supabase
      .from("wedding_guests")
      .select("id, first_name, last_name")
      .eq("wedding_id", wedding.id)
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`)
      .limit(PER_TYPE_LIMIT),
    supabase.from("wedding_vendors").select("id, name, category").eq("wedding_id", wedding.id).ilike("name", pattern).limit(PER_TYPE_LIMIT),
    supabase.from("wedding_events").select("id, name, event_type").eq("wedding_id", wedding.id).ilike("name", pattern).limit(PER_TYPE_LIMIT),
    supabase.from("wedding_venues").select("id, name").eq("wedding_id", wedding.id).ilike("name", pattern).limit(PER_TYPE_LIMIT),
    supabase.from("wedding_notes").select("id, title").eq("wedding_id", wedding.id).ilike("title", pattern).limit(PER_TYPE_LIMIT),
    supabase.from("wedding_decisions").select("id, title").eq("wedding_id", wedding.id).ilike("title", pattern).limit(PER_TYPE_LIMIT),
    supabase.from("wedding_documents").select("id, title").eq("wedding_id", wedding.id).ilike("title", pattern).limit(PER_TYPE_LIMIT),
  ]);

  const results: WeddingSearchResult[] = [
    ...(tasks.data ?? []).map((row) => ({
      type: "task" as const,
      id: row.id,
      title: row.title,
      description: null,
      href: "/app/wedding-planner/checklist",
    })),
    ...(milestones.data ?? []).map((row) => ({
      type: "milestone" as const,
      id: row.id,
      title: row.title,
      description: null,
      href: "/app/wedding-planner",
    })),
    ...(importantDates.data ?? []).map((row) => ({
      type: "important-date" as const,
      id: row.id,
      title: row.title,
      description: null,
      href: "/app/wedding-planner/timeline",
    })),
    ...(guests.data ?? []).map((row) => ({
      type: "guest" as const,
      id: row.id,
      title: `${row.first_name} ${row.last_name}`,
      description: null,
      href: "/app/wedding-planner/guests",
    })),
    ...(vendors.data ?? []).map((row) => ({
      type: "vendor" as const,
      id: row.id,
      title: row.name,
      description: row.category,
      href: `/app/wedding-planner/vendors/${row.id}`,
    })),
    ...(events.data ?? []).map((row) => ({
      type: "event" as const,
      id: row.id,
      title: row.name,
      description: row.event_type,
      href: `/app/wedding-planner/events/${row.id}`,
    })),
    ...(venues.data ?? []).map((row) => ({
      type: "venue" as const,
      id: row.id,
      title: row.name,
      description: null,
      href: "/app/wedding-planner/events",
    })),
    ...(notes.data ?? []).map((row) => ({
      type: "note" as const,
      id: row.id,
      title: row.title,
      description: null,
      href: "/app/wedding-planner/notes",
    })),
    ...(decisions.data ?? []).map((row) => ({
      type: "decision" as const,
      id: row.id,
      title: row.title,
      description: null,
      href: "/app/wedding-planner/notes",
    })),
    ...(documents.data ?? []).map((row) => ({
      type: "document" as const,
      id: row.id,
      title: row.title,
      description: null,
      href: "/app/wedding-planner/notes",
    })),
  ];

  return results;
}
