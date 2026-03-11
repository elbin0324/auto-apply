import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, Doc } from "@/icons";
import { cn } from "@/theme/utils";
import { api } from "@/lib/api";

type ResumeStatus = "idle" | "uploading" | "parsing" | "done" | "error";

interface StepResumeProps {
  onStatusChange: (uploaded: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StepResume({ onStatusChange }: StepResumeProps) {
  const [status, setStatus] = useState<ResumeStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      // Validate
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB.");
        return;
      }

      setError(null);
      setFileName(file.name);
      setFileSize(file.size);

      // Upload
      setStatus("uploading");
      try {
        const formData = new FormData();
        formData.append("file", file);
        await api.upload("/api/profile/resume/upload", formData);

        // Parse
        setStatus("parsing");
        await api.post("/api/profile/resume/parse");

        setStatus("done");
        onStatusChange(true);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        onStatusChange(false);
      }
    },
    [onStatusChange],
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="mb-1 font-mono text-sm font-bold text-t-900">
          Upload your resume
        </h2>
        <p className="mb-6 font-mono text-[11px] text-t-500">
          We will parse it with AI to pre-fill your profile.
        </p>

        {status === "idle" || status === "error" ? (
          <DropZone
            dragOver={dragOver}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          />
        ) : (
          <FileInfo
            fileName={fileName ?? "resume.pdf"}
            fileSize={fileSize}
            status={status}
          />
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <div
            className="mt-4 rounded-md px-3 py-2 font-mono text-xs"
            style={{
              background: "var(--fail-bg)",
              color: "var(--color-fail-dim)",
              border: "1px solid var(--fail-border)",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}

function DropZone({
  dragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
}: {
  dragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 transition-colors",
        dragOver ? "border-pri bg-[var(--pri-bg)]" : "border-border-main hover:border-pri",
      )}
    >
      <Upload size={32} color="var(--color-t-400)" />
      <p className="font-mono text-[12px] text-t-700">
        Drop your PDF here or click to upload
      </p>
      <p className="font-mono text-[10px] text-t-400">
        PDF only, max 10 MB
      </p>
    </div>
  );
}

function FileInfo({
  fileName,
  fileSize,
  status,
}: {
  fileName: string;
  fileSize: number;
  status: "uploading" | "parsing" | "done";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-main bg-bg-inset px-4 py-3">
      <Doc size={20} color="var(--color-pri)" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[12px] font-semibold text-t-900">
          {fileName}
        </p>
        <p className="font-mono text-[10px] text-t-400">
          {formatFileSize(fileSize)}
        </p>
      </div>
      <div className="shrink-0">
        {status === "uploading" && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-pri border-t-transparent" />
            <span className="font-mono text-[10px] text-t-500">Uploading...</span>
          </div>
        )}
        {status === "parsing" && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-pri border-t-transparent" />
            <span className="font-mono text-[10px] text-t-500">Parsing with AI...</span>
          </div>
        )}
        {status === "done" && (
          <div className="flex items-center gap-2">
            <Check size={14} color="var(--color-ok)" />
            <Badge color="ok">Parsed</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
