import { cn } from "@/theme/utils";

interface InputProps {
  label: string;
  value: string;
  mono?: boolean;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function Input({
  label,
  value,
  mono,
  onChange,
  readOnly,
  placeholder,
  className,
}: InputProps) {
  return (
    <div className={className}>
      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-border-main bg-bg-inset px-3 py-2 text-[13px] text-t-900 outline-none transition-colors",
          "placeholder:text-t-400",
          "focus:border-pri",
          mono ? "font-mono" : "font-sans",
          readOnly && "cursor-default text-t-500",
        )}
      />
    </div>
  );
}
