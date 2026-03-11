import { useState, useEffect, useCallback } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useUpdateAutoApplyConfig } from "@/hooks/use-auto-apply";
import { useAuthStore } from "@/stores/auth-store";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { StepContact } from "@/components/onboarding/step-contact";
import { StepResume } from "@/components/onboarding/step-resume";
import { StepTargets } from "@/components/onboarding/step-targets";
import type { ContactFormData } from "@/components/onboarding/step-contact";
import type { TargetsFormData } from "@/components/onboarding/step-targets";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const { step, setStep, complete } = useOnboarding();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const updateConfig = useUpdateAutoApplyConfig();
  const user = useAuthStore((s) => s.user);

  // Step 1 state
  const [contact, setContact] = useState<ContactFormData>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
  });

  // Step 2 state
  const [, setResumeUploaded] = useState(false);

  // Step 3 state
  const [targets, setTargets] = useState<TargetsFormData>({
    target_titles: [],
    target_locations: [],
  });

  // Saving state
  const [saving, setSaving] = useState(false);

  // Populate form from profile when loaded
  useEffect(() => {
    if (profile) {
      setContact({
        full_name: profile.full_name ?? "",
        email: profile.email ?? user?.email ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
      });
    } else if (user?.email) {
      setContact((prev) => ({
        ...prev,
        email: prev.email || user.email,
      }));
    }
  }, [profile, user]);

  // Validation per step
  const isStep1Valid = contact.full_name.trim().length > 0 && contact.email.trim().length > 0;
  const isStep3Valid = targets.target_titles.length > 0;

  const isNextDisabled =
    saving ||
    (step === 1 && !isStep1Valid) ||
    (step === 3 && !isStep3Valid);

  const handleResumeStatus = useCallback((uploaded: boolean) => {
    setResumeUploaded(uploaded);
  }, []);

  async function handleNext() {
    if (step === 1) {
      // Save contact info
      setSaving(true);
      try {
        await updateProfile.mutateAsync({
          full_name: contact.full_name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim() || undefined,
          location: contact.location.trim() || undefined,
        });
        setStep(2);
      } finally {
        setSaving(false);
      }
    } else if (step === 2) {
      // Resume step — can proceed without uploading (skip)
      setStep(3);
    } else if (step === 3) {
      // Save targets + complete onboarding
      setSaving(true);
      try {
        await updateConfig.mutateAsync({
          target_titles: targets.target_titles,
          target_locations: targets.target_locations.length > 0 ? targets.target_locations : undefined,
        });
        complete.mutate();
      } finally {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  const nextLabel = step === TOTAL_STEPS ? "Complete Setup" : "Continue";

  return (
    <OnboardingLayout
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={step > 1 ? handleBack : undefined}
      onNext={() => void handleNext()}
      nextLabel={nextLabel}
      nextDisabled={isNextDisabled}
      nextLoading={saving || complete.isPending}
    >
      {step === 1 && (
        <StepContact data={contact} onChange={setContact} />
      )}
      {step === 2 && (
        <StepResume onStatusChange={handleResumeStatus} />
      )}
      {step === 3 && (
        <StepTargets data={targets} onChange={setTargets} />
      )}
    </OnboardingLayout>
  );
}
