import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Eye, FolderCog, Plus, RefreshCcw } from "lucide-react";
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

const STATUS_OPTIONS = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"];

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventNameError, setNewEventNameError] = useState<string | null>(
    null,
  );
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<any | null>(null);
  const [statusValue, setStatusValue] = useState<string>("DRAFT");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
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

  const validateNewEventName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Event Name is required";
    if (trimmed.length < 3) return "Event Name must be at least 3 characters";
    return null;
  };

  const handleCreateEvent = async () => {
    const validationMessage = validateNewEventName(newEventName);
    setNewEventNameError(validationMessage);
    if (validationMessage) return;

    try {
      setIsCreatingEvent(true);
      const payload = {
        name: newEventName.trim(),
        title: newEventName.trim(),
      };
      const response = await adminApi.createEvent(payload);
      const created = response.data?.data ?? response.data;
      setIsCreateModalOpen(false);
      setNewEventName("");
      setNewEventNameError(null);
      setActionMessage("Event created successfully");
      if (created?.id) {
        navigate(`${basePath}/events/${created.id}/edit`);
        return;
      }
      fetchEvents();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to create event";
      setNewEventNameError(message);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const openStatusModal = (event: any) => {
    setStatusTarget(event);
    setStatusValue(event?.status || "DRAFT");
    setStatusError(null);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      await adminApi.updateEventStatus(statusTarget.id, statusValue);
      setStatusTarget(null);
      setActionMessage(`Status updated to ${statusValue}`);
      fetchEvents();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to update event status";
      setStatusError(message);
    } finally {
      setIsUpdatingStatus(false);
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
            onClick={() => {
              setIsCreateModalOpen(true);
              setNewEventNameError(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Event
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
                      <span className="font-medium text-slate-900">
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
                        {isSuperAdmin ? (
                          <button
                            onClick={() =>
                              navigate(`${basePath}/events/${event.id}/edit`)
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                          >
                            <FolderCog className="h-3.5 w-3.5" />
                            Manage
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              navigate(`${basePath}/events/${event.id}/edit`)
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Detail
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openStatusModal(event)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Change Status
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
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewEventNameError(null);
        }}
        title="Create New Event"
        footer={
          <>
            <Button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewEventNameError(null);
              }}
              className="bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateEvent}
              disabled={isCreatingEvent}
            >
              {isCreatingEvent ? "Creating..." : "Create Event"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label
            htmlFor="event-name"
            className="block text-sm font-semibold text-slate-700"
          >
            Event Name
          </label>
          <input
            id="event-name"
            type="text"
            value={newEventName}
            onChange={(event) => {
              const value = event.target.value;
              setNewEventName(value);
              setNewEventNameError(validateNewEventName(value));
            }}
            placeholder="Example: GIVA Deep Tech Summit 2026"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {newEventNameError && (
            <div className="rounded-md bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">
              {newEventNameError}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Slug and permanent event ID will be generated automatically.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(statusTarget)}
        onClose={() => {
          setStatusTarget(null);
          setStatusError(null);
        }}
        title="Change Event Status"
        footer={
          <>
            <Button
              type="button"
              onClick={() => {
                setStatusTarget(null);
                setStatusError(null);
              }}
              className="bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={confirmStatusChange}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-700 font-medium">
            {`Update status for "${statusTarget?.title || "this event"}"`}
          </p>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {statusError && (
            <div className="rounded-md bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">
              {statusError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminEvents;
