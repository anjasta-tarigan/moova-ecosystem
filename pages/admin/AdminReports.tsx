import React, { useState, useCallback } from "react";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import Button from "../../components/Button";

const AdminReports: React.FC = () => {
  const [eventId, setEventId] = useState("");
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getScoreDisplay = (submission: any) => {
    if (!submission) return "-";
    if (typeof submission.totalScore === "number") return submission.totalScore;
    const scores = submission.scores;
    if (Array.isArray(scores) && scores.length > 0) {
      const numericScores = scores
        .map((s) => s?.totalScore)
        .filter((s) => typeof s === "number") as number[];
      if (numericScores.length) return Math.max(...numericScores);
    }
    return "-";
  };

  const handleGenerateReport = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getEventReport(eventId);
      setReport(response.data.data);
    } catch (err) {
      console.error("Failed to generate report", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

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
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading || !eventId}
          >
            {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </div>

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-slate-500 text-sm mt-2">
              Make sure the backend server is running on port 5000
            </p>
          </div>
        )}

        {report && (
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold">
              Report for Event ID: {eventId}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Registrations"
                value={report.registrationCount ?? 0}
              />
              <StatCard
                label="Submissions"
                value={report.submissionCount ?? 0}
              />
              <StatCard label="Scored" value={report.scoredCount ?? 0} />
              <StatCard
                label="Average Score"
                value={
                  typeof report.averageScore === "number"
                    ? report.averageScore.toFixed(2)
                    : "-"
                }
              />
            </div>

            {report.topSubmissions?.length ? (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-800">
                  Top Submissions
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Team</th>
                        <th className="px-4 py-3 text-left">Project</th>
                        <th className="px-4 py-3 text-left">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topSubmissions.map((submission: any) => (
                        <tr
                          key={submission.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-3 text-slate-800">
                            {submission.team?.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {submission.projectTitle || submission.title || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {getScoreDisplay(submission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">
                No submissions found for this event.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
    <p className="text-xs uppercase text-slate-500 font-semibold">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
  </div>
);

export default AdminReports;
