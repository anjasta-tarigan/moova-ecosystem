import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import Button from "../components/Button";
import { profileApi } from "../services/api/profileApi";
import { eventsApi } from "../services/api/eventsApi";
import { submissionsApi } from "../services/api/submissionsApi";

interface EventRegistration {
  id: string;
  event: {
    id: string;
    title: string;
    location?: string;
    format?: string;
    deadline?: string;
    category?: string;
    status?: string;
  };
  team?: { name: string } | null;
}

interface EventDetail {
  id: string;
  title: string;
  location?: string;
  format?: string;
  deadline?: string;
  date?: string;
  category?: string;
  status?: string;
  fullDescription?: string;
  timeline?: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
  }>;
}

const EventListView = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await profileApi.getMyEvents();
      setEvents(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            My Events
          </h1>
          <p className="text-slate-500 mt-1">Events you have already joined.</p>
        </div>
        <Button onClick={() => navigate("/events")}>Browse New Events</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Failed to load data</p>
          <button
            onClick={fetchEvents}
            className="mt-3 text-sm text-red-600 hover:underline font-bold"
          >
            Try Again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No data available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {events.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/dashboard/event/${item.event.id}`)}
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

              <div className="flex flex-col items-end gap-2 min-w-[140px]">
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
          ))}
        </div>
      )}
    </div>
  );
};

const EventDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [submission, setSubmission] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDetail = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!id) return;
      const [eventRes, submissionsRes] = await Promise.all([
        eventsApi.getEvent(id),
        submissionsApi.getMySubmissions(),
      ]);

      setEvent(eventRes.data.data);
      const submissions = submissionsRes.data.data || [];
      const found = submissions.find(
        (item: any) => item.eventId === id || item.event?.id === id,
      );
      setSubmission(found || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const stageState = (stage: "ABSTRACT" | "PAPER" | "FINAL") => {
    const current = (submission?.currentStage || "").toUpperCase();
    if (stage === "ABSTRACT") {
      if (current === "ABSTRACT") return "active" as const;
      if (current === "PAPER" || current === "FINAL")
        return "completed" as const;
      return "locked" as const;
    }
    if (stage === "PAPER") {
      if (current === "PAPER") return "active" as const;
      if (current === "FINAL") return "completed" as const;
      return "locked" as const;
    }
    if (stage === "FINAL") {
      if (current === "FINAL") return "active" as const;
      return "locked" as const;
    }
    return "locked" as const;
  };

  const stageChipClass = (state: "active" | "completed" | "locked") => {
    if (state === "active")
      return "bg-blue-50 text-blue-700 border border-blue-200";
    if (state === "completed")
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    return "bg-slate-100 text-slate-500 border border-slate-200";
  };

  const handleUpload = async (file?: File) => {
    if (!submission || !file) return;
    setUploading(true);
    try {
      const res = await submissionsApi.uploadFile(submission.id, file);
      const uploaded = res.data.data;
      setSubmission({
        ...submission,
        files: [...(submission.files || []), uploaded],
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submission) return;
    setSubmitting(true);
    try {
      await submissionsApi.submitSubmission(submission.id);
      await fetchDetail();
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">Failed to load data</p>
        <button
          onClick={fetchDetail}
          className="mt-3 text-sm text-red-600 hover:underline font-bold"
        >
          Try Again
        </button>
      </div>
    );

  if (!event)
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-sm">No data available yet</p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <button
          onClick={() => navigate("/dashboard/event/list")}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to My Events
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {event.status && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded border border-emerald-200">
                  {event.status}
                </span>
              )}
              {event.category && (
                <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                  <Calendar size={14} /> {event.category}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {event.title}
            </h1>
            {event.fullDescription && (
              <p className="text-slate-600 max-w-3xl leading-relaxed text-sm">
                {event.fullDescription}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-3">
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {event.location}
                </span>
              )}
              {event.format && <span>{event.format}</span>}
              {event.deadline && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Deadline {event.deadline}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/team/manage")}
            >
              Manage Team
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Submission Progress
            </h3>
            <p className="text-sm text-slate-500">
              Track your current stage and upload required files.
            </p>
          </div>
          {submission?.status && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 self-start">
              {submission.status}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {["ABSTRACT", "PAPER", "FINAL"].map((stage) => {
            const state = stageState(stage as "ABSTRACT" | "PAPER" | "FINAL");
            return (
              <div
                key={stage}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${stageChipClass(state)}`}
              >
                <div className="font-bold text-sm">{stage}</div>
                <div className="text-[11px] uppercase font-bold">
                  {state === "active"
                    ? "In Progress"
                    : state === "completed"
                      ? "Completed"
                      : "Locked"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Files</h4>
            {submission && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            )}
          </div>

          {submission?.files?.length ? (
            <div className="space-y-2">
              {submission.files.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm"
                >
                  <span className="text-slate-700">{file.name}</span>
                  <span className="text-slate-400 text-xs">
                    {file.size || ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No files uploaded yet.</div>
          )}

          {submission && (
            <div className="flex justify-end gap-3 pt-3">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/dashboard/submission/${submission.id}`)
                }
              >
                Open Submission
              </Button>
            </div>
          )}
        </div>
      </div>

      {event.timeline && event.timeline.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Timeline</h3>
          <div className="space-y-4">
            {event.timeline.map((item) => (
              <div key={item.id} className="flex gap-4 items-start">
                <div className="w-24 text-sm font-bold text-slate-600">
                  {item.date}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardEventHub: React.FC = () => {
  const { id } = useParams();
  // If ID is 'list' or undefined, show list view. Otherwise details.
  // Note: We use a specific route param or check layout
  if (!id || id === "list") {
    return <EventListView />;
  }
  return <EventDetailView />;
};

export default DashboardEventHub;
