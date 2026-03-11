import { useState } from "react";
import { cn } from "@/theme/utils";

interface CompanyLogoProps {
  company: string;
  logoUrl?: string | null;
  size?: "sm" | "md";
}

function companyCode(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-[44px] w-[44px]",
} as const;

export function CompanyLogo({ company, logoUrl, size = "md" }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = logoUrl && !imgError;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg overflow-hidden",
        showImage ? "bg-white" : "bg-bg-deep",
        sizeClasses[size],
      )}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt={company}
          className="h-full w-full object-contain p-1.5"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-mono text-[10px] font-bold text-pri">
          {companyCode(company)}
        </span>
      )}
    </div>
  );
}
