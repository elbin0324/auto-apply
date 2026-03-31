import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubscription, usePortalSession } from "@/hooks/use-billing";
import { useNavigate } from "@tanstack/react-router";

export function SubscriptionCard() {
  const { data: sub, isLoading } = useSubscription();
  const portalSession = usePortalSession();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Subscription" />
        <div className="p-5">
          <div className="h-20 animate-pulse rounded bg-bg-inset" />
        </div>
      </Card>
    );
  }

  const hasPlan = !!sub?.plan && sub.status === "active";
  const pct = hasPlan && sub.quota > 0 ? Math.round((sub.applications_used / sub.quota) * 100) : 0;

  return (
    <Card>
      <CardHeader title="Subscription" />
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-400">
              Current Plan
            </p>
            <p className="mt-1 font-mono text-[11px] font-semibold text-pri">
              {hasPlan ? sub.plan!.toUpperCase() : "NO PLAN"}
            </p>
          </div>
          {hasPlan ? (
            <Button variant="outline" onClick={() => navigate({ to: "/billing" })}>
              Upgrade
            </Button>
          ) : (
            <Button variant="primary" onClick={() => navigate({ to: "/billing" })}>
              Subscribe
            </Button>
          )}
        </div>

        {hasPlan && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-400">
                  Usage
                </span>
                <span className="font-mono text-[10px] text-t-400">
                  {sub.applications_used}/{sub.quota} applications this month
                </span>
              </div>
              <Progress pct={pct} />
            </div>

            <Button
              variant="ghost"
              onClick={() => portalSession.mutate()}
              loading={portalSession.isPending}
              className="w-full"
            >
              Manage Payment Method
            </Button>
          </>
        )}

        {sub?.is_whitelisted && (
          <p className="font-mono text-[10px] text-pri-dim">
            Whitelisted account — billing bypassed
          </p>
        )}
      </div>
    </Card>
  );
}
