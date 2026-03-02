import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface JobSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobSearchBar({ value, onChange }: JobSearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 400);
    return () => clearTimeout(timer);
  }, [local, value, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search jobs by title, company, or keywords..."
        className="pl-9"
      />
    </div>
  );
}
