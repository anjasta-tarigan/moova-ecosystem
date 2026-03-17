
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { EVENTS } from '../constants';
import { 
  Calendar, MapPin, Search, Filter, ArrowRight, Tag, 
  Globe, Users, Layers, ChevronDown, X, Trophy, CalendarPlus,
  Download, ExternalLink, Play, Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Animation Helper (Inlined for standalone usage) ---
const useOnScreen = (ref: React.RefObject<Element>, rootMargin = '0px') => {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return isIntersecting;
};

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref, '-50px');
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        onScreen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Calendar Modal State
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedEventForCalendar, setSelectedEventForCalendar] = useState<typeof EVENTS[0] | null>(null);

  const categories = ['All', 'Conference', 'Competition', 'Workshop', 'Innovation Challenge'];
  const statuses = ['All', 'Open', 'Upcoming', 'Closed'];

  // Helper to parse event date string (e.g., "Oct 12-14, 2024") to Date object
  const parseEventDate = (dateStr: string) => {
    const months: {[key: string]: number} = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    
    try {
      // Split "Oct 12-14, 2024" -> ["Oct 12-14", "2024"]
      const parts = dateStr.split(',');
      if (parts.length < 2) return new Date(0); // Fallback for invalid format
      
      const year = parseInt(parts[1].trim());
      const datePart = parts[0].trim(); // "Oct 12-14"
      
      const [monthStr, dayRange] = datePart.split(' ');
      // Take the first day if it's a range like "12-14"
      const day = parseInt(dayRange.split('-')[0]); 
      
      const month = months[monthStr];
      
      if (month === undefined || isNaN(day) || isNaN(year)) return new Date(0);
      
      return new Date(year, month, day);
    } catch (e) {
      return new Date(0);
    }
  };

  // --- Calendar Logic ---

  const getEventDates = (dateStr: string) => {
    const months: {[key: string]: number} = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    const now = new Date();
    
    try {
      // Parse "Oct 12-14, 2024" or "Nov 05, 2024"
      const parts = dateStr.split(',');
      const year = parts.length > 1 ? parseInt(parts[1].trim()) : now.getFullYear();
      const datePart = parts[0].trim(); // "Oct 12-14"
      
      const [monthStr, dayRange] = datePart.split(' ');
      const month = months[monthStr];
      
      let startDay = 1;
      let endDay = 1;

      if (dayRange.includes('-')) {
        const [s, e] = dayRange.split('-');
        startDay = parseInt(s);
        endDay = parseInt(e);
      } else {
        startDay = parseInt(dayRange);
        endDay = parseInt(dayRange);
      }

      const startDate = new Date(year, month, startDay, 9, 0, 0); // Default 9 AM
      const endDate = new Date(year, month, endDay, 17, 0, 0);   // Default 5 PM

      return { startDate, endDate };
    } catch (e) {
      return { startDate: now, endDate: now };
    }
  };

  const handleAddToGoogle = () => {
    if (!selectedEventForCalendar) return;
    const { startDate, endDate } = getEventDates(selectedEventForCalendar.date);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', selectedEventForCalendar.title);
    url.searchParams.append('dates', `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`);
    url.searchParams.append('details', selectedEventForCalendar.shortDescription + "\n\nLearn more at GIVA.");
    url.searchParams.append('location', selectedEventForCalendar.location);

    window.open(url.toString(), '_blank');
    setCalendarModalOpen(false);
  };

  const handleDownloadICS = () => {
    if (!selectedEventForCalendar) return;
    const { startDate, endDate } = getEventDates(selectedEventForCalendar.date);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GIVA//Ecosystem//EN',
      'BEGIN:VEVENT',
      `UID:${selectedEventForCalendar.id}@GIVA.io`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${selectedEventForCalendar.title}`,
      `DESCRIPTION:${selectedEventForCalendar.shortDescription}`,
      `LOCATION:${selectedEventForCalendar.location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${selectedEventForCalendar.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCalendarModalOpen(false);
  };

  const openCalendarModal = (e: React.MouseEvent, event: typeof EVENTS[0]) => {
    e.stopPropagation();
    setSelectedEventForCalendar(event);
    setCalendarModalOpen(true);
  };

  // Filter Logic
  const filteredEvents = useMemo(() => {
    return EVENTS.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
      const matchesStatus = activeStatus === 'All' || event.status === activeStatus;
      
      // Date Range Check
      let inDateRange = true;
      const eventDate = parseEventDate(event.date);

      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (eventDate < startDate) inDateRange = false;
      }

      if (dateRange.end && inDateRange) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (eventDate > endDate) inDateRange = false;
      }
      
      return matchesSearch && matchesCategory && matchesStatus && inDateRange;
    });
  }, [searchTerm, activeCategory, activeStatus, dateRange]);

  // Status Badge Helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Closed': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory('All');
    setActiveStatus('All');
    setDateRange({ start: '', end: '' });
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
                  Where ideas <span className="text-slate-500">Compete & Evolve.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Join summits, hackathons, and workshops designed to foster connection and accelerate knowledge exchange.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => document.getElementById('events-list')?.scrollIntoView({ behavior: 'smooth'})}>
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
              <div className="absolute top-20 left-0 right-10 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-float" style={{ animationDuration: '7s' }}>
                <div className="bg-black aspect-video relative flex items-center justify-center group">
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-sm font-bold">Keynote: The Future of Biotech</div>
                    <div className="text-xs opacity-70">Dr. Sarah Miller • Live from London</div>
                  </div>
                </div>
                
                <div className="p-4 bg-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 -ml-4"></div>
                    <div className="text-xs text-slate-500 font-medium pl-1">+420 Watching</div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-8">Join Session</Button>
                </div>
              </div>

              {/* Agenda Card */}
              <div className="absolute -bottom-4 left-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="text-xs font-bold text-slate-400 uppercase mb-3">Up Next</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="text-xs font-mono text-slate-500">10:00</div>
                    <div className="text-sm font-bold text-slate-900">Panel Discussion</div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="text-xs font-mono text-slate-500">11:30</div>
                    <div className="text-sm font-bold text-slate-900">Networking Break</div>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
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
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  aria-label="Start Date"
                />
                <span className="text-slate-300 px-1">-</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none p-0 text-slate-600 focus:ring-0 outline-none w-full sm:w-auto"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  aria-label="End Date"
                />
                {(dateRange.start || dateRange.end) && (
                   <button 
                    onClick={() => setDateRange({ start: '', end: '' })}
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
                    <span className="truncate">{activeCategory === 'All' ? 'Category: All' : activeCategory}</span>
                  </div>
                  <ChevronDown size={14} className="shrink-0" />
                </button>
                {/* Dropdown Logic (Simplified for CSS) */}
                <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-white border border-slate-100 shadow-lg rounded-xl overflow-hidden hidden group-hover:block z-20">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${activeCategory === cat ? 'text-primary-600 font-bold' : 'text-slate-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
                {statuses.slice(0, 3).map(status => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1 sm:flex-none ${
                      activeStatus === status 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {status}
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
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => navigate(`/events/${event.id}`)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-primary-400 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col md:flex-row relative"
              >
                {/* Image */}
                <div className="md:w-1/3 lg:w-1/4 h-56 md:h-auto overflow-hidden relative">
                   <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(event.status)}`}>
                      {event.status}
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
                      {event.format === 'Hybrid' && (
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Layers size={12} /> Hybrid
                        </span>
                      )}
                       {event.format === 'Online' && (
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
                        <span className="font-medium">{event.date}</span>
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
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          <Users size={12} />
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 pl-1">
                        +40
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

            {filteredEvents.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No events found</h3>
                <p className="text-slate-500">Try adjusting your filters, search terms, or date range.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 text-primary-600 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add to Calendar Modal */}
      {calendarModalOpen && selectedEventForCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCalendarModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add to Calendar</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{selectedEventForCalendar.title}</p>
                  </div>
                  <button onClick={() => setCalendarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                      <div className="font-bold text-slate-900 group-hover:text-blue-700">Google Calendar</div>
                      <div className="text-xs text-slate-500">Open in new tab</div>
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
                      <div className="font-bold text-slate-900 group-hover:text-primary-700">Outlook / Apple</div>
                      <div className="text-xs text-slate-500">Download .ics file</div>
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
