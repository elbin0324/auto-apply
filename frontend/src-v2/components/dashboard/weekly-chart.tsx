import { Card, CardHeader } from "@/components/ui/card";

interface DayData {
  label: string;
  value: number;
}

const WEEKLY_DATA: DayData[] = [
  { label: "M", value: 8 },
  { label: "T", value: 12 },
  { label: "W", value: 5 },
  { label: "T", value: 15 },
  { label: "F", value: 10 },
  { label: "S", value: 3 },
  { label: "S", value: 1 },
];

const MAX_VALUE = Math.max(...WEEKLY_DATA.map((d) => d.value));

export function WeeklyChart() {
  return (
    <Card>
      <CardHeader title="WEEKLY SORTIE" />
      <div className="flex items-end justify-between gap-1 px-4 pb-4 pt-6">
        {WEEKLY_DATA.map((day, i) => {
          const heightPct = MAX_VALUE > 0 ? (day.value / MAX_VALUE) * 100 : 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full justify-center" style={{ height: 80 }}>
                <div
                  className="w-[60%] self-end rounded-sm"
                  style={{
                    height: `${heightPct}%`,
                    background: "var(--color-pri)",
                    borderRadius: 2,
                    minHeight: heightPct > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span className="font-mono text-[9px] text-t-400">{day.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
