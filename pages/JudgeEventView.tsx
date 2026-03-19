import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { judgeApi } from "../services/api/judgeApi";

const JudgeEventView: React.FC = () => {
  const { eventId, categoryId } = useParams(); // Now uses categoryId in route
  const navigate = useNavigate();

  // State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<string>("ABSTRACT");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!categoryId) return;
    setIsLoading(true);
    try {
      const res = await judgeApi.getCategorySubmissions(categoryId, {
        stage: activeStage,
      });
      const data = res.data.data || [];
      setSubmissions(data);

      const scored = data.filter(
        (s: any) => s.scoringStatus === "submitted",
      ).length;
      setProgress(
        data.length > 0 ? Math.round((scored / data.length) * 100) : 0,
      );
    } catch (error) {
      console.error(error);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, activeStage]);

  // Fetch submissions for this specific category
  useEffect(() => {
    loadData();
  }, [loadData]); // Reload when stage changes

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "pending"
          ? sub.scoringStatus !== "submitted"
          : sub.scoringStatus === "submitted";

    const matchesSearch =
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.team.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle size={12} /> Scored
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} /> Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle size={12} /> Pending
          </span>
        );
    }
  };

  const stages: { id: string; label: string; active: boolean }[] = [
    { id: "ABSTRACT", label: "1. Abstract", active: true },
    { id: "PAPER", label: "2. Full Paper & Poster", active: true },
    { id: "FINAL", label: "3. Final Presentation", active: true }, // In real app, check date to disable future stages
  ];

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 p-6">
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate("/dashboard/judge/events")}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ChevronLeft size={16} /> Back to Assignments
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Evaluation Workspace
          </h1>
          <p className="text-slate-500 text-sm">
            Category ID:{" "}
            <span className="font-mono text-slate-700">{categoryId}</span>
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-brand-solid-blue/10 text-brand-blue rounded-full flex items-center justify-center">
            <BarChart size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">
              Stage Progress
            </div>
            <div className="text-lg font-bold text-slate-900 leading-none">
              {progress}%{" "}
              <span className="text-xs font-normal text-slate-400">
                Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Stage Tabs (Stepper Style) */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {stages.map((stage, idx) => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`flex-1 py-4 px-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeStage === stage.id
                  ? "border-brand-blue text-brand-blue bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                  activeStage === stage.id
                    ? "bg-brand-blue text-white border-brand-blue"
                    : "bg-white border-slate-300"
                }`}
              >
                {idx + 1}
              </span>
              {stage.label}
            </button>
          ))}
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search team or project title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="py-2 pl-2 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-blue outline-none cursor-pointer"
            >
              <option value="all">All Submissions</option>
              <option value="pending">Pending Evaluation</option>
              <option value="submitted">Completed</option>
            </select>
          </div>
        </div>

        {/* List View */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          {filteredSubmissions.length === 0 ? (
            <div className="flex items-center justify-center min-h-64 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm">No data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() =>
                    navigate(
                      `/dashboard/judge/events/${eventId}/round/${activeStage}/submission/${sub.id}`,
                    )
                  }
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-md hover:border-brand-blue transition-all cursor-pointer group"
                >
                  {/* Avatar / Team Initials */}
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg shrink-0 border border-slate-200">
                    {sub.team.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-blue transition-colors truncate">
                      {sub.title}
                    </h3>
                    <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 justify-center md:justify-start">
                      <span>{sub.team}</span>
                      <span className="text-slate-300">|</span>
                      <span>{sub.institution}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono text-xs pt-0.5 opacity-70">
                        ID: {sub.id}
                      </span>
                    </div>
                  </div>

                  {/* Status & Score */}
                  <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    {sub.scoringStatus === "submitted" ? (
                      <div className="text-right">
                        <span className="block text-2xl font-black text-slate-900">
                          {sub.totalScore}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Score
                        </span>
                      </div>
                    ) : (
                      <div className="text-right px-4">
                        <span className="text-slate-300 text-2xl font-bold">
                          --
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(sub.scoringStatus)}
                      <span className="text-xs font-bold text-brand-blue group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Evaluate <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex justify-between">
          <span>{filteredSubmissions.length} records found</span>
          <span>
            Evaluation Criteria:{" "}
            <strong className="uppercase">{activeStage}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default JudgeEventView;
