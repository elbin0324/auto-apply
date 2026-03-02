import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/use-profile";
import { ProfileForm } from "@/components/profile/profile-form";
import { ResumeUpload } from "@/components/profile/resume-upload";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { EducationEditor } from "@/components/profile/education-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { PreferencesEditor } from "@/components/profile/preferences-editor";

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
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
