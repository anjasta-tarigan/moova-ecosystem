import React, { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { adminApi } from "../../services/api/adminApi";
import Button from "../../components/Button";
import AdminSelect from "../../components/admin/AdminSelect";
import AdminInput from "../../components/admin/AdminInput";
import Modal from "../../components/admin/Modal";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const certificateSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  recipientId: z.string().min(1, "Recipient is required"),
  type: z.enum(["WINNER", "PARTICIPANT", "JUDGE"]),
  award: z.string().min(2, "Award is required"),
  issuedBy: z.string().min(2, "Issuer is required"),
});

type CertificateForm = z.infer<typeof certificateSchema>;

type UserOption = { id: string; label: string };
type EventOption = { id: string; label: string };

const AdminCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventsOptions, setEventsOptions] = useState<EventOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CertificateForm>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      eventId: "",
      recipientId: "",
      type: "PARTICIPANT",
      award: "",
      issuedBy: "Admin Panel",
    },
  });

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

  const fetchMeta = useCallback(async () => {
    setIsMetaLoading(true);
    setActionError(null);
    try {
      const [eventsRes, usersRes] = await Promise.all([
        adminApi.getEvents({ limit: 50 }),
        adminApi.getSiswaList({ limit: 50 }),
      ]);
      const eventsPayload = eventsRes.data?.data || eventsRes.data || [];
      const usersPayload = usersRes.data?.data || usersRes.data || [];
      setEventsOptions(
        Array.isArray(eventsPayload)
          ? eventsPayload.map((evt: any) => ({
              id: evt.id,
              label: evt.title ?? evt.name ?? "Untitled Event",
            }))
          : [],
      );
      setUserOptions(
        Array.isArray(usersPayload)
          ? usersPayload.map((user: any) => ({
              id: user.id,
              label: user.fullName ?? user.email ?? "User",
            }))
          : [],
      );
    } catch (err) {
      setActionError("Failed to load event or user options");
    } finally {
      setIsMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const openCreateModal = () => {
    setShowCreateModal(true);
    reset({
      eventId: "",
      recipientId: "",
      type: "PARTICIPANT",
      award: "",
      issuedBy: "Admin Panel",
    });
    fetchMeta();
  };

  const onCreate = async (formData: CertificateForm) => {
    setActionMessage(null);
    setActionError(null);
    try {
      await adminApi.createCertificate(formData);
      setShowCreateModal(false);
      fetchCertificates();
      setActionMessage("Certificate issued successfully");
    } catch (err) {
      setActionError("Failed to issue certificate. Please try again.");
    }
  };

  const onRevoke = async (cert: any) => {
    if (!window.confirm("Are you sure you want to revoke this certificate?")) {
      return;
    }
    const reasonInput =
      window.prompt("Please provide a revocation reason", "Revoked by admin") ||
      "Revoked by admin";

    setActionMessage(null);
    setActionError(null);
    setRevokingId(cert.id);
    try {
      await adminApi.revokeCertificate(cert.id, reasonInput.trim());
      fetchCertificates();
      setActionMessage("Certificate revoked");
    } catch (err) {
      setActionError("Failed to revoke certificate. Please try again.");
    } finally {
      setRevokingId(null);
    }
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

      {actionMessage && (
        <div className="rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 text-sm">
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="rounded-md bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">
          {actionError}
        </div>
      )}

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
                            onClick={() => onRevoke(cert)}
                            disabled={revokingId === cert.id}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            {revokingId === cert.id ? "Revoking..." : "Revoke"}
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

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Issue Certificate"
        footer={
          <>
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onCreate)}
            >
              {isSubmitting ? "Issuing..." : "Issue"}
            </Button>
          </>
        }
      >
        {isMetaLoading ? (
          <p className="text-sm text-slate-600">Loading options...</p>
        ) : (
          <div className="space-y-4">
            <AdminSelect
              label="Event"
              id="eventId"
              {...register("eventId")}
              error={errors.eventId?.message}
            >
              <option value="">Select event</option>
              {eventsOptions.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.label}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              label="Recipient"
              id="recipientId"
              {...register("recipientId")}
              error={errors.recipientId?.message}
            >
              <option value="">Select recipient</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              label="Type"
              id="type"
              {...register("type")}
              error={errors.type?.message}
            >
              <option value="PARTICIPANT">Participant</option>
              <option value="WINNER">Winner</option>
              <option value="JUDGE">Judge</option>
            </AdminSelect>

            <AdminInput
              label="Award"
              id="award"
              placeholder="1st Place"
              {...register("award")}
              error={errors.award?.message}
            />

            <AdminInput
              label="Issued By"
              id="issuedBy"
              placeholder="GIVA Admin"
              {...register("issuedBy")}
              error={errors.issuedBy?.message}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCertificates;
