import { ImageIcon } from "lucide-react";
import Image from "next/image";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProductImagePlaceholder } from "@/types/product-landing";

interface ProductImageSlotProps {
  placeholder: ProductImagePlaceholder;
  /** Once a real screenshot exists, pass its `src`/`alt` - the slot swaps from placeholder to real image with no other changes to the section around it. */
  src?: string;
  alt?: string;
  priority?: boolean;
  className?: string;
}

/**
 * One product screenshot slot - correct aspect ratio, radius, and object-fit
 * reserved now, filled with a real asset later. Deliberately not a fake UI
 * mockup or a stock photo: an honest "image not yet supplied" state, styled
 * to match the icon-in-muted-box placeholder pattern already used for
 * unphotographed products elsewhere (`PlannerCard`, `StoreProductCard`) -
 * consistent house style, not unfinished-looking dev scaffolding.
 */
export function ProductImageSlot({ placeholder, src, alt, priority, className }: ProductImageSlotProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-line-subtle bg-surface-muted",
        className,
      )}
      style={{ aspectRatio: placeholder.aspectRatio }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? placeholder.label}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" aria-hidden="true">
          <div className="flex size-12 items-center justify-center rounded-full bg-surface text-ink-faint shadow-sm">
            <ImageIcon className="size-5" strokeWidth={1.5} />
          </div>
          <Text size="caption" tone="faint">
            {placeholder.label}
          </Text>
        </div>
      )}
    </div>
  );
}
