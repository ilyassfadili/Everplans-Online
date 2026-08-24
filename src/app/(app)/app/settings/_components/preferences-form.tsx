"use client";

import { useState, useTransition } from "react";

import { FormField } from "@/components/ui";
import { Select } from "@/components/ui/form/select";
import type { ProfileDateFormat, ProfileTimeFormat } from "@/types/profile";

import { updatePreferenceAction } from "../actions";

interface PreferencesFormProps {
  dateFormat: ProfileDateFormat;
  timeFormat: ProfileTimeFormat;
}

const DATE_FORMAT_OPTIONS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY  (08/21/2026)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY  (21/08/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD  (2026-08-21)" },
] as const;

const TIME_FORMAT_OPTIONS = [
  { value: "12h", label: "12-hour  (2:30 PM)" },
  { value: "24h", label: "24-hour  (14:30)" },
] as const;

type SaveStatus = "idle" | "saving" | "saved" | "error";

const DATE_FORMAT_HINT = "Used everywhere Everplans shows a date.";
const TIME_FORMAT_HINT = "Used everywhere Everplans shows a time.";

function statusHint(status: SaveStatus, resting: string): string {
  if (status === "saving") return "Saving…";
  if (status === "saved") return "Saved.";
  if (status === "error") return "Couldn't save - please try again.";
  return resting;
}

/**
 * Preferences saves each control the moment it changes (Settings §9:
 * "save automatically for simple preferences... instant and
 * understandable") - no separate Save button for this section, unlike
 * Profile's. Local state updates optimistically on selection so the
 * control never visually reverts while the request is in flight; if
 * `updatePreferenceAction` (`../actions.ts`) comes back with an error,
 * the hint says so but the selection itself is left as the user chose it
 * rather than silently snapping back, since the visible mismatch (a
 * value shown but not actually saved) is exactly what that error message
 * exists to explain.
 *
 * No "Appearance" control here - Everplans is a locked light-mode-only
 * design system (see AGENTS.md's Color system section; a two-theme
 * version was built and deliberately reverted earlier in this project).
 * A Light/Dark/System selector that didn't actually change anything
 * would be fake functionality, the one thing every Settings section
 * explicitly rules out.
 */
export function PreferencesForm({ dateFormat, timeFormat }: PreferencesFormProps) {
  const [currentDateFormat, setCurrentDateFormat] = useState<ProfileDateFormat>(dateFormat);
  const [currentTimeFormat, setCurrentTimeFormat] = useState<ProfileTimeFormat>(timeFormat);
  const [dateStatus, setDateStatus] = useState<SaveStatus>("idle");
  const [timeStatus, setTimeStatus] = useState<SaveStatus>("idle");
  const [, startTransition] = useTransition();

  function handleDateFormatChange(value: string) {
    const next = value as ProfileDateFormat;
    setCurrentDateFormat(next);
    setDateStatus("saving");
    startTransition(async () => {
      const result = await updatePreferenceAction({ dateFormat: next });
      setDateStatus(result.status === "success" ? "saved" : "error");
    });
  }

  function handleTimeFormatChange(value: string) {
    const next = value as ProfileTimeFormat;
    setCurrentTimeFormat(next);
    setTimeStatus("saving");
    startTransition(async () => {
      const result = await updatePreferenceAction({ timeFormat: next });
      setTimeStatus(result.status === "success" ? "saved" : "error");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <FormField label="Language" hint="Everplans is currently available in English only.">
        <Select value="en" options={[{ value: "en", label: "English" }]} disabled />
      </FormField>

      <FormField label="Date format" hint={statusHint(dateStatus, DATE_FORMAT_HINT)}>
        <Select value={currentDateFormat} onValueChange={handleDateFormatChange} options={DATE_FORMAT_OPTIONS} />
      </FormField>

      <FormField label="Time format" hint={statusHint(timeStatus, TIME_FORMAT_HINT)}>
        <Select value={currentTimeFormat} onValueChange={handleTimeFormatChange} options={TIME_FORMAT_OPTIONS} />
      </FormField>
    </div>
  );
}
