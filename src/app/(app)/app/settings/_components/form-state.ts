import type {
  UpdateAvatarFormState,
  UpdatePasswordFormState,
  UpdateProfileFormState,
} from "../actions";

/**
 * The `useActionState` initial values for `/app/settings`'s three forms -
 * pulled out of `../actions.ts` because a `"use server"` file may only
 * export async functions ("A 'use server' file can only export async
 * functions, found object") and these are plain object literals, not
 * functions. The action *types* (`UpdateProfileFormState` etc.) still live
 * in `actions.ts` - a `type`-only import is erased at compile time, so it
 * never becomes a runtime export of that file and doesn't trip the same
 * rule; only the actual `const ... = { status: "idle" }` values needed
 * to move.
 */
export const updateProfileFormInitialState: UpdateProfileFormState = { status: "idle" };

export const updateAvatarFormInitialState: UpdateAvatarFormState = { status: "idle" };

export const updatePasswordFormInitialState: UpdatePasswordFormState = { status: "idle" };
