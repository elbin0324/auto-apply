import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  const completion = getTabCompletion(profile);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
