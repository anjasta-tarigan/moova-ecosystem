import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Search,
  Filter,
  ArrowRight,
  Tag,
  Globe,
  Users,
  Layers,
  ChevronDown,
  X,
  Trophy,
  CalendarPlus,
  Download,
  ExternalLink,
  Play,
  Mic,
} from "lucide-react";
import Section from "../components/Section";
import Button from "../components/Button";
import { eventsApi } from "../services/api/eventsApi";
import { formatDate } from "../lib/utils";
import LoadingSpinner from "../components/LoadingSpinner";

// --- Animation Helper (Inlined for standalone usage) ---
const useOnScreen = (ref: React.RefObject<Element>, rootMargin = "0px") => {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return isIntersecting;
};

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref, "-50px");
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        onScreen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};

type EventItem = {
  id: string;
  title: string;
  shortDescription: string;
  date: string;
  location: string;
  format: string;
  category: string;
  image: string;
  status: string;
  deadline?: string;
  teamSizeMin?: number;
  teamSizeMax?: number;
  _count?: { registrations?: number };
};

const statusOptions = [
  { label: "All", value: "All" },
  { label: "Open", value: "OPEN" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Closed", value: "CLOSED" },
];

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState<string>(
    statusOptions[0].value,
  );
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Calendar Modal State
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedEventForCalendar, setSelectedEventForCalendar] =
    useState<EventItem | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page };
      if (searchTerm) params.search = searchTerm;
      if (activeCategory !== "All") params.category = activeCategory;
      if (activeStatus !== "All") params.status = activeStatus;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const res = await eventsApi.getEvents(params);
      const data: EventItem[] = res.data?.data || [];
      setEvents(data);
      setTotal(res.data?.pagination?.total || 0);
      setTotalPages(res.data?.pagination?.totalPages || 1);

      const categoryNames = Array.from(
        new Set(
          data
            .map((evt) => evt.category)
            .filter((cat): cat is string => Boolean(cat)),
        ),
      );
      setCategories(["All", ...categoryNames]);
    } catch (err) {
      setError("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeCategory, activeStatus, dateRange, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeCategory, activeStatus, dateRange]);

  // Helper to parse event date string from API to Date object
  const parseEventDate = (dateStr: string) => {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  // --- Calendar Logic ---

  const getEventDates = (dateStr: string) => {
    const startDate = parseEventDate(dateStr);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    return { startDate, endDate };
  };

  const handleAddToGoogle = () => {
    if (!selectedEventForCalendar) return;
    const { startDate, endDate } = getEventDates(selectedEventForCalendar.date);

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "");
    };

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.append("action", "TEMPLATE");
    url.searchParams.append("text", selectedEventForCalendar.title);
    url.searchParams.append(
      "dates",
      `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    );
    url.searchParams.append(
      "details",
      selectedEventForCalendar.shortDescription + "\n\nLearn more at GIVA.",
    );
    url.searchParams.append("location", selectedEventForCalendar.location);

    window.open(url.toString(), "_blank");
    setCalendarModalOpen(false);
  };

  const handleDownloadICS = () => {
    if (!selectedEventForCalendar) return;
    const { startDate, endDate } = getEventDates(selectedEventForCalendar.date);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "");
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GIVA//Ecosystem//EN",
      "BEGIN:VEVENT",
      `UID:${selectedEventForCalendar.id}@GIVA.io`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${selectedEventForCalendar.title}`,
      `DESCRIPTION:${selectedEventForCalendar.shortDescription}`,
      `LOCATION:${selectedEventForCalendar.location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${selectedEventForCalendar.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCalendarModalOpen(false);
  };

  const openCalendarModal = (e: React.MouseEvent, event: EventItem) => {
    e.stopPropagation();
    setSelectedEventForCalendar(event);
    setCalendarModalOpen(true);
  };

  // Status Badge Helper
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "UPCOMING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CLOSED":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatStatusLabel = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === "OPEN") return "Open";
    if (normalized === "UPCOMING") return "Upcoming";
    if (normalized === "CLOSED") return "Closed";
    return status;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory("All");
    setActiveStatus("All");
    setDateRange({ start: "", end: "" });
    setPage(1);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
        {/* Warm Orange Glow */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-orange-200/30 to-red-200/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="max-w-xl">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                  <Mic size={14} className="text-orange-500" />
                  Live Stages
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Where ideas{" "}
                  <span className="text-slate-500">Compete & Evolve.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Join summits, hackathons, and workshops designed to foster
                  connection and accelerate knowledge exchange.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() =>
                      document
                        .getElementById("events-list")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Explore Upcoming Events
                  </Button>
                  <Button variant="white">Host an Event</Button>
                </div>
              </FadeIn>
            </div>

            {/* Interactive Events UI */}
            <div className="relative h-[550px] w-full hidden lg:flex items-center justify-center">
              {/* Event Ticket (Back) */}
              <div className="absolute top-8 right-10 w-[300px] bg-white rounded-2xl shadow-xl border border-slate-200 p-0 overflow-hidden transform rotate-6 opacity-60">
                <div className="h-32 bg-slate-800"></div>
                <div className="p-4 border-b border-dashed border-slate-300 relative">
                  <div className="absolute -left-2 bottom-[-10px] w-4 h-4 bg-slate-50 rounded-full"></div>
                  <div className="absolute -right-2 bottom-[-10px] w-4 h-4 bg-slate-50 rounded-full"></div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                </div>
                <div className="p-4">
                  <div className="h-8 w-full bg-slate-100 rounded"></div>
                </div>
              </div>

              {/* Live Player Mockup (Front) */}
              <div
                className="absolute top-20 left-0 right-10 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-float"
                style={{ animationDuration: "7s" }}
              >
                <div className="bg-black aspect-video relative flex items-center justify-center group">
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>{" "}
                    Live
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-sm font-bold">
                      Keynote: The Future of Biotech
                    </div>
                    <div className="text-xs opacity-70">
                      Dr. Sarah Miller • Live from London
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 -ml-4"></div>
                    <div className="text-xs text-slate-500 font-medium pl-1">
                      +420 Watching
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    Join Session
                  </Button>
                </div>
              </div>

              {/* Agenda Card */}
              <div
                className="absolute -bottom-4 left-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-20 animate-float"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="text-xs font-bold text-slate-400 uppercase mb-3">
                  Up Next
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="text-xs font-mono text-slate-500">
                      10:00
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      Panel Discussion
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="text-xs font-mono text-slate-500">
                      11:30
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      Networking Break
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section
        id="events-list"
        tag="Discover"
        headline="Upcoming Initiatives"
        subheadline="Explore summits, hackathons, and workshops tailored to your scientific journey."
        className="pt-16 pb-0 bg-slate-50"
      >
        {/* Search and Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
          <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
            {/* Search */}
            <div className="relative w-full xl:max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search events, topics, or locations..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center justify-end">
              {/* Date Range Picker */}
              <div className="flex items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-lg text-sm hover:border-slate-300 transition-colors shadow-sm w-full sm:w-auto">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <input
                  type="date"
                  className="bg-transparent border-none p-0 text-slate-600 focus:ring-0 outline-none w-full sm:w-auto"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  aria-label="Start Date"
                />
                <span className="text-slate-300 px-1">-</span>
                <input
                  type="date"
                  className="bg-transparent border-none p-0 text-slate-600 focus:ring-0 outline-none w-full sm:w-auto"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  aria-label="End Date"
                />
                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={() => setDateRange({ start: "", end: "" })}
                    className="ml-1 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="relative group w-full sm:w-auto">
                <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-slate-300 transition-colors w-full justify-between sm:w-48 shadow-sm">
                  <div className="flex items-center gap-2 truncate">
                    <Filter size={16} className="shrink-0" />
                    <span className="truncate">
                      {activeCategory === "All"
                        ? "Category: All"
                        : activeCategory}
                    </span>
                  </div>
                  <ChevronDown size={14} className="shrink-0" />
                </button>
                {/* Dropdown Logic (Simplified for CSS) */}
                <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-white border border-slate-100 shadow-lg rounded-xl overflow-hidden hidden group-hover:block z-20">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${activeCategory === cat ? "text-primary-600 font-bold" : "text-slate-600"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
                {statusOptions.slice(0, 3).map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setActiveStatus(value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1 sm:flex-none ${
                      activeStatus === value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Events Grid */}
      <section className="pb-24 bg-slate-50 pt-12">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl">
          <div className="grid grid-cols-1 gap-6">
            {isLoading && (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"
                  >
                    <div className="h-48 bg-slate-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
                <div className="flex justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchEvents}
                  className="mt-4 text-primary-600 hover:underline text-sm font-bold"
                >
                  Try Again
                </button>
              </div>
            )}

            {!isLoading &&
              !error &&
              events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-primary-400 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col md:flex-row relative"
                >
                  {/* Image */}
                  <div className="md:w-1/3 lg:w-1/4 h-56 md:h-auto overflow-hidden relative">
                    <img
                      src={
                        event.image ||
                        "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(event.status)}`}
                      >
                        {formatStatusLabel(event.status)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-primary-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Tag size={12} /> {event.category}
                        </span>
                        {event.format?.toUpperCase() === "HYBRID" && (
                          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <Layers size={12} /> Hybrid
                          </span>
                        )}
                        {event.format?.toUpperCase() === "ONLINE" && (
                          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <Globe size={12} /> Online
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-primary-700 transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-slate-600 leading-relaxed mb-6 line-clamp-2">
                        {event.shortDescription}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <Calendar size={16} />
                          </div>
                          <span className="font-medium">
                            {formatDate(event.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <MapPin size={16} />
                          </div>
                          <span className="font-medium">{event.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-auto">
                      <div className="flex -space-x-2">
                        <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-500">
                          <Users size={16} />
                        </div>
                        <div className="flex items-center text-sm font-semibold text-slate-700 ml-2">
                          {event._count?.registrations ?? 0} registered
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => openCalendarModal(e, event)}
                          className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-colors"
                          title="Add to Calendar"
                        >
                          <CalendarPlus size={18} />
                        </button>
                        <span className="text-primary-600 font-semibold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          View Details <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {!isLoading && !error && events.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No events found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your filters, search terms, or date range.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-primary-600 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Add to Calendar Modal */}
      {calendarModalOpen && selectedEventForCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setCalendarModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Add to Calendar
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                    {selectedEventForCalendar.title}
                  </p>
                </div>
                <button
                  onClick={() => setCalendarModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAddToGoogle}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <ExternalLink size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700">
                      Google Calendar
                    </div>
                    <div className="text-xs text-slate-500">
                      Open in new tab
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleDownloadICS}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                    <Download size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-primary-700">
                      Outlook / Apple
                    </div>
                    <div className="text-xs text-slate-500">
                      Download .ics file
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
