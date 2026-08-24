"use client";

import { useCallback, useRef, useState } from "react";

// Deliberately varied and short - Phase 2 §4's own warning ("without
// becoming repetitive or cheesy") and §7's word list (never "love",
// "forever", "soulmate", "dream wedding") both apply here. Real progress
// language, not a single reused line.
const AFFIRMATIONS = [
  "Another step closer to your day.",
  "That's one more decision made together.",
  "Nicely done - look how far you've come.",
  "Progress, together.",
  "One more thing off your mind.",
];

/**
 * A brief, ephemeral affirmation for a genuinely meaningful moment - marking
 * a milestone complete, not every minor click. Purely presentational state,
 * nothing persisted; `celebrate()` picks one line and clears it again after
 * a few seconds. Kept local to whichever panel calls it rather than a
 * sitewide toast system, since nothing like that exists in this app yet and
 * this doesn't need one.
 */
export function useCelebration() {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback(() => {
    const phrase = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]!;
    setMessage(phrase);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(null), 2600);
  }, []);

  return { message, celebrate };
}
