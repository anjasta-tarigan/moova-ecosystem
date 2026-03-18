import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import Button from "../../components/Button";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const SuperAdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getAdminJudgeUsers();
      setUsers(response.data.data);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateUserModal = () => {
    // Logic to open a modal for creating a user
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-sm">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage Admin and Judge accounts."
      >
        <Button onClick={openCreateUserModal}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </PageHeader>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {user?.fullName || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {user?.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {(user?.role as string) || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {user?.isActive ? "ACTIVE" : user ? "INACTIVE" : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(user?.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default SuperAdminUsers;
