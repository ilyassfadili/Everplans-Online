"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, X } from "lucide-react";

import { Alert, Badge, Button, DatePicker, FormField, Icon, Select, Stack, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { getPeriodLabel } from "@/lib/budget/period";
import type { BudgetPeriodType } from "@/types/budget";

import { completeBudgetOnboardingAction } from "../actions";

/**
 * The Budget Planner onboarding wizard (Prompt 1 Phase 3). Unlike Wedding
 * Planner's single-step form, this genuinely needs progressive disclosure -
 * one required step (what to call the budget, how often to plan around) and
 * three optional ones (an income source, a couple of starter categories, a
 * goal), each skippable on its own without blocking the rest. A short
 * review step lets the user see and edit everything before it's actually
 * created, then one Server Action call (`completeBudgetOnboardingAction`)
 * creates the plan and whatever optional pieces were filled in, redirecting
 * straight into the workspace on success.
 *
 * State lives here, not in the URL or `useActionState` - five steps of
 * different shapes don't map onto one flat `FormData`, so the wizard
 * collects everything itself and submits once, at the end.
 */

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const INCOME_FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-time", label: "One-time" },
];

const CATEGORY_SUGGESTIONS = ["Housing", "Groceries", "Transportation", "Utilities", "Entertainment", "Health"];

interface CategoryRow {
  name: string;
  amount: string;
}

