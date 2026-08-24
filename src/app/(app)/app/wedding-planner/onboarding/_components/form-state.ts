import type { CreateWeddingFormState } from "../actions";

/**
 * `useActionState`'s initial value for the onboarding form - pulled out of
 * `../actions.ts` for the same reason `/app/settings`'s own
 * `form-state.ts` exists: a `"use server"` file may only export async
 * functions, and this is a plain object literal.
 */
export const createWeddingFormInitialState: CreateWeddingFormState = { status: "idle" };
