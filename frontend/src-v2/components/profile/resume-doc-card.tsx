import { useState, useRef, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResumeUpload } from "@/hooks/use-resume";
import { DropZone, formatFileSize } from "./resume-display";
import { Upload } from "@/icons";
import type { Profile } from "@/types/profile";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface ResumeDocCardProps {
  profile: Profile;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ResumeDocCard({ profile }: ResumeDocCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, parse } = useResumeUpload();
  const isProcessing = upload.isPending || parse.isPending;

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.type !== "application/pdf") {
        setError("Only PDF files are accepted.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File exceeds ${formatFileSize(MAX_SIZE_BYTES)} limit.`);
        return;
      }
      upload.mutate(file, {
        onSuccess: () => parse.mutate(undefined),
        onError: () => setError("Upload failed. Please try again."),
      });
    },
    [upload, parse],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const handleReplaceClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReparse = useCallback(() => {
    parse.mutate(undefined);
  }, [parse]);

  const hasResume = !!profile.raw_resume_url;

  return (
    <Card>
      <CardHeader
        title="Resume"
        right={
          hasResume ? (
            <div className="flex gap-1.5">
              <Button variant="outline" onClick={handleReparse} disabled={isProcessing} loading={parse.isPending}>
                Re-parse
              </Button>
              <Button variant="outline" onClick={handleReplaceClick} disabled={isProcessing}>
                Replace
              </Button>
            </div>
          ) : undefined
        }
      />
      <div className="p-[18px]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {hasResume ? (
          <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-pri p-7 text-center" style={{ backgroundColor: "var(--pri-bg)" }}>
            <Upload size={20} color="var(--color-pri)" />
            <p className="font-mono text-[12px] font-semibold text-t-900">
              {profile.raw_resume_url!.split("/").pop() ?? "resume.pdf"}
            </p>
            <p className="font-mono text-[10px] text-t-400">
              {profile.resume_updated_at && formatDate(profile.resume_updated_at)}
            </p>
            {isProcessing ? (
              <Badge color="warn">Parsing...</Badge>
            ) : (
              <Badge color="ok">Parsed</Badge>
            )}
          </div>
        ) : (
          <DropZone
            dragOver={dragOver}
            isProcessing={isProcessing}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleReplaceClick}
          />
        )}

        {error && (
          <p className="mt-2 font-mono text-[11px] text-fail">{error}</p>
        )}
      </div>
    </Card>
  );
}
