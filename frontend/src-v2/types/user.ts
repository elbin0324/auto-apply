export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  onboarding_completed: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
