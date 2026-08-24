import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateNextDueDate } from "@/lib/home-planner/recurrence";
import type { Bill, BillCategory, MaintenanceRecurrenceFrequency } from "@/types/home-planner";

/**
 * Home Planner household bills - `public.home_bills`
 * (`supabase/migrations/20260910000007_home_bills.sql`). Same shape as
 * `@/lib/home-planner/maintenance`: every function calls `requireUser()`
 * itself, RLS (a join back to `homes.owner_id`) independently enforces the
 * same boundary, and recurring occurrences are generated lazily on
 * "mark paid" using the exact same reused recurrence engine
 * (`@/lib/home-planner/recurrence`) Maintenance already established.
 */

const BILL_COLUMNS =
  "id, home_id, name, category, amount_cents, due_date, notes, paid_at, recurrence_frequency, recurrence_interval_days, recurrence_active, series_root_id, created_at, updated_at";

const CATEGORIES = [
  "electricity",
  "water",
  "gas",
  "internet",
  "phone",
  "insurance",
  "rent",
  "mortgage",
  "subscription",
  "property-services",
  "other",
] as const satisfies readonly BillCategory[];

const RECURRENCE_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const satisfies readonly MaintenanceRecurrenceFrequency[];

type BillRow = {
  id: string;
  home_id: string;
  name: string;
  category: string;
  amount_cents: number;
  due_date: string | null;
  notes: string | null;
  paid_at: string | null;
  recurrence_frequency: string | null;
  recurrence_interval_days: number | null;
  recurrence_active: boolean;
  series_root_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapBillRow(row: BillRow): Bill {
  return {
    id: row.id,
    homeId: row.home_id,
    name: row.name,
    // Cast, not re-validated: `home_bills_category_valid`/
    // `_recurrence_frequency_valid` (the migration) already guarantee the
    // database can never hold anything outside these unions.
    category: row.category as BillCategory,
    amountCents: row.amount_cents,
    dueDate: row.due_date,
    notes: row.notes,
    paidAt: row.paid_at,
    recurrenceFrequency: row.recurrence_frequency as MaintenanceRecurrenceFrequency | null,
    recurrenceIntervalDays: row.recurrence_interval_days,
    recurrenceActive: row.recurrence_active,
    seriesRootId: row.series_root_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBillsForHome(homeId: string): Promise<Bill[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_bills")
    .select(BILL_COLUMNS)
    .eq("home_id", homeId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("getBillsForHome: failed to load bills", error);
    return [];
  }

  return (data ?? []).map(mapBillRow);
}

export async function getBillById(homeId: string, billId: string): Promise<Bill | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_bills")
    .select(BILL_COLUMNS)
    .eq("id", billId)
    .eq("home_id", homeId)
    .maybeSingle();

  if (error) {
    console.error("getBillById: failed to load bill", error);
    return null;
  }

  return data ? mapBillRow(data) : null;
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const billSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a bill name.").max(150, "Keep it under 150 characters."),
    category: z.enum(CATEGORIES, { message: "Choose a category." }),
    amountDollars: z
      .string()
      .trim()
      .min(1, "Enter an amount.")
      .transform((value, ctx) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
          ctx.addIssue({ code: "custom", message: "Enter a valid amount." });
          return z.NEVER;
        }
        return Math.round(parsed * 100);
      }),
    dueDate: optionalTextSchema(10, "Enter a valid date."),
    notes: optionalTextSchema(2000, "Keep it under 2000 characters."),
    recurrenceFrequency: z
      .union([z.enum(RECURRENCE_FREQUENCIES), z.literal("none")])
      .optional()
      .transform((value) => (value && value !== "none" ? value : null)),
    recurrenceIntervalDays: z.coerce
      .number()
      .int("Whole numbers only.")
      .min(1, "At least 1 day.")
      .max(3650, "Keep it to 3650 days or fewer.")
      .optional()
      .transform((value) => value ?? null),
  })
  .refine((data) => data.recurrenceFrequency !== "custom" || data.recurrenceIntervalDays !== null, {
    message: "Enter a custom interval in days.",
    path: ["recurrenceIntervalDays"],
  });

export type BillInput = z.input<typeof billSchema>;

export type BillMutationResult =
  | { status: "success"; bill: Bill }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Bill creation (Phase 1: "do not overcomplicate") - name, category, amount, optional due date/recurrence/notes. */
