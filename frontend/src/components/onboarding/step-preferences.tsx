import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreferencesEditor } from "@/components/profile/preferences-editor";

interface StepPreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepPreferences({ onNext, onBack }: StepPreferencesProps) {
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

      <PreferencesEditor
        onSaveSuccess={onNext}
        footer={({ save, isPending }) => (
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={save}
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
        )}
      />
    </div>
  );
}
