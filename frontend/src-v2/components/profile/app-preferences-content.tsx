import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useApplicationPreferences, useUpdateApplicationPreferences } from "@/hooks/use-application-preferences";
import { CustomAnswersEditor } from "./custom-answers-editor";
import type { ApplicationPreferences } from "@/types/profile";

function useDebouncedSave(save: (data: Partial<ApplicationPreferences>) => void, delay = 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return useCallback(
    (data: Partial<ApplicationPreferences>) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(data), delay);
    },
    [save, delay],
  );
}

function TriToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
}) {
  const options = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
    { value: null, label: "Not Set" },
  ] as const;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-mono text-[11px] text-t-700">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const isSelected = value === opt.value || (opt.value === null && value == null);
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
                isSelected
                  ? "border-pri bg-[var(--pri-bg)] text-pri"
                  : "border-border-main bg-bg-card text-t-400 hover:text-t-600"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AppPreferencesContent() {
  const { data: prefs, isLoading } = useApplicationPreferences();
  const updatePrefs = useUpdateApplicationPreferences();
  const debouncedSave = useDebouncedSave((data) => updatePrefs.mutate(data));

  const [authorizedUs, setAuthorizedUs] = useState<boolean | null>(null);
  const [authorizedCa, setAuthorizedCa] = useState<boolean | null>(null);
  const [sponsorship, setSponsorship] = useState<boolean | null>(null);
  const [relocate, setRelocate] = useState<boolean | null>(null);
  const [startDate, setStartDate] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("USD");
  const [over18, setOver18] = useState<boolean | null>(null);
  const [driversLicense, setDriversLicense] = useState<boolean | null>(null);
  const [felony, setFelony] = useState<boolean | null>(null);
  const [howHeard, setHowHeard] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!prefs) return;
    setAuthorizedUs(prefs.authorized_us ?? null);
    setAuthorizedCa(prefs.authorized_ca ?? null);
    setSponsorship(prefs.requires_sponsorship ?? null);
    setRelocate(prefs.willing_to_relocate ?? null);
    setStartDate(prefs.earliest_start_date ?? "");
    setNoticePeriod(prefs.notice_period_days != null ? String(prefs.notice_period_days) : "");
    setSalaryMin(prefs.desired_salary_min != null ? String(prefs.desired_salary_min) : "");
    setSalaryMax(prefs.desired_salary_max != null ? String(prefs.desired_salary_max) : "");
    setSalaryCurrency(prefs.salary_currency ?? "USD");
    setOver18(prefs.over_18 ?? null);
    setDriversLicense(prefs.has_drivers_license ?? null);
    setFelony(prefs.felony_conviction ?? null);
    setHowHeard(prefs.how_did_you_hear ?? "");
    setCustomAnswers(prefs.custom_answers ?? {});
  }, [prefs]);

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const saveToggle = (field: keyof ApplicationPreferences) => (v: boolean | null) => {
    const setter: Record<string, (v: boolean | null) => void> = {
      authorized_us: setAuthorizedUs,
      authorized_ca: setAuthorizedCa,
      requires_sponsorship: setSponsorship,
      willing_to_relocate: setRelocate,
      over_18: setOver18,
      has_drivers_license: setDriversLicense,
      felony_conviction: setFelony,
    };
    setter[field]?.(v);
    updatePrefs.mutate({ [field]: v });
  };

  return (
    <div className="space-y-3.5">
      <Card>
        <CardHeader title="Work Authorization" />
        <div className="p-[18px]">
          <TriToggle label="Authorized to work in the US" value={authorizedUs} onChange={saveToggle("authorized_us")} />
          <TriToggle label="Authorized to work in Canada" value={authorizedCa} onChange={saveToggle("authorized_ca")} />
          <TriToggle label="Requires visa sponsorship" value={sponsorship} onChange={saveToggle("requires_sponsorship")} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Availability" />
        <div className="p-[18px] space-y-3">
          <TriToggle label="Willing to relocate" value={relocate} onChange={saveToggle("willing_to_relocate")} />
          <Input
            label="Earliest Start Date"
            value={startDate}
            onChange={(v) => { setStartDate(v); debouncedSave({ earliest_start_date: v || null }); }}
            placeholder="2026-05-01"
            mono
          />
          <Input
            label="Notice Period (days)"
            value={noticePeriod}
            onChange={(v) => { setNoticePeriod(v); debouncedSave({ notice_period_days: v ? Number(v) : null }); }}
            placeholder="14"
            mono
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Desired Compensation" />
        <div className="p-[18px]">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Minimum"
              value={salaryMin}
              onChange={(v) => { setSalaryMin(v); debouncedSave({ desired_salary_min: v ? Number(v) : null }); }}
              placeholder="80000"
              mono
            />
            <Input
              label="Maximum"
              value={salaryMax}
              onChange={(v) => { setSalaryMax(v); debouncedSave({ desired_salary_max: v ? Number(v) : null }); }}
              placeholder="150000"
              mono
            />
            <Input
              label="Currency"
              value={salaryCurrency}
              onChange={(v) => { setSalaryCurrency(v); debouncedSave({ salary_currency: v || "USD" }); }}
              placeholder="USD"
              mono
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Background" />
        <div className="p-[18px] space-y-3">
          <TriToggle label="Over 18 years old" value={over18} onChange={saveToggle("over_18")} />
          <TriToggle label="Has driver's license" value={driversLicense} onChange={saveToggle("has_drivers_license")} />
          <TriToggle label="Felony conviction" value={felony} onChange={saveToggle("felony_conviction")} />
          <Input
            label="'How did you hear about us?' default answer"
            value={howHeard}
            onChange={(v) => { setHowHeard(v); debouncedSave({ how_did_you_hear: v || null }); }}
            placeholder="LinkedIn"
          />
        </div>
      </Card>

      <CustomAnswersEditor
        answers={customAnswers}
        onSave={(v) => { setCustomAnswers(v); debouncedSave({ custom_answers: v }); }}
      />
    </div>
  );
}
