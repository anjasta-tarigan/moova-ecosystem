import React, { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import LoadingSpinner from "./components/LoadingSpinner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProgramsPage = lazy(() => import("./pages/ProgramsPage"));
const ProgramDetailPage = lazy(() => import("./pages/ProgramDetailPage"));
const PartnersPage = lazy(() => import("./pages/PartnersPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));
const CertificateVerificationPage = lazy(
  () => import("./pages/CertificateVerificationPage"),
);

const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DashboardEventHub = lazy(() => import("./pages/DashboardEventHub"));
const DashboardEventDetail = lazy(() => import("./pages/DashboardEventDetail"));
const DashboardWorkspaceEntry = lazy(
  () => import("./pages/DashboardWorkspaceEntry"),
);
const DashboardEventCommunity = lazy(
  () => import("./pages/DashboardEventCommunity"),
);
const DashboardTeam = lazy(() => import("./pages/DashboardTeam"));
const DashboardSubmission = lazy(() => import("./pages/DashboardSubmission"));
const DashboardCertificates = lazy(
  () => import("./pages/DashboardCertificates"),
);
const DashboardProfile = lazy(() => import("./pages/DashboardProfile"));

const JudgeHome = lazy(() => import("./pages/JudgeHome"));
const JudgeDashboard = lazy(() => import("./pages/JudgeDashboard"));
const JudgeEventView = lazy(() => import("./pages/JudgeEventView"));
const JudgeScoringView = lazy(() => import("./pages/JudgeScoringView"));
const JudgeCertificates = lazy(() => import("./pages/JudgeCertificates"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminSiswa = lazy(() => import("./pages/admin/AdminSiswa"));
const AdminSiswaDetail = lazy(() => import("./pages/admin/AdminSiswaDetail"));
const AdminCertificates = lazy(() => import("./pages/admin/AdminCertificates"));
const CertificateCreator = lazy(
  () => import("./pages/admin/CertificateCreator"),
);
const EventCertificateView = lazy(
  () => import("./pages/admin/EventCertificateView"),
);
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));

const SuperAdminDashboard = lazy(
  () => import("./pages/superadmin/SuperAdminDashboard"),
);
const SuperAdminUsers = lazy(
  () => import("./pages/superadmin/SuperAdminUsers"),
);
const SuperAdminJudgeAssignments = lazy(
  () => import("./pages/superadmin/SuperAdminJudgeAssignments"),
);
const ManageEvent = lazy(() => import("./pages/superadmin/ManageEvent"));
const ManageEventCardForm = lazy(
  () => import("./pages/superadmin/ManageEventCardForm"),
);

// Helper to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = window.location;
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }
  >
    {children}
  </Suspense>
);

// Layout for main pages (includes Navbar and Footer)
const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const AuthGuard = () => {
  const user = localStorage.getItem("giva_user");
  if (!user) return <Navigate to="/login" replace />;

  const parsedUser = JSON.parse(user);

  // Redirect admin/superadmin away from participant dashboard
  if (parsedUser.role === "SUPERADMIN") {
    return <Navigate to="/superadmin" replace />;
  }
  if (parsedUser.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <DashboardLayout />;
};

const RoleGuard = ({
  children,
  allowedRoles,
}: {
  children?: React.ReactNode;
  allowedRoles: string[];
}) => {
  const userStr = localStorage.getItem("giva_user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "SUPERADMIN") {
      return <Navigate to="/superadmin" replace />;
    } else if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    } else if (user.role === "JUDGE") {
      return <Navigate to="/dashboard/judge" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return <>{children}</>;
};

const AdminGuard: React.FC = () => {
  const { user, isLoading } = useAuthContext();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!["ADMIN", "SUPERADMIN"].includes(user.role))
    return <Navigate to="/" replace />;
  return <AdminLayout />;
};

const SuperAdminGuard: React.FC = () => {
  const { user, isLoading } = useAuthContext();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "SUPERADMIN") return <Navigate to="/" replace />;
  return <AdminLayout />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <ScrollToTop />
        <SuspenseWrapper>
          <Routes>
            {/* Main Application Routes (Public) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/programs/:id" element={<ProgramDetailPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route
                path="/ecosystem"
                element={<Navigate to="/programs" replace />}
              />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route
                path="/verify/:id"
                element={<CertificateVerificationPage />}
              />
            </Route>

            {/* Auth Routes */}
            <Route path="/join" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />

            {/* Dashboard Routes - Protected */}
            <Route path="/dashboard" element={<AuthGuard />}>
              {/* Participant / User Dashboard */}
              <Route
                index
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardPage />
                  </RoleGuard>
                }
              />

              {/* Participant Specific Routes */}
              <Route
                path="events"
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardEventHub />
                  </RoleGuard>
                }
              />
              <Route
                path="events/:slug"
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardEventDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="workspace/:slug"
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardWorkspaceEntry />
                  </RoleGuard>
                }
              />
              <Route
                path="workspace/:slug/community"
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardEventCommunity />
                  </RoleGuard>
                }
              />
              <Route
                path="event/list"
                element={<Navigate to="/dashboard/events" replace />}
              />
              <Route
                path="event/:id"
                element={<Navigate to="/dashboard/events" replace />}
              />
              <Route
                path="team/:id"
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardTeam />
                  </RoleGuard>
                }
              />
              <Route
                path="submission/:id"
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardSubmission />
                  </RoleGuard>
                }
              />
              <Route
                path="certificates"
                element={
                  <RoleGuard allowedRoles={["STUDENT"]}>
                    <DashboardCertificates />
                  </RoleGuard>
                }
              />

              {/* Shared Profile Route */}
              <Route path="profile" element={<DashboardProfile />} />

              {/* Judge Module Routes */}
              <Route
                path="judge"
                element={
                  <RoleGuard allowedRoles={["JUDGE"]}>
                    <Outlet />
                  </RoleGuard>
                }
              >
                <Route index element={<JudgeHome />} />
                <Route path="events" element={<JudgeDashboard />} />
                {/* New Route Structure: Event -> Category Workspace */}
                <Route
                  path="events/:eventId/category/:categoryId"
                  element={<JudgeEventView />}
                />
                {/* Scoring Route: Event -> Round -> Submission */}
                <Route
                  path="events/:eventId/round/:roundId/submission/:submissionId"
                  element={<JudgeScoringView />}
                />
                <Route path="certificates" element={<JudgeCertificates />} />
                <Route path="profile" element={<DashboardProfile />} />
              </Route>
              <Route path="*" element={<DashboardPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminGuard />}>
              <Route index element={<AdminDashboard />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="events/:id/edit" element={<ManageEvent />} />
              <Route
                path="events/:id/edit/:cardKey"
                element={<ManageEventCardForm />}
              />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="siswa" element={<AdminSiswa />} />
              <Route path="siswa/:id" element={<AdminSiswaDetail />} />
              <Route path="certificates" element={<AdminCertificates />} />
              <Route
                path="certificates/create"
                element={<CertificateCreator />}
              />
              <Route
                path="certificates/event/:eventId"
                element={<EventCertificateView />}
              />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            <Route path="/superadmin" element={<SuperAdminGuard />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="users" element={<SuperAdminUsers />} />
              <Route
                path="assignments"
                element={<SuperAdminJudgeAssignments />}
              />

              {/* Mirror semua admin pages di bawah /superadmin/* */}
              <Route path="events" element={<AdminEvents />} />
              <Route
                path="events/new"
                element={<Navigate to="/superadmin/events" replace />}
              />
              <Route path="events/:id/edit" element={<ManageEvent />} />
              <Route
                path="events/:id/edit/:cardKey"
                element={<ManageEventCardForm />}
              />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="siswa" element={<AdminSiswa />} />
              <Route path="siswa/:id" element={<AdminSiswaDetail />} />
              <Route path="certificates" element={<AdminCertificates />} />
              <Route
                path="certificates/create"
                element={<CertificateCreator />}
              />
              <Route
                path="certificates/event/:eventId"
                element={<EventCertificateView />}
              />
              <Route path="reports" element={<AdminReports />} />
            </Route>
          </Routes>
        </SuspenseWrapper>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
