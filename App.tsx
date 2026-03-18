import React from "react";
import { HashRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import ProgramsPage from "./pages/ProgramsPage";
import ProgramDetailPage from "./pages/ProgramDetailPage";
import PartnersPage from "./pages/PartnersPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import CalendarPage from "./pages/CalendarPage";
import CommunityPage from "./pages/CommunityPage";
import AuthPage from "./pages/AuthPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiesPage from "./pages/CookiesPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import DashboardEventHub from "./pages/DashboardEventHub";
import DashboardTeam from "./pages/DashboardTeam";
import DashboardSubmission from "./pages/DashboardSubmission";
import DashboardCertificates from "./pages/DashboardCertificates";
import DashboardProfile from "./pages/DashboardProfile"; // Ensure this is imported
import CertificateVerificationPage from "./pages/CertificateVerificationPage";
import JudgeHome from "./pages/JudgeHome";
import JudgeDashboard from "./pages/JudgeDashboard";
import JudgeEventView from "./pages/JudgeEventView";
import JudgeScoringView from "./pages/JudgeScoringView";
import JudgeCertificates from "./pages/JudgeCertificates";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminEventForm from "./pages/admin/AdminEventForm";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminSiswa from "./pages/admin/AdminSiswa";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminReports from "./pages/admin/AdminReports";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminUsers from "./pages/superadmin/SuperAdminUsers";
import SuperAdminJudgeAssignments from "./pages/superadmin/SuperAdminJudgeAssignments.tsx";
import useAuth from "./hooks/useAuth";

// Helper to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = window.location;
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

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

// Auth Guard: Ensures user is logged in via context
const AuthGuard = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
};

// Role Guard: Restricts access based on user role
const RoleGuard = ({
  children,
  allowedRoles,
}: {
  children?: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    // Role-based redirection logic
    if (user.role === "JURI") {
      return <Navigate to="/dashboard/judge" replace />;
    }
    if (user.role === "SUPERADMIN") {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Default for SISWA/others
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <ScrollToTop />
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
                <RoleGuard
                  allowedRoles={["SISWA"]}
                >
                  <DashboardPage />
                </RoleGuard>
              }
            />

            {/* Participant Specific Routes */}
            <Route
              path="event/:id"
              element={
                <RoleGuard
                  allowedRoles={["SISWA"]}
                >
                  <DashboardEventHub />
                </RoleGuard>
              }
            />
            <Route
              path="team/:id"
              element={
                <RoleGuard
                  allowedRoles={["SISWA"]}
                >
                  <DashboardTeam />
                </RoleGuard>
              }
            />
            <Route
              path="submission/:id"
              element={
                <RoleGuard
                  allowedRoles={["SISWA"]}
                >
                  <DashboardSubmission />
                </RoleGuard>
              }
            />
            <Route
              path="certificates"
              element={
                <RoleGuard
                  allowedRoles={[
                    "participant",
                    "team_leader",
                    "team_member",
                    "guest",
                    "partner",
                    "mentor",
                  ]}
                >
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
                <RoleGuard allowedRoles={["JURI"]}>
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

            {/* Placeholder for Admin if needed later */}
            <Route
              path="admin"
              element={
                <RoleGuard allowedRoles={["ADMIN", "SUPERADMIN"]}>
                  <div className="p-8">Admin Dashboard Placeholder</div>
                </RoleGuard>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<DashboardPage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={["ADMIN", "SUPERADMIN"]}>
                <AdminLayout />
              </RoleGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/new" element={<AdminEventForm />} />
            <Route path="events/:id" element={<AdminEventForm />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="siswa" element={<AdminSiswa />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

          {/* Super Admin Routes */}
          <Route
            path="/superadmin"
            element={
              <RoleGuard allowedRoles={["SUPERADMIN"]}>
                <AdminLayout />
              </RoleGuard>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="users" element={<SuperAdminUsers />} />
            <Route
              path="judge-assignments"
              element={<SuperAdminJudgeAssignments />}
            />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
