import type { BudgetAccountType } from "@/types/budget";

/**
 * The 5 fixed account types (`budget_accounts_type_valid`) and their display
 * labels, shared between the add form's `<Select>`, each row's inline-edit
 * `<Select>`, and the read-only type badge - one source of truth for "how a
 * raw hyphenated type value like `credit-card` becomes the text a user sees."
 */
export const ACCOUNT_TYPE_OPTIONS: { value: BudgetAccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "credit-card", label: "Credit Card" },
  { value: "other", label: "Other" },
];

export const ACCOUNT_TYPE_LABEL: Record<BudgetAccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  "credit-card": "Credit Card",
  other: "Other",
};
