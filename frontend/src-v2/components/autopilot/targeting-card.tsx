import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import type { AutoApplyConfig } from "@/types/auto-apply";

interface TargetingCardProps {
  config: AutoApplyConfig | undefined;
  onSave: (data: Partial<AutoApplyConfig>) => void;
}

export function TargetingCard({ config, onSave }: TargetingCardProps) {
  const [titles, setTitles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync state from config when it changes
  useEffect(() => {
    if (config) {
      setTitles(config.target_titles ?? []);
      setLocations(config.target_locations ?? []);
      setExcluded(config.excluded_companies ?? []);
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

  const handleTitlesChange = (newTitles: string[]) => {
    setTitles(newTitles);
    debouncedSave({ target_titles: newTitles });
  };

  const handleLocationsChange = (newLocations: string[]) => {
    setLocations(newLocations);
    debouncedSave({ target_locations: newLocations });
  };

  const handleExcludedChange = (newExcluded: string[]) => {
    setExcluded(newExcluded);
    debouncedSave({ excluded_companies: newExcluded });
  };

  return (
    <Card>
      <CardHeader title="TARGETING" />
      <div className="flex flex-col gap-4 p-4">
        <TagInput
          label="JOB TITLES"
          tags={titles}
          onChange={handleTitlesChange}
          placeholder="e.g. Software Engineer"
        />
        <TagInput
          label="LOCATIONS"
          tags={locations}
          onChange={handleLocationsChange}
          placeholder="e.g. San Francisco, Remote"
        />
        <TagInput
          label="EXCLUDED COMPANIES"
          tags={excluded}
          onChange={handleExcludedChange}
          placeholder="e.g. Company Name"
          variant="danger"
        />
      </div>
    </Card>
  );
}
