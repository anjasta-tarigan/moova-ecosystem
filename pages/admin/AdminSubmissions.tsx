import React, { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../services/api/adminApi";
import { DataTable } from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import { columns } from "./AdminSubmissionsColumns"; // We will create this file next

const AdminSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminApi.getSubmissions();
      setSubmissions(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-slate-500 text-sm mt-2">
          Make sure the backend server is running on port 5000
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Review and manage all submissions."
      />
      {submissions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No data found</div>
      ) : (
        <DataTable columns={columns} data={submissions} />
      )}
    </>
  );
};

export default AdminSubmissions;
