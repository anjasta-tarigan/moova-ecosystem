import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Filter, CheckCircle, Clock, FileText, ChevronRight, BarChart } from 'lucide-react';
import Button from '../components/Button';
import { judgeService, JudgingStage } from '../services/judgeService';

const JudgeRoundView: React.FC = () => {
  const { eventId, roundId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!eventId || !roundId) return;
      try {
        const data = await judgeService.getEventSubmissions(eventId, roundId as JudgingStage);
        const mappedData = data.map((sub: any) => ({
          ...sub,
          status: sub.scoringStatus === 'submitted' ? 'Completed' : (sub.scoringStatus === 'draft' ? 'Draft' : 'Pending'),
          score: sub.totalScore
        }));
        setSubmissions(mappedData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadSubmissions();
  }, [eventId, roundId]);

  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = filter === 'All' 
      ? true 
      : filter === 'Pending' ? (sub.status === 'Pending' || sub.status === 'Draft') 
      : sub.status === 'Completed';
    const matchesSearch = sub.title.toLowerCase().includes(search.toLowerCase()) || sub.team.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const completedCount = submissions.filter(s => s.status === 'Completed').length;
  const progress = submissions.length > 0 ? Math.round((completedCount / submissions.length) * 100) : 0;

  if (loading) return <div className="p-8 text-center">Loading submissions...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 p-6">
      
      {/* Navigation */}
      <div className="border-b border-slate-200 pb-6">
        <button 
          onClick={() => navigate(`/dashboard/judge/events/${eventId}`)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to Rounds
        </button>
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Submission List</h1>
            <p className="text-slate-500 mt-2 text-lg">Select a project to begin evaluation.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <BarChart size={20} className="text-primary-600" />
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Progress</div>
              <div className="text-sm font-bold text-slate-900">{progress}% Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-24 z-30">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg overflow-x-auto w-full md:w-auto">
          {['All', 'Pending', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f} ({submissions.filter(s => f === 'All' ? true : f === 'Pending' ? (s.status === 'Pending' || s.status === 'Draft') : s.status === 'Completed').length})
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search team or project title..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Filter size={24} />
            </div>
            <p className="text-slate-500 font-medium">No submissions found matching your filters.</p>
            <button onClick={() => {setFilter('All'); setSearch('')}} className="text-primary-600 text-sm font-bold mt-2 hover:underline">
              Clear Filters
            </button>
          </div>
        ) : (
          filteredSubmissions.map((sub) => (
            <div 
              key={sub.id}
              onClick={() => navigate(`/dashboard/judge/events/${eventId}/round/${roundId}/submission/${sub.id}`)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row items-center gap-6"
            >
              {/* Status Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                sub.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                sub.status === 'Draft' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-slate-50 text-slate-400 border border-slate-200 group-hover:bg-primary-50 group-hover:text-primary-500'
              }`}>
                {sub.status === 'Completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{sub.title}</h3>
                  <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-slate-200">
                    {sub.track}
                  </span>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {sub.team} • ID: {sub.id}
                </div>
              </div>

              {/* Action / State */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                <div className="text-right">
                  {sub.status === 'Completed' ? (
                    <div>
                      <span className="block text-2xl font-bold text-slate-900">{sub.score}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Score</span>
                    </div>
                  ) : (
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        sub.status === 'Draft' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default JudgeRoundView;