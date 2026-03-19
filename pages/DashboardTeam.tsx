import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Filter,
  Plus,
  Search,
  Shield,
  Users,
} from "lucide-react";
import Button from "../components/Button";
import { useAuthContext } from "../contexts/AuthContext";
import { teamsApi } from "../services/api/teamsApi";

interface TeamMember {
  id: string;
  role: string;
  user?: { id?: string; fullName?: string; email?: string };
}

interface Team {
  id: string;
  name: string;
  code: string;
  status?: string;
  members: TeamMember[];
}

const DashboardTeam: React.FC = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<"my-teams" | "discover">(
    "my-teams",
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teamsApi.getMyTeams();
      setTeams(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load team data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const res = await teamsApi.createTeam(createName.trim());
      const newTeam = res.data.data;
      setTeams((prev) => [newTeam, ...prev]);
      setCreateName("");
    } catch (err) {
      console.error(err);
      setError("Unable to create a new team.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await teamsApi.joinTeam(joinCode.trim());
      const joined = res.data.data;
      setTeams((prev) => {
        const exists = prev.find((t) => t.id === joined.id);
        if (exists) return prev.map((t) => (t.id === joined.id ? joined : t));
        return [joined, ...prev];
      });
      setJoinCode("");
    } catch (err) {
      console.error(err);
      setError("Team code is invalid or the team is inactive.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    try {
      await teamsApi.leaveTeam(teamId);
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to leave the team.");
    }
  };

  const handleRemoveMember = async (teamId: string, memberId?: string) => {
    if (!memberId) return;
    try {
      await teamsApi.removeMember(teamId, memberId);
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Unable to remove this member.");
    }
  };

  const handleUpdateRole = async (
    teamId: string,
    memberId: string | undefined,
    role: string,
  ) => {
    if (!memberId) return;
    try {
      await teamsApi.updateMemberRole(teamId, memberId, role);
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Unable to update member role.");
    }
  };

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const term = searchTerm.toLowerCase();
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(term) ||
        team.members.some((m) =>
          (m.user?.fullName || "").toLowerCase().includes(term),
        ),
    );
  }, [teams, searchTerm]);

  const leaderName = (team: Team) => {
    const leader = team.members.find((m) => m.role === "LEADER");
    return leader?.user?.fullName || "Leader";
  };

  const isLeader = (team: Team) =>
    team.members.some(
      (member) => member.role === "LEADER" && member.user?.id === user?.id,
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Team Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage teams registered in competitions.
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg flex">
          <button
            onClick={() => setActiveTab("my-teams")}
            className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${
              activeTab === "my-teams"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            My Teams
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${
              activeTab === "discover"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Find Talent
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={refresh}
            className="mt-3 text-sm text-red-600 hover:underline font-bold"
          >
            Try Again
          </button>
        </div>
      )}

      {activeTab === "my-teams" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                <Plus size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Create Team
                </p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Team name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateTeam}
                    disabled={creating}
                  >
                    {creating ? "..." : "Create"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                <Users size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Join Team
                </p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Team code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleJoinTeam}
                    disabled={joining}
                  >
                    {joining ? "..." : "Join"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <Filter size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Find Team
                </p>
                <div className="flex gap-2 mt-2 items-center">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Team name or member"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-2 py-2 text-sm border border-transparent focus:border-primary-300 focus:ring-1 focus:ring-primary-100 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">No data available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {team.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-amber-50 text-amber-700 border-amber-200">
                          Leader: {leaderName(team)}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Code: {team.code}
                        </span>
                        {team.status && (
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            {team.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase">
                      {team.members.length} members
                    </div>
                  </div>

                  <div className="p-6 flex-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Members
                    </h4>
                    <div className="space-y-3">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                              {(member.user?.fullName || "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 text-sm font-medium text-slate-700">
                              {member.user?.fullName || "Member"}
                              <div className="text-[11px] text-slate-400">
                                {member.user?.email}
                              </div>
                            </div>
                            {member.role === "LEADER" && (
                              <Shield size={14} className="text-amber-500" />
                            )}
                          </div>
                          {isLeader(team) && member.user?.id !== user?.id && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <button
                                onClick={() =>
                                  handleUpdateRole(
                                    team.id,
                                    member.user?.id,
                                    "LEADER",
                                  )
                                }
                                className="hover:text-slate-800 font-bold"
                              >
                                Make Leader
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveMember(team.id, member.user?.id)
                                }
                                className="text-red-600 hover:underline font-bold"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Invite code: {""}
                      <strong className="font-mono text-slate-800">
                        {team.code}
                      </strong>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {team.members.length} members
                      </span>
                      <button
                        onClick={() => handleLeaveTeam(team.id)}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "discover" && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">
              Member discovery coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTeam;
