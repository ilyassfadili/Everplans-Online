import { ArrowRight } from "lucide-react";

import { AREA_COLOR_CHIP_CLASS, AREA_ICONS } from "@/app/(app)/app/life-planner/areas/_components/area-visuals";
import { Card, Heading, Icon, Link, Text } from "@/components/ui";
import type { LifeArea } from "@/types/life-planner";

interface LifeAreasPreviewProps {
  areas: LifeArea[];
}

/**
 * The dashboard's own compact, scannable preview of a user's Life Areas
 * (Phase 1 §5) - real content, not another "coming soon" tile like
 * `FutureModulesSection`'s. Sits above those placeholders, alongside Life
 * Overview, so Life Areas reads as the second real system in this
 * workspace rather than a third concept competing with Life Profile's own
 * "important areas" free-text field (§6's "no duplicate 'areas' concept" -
 * this preview is the one place areas are actually listed as data; Life
 * Profile's field stays exactly what it always was, a paragraph of
 * context).
 *
 * A plain chip row rather than the full `AreaCard` grid the dedicated page
 * renders - this is a glanceable summary, not a second place to edit
 * areas.
 */
export function LifeAreasPreview({ areas }: LifeAreasPreviewProps) {
  return (
    <Card variant="standard" padding="md">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4" className="text-body-lg">
          Life Areas
        </Heading>
        <Link href="/app/life-planner/areas" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {areas.map((area) => {
          const AreaIcon = AREA_ICONS[area.iconKey];
          return (
            <span
              key={area.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm font-medium ${AREA_COLOR_CHIP_CLASS[area.colorKey]}`}
            >
              <Icon icon={AreaIcon} size="sm" />
              {area.name}
            </span>
          );
        })}
      </div>

      {areas.length === 0 && (
        <Text size="body-sm" tone="muted" className="mt-3">
          No areas yet.
        </Text>
      )}
    </Card>
  );
}
