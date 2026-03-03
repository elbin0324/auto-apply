import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadResume, useParseResume } from "@/hooks/use-resume";
import type { ProfileResponse } from "@/types/profile";

interface StepResumeProps {
  profile?: ProfileResponse;
  onNext: () => void;
}

export function StepResume({ profile, onNext }: StepResumeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const uploadMutation = useUploadResume();
  const parseMutation = useParseResume();

  const hasResume = !!profile?.raw_resume_url || uploadMutation.isSuccess;
  const isParsed = parseMutation.isSuccess;

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        alert("Only PDF files are accepted.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File must be under 10 MB.");
        return;
      }
      uploadMutation.mutate(file, {
        onSuccess: () => {
          // Auto-trigger parse after upload
          parseMutation.mutate();
        },
      });
    },
    [uploadMutation, parseMutation],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const isProcessing = uploadMutation.isPending || parseMutation.isPending;

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

      {/* Drop zone */}
      {!isParsed && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors duration-200 ${
            dragOver
              ? "border-accent-purple bg-accent-purple/5"
              : "border-border-card hover:border-border-hover"
          } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        >
          {isProcessing ? (
            <>
              <div className="rounded-lg bg-accent-purple/10 p-3">
                <Sparkles className="h-6 w-6 text-accent-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {uploadMutation.isPending
                    ? "Uploading your resume..."
                    : "AI is analyzing your resume..."}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  This usually takes a few seconds
                </p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-accent-purple" />
            </>
          ) : (
            <>
              <div className="rounded-lg bg-accent-purple/10 p-3">
                <Upload className="h-6 w-6 text-accent-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Drop your resume here or click to browse
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  PDF only, up to 10 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Parse success */}
      {isParsed && (
        <div className="space-y-3 rounded-xl border border-accent-green/20 bg-accent-green/5 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10">
            <Check className="h-6 w-6 text-accent-green" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">
              Resume analyzed successfully!
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              We&apos;ve extracted your information. Review it in the next step.
            </p>
          </div>
        </div>
      )}

      {/* Upload success but parse failed */}
      {hasResume && parseMutation.isError && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-card p-3">
            <FileText className="h-5 w-5 shrink-0 text-accent-blue" />
            <p className="text-sm font-medium text-text-primary">
              Resume uploaded
            </p>
            <Check className="ml-auto h-4 w-4 text-accent-green" />
          </div>
          <p className="text-sm text-red-400">
            Failed to parse resume. You can continue and fill in your details
            manually.
          </p>
          <Button
            variant="secondary"
            onClick={() => parseMutation.mutate()}
            disabled={parseMutation.isPending}
            className="w-full"
          >
            {parseMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Retry Parse
              </>
            )}
          </Button>
        </div>
      )}

      {(uploadMutation.isError) && (
        <p className="text-sm text-red-400">
          Failed to upload resume. Please try again.
        </p>
      )}

      {/* Actions */}
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
