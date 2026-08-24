"use client";

import { useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Select, type SelectOption } from "@/components/ui/form/select";
import { DOCUMENT_CATEGORY_OPTIONS } from "@/components/home-planner/document-category-options";
import type { ResolvedHomeRelatedEntity } from "@/lib/home-planner/related-entity";
import type { HomeDocument } from "@/types/home-planner";

import { DocumentRow } from "./document-row";

interface DocumentListProps {
  documents: HomeDocument[];
  relatedEntityOptions: SelectOption[];
  relatedById: Record<string, ResolvedHomeRelatedEntity | null>;
}

const ALL_CATEGORIES_OPTION: SelectOption = { value: "all", label: "All categories" };

/** The documents list - search plus category filter, all client-side over the already-fetched list (Phase 2: "search/filter documents"), the same pattern `InventoryList` establishes. */
export function DocumentList({ documents, relatedEntityOptions, relatedById }: DocumentListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) => {
      if (normalizedQuery && !document.title.toLowerCase().includes(normalizedQuery)) return false;
      if (category !== "all" && document.category !== category) return false;
      return true;
    });
  }, [documents, query, category]);

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Keep the important paperwork close"
        description="Upload insurance policies, warranties, receipts, and manuals above."
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search documents..."
          aria-label="Search documents"
        />
        <Select
          value={category}
          onValueChange={setCategory}
          options={[ALL_CATEGORIES_OPTION, ...DOCUMENT_CATEGORY_OPTIONS]}
          aria-label="Filter by category"
          className="sm:w-52"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No documents match" description="Try a different search or filter." className="py-14" />
      ) : (
        <Card variant="standard" padding="lg">
          <ul className="flex flex-col divide-y divide-line-subtle">
            {filtered.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                relatedEntityOptions={relatedEntityOptions}
                related={relatedById[document.id] ?? null}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
