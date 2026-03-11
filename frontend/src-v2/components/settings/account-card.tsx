import { useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-3 last:border-b-0">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-400">
        {label}
      </span>
      <span className="font-mono text-[11px] text-t-700">{value}</span>
    </div>
  );
}

export function AccountCard() {
  const { user, reset } = useAuthStore();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    reset();
  }, [reset]);

  return (
    <Card>
      <CardHeader title="Account" />
      <div className="p-5">
        <div className="mb-5">
          <InfoRow label="Email" value={user?.email ?? "-"} />
          <InfoRow label="Role" value={user?.role ?? "user"} />
          <InfoRow label="Member Since" value="Mar 2026" />
        </div>

        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </Card>
  );
}
