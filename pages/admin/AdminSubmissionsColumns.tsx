import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { formatDateTime } from "../../lib/utils";

export type Submission = {
  id: string;
  title: string;
  event: { name: string };
  team: { name: string };
  status: string;
  submittedAt: string;
};

export const columns: ColumnDef<Submission>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        to={`/admin/submissions/${row.original.id}`}
        className="font-medium text-indigo-600 hover:underline"
      >
        {row.getValue("title")}
      </Link>
    ),
  },
  {
    accessorKey: "event.name",
    header: "Event",
  },
  {
    accessorKey: "team.name",
    header: "Team",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted At",
    cell: ({ row }) => formatDateTime(row.getValue("submittedAt")),
  },
];
