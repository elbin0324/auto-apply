import { useState } from "react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  name: string | null | undefined;
  logoUrl: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

export function CompanyLogo({
  name,
  logoUrl,
  size = "md",
  className,
}: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const initial = (name ?? "?").charAt(0).toUpperCase();

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name ?? "Company"}
        className={cn(
          "shrink-0 rounded-lg object-contain bg-white/5",
          sizeClasses[size],
          className,
        )}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-border-subtle font-semibold text-text-secondary",
        sizeClasses[size],
        className,
      )}
    >
      {initial}
    </div>
  );
}
