import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Loader2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadResume, useParseResume } from "@/hooks/use-resume";
import { formatDate } from "@/lib/utils";
import type { ProfileResponse } from "@/types/profile";

interface ResumeUploadProps {
  profile: ProfileResponse;
  autoParseOnUpload?: boolean;
  compact?: boolean;
  showParseSuccessState?: boolean;
  onParseSuccess?: () => void;
}

export function ResumeUpload({
  profile,
  autoParseOnUpload = false,
  compact = false,
  showParseSuccessState = false,
  onParseSuccess,
}: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const uploadMutation = useUploadResume();
  const parseMutation = useParseResume();

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
      if (autoParseOnUpload) {
        uploadMutation.mutate(file, {
          onSuccess: () => {
            parseMutation.mutate(undefined, {
              onSuccess: () => onParseSuccess?.(),
            });
          },
        });
      } else {
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation, parseMutation, autoParseOnUpload, onParseSuccess],
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

  const hasResume = !!profile.raw_resume_url || uploadMutation.isSuccess;
  const isProcessing = uploadMutation.isPending || parseMutation.isPending;
  const isParsed = parseMutation.isSuccess;

  return (
    <div className="space-y-4">
      {/* Drop zone — hidden after successful parse in auto-parse mode */}
      {!(autoParseOnUpload && isParsed) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200 ${
            dragOver
              ? "border-accent-purple bg-accent-purple/5"
              : "border-border-card hover:border-border-hover"
          } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        >
          {autoParseOnUpload && isProcessing ? (
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
                  {uploadMutation.isPending
                    ? "Uploading..."
                    : "Drop your resume here or click to browse"}
                </p>
                <p className="text-xs text-text-muted">PDF only, up to 10 MB</p>
              </div>
              {uploadMutation.isPending && (
                <Loader2 className="h-5 w-5 animate-spin text-accent-purple" />
              )}
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

      {/* Parse success card (onboarding style) */}
      {showParseSuccessState && isParsed && (
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

      {/* Current resume info (standalone mode) */}
      {hasResume && !(showParseSuccessState && isParsed) && (
        <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-card p-3">
          <FileText className="h-5 w-5 shrink-0 text-accent-blue" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              Resume uploaded
            </p>
            {!compact && profile.resume_updated_at && (
              <p className="text-xs text-text-muted">
                Updated {formatDate(profile.resume_updated_at)}
              </p>
            )}
          </div>
          <Check className="h-4 w-4 text-accent-green" />
        </div>
      )}

      {/* Parse button — hidden in auto-parse mode */}
      {!autoParseOnUpload && hasResume && (
        <Button
          variant="secondary"
          onClick={() => parseMutation.mutate(undefined, {
            onSuccess: () => onParseSuccess?.(),
          })}
          disabled={parseMutation.isPending}
          className="w-full"
        >
          {parseMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              AI is analyzing your resume...
            </>
          ) : (
            <>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Parse Resume with AI
            </>
          )}
        </Button>
      )}

      {/* Auto-parse error — show retry */}
      {autoParseOnUpload && hasResume && parseMutation.isError && (
        <div className="space-y-3">
          <p className="text-sm text-red-400">
            Failed to parse resume. You can continue and fill in your details
            manually.
          </p>
          <Button
            variant="secondary"
            onClick={() => parseMutation.mutate(undefined, {
              onSuccess: () => onParseSuccess?.(),
            })}
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

      {/* Non-auto-parse success message */}
      {!autoParseOnUpload && parseMutation.isSuccess && (
        <p className="text-sm text-accent-green">
          Resume parsed successfully. Check your profile fields.
        </p>
      )}

      {/* Non-auto-parse error */}
      {!autoParseOnUpload && parseMutation.isError && (
        <p className="text-sm text-red-400">
          Failed to parse resume. Please try again.
        </p>
      )}

      {uploadMutation.isError && (
        <p className="text-sm text-red-400">
          Failed to upload resume. Please try again.
        </p>
      )}
    </div>
  );
}
