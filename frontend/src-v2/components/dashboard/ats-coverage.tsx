import { Card, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AtsEntry {
  name: string;
  pct: number;
}

const ATS_DATA: AtsEntry[] = [
  { name: "Greenhouse", pct: 85 },
  { name: "Lever", pct: 62 },
  { name: "Ashby", pct: 45 },
  { name: "Workday", pct: 28 },
];

export function AtsCoverage() {
  return (
    <Card>
      <CardHeader title="ATS COVERAGE" />
      <div className="space-y-3.5 p-4">
        {ATS_DATA.map((ats) => (
          <div key={ats.name} className="flex items-center gap-3">
            <span className="w-[90px] shrink-0 font-mono text-[11px] font-semibold text-t-700">
              {ats.name}
            </span>
            <div className="flex-1">
              <Progress pct={ats.pct} />
            </div>
            <span className="w-[28px] text-right font-mono text-[11px] text-t-400">
              {ats.pct}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
