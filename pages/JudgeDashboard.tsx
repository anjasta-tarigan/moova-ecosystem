
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Briefcase, FileText, CheckCircle, Clock, Award, Filter, Search } from 'lucide-react';
import Button from '../components/Button';
import { judgeService, JudgeAssignment } from '../services/judgeService';

const JudgeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const data = await judgeService.getAssignments();
        setAssignments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // Group by Event Title
  const groupedAssignments = assignments.reduce((acc, curr) => {
    if (!acc[curr.eventTitle]) acc[curr.eventTitle] = [];
    acc[curr.eventTitle].push(curr);
    return acc;
  }, {} as Record<string, JudgeAssignment[]>);

  const getStageLabel = (stage: string) => {
    switch(stage) {
      case 'abstract': return 'Phase 1: Abstract';
      case 'paper': return 'Phase 2: Full Paper & Poster';
      case 'final': return 'Phase 3: Final Presentation';
      default: return stage;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'active') return 'bg-brand-solid-blue text-white border-brand-blue';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Assignments</h1>
          <p className="text-slate-500 mt-1">Manage your judging responsibilities across multiple categories and competitions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <select 
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-10">
        {Object.keys(groupedAssignments).length === 0 && (
           <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
             <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
             <h3 className="text-lg font-bold text-slate-900">No Assignments</h3>
             <p className="text-slate-500">You currently have no active judging assignments.</p>
           </div>
        )}

        {Object.entries(groupedAssignments).map(([eventTitle, items]: [string, JudgeAssignment[]]) => (
          <div key={eventTitle} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-brand-solid-blue rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-900">{eventTitle}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {items.map((asn) => {
                const percentage = Math.round((asn.progress / Math.max(asn.total, 1)) * 100);
                
                return (
                  <div 
                    key={asn.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                    onClick={() => navigate(`/dashboard/judge/events/${asn.eventId}/category/${asn.categoryId}`)}
                  >
                    {/* Card Header */}
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(asn.status)}`}>
                          {asn.status}
                        </div>
                        <div className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-brand-solid-cyan group-hover:text-white transition-colors">
                          <Briefcase size={18} />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-blue transition-colors">
                        {asn.categoryName}
                      </h3>
                      <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                        <Clock size={14} /> {getStageLabel(asn.currentStage)}
                      </p>

                      {/* Progress Bar */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</span>
                          <span className="text-xs font-bold text-slate-900">{asn.progress} / {asn.total} Reviewed</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${percentage === 100 ? 'bg-emerald-500' : 'bg-brand-solid-blue'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {String.fromCharCode(64 + i)}
                          </div>
                        ))}
                        {asn.total > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                            +{asn.total - 3}
                          </div>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-sm font-bold text-brand-blue group-hover:underline">
                        Open Workspace <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JudgeDashboard;
