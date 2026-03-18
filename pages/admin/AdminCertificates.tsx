import React, { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import Button from "../../components/Button";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AdminCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCertificates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminApi.getCertificates({
        type: typeFilter,
        page,
      });
      setCertificates(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch certificates", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, page]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
        >
          <Plus className="w-4 h-4" />
          Issue Certificate
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-64"
        >
          <option value="">All Status</option>
          <option value="PARTICIPANT">Participant</option>
          <option value="WINNER">Winner</option>
          <option value="COMMITTEE">Committee</option>
          <option value="JUDGE">Judge</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No data found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Recipient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Event
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Award
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Issued By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert: any) => (
                  <tr
                    key={cert.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {cert?.recipient?.fullName ||
                        cert?.participantName ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cert?.event?.title || cert?.eventName || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cert?.type || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cert?.award || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(cert?.issueDate || cert?.issuedAt)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cert?.issuedBy || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          cert.status === "VALID" || cert.status === "Active"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : cert.status === "REVOKED"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {cert?.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(!cert.status ||
                          cert.status === "VALID" ||
                          cert.status === "Active") && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to revoke this certificate?",
                                )
                              ) {
                                const reason =
                                  window.prompt(
                                    "Please provide a revocation reason",
                                    "Revoked by admin",
                                  ) || "Revoked by admin";
                                adminApi.revokeCertificate
                                  ? adminApi
                                      .revokeCertificate(cert.id, reason)
                                      .then(() => fetchCertificates())
                                  : console.log("Mock Revoke Certificate");
                              }
                            }}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertificates;
