"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createBill,
  deleteBill,
  markBillPaid,
  markBillUnpaid,
  setBillRecurrenceActive,
  updateBill,
} from "@/lib/home-planner/bills";
import type { BillCategory } from "@/types/home-planner";

/**
 * The bills feature's own Server Actions - thin wrappers around
 * `@/lib/home-planner/bills`, colocated here since every route under
 * `/app/home-planner/bills` shares them, the same shape
 * `maintenance/actions.ts` establishes.
 */

const BILLS_PATH = "/app/home-planner/bills";
const HOME_PLANNER_PATH = "/app/home-planner";

function revalidateBills() {
  revalidatePath(BILLS_PATH);
  revalidatePath(HOME_PLANNER_PATH);
}

function readBillInput(formData: FormData) {
  const name = formData.get("name");
  const category = formData.get("category");
  const amountDollars = formData.get("amountDollars");
  const dueDate = formData.get("dueDate");
  const notes = formData.get("notes");
  const recurrenceFrequency = formData.get("recurrenceFrequency");
  const recurrenceIntervalDays = formData.get("recurrenceIntervalDays");

  return {
    name: typeof name === "string" ? name : "",
    // Cast, not validated here - `createBill`/`updateBill`'s zod schema
    // (`z.enum`) is the real validation; an unrecognized value fails there
    // with a friendly "Choose a category" message rather than silently
    // defaulting.
    category: (typeof category === "string" ? category : "") as BillCategory,
    amountDollars: typeof amountDollars === "string" ? amountDollars : "",
    dueDate: typeof dueDate === "string" ? dueDate : undefined,
    notes: typeof notes === "string" ? notes : undefined,
    recurrenceFrequency: (typeof recurrenceFrequency === "string" ? recurrenceFrequency : "none") as
      | "none"
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly"
      | "yearly"
      | "custom",
    recurrenceIntervalDays: typeof recurrenceIntervalDays === "string" ? recurrenceIntervalDays : undefined,
  };
}

export interface CreateBillFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/** Creates a bill, then redirects into its own detail page. */
export async function createBillFormAction(
  homeId: string,
  _prevState: CreateBillFormState,
  formData: FormData,
): Promise<CreateBillFormState> {
  const result = await createBill(homeId, readBillInput(formData));

  if (result.status === "success") {
    revalidateBills();
    redirect(`/app/home-planner/bills/${result.bill.id}`);
  }
  return { status: result.status, message: result.message };
}

export interface UpdateBillFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
}

/** Edits a bill in place - the same "stay on the page, report success" pattern `updateMaintenanceTaskFormAction` uses. */
export async function updateBillFormAction(
  billId: string,
  _prevState: UpdateBillFormState,
  formData: FormData,
): Promise<UpdateBillFormState> {
  const result = await updateBill(billId, readBillInput(formData));

  if (result.status === "success") {
    revalidateBills();
    return { status: "success", message: "Saved." };
  }
  return { status: result.status, message: result.message };
}

export async function deleteBillAction(billId: string): Promise<void> {
  await deleteBill(billId);
  revalidateBills();
  redirect(BILLS_PATH);
}

/** Marks a bill paid - an instant-save toggle, the same pattern `completeTaskAction` (Maintenance) establishes. */
export async function markPaidAction(billId: string): Promise<void> {
  await markBillPaid(billId);
  revalidateBills();
}

/** Marks a paid bill unpaid again. */
export async function markUnpaidAction(billId: string): Promise<void> {
  await markBillUnpaid(billId);
  revalidateBills();
}

/** Pauses or resumes a recurring bill's series. */
export async function setBillRecurrenceActiveAction(billId: string, active: boolean): Promise<void> {
  await setBillRecurrenceActive(billId, active);
  revalidateBills();
}
