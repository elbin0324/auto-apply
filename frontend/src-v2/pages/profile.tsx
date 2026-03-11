import { useProfile } from "@/hooks/use-profile";
import { ContactCard } from "@/components/profile/contact-card";
import { ResumeCard } from "@/components/profile/resume-card";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { SkeletonCard } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <div className="grid gap-3.5 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-[13px] text-t-400">
          Unable to load profile. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Row 1: Contact + Resume side by side */}
      <div className="grid gap-3.5 md:grid-cols-2">
        <ContactCard profile={profile} />
        <ResumeCard profile={profile} />
      </div>

      {/* Row 2: Experience — full width */}
      <ExperienceEditor experiences={profile.experiences} profileId={profile.id} />

      {/* Row 3: Skills — full width */}
      <SkillsEditor skills={profile.skills} />
    </div>
  );
}
