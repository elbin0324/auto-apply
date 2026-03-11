import { useState, useCallback, useRef } from "react";
import { X } from "@/icons";

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  variant?: "default" | "danger";
}

const VARIANT_STYLES = {
  default: {
    tagBg: "var(--bg-deep)",
    tagText: "var(--color-pri)",
    tagBorder: "var(--pri-border)",
  },
  danger: {
    tagBg: "var(--fail-bg)",
    tagText: "var(--color-fail-dim)",
    tagBorder: "var(--fail-border)",
  },
} as const;

export function TagInput({
  label,
  tags,
  onChange,
  placeholder = "Type and press Enter...",
  variant = "default",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = VARIANT_STYLES[variant];

  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInput("");
    },
    [tags, onChange],
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index));
    },
    [tags, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",")) {
      const parts = val.split(",");
      for (const part of parts.slice(0, -1)) {
        if (part.trim()) addTag(part);
      }
      setInput(parts[parts.length - 1] ?? "");
    } else {
      setInput(val);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400">
        {label}
      </label>
      <div
        className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-md border border-border-main bg-bg-inset px-2.5 py-1.5 transition-colors focus-within:border-pri"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold"
            style={{
              background: styles.tagBg,
              color: styles.tagText,
              border: `1px solid ${styles.tagBorder}`,
              borderRadius: 4,
              padding: "6px 12px",
            }}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="ml-0.5 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 border-none bg-transparent py-1 text-[13px] text-t-900 outline-none placeholder:text-t-400"
        />
      </div>
    </div>
  );
}
