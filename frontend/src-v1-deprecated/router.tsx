import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AdminRoute } from "@/components/layout/admin-route";
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
import OnboardingPage from "@/pages/onboarding";
import { AuthOnlyRoute } from "@/components/layout/auth-only-route";
import AdminOverviewPage from "@/pages/admin/overview";
import AdminUsersPage from "@/pages/admin/users";
import AdminQueuesPage from "@/pages/admin/queues";
import AdminDataPage from "@/pages/admin/data-management";
import AdminWorkersPage from "@/pages/admin/workers";

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

// Onboarding route (auth-only, no dashboard layout, no onboarding check)
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <AuthOnlyRoute>
      <OnboardingPage />
    </AuthOnlyRoute>
  ),
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

// Admin routes
const adminOverviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AdminRoute>
      <DashboardLayout>
        <AdminOverviewPage />
      </DashboardLayout>
    </AdminRoute>
  ),
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/users",
  component: () => (
    <AdminRoute>
      <DashboardLayout>
        <AdminUsersPage />
      </DashboardLayout>
    </AdminRoute>
  ),
});

const adminQueuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/queues",
  component: () => (
    <AdminRoute>
      <DashboardLayout>
        <AdminQueuesPage />
      </DashboardLayout>
    </AdminRoute>
  ),
});

const adminDataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/data",
  component: () => (
    <AdminRoute>
      <DashboardLayout>
        <AdminDataPage />
      </DashboardLayout>
    </AdminRoute>
  ),
});

const adminWorkersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/workers",
  component: () => (
    <AdminRoute>
      <DashboardLayout>
        <AdminWorkersPage />
      </DashboardLayout>
    </AdminRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  loginRoute,
  signupRoute,
  onboardingRoute,
  dashboardRoute,
  profileRoute,
  jobsRoute,
  jobDetailRoute,
  autoApplyRoute,
  applicationsRoute,
  applicationDetailRoute,
  adminOverviewRoute,
  adminUsersRoute,
  adminQueuesRoute,
  adminDataRoute,
  adminWorkersRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
