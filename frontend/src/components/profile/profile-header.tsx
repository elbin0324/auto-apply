import { Linkedin, Globe, MapPin, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ProfileResponse } from "@/types/profile";

interface ProfileHeaderProps {
  profile: ProfileResponse;
}

function getCompletion(profile: ProfileResponse) {
  const sections = [
    !!(profile.full_name && profile.email),
    !!profile.raw_resume_url,
    profile.experiences.length > 0,
    profile.educations.length > 0,
    profile.skills.length > 0,
  ];
  const filled = sections.filter(Boolean).length;
  return Math.round((filled / sections.length) * 100);
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = (profile.full_name ?? profile.email ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const completion = getCompletion(profile);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-accent-purple/20 text-accent-purple text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-text-primary truncate">
            {profile.full_name || "Your Name"}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
            {profile.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {profile.phone}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent-purple transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent-purple transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Completion */}
        <div className="shrink-0 text-right">
          <span className="text-xs text-text-muted">Profile</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border-subtle">
              <div
                className="h-full rounded-full bg-accent-green transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="font-mono text-sm font-semibold text-text-primary">
              {completion}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function getTabCompletion(profile: ProfileResponse) {
  return {
    profile: !!(profile.full_name && profile.email),
    resume: !!profile.raw_resume_url,
    experience: profile.experiences.length > 0,
    education: profile.educations.length > 0,
    skills: profile.skills.length > 0,
    preferences: !!profile.application_preferences,
  };
}
