import { cn } from "@/theme/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded bg-bg-muted",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, var(--color-bg-inset) 50%, transparent 100%)",
        backgroundSize: "200px 100%",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-main bg-bg-card p-5 shadow-card">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SkeletonJRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-5 w-14" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-main bg-bg-card shadow-card">
      <div className="border-b border-border-subtle bg-bg-inset px-[18px] py-3">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 border-b border-border-subtle px-4 py-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="ml-auto h-3 w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
}
