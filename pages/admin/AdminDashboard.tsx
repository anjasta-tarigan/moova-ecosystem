import React, { useEffect, useState, useCallback } from "react";
import { Users, Calendar, FileText, Award } from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import StatsCard from "../../components/admin/StatsCard";

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    adminApi
      .getDashboard()
      .then((res) => setStats(res.data.data))
      .catch((err) => {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load data");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of the GIVA ecosystem."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          Icon={Users}
          title="Total Students"
          value={stats?.totalSiswa || 0}
          change="+12%"
          changeType="increase"
        />
        <StatsCard
          Icon={Calendar}
          title="Active Events"
          value={stats?.activeEvents || 0}
        />
        <StatsCard
          Icon={FileText}
          title="Total Submissions"
          value={stats?.totalSubmissions || 0}
        />
        <StatsCard
          Icon={Award}
          title="Certificates Issued"
          value={stats?.certificatesIssued || 0}
        />
      </div>
      {/* More dashboard components can be added here */}
    </>
  );
};

export default AdminDashboard;
