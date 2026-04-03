import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { eventsApi } from "../services/api/eventsApi";
import { useAuthContext } from "../contexts/AuthContext";

interface EventRegistration {
  id: string;
  event: {
    id: string;
    slug?: string;
    title: string;
    location?: string;
    format?: string;
    deadline?: string;
    category?: string;
    status?: string;
  };
  team?: { name: string } | null;
}

type EventSummary = {
  id: string;
  slug?: string;
  title: string;
  location?: string;
  format?: string;
  deadline?: string;
  category?: string;
  status?: string;
  fee?: string;
  organizer?: string;
  isSaved?: boolean;
  totalSaves?: number;
  totalParticipants?: number;
  _count?: { registrations?: number };
};

type StudentEventsPagination = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

const EventListView = ({
  registeredEvents,
  discoverEvents,
  pagination,
  activeTab,
  onTabChange,
  isLoading,
  error,
  onRetry,
  onPageChange,
  onToggleSave,
  togglingEventId,
}: {
  registeredEvents: EventRegistration[];
  discoverEvents: EventSummary[];
  pagination: StudentEventsPagination;
  activeTab: "registered" | "discover";
  onTabChange: (tab: "registered" | "discover") => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPageChange: (nextPage: number) => void;
  onToggleSave: (event: EventSummary) => void;
  togglingEventId: string | null;
}) => {
  const navigate = useNavigate();

  const renderRegistered = () => {
    if (registeredEvents.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No data available yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {registeredEvents.map((item) => {
          const destinationSlug = item.event.slug || item.event.id;

          return (
            <div
              key={item.id}
              onClick={() =>
                navigate(`/dashboard/workspace/${destinationSlug}`)
              }
              className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 text-primary-600 font-bold text-xl">
                {item.event.title.charAt(0)}
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                  {item.event.title}
                </h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                  {item.team?.name && (
                    <span className="flex items-center gap-1">
                      <Users size={16} /> {item.team.name}
                    </span>
                  )}
                  {item.event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} /> {item.event.location}
                    </span>
                  )}
                  {item.event.format && (
                    <span className="flex items-center gap-1">
                      {item.event.format}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 min-w-35">
                {item.event.deadline && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100 flex items-center gap-1">
                    <Clock size={12} /> {item.event.deadline}
                  </span>
                )}
                {item.event.status && (
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {item.event.status}
                  </span>
                )}
              </div>

              <ChevronRight className="text-slate-300 group-hover:text-primary-500" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderDiscover = () => {
    if (discoverEvents.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No open events available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {discoverEvents.map((event) => {
            const destinationSlug = event.slug || event.id;

            return (
              <div
                key={event.id}
                onClick={() => navigate(`/dashboard/events/${destinationSlug}`)}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-400 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {event.category || "General"}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      {event.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {event.location}
                        </span>
                      )}
                      {event.format && <span>{event.format}</span>}
                      {event.organizer && <span>by {event.organizer}</span>}
                    </div>
                  </div>
                  {event.status && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {event.status}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Deadline: {event.deadline || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span>
                        {event.totalParticipants ??
                          event._count?.registrations ??
                          0}{" "}
                        teams
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onToggleSave(event);
                      }}
                      disabled={togglingEventId === event.id}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        event.isSaved
                          ? "border-secondary-200 bg-secondary-50 text-secondary-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Bookmark
                        size={12}
                        fill={event.isSaved ? "currentColor" : "none"}
                      />
                      {event.isSaved
                        ? "Saved"
                        : togglingEventId === event.id
                          ? "Saving..."
                          : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-1 py-2">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  onPageChange(
                    Math.min(pagination.totalPages, pagination.page + 1),
                  )
                }
                disabled={pagination.page === pagination.totalPages}
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Event Hub
          </h1>
          <p className="text-slate-500 mt-1">
            View your registered events or discover new opportunities.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onTabChange("registered")}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${activeTab === "registered" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            My Registered Events
          </button>
          <button
            onClick={() => onTabChange("discover")}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${activeTab === "discover" ? "bg-primary-600 text-white border-primary-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            Discover Events
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={onRetry}
            className="mt-3 text-sm text-red-600 hover:underline font-bold"
          >
            Try Again
          </button>
        </div>
      ) : activeTab === "registered" ? (
        renderRegistered()
      ) : (
        renderDiscover()
      )}
    </div>
  );
};

const DashboardEventHub: React.FC = () => {
  const { user } = useAuthContext();
  const [registeredEvents, setRegisteredEvents] = useState<EventRegistration[]>(
    [],
  );
  const [discoverEvents, setDiscoverEvents] = useState<EventSummary[]>([]);
  const [activeTab, setActiveTab] = useState<"registered" | "discover">(
    "registered",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [pagination, setPagination] = useState<StudentEventsPagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const fetchStudentEvents = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await eventsApi.getStudentEvents({ page });
      const payload = res.data?.data ?? res.data ?? {};

      setRegisteredEvents(payload.registered || []);
      setDiscoverEvents(payload.discover || []);

      const nextPagination: StudentEventsPagination = payload.pagination || {
        page,
        totalPages: payload.totalPages || 1,
        total: payload.total || (payload.discover?.length ?? 0),
        limit: payload.limit || 10,
      };
      setPagination(nextPagination);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentEvents(discoverPage);
  }, [fetchStudentEvents, discoverPage]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchStudentEvents(discoverPage);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [discoverPage, fetchStudentEvents]);

  const handleToggleSave = async (event: EventSummary) => {
    if (togglingEventId) return;
    if (!user || user.role !== "STUDENT") {
      setError("Please log in as a student to save events.");
      return;
    }

    const previousSaved = Boolean(event.isSaved);
    const nextSaved = !previousSaved;

    setDiscoverEvents((previous) =>
      previous.map((item) =>
        item.id === event.id
          ? {
              ...item,
              isSaved: nextSaved,
              totalSaves: Math.max(
                0,
                (item.totalSaves ?? 0) + (nextSaved ? 1 : -1),
              ),
            }
          : item,
      ),
    );

    try {
      setTogglingEventId(event.id);
      const response = nextSaved
        ? await eventsApi.bookmarkEvent(event.id)
        : await eventsApi.unbookmarkEvent(event.id);
      const payload = response.data?.data ?? {};

      setDiscoverEvents((previous) =>
        previous.map((item) =>
          item.id === event.id
            ? {
                ...item,
                isSaved:
                  typeof payload.isSaved === "boolean"
                    ? payload.isSaved
                    : nextSaved,
                totalSaves:
                  typeof payload.totalSaves === "number"
                    ? payload.totalSaves
                    : item.totalSaves,
              }
            : item,
        ),
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to update saved state";
      setError(message);
      setDiscoverEvents((previous) =>
        previous.map((item) =>
          item.id === event.id
            ? {
                ...item,
                isSaved: previousSaved,
                totalSaves: Math.max(
                  0,
                  (item.totalSaves ?? 0) + (previousSaved ? 1 : -1),
                ),
              }
            : item,
        ),
      );
    } finally {
      setTogglingEventId(null);
    }
  };

  return (
    <EventListView
      registeredEvents={registeredEvents}
      discoverEvents={discoverEvents}
      pagination={pagination}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLoading={isLoading}
      error={error}
      onRetry={() => fetchStudentEvents(discoverPage)}
      onToggleSave={handleToggleSave}
      togglingEventId={togglingEventId}
      onPageChange={(nextPage) =>
        setDiscoverPage(
          Math.max(1, Math.min(nextPage, pagination.totalPages || 1)),
        )
      }
    />
  );
};

export default DashboardEventHub;
