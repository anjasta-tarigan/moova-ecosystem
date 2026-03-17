
import React, { useState, useRef, useEffect } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, List, Filter, 
  Clock, MapPin, X, CheckCircle, AlertCircle, CalendarPlus, ArrowRight, Flag,
  MoreHorizontal
} from 'lucide-react';

// --- Animation Helper (Inlined) ---
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

// --- Types ---
type EventType = 'deadline' | 'event' | 'workshop' | 'milestone';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: EventType;
  description: string;
  location?: string;
  status: 'open' | 'registered' | 'closed';
  sdg?: number;
}

// --- Mock Data Generator ---
const getMockEvents = (): CalendarEvent[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  return [
    {
      id: '1',
      title: 'Global Summit Applications Close',
      date: new Date(year, month, 5, 23, 59),
      type: 'deadline',
      description: 'Final submission deadline for the 2024 Global Science Summit startup showcase. Ensure all pitch decks and technical validations are uploaded.',
      status: 'open',
      sdg: 9
    },
    {
      id: '2',
      title: 'BioTech Innovation Workshop',
      date: new Date(year, month, 12, 14, 0),
      type: 'workshop',
      description: 'A deep dive into CRISPR applications in sustainable agriculture. Led by Dr. Sarah Chen from BioLabs.',
      location: 'Virtual / Zoom',
      status: 'registered',
      sdg: 2
    },
    {
      id: '3',
      title: 'Ecosystem Townhall',
      date: new Date(year, month, 15, 16, 0),
      type: 'event',
      description: 'Quarterly community updates, new partner announcements, and open Q&A with the MOOVA leadership team.',
      location: 'Live Stream',
      status: 'open',
      sdg: 17
    },
    {
      id: '4',
      title: 'Mentor Matchmaking',
      date: new Date(year, month, 22, 10, 0),
      type: 'event',
      description: 'Speed networking session for early-stage founders and industry mentors. Pre-registration required.',
      location: 'London Hub',
      status: 'closed',
      sdg: 4
    },
    {
      id: '5',
      title: 'Q4 Grant Cycle Opens',
      date: new Date(year, month, 28, 9, 0),
      type: 'milestone',
      description: 'Applications open for the Q4 deep tech grant cycle. Focus areas: Clean Energy and AI Safety.',
      status: 'open',
      sdg: 7
    },
     {
      id: '6',
      title: 'Climate Tech Hackathon',
      date: new Date(year, month, 8, 9, 0),
      type: 'event',
      description: '48-hour hackathon focused on carbon capture solutions.',
      location: 'Berlin Hub',
      status: 'open',
      sdg: 13
    }
  ];
};

const EVENTS = getMockEvents();

// --- Components ---

