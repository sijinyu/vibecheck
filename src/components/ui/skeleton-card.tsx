"use client";

/**
 * Skeleton loading cards for various list/grid contexts.
 * Uses Tailwind `animate-pulse` for a lightweight shimmer effect.
 */

/** Generic list-item skeleton (dashboard history, saved list) */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-4">
      {/* Avatar */}
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted/50" />
      {/* Text lines */}
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted/50" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted/40" />
      </div>
      {/* Score placeholder */}
      <div className="h-8 w-12 animate-pulse rounded-md bg-muted/50" />
    </div>
  );
}

/** Brand card skeleton */
export function SkeletonBrandCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted/50" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted/40" />
        </div>
      </div>
      <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
      <div className="h-3 w-3/4 animate-pulse rounded bg-muted/30" />
    </div>
  );
}

/** Influencer grid card skeleton (discovery grid) */
export function SkeletonGridCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
      {/* Image strip */}
      <div className="h-24 w-full animate-pulse bg-muted/30" />
      {/* Body */}
      <div className="space-y-3 p-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted/50" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted/40" />
          </div>
        </div>
        {/* Score */}
        <div className="h-8 w-16 animate-pulse rounded bg-muted/50" />
        {/* Tags */}
        <div className="flex gap-1.5">
          <div className="h-5 w-14 animate-pulse rounded-md bg-muted/30" />
          <div className="h-5 w-10 animate-pulse rounded-md bg-muted/30" />
        </div>
      </div>
    </div>
  );
}

/** Render N skeleton items */
export function SkeletonList({ count = 4, variant = "list" }: { count?: number; variant?: "list" | "brand" | "grid" }) {
  const Component = variant === "brand" ? SkeletonBrandCard : variant === "grid" ? SkeletonGridCard : SkeletonListItem;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
