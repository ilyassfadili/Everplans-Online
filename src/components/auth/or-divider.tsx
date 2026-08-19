import { Text } from "@/components/ui";

/**
 * The "or" separator between OAuthButtons and the email/password form -
 * identical markup on Sign In and Sign Up, so it's one component instead of
 * two copies that can drift apart. Purely decorative (`aria-hidden`) - the
 * fields either side of it are already labeled well enough on their own
 * that a screen reader doesn't need the divider itself announced.
 */
export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-line-subtle" />
      <Text size="body-sm" tone="faint">
        or
      </Text>
      <div className="h-px flex-1 bg-line-subtle" />
    </div>
  );
}
