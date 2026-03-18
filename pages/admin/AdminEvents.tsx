import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/api/adminApi";
import { DataTable } from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import { columns } from "./AdminEventsColumns"; // We will create this file next
import Button from "../../components/Button";

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await adminApi.getEvents();
        setEvents(response.data.data);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Manage Events"
        subtitle="Create, edit, and oversee all events."
      >
        <Button onClick={() => navigate("/admin/events/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={events} />
    </>
  );
};

export default AdminEvents;
