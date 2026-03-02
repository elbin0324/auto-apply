import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import AutoApplyPage from "@/pages/auto-apply";
import ApplicationsPage from "@/pages/applications";
import ApplicationDetailPage from "@/pages/application-detail";

const rootRoute = createRootRoute({
  component: Outlet,
});

// Public routes
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

// Protected routes (wrapped with dashboard layout)
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <ProtectedRoute>
      <DashboardLayout>
        <ProfilePage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

const jobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs",
  component: () => (
    <ProtectedRoute>
      <DashboardLayout>
        <JobsPage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

const jobDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs/$jobId",
  component: () => (
    <ProtectedRoute>
      <DashboardLayout>
        <JobDetailPage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

const autoApplyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auto-apply",
  component: () => (
    <ProtectedRoute>
      <DashboardLayout>
        <AutoApplyPage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications",
  component: () => (
    <ProtectedRoute>
      <DashboardLayout>
        <ApplicationsPage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

const applicationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications/$applicationId",
  component: () => (
    <ProtectedRoute>
      <DashboardLayout>
        <ApplicationDetailPage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  loginRoute,
  signupRoute,
  dashboardRoute,
  profileRoute,
  jobsRoute,
  jobDetailRoute,
  autoApplyRoute,
  applicationsRoute,
  applicationDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
