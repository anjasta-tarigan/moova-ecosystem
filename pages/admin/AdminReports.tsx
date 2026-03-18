import { useState } from "react";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import Button from "../../components/Button";

const AdminReports = () => {
  const [eventId, setEventId] = useState("");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await adminApi.getEventReport(eventId);
      setReport(response.data.data);
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate reports for events." />
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Enter Event ID"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
          <Button onClick={handleGenerateReport} disabled={loading || !eventId}>
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </div>

        {report && (
          <div className="mt-8">
            <h2 className="text-xl font-bold">
              Report for Event: {report.eventName}
            </h2>
            {/* Display report data */}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminReports;
