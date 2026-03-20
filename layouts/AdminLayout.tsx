import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Award,
  BarChart2,
  Activity,
  Shield,
  Briefcase,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { cn } from "../lib/utils";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    if (href === "/superadmin") {
      return location.pathname === "/superadmin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <aside
        className={cn(
          "flex flex-col transition-all duration-300 border-r border-white/10 bg-gray-900",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex items-center justify-center h-16 border-b border-white/10 px-3">
          {isCollapsed ? (
            <img
              src="/brand.png"
              alt="GIVA"
              className="w-7 h-7 object-contain mx-auto"
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
        <nav className="flex-grow px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all border border-transparent",
                  active
                    ? "bg-white/10 text-white border-l-2 border-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col bg-gray-50 text-slate-900">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
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
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
