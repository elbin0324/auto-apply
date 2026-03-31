import { lazy, Suspense } from "react";
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AuthOnlyRoute } from "@/components/layout/auth-only-route";

const LoginPage = lazy(() => import("@/pages/login"));
const SignupPage = lazy(() => import("@/pages/signup"));
const JobsPage = lazy(() => import("@/pages/jobs"));
const ApplicationsPage = lazy(() => import("@/pages/applications"));
const AutopilotPage = lazy(() => import("@/pages/autopilot"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const LandingPage = lazy(() => import("@/pages/landing"));
const BillingPage = lazy(() => import("@/pages/billing"));
const KitchenSinkPage = lazy(() => import("@/pages/kitchen-sink"));

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-pri border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const rootRoute = createRootRoute({
  component: Outlet,
});

// Helper for public route guards
function redirectIfAuthenticated() {
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) {
    throw redirect({ to: "/" });
  }
}

// Helper for protected route guards
function requireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore.getState();
  if (!isLoading && !isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <PageSuspense><LoginPage /></PageSuspense>,
  beforeLoad: redirectIfAuthenticated,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: () => <PageSuspense><SignupPage /></PageSuspense>,
  beforeLoad: redirectIfAuthenticated,
});

// Onboarding (auth required, no dashboard layout)
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <AuthOnlyRoute>
      <PageSuspense><OnboardingPage /></PageSuspense>
    </AuthOnlyRoute>
  ),
  beforeLoad: requireAuth,
});

// Protected routes (auth + dashboard layout)
function protectedPage(Page: React.LazyExoticComponent<() => React.JSX.Element>) {
  return () => (
    <ProtectedRoute>
      <PageSuspense><Page /></PageSuspense>
    </ProtectedRoute>
  );
}

// Index route: Landing for unauthenticated, Jobs for authenticated
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) {
      return <PageSuspense><LandingPage /></PageSuspense>;
    }
    return (
      <ProtectedRoute>
        <PageSuspense><JobsPage /></PageSuspense>
      </ProtectedRoute>
    );
  },
});

const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications",
  component: protectedPage(ApplicationsPage),
  beforeLoad: requireAuth,
});

const autopilotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/autopilot",
  component: protectedPage(AutopilotPage),
  beforeLoad: requireAuth,
});

// Profile routes — parent redirects to /profile/resume
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: () => {
    requireAuth();
    throw redirect({ to: "/profile/resume" });
  },
});

const profileResumeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/resume",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const profilePreferencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/preferences",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const profileApplicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/applications",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const profileAccountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/account",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const billingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/billing",
  component: protectedPage(BillingPage),
  beforeLoad: requireAuth,
});

// Kitchen sink (dev only, no auth)
const kitchenSinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kitchen-sink",
  component: () => <PageSuspense><KitchenSinkPage /></PageSuspense>,
});


// Legacy redirects — old routes point to new locations
const dashboardRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => { throw redirect({ to: "/" }); },
});

const jobsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs",
  beforeLoad: () => { throw redirect({ to: "/" }); },
});

const queueRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/queue",
  beforeLoad: () => { throw redirect({ to: "/applications" }); },
});

const trackerRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tracker",
  beforeLoad: () => { throw redirect({ to: "/applications" }); },
});

const analyticsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  beforeLoad: () => { throw redirect({ to: "/applications" }); },
});

const settingsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  beforeLoad: () => { throw redirect({ to: "/profile/account" }); },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  onboardingRoute,
  applicationsRoute,
  autopilotRoute,
  profileRoute,
  profileResumeRoute,
  profilePreferencesRoute,
  profileApplicationsRoute,
  profileAccountRoute,
  billingRoute,
  kitchenSinkRoute,
  // Legacy redirects
  dashboardRedirect,
  jobsRedirect,
  queueRedirect,
  trackerRedirect,
  analyticsRedirect,
  settingsRedirect,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
