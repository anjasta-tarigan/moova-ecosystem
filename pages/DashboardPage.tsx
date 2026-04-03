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
import { useAuthContext } from "../contexts/AuthContext";
import { eventsApi } from "../services/api/eventsApi";
import DashboardProfile from "./DashboardProfile";

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
  const { user } = useAuthContext();
  const [myEvents, setMyEvents] = useState<RegistrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await eventsApi.getStudentEvents({ limit: 5 });
      const payload = res.data?.data ?? res.data ?? {};
      setMyEvents(payload.registered || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const firstName = useMemo(
    () => (user?.fullName || "Student").split(" ")[0],
    [user?.fullName],
  );

  const activeCompetitions = useMemo(
    () => myEvents.filter((event) => event.event?.status === "ACTIVE").length,
    [myEvents],
  );

  const upcomingDeadlines = useMemo(
    () => myEvents.filter((event) => Boolean(event.event?.deadline)).length,
    [myEvents],
  );

  const headline = `Welcome back, ${firstName}`;

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
                {activeCompetitions}
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
                {upcomingDeadlines}
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
                {myEvents.length}
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

        {isLoading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">Failed to load data</p>
            <button
              onClick={fetchData}
              className="mt-3 text-sm text-red-600 hover:underline font-bold"
            >
              Try Again
            </button>
          </div>
        ) : myEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No data available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {myEvents.map((reg) => (
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
