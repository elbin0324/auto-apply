import { useEffect, useState } from "react";
import { Led } from "@/components/ui/led";

const SUBSYSTEMS = [
  { label: "RES-ENG", color: "pri" as const },
  { label: "ATS-NAV", color: "pri" as const },
  { label: "JOB-RDR", color: "pri" as const },
  { label: "CVR-LTR", color: "warn" as const },
  { label: "STEALTH", color: "pri" as const },
];

function formatTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export function StatusBar() {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="hidden h-9 shrink-0 items-center gap-5 bg-bg-deep px-7 md:flex"
      style={{ borderBottom: "1px solid var(--tw-10)" }}
    >
      {SUBSYSTEMS.map((sys, i) => (
        <div key={sys.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <div
              className="mr-3.5 h-3 w-px"
              style={{ background: "var(--tw-10)" }}
            />
          )}
          <Led color={sys.color} size={5} />
          <span
            className="font-mono text-[9px] font-semibold uppercase"
            style={{ letterSpacing: ".08em", color: "var(--tw-60)" }}
          >
            {sys.label}
          </span>
        </div>
      ))}
      <span
        className="ml-auto font-mono text-[10px]"
        style={{ color: "var(--tw-40)" }}
      >
        {time}
      </span>
    </div>
  );
}
