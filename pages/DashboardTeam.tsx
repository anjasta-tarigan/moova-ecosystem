import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  Crown,
  GraduationCap,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { teamsApi } from "../services/api/teamsApi";

interface SearchUser {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  profile?: {
    avatar?: string;
    schoolName?: string;
    province?: string;
  };
}

interface TeamMember {
  id: string;
  role: "LEADER" | "MEMBER";
  joinedAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    profile?: { avatar?: string };
  };
}

interface TeamMentor {
  id: string;
  userId: string;
  assignedAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: "ACTIVE" | "DISBANDED";
  members: TeamMember[];
  mentors: TeamMentor[];
  registrations?: Array<{
    id: string;
    event: {
      id: string;
      title: string;
      status: string;
      date: string;
    };
  }>;
  createdAt?: string;
}

const getCurrentUserId = () =>
  JSON.parse(localStorage.getItem("giva_user") || "{}")?.id || "";

const isLeader = (team: Team) =>
  team.members.some(
    (m) => m.role === "LEADER" && m.user?.id === getCurrentUserId(),
  );

const getInitials = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const DashboardTeam: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"my-teams" | "join">("my-teams");

  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedCode, setCopied] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const [showLeave, setShowLeave] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<Team | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<SearchUser[]>([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  const [mentorTeamId, setMentorTeamId] = useState<string | null>(null);
  const [mentorQuery, setMentorQuery] = useState("");
  const [mentorResults, setMentorResults] = useState<SearchUser[]>([]);
  const [mentorSearching, setMentorSearching] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teamsApi.getMyTeams();
      setTeams(res.data.data || []);
    } catch {
      setError("Failed to load teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handler = () => setOpenMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleCreate = async () => {
    const name = createForm.name.trim();
    if (name.length < 3) return;
    setCreating(true);
    try {
      await teamsApi.createTeam(name, createForm.description.trim());
      setShowCreate(false);
      setCreateForm({ name: "", description: "" });
      await refresh();
      showToast("success", "Team created successfully");
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to create team.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await teamsApi.joinTeam(joinCode.trim());
      setJoinCode("");
      setActiveTab("my-teams");
      await refresh();
      showToast("success", "Joined team successfully");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Invalid team code.");
    } finally {
      setJoining(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const name = editForm.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      await teamsApi.updateTeam(editTarget.id, name);
      setShowEdit(false);
      setEditTarget(null);
      await refresh();
      showToast("success", "Team updated successfully");
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to update team.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!leaveTarget) return;
    try {
      if (isLeader(leaveTarget)) {
        await teamsApi.disbandTeam(leaveTarget.id);
        showToast("success", "Team disbanded");
      } else {
        await teamsApi.leaveTeam(leaveTarget.id);
        showToast("success", "Left team successfully");
      }
      setShowLeave(false);
      setLeaveTarget(null);
      await refresh();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Action failed.");
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      await teamsApi.removeMember(teamId, userId);
      await refresh();
      showToast("success", "Member removed.");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    if (inviteTeamId === null) {
      setInviteResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setInviteSearching(true);
      try {
        const res = await teamsApi.searchStudents(inviteQuery, inviteTeamId);
        setInviteResults(res.data.data || []);
      } catch {
        setInviteResults([]);
      } finally {
        setInviteSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [inviteQuery, inviteTeamId]);

  const handleInvite = async (teamId: string, userId: string) => {
    setInvitingUserId(userId);
    try {
      await teamsApi.inviteMember(teamId, userId);
      await refresh();
      setInviteResults((prev) => prev.filter((u) => u.id !== userId));
      showToast("success", "Member invited successfully!");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to invite.");
    } finally {
      setInvitingUserId(null);
    }
  };

  useEffect(() => {
    if (mentorTeamId === null) {
      setMentorResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setMentorSearching(true);
      try {
        const res = await teamsApi.searchMentors(mentorQuery, mentorTeamId);
        setMentorResults(res.data.data || []);
      } catch {
        setMentorResults([]);
      } finally {
        setMentorSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [mentorQuery, mentorTeamId]);

  const handleAssignMentor = async (teamId: string, userId: string) => {
    setAssigningUserId(userId);
    try {
      await teamsApi.assignMentor(teamId, userId);
      await refresh();
      setMentorResults((prev) => prev.filter((u) => u.id !== userId));
      showToast("success", "Mentor assigned!");
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to assign mentor.",
      );
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleRemoveMentor = async (teamId: string, userId: string) => {
    try {
      await teamsApi.removeMentor(teamId, userId);
      await refresh();
      showToast("success", "Mentor removed.");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed.");
    }
  };

  const toggleInvitePanel = (teamId: string) => {
    if (inviteTeamId === teamId) {
      setInviteTeamId(null);
      setInviteQuery("");
      setInviteResults([]);
    } else {
      setMentorTeamId(null);
      setMentorQuery("");
      setMentorResults([]);
      setInviteTeamId(teamId);
      setInviteQuery("");
    }
  };

  const toggleMentorPanel = (teamId: string) => {
    if (mentorTeamId === teamId) {
      setMentorTeamId(null);
      setMentorQuery("");
      setMentorResults([]);
    } else {
      setInviteTeamId(null);
      setInviteQuery("");
      setInviteResults([]);
      setMentorTeamId(teamId);
      setMentorQuery("");
    }
  };

  const filteredTeams = useMemo(() => teams, [teams]);

  const TeamCard = ({ team }: { team: Team }) => {
    const leader = isLeader(team);
    const isActive = team.status === "ACTIVE";

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-bold shrink-0">
            {team.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  team.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {team.status}
              </span>
              {leader && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Crown size={10} /> Leader
                </span>
              )}
            </div>
            {team.description && (
              <p className="text-sm text-slate-500 line-clamp-2">
                {team.description}
              </p>
            )}
          </div>

          {leader && (
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(openMenu === team.id ? null : team.id);
                }}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              >
                <MoreHorizontal size={18} />
              </button>

              {openMenu === team.id && (
                <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-44 py-1">
                  <button
                    onClick={() => {
                      setEditTarget(team);
                      setEditForm({
                        name: team.name,
                        description: team.description || "",
                      });
                      setShowEdit(true);
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Edit Team
                  </button>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={() => {
                      setLeaveTarget(team);
                      setShowLeave(true);
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Disband Team
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
              Team Code
            </p>
            <p className="font-mono font-bold text-base text-white tracking-widest">
              {team.code}
            </p>
          </div>
          <button
            onClick={() => copyCode(team.code)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors"
          >
            {copiedCode === team.code ? (
              <>
                <Check size={13} /> Copied!
              </>
            ) : (
              <>
                <Copy size={13} /> Copy
              </>
            )}
          </button>
        </div>

        <TeamEventInfo team={team} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users size={14} />
              Members ({team.members.length})
            </h4>
            {leader && isActive && (
              <button
                onClick={() => toggleInvitePanel(team.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  inviteTeamId === team.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <UserPlus size={13} />
                {inviteTeamId === team.id ? "Close" : "Invite Members"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 shrink-0">
                    {getInitials(member.user?.fullName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {member.user?.fullName || "Member"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {member.user?.email || ""}
                    </p>
                  </div>
                  {member.role === "LEADER" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Crown size={9} /> Leader
                    </span>
                  )}
                </div>
                {leader && member.user?.id !== getCurrentUserId() && (
                  <button
                    onClick={() => handleRemoveMember(team.id, member.user!.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {inviteTeamId === team.id && (
          <div className="border-t border-slate-100 bg-slate-50 p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Search size={13} /> Search Students to Invite
            </p>

            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                autoFocus
              />
              {inviteSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {inviteResults.length === 0 && !inviteSearching && (
              <p className="text-xs text-slate-400 text-center py-3">
                {inviteQuery.length > 0
                  ? "No students found matching your search."
                  : "Start typing to search for students..."}
              </p>
            )}

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {inviteResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {getInitials(user.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                        {user.profile?.schoolName && (
                          <span> · {user.profile.schoolName}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(team.id, user.id)}
                    disabled={invitingUserId === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                  >
                    {invitingUserId === user.id ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserPlus size={12} />
                    )}
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap size={14} />
              Mentors ({team.mentors?.length || 0})
            </h4>
            {leader && isActive && (
              <button
                onClick={() => toggleMentorPanel(team.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  mentorTeamId === team.id
                    ? "bg-violet-700 text-white border-violet-700"
                    : "bg-white text-violet-700 border-violet-200 hover:bg-violet-50"
                }`}
              >
                <BookOpen size={13} />
                {mentorTeamId === team.id ? "Close" : "Assign Mentor"}
              </button>
            )}
          </div>

          {!team.mentors || team.mentors.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No mentor assigned yet.
            </p>
          ) : (
            <div className="space-y-3">
              {team.mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 border border-violet-200 shrink-0">
                      {getInitials(mentor.user?.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {mentor.user?.fullName || "Mentor"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400">
                          {mentor.user?.email || ""}
                        </p>
                        {mentor.user?.role && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700">
                            {mentor.user.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {leader && (
                    <button
                      onClick={() => handleRemoveMentor(team.id, mentor.userId)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove mentor"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {mentorTeamId === team.id && (
          <div className="border-t border-violet-100 bg-violet-50 p-6">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Search size={13} /> Search Admin / Judge to Assign as Mentor
            </p>

            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400"
              />
              <input
                type="text"
                value={mentorQuery}
                onChange={(e) => setMentorQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-violet-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none transition-all"
                autoFocus
              />
              {mentorSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {mentorResults.length === 0 && !mentorSearching && (
              <p className="text-xs text-violet-400 text-center py-3">
                {mentorQuery.length > 0
                  ? "No admin or judge found."
                  : "Start typing to search for available mentors..."}
              </p>
            )}

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {mentorResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-white border border-violet-100 rounded-xl px-4 py-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                      {getInitials(user.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {user.fullName}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400 truncate">
                          {user.email}
                          {user.profile?.schoolName && (
                            <span> · {user.profile.schoolName}</span>
                          )}
                        </p>
                        {user.role && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 shrink-0">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignMentor(team.id, user.id)}
                    disabled={assigningUserId === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 text-white rounded-lg text-xs font-bold hover:bg-violet-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                  >
                    {assigningUserId === user.id ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <BookOpen size={12} />
                    )}
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
            {team.mentors?.length
              ? ` · ${team.mentors.length} mentor${team.mentors.length !== 1 ? "s" : ""}`
              : ""}
          </span>
          {!leader && isActive && (
            <button
              onClick={() => {
                setLeaveTarget(team);
                setShowLeave(true);
              }}
              className="text-red-600 font-bold hover:underline flex items-center gap-1"
            >
              <LogOut size={12} /> Leave Team
            </button>
          )}
        </div>
      </div>
    );
  };

  const TeamEventInfo = ({ team }: { team: Team }) => {
    const regs = team.registrations || [];

    const activeEvents = regs
      .filter((r) => ["OPEN", "UPCOMING"].includes(r.event.status))
      .map((r) => r.event);

    const previousEvents = regs
      .filter((r) => r.event.status === "CLOSED")
      .map((r) => r.event);

    if (regs.length === 0) return null;

    return (
      <div className="px-6 pb-5 space-y-3">
        {/* Active Now */}
        <div>
          <p
            className="text-[10px] font-bold text-slate-400
            uppercase tracking-wider mb-2 flex items-center gap-1.5"
          >
            <span
              className={`w-2 h-2 rounded-full inline-block
              ${
                activeEvents.length > 0
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-slate-300"
              }`}
            />
            Active Now
          </p>
          {activeEvents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Currently not following any event
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between
                    bg-emerald-50 border border-emerald-100
                    rounded-lg px-3 py-2 gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full
                      bg-emerald-500 shrink-0"
                    />
                    <span
                      className="text-xs font-medium
                      text-emerald-800 truncate"
                    >
                      {ev.title}
                    </span>
                    <span
                      className="text-[10px] font-bold
                      px-1.5 py-0.5 rounded bg-emerald-100
                      text-emerald-700 border border-emerald-200
                      shrink-0"
                    >
                      {ev.status}
                    </span>
                  </div>
                  {/* Button placeholder — will be wired later */}
                  <button
                    disabled
                    title="Coming soon"
                    className="text-[10px] font-bold text-emerald-600
                      opacity-50 cursor-not-allowed shrink-0 flex
                      items-center gap-1"
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Previous Events — only render if any */}
        {previousEvents.length > 0 && (
          <div>
            <p
              className="text-[10px] font-bold text-slate-400
              uppercase tracking-wider mb-2"
            >
              Previous Events
            </p>
            <div className="space-y-1.5">
              {previousEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between
                    bg-slate-50 border border-slate-100
                    rounded-lg px-3 py-2 gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full
                      bg-slate-400 shrink-0"
                    />
                    <span
                      className="text-xs font-medium
                      text-slate-600 truncate"
                    >
                      {ev.title}
                    </span>
                    <span
                      className="text-[10px] text-slate-400
                      shrink-0"
                    >
                      {ev.date}
                    </span>
                  </div>
                  {/* Button placeholder — will be wired later */}
                  <button
                    disabled
                    title="Coming soon"
                    className="text-[10px] font-bold text-slate-400
                      opacity-50 cursor-not-allowed shrink-0 flex
                      items-center gap-1"
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 mb-3">
            <Shield size={12} /> GIVA Teams
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Team Management
          </h1>
          <p className="text-slate-500 mt-1">
            Create, manage, and collaborate with your teams.
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
            onClick={() => setActiveTab("join")}
            className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${
              activeTab === "join"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Join Team
          </button>
        </div>
      </div>

      {activeTab === "my-teams" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
            >
              <Plus size={16} /> Create New Team
            </button>
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

          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                No teams yet
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Create a team or join one using a team code.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black"
              >
                Create Your First Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "join" && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Join a Team
              </h2>
              <p className="text-slate-500 text-sm">
                Enter the team code shared by your team leader. Codes start with
                GIVA- (e.g. GIVA-A3K9M)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Team Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="GIVA-XXXXX"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={joining || !joinCode.trim()}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users size={16} /> Join Team
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Team</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5">
                  Team Name *
                </p>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Research Alpha"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5">
                  Description (optional)
                </p>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value.slice(0, 300),
                    }))
                  }
                  placeholder="What is your team working on?"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                />
                <div className="text-right text-xs text-slate-400 mt-1">
                  {createForm.description.length}/300
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Team"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Team</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5">
                  Team Name *
                </p>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Team name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5">
                  Description (optional)
                </p>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value.slice(0, 300),
                    }))
                  }
                  placeholder="What is your team working on?"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                />
                <div className="text-right text-xs text-slate-400 mt-1">
                  {editForm.description.length}/300
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeave && leaveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLeave(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {isLeader(leaveTarget) ? "Disband Team" : "Leave Team"}
              </h3>
              <button
                onClick={() => setShowLeave(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {isLeader(leaveTarget) ? (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    Disbanding '{leaveTarget.name}' will remove all members
                    permanently. This cannot be undone.
                  </p>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm">
                    Disbanding '{leaveTarget.name}' will remove all members
                    permanently. This cannot be undone.
                  </div>
                </div>
              ) : (
                <p className="text-slate-700">
                  Are you sure you want to leave '{leaveTarget.name}'?
                </p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowLeave(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold"
              >
                {isLeader(leaveTarget) ? "Disband Team" : "Leave Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTeam;
