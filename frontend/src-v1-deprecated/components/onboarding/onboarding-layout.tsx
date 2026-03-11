import { ProgressBar } from "./progress-bar";

const STEPS = ["Resume", "Your Info", "Preferences", "Job Search"];

interface OnboardingLayoutProps {
  currentStep: number;
  children: React.ReactNode;
}

export function OnboardingLayout({
  currentStep,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-bg px-4 py-12">
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-purple/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-blue/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="text-center text-2xl font-bold tracking-tight">
          <span className="bg-linear-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
            AutoApply
          </span>
        </div>

        <ProgressBar steps={STEPS} currentStep={currentStep} />

        {children}
      </div>
    </div>
  );
}
