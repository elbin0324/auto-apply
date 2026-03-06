import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeUpload } from "@/components/profile/resume-upload";
import { useUploadResume, useParseResume } from "@/hooks/use-resume";
import type { ProfileResponse } from "@/types/profile";

interface StepResumeProps {
  profile?: ProfileResponse;
  onNext: () => void;
}

export function StepResume({ profile, onNext }: StepResumeProps) {
  const uploadMutation = useUploadResume();
  const parseMutation = useParseResume();
  const isProcessing = uploadMutation.isPending || parseMutation.isPending;

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          Upload your resume
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Our AI will extract your information and auto-fill your profile.
        </p>
      </div>

      <ResumeUpload
        profile={profile}
        autoParseOnUpload
        compact
        showParseSuccessState
      />

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onNext}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Skip — I&apos;ll fill in manually
        </button>
        <Button
          onClick={onNext}
          disabled={isProcessing}
          className="bg-accent-purple hover:bg-accent-purple/90"
        >
          Continue
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
