import { cn } from "@/theme/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl border border-border-main bg-bg-card shadow-card", className)}
      style={style}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  count?: string | number;
  right?: React.ReactNode;
}

export function CardHeader({ title, count, right }: CardHeaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-t-xl border-b border-border-subtle bg-bg-inset px-[18px] py-3">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-t-500">
        {title}
      </span>
      {count != null && (
        <span className="rounded border border-border-main bg-bg-card px-2 py-0.5 font-mono text-[10px] text-t-400">
          {count}
        </span>
      )}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}
