import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { formatDate } from "../../lib/utils";

export type Event = {
  id: string;
  name: string;
  status: string;
  registrationStartDate: string;
  submissionStartDate: string;
  participantCount: number;
};

export const columns: ColumnDef<Event>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        to={`/admin/events/${row.original.id}`}
        className="font-medium text-indigo-600 hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "registrationStartDate",
    header: "Registration Start",
    cell: ({ row }) => formatDate(row.getValue("registrationStartDate")),
  },
  {
    accessorKey: "submissionStartDate",
    header: "Submission Start",
    cell: ({ row }) => formatDate(row.getValue("submissionStartDate")),
  },
  {
    accessorKey: "participantCount",
    header: "Participants",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const event = row.original;
      return (
        <div className="relative">
          <button className="p-1 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {/* Dropdown menu can be added here */}
        </div>
      );
    },
  },
];
