import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import { DataTable } from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import { columns } from "./AdminCertificatesColumns"; // We will create this file next
import Button from "../../components/Button";

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await adminApi.getCertificates();
        setCertificates(response.data.data);
      } catch (error) {
        console.error("Failed to fetch certificates", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const openCreateModal = () => {
    // Logic to open a modal for creating a certificate
    console.log("Open create certificate modal");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Certificates"
        subtitle="Issue and manage certificates."
      >
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Issue Certificate
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={certificates} />
    </>
  );
};

export default AdminCertificates;
