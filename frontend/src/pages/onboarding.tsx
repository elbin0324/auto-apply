import { useState } from "react";
import { useNavigate, Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useProfile } from "@/hooks/use-profile";
import { useAutoApplyConfig } from "@/hooks/use-auto-apply-status";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { StepResume } from "@/components/onboarding/step-resume";
import { StepProfile } from "@/components/onboarding/step-profile";
import { StepPreferences } from "@/components/onboarding/step-preferences";
import { StepJobSearch } from "@/components/onboarding/step-job-search";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: profile } = useProfile();
  const { data: config } = useAutoApplyConfig();

  // Already onboarded — redirect to dashboard
  if (user?.onboarding_completed) {
    return <Navigate to="/dashboard" />;
  }

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 3));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const handleComplete = () => {
    navigate({ to: "/dashboard" });
  };

  return (
    <OnboardingLayout currentStep={currentStep}>
      {currentStep === 0 && (
        <StepResume profile={profile} onNext={goNext} />
      )}
      {currentStep === 1 && (
        <StepProfile profile={profile} onNext={goNext} onBack={goBack} />
      )}
      {currentStep === 2 && (
        <StepPreferences profile={profile} onNext={goNext} onBack={goBack} />
      )}
      {currentStep === 3 && (
        <StepJobSearch
          config={config}
          onBack={goBack}
          onComplete={handleComplete}
        />
      )}
    </OnboardingLayout>
  );
}
