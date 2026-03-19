import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  Award,
  Filter,
  Search,
} from "lucide-react";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { judgeApi } from "../services/api/judgeApi";

const JudgeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await judgeApi.getAssignments();
        setAssignments(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    loadAssignments();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a: any) => {
      if (!a) return false;

      const matchFilter =
        filter === "All"
          ? true
          : (a.status || "").toUpperCase() === filter.toUpperCase();

      const categoryName = (a.categoryName || "").toLowerCase();
      const eventTitle = (a.eventTitle || "").toLowerCase();
      const searchLower = (search || "").toLowerCase();

      const matchSearch = search
        ? categoryName.includes(searchLower) || eventTitle.includes(searchLower)
        : true;

      return matchFilter && matchSearch;
    });
  }, [assignments, filter, search]);

  const groupedAssignments = useMemo(() => {
    return filteredAssignments.reduce(
      (acc: Record<string, any[]>, curr: any) => {
        const key = curr?.eventTitle || "Unknown Event";
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }, [filteredAssignments]);

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "abstract":
        return "Phase 1: Abstract";
      case "paper":
        return "Phase 2: Full Paper & Poster";
      case "final":
        return "Phase 3: Final Presentation";
      default:
        return stage;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "COMPLETED")
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "ACTIVE")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "PENDING")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-slate-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            My Assignments
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your judging responsibilities across multiple categories and
            competitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <select
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-10">
        {Object.keys(groupedAssignments).length === 0 && (
          <div className="flex items-center justify-center min-h-64 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-400 text-sm">No data available</p>
          </div>
        )}

        {Object.entries(groupedAssignments).map(
          ([eventTitle, items]: [string, any[]]) => (
            <div key={eventTitle} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-brand-solid-blue rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">
                  {eventTitle}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {items.map((asn) => {
                  const percentage =
                    asn.total > 0
                      ? Math.round((asn.progress / asn.total) * 100)
                      : 0;

                  return (
                    <div
                      key={asn.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/dashboard/judge/events/${asn.eventId}/category/${asn.categoryId}`,
                        )
                      }
                    >
                      {/* Card Header */}
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(asn.status)}`}
                          >
                            {asn.status}
                          </div>
                          <div className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-brand-solid-cyan group-hover:text-white transition-colors">
                            <Briefcase size={18} />
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-blue transition-colors">
                          {asn.categoryName}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                          <Clock size={14} /> {getStageLabel(asn.currentStage)}
                        </p>

                        {/* Progress Bar */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Progress
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {asn.progress} / {asn.total} Reviewed
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ${percentage === 100 ? "bg-emerald-500" : "bg-brand-solid-blue"}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400"
                            >
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                          {asn.total > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                              +{asn.total - 3}
                            </div>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-sm font-bold text-brand-blue group-hover:underline">
                          Open Workspace <ChevronRight size={16} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default JudgeDashboard;
