import { useRouterState } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { SkeletonCard } from "@/components/ui/skeleton";

// Resume page components
import { ResumeDocCard } from "@/components/profile/resume-doc-card";
import { ContactCard } from "@/components/profile/contact-card";
import { SummaryCard } from "@/components/profile/summary-card";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { EducationEditor } from "@/components/profile/education-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";

// Account page components
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { AccountCard } from "@/components/settings/account-card";

// Preferences page components
import { JobPreferencesContent } from "@/components/profile/job-preferences-content";
import { AppPreferencesContent } from "@/components/profile/app-preferences-content";

function sectionFromPath(pathname: string): string {
  if (pathname === "/profile/preferences") return "preferences";
  if (pathname === "/profile/applications") return "applications";
  if (pathname === "/profile/account") return "account";
  return "resume";
}

export default function ProfilePage() {
  const routerState = useRouterState();
  const section = sectionFromPath(routerState.location.pathname);

  // Profile is needed for resume + account sections
  const { data: profile, isLoading, isError } = useProfile();

  // Job Preferences and App Preferences don't need profile data
  if (section === "preferences") {
    return <JobPreferencesContent />;
  }

  if (section === "applications") {
    return <AppPreferencesContent />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <SkeletonCard />
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

  if (section === "account") {
    return (
      <div className="space-y-3.5">
        <SubscriptionCard />
        <AccountCard />
      </div>
    );
  }

  // Resume section (default)
  return (
    <div className="space-y-3.5">
      <ResumeDocCard profile={profile} />
      <ContactCard profile={profile} />
      <SummaryCard summary={profile.summary} />
      <ExperienceEditor experiences={profile.experiences} profileId={profile.id} />
      <EducationEditor educations={profile.educations} profileId={profile.id} />
      <SkillsEditor skills={profile.skills} />
    </div>
  );
}
