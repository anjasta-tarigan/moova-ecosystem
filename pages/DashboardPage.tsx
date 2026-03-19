import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import { profileApi } from "../services/api/profileApi";
import DashboardProfile from "./DashboardProfile";

interface DashboardStats {
  activeCompetitions: number;
  upcomingDeadlines: number;
  totalSubmissions: number;
  name: string;
}

interface RegistrationItem {
  id: string;
  event: {
    id: string;
    title: string;
    deadline?: string;
    format?: string;
    status?: string;
    category?: string;
  };
  team?: { name: string } | null;
  registeredAt?: string;
}

const OverviewView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, submissionsRes, profileRes] = await Promise.all([
          profileApi.getMyEvents(),
          profileApi.getMySubmissions(),
          profileApi.getProfile(),
        ]);

        const events: RegistrationItem[] = eventsRes.data.data || [];
        setRegistrations(events);

        const submissions = submissionsRes.data.data || [];
        const name = profileRes.data.data?.user?.fullName || "Student";

        const upcomingDeadlines = events.filter((reg) =>
          Boolean(reg.event?.deadline),
        ).length;
        setStats({
          activeCompetitions: events.length,
          upcomingDeadlines,
          totalSubmissions: submissions.length,
          name,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const headline = useMemo(() => {
    if (!stats) return "Dashboard";
    return `Welcome back, ${stats.name.split(" ")[0] || "Student"}`;
  }, [stats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            {headline}. All data is fetched from the API.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[160px]">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">
                {stats?.activeCompetitions ?? 0}
              </p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">
                Active Events
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[160px]">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">
                {stats?.upcomingDeadlines ?? 0}
              </p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">
                Deadlines
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[160px]">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">
                {stats?.totalSubmissions ?? 0}
              </p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">
                Submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Active Competitions
          </h2>
          <button
            onClick={() => navigate("/dashboard/event/list")}
            className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading events...</div>
        ) : registrations.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 bg-slate-50">
            No events joined yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-600 tracking-wide">
                        {reg.event?.status || "Registered"}
                      </span>
                      {reg.team?.name && (
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Users size={12} /> {reg.team.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      {reg.event?.title}
                    </h3>
                    {reg.event?.category && (
                      <p className="text-xs text-slate-500 mt-1">
                        Category: {reg.event.category}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {reg.event?.deadline && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                        <Clock size={12} /> {reg.event.deadline}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-xs text-slate-500 font-medium">
                    {reg.registeredAt
                      ? `Registered ${new Date(reg.registeredAt).toLocaleDateString()}`
                      : "Registered"}
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(`/dashboard/event/${reg.event?.id || reg.id}`)
                    }
                  >
                    Open Workspace
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Play size={18} className="text-primary-500" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      View event schedules & timelines
                    </p>
                    <p className="text-xs text-slate-500">
                      Stay on top of the latest submission deadlines.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/dashboard/event/list")}
                >
                  Open
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Manage teams & invitations
                    </p>
                    <p className="text-xs text-slate-500">
                      Manage team members and roles.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/dashboard/team/manage")}
                >
                  Open
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Need a Team?</h3>
              <p className="text-slate-300 text-sm mb-6">
                Find new teammates or invite friends.
              </p>
              <Button
                variant="white"
                fullWidth
                onClick={() => navigate("/dashboard/team/manage?tab=discover")}
              >
                Find Teammates
              </Button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");

  // Simple router within the dashboard page for Profile
  if (view === "profile") return <DashboardProfile />;

  // Default is Overview
  return <OverviewView />;
};

export default DashboardPage;
