import { Plane, Check } from "@/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/theme/utils";

const STEPS = ["Contact", "Resume", "Targets"] as const;

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  children: React.ReactNode;
}

function StepIndicator({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.slice(0, totalSteps).map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < step;
        const isActive = stepNum === step;
        const isUpcoming = stepNum > step;

        return (
          <div key={label} className="flex items-center">
            {/* Connecting line before (except first) */}
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12 transition-colors",
                  stepNum <= step ? "bg-pri" : "bg-bg-muted",
                )}
              />
            )}

            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-mono font-bold transition-colors",
                  isCompleted && "bg-pri text-bg-deep",
                  isActive && "bg-pri text-bg-deep",
                  isUpcoming && "bg-bg-muted text-t-400",
                )}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span
                className={cn(
                  "font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
                  isCompleted && "text-t-700",
                  isActive && "text-t-900",
                  isUpcoming && "text-t-400",
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OnboardingLayout({
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextLoading,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-bg-body px-4 py-10 sm:py-16">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2">
        <Plane size={20} color="var(--color-pri)" />
        <span className="font-mono text-sm font-bold tracking-[0.15em] text-t-900">
          APPLYPILOT
        </span>
      </div>

      {/* Title */}
      <h1 className="mb-8 font-mono text-base font-bold tracking-[0.08em] text-t-900">
        PRE-FLIGHT CHECKLIST
      </h1>

      {/* Progress Indicator */}
      <div className="mb-10">
        <StepIndicator step={step} totalSteps={totalSteps} />
      </div>

      {/* Step Content */}
      <div className="w-full max-w-[600px]">
        {children}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex w-full max-w-[600px] items-center justify-between">
        <div>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          loading={nextLoading}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
