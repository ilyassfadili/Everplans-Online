import { Download, ShieldCheck } from "lucide-react";

import { Badge, Icon, Link, Text } from "@/components/ui";

/**
 * Privacy & Data (Settings §10) - a factual statement of what this app
 * actually stores and how it's protected (no invented legal claims, no
 * promises this codebase can't back up), plus the two capabilities the
 * prompt asks for. Both remain honest about what's real today:
 *
 * - Export: no real export mechanism exists anywhere in this codebase,
 *   so this is the same "Coming soon" `Badge` treatment `/app/settings`
 *   already uses for Workspace/Billing, not an active button that would
 *   generate fake downloadable data.
 * - Account data management: no self-service deletion system exists
 *   either (Settings §7 explicitly rules out building one just for this
 *   page) - routes to the one real channel that already exists for this,
 *   the public Contact form, rather than a dead-end promise.
 */
export function PrivacyDataSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-faint">
          <Icon icon={ShieldCheck} size="sm" />
        </div>
        <Text size="body-sm" tone="muted">
          Everplans stores the account and profile information shown on this page, plus any planners you add to
          your workspace. Row Level Security enforces that only you can read or change your own data - the
          database itself refuses any request that isn&rsquo;t yours, not just the application code.
        </Text>
      </div>

      <div className="flex flex-col items-start gap-3 border-t border-line-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-faint">
            <Icon icon={Download} size="sm" />
          </div>
          <div>
            <Text as="p" weight="semibold">
              Export your data
            </Text>
            <Text size="body-sm" tone="muted" className="mt-0.5">
              A downloadable copy of your account data isn&rsquo;t available yet.
            </Text>
          </div>
        </div>
        <Badge variant="neutral">Coming soon</Badge>
      </div>

      <div className="border-t border-line-subtle pt-6">
        <Text as="p" weight="semibold">
          Account data management
        </Text>
        <Text size="body-sm" tone="muted" className="mt-0.5">
          To request a correction or deletion of your account data,{" "}
          <Link href="/contact" variant="inline">
            contact support
          </Link>
          .
        </Text>
      </div>
    </div>
  );
}
