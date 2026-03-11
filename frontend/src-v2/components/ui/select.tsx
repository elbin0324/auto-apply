import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/theme/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  const handleSelect = useCallback(
    (val: string) => {
      onChange?.(val);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-border-main bg-bg-inset px-3 py-2 font-mono text-[13px] text-t-900 outline-none transition-colors",
          "focus:border-pri",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-pri",
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={cn("ml-1 text-t-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border-main bg-bg-card shadow-lg">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "cursor-pointer px-3 py-2 font-mono text-[13px] text-t-900 transition-colors hover:bg-bg-inset",
                opt.value === value && "text-pri",
              )}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
