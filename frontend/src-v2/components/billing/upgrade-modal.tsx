import { useNavigate } from "@tanstack/react-router";
import { useCheckout } from "@/hooks/use-billing";
import { PLAN_QUOTAS } from "@/lib/billing-constants";
import { Button } from "@/components/ui/button";
import type { BillingError } from "@/types/billing";

interface UpgradeModalProps {
  error: BillingError;
  onClose: () => void;
}

export function UpgradeModal({ error, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();
  const checkout = useCheckout();

  const isNoSub = error.code === "no_subscription";
  const nextPlan = error.next_plan;
  const nextQuota = nextPlan ? PLAN_QUOTAS[nextPlan] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="mx-4 w-full max-w-[400px] rounded-xl p-6"
        style={{ background: "#111c2a", border: "1px solid #1e2e3e" }}
      >
        <div className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-pri-dim">
          {isNoSub ? "Subscription Required" : "Quota Reached"}
        </div>

        <p className="mb-6 font-mono text-[12px] leading-relaxed text-t-700">
          {isNoSub
            ? "You need an active subscription to apply to jobs. Choose a plan to get started."
            : `You've used all ${error.quota} applications this month on your ${error.plan} plan.`}
        </p>

        {!isNoSub && nextPlan && nextQuota && (
          <p className="mb-6 font-mono text-[11px] text-t-400">
            Upgrade to {nextPlan} for {nextQuota} applications/month.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>

          {isNoSub ? (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate({ to: "/billing" });
              }}
              className="flex-1"
            >
              View Plans
            </Button>
          ) : nextPlan ? (
            <Button
              variant="primary"
              onClick={() => checkout.mutate(nextPlan)}
              loading={checkout.isPending}
              className="flex-1"
            >
              Upgrade Now
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} className="flex-1">
              OK
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
