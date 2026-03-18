import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Award,
  BarChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { cn } from "../lib/utils";

const adminNavItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/events", icon: Calendar, label: "Events" },
  { to: "/admin/submissions", icon: FileText, label: "Submissions" },
  { to: "/admin/siswa", icon: Users, label: "Students" },
  { to: "/admin/certificates", icon: Award, label: "Certificates" },
  { to: "/admin/reports", icon: BarChart, label: "Reports" },
];

const superAdminNavItems = [
  { to: "/superadmin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/superadmin/users", icon: Users, label: "Users" },
  {
    to: "/superadmin/judge-assignments",
    icon: Award,
    label: "Judge Assignments",
  },
];

const Sidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { logout, isSuperAdmin } = useAuth();
  const navItems = isSuperAdmin ? superAdminNavItems : adminNavItems;

  return (
    <aside
      className={cn(
        "bg-gray-800 text-white flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <h1 className={cn("text-2xl font-bold", isCollapsed && "text-lg")}>
          {isCollapsed ? "G" : "GIVA"}
        </h1>
      </div>
      <nav className="flex-grow px-4 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-gray-700",
                isActive ? "bg-indigo-600 text-white" : "text-gray-300",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="ml-4">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700"
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-4">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
          {/* Header content like user menu can go here */}
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
