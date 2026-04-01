import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminApi } from "../../services/api/adminApi";
import Button from "../../components/Button";
import Modal from "../../components/admin/Modal";
import { useAuthContext } from "../../contexts/AuthContext";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useAuthContext();

  const basePath = useMemo(
    () =>
      location.pathname.startsWith("/superadmin") ? "/superadmin" : "/admin",
    [location.pathname],
  );

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Passing primitives separately instead of an object to avoid infinite loops if mapped directly
      const response = await adminApi.getEvents({
        search,
        status: statusFilter,
        page,
      });
      const payload = response.data?.data ?? response.data ?? [];
      setEvents(Array.isArray(payload) ? payload : []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch events", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); // use callback fn as dep

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      setActionMessage("Event deleted successfully");
      fetchEvents();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to delete event";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
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
        <h1 className="text-2xl font-bold text-slate-900">Event Management</h1>
        {isSuperAdmin ? (
          <button
            onClick={() => navigate(`${basePath}/events/new`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        ) : (
          <p className="text-sm text-slate-500">
            Only Superadmins can create events.
          </p>
        )}
      </div>

      {actionMessage && (
        <div className="rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 text-sm">
          {actionMessage}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="OPEN">Open</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Deadline
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Format
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Registrants
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event: any) => (
                  <tr
                    key={event.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className="font-medium text-slate-900 cursor-pointer hover:underline"
                        onClick={() =>
                          navigate(`${basePath}/events/${event.id}/edit`)
                        }
                      >
                        {event?.title || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event?.category || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          event.status === "OPEN"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : event.status === "DRAFT"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : event.status === "UPCOMING"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {event?.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(
                        event?.deadline || event?.registrationStartDate,
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event?.format || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event?._count?.registrations ??
                        event?.participantCount ??
                        0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`${basePath}/events/${event.id}/edit`)
                          }
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(event);
                            setDeleteError(null);
                          }}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
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
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Event"
        footer={
          <>
            <Button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            {`This will permanently remove "${deleteTarget?.title || "this event"}".`}
          </p>
          <p className="text-sm text-slate-600">
            Deleting is blocked if the event already has registrations.
          </p>
          {deleteError && (
            <div className="rounded-md bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminEvents;
