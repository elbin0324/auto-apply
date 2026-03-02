export interface ExperienceCreate {
  company: string;
  title: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  bullets: string[];
  sort_order: number;
}

export interface ExperienceResponse extends ExperienceCreate {
  id: string;
  profile_id: string;
}

export interface EducationCreate {
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  gpa?: string | null;
  sort_order: number;
}

export interface EducationResponse extends EducationCreate {
  id: string;
  profile_id: string;
}

export interface SkillCreate {
  name: string;
  category: string;
  proficiency: string;
}

export interface SkillResponse extends SkillCreate {
  id: string;
  profile_id: string;
}

export interface ApplicationPreferences {
  authorized_us?: boolean | null;
  authorized_ca?: boolean | null;
  requires_sponsorship?: boolean | null;
  willing_to_relocate?: boolean | null;
  earliest_start_date?: string | null;
  notice_period_days?: number | null;
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  salary_currency: string;
  over_18?: boolean | null;
  has_drivers_license?: boolean | null;
  felony_conviction?: boolean | null;
  how_did_you_hear?: string | null;
  custom_answers: Record<string, string>;
}

export interface ApplicationPreferencesUpdate {
  authorized_us?: boolean | null;
  authorized_ca?: boolean | null;
  requires_sponsorship?: boolean | null;
  willing_to_relocate?: boolean | null;
  earliest_start_date?: string | null;
  notice_period_days?: number | null;
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  salary_currency?: string;
  over_18?: boolean | null;
  has_drivers_license?: boolean | null;
  felony_conviction?: boolean | null;
  how_did_you_hear?: string | null;
  custom_answers?: Record<string, string>;
}

export interface ProfileUpdate {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  summary?: string | null;
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  summary?: string | null;
  raw_resume_url?: string | null;
  resume_updated_at?: string | null;
  application_preferences?: ApplicationPreferences | null;
  experiences: ExperienceResponse[];
  educations: EducationResponse[];
  skills: SkillResponse[];
}

export interface ParsedResume {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  summary?: string | null;
  experiences: ExperienceCreate[];
  educations: EducationCreate[];
  skills: SkillCreate[];
  raw_text: string;
}
