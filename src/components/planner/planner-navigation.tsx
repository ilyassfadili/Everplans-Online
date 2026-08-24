import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui";

interface PlannerNavigationProps {
  isFirstPage: boolean;
  isLastPage: boolean;
  /** Gates the forward control - see `canAdvanceFromPage` in `@/lib/planner-runtime`. The control stays enabled either way (never `disabled`); pressing it while invalid triggers validation display instead of silently doing nothing - see `PlannerRuntime`'s own comment on why. */
  canAdvance: boolean;
  /** True while `finishPlannerAction` (`./actions.ts`) is persisting completion on the last page - real loading state, not an assumed-instant save. */
  isSubmitting?: boolean;
  onPrevious: () => void;
  /** Advances to the next page, or - on the last page - the runtime's own "finish" handling. One callback either way; which it means is `isLastPage`, decided by the orchestrator, not this component. */
  onAdvance: () => void;
}

/**
 * The reusable Prev/Next(/Finish) control bar - navigation driven
 * entirely by the flags the runtime already computed (`isFirstPage`,
 * `isLastPage`, `canAdvance`), never by this component knowing anything
 * about a specific planner's page count or structure.
 */
export function PlannerNavigation({
  isFirstPage,
  isLastPage,
  canAdvance,
  isSubmitting = false,
  onPrevious,
  onAdvance,
}: PlannerNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line-subtle pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstPage || isSubmitting}
        leadingIcon={<ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />}
      >
        Back
      </Button>

      <Button
        type="button"
        variant={canAdvance ? "primary" : "secondary"}
        onClick={onAdvance}
        loading={isLastPage && isSubmitting}
        trailingIcon={
          isLastPage ? (
            <Check className="size-4" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          )
        }
      >
        {isLastPage ? "Finish" : "Next"}
      </Button>
    </div>
  );
}
