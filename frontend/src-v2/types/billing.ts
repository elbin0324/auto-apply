export interface PlanDetail {
  name: string;
  display_name: string;
  price_cents: number;
  quota: number;
  features: string[];
}

export interface PlansResponse {
  plans: PlanDetail[];
}

export interface SubscriptionStatus {
  plan: string | null;
  status: string | null;
  applications_used: number;
  quota: number;
  remaining: number;
  current_period_end: string | null;
  is_whitelisted: boolean;
}

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export interface PortalSession {
  portal_url: string;
}

export interface BillingError {
  code: "no_subscription" | "quota_exceeded";
  message: string;
  plan?: string;
  quota?: number;
  applications_used?: number;
  next_plan?: string;
}
