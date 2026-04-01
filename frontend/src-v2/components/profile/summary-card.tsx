import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpdateProfile } from "@/hooks/use-profile";

interface SummaryCardProps {
  summary: string | null | undefined;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(summary ?? "");
  const updateProfile = useUpdateProfile();

  const handleEdit = useCallback(() => {
    setValue(summary ?? "");
    setEditing(true);
  }, [summary]);

  const handleCancel = useCallback(() => {
    setValue(summary ?? "");
    setEditing(false);
  }, [summary]);

  const handleSave = useCallback(() => {
    updateProfile.mutate(
      { summary: value || null },
      { onSuccess: () => setEditing(false) },
    );
  }, [value, updateProfile]);

  return (
    <Card>
      <CardHeader
        title="Summary"
        right={
          !editing ? (
            <Button variant="outline" onClick={handleEdit}>
              Edit
            </Button>
          ) : undefined
        }
      />
      <div className="p-[18px]">
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              placeholder="A brief professional summary..."
              className="w-full rounded-md border border-border-main bg-bg-inset px-3 py-2 font-sans text-[13px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
            />
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={handleSave} loading={updateProfile.isPending} disabled={updateProfile.isPending}>
                Save
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="font-sans text-[13px] text-t-700">
            {summary || <span className="text-t-400">No summary yet. Click "Edit" to add one.</span>}
          </p>
        )}
      </div>
    </Card>
  );
}
