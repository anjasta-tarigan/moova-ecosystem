import { useEffect, useState } from "react";
import { Users, Calendar, FileText, Award } from "lucide-react";
import { adminApi } from "../services/api/adminApi";
import PageHeader from "../components/admin/PageHeader";
import StatsCard from "../components/admin/StatsCard";

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await adminApi.getDashboard();
        setStats(response.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of the GIVA ecosystem."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          Icon={Users}
          title="Total Siswa"
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
