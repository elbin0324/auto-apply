import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { INDUSTRY_TAXONOMY } from "@/lib/constants";

interface IndustrySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function IndustrySelect({ value, onChange }: IndustrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = INDUSTRY_TAXONOMY.filter(
    (item) =>
      item.toLowerCase().includes(search.toLowerCase()) &&
      !value.includes(item),
  );

  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
      setSearch("");
    }
  };

  const remove = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  return (
    <div ref={containerRef} className="relative">
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="gap-1 py-1 pl-2.5 pr-1"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                className="rounded-full p-0.5 transition-colors hover:bg-border-hover"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search industries..."
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border-subtle bg-bg-primary shadow-md">
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-sm text-text-muted">
              No industries found
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                    value.includes(item)
                      ? "border-accent-purple bg-accent-purple"
                      : "border-border-subtle"
                  }`}
                >
                  {value.includes(item) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </span>
                {item}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