export async function createBill(homeId: string, input: BillInput): Promise<BillMutationResult> {
  await requireUser();

  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_bills")
    .insert({
      home_id: homeId,
      name: parsed.data.name,
      category: parsed.data.category,
      amount_cents: parsed.data.amountDollars,
      due_date: parsed.data.dueDate,
      notes: parsed.data.notes,
      recurrence_frequency: parsed.data.recurrenceFrequency,
      recurrence_interval_days: parsed.data.recurrenceFrequency === "custom" ? parsed.data.recurrenceIntervalDays : null,
    })
    .select(BILL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createBill: failed to create bill", error);
    return { status: "error", message: "Couldn't add that bill. Please try again." };
  }

  return { status: "success", bill: mapBillRow(data) };
}

/** Edits a bill - ships every field editable from day one. */
export async function updateBill(billId: string, input: BillInput): Promise<BillMutationResult> {
  await requireUser();

  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_bills")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      amount_cents: parsed.data.amountDollars,
      due_date: parsed.data.dueDate,
      notes: parsed.data.notes,
      recurrence_frequency: parsed.data.recurrenceFrequency,
      recurrence_interval_days: parsed.data.recurrenceFrequency === "custom" ? parsed.data.recurrenceIntervalDays : null,
    })
    .eq("id", billId)
    .select(BILL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateBill: failed to update bill", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", bill: mapBillRow(data) };
}

/**
 * Marks a bill paid - sets `paid_at` to now. If this bill recurs and its
 * recurrence is active, this also generates the series' next occurrence,
 * the exact same duplicate-safe pattern `completeMaintenanceTask`
 * establishes (including the `23505` race fallback via
 * `home_bills_series_one_open_idx`, the migration).
 */
export async function markBillPaid(billId: string): Promise<BillMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_bills")
    .update({ paid_at: new Date().toISOString() })
    .eq("id", billId)
    .select(BILL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("markBillPaid: failed to mark bill paid", error);
    return { status: "error", message: "Couldn't mark that bill paid. Please try again." };
  }

  const paid = mapBillRow(data);

  if (paid.recurrenceFrequency && paid.recurrenceActive) {
    const anchorDate = paid.dueDate ?? paid.paidAt!.slice(0, 10);
    const nextDueDate = calculateNextDueDate(anchorDate, paid.recurrenceFrequency, paid.recurrenceIntervalDays);
    const seriesRootId = paid.seriesRootId ?? paid.id;

    const { error: generateError } = await supabase.from("home_bills").insert({
      home_id: paid.homeId,
      name: paid.name,
      category: paid.category,
      amount_cents: paid.amountCents,
      due_date: nextDueDate,
      notes: paid.notes,
      recurrence_frequency: paid.recurrenceFrequency,
      recurrence_interval_days: paid.recurrenceIntervalDays,
      recurrence_active: true,
      series_root_id: seriesRootId,
    });

    if (generateError && generateError.code !== "23505") {
      console.error("markBillPaid: failed to generate next occurrence", generateError, { userId: user.id });
    }
  }

  return { status: "success", bill: paid };
}

/** Marks a paid bill unpaid again - clears `paid_at`. */
export async function markBillUnpaid(billId: string): Promise<BillMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_bills")
    .update({ paid_at: null })
    .eq("id", billId)
    .select(BILL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("markBillUnpaid: failed to mark bill unpaid", error);
    return { status: "error", message: "Couldn't update that bill. Please try again." };
  }

  return { status: "success", bill: mapBillRow(data) };
}

/** Pauses or resumes a recurring bill's series - paying a paused bill still marks it paid, but generates no next occurrence. */
export async function setBillRecurrenceActive(billId: string, active: boolean): Promise<BillMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_bills")
    .update({ recurrence_active: active })
    .eq("id", billId)
    .select(BILL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("setBillRecurrenceActive: failed to update bill", error);
    return { status: "error", message: "Couldn't update that bill. Please try again." };
  }

  return { status: "success", bill: mapBillRow(data) };
}

export type DeleteBillResult = { status: "success" } | { status: "error"; message: string };

export async function deleteBill(billId: string): Promise<DeleteBillResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("home_bills").delete().eq("id", billId);

  if (error) {
    console.error("deleteBill: failed to delete bill", error);
    return { status: "error", message: "Couldn't remove that bill. Please try again." };
  }

  return { status: "success" };
}
