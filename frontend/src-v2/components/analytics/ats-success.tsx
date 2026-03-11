import { Card, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AtsRow {
  name: string;
  rate: number;
  count: string;
}

const ATS_DATA: AtsRow[] = [
  { name: "Greenhouse", rate: 88, count: "30/34" },
  { name: "Lever", rate: 83, count: "15/18" },
  { name: "Ashby", rate: 89, count: "8/9" },
  { name: "Workday", rate: 60, count: "3/5" },
];

function rateColor(rate: number): string {
  if (rate >= 85) return "var(--color-ok)";
  if (rate >= 70) return "var(--color-warn)";
  return "var(--color-fail)";
}

export function AtsSuccess() {
  return (
    <Card>
      <CardHeader title="ATS Success Rate" />
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="pb-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
                ATS
              </th>
              <th className="pb-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
                Progress
              </th>
              <th className="w-[60px] pb-2.5 text-right font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
                Rate
              </th>
              <th className="w-[60px] pb-2.5 text-right font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {ATS_DATA.map((row) => (
              <tr key={row.name} className="border-b border-border-subtle last:border-b-0">
                <td className="py-3">
                  <span className="font-mono text-[11px] font-semibold text-t-900">
                    {row.name}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <Progress pct={row.rate} color={rateColor(row.rate)} />
                </td>
                <td className="py-3 text-right">
                  <span className="font-mono text-[11px] text-t-700">{row.rate}%</span>
                </td>
                <td className="py-3 text-right">
                  <span className="font-mono text-[10px] text-t-400">{row.count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
