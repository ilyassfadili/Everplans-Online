import type { UpdateHomeFormState } from "../actions";

/**
 * `useActionState`'s initial value for the edit home form - a plain object
 * literal pulled out of `../actions.ts` for the same reason every other
 * form's `form-state.ts` in this codebase exists (a `"use server"` file may
 * only export async functions).
 */
export const updateHomeFormInitialState: UpdateHomeFormState = { status: "idle" };
