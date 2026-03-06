import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/profile-form";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { ProfileResponse } from "@/types/profile";

interface StepProfileProps {
  profile?: ProfileResponse;
  onNext: () => void;
  onBack: () => void;
}

export function StepProfile({ profile, onNext, onBack }: StepProfileProps) {
  const { isPending } = useUpdateProfile();

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          Your information
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {profile.raw_resume_url
            ? "We pre-filled this from your resume. Review and correct anything."
            : "Tell us about yourself so we can fill out applications for you."}
        </p>
      </div>

      <ProfileForm
        profile={profile}
        mode="onboarding"
        onSubmitSuccess={onNext}
        footer={
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-accent-purple hover:bg-accent-purple/90"
            >
              {isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Continue
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        }
      />
    </div>
  );
}
