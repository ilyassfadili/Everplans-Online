import type { CreateTripFormState } from "../actions";

/**
 * `useActionState`'s initial value for the trip setup form - pulled out of
 * `../actions.ts` for the same reason `wedding-planner/onboarding/_components/form-state.ts`
 * exists: a `"use server"` file may only export async functions, and this
 * is a plain object literal.
 */
export const createTripFormInitialState: CreateTripFormState = { status: "idle" };
