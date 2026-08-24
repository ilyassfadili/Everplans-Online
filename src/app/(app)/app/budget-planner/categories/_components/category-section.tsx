"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";

import { Button, Card, Heading, Icon, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { BudgetCategory } from "@/types/budget";

import { archiveCategoryAction, renameCategoryAction, restoreCategoryAction } from "../actions";

interface ActiveCategoryRowProps {
  category: BudgetCategory;
}

function ActiveCategoryRow({ category }: ActiveCategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");

    setIsSaving(true);
    const result = await renameCategoryAction(category.id, typeof name === "string" ? name : "");
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleArchive() {
    if (
      window.confirm(
        `Archive "${category.name}"? It'll be hidden from new pickers, but anything already using it (like past transactions) keeps its category.`,
      )
    ) {
      void archiveCategoryAction(category.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Input name="name" defaultValue={category.name} maxLength={100} aria-label="Category name" required className="sm:max-w-xs" />
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
      <Text size="body" weight="medium" className="min-w-0 truncate text-ink">
        {category.name}
      </Text>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Rename "${category.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <Button variant="ghost" size="sm" onClick={handleArchive}>
          Archive
        </Button>
      </div>
    </li>
  );
}

interface ArchivedCategoryRowProps {
  category: BudgetCategory;
}

function ArchivedCategoryRow({ category }: ArchivedCategoryRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <Text size="body-sm" tone="muted" className="min-w-0 truncate">
        {category.name}
      </Text>
      <Button variant="ghost" size="sm" onClick={() => void restoreCategoryAction(category.id)}>
        Restore
      </Button>
    </li>
  );
}

interface CategorySectionProps {
  title: string;
  /** Shown when this kind has zero categories at all - not just zero active ones. */
  emptyMessage: string;
  categories: BudgetCategory[];
}

/**
 * One kind's (income or expense) categories - active rows first, archived
 * ones tucked into a collapsed sub-section, mirroring the Budget page's own
 * `ArchivedCategories` collapsed-by-default pattern but scoped per-kind so
 * this page can show both income and expense categories side by side,
 * which the Budget page's own category list never needed to.
 */
export function CategorySection({ title, emptyMessage, categories }: CategorySectionProps) {
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);

  const activeCategories = categories.filter((category) => !category.isArchived);
  const archivedCategories = categories.filter((category) => category.isArchived);

  return (
    <Card variant="standard" padding="lg">
      <Heading as="h2" size="h4">
        {title}
      </Heading>

      {categories.length === 0 ? (
        <Text size="body-sm" tone="muted" className="mt-4">
          {emptyMessage}
        </Text>
      ) : (
        <>
          {activeCategories.length > 0 ? (
            <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
              {activeCategories.map((category) => (
                <ActiveCategoryRow key={category.id} category={category} />
              ))}
            </ul>
          ) : (
            <Text size="body-sm" tone="muted" className="mt-4">
              All categories here are archived.
            </Text>
          )}

          {archivedCategories.length > 0 && (
            <div className="mt-4 border-t border-line-subtle pt-3">
              <button
                type="button"
                onClick={() => setIsArchivedOpen((current) => !current)}
                className="flex items-center gap-1.5 text-body-sm font-medium text-ink-muted transition-colors duration-150 ease-standard hover:text-ink"
              >
                <Icon icon={isArchivedOpen ? ChevronUp : ChevronDown} size="sm" />
                Archived ({archivedCategories.length})
              </button>

              {isArchivedOpen && (
                <ul className="mt-2 flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface-muted/40 px-4">
                  {archivedCategories.map((category) => (
                    <ArchivedCategoryRow key={category.id} category={category} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
