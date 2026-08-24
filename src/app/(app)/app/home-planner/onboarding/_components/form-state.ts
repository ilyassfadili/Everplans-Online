import type { CreateHomeFormState } from "../actions";

/**
 * `useActionState`'s initial value for the home setup form - pulled out of
 * `../actions.ts` for the same reason `travel-planner/onboarding/_components/form-state.ts`
 * exists: a `"use server"` file may only export async functions, and this
 * is a plain object literal.
 */
export const createHomeFormInitialState: CreateHomeFormState = { status: "idle" };
