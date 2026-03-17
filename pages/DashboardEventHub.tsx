
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Users, FileText, ChevronLeft, 
  MessageSquare, Download, Clock, CheckCircle, 
  AlertCircle, Briefcase, Layers, ArrowRight, UploadCloud, Lock, Star, ChevronRight
} from 'lucide-react';
import Button from '../components/Button';

// --- MOCK DATA ---
const MY_EVENTS = [
  {
    id: "global-science-summit-2024",
    title: "Global Science Summit 2024",
    status: "Active",
    role: "Team Leader",
    team: "Project Alpha",
    stage: "Full Paper",
    nextDeadline: "Oct 15, 2024"
  },
  {
    id: "deep-tech-hackathon",
    title: "Deep Tech Hackathon",
    status: "Active",
    role: "Member",
    team: "Neural Net X",
    stage: "Abstract",
    nextDeadline: "Nov 01, 2024"
  }
];

const EVENT_DETAIL = {
  id: "global-science-summit-2024",
  title: "Global Science Summit 2024",
  team: "Project Alpha",
  status: "Active",
  description: "The premier gathering for cross-border scientific collaboration. As a registered participant, you have access to the full agenda, networking tools, and submission portals.",
  stages: [
    {
      id: "abstract",
      title: "1. Abstract Review",
      status: "completed", // completed, active, locked
      score: 88,
      feedback: "Strong problem statement. Consider expanding on the methodology in the next phase.",
      deadline: "Aug 01, 2024",
      files: [{ name: "Abstract_Draft_v3.pdf", size: "1.2 MB" }]
    },
    {
      id: "paper",
      title: "2. Full Paper & Poster",
      status: "active",
      score: null,
      feedback: null,
      deadline: "Oct 15, 2024",
      requirements: ["Technical Paper (PDF)", "Digital Poster (JPG/PNG)", "Video Link"],
      files: [] // No files uploaded yet
    },
    {
      id: "final",
      title: "3. Final Presentation",
      status: "locked",
      score: null,
      feedback: null,
      deadline: "Dec 10, 2024",
      requirements: ["Pitch Deck", "Live Q&A"]
    }
  ]
};

// --- COMPONENTS ---

const EventListView = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Events</h1>
          <p className="text-slate-500 mt-1">Manage your active competitions and view past results.</p>
        </div>
        <Button onClick={() => navigate('/events')}>Browse New Events</Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {MY_EVENTS.map((event) => (
          <div 
            key={event.id}
            onClick={() => navigate(`/dashboard/event/${event.id}`)}
            className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-6"
          >
            <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 text-primary-600 font-bold text-xl">
              {event.title.charAt(0)}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{event.title}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Users size={16} /> {event.team}</span>
                <span className="flex items-center gap-1"><Briefcase size={16} /> {event.role}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 min-w-[140px]">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Stage</span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100 flex items-center gap-1">
                <Layers size={12} /> {event.stage}
              </span>
              <span className="text-xs text-slate-400 mt-1">Due: {event.nextDeadline}</span>
            </div>
            
            <ChevronRight className="text-slate-300 group-hover:text-primary-500" />
          </div>
        ))}
      </div>
    </div>
  );
};

const EventDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = EVENT_DETAIL; // In real app, fetch by ID
  const [activeTab, setActiveTab] = useState<'workflow' | 'resources'>('workflow');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <button 
          onClick={() => navigate('/dashboard/event/list')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to My Events
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded border border-emerald-200">
                {event.status}
              </span>
              <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                <Users size={14} /> Team: {event.team}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{event.title}</h1>
            <p className="text-slate-600 max-w-3xl leading-relaxed text-sm">{event.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/team/manage')}>Manage Team</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'workflow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Competition Stages
        </button>
        <button 
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'resources' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Resources & Rules
        </button>
      </div>

      {/* Workflow Stages */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          {event.stages.map((stage, idx) => {
            const isActive = stage.status === 'active';
            const isCompleted = stage.status === 'completed';
            const isLocked = stage.status === 'locked';

            return (
              <div 
                key={stage.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isActive ? 'bg-white border-primary-200 shadow-md ring-1 ring-primary-100' : 
                  isCompleted ? 'bg-slate-50 border-slate-200 opacity-90' : 
                  'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Stage Header */}
                <div className={`p-6 flex items-center justify-between border-b ${isActive ? 'border-primary-100 bg-primary-50/30' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCompleted ? 'bg-emerald-100 text-emerald-600' : 
                      isActive ? 'bg-primary-600 text-white' : 
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isCompleted ? <CheckCircle size={20} /> : (isLocked ? <Lock size={18} /> : (idx + 1))}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isActive ? 'text-primary-900' : 'text-slate-900'}`}>{stage.title}</h3>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-0.5">
                        Deadline: {stage.deadline}
                      </p>
                    </div>
                  </div>
                  
                  {isCompleted && stage.score && (
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
                      <div className="text-xl font-bold text-emerald-600">{stage.score}/100</div>
                    </div>
                  )}
                </div>

                {/* Stage Body */}
                <div className="p-6">
                  {/* Feedback Section if Completed */}
                  {isCompleted && stage.feedback && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 flex gap-3">
                      <MessageSquare className="text-emerald-600 shrink-0 mt-1" size={18} />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">Judge Feedback</h4>
                        <p className="text-sm text-emerald-800 mt-1">{stage.feedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Active Submission Area */}
                  {isActive && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <AlertCircle size={16} className="text-primary-600" /> Requirements
                          </h4>
                          <ul className="space-y-2">
                            {stage.requirements?.map((req, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer group">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-primary-600 group-hover:scale-110 transition-transform">
                            <UploadCloud size={24} />
                          </div>
                          <p className="text-sm font-bold text-slate-700">Upload Submission Files</p>
                          <p className="text-xs text-slate-400 mt-1">Drag & drop or click to browse</p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button>Submit for Review</Button>
                      </div>
                    </div>
                  )}

                  {/* Submitted Files (Read Only) */}
                  {isCompleted && stage.files && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Submitted Files</h4>
                      <div className="flex flex-wrap gap-3">
                        {stage.files.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 border border-slate-200">
                            <FileText size={16} /> {file.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isLocked && (
                    <div className="text-center py-4 text-slate-400 text-sm italic">
                      This stage will unlock once the previous stage is completed.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Download size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Event Resources</h3>
          <p className="text-slate-500 mb-6">Download templates, guidebooks, and rules.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            {['Participant Guide.pdf', 'Submission Template.docx', 'Official Rules.pdf'].map((res, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{res}</span>
                </div>
                <Download size={16} className="text-slate-400" />
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
  if (!id || id === 'list') {
    return <EventListView />;
  }
  return <EventDetailView />;
};

export default DashboardEventHub;
