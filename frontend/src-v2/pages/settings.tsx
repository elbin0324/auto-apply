import { SubscriptionCard } from "@/components/settings/subscription-card";
import { AccountCard } from "@/components/settings/account-card";

export default function SettingsPage() {
  return (
    <div className="grid gap-3.5 md:grid-cols-2">
      <SubscriptionCard />
      <AccountCard />
    </div>
  );
}
