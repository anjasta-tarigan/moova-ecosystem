import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { formatDateTime } from "../../lib/utils";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "JURI";
  isActive: boolean;
  createdAt: string;
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <StatusBadge status={row.getValue("role")} />,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.getValue("isActive") ? "Active" : "Inactive"} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => formatDateTime(row.getValue("createdAt")),
  },
];
