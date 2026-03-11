import { useState } from "react";
import { Led } from "@/components/ui/led";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MatchDot } from "@/components/shared/match-dot";
import { JRow } from "@/components/shared/job-row";
import { SidePanel } from "@/components/shared/side-panel";
import { useTheme } from "@/theme/context";
import { Radar, Target, Chart, Plane } from "@/icons";
import type { Job } from "@/types/job";

const SAMPLE_JOB: Job = {
  id: "1",
  title: "Senior Frontend Engineer",
  company: "Acme Corp",
  location: "San Francisco, CA",
  location_type: "hybrid",
  salary_min: 150000,
  salary_max: 200000,
  salary_currency: "USD",
  employment_type: "Full-time",
  experience_level: "Senior",
  tags: ["React", "TypeScript"],
  url: "https://example.com",
  source: "greenhouse",
  is_active: true,
  match_score: 87,
  description: "Build next-gen frontend interfaces.",
};

const SAMPLE_JOBS: Array<{ id: string; company: string; title: string; location?: string; salary_min?: number; salary_max?: number; match_score?: number; application_status?: string }> = [
  { id: "1", company: "Acme Corp", title: "Senior Frontend Engineer", location: "San Francisco, CA", salary_min: 150000, salary_max: 200000, match_score: 92 },
  { id: "2", company: "TechStart", title: "Full Stack Developer", location: "Remote", match_score: 78, application_status: "applied" },
  { id: "3", company: "MobileFirst", title: "React Native Engineer", location: "NYC", match_score: 55, application_status: "pending_review" },
  { id: "4", company: "LearnCo", title: "Junior Web Developer", match_score: 25, application_status: "failed" },
];

const COLORS = ["pri", "ok", "warn", "fail", "muted"] as const;
const SCORES = [95, 80, 65, 50, 35, 15];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-pri">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function KitchenSinkPage() {
  const { isDark, toggleTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const [inputVal, setInputVal] = useState("Hello world");
  const [selectVal, setSelectVal] = useState("react");

  return (
    <div className="min-h-screen bg-bg-body p-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-[18px] font-bold text-t-900">Kitchen Sink</h1>
          <Button variant="ghost" onClick={toggleTheme}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>

        {/* LEDs */}
        <Section title="Led">
          <div className="flex items-center gap-6">
            {COLORS.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <Led color={c} />
                <Led color={c} size={10} />
                <span className="font-mono text-[10px] text-t-400">{c}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badge">
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <Badge key={c} color={c}>
                {c.toUpperCase()}
              </Badge>
            ))}
            <Badge color="pri">QUEUED</Badge>
            <Badge color="ok">LANDED</Badge>
            <Badge color="warn">REVIEW</Badge>
            <Badge color="fail">FAILED</Badge>
            <Badge color="muted">SKIPPED</Badge>
          </div>
        </Section>

        {/* Card + CardHeader */}
        <Section title="Card + CardHeader">
          <Card>
            <CardHeader title="Applications" count={42} right={<Badge color="pri">Live</Badge>} />
            <div className="p-5">
              <p className="font-sans text-[13px] text-t-700">Card body content goes here.</p>
            </div>
          </Card>
        </Section>

        {/* Buttons */}
        <Section title="Button">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" icon={<Plane size={14} />}>
              With Icon
            </Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </Section>

        {/* StatCards */}
        <Section title="StatCard">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Applications" value={127} change="+12 this week" icon={<Target size={20} />} />
            <StatCard label="Match Rate" value="78%" icon={<Radar size={20} />} />
            <StatCard label="In Queue" value={14} icon={<Chart size={20} />} />
            <StatCard label="Success" value="92%" change="+3%" icon={<Plane size={20} />} />
          </div>
        </Section>

        {/* Progress */}
        <Section title="Progress">
          <div className="space-y-3">
            <Progress pct={25} />
            <Progress pct={50} color="var(--color-ok)" />
            <Progress pct={75} color="var(--color-warn)" />
            <Progress pct={100} color="var(--color-fail)" />
            <Progress pct={60} height={8} />
          </div>
        </Section>

        {/* MatchDot */}
        <Section title="MatchDot">
          <div className="flex flex-wrap gap-6">
            {SCORES.map((s) => (
              <MatchDot key={s} score={s} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-6">
            {SCORES.map((s) => (
              <MatchDot key={s} score={s} size="sm" />
            ))}
          </div>
        </Section>

        {/* Input + Select */}
        <Section title="Input + Select">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Full Name" value={inputVal} onChange={setInputVal} />
            <Input label="API Key" value="sk-123abc" mono readOnly />
            <Select
              label="Framework"
              value={selectVal}
              onChange={setSelectVal}
              options={[
                { value: "react", label: "React" },
                { value: "vue", label: "Vue" },
                { value: "svelte", label: "Svelte" },
              ]}
            />
          </div>
        </Section>

        {/* JRow */}
        <Section title="JRow (Job Row)">
          <Card>
            <CardHeader title="Jobs" count={SAMPLE_JOBS.length} />
            <div className="divide-y divide-border-subtle">
              {SAMPLE_JOBS.map((job) => (
                <JRow key={job.id} job={job} onClick={() => setPanelOpen(true)} />
              ))}
            </div>
          </Card>
        </Section>

        {/* SidePanel trigger */}
        <Section title="SidePanel">
          <Button variant="primary" onClick={() => setPanelOpen(true)}>
            Open Side Panel
          </Button>
        </Section>
      </div>

      <SidePanel
        job={SAMPLE_JOB}
        matchBreakdown={{
          combined_method: "llm",
          model: "claude-3",
          matched_skills: ["React", "TypeScript", "Node.js", "GraphQL"],
          missing_skills: ["Kubernetes", "AWS"],
          preferred_skills: ["Next.js"],
          reasoning:
            "Strong frontend match with proven React and TypeScript experience. Missing some infrastructure skills but core competencies align well.",
        }}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onApply={(id) => {
          console.log("Apply:", id);
          setPanelOpen(false);
        }}
      />
    </div>
  );
}
