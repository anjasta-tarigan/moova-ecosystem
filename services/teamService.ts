// @deprecated Use services/api/teamsApi.ts instead
// Mock Data for Teams
const SEED_TEAMS = [
  {
    id: "t1",
    name: "Project Alpha",
    event: "Deep Tech Hackathon",
    code: "ALPHA9",
    members: [
      {
        id: "u-current",
        name: "Alex Participant",
        email: "alex@giva.io",
        role: "Leader",
        avatar: "AP",
      },
      {
        id: "u-2",
        name: "Sarah Engineer",
        email: "sarah@demo.com",
        role: "Member",
        avatar: "SE",
      },
      {
        id: "u-3",
        name: "John Data",
        email: "john@demo.com",
        role: "Member",
        avatar: "JD",
      },
    ],
    status: "Active",
  },
  {
    id: "t2",
    name: "BioGen Research",
    event: "Global Science Summit",
    code: "BIO442",
    members: [
      {
        id: "u-4",
        name: "Dr. Chen",
        email: "chen@demo.com",
        role: "Leader",
        avatar: "DC",
      },
      {
        id: "u-current",
        name: "Alex Participant",
        email: "alex@giva.io",
        role: "Member",
        avatar: "AP",
      },
    ],
    status: "In Event",
  },
];

const DB_KEY = "giva_teams_db_v1";
const CURRENT_USER_ID = "u-current"; // Mock logged-in user

class TeamService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(SEED_TEAMS));
    }
  }

  private getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY) || "[]");
  }

  private saveDB(data: any) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  // Generate a random 6-char code
  private generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async getMyTeams() {
    await new Promise((r) => setTimeout(r, 400));
    const teams = this.getDB();
    return teams.filter((t: any) =>
      t.members.some((m: any) => m.id === CURRENT_USER_ID),
    );
  }

  async getTeamById(id: string) {
    await new Promise((r) => setTimeout(r, 300));
    const teams = this.getDB();
    return teams.find((t: any) => t.id === id);
  }

  async createTeam(name: string, eventName: string) {
    await new Promise((r) => setTimeout(r, 600));
    const teams = this.getDB();

    const newTeam = {
      id: `t-${Date.now()}`,
      name,
      event: eventName,
      code: this.generateCode(),
      members: [
        {
          id: CURRENT_USER_ID,
          name: "Alex Participant",
          email: "alex@giva.io",
          role: "Leader",
          avatar: "AP",
        },
      ],
      status: "Active",
    };

    teams.push(newTeam);
    this.saveDB(teams);
    return newTeam;
  }

  async joinTeam(code: string) {
    await new Promise((r) => setTimeout(r, 600));
    const teams = this.getDB();
    const teamIndex = teams.findIndex(
      (t: any) => t.code === code.toUpperCase(),
    );

    if (teamIndex === -1) throw new Error("Invalid team code");

    const team = teams[teamIndex];
    if (team.members.some((m: any) => m.id === CURRENT_USER_ID)) {
      throw new Error("You are already in this team");
    }

    team.members.push({
      id: CURRENT_USER_ID,
      name: "Alex Participant",
      email: "alex@giva.io",
      role: "Member",
      avatar: "AP",
    });

    this.saveDB(teams);
    return team;
  }

  async leaveTeam(teamId: string) {
    await new Promise((r) => setTimeout(r, 400));
    const teams = this.getDB();
    const teamIndex = teams.findIndex((t: any) => t.id === teamId);
    if (teamIndex === -1) return;

    const team = teams[teamIndex];

    // Check if leader is leaving
    const me = team.members.find((m: any) => m.id === CURRENT_USER_ID);
    if (me.role === "Leader" && team.members.length > 1) {
      // Assign new leader (first available member)
      const nextLeader = team.members.find(
        (m: any) => m.id !== CURRENT_USER_ID,
      );
      if (nextLeader) nextLeader.role = "Leader";
    } else if (me.role === "Leader" && team.members.length === 1) {
      // Delete team if last member leaves
      teams.splice(teamIndex, 1);
      this.saveDB(teams);
      return;
    }

    team.members = team.members.filter((m: any) => m.id !== CURRENT_USER_ID);
    this.saveDB(teams);
  }

  async removeMember(teamId: string, memberId: string) {
    await new Promise((r) => setTimeout(r, 300));
    const teams = this.getDB();
    const team = teams.find((t: any) => t.id === teamId);
    if (team) {
      team.members = team.members.filter((m: any) => m.id !== memberId);
      this.saveDB(teams);
    }
  }

  async updateRole(
    teamId: string,
    memberId: string,
    newRole: "Leader" | "Member",
  ) {
    await new Promise((r) => setTimeout(r, 300));
    const teams = this.getDB();
    const team = teams.find((t: any) => t.id === teamId);

    if (team) {
      // If promoting to Leader, demote current leader
      if (newRole === "Leader") {
        const currentLeader = team.members.find(
          (m: any) => m.role === "Leader",
        );
        if (currentLeader) currentLeader.role = "Member";
      }

      const member = team.members.find((m: any) => m.id === memberId);
      if (member) member.role = newRole;

      this.saveDB(teams);
    }
  }

  async updateTeamName(teamId: string, name: string) {
    await new Promise((r) => setTimeout(r, 300));
    const teams = this.getDB();
    const team = teams.find((t: any) => t.id === teamId);
    if (team) {
      team.name = name;
      this.saveDB(teams);
    }
  }

  async deleteTeam(teamId: string) {
    await new Promise((r) => setTimeout(r, 500));
    let teams = this.getDB();
    teams = teams.filter((t: any) => t.id !== teamId);
    this.saveDB(teams);
  }
}

export const teamService = new TeamService();
