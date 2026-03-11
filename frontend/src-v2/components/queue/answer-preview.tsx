import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  GeneratedApplicationField,
  GeneratedApplicationAnswer,
} from "@/types/application";

interface AnswerPreviewProps {
  fields: GeneratedApplicationField[];
  answers: GeneratedApplicationAnswer[];
  editable?: boolean;
  onSubmit?: (answers: Record<string, string>) => void;
}

function findAnswer(
  answers: GeneratedApplicationAnswer[],
  fieldName: string,
): string {
  const match = answers.find((a) => a.field_name === fieldName);
  return match?.value ?? "";
}

function fieldTypeLabel(type: string): string {
  switch (type) {
    case "text":
      return "TEXT";
    case "textarea":
      return "LONG TEXT";
    case "select":
      return "SELECT";
    case "checkbox":
      return "CHECKBOX";
    case "radio":
      return "RADIO";
    case "file":
      return "FILE";
    default:
      return type.toUpperCase();
  }
}

export function AnswerPreview({
  fields,
  answers,
  editable = false,
  onSubmit,
}: AnswerPreviewProps) {
  const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.name] = findAnswer(answers, field.name);
    }
    return initial;
  });

  const handleChange = useCallback((fieldName: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit?.(editedValues);
  }, [editedValues, onSubmit]);

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="font-mono text-[11px] text-t-400">No generated answers available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-500">
          Generated Answers
        </span>
        <span className="font-mono text-[10px] text-t-400">
          {fields.length} fields
        </span>
      </div>

      <div className="space-y-3">
        {fields.map((field) => {
          const value = editable
            ? editedValues[field.name] ?? ""
            : findAnswer(answers, field.name);

          return (
            <div key={field.name}>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.04em] text-t-400">
                  {fieldTypeLabel(field.field_type)}
                </span>
                {field.is_required && (
                  <span className="font-mono text-[9px] font-bold text-warn">REQ</span>
                )}
                {field.page_number > 1 && (
                  <span className="font-mono text-[9px] text-t-300">
                    Page {field.page_number}
                  </span>
                )}
              </div>

              {editable ? (
                <Input
                  label={field.label}
                  value={value}
                  onChange={(v) => handleChange(field.name, v)}
                  mono
                />
              ) : (
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400">
                    {field.label}
                  </label>
                  <div className="rounded-md border border-border-main bg-bg-inset px-3 py-2 font-sans text-[13px] leading-[1.6] text-t-700">
                    {value || (
                      <span className="italic text-t-300">No answer generated</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editable && onSubmit && (
        <div className="border-t border-border-subtle pt-3">
          <Button variant="primary" onClick={handleSubmit}>
            Submit Edited Answers
          </Button>
        </div>
      )}
    </div>
  );
}
