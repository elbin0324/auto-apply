import { useRouterState } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Section components
import { ContactCard } from "@/components/profile/contact-card";
import { ResumeCard } from "@/components/profile/resume-card";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { AccountCard } from "@/components/settings/account-card";

function sectionFromPath(pathname: string): string {
  if (pathname === "/profile/preferences") return "preferences";
  if (pathname === "/profile/applications") return "applications";
  if (pathname === "/profile/account") return "account";
  return "resume";
}

export default function ProfilePage() {
  const routerState = useRouterState();
  const section = sectionFromPath(routerState.location.pathname);

  const { data: profile, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-3.5">
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

  if (section === "resume") {
    return (
      <div className="space-y-3.5">
        <ResumeCard profile={profile} />
        <ExperienceEditor experiences={profile.experiences} profileId={profile.id} />
        <SkillsEditor skills={profile.skills} />
      </div>
    );
  }

  if (section === "preferences") {
    return (
      <Card>
        <div className="p-6">
          <h3 className="mb-2 font-mono text-[13px] font-semibold text-t-700">
            Job Preferences
          </h3>
          <p className="font-mono text-[11px] text-t-400">
            Configure your desired job titles, locations, salary range, and work type.
            Coming soon.
          </p>
        </div>
      </Card>
    );
  }

  if (section === "applications") {
    return (
      <Card>
        <div className="p-6">
          <h3 className="mb-2 font-mono text-[13px] font-semibold text-t-700">
            Application Preferences
          </h3>
          <p className="font-mono text-[11px] text-t-400">
            Set default answers for common application questions like work authorization,
            start date, and relocation preferences. Coming soon.
          </p>
        </div>
      </Card>
    );
  }

  // account
  return (
    <div className="space-y-3.5">
      <ContactCard profile={profile} />
      <div className="grid gap-3.5 md:grid-cols-2">
        <SubscriptionCard />
        <AccountCard />
      </div>
    </div>
  );
}
