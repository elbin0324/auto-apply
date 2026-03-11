import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function SubscriptionCard() {
  const usedApps = 68;
  const maxApps = 100;
  const pct = Math.round((usedApps / maxApps) * 100);

  return (
    <Card>
      <CardHeader title="Subscription" />
      <div className="space-y-5 p-5">
        {/* Plan name + Upgrade button in same row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-400">
              Current Plan
            </p>
            <p className="mt-1 font-mono text-[11px] font-semibold text-pri">BUSINESS CLASS</p>
          </div>
          <Button variant="outline">Upgrade</Button>
        </div>

        {/* Price */}
        <div>
          <p className="font-mono text-[22px] font-bold tracking-[-0.02em] text-t-900">$49/mo</p>
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-400">
              Usage
            </span>
            <span className="font-mono text-[10px] text-t-400">
              {usedApps}/{maxApps} applications this month
            </span>
          </div>
          <Progress pct={pct} />
        </div>
      </div>
    </Card>
  );
}
