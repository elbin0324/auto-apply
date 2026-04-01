import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "@/icons";

interface CustomAnswersEditorProps {
  answers: Record<string, string>;
  onSave: (answers: Record<string, string>) => void;
}

interface AnswerRow {
  key: string;
  question: string;
  answer: string;
}

export function CustomAnswersEditor({ answers, onSave }: CustomAnswersEditorProps) {
  const [rows, setRows] = useState<AnswerRow[]>(() =>
    Object.entries(answers).map(([question, answer]) => ({
      key: crypto.randomUUID(),
      question,
      answer,
    })),
  );

  const saveRows = useCallback(
    (updated: AnswerRow[]) => {
      const result: Record<string, string> = {};
      for (const row of updated) {
        if (row.question.trim()) {
          result[row.question.trim()] = row.answer;
        }
      }
      onSave(result);
    },
    [onSave],
  );

  const handleAdd = useCallback(() => {
    setRows((prev) => [...prev, { key: crypto.randomUUID(), question: "", answer: "" }]);
  }, []);

  const handleRemove = useCallback(
    (key: string) => {
      const updated = rows.filter((r) => r.key !== key);
      setRows(updated);
      saveRows(updated);
    },
    [rows, saveRows],
  );

  const handleChange = useCallback(
    (key: string, field: "question" | "answer", value: string) => {
      const updated = rows.map((r) => (r.key === key ? { ...r, [field]: value } : r));
      setRows(updated);
      saveRows(updated);
    },
    [rows, saveRows],
  );

  return (
    <Card>
      <CardHeader
        title="Custom Answers"
        count={Object.keys(answers).length}
        right={
          <Button variant="outline" onClick={handleAdd}>
            + Add
          </Button>
        }
      />
      <div className="p-[18px] space-y-2">
        {rows.length === 0 && (
          <p className="font-mono text-[11px] text-t-400">
            Add default answers for common application questions.
          </p>
        )}
        {rows.map((row) => (
          <div key={row.key} className="flex items-start gap-2">
            <input
              value={row.question}
              onChange={(e) => handleChange(row.key, "question", e.target.value)}
              placeholder="Question..."
              className="flex-[2] rounded-md border border-border-main bg-bg-inset px-3 py-2 font-mono text-[12px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
            />
            <input
              value={row.answer}
              onChange={(e) => handleChange(row.key, "answer", e.target.value)}
              placeholder="Answer..."
              className="flex-1 rounded-md border border-border-main bg-bg-inset px-3 py-2 font-mono text-[12px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
            />
            <button
              onClick={() => handleRemove(row.key)}
              className="mt-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-t-400 transition-colors hover:text-fail"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
