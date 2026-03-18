import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../lib/utils";

export type Siswa = {
  id: string;
  fullName: string;
  email: string;
  school: string;
  createdAt: string;
};

export const columns: ColumnDef<Siswa>[] = [
  {
    accessorKey: "fullName",
    header: "Full Name",
    cell: ({ row }) => (
      <Link
        to={`/admin/siswa/${row.original.id}`}
        className="font-medium text-indigo-600 hover:underline"
      >
        {row.getValue("fullName")}
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "school",
    header: "School",
  },
  {
    accessorKey: "createdAt",
    header: "Registered At",
    cell: ({ row }) => formatDateTime(row.getValue("createdAt")),
  },
];
