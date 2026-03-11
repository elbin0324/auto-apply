import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { ProfileResponse } from "@/types/profile";

const baseSchema = z.object({
  full_name: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  summary: z.string().optional().or(z.literal("")),
});

const onboardingSchema = baseSchema.extend({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email").min(1, "Email is required"),
});

type FormData = z.infer<typeof baseSchema>;

interface ProfileFormProps {
  profile: ProfileResponse;
  mode?: "standalone" | "onboarding";
  onSubmitSuccess?: () => void;
  footer?: React.ReactNode;
}

export function ProfileForm({
  profile,
  mode = "standalone",
  onSubmitSuccess,
  footer,
}: ProfileFormProps) {
  const updateProfile = useUpdateProfile();

  const schema = mode === "onboarding" ? onboardingSchema : baseSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      linkedin_url: profile.linkedin_url ?? "",
      website_url: profile.website_url ?? "",
      summary: profile.summary ?? "",
    },
  });

  useEffect(() => {
    reset({
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      linkedin_url: profile.linkedin_url ?? "",
      website_url: profile.website_url ?? "",
      summary: profile.summary ?? "",
    });
  }, [profile, reset]);

  const onSubmit = (data: FormData) => {
    const payload: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(data)) {
      payload[key] = value || null;
    }
    updateProfile.mutate(payload, {
      onSuccess: () => onSubmitSuccess?.(),
    });
  };

  const isOnboarding = mode === "onboarding";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">
            Full Name{isOnboarding && <span className="text-red-400"> *</span>}
          </Label>
          <Input id="full_name" placeholder="Jane Doe" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-xs text-red-400">{errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email{isOnboarding && <span className="text-red-400"> *</span>}
          </Label>
          <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+1 (555) 000-0000" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="San Francisco, CA" {...register("location")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="linkedin_url">LinkedIn URL</Label>
          <Input id="linkedin_url" placeholder="https://linkedin.com/in/..." {...register("linkedin_url")} />
          {errors.linkedin_url && (
            <p className="text-xs text-red-400">{errors.linkedin_url.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website_url">Website URL</Label>
          <Input id="website_url" placeholder="https://..." {...register("website_url")} />
          {errors.website_url && (
            <p className="text-xs text-red-400">{errors.website_url.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          rows={4}
          placeholder="Brief professional summary..."
          {...register("summary")}
        />
      </div>

      {updateProfile.isError && (
        <p className="text-sm text-red-400">
          Failed to save. Please try again.
        </p>
      )}

      {footer ? (
        footer
      ) : (
        <>
          <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
            {updateProfile.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save Profile
          </Button>

          {updateProfile.isSuccess && (
            <p className="text-sm text-accent-green">Profile updated.</p>
          )}
        </>
      )}
    </form>
  );
}
