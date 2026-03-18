import { useEffect, useState } from "react";
import { Users, GitBranch, ShieldCheck } from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import StatsCard from "../../components/admin/StatsCard";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await adminApi.getSystemStats();
        setStats(response.data.data);
      } catch (error) {
        console.error("Failed to fetch system stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSystemStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="System-wide overview."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          Icon={Users}
          title="Total Users"
          value={stats?.totalUsers || 0}
        />
        <StatsCard
          Icon={GitBranch}
          title="Total Admins"
          value={stats?.totalAdmins || 0}
        />
        <StatsCard
          Icon={ShieldCheck}
          title="Total Juri"
          value={stats?.totalJuri || 0}
        />
      </div>
      {/* More system-wide stats can be added here */}
    </>
  );
};

export default SuperAdminDashboard;
