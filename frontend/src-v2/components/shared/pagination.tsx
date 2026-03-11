import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="ghost"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-[10px]"
      >
        Prev
      </Button>
      <span className="font-mono text-[10px] text-t-400">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="ghost"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-[10px]"
      >
        Next
      </Button>
    </div>
  );
}
