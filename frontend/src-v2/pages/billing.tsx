import { usePlans, useCheckout, useSubscription } from "@/hooks/use-billing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "@/icons";

export default function BillingPage() {
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: subscription } = useSubscription();
  const checkout = useCheckout();

  const plans = plansData?.plans ?? [];

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-pri border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-12">
      <div className="mb-10 text-center">
        <h1
          className="font-mono text-[26px] font-bold tracking-[-0.02em]"
          style={{ color: "var(--tw-90)" }}
        >
          Choose your plan
        </h1>
        <p className="mt-2 font-mono text-[12px] text-t-400">
          Start applying to jobs with AI-powered automation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan === plan.name;
          const isFeatured = plan.name === "pro";

          return (
            <Card key={plan.name}>
              <div
                className="relative flex h-full flex-col p-6"
                style={{
                  border: isFeatured ? "2px solid #2ec4b6" : undefined,
                  borderRadius: isFeatured ? "12px" : undefined,
                }}
              >
                {isFeatured && (
                  <div
                    className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded bg-pri px-3.5 py-0.5 font-mono text-[9px] font-bold tracking-[.12em]"
                    style={{ color: "#060d14" }}
                  >
                    RECOMMENDED
                  </div>
                )}

                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-pri-dim">
                  {plan.display_name}
                </div>

                <div
                  className="mb-1 font-mono text-[34px] font-bold"
                  style={{ color: "var(--tw-90)" }}
                >
                  ${plan.price_cents / 100}
                  <span className="text-[13px] font-normal text-t-400">/mo</span>
                </div>

                <div className="mb-6 flex-1">
                  {plan.features.map((feat, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-2 py-1.5"
                      style={{ borderBottom: "1px solid #1e2e3e" }}
                    >
                      <Check size={11} color="#1a9a8e" />
                      <span className="font-mono text-[11px] text-t-700">{feat}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={isCurrent ? "ghost" : isFeatured ? "primary" : "outline"}
                  onClick={() => !isCurrent && checkout.mutate(plan.name)}
                  disabled={isCurrent || checkout.isPending}
                  loading={checkout.isPending}
                  className="w-full"
                >
                  {isCurrent ? "Current Plan" : "Get Started"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
