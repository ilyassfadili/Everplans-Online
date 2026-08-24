import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { PlannerRuntime } from "@/components/planner/planner-runtime";
import { Button, Container, EmptyState } from "@/components/ui";
import { getOrStartPlannerInstance, getPlannerAnswers } from "@/lib/planner-persistence";
import { getPlannerDefinitionBySlug, getPlannerStructure, resolvePlannerAccess } from "@/lib/planners";

interface PlannerDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Planner",
  robots: { index: false, follow: false },
};

/**
 * Where `resolvePlannerAccess`'s discriminated union (`@/types/planner-access`)
 * becomes actual route behavior - this route's entire job is translating
 * each variant into the right response, nothing more:
 *
 * - `unauthenticated` → redirect to sign-in (belt-and-suspenders: `(app)`'s
 *   layout and `proxy.ts` already gate this route before it renders, but
 *   `resolvePlannerAccess` doesn't assume it was called from a protected
 *   context, so this route doesn't either).
 * - `not-found` / `unavailable` → the same `notFound()` either way. A
 *   requester who isn't supposed to see an unpublished/nonexistent
 *   planner gets an identical 404 for both - never a response that
 *   reveals "it exists, you just can't have it" (see the type's own
 *   comment on why those two collapse together).
 * - `unauthorized` → a real, visible "you don't have this" state, not a
 *   404 - the planner is confirmed to exist and be published, so hiding
 *   that fact would just be confusing once purchases exist and a user
 *   legitimately needs to know a planner exists to go acquire it.
 * - `granted` → the real Planner Runtime Guard (Entitlements Phase 1
 *   §11): authentication, discovery, and entitlement are all already
 *   confirmed by the time this branch runs (`resolvePlannerAccess`
 *   performed all three, in order, before returning `granted` at all) -
 *   only *then* does this branch load the user's private instance
 *   (`getOrStartPlannerInstance`) and answers (`getPlannerAnswers`).
 *   Private planner state is never fetched before authorization; the
 *   sequence in this function's own code is the enforcement, not just a
 *   description of it. Still unreachable in practice today -
 *   `getPlannerStructure` has no real content source yet (see its own
 *   comment) - so this renders the same honest "isn't available yet"
 *   message `PlannerRuntime` itself falls back to for a missing/malformed
 *   structure, rather than a runtime with nothing to show.
 */
export default async function PlannerDetailPage({ params }: PlannerDetailPageProps) {
  const { slug } = await params;
  const access = await resolvePlannerAccess(slug);

  switch (access.status) {
    case "unauthenticated":
      redirect(`/sign-in?next=${encodeURIComponent(`/app/planners/${slug}`)}`);
      break;

    case "not-found":
    case "unavailable":
      notFound();
      break;

    case "unauthorized":
      // py-10 sm:py-14 md:py-16 matches every other empty/placeholder
      // state across the Dashboard (established in PROMPT 8, applied
      // consistently since) - this route predates that pass and had
      // drifted to a single fixed py-16; PROMPT 4's own "fix
      // inconsistencies at their source" is what surfaced it.
      return (
        <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
          <EmptyState
            titleAs="h2"
            title="You don't have access to this planner"
            description="This planner exists, but your account isn't set up to open it yet."
            className="py-10 sm:py-14 md:py-16"
            action={
              <Button href="/app/planners" variant="outline">
                Back to Planners
              </Button>
            }
          />
        </Container>
      );

    case "granted": {
      const structure = await getPlannerStructure(access.plannerId, access.schemaVersion);

      if (!structure) {
        // No real planner content source exists yet - the honest state,
        // not a crash. A private instance is never started for content
        // that doesn't exist to fill it with.
        return (
          <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
            <EmptyState
              titleAs="h2"
              title="This planner isn't ready yet"
              description="You have access, but its content hasn't been published yet - check back soon."
              className="py-10 sm:py-14 md:py-16"
              action={
                <Button href="/app/planners" variant="outline">
                  Back to Planners
                </Button>
              }
            />
          </Container>
        );
      }

      const definition = await getPlannerDefinitionBySlug(slug);
      const instance = await getOrStartPlannerInstance(access.plannerId);

      if (!instance) {
        // The insert-time entitlement re-check (the migration's own
        // insert policy) failed, or a real database error occurred -
        // either way, fails to the same "you don't have this" state
        // `unauthorized` already renders, never a broken/blank page.
        return (
          <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
            <EmptyState
              titleAs="h2"
              title="You don't have access to this planner"
              description="This planner exists, but your account isn't set up to open it yet."
              className="py-10 sm:py-14 md:py-16"
              action={
                <Button href="/app/planners" variant="outline">
                  Back to Planners
                </Button>
              }
            />
          </Container>
        );
      }

      const answers = await getPlannerAnswers(instance.id);

      return (
        <Container className="flex flex-1 flex-col py-10 md:py-14">
          <PlannerRuntime
            structure={structure}
            instanceId={instance.id}
            plannerId={access.plannerId}
            plannerName={definition?.title ?? "this planner"}
            initialValues={answers}
            initialPageId={instance.currentPageId}
          />
        </Container>
      );
    }
  }
}
