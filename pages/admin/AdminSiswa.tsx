import { useEffect, useState } from "react";
import { adminApi } from "../../services/api/adminApi";
import { DataTable } from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import { columns } from "./AdminSiswaColumns"; // We will create this file next

const AdminSiswa = () => {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const response = await adminApi.getSiswaList();
        setSiswa(response.data.data);
      } catch (error) {
        console.error("Failed to fetch siswa list", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSiswa();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Siswa Management"
        subtitle="View and manage all student accounts."
      />
      <DataTable columns={columns} data={siswa} />
    </>
  );
};

export default AdminSiswa;
