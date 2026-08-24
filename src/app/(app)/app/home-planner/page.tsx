import { Pencil } from "lucide-react";
import type { Metadata } from "next";

import { Badge, Button, Container, Eyebrow, Heading, Icon } from "@/components/ui";
import { getHomeTypeLabel } from "@/components/home-planner/home-type-options";
import { getOwnershipStatusLabel } from "@/components/home-planner/ownership-status-options";
import { getContactsForHome } from "@/lib/home-planner/contacts";
import { getHouseholdMembersForHome } from "@/lib/home-planner/household-members";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getBillsForHome } from "@/lib/home-planner/bills";
import { getImportantItemsForHome } from "@/lib/home-planner/inventory";
import { getMaintenanceTasksForHome } from "@/lib/home-planner/maintenance";
import { calculateHomeSetupProgress } from "@/lib/home-planner/progress";
import { getTasksForProject } from "@/lib/home-planner/project-tasks";
import { getProjectsForHome } from "@/lib/home-planner/projects";
import type { ProjectTask } from "@/types/home-planner";

import { BillsSummaryCard } from "./_components/bills-summary-card";
import { ContactsSummaryCard } from "./_components/contacts-summary-card";
import { HomeDetailsCard } from "./_components/home-details-card";
import { HouseholdSummaryCard } from "./_components/household-summary-card";
import { ImportantItemsSummaryCard } from "./_components/important-items-summary-card";
import { MaintenanceSummaryCard } from "./_components/maintenance-summary-card";
import { ProjectsSummaryCard } from "./_components/projects-summary-card";
import { QuickActionsCard } from "./_components/quick-actions-card";
import { RecentActivityCard } from "./_components/recent-activity-card";
import { SetupProgressCard } from "./_components/setup-progress-card";

export const metadata: Metadata = {
  title: "Home Planner",
  robots: { index: false, follow: false },
};

/**
 * The Home Dashboard (Everplans Home Planner Prompt 1 Phase 3, gated by
 * real commerce as of Prompt 6) - "Your home, organized and under
 * control." `requireHomeForCurrentUser()` (`@/lib/home-planner/homes`) is
 * the real gate: no entitlement sends the visitor to checkout, an
 * entitlement with no home yet sends them to home setup, so this page
 * only ever renders for a home that genuinely exists - the same shape
 * `TravelPlannerPage` already establishes.
 *
 * Every section here reads real, persisted data - profile, household,
 * contacts, important items, and (Prompt 3 Phase 3) maintenance. "Recent
 * Activity" is still an honest foundation (Phase 3, Prompt 1: "do not
 * create fake functionality") - nothing writes to an activity log yet.
 * `MaintenanceSummaryCard` replaces Prompt 1's placeholder `UpcomingCard`
 * now that maintenance tasks with real due dates exist to show.
 */
export default async function HomePlannerPage() {
  const home = await requireHomeForCurrentUser();

  const [members, contacts, importantItems, maintenanceTasks, bills, projects] = await Promise.all([
    getHouseholdMembersForHome(home.id),
    getContactsForHome(home.id),
    getImportantItemsForHome(home.id),
    getMaintenanceTasksForHome(home.id),
    getBillsForHome(home.id),
    getProjectsForHome(home.id),
  ]);

  // One extra round trip per project for its tasks (progress source) -
  // fine at the scale a home's own project list actually reaches; the
  // dashboard only ever shows a handful of active projects anyway.
  const projectTaskLists = await Promise.all(projects.map((project) => getTasksForProject(project.id)));
  const tasksByProjectId: Record<string, ProjectTask[]> = {};
  projects.forEach((project, index) => {
    tasksByProjectId[project.id] = projectTaskLists[index] ?? [];
  });

  const progress = calculateHomeSetupProgress(home, members.length, contacts.length);

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:gap-8 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Eyebrow tone="brand">Home Planner</Eyebrow>
          <Heading as="h1" size="h2" className="mt-2">
            {home.name}
          </Heading>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{getHomeTypeLabel(home.homeType)}</Badge>
            <Badge variant="neutral">{getOwnershipStatusLabel(home.ownershipStatus)}</Badge>
          </div>
        </div>
        <Button
          href="/app/home-planner/edit"
          variant="outline"
          className="shrink-0"
          leadingIcon={<Icon icon={Pencil} size="sm" />}
        >
          Edit home
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SetupProgressCard
          progress={progress}
          hasAddress={Boolean(home.addressLine1)}
          hasHousehold={members.length > 0}
          hasContacts={contacts.length > 0}
        />
        <HomeDetailsCard home={home} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <HouseholdSummaryCard members={members} />
        <ContactsSummaryCard contacts={contacts} />
        <ImportantItemsSummaryCard items={importantItems} />
        <QuickActionsCard />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MaintenanceSummaryCard tasks={maintenanceTasks} />
        <BillsSummaryCard bills={bills} />
        <ProjectsSummaryCard projects={projects} tasksByProjectId={tasksByProjectId} />
        <RecentActivityCard />
      </div>
    </Container>
  );
}
