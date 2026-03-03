import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { ProfileResponse } from "@/types/profile";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email").min(1, "Email is required"),
  phone: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  linkedin_url: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface StepProfileProps {
  profile?: ProfileResponse;
  onNext: () => void;
  onBack: () => void;
}

export function StepProfile({ profile, onNext, onBack }: StepProfileProps) {
  const mutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      linkedin_url: profile?.linkedin_url ?? "",
    },
  });

  // Re-populate form when profile data changes (e.g. after resume parse)
  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
        linkedin_url: profile.linkedin_url ?? "",
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: FormData) => {
    mutation.mutate(data, {
      onSuccess: () => onNext(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          Your information
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {profile?.raw_resume_url
            ? "We pre-filled this from your resume. Review and correct anything."
            : "Tell us about yourself so we can fill out applications for you."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-text-secondary">
              Full Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Jane Smith"
              className="border-border-card bg-bg focus:border-accent-purple"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-sm text-red-400">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-text-secondary">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              className="border-border-card bg-bg focus:border-accent-purple"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-text-secondary">
              Phone
            </Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              className="border-border-card bg-bg focus:border-accent-purple"
              {...register("phone")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-text-secondary">
              Location
            </Label>
            <Input
              id="location"
              placeholder="San Francisco, CA"
              className="border-border-card bg-bg focus:border-accent-purple"
              {...register("location")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="linkedin_url" className="text-text-secondary">
            LinkedIn URL
          </Label>
          <Input
            id="linkedin_url"
            placeholder="https://linkedin.com/in/janesmith"
            className="border-border-card bg-bg focus:border-accent-purple"
            {...register("linkedin_url")}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400">
            Failed to save. Please try again.
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-accent-purple hover:bg-accent-purple/90"
          >
            {mutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
