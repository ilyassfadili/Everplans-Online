import { Spinner } from "@/components/ui";

/**
 * Suspense fallback for the `(app)` segment - shown while a protected page
 * streams in, never before authentication itself resolves (that's
 * `requireUser()` in the layout, which runs before this segment even has
 * something to suspend on). Deliberately just a centered spinner, matching
 * the shell's own restraint: no skeleton cards standing in for content
 * that doesn't exist yet.
 */
export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner size="lg" label="Loading" />
    </div>
  );
}
