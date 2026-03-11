import { Check } from "lucide-react";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={label} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                  isCompleted
                    ? "border-accent-green bg-accent-green text-bg"
                    : isCurrent
                      ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                      : "border-border-card bg-bg-card text-text-muted"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`mt-1.5 text-xs ${
                  isCurrent
                    ? "font-medium text-text-primary"
                    : isCompleted
                      ? "text-accent-green"
                      : "text-text-muted"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connecting line (not after last step) */}
            {index < steps.length - 1 && (
              <div
                className={`mb-5 h-0.5 w-12 sm:w-20 ${
                  index < currentStep ? "bg-accent-green" : "bg-border-card"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
