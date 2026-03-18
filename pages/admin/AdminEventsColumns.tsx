import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/admin/StatusBadge";

export type Event = {
  id: string;
  title?: string;
  category?: string;
  status?: string;
  deadline?: string;
  format?: string;
  _count?: { registrations?: number };
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const columns: ColumnDef<Event>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        to={`/admin/events/${row.original.id}`}
        className="font-medium text-indigo-600 hover:underline"
      >
        {row.original.title || "-"}
      </Link>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status || "-"} />,
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
    cell: ({ row }) => formatDate(row.original.deadline),
  },
  {
    accessorKey: "format",
    header: "Format",
    cell: ({ row }) => row.original.format || "-",
  },
  {
    id: "registrants",
    header: "Registrants",
    cell: ({ row }) => row.original._count?.registrations ?? 0,
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
