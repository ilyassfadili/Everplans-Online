import { Card, Heading, Text } from "@/components/ui";

import type { TaskWithStatus } from "./task-list";

interface MaintenanceStatsProps {
  items: TaskWithStatus[];
}

interface Stat {
  label: string;
  value: number;
}

/**
 * The Maintenance Dashboard's own overview indicators (Phase 3: "tasks due
 * soon, overdue tasks, completed tasks, active recurring tasks"). Every
 * number here is derived from the same `items` list the page already
 * fetched - no separate query, so these counts can never drift from the
 * list underneath them.
 */
export function MaintenanceStats({ items }: MaintenanceStatsProps) {
  const stats: Stat[] = [
    { label: "Due soon", value: items.filter((item) => item.status === "due").length },
    { label: "Overdue", value: items.filter((item) => item.status === "overdue").length },
    { label: "Completed", value: items.filter((item) => item.status === "completed").length },
    { label: "Active recurring", value: items.filter((item) => item.task.recurrenceFrequency && item.task.recurrenceActive).length },
  ];

  return (
    <Card variant="standard" padding="lg">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <Text size="body-sm" tone="muted">
              {stat.label}
            </Text>
            <Heading as="h2" size="h3">
              {stat.value}
            </Heading>
          </div>
        ))}
      </div>
    </Card>
  );
}
