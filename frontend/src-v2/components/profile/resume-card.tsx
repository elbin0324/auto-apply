import { useState, useRef, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResumeUpload } from "@/hooks/use-resume";
import { ResumeInfo, DropZone, formatFileSize } from "./resume-display";
import type { Profile } from "@/types/profile";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface ResumeCardProps {
  profile: Profile;
}

export function ResumeCard({ profile }: ResumeCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedSize, setUploadedSize] = useState<number | null>(null);
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
      setUploadedSize(file.size);
      upload.mutate(file, {
        onSuccess: () => {
          parse.mutate(undefined);
        },
        onError: () => {
          setError("Upload failed. Please try again.");
        },
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

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasResume = !!profile.raw_resume_url;

  return (
    <Card>
      <CardHeader
        title="Resume"
        right={
          hasResume ? (
            <Button variant="outline" onClick={handleUploadClick} disabled={isProcessing}>
              Upload
            </Button>
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
          <ResumeInfo
            resumeUrl={profile.raw_resume_url!}
            updatedAt={profile.resume_updated_at ?? null}
            uploadedSize={uploadedSize}
            isProcessing={isProcessing}
          />
        ) : (
          <DropZone
            dragOver={dragOver}
            isProcessing={isProcessing}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          />
        )}

        {error && (
          <p className="mt-2 font-mono text-[11px] text-fail">{error}</p>
        )}
      </div>
    </Card>
  );
}
