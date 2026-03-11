import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface ContactFormData {
  full_name: string;
  email: string;
  phone: string;
  location: string;
}

interface StepContactProps {
  data: ContactFormData;
  onChange: (data: ContactFormData) => void;
}

export function StepContact({ data, onChange }: StepContactProps) {
  function update(field: keyof ContactFormData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="mb-1 font-mono text-sm font-bold text-t-900">
          Tell us about yourself
        </h2>
        <p className="mb-6 font-mono text-[11px] text-t-500">
          Basic contact information for your applications.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full Name *"
            value={data.full_name}
            onChange={(v) => update("full_name", v)}
            placeholder="Jane Doe"
          />
          <Input
            label="Email *"
            value={data.email}
            onChange={(v) => update("email", v)}
            placeholder="jane@example.com"
          />
          <Input
            label="Phone"
            value={data.phone}
            onChange={(v) => update("phone", v)}
            placeholder="+1 (555) 123-4567"
          />
          <Input
            label="Location"
            value={data.location}
            onChange={(v) => update("location", v)}
            placeholder="Toronto, ON"
          />
        </div>
      </div>
    </Card>
  );
}
