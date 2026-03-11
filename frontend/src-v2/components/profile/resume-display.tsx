import { Badge } from "@/components/ui/badge";
import { Upload } from "@/icons";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ResumeInfoProps {
  resumeUrl: string;
  updatedAt: string | null;
  uploadedSize: number | null;
  isProcessing: boolean;
}

export function ResumeInfo({ resumeUrl, updatedAt, uploadedSize, isProcessing }: ResumeInfoProps) {
  const filename = resumeUrl.split("/").pop() ?? "resume.pdf";
  return (
    <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-pri p-7 text-center" style={{ backgroundColor: "var(--pri-bg)" }}>
      <Upload size={20} color="var(--color-pri)" />
      <p className="font-mono text-[12px] font-semibold text-t-900">{filename}</p>
      <p className="font-mono text-[10px] text-t-400">
        {uploadedSize != null && <span>{formatFileSize(uploadedSize)}</span>}
        {uploadedSize != null && updatedAt && <span> &middot; </span>}
        {updatedAt && <span>{formatDate(updatedAt)}</span>}
      </p>
      {isProcessing ? (
        <Badge color="warn">Parsing...</Badge>
      ) : (
        <Badge color="ok">Parsed</Badge>
      )}
    </div>
  );
}

interface DropZoneProps {
  dragOver: boolean;
  isProcessing: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

export function DropZone({ dragOver, isProcessing, onDragOver, onDragLeave, onDrop, onClick }: DropZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-pri py-8 transition-colors"
      style={{
        backgroundColor: dragOver ? "var(--pri-bg)" : undefined,
      }}
    >
      {isProcessing ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-pri border-t-transparent" />
      ) : (
        <Upload size={20} color="var(--color-pri)" />
      )}
      <span className="font-mono text-[11px] text-t-400">
        {isProcessing ? "Processing..." : "Drop PDF here or click to upload"}
      </span>
      <span className="font-mono text-[10px] text-t-300">PDF only, max 10 MB</span>
    </div>
  );
}

export { formatFileSize };
