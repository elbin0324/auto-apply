import { Card } from "./card";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <Card className="relative p-5">
      {icon && (
        <div className="absolute right-4 top-4 text-pri">{icon}</div>
      )}
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-400">
        {label}
      </p>
      <p className="mt-2 font-mono text-[26px] font-bold tracking-[-0.02em] text-t-900">
        {value}
      </p>
      {change && (
        <p className="mt-1 font-mono text-[10px] text-ok-dim">{change}</p>
      )}
    </Card>
  );
}
