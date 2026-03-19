import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await profileApi.getMyEvents();
        setEvents(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
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
        <div className="text-slate-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 bg-slate-50">
          No events joined yet.
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const res = await eventsApi.getEvent(id);
        setEvent(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="text-slate-500">Loading event...</div>;
  if (!event) return <div className="text-slate-500">Event not found.</div>;

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
