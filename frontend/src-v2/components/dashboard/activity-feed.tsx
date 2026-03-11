import { Card, CardHeader } from "@/components/ui/card";
import { Led } from "@/components/ui/led";

interface FeedEntry {
  id: string;
  color: "pri" | "fail";
  text: string;
  timestamp: string;
}

const PLACEHOLDER_ENTRIES: FeedEntry[] = [
  { id: "1", color: "pri", text: "STR moved to interview", timestamp: "T-02:14" },
  { id: "2", color: "pri", text: "VCL in flight filling 3/5", timestamp: "T-04:30" },
  { id: "3", color: "pri", text: "ANT resume tailored", timestamp: "T-06:22" },
  { id: "4", color: "fail", text: "NTN rejected", timestamp: "T-08:15" },
  { id: "5", color: "pri", text: "SYS 24 new matches queued", timestamp: "T-12:00" },
];

export function ActivityFeed() {
  return (
    <Card className="flex flex-col">
      <CardHeader title="FLIGHT LOG" />
      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-3">
          {PLACEHOLDER_ENTRIES.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3">
              <Led color={entry.color} size={7} />
              <span className="flex-1 font-mono text-[11px] font-medium text-t-700">
                {entry.text}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-t-400">
                {entry.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
