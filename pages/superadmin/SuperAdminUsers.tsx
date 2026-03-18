import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import { DataTable } from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import { columns } from "./SuperAdminUsersColumns"; // We will create this file next
import Button from "../../components/Button";

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminApi.getAdminJuriUsers();
        setUsers(response.data.data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const openCreateUserModal = () => {
    // Logic to open a modal for creating a user
    console.log("Open create user modal");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage Admin and Juri accounts."
      >
        <Button onClick={openCreateUserModal}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={users} />
    </>
  );
};

export default SuperAdminUsers;
