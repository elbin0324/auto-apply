import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageEnter } from "@/hooks/use-page-enter";
import { useProfile } from "@/hooks/use-profile";
import {
  ProfileHeader,
  getTabCompletion,
} from "@/components/profile/profile-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ResumeUpload } from "@/components/profile/resume-upload";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { EducationEditor } from "@/components/profile/education-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { PreferencesEditor } from "@/components/profile/preferences-editor";

const tabs = [
  { value: "profile", label: "Profile" },
  { value: "resume", label: "Resume" },
  { value: "experience", label: "Experience" },
  { value: "education", label: "Education" },
  { value: "skills", label: "Skills" },
  { value: "preferences", label: "Preferences" },
] as const;

export default function ProfilePage() {
  const pageRef = usePageEnter();
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 page-enter">
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    );
  }

  const completion = getTabCompletion(profile);

  return (
    <div ref={pageRef} className="mx-auto max-w-3xl space-y-6">
      <ProfileHeader profile={profile} />

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  completion[tab.value]
                    ? "bg-accent-green"
                    : "bg-border-subtle"
                }`}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm profile={profile} />
        </TabsContent>

        <TabsContent value="resume" className="mt-6">
          <ResumeUpload profile={profile} />
        </TabsContent>

        <TabsContent value="experience" className="mt-6">
          <ExperienceEditor experiences={profile.experiences} />
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <EducationEditor educations={profile.educations} />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsEditor skills={profile.skills} />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <PreferencesEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
