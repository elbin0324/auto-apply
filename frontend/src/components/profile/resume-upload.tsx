import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Loader2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadResume, useParseResume } from "@/hooks/use-resume";
import { formatDate } from "@/lib/utils";
import type { ProfileResponse } from "@/types/profile";

interface ResumeUploadProps {
  profile: ProfileResponse;
}

export function ResumeUpload({ profile }: ResumeUploadProps) {
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
      uploadMutation.mutate(file);
    },
    [uploadMutation],
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

  const hasResume = !!profile.raw_resume_url;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200 ${
          dragOver
            ? "border-accent-purple bg-accent-purple/5"
            : "border-border-card hover:border-border-hover"
        }`}
      >
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
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Current resume info */}
      {hasResume && (
        <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-card p-3">
          <FileText className="h-5 w-5 shrink-0 text-accent-blue" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              Resume uploaded
            </p>
            {profile.resume_updated_at && (
              <p className="text-xs text-text-muted">
                Updated {formatDate(profile.resume_updated_at)}
              </p>
            )}
          </div>
          <Check className="h-4 w-4 text-accent-green" />
        </div>
      )}

      {/* Parse button */}
      {hasResume && (
        <Button
          variant="secondary"
          onClick={() => parseMutation.mutate()}
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

      {parseMutation.isSuccess && (
        <p className="text-sm text-accent-green">
          Resume parsed successfully. Check your profile fields.
        </p>
      )}

      {parseMutation.isError && (
        <p className="text-sm text-red-400">
          Failed to parse resume. Please try again.
        </p>
      )}
    </div>
  );
}
