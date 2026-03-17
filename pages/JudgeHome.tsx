
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Clock, Calendar, ArrowRight, Award, 
  FileText, TrendingUp, AlertCircle, Briefcase 
} from 'lucide-react';
import { judgeService } from '../services/judgeService';

const JudgeHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeAssignments: 0,
    submissionsTotal: 0,
    submissionsScored: 0,
    completionRate: 0
  });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const assignments = await judgeService.getAssignments();
        
        let totalSubs = 0;
        let totalScored = 0;
        
        assignments.forEach(a => {
          totalSubs += a.total;
          totalScored += a.progress;
        });

        setStats({
          activeAssignments: assignments.filter(a => a.status === 'active').length,
          submissionsTotal: totalSubs,
          submissionsScored: totalScored,
          completionRate: totalSubs > 0 ? Math.round((totalScored / totalSubs) * 100) : 0
        });
        
        setRecentAssignments(assignments.slice(0, 3)); // Top 3
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('moova_user');
    return userStr ? JSON.parse(userStr) : { firstName: 'Judge' };
  };

  const user = getCurrentUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user.firstName}.</h1>
        <p className="text-slate-500">Overview of your judging responsibilities and progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Active</span>
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900">{stats.activeAssignments}</span>
            <p className="text-xs font-medium text-slate-500">Category Assignments</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending</span>
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900">{stats.submissionsTotal - stats.submissionsScored}</span>
            <p className="text-xs font-medium text-slate-500">Submissions to Score</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Done</span>
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900">{stats.submissionsScored}</span>
            <p className="text-xs font-medium text-slate-500">Completed Reviews</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between h-32 border border-primary-600">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white/20 rounded-lg text-white">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">Metrics</span>
          </div>
          <div>
            <span className="text-3xl font-bold">
              {stats.completionRate}%
            </span>
            <p className="text-xs font-medium text-white/80">Overall Completion</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Shortcuts / Active Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Active Assignments</h2>
            <button 
              onClick={() => navigate('/dashboard/judge/events')}
              className="text-sm font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {recentAssignments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No active events assigned.</p>
              </div>
            ) : (
              recentAssignments.map(asn => (
                <div 
                  key={asn.id}
                  onClick={() => navigate(`/dashboard/judge/events/${asn.eventId}/category/${asn.categoryId}`)}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-500 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{asn.categoryName}</h3>
                      <p className="text-sm text-slate-500 font-bold">{asn.eventTitle}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${asn.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-500 text-white'}`}>
                      {asn.status}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Progress</span>
                      <span className="text-slate-900 font-bold">{asn.progress}/{asn.total}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${asn.total > 0 ? (asn.progress/asn.total)*100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Judge Resources</h3>
              <p className="text-slate-400 text-sm mb-4">Download the official grading handbook and technical guidelines.</p>
              <button className="w-full py-2 bg-white text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                <FileText size={16} /> Download Guide
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full blur-2xl opacity-20 -mr-10 -mt-10"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> My Credentials
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer" onClick={() => navigate('/dashboard/judge/certificates')}>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                  <Award size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Lead Judge 2024</div>
                  <div className="text-xs text-slate-500">Global Summit</div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/dashboard/judge/certificates')}
              className="mt-4 text-xs font-bold text-primary-600 hover:underline"
            >
              View All Certificates
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default JudgeHome;
