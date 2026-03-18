import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "../../components/admin/StatusBadge";

export type User = {
  id: string;
  fullName?: string;
  email?: string;
  role?: "ADMIN" | "JURI";
  isActive?: boolean;
  createdAt?: string;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "fullName",
    header: "Full Name",
    cell: ({ row }) => row.original.fullName || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <StatusBadge status={row.original.role || "-"} />,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={
          row.original.isActive
            ? "Active"
            : row.original.isActive === false
              ? "Inactive"
              : "-"
        }
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
