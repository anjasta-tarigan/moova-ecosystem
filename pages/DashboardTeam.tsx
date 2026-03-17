
import React, { useState } from 'react';
import { 
  Users, Plus, Search, Filter, Briefcase, GraduationCap, 
  MapPin, UserPlus, MoreHorizontal, Settings, Trash2, 
  Check, Mail, Shield, CheckCircle
} from 'lucide-react';
import Button from '../components/Button';

// --- MOCK DATA ---
const MY_TEAMS = [
  {
    id: "t1",
    name: "Project Alpha",
    role: "Leader",
    members: [
      { name: "Alex Participant", role: "Leader", avatar: "AP" },
      { name: "Sarah Engineer", role: "Member", avatar: "SE" },
      { name: "John Data", role: "Member", avatar: "JD" }
    ],
    activeEvents: ["Global Science Summit 2024"],
    code: "ALPHA9"
  },
  {
    id: "t2",
    name: "BioGen Research",
    role: "Member",
    members: [
      { name: "Dr. Chen", role: "Leader", avatar: "DC" },
      { name: "Alex Participant", role: "Member", avatar: "AP" }
    ],
    activeEvents: [],
    code: "BIO442"
  }
];

const DISCOVER_USERS = [
  { id: 1, name: "Emma Watson", major: "BioTech", university: "MIT", skills: ["CRISPR", "Python"], lookingFor: "Team" },
  { id: 2, name: "Liam Chen", major: "Computer Science", university: "NUS", skills: ["React", "AI/ML"], lookingFor: "Hackathon" },
  { id: 3, name: "Sofia Rodriguez", major: "Mechanical Eng", university: "Stanford", skills: ["CAD", "Robotics"], lookingFor: "Team" },
  { id: 4, name: "Noah Kim", major: "Business", university: "LSE", skills: ["Marketing", "Pitching"], lookingFor: "Project" },
];

const DashboardTeam: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-teams' | 'discover'>('my-teams');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-1">Manage your squads or find new talent for upcoming competitions.</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-lg flex">
          <button 
            onClick={() => setActiveTab('my-teams')}
            className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'my-teams' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Teams
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'discover' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Find Talent
          </button>
        </div>
      </div>

      {/* MY TEAMS TAB */}
      {activeTab === 'my-teams' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" className="gap-2"><Plus size={16} /> Create New Team</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {MY_TEAMS.map((team) => (
              <div key={team.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{team.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${team.role === 'Leader' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {team.role}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Code: {team.code}</span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <Settings size={18} />
                  </button>
                </div>

                <div className="p-6 flex-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Members</h4>
                  <div className="space-y-3 mb-6">
                    {team.members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                          {member.avatar}
                        </div>
                        <div className="flex-1 text-sm font-medium text-slate-700">
                          {member.name}
                        </div>
                        {member.role === 'Leader' && <Shield size={14} className="text-amber-500" />}
                      </div>
                    ))}
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Active In</h4>
                  {team.activeEvents.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {team.activeEvents.map((ev, i) => (
                        <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full border border-primary-100">
                          {ev}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No active competitions.</p>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                  <button className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    Edit Members
                  </button>
                  <button className="flex-1 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-black transition-colors">
                    Invite
                  </button>
                </div>
              </div>
            ))}
            
            {/* Empty State / Create CTA */}
            {MY_TEAMS.length === 0 && (
              <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">No Teams Yet</h3>
                <p className="text-slate-500 mb-6">Create a reusable team to join competitions easily.</p>
                <Button>Create Team</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISCOVER TAB */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, skill, or major..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-600">
                <Filter size={16} /> Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DISCOVER_USERS.map((user) => (
              <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-lg">
                    {user.name.charAt(0)}
                  </div>
                  <button className="p-2 text-primary-600 bg-primary-50 rounded-full hover:bg-primary-100 transition-colors" title="Invite to Team">
                    <UserPlus size={18} />
                  </button>
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <GraduationCap size={14} /> {user.major}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <MapPin size={14} /> {user.university}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {user.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>

                <button className="w-full py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardTeam;
