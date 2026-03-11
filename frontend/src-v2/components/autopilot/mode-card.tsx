import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Sliders, Plane } from "@/icons";
import { cn } from "@/theme/utils";
import type { AutoApplyConfig } from "@/types/auto-apply";

interface ModeCardProps {
  config: AutoApplyConfig | undefined;
  onSave: (data: Partial<AutoApplyConfig>) => void;
}

const MODES = [
  { key: "safe", label: "SAFE", icon: Shield, description: "All to review" },
  { key: "hybrid", label: "HYBRID", icon: Sliders, description: "Above threshold auto-queues" },
  { key: "full_auto", label: "FULL AUTO", icon: Plane, description: "All auto-submit" },
] as const;

type ModeKey = (typeof MODES)[number]["key"];

export function ModeCard({ config, onSave }: ModeCardProps) {
  const [mode, setMode] = useState<ModeKey>("safe");
  const [threshold, setThreshold] = useState(70);
  const [dailyLimit, setDailyLimit] = useState(25);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (config) {
      setMode(config.apply_mode as ModeKey);
      setThreshold(config.auto_apply_threshold);
      setDailyLimit(config.daily_apply_limit);
    }
  }, [config]);

  const debouncedSave = useCallback(
    (data: Partial<AutoApplyConfig>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSave(data), 1000);
    },
    [onSave],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleModeChange = (newMode: ModeKey) => {
    setMode(newMode);
    onSave({ apply_mode: newMode });
  };

  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    debouncedSave({ auto_apply_threshold: value });
  };

  const handleDailyLimitChange = (value: number) => {
    setDailyLimit(value);
    debouncedSave({ daily_apply_limit: value });
  };

  return (
    <Card>
      <CardHeader title="APPLY MODE" />
      <div className="flex flex-col gap-3 p-4">
        {MODES.map((m) => {
          const isSelected = mode === m.key;
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => handleModeChange(m.key)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-left transition-all",
                isSelected ? "border-pri" : "border-border-main",
              )}
              style={{
                background: isSelected ? "var(--pri-bg)" : "var(--bg-card)",
                borderWidth: isSelected ? 2 : 1,
              }}
            >
              <Icon
                size={18}
                color={isSelected ? "var(--color-pri)" : "var(--color-muted)"}
              />
              <div className="flex-1">
                <span
                  className="font-mono text-[12px] font-bold uppercase tracking-[0.04em]"
                  style={{ color: isSelected ? "var(--color-pri)" : "var(--color-t-500)" }}
                >
                  {m.label}
                </span>
                <p className="mt-0.5 text-[11px] text-t-400">{m.description}</p>
              </div>
              {isSelected && <Badge color="pri">ACTIVE</Badge>}
            </button>
          );
        })}

        {mode === "hybrid" && (
          <SliderControl
            label="AUTO-APPLY THRESHOLD"
            value={threshold}
            min={15}
            max={100}
            onChange={handleThresholdChange}
          />
        )}

        <SliderControl
          label="DAILY APPLY LIMIT"
          value={dailyLimit}
          min={1}
          max={100}
          onChange={handleDailyLimitChange}
        />
      </div>
    </Card>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, min, max, onChange }: SliderControlProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="mt-1">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400">
          {label}
        </span>
        <span className="font-mono text-[12px] font-bold text-t-700">{value}</span>
      </div>
      <div className="relative h-[5px] w-full rounded-full bg-bg-muted">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--color-pri)" }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-thumb absolute left-0 top-1/2 h-5 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent"
        />
      </div>
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-pri);
          border: 2px solid #fff;
          cursor: pointer;
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-pri);
          border: 2px solid #fff;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