const EventBadge: React.FC<{ type: EventType, mini?: boolean }> = ({ type, mini = false }) => {
  const styles = {
    deadline: "bg-red-50 text-red-700 border-red-100",
    event: "bg-primary-50 text-primary-700 border-primary-100",
    workshop: "bg-secondary-50 text-secondary-700 border-secondary-100",
    milestone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  const labels = {
    deadline: "Deadline",
    event: "Live Event",
    workshop: "Workshop",
    milestone: "Milestone",
  };

  if (mini) {
    return <div className={`w-2 h-2 rounded-full ${styles[type].split(' ')[1].replace('text', 'bg')}`} />;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
};

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');

  // Navigation Logic
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Calendar Grid Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const daysArray = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    // Days of current month
    for (let i = 1; i <= days; i++) {
      daysArray.push(new Date(year, month, i));
    }
    return daysArray;
  };

  const days = getDaysInMonth(currentDate);

  const filteredEvents = EVENTS.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(e => 
      e.date.getDate() === date.getDate() && 
      e.date.getMonth() === date.getMonth() && 
      e.date.getFullYear() === date.getFullYear()
    );
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
        {/* Soft amber background glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-amber-100/30 to-yellow-100/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="max-w-xl">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                  <Clock size={14} className="text-amber-500" />
                  Timeline
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Never Miss a <span className="text-slate-500">Milestone.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Your single source of truth for grant deadlines, global summits, and workshops across the ecosystem.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => document.getElementById('calendar-header')?.scrollIntoView({ behavior: 'smooth' })}>
                    View Full Schedule
                  </Button>
                  <Button variant="white">Sync Calendar</Button>
                </div>
              </FadeIn>
            </div>

            {/* Interactive Calendar UI Showcase */}
            <div className="relative h-[550px] w-full hidden lg:flex items-center justify-center">
              
              {/* Main Calendar Card */}
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative z-10 animate-float" style={{ animationDuration: '10s' }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 text-lg">October 2024</h3>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><ChevronLeft size={16}/></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><ChevronRight size={16}/></div>
                  </div>
                </div>
                
                {/* Mock Grid */}
                <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-sm mb-4">
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-slate-400 text-xs font-bold">{d}</div>)}
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => {
                    const isToday = d === 12;
                    const hasEvent = [5, 12, 15, 28].includes(d);
                    return (
                      <div key={d} className={`h-8 w-8 flex items-center justify-center rounded-full mx-auto relative ${isToday ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        {d}
                        {hasEvent && !isToday && <div className="absolute bottom-1 w-1 h-1 bg-primary-500 rounded-full"></div>}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Upcoming</div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded flex flex-col items-center justify-center text-xs font-bold border border-slate-200 text-slate-700 shadow-sm">
                      <span>OCT</span><span>12</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">BioTech Workshop</div>
                      <div className="text-[10px] text-slate-500">14:00 • Virtual</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Notification */}
              <div className="absolute top-20 -right-8 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-700">Registration Confirmed</div>
                    <div className="text-[10px] text-slate-500">Global Summit 2024</div>
                  </div>
                </div>
              </div>

              {/* Floating Time Slot */}
              <div className="absolute bottom-32 -left-12 bg-white p-3 rounded-lg shadow-lg border border-slate-200 z-20 flex items-center gap-3 animate-float" style={{ animationDelay: '3s' }}>
                <div className="text-xs font-mono font-bold text-slate-400">09:00 AM</div>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="text-xs font-bold text-slate-700">Grant Deadline</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Section
        id="calendar-header"
        tag="Ecosystem Calendar"
        headline="Key Moments"
        subheadline="Track deadlines, attend workshops, and stay ahead of the curve."
        className="pt-16 pb-12 bg-slate-50"
      >
        {/* Dashboard Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
          
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center p-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-white rounded-md text-slate-500 hover:text-slate-900 transition-all shadow-sm hover:shadow"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 flex items-center font-bold text-slate-900 w-40 justify-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-white rounded-md text-slate-500 hover:text-slate-900 transition-all shadow-sm hover:shadow"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={16} /> Filter
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-white text-primary-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <CalIcon size={16} /> Month
              </button>
              <button 
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'agenda' ? 'bg-white text-primary-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <List size={16} /> Agenda
              </button>
            </div>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="bg-white">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr bg-slate-50 gap-px border-b border-slate-200">
                {days.map((date, idx) => {
                  if (!date) return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[140px]" />;
                  
                  const dayEvents = getEventsForDay(date);
                  const isToday = new Date().toDateString() === date.toDateString();

                  return (
                    <div 
                      key={date.toString()} 
                      className={`bg-white p-2 min-h-[140px] hover:bg-slate-50 transition-colors group relative border-b border-slate-100`}
                    >
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-primary-600 text-white' : 'text-slate-400 group-hover:text-slate-900'}`}>
                        {date.getDate()}
                      </span>
                      
                      <div className="flex flex-col gap-1.5">
                        {dayEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="text-left px-2 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-100 shadow-sm hover:border-primary-300 hover:shadow-md transition-all truncate flex items-center gap-1.5"
                          >
                            <EventBadge type={event.type} mini />
                            <span className="truncate text-slate-700">{event.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agenda View */}
          {viewMode === 'agenda' && (
            <div className="divide-y divide-slate-100 bg-white min-h-[500px]">
              {filteredEvents.sort((a,b) => a.date.getTime() - b.date.getTime()).map(event => (
                <div 
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center min-w-[80px] text-slate-900">
                    <span className="text-3xl font-bold">{event.date.getDate()}</span>
                    <span className="text-xs uppercase font-bold text-slate-400">{monthNames[event.date.getMonth()].slice(0,3)}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <EventBadge type={event.type} />
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock size={12} /> {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors mb-1">
                      {event.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-1">{event.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {event.status === 'registered' && (
                      <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                        <CheckCircle size={12} /> Registered
                      </span>
                    )}
                     {event.type === 'deadline' && (
                      <span className="text-red-600 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                        <AlertCircle size={12} /> Due Soon
                      </span>
                    )}
                    <ChevronRight className="text-slate-300 group-hover:text-primary-500" />
                  </div>
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  No events found for this filter.
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Side Panel Overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedEvent(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mt-8 mb-8">
              <EventBadge type={selectedEvent.type} />
              <h2 className="text-3xl font-bold text-slate-900 mt-4 leading-tight">{selectedEvent.title}</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 text-slate-600">
                <Clock className="shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedEvent.date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm">
                    {selectedEvent.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEvent.date.getTime() + 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start gap-4 text-slate-600">
                  <MapPin className="shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-slate-900">{selectedEvent.location}</p>
                    <a href="#" className="text-sm text-primary-600 hover:underline">View Map</a>
                  </div>
                </div>
              )}
              
              {selectedEvent.sdg && (
                 <div className="flex items-start gap-4 text-slate-600">
                  <div className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 font-bold text-xs text-slate-500 mt-1">
                    {selectedEvent.sdg}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">SDG Aligned</p>
                    <p className="text-sm text-slate-500">This initiative supports Goal {selectedEvent.sdg}.</p>
                  </div>
                </div>
              )}

              <hr className="border-slate-100" />
              
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">About this item</h4>
                <p className="text-slate-600 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <Button fullWidth>
                  {selectedEvent.type === 'deadline' ? 'Submit Application' : 'Register Now'}
                </Button>
                <button className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 rounded-full text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                  <CalendarPlus size={18} /> Add to Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
