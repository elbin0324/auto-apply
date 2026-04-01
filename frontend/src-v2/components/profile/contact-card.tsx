import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { Profile } from "@/types/profile";

interface ContactCardProps {
  profile: Profile;
}

export function ContactCard({ profile }: ContactCardProps) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");

  const updateProfile = useUpdateProfile();

  const resetForm = useCallback(() => {
    setFullName(profile.full_name ?? "");
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setLocation(profile.location ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setWebsiteUrl(profile.website_url ?? "");
  }, [profile]);

  const handleEdit = useCallback(() => {
    resetForm();
    setEditing(true);
  }, [resetForm]);

  const handleCancel = useCallback(() => {
    resetForm();
    setEditing(false);
  }, [resetForm]);

  const handleSave = useCallback(() => {
    updateProfile.mutate(
      {
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
        location: location || null,
        linkedin_url: linkedinUrl || null,
        website_url: websiteUrl || null,
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  }, [fullName, email, phone, location, linkedinUrl, websiteUrl, updateProfile]);

  return (
    <Card>
      <CardHeader
        title="Contact"
        right={
          !editing ? (
            <Button variant="outline" onClick={handleEdit}>
              Edit
            </Button>
          ) : undefined
        }
      />
      <div className="p-[18px]">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name"
            value={editing ? fullName : (profile.full_name ?? "")}
            onChange={editing ? setFullName : undefined}
            readOnly={!editing}
            placeholder="Jane Doe"
          />
          <Input
            label="Email"
            value={editing ? email : (profile.email ?? "")}
            onChange={editing ? setEmail : undefined}
            readOnly={!editing}
            placeholder="jane@example.com"
          />
          <Input
            label="Phone"
            value={editing ? phone : (profile.phone ?? "")}
            onChange={editing ? setPhone : undefined}
            readOnly={!editing}
            placeholder="+1 (555) 000-0000"
            mono
          />
          <Input
            label="Location"
            value={editing ? location : (profile.location ?? "")}
            onChange={editing ? setLocation : undefined}
            readOnly={!editing}
            placeholder="San Francisco, CA"
          />
        </div>
        <div className="mt-3">
          <Input
            label="LinkedIn URL"
            value={editing ? linkedinUrl : (profile.linkedin_url ?? "")}
            onChange={editing ? setLinkedinUrl : undefined}
            readOnly={!editing}
            placeholder="https://linkedin.com/in/janedoe"
            mono
          />
        </div>
        <div className="mt-3">
          <Input
            label="Website URL"
            value={editing ? websiteUrl : (profile.website_url ?? "")}
            onChange={editing ? setWebsiteUrl : undefined}
            readOnly={!editing}
            placeholder="https://janedoe.dev"
            mono
          />
        </div>
        {editing && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateProfile.isPending}
              disabled={updateProfile.isPending}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
