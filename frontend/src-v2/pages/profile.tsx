import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Tab content components
import { ContactCard } from "@/components/profile/contact-card";
import { ResumeCard } from "@/components/profile/resume-card";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { AccountCard } from "@/components/settings/account-card";

const TABS = [
  { id: "resume", label: "Resume & Experience", path: "/profile/resume" },
  { id: "preferences", label: "Job Preferences", path: "/profile/preferences" },
  { id: "applications", label: "Application Preferences", path: "/profile/applications" },
  { id: "account", label: "Account", path: "/profile/account" },
] as const;

function activeTabFromPath(pathname: string): string {
  const tab = TABS.find((t) => t.path === pathname);
  return tab?.id ?? "resume";
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const activeTab = activeTabFromPath(routerState.location.pathname);

  const { data: profile, isLoading, isError } = useProfile();

  const handleTabClick = (path: string) => {
    navigate({ to: path });
  };

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <div className="flex gap-1.5 border-b border-border-main pb-3">
          {TABS.map((t) => (
            <div key={t.id} className="h-8 w-32 animate-pulse rounded bg-bg-muted" />
          ))}
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
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--tw-10)" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={cn(
                "cursor-pointer px-4 py-2.5 font-mono text-[11px] font-medium transition-colors",
                "border-b-2 -mb-px",
                isActive
                  ? "border-pri text-pri"
                  : "border-transparent text-t-400 hover:text-t-600",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "resume" && (
        <div className="space-y-3.5">
          <div className="grid gap-3.5 md:grid-cols-2">
            <ResumeCard profile={profile} />
          </div>
          <ExperienceEditor experiences={profile.experiences} profileId={profile.id} />
          <SkillsEditor skills={profile.skills} />
        </div>
      )}

      {activeTab === "preferences" && (
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
      )}

      {activeTab === "applications" && (
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
      )}

      {activeTab === "account" && (
        <div className="space-y-3.5">
          <ContactCard profile={profile} />
          <div className="grid gap-3.5 md:grid-cols-2">
            <SubscriptionCard />
            <AccountCard />
          </div>
        </div>
      )}
    </div>
  );
}
