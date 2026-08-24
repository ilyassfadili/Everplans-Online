"use server";

import { revalidatePath } from "next/cache";

import {
  createContact,
  deleteContact,
  updateContact,
  type HomeContactMutationResult,
  type UpdateHomeContactInput,
} from "@/lib/home-planner/contacts";
import type { HomeContactRole } from "@/types/home-planner";

/**
 * The important contacts list's own Server Actions - thin wrappers around
 * `@/lib/home-planner/contacts`, colocated here since only this one route
 * mutates contacts, the same shape `wedding-planner/guests/actions.ts`
 * establishes.
 */

const CONTACTS_PATH = "/app/home-planner/contacts";
const HOME_PLANNER_PATH = "/app/home-planner";

function revalidateContacts() {
  revalidatePath(CONTACTS_PATH);
  revalidatePath(HOME_PLANNER_PATH);
}

export interface CreateHomeContactFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createContactFormAction(
  homeId: string,
  _prevState: CreateHomeContactFormState,
  formData: FormData,
): Promise<CreateHomeContactFormState> {
  const name = formData.get("name");
  const role = formData.get("role");
  const phone = formData.get("phone");
  const email = formData.get("email");

  const result = await createContact(homeId, {
    name: typeof name === "string" ? name : "",
    // Cast, not validated here - `createContact`'s zod schema (`z.enum`) is
    // the real validation; an unrecognized value fails there with a
    // friendly "Choose a role" message rather than silently defaulting.
    role: (typeof role === "string" ? role : "") as HomeContactRole,
    phone: typeof phone === "string" ? phone : undefined,
    email: typeof email === "string" ? email : undefined,
  });

  if (result.status === "success") {
    revalidateContacts();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editContactAction(contactId: string, input: UpdateHomeContactInput): Promise<HomeContactMutationResult> {
  const result = await updateContact(contactId, input);
  if (result.status === "success") {
    revalidateContacts();
  }
  return result;
}

export async function removeContactAction(contactId: string): Promise<void> {
  await deleteContact(contactId);
  revalidateContacts();
}
