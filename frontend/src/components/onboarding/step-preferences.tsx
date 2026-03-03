import { useState } from "react";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdatePreferences } from "@/hooks/use-profile";
import type { ProfileResponse } from "@/types/profile";

interface StepPreferencesProps {
  profile?: ProfileResponse;
  onNext: () => void;
  onBack: () => void;
}

export function StepPreferences({
  profile,
  onNext,
  onBack,
}: StepPreferencesProps) {
  const prefs = profile?.application_preferences;
  const mutation = useUpdatePreferences();

  const [authorizedUs, setAuthorizedUs] = useState(
    prefs?.authorized_us ?? false,
  );
  const [requiresSponsorship, setRequiresSponsorship] = useState(
    prefs?.requires_sponsorship ?? false,
  );
  const [willingToRelocate, setWillingToRelocate] = useState(
    prefs?.willing_to_relocate ?? false,
  );
  const [over18, setOver18] = useState(prefs?.over_18 ?? true);

  const handleContinue = () => {
    mutation.mutate(
      {
        authorized_us: authorizedUs,
        requires_sponsorship: requiresSponsorship,
        willing_to_relocate: willingToRelocate,
        over_18: over18,
      },
      {
        onSuccess: () => onNext(),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          Application preferences
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          These are common screening questions. We&apos;ll use your answers to
          fill them in automatically.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border-subtle bg-bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <Label
            htmlFor="authorized_us"
            className="cursor-pointer text-sm text-text-primary"
          >
            Authorized to work in the US
          </Label>
          <Switch
            id="authorized_us"
            checked={authorizedUs}
            onCheckedChange={setAuthorizedUs}
          />
        </div>

        <div className="h-px bg-border-subtle" />

        <div className="flex items-center justify-between gap-4">
          <Label
            htmlFor="requires_sponsorship"
            className="cursor-pointer text-sm text-text-primary"
          >
            Requires visa sponsorship
          </Label>
          <Switch
            id="requires_sponsorship"
            checked={requiresSponsorship}
            onCheckedChange={setRequiresSponsorship}
          />
        </div>

        <div className="h-px bg-border-subtle" />

        <div className="flex items-center justify-between gap-4">
          <Label
            htmlFor="willing_to_relocate"
            className="cursor-pointer text-sm text-text-primary"
          >
            Willing to relocate
          </Label>
          <Switch
            id="willing_to_relocate"
            checked={willingToRelocate}
            onCheckedChange={setWillingToRelocate}
          />
        </div>

        <div className="h-px bg-border-subtle" />

        <div className="flex items-center justify-between gap-4">
          <Label
            htmlFor="over_18"
            className="cursor-pointer text-sm text-text-primary"
          >
            Over 18 years of age
          </Label>
          <Switch id="over_18" checked={over18} onCheckedChange={setOver18} />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-400">
          Failed to save. Please try again.
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={mutation.isPending}
          className="bg-accent-purple hover:bg-accent-purple/90"
        >
          {mutation.isPending && (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          )}
          Continue
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
