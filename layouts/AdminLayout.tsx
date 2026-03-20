import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Award,
  BarChart2,
  Shield,
  Briefcase,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { cn } from "../lib/utils";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { logout, isSuperAdmin, isAdmin } = useAuth();

  const getNavItems = () => {
    if (isSuperAdmin) {
      return [
        { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
        { label: "Events", href: "/superadmin/events", icon: Calendar },
        {
          label: "Submissions",
          href: "/superadmin/submissions",
          icon: FileText,
        },
        { label: "Students", href: "/superadmin/siswa", icon: Users },
        {
          label: "Certificates",
          href: "/superadmin/certificates",
          icon: Award,
        },
        { label: "Reports", href: "/superadmin/reports", icon: BarChart2 },
        { label: "Manage Users", href: "/superadmin/users", icon: Shield },
        {
          label: "Judge Assignments",
          href: "/superadmin/assignments",
          icon: Briefcase,
        },
      ];
    }
    return [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Events", href: "/admin/events", icon: Calendar },
      { label: "Submissions", href: "/admin/submissions", icon: FileText },
      { label: "Students", href: "/admin/siswa", icon: Users },
      { label: "Certificates", href: "/admin/certificates", icon: Award },
      { label: "Reports", href: "/admin/reports", icon: BarChart2 },
    ];
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    if (href === "/superadmin") return location.pathname === "/superadmin";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col transition-all duration-300",
          "border-r border-white/10 bg-slate-900 shrink-0",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-center h-16 border-b border-white/10 px-3">
          {isCollapsed ? (
            <img
              src="/brand.png"
              alt="GIVA"
              className="w-7 h-7 object-contain"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <img
                src="/brand.png"
                alt="GIVA"
                className="h-7 w-auto object-contain"
              />
              <span className="text-lg font-black text-white tracking-tight">
                GIVA
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-grow px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg",
                  "text-sm font-medium transition-all",
                  "border border-transparent",
                  active
                    ? "bg-white/10 text-white border-l-2 border-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer panel */}
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-slate-900 flex flex-col border-r border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img
                  src="/brand.png"
                  alt="GIVA"
                  className="h-7 w-auto object-contain"
                />
                <span className="text-lg font-black text-white tracking-tight">
                  GIVA
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Role badge */}
            <div className="px-5 pt-4 pb-2">
              {isSuperAdmin && (
                <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                  SUPERADMIN
                </span>
              )}
              {isAdmin && !isSuperAdmin && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  ADMIN
                </span>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-grow px-2 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      "rounded-lg text-sm font-medium",
                      "transition-all border border-transparent",
                      active
                        ? "bg-white/10 text-white border-l-2 border-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-white/10">
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>

          {/* Role badges */}
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                SUPERADMIN
              </span>
            )}
            {isAdmin && !isSuperAdmin && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                ADMIN
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
