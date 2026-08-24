import { cn } from "@/lib/cn";

interface AccountAvatarProps {
  avatarUrl: string | null;
  initials: string;
  className?: string;
}

/**
 * "This person, as a circle" - one rule shared by every place that shows
 * it (`UserProfileMenu`, `AccountMenu`, `AvatarUpload`'s own preview),
 * not three components each independently reimplementing the same
 * image-or-initials fallback. Real image when `avatarUrl` is set
 * (`updateAvatar`, `@/lib/profile`), the same initials circle every
 * caller already used before avatars existed otherwise.
 */
export function AccountAvatar({ avatarUrl, initials, className }: AccountAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-subtle font-semibold text-brand",
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a user-uploaded, arbitrary-origin URL isn't a candidate for next/image's static optimization pipeline.
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
