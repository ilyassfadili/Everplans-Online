"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { BudgetAccount, BudgetAccountType } from "@/types/budget";

import { editAccountAction, removeAccountAction } from "../actions";
import { ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_OPTIONS } from "./account-types";

interface AccountRowProps {
  account: BudgetAccount;
}

/** One active account - name, a type badge, inline rename (name and/or type), and archive. */
export function AccountRow({ account }: AccountRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const type = formData.get("type");

    setIsSaving(true);
    const result = await editAccountAction(account.id, {
      name: typeof name === "string" ? name : undefined,
      type: typeof type === "string" ? (type as BudgetAccountType) : undefined,
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleRemove() {
    if (
      window.confirm(
        `Archive "${account.name}"? Existing expenses and income entries that reference it will keep working - it just won't be offered as a pick for new ones.`,
      )
    ) {
      void removeAccountAction(account.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input name="name" defaultValue={account.name} maxLength={100} aria-label="Account name" required />
            <Select name="type" defaultValue={account.type} options={ACCOUNT_TYPE_OPTIONS} aria-label="Account type" className="sm:w-40" />
          </div>
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Text size="body" weight="medium" className="text-ink">
          {account.name}
        </Text>
        <Badge variant="neutral">{ACCOUNT_TYPE_LABEL[account.type]}</Badge>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${account.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Archive "${account.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}
