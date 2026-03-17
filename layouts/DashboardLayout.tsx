
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Settings, LogOut, 
  Bell, Menu, ChevronLeft, ChevronRight, Briefcase, 
  FileText, Award, Layers, Globe, User as UserIcon, Home, CheckCircle
} from 'lucide-react';
import { User, UserRole } from '../types';

// --- Mock User Context for Demo ---
const getCurrentUser = (): User => {
  const stored = localStorage.getItem('moova_user');
  if (stored) return JSON.parse(stored);
  return {
    id: 'guest',
    firstName: 'Guest',
    lastName: 'User',
    email: 'guest@moova.io',
    role: 'guest'
  };
};

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const currentView = searchParams.get('view') || 'overview';

  const handleLogout = () => {
    localStorage.removeItem('moova_user');
    navigate('/login');
  };

  // Navigation Items per Role
  const getNavItems = (role: UserRole) => {
    // Participant specific structure requested
    if (role === 'participant' || role === 'team_leader' || role === 'team_member') {
      return [
        { label: 'Overview', icon: <Home size={20} />, href: '/dashboard?view=overview', id: 'overview' },
        { label: 'Event', icon: <Calendar size={20} />, href: '/dashboard/event/list', id: 'event' },
        { label: 'Team', icon: <Users size={20} />, href: '/dashboard/team/manage', id: 'team' },
        { label: 'Certificate', icon: <Award size={20} />, href: '/dashboard/certificates', id: 'certificates' },
        { label: 'Profile', icon: <UserIcon size={20} />, href: '/dashboard?view=profile', id: 'profile' },
      ];
    }

    if (role === 'judge') {
      return [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard/judge', id: 'overview' },
        { label: 'Events', icon: <Calendar size={20} />, href: '/dashboard/judge/events', id: 'events' },
        { label: 'Certificates', icon: <Award size={20} />, href: '/dashboard/judge/certificates', id: 'certificates' },
        { label: 'Profile', icon: <UserIcon size={20} />, href: '/dashboard/judge/profile', id: 'profile' },
      ];
    }

    // Fallback/Admin roles
    return [
      { label: 'Overview', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
      { label: 'Events', icon: <Calendar size={20} />, href: '/dashboard/events' },
      { label: 'Users', icon: <Users size={20} />, href: '/dashboard/users' },
    ];
  };

  const navItems = getNavItems(user.role);
  const isParticipant = ['participant', 'team_leader', 'team_member'].includes(user.role);
  const isJudge = user.role === 'judge';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex bg-slate-900 text-slate-300 transition-all duration-300 flex-col border-r border-slate-800 ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-primary-500/20">
            M
          </div>
          {!collapsed && (
            <span className="ml-3 font-bold text-lg text-white tracking-tight animate-in fade-in duration-300">
              MOOVA
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            // Logic to determine active state including nested routes
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href.replace('/list', '').replace('/manage', ''));

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all group relative font-medium text-sm ${
                  isActive 
                    ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full" />}
                <span className={`shrink-0 ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`}>{item.icon}</span>
                {!collapsed && (
                  <span className="ml-3 truncate animate-in fade-in duration-200">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-slate-800/50 transition-colors`}>
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0 text-white border border-slate-600">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-white">{user.firstName} {user.lastName}</p>
                <p className="text-[11px] text-slate-500 truncate capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        
        {/* Top Utility Bar */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              {user.role === 'judge' ? (
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                  Logged in as Judge
                </span>
              ) : (
                user.organization || 'Participant Workspace'
              )}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">System Operational</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-20 sticky top-0 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">M</div>
             <span className="font-bold text-slate-900 text-lg">Dashboard</span>
           </div>
           <div className="flex items-center gap-3">
             <button onClick={() => navigate('/dashboard?view=notifications')} className="p-2 text-slate-500 hover:bg-slate-50 rounded-full relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                {user.firstName.charAt(0)}
             </div>
           </div>
        </header>

        {/* Dashboard Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 safe-area-bottom">
          <div className="flex justify-around items-center h-16">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.href.replace('/list', '').replace('/manage', ''));
              return (
                <button 
                  key={item.label}
                  onClick={() => navigate(item.href)}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-600' : 'text-slate-400'}`}
                >
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-primary-50 translate-y-[-2px]' : ''}`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardLayout;
