
import React from 'react';
import { 
  Calendar, Briefcase, FileText, TrendingUp, Clock, 
  ArrowRight, CheckCircle, AlertCircle, Play, MoreHorizontal,
  Users, ChevronRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import DashboardProfile from './DashboardProfile';

// --- MOCK DATA ---
const USER_DATA = {
  firstName: "Alex",
  stats: {
    activeCompetitions: 2,
    upcomingDeadlines: 1,
    totalSubmissions: 5
  },
  // Active Events with Stage Data
  activeEvents: [
    {
      id: "global-science-summit-2024",
      title: "Global Science Summit 2024",
      team: "Project Alpha",
      role: "Leader",
      currentStage: "paper", // abstract, paper, final
      stages: [
        { id: 'abstract', label: 'Abstract', status: 'completed', score: 85 },
        { id: 'paper', label: 'Full Paper', status: 'active', deadline: 'Oct 15' },
        { id: 'final', label: 'Final Presentation', status: 'locked' }
      ],
      nextAction: "Submit Full Paper",
      deadline: "2 days left"
    },
    {
      id: "deep-tech-hackathon",
      title: "Deep Tech Hackathon: AI for Good",
      team: "Neural Net X",
      role: "Member",
      currentStage: "abstract",
      stages: [
        { id: 'abstract', label: 'Abstract', status: 'active', deadline: 'Nov 01' },
        { id: 'paper', label: 'Tech Demo', status: 'locked' },
        { id: 'final', label: 'Pitch', status: 'locked' }
      ],
      nextAction: "Team Formation",
      deadline: "5 days left"
    }
  ]
};

const OverviewView = () => {
  const navigate = useNavigate();

  const getStageColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-500 text-white border-emerald-500';
      case 'active': return 'bg-white border-primary-500 text-primary-600 ring-4 ring-primary-100';
      case 'locked': return 'bg-slate-100 border-slate-300 text-slate-400';
      default: return 'bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header & Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {USER_DATA.firstName}. Track your innovation journey.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[160px]">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{USER_DATA.stats.activeCompetitions}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Active Events</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[160px]">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{USER_DATA.stats.upcomingDeadlines}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Deadlines</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[160px]">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{USER_DATA.stats.totalSubmissions}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Competitions (Hero Cards) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Active Competitions</h2>
          <button onClick={() => navigate('/dashboard/event/list')} className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1">
            View All <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {USER_DATA.activeEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-600 tracking-wide">
                      {event.role}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Users size={12} /> {event.team}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{event.title}</h3>
                </div>
                <div className="text-right">
                  {event.deadline && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                      <Clock size={12} /> {event.deadline}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="relative flex items-center justify-between">
                  {/* Connector Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2"></div>
                  
                  {event.stages.map((stage, idx) => (
                    <div key={stage.id} className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-colors ${getStageColor(stage.status)}`}>
                        {stage.status === 'completed' ? <CheckCircle size={16} /> : (idx + 1)}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${stage.status === 'active' ? 'text-primary-700' : 'text-slate-400'}`}>
                        {stage.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs text-slate-500 font-medium">
                  Next Step: <span className="text-slate-900 font-bold">{event.nextAction}</span>
                </div>
                <Button size="sm" onClick={() => navigate(`/dashboard/event/${event.id}`)}>
                  Open Workspace
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Recent Tasks / Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Play size={18} className="text-primary-500" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Complete Abstract Submission</p>
                    <p className="text-xs text-slate-500">Global Science Summit 2024</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-600" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Review Team Invite from Sarah</p>
                    <p className="text-xs text-slate-500">Neural Net X Team</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs px-3">Review</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Need a Team?</h3>
              <p className="text-slate-300 text-sm mb-6">Browse other participants and form the perfect squad for your next challenge.</p>
              <Button variant="white" fullWidth onClick={() => navigate('/dashboard/team/manage?tab=discover')}>
                Find Teammates
              </Button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          </div>
        </div>
      </div>

    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');

  // Simple router within the dashboard page for Profile
  if (view === 'profile') return <DashboardProfile />;

  // Default is Overview
  return <OverviewView />;
};

export default DashboardPage;
