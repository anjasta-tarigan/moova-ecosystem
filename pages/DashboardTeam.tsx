import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Filter,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  Shield,
  Users,
} from "lucide-react";
import Button from "../components/Button";
import { teamsApi } from "../services/api/teamsApi";

interface TeamMember {
  id: string;
  role: string;
  user?: { fullName?: string; email?: string };
}

interface Team {
  id: string;
  name: string;
  code: string;
  status?: string;
  members: TeamMember[];
}

const DashboardTeam: React.FC = () => {
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
      setError("Gagal memuat data tim.");
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
      setError("Tidak bisa membuat tim baru.");
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
      setError("Kode tim tidak valid atau tim tidak aktif.");
    } finally {
      setJoining(false);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Team Management
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola tim yang terdaftar di kompetisi.
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
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
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
                  Buat Tim
                </p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Nama tim"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateTeam}
                    disabled={creating}
                  >
                    {creating ? "..." : "Buat"}
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
                  Masuk Tim
                </p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Kode tim"
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
                    {joining ? "..." : "Gabung"}
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
                  Cari Tim
                </p>
                <div className="flex gap-2 mt-2 items-center">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nama tim atau anggota"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-2 py-2 text-sm border border-transparent focus:border-primary-300 focus:ring-1 focus:ring-primary-100 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-slate-500">Loading teams...</div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 bg-slate-50">
              Belum ada tim terdaftar. Buat atau gabung dengan kode.
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
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                            {(member.user?.fullName || "?")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 text-sm font-medium text-slate-700">
                            {member.user?.fullName || "Anggota"}
                            <div className="text-[11px] text-slate-400">
                              {member.user?.email}
                            </div>
                          </div>
                          {member.role === "LEADER" && (
                            <Shield size={14} className="text-amber-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Kode undangan:{" "}
                      <strong className="font-mono text-slate-800">
                        {team.code}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {team.members.length} anggota
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "discover" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center text-slate-500">
            Fitur pencarian talent akan segera hadir. Untuk sekarang, undang
            teman melalui kode tim.
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTeam;
