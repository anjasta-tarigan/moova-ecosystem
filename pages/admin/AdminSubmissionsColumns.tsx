import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/admin/StatusBadge";

export type Submission = {
  id: string;
  projectTitle?: string;
  team?: { name?: string } | null;
  event?: { title?: string } | null;
  currentStage?: string;
  status?: string;
  scores?: Array<{ totalScore?: number }> | number;
  submittedAt?: string;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getScoreDisplay = (submission: Submission) => {
  if (!submission) return "-";
  const { scores } = submission;
  if (typeof scores === "number") return scores;
  if (Array.isArray(scores) && scores.length > 0) {
    const latest = scores[scores.length - 1];
    if (latest?.totalScore !== undefined && latest?.totalScore !== null) {
      return latest.totalScore;
    }
    const firstWithScore = scores.find(
      (s) => s.totalScore !== undefined && s.totalScore !== null,
    );
    if (firstWithScore?.totalScore !== undefined)
      return firstWithScore.totalScore;
  }
  return "-";
};

export const columns: ColumnDef<Submission>[] = [
  {
    accessorKey: "projectTitle",
    header: "Project Title",
    cell: ({ row }) => (
      <Link
        to={`/admin/submissions/${row.original.id}`}
        className="font-medium text-indigo-600 hover:underline"
      >
        {row.original.projectTitle || "-"}
      </Link>
    ),
  },
  {
    accessorKey: "event.title",
    header: "Event",
    cell: ({ row }) => row.original.event?.title || "-",
  },
  {
    accessorKey: "team.name",
    header: "Team",
    cell: ({ row }) => row.original.team?.name || "-",
  },
  {
    accessorKey: "currentStage",
    header: "Stage",
    cell: ({ row }) => row.original.currentStage || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status || "-"} />,
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => getScoreDisplay(row.original),
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted At",
    cell: ({ row }) => formatDate(row.original.submittedAt),
  },
];
