import React, { useEffect, useState, useCallback } from "react";
import { Users, GitBranch, ShieldCheck } from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import StatsCard from "../../components/admin/StatsCard";

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getSystemStats();
      setStats(res.data.data);
    } catch (err) {
      setError("Failed to load system stats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-slate-500 text-sm mt-2">
          Make sure the backend server is running on port 5000
        </p>
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Statistics</h1>
        <p className="text-slate-500 text-sm mt-1">GIVA System Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { label: "Total Admins", value: stats?.totalUsers?.ADMIN || 0 },
          { label: "Total Judges", value: stats?.totalUsers?.JUDGE || 0 },
          { label: "Total Students", value: stats?.totalUsers?.STUDENT || 0 },
          { label: "Total Events", value: stats?.totalEvents || 0 },
          { label: "Total Submissions", value: stats?.totalSubmissions || 0 },
          { label: "Storage (MB)", value: stats?.storageUsed || 0 },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
          >
            <p className="text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="text-sm text-slate-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="#/superadmin/users"
          className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-900 hover:shadow-md transition-all group"
        >
          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-slate-700">
            Manage Admins & Judges
          </h3>
          <p className="text-sm text-slate-500">
            Add, edit, and deactivate users
          </p>
        </a>
        <a
          href="#/superadmin/assignments"
          className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-900 hover:shadow-md transition-all group"
        >
          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-slate-700">
            Judge Assignments
          </h3>
          <p className="text-sm text-slate-500">
            Manage judge assignments to event categories
          </p>
        </a>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
