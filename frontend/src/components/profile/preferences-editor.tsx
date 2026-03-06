import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/ui/section-card";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-profile";
import type { ApplicationPreferencesUpdate } from "@/types/profile";

interface PreferencesEditorProps {
  onSaveSuccess?: () => void;
  footer?: (props: { save: () => void; isPending: boolean }) => React.ReactNode;
}

export function PreferencesEditor({
  onSaveSuccess,
  footer,
}: PreferencesEditorProps) {
  const { data: prefs, isLoading } = usePreferences();
  const mutation = useUpdatePreferences();

  const [form, setForm] = useState<ApplicationPreferencesUpdate>({});
  const [customEntries, setCustomEntries] = useState<
    { key: string; value: string }[]
  >([]);

  useEffect(() => {
    if (prefs) {
      setForm({
        authorized_us: prefs.authorized_us,
        authorized_ca: prefs.authorized_ca,
        requires_sponsorship: prefs.requires_sponsorship,
        willing_to_relocate: prefs.willing_to_relocate,
        notice_period_days: prefs.notice_period_days,
        desired_salary_min: prefs.desired_salary_min,
        desired_salary_max: prefs.desired_salary_max,
        salary_currency: prefs.salary_currency,
        over_18: prefs.over_18,
        has_drivers_license: prefs.has_drivers_license,
        felony_conviction: prefs.felony_conviction,
        how_did_you_hear: prefs.how_did_you_hear,
      });
      setCustomEntries(
        Object.entries(prefs.custom_answers ?? {}).map(([key, value]) => ({
          key,
          value,
        })),
      );
    }
  }, [prefs]);

  const setBool = (
    field: keyof ApplicationPreferencesUpdate,
    val: boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const setField = (
    field: keyof ApplicationPreferencesUpdate,
    val: string | number | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const save = () => {
    const custom_answers: Record<string, string> = {};
    for (const entry of customEntries) {
      if (entry.key.trim()) {
        custom_answers[entry.key.trim()] = entry.value;
      }
    }
    mutation.mutate(
      { ...form, custom_answers },
      { onSuccess: () => onSaveSuccess?.() },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        Pre-fill answers to common application screening questions. These are
        used when the auto-apply agent fills out forms on your behalf.
      </p>

      {/* Work Authorization */}
      <SectionCard
        title="Work Authorization"
        description="Used when applications ask about your right to work in a country."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Are you authorized to work in the United States?</Label>
            <Switch
              checked={form.authorized_us ?? false}
              onCheckedChange={(v) => setBool("authorized_us", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Are you authorized to work in Canada?</Label>
            <Switch
              checked={form.authorized_ca ?? false}
              onCheckedChange={(v) => setBool("authorized_ca", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Do you require visa sponsorship?</Label>
            <Switch
              checked={form.requires_sponsorship ?? false}
              onCheckedChange={(v) => setBool("requires_sponsorship", v)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Availability & Relocation */}
      <SectionCard
        title="Availability & Relocation"
        description="Used when applications ask about your start date and willingness to relocate."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Are you willing to relocate?</Label>
            <Switch
              checked={form.willing_to_relocate ?? false}
              onCheckedChange={(v) => setBool("willing_to_relocate", v)}
            />
          </div>
          <div className="space-y-1 max-w-xs">
            <Label>How many days notice do you need?</Label>
            <Input
              type="number"
              value={form.notice_period_days ?? ""}
              onChange={(e) =>
                setField(
                  "notice_period_days",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              placeholder="14"
            />
          </div>
        </div>
      </SectionCard>

      {/* Compensation */}
      <SectionCard
        title="Compensation Expectations"
        description="Used when salary questions appear on applications."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Minimum Salary</Label>
            <Input
              type="number"
              value={form.desired_salary_min ?? ""}
              onChange={(e) =>
                setField(
                  "desired_salary_min",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              placeholder="80000"
            />
          </div>
          <div className="space-y-1">
            <Label>Maximum Salary</Label>
            <Input
              type="number"
              value={form.desired_salary_max ?? ""}
              onChange={(e) =>
                setField(
                  "desired_salary_max",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              placeholder="150000"
            />
          </div>
          <div className="space-y-1">
            <Label>Currency</Label>
            <Input
              value={form.salary_currency ?? "USD"}
              onChange={(e) => setField("salary_currency", e.target.value)}
              placeholder="USD"
            />
          </div>
        </div>
      </SectionCard>

      {/* Legal & Eligibility */}
      <SectionCard
        title="Legal & Eligibility"
        description="Used for basic eligibility screening questions."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Are you over 18 years old?</Label>
            <Switch
              checked={form.over_18 ?? false}
              onCheckedChange={(v) => setBool("over_18", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Do you have a valid driver's license?</Label>
            <Switch
              checked={form.has_drivers_license ?? false}
              onCheckedChange={(v) => setBool("has_drivers_license", v)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Custom Q&A */}
      <SectionCard
        title="Custom Q&A"
        description="Pre-set answers to recurring questions like 'How did you hear about us?' or 'Why do you want to work here?'"
      >
        <div className="space-y-3">
          {customEntries.map((entry, index) => (
            <div key={index} className="flex gap-2">
              <Input
                className="flex-1"
                value={entry.key}
                onChange={(e) =>
                  setCustomEntries((prev) =>
                    prev.map((item, i) =>
                      i === index
                        ? { ...item, key: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Question"
              />
              <Input
                className="flex-1"
                value={entry.value}
                onChange={(e) =>
                  setCustomEntries((prev) =>
                    prev.map((item, i) =>
                      i === index
                        ? { ...item, value: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Answer"
              />
              <button
                type="button"
                onClick={() =>
                  setCustomEntries((prev) =>
                    prev.filter((_, i) => i !== index),
                  )
                }
                className="rounded p-2 text-text-muted hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCustomEntries((prev) => [...prev, { key: "", value: "" }])
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Answer
          </Button>
        </div>
      </SectionCard>

      {/* Save / Footer */}
      {footer ? (
        footer({ save, isPending: mutation.isPending })
      ) : (
        <div className="flex items-center gap-3">
          <Button type="button" onClick={save} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save Preferences
          </Button>
          {mutation.isSuccess && (
            <p className="text-sm text-accent-green">Preferences saved.</p>
          )}
        </div>
      )}
    </div>
  );
}
