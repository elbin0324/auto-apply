import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-accent relative overflow-hidden",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-linear-to-r after:from-transparent after:via-white/4 after:to-transparent",
        "after:animate-[shimmer_1.5s_infinite]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
