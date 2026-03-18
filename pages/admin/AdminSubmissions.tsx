import { useEffect, useState } from "react";
import { adminApi } from "../../services/api/adminApi";
import { DataTable } from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import { columns } from "./AdminSubmissionsColumns"; // We will create this file next

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await adminApi.getSubmissions();
        setSubmissions(response.data.data);
      } catch (error) {
        console.error("Failed to fetch submissions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Review and manage all submissions."
      />
      <DataTable columns={columns} data={submissions} />
    </>
  );
};

export default AdminSubmissions;