const STEP_LABELS = ["Basics", "Income", "Categories", "Goal", "Review"];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("My Budget");
  const [periodType, setPeriodType] = useState<BudgetPeriodType>("monthly");

  const [addIncome, setAddIncome] = useState(false);
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeFrequency, setIncomeFrequency] = useState("monthly");

  const [categories, setCategories] = useState<CategoryRow[]>([{ name: "", amount: "" }]);

  const [addGoal, setAddGoal] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const filledCategories = categories.filter((category) => category.name.trim());

  function goNext() {
    setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleCategoryChange(index: number, field: keyof CategoryRow, value: string) {
    setCategories((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function handleAddCategoryRow() {
    setCategories((current) => [...current, { name: "", amount: "" }]);
  }

  function handleRemoveCategoryRow(index: number) {
    setCategories((current) => current.filter((_, i) => i !== index));
  }

  function handleSuggestionClick(suggestion: string) {
    setCategories((current) => {
      const emptyIndex = current.findIndex((row) => !row.name.trim());
      if (emptyIndex === -1) return [...current, { name: suggestion, amount: "" }];
      return current.map((row, i) => (i === emptyIndex ? { ...row, name: suggestion } : row));
    });
  }

  function handleFinish() {
    setError(null);
    startTransition(async () => {
      const result = await completeBudgetOnboardingAction({
        name,
        periodType,
        income: addIncome ? { name: incomeName, amountCents: incomeAmount, frequency: incomeFrequency } : null,
        categories: filledCategories.map((category) => ({ name: category.name, plannedAmountCents: category.amount })),
        goal: addGoal ? { name: goalName, targetAmountCents: goalAmount, targetDate: goalDate } : null,
      });

      // A successful call redirects server-side and never resolves back
      // here - reaching this line means it genuinely failed.
      if (result?.status === "error") {
        setError(result.message);
      }
    });
  }

  return (
    <Stack gap="6">
      {/* Progress - a slim fill bar plus "Step X of Y," the same calm,
          non-alarming progress language the rest of the product uses for
          budget/goal progress bars. */}
      <div>
        <div className="flex items-center justify-between">
          <Text size="body-sm" weight="medium" className="text-ink">
            {STEP_LABELS[step]}
          </Text>
          <Text size="body-sm" tone="faint">
            Step {step + 1} of {STEP_LABELS.length}
          </Text>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 ease-standard"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Couldn't create your budget">
          {error}
        </Alert>
      )}

      {step === 0 && (
        <Stack gap="5">
          <FormField label="What should we call this budget?" hint="You can change this anytime.">
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="My Budget" />
          </FormField>
          <FormField label="How often do you plan around?" hint="This decides how we translate income and spending into a single period.">
            <Select value={periodType} onValueChange={(value) => setPeriodType(value as BudgetPeriodType)} options={PERIOD_OPTIONS} />
          </FormField>
        </Stack>
      )}

      {step === 1 && (
        <Stack gap="5">
          <Text tone="muted">Add an income source now, or skip this and add it later from the Income page.</Text>
          {!addIncome ? (
            <Button variant="outline" onClick={() => setAddIncome(true)} leadingIcon={<Icon icon={Plus} size="sm" />} className="w-fit">
              Add an income source
            </Button>
          ) : (
            <Stack gap="4" className="rounded-lg border border-line-subtle p-4">
              <div className="flex items-center justify-between">
                <Text size="body-sm" weight="medium">
                  Income source
                </Text>
                <button
                  type="button"
                  onClick={() => setAddIncome(false)}
                  className="text-ink-faint transition-colors duration-150 ease-standard hover:text-ink"
                  aria-label="Remove this income source"
                >
                  <Icon icon={X} size="sm" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Name">
                  <Input value={incomeName} onChange={(event) => setIncomeName(event.target.value)} placeholder="Salary" maxLength={100} />
                </FormField>
                <FormField label="Amount">
                  <Input
                    value={incomeAmount}
                    onChange={(event) => setIncomeAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </FormField>
              </div>
              <FormField label="How often?">
                <Select value={incomeFrequency} onValueChange={setIncomeFrequency} options={INCOME_FREQUENCY_OPTIONS} />
              </FormField>
            </Stack>
          )}
        </Stack>
      )}

      {step === 2 && (
        <Stack gap="5">
          <Text tone="muted">Add a couple of categories for your main spending areas, or skip this and build your budget later.</Text>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => handleSuggestionClick(suggestion)}>
                <Badge variant="outline" className="cursor-pointer transition-colors duration-150 ease-standard hover:border-brand hover:text-brand">
                  {suggestion}
                </Badge>
              </button>
            ))}
          </div>
          <Stack gap="3">
            {categories.map((category, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto_auto] items-end gap-3">
                <FormField label="Category">
                  <Input
                    value={category.name}
                    onChange={(event) => handleCategoryChange(index, "name", event.target.value)}
                    placeholder="e.g. Groceries"
                    maxLength={100}
                  />
                </FormField>
                <FormField label="Planned amount">
                  <Input
                    value={category.amount}
                    onChange={(event) => handleCategoryChange(index, "amount", event.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-28"
                  />
                </FormField>
                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryRow(index)}
                    className="mb-0.5 flex size-11 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 ease-standard hover:text-error"
                    aria-label="Remove this category"
                  >
                    <Icon icon={X} size="sm" />
                  </button>
                )}
              </div>
            ))}
          </Stack>
          <Button variant="ghost" size="sm" onClick={handleAddCategoryRow} leadingIcon={<Icon icon={Plus} size="sm" />} className="w-fit">
            Add another category
          </Button>
        </Stack>
      )}

      {step === 3 && (
        <Stack gap="5">
          <Text tone="muted">Set a goal you&rsquo;re working toward, or skip this and add one later from the Goals page.</Text>
          {!addGoal ? (
            <Button variant="outline" onClick={() => setAddGoal(true)} leadingIcon={<Icon icon={Plus} size="sm" />} className="w-fit">
              Add a goal
            </Button>
          ) : (
            <Stack gap="4" className="rounded-lg border border-line-subtle p-4">
              <div className="flex items-center justify-between">
                <Text size="body-sm" weight="medium">
                  Goal
                </Text>
                <button
                  type="button"
                  onClick={() => setAddGoal(false)}
                  className="text-ink-faint transition-colors duration-150 ease-standard hover:text-ink"
                  aria-label="Remove this goal"
                >
                  <Icon icon={X} size="sm" />
                </button>
              </div>
              <FormField label="Name">
                <Input value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="Emergency fund" maxLength={100} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Target amount">
                  <Input value={goalAmount} onChange={(event) => setGoalAmount(event.target.value)} inputMode="decimal" placeholder="0.00" />
                </FormField>
                <FormField label="Target date" hint="Optional">
                  <DatePicker value={goalDate} onValueChange={setGoalDate} />
                </FormField>
              </div>
            </Stack>
          )}
        </Stack>
      )}

      {step === 4 && (
        <Stack gap="4">
          <Text tone="muted">Here&rsquo;s what we&rsquo;ll set up. You can change any of this once you&rsquo;re in your workspace.</Text>
          <Stack gap="3" className="rounded-lg border border-line-subtle p-4">
            <SummaryRow label="Budget name" value={name || "My Budget"} onEdit={() => setStep(0)} />
            <SummaryRow label="Plan around" value={`Every ${getPeriodLabel(periodType)}`} onEdit={() => setStep(0)} />
            <SummaryRow
              label="Income"
              value={addIncome && incomeName.trim() ? incomeName : "Not added yet"}
              onEdit={() => setStep(1)}
            />
            <SummaryRow
              label="Categories"
              value={filledCategories.length > 0 ? `${filledCategories.length} category${filledCategories.length === 1 ? "" : "ies"}` : "Not added yet"}
              onEdit={() => setStep(2)}
            />
            <SummaryRow label="Goal" value={addGoal && goalName.trim() ? goalName : "Not added yet"} onEdit={() => setStep(3)} />
          </Stack>
        </Stack>
      )}

      <div className="flex items-center justify-between pt-2">
        {step > 0 ? (
          <Button variant="ghost" onClick={goBack} leadingIcon={<Icon icon={ArrowLeft} size="sm" />} disabled={isPending}>
            Back
          </Button>
        ) : (
          <span />
        )}

        {step < STEP_LABELS.length - 1 ? (
          <Button onClick={goNext} trailingIcon={<Icon icon={ArrowRight} size="sm" />}>
            {step === 0 ? "Continue" : "Next"}
          </Button>
        ) : (
          <Button onClick={handleFinish} loading={isPending} leadingIcon={!isPending ? <Icon icon={Check} size="sm" /> : undefined}>
            Create my budget
          </Button>
        )}
      </div>
    </Stack>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function SummaryRow({ label, value, onEdit }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <Text size="body-sm" tone="muted">
          {label}
        </Text>
        <Text weight="medium" className="text-ink">
          {value}
        </Text>
      </div>
      <button type="button" onClick={onEdit} className="text-body-sm font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover">
        Edit
      </button>
    </div>
  );
}
