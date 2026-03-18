import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

export type Siswa = {
  id: string;
  fullName?: string;
  email?: string;
  profile?: {
    schoolName?: string;
    schoolLevel?: string;
    grade?: string;
    province?: string;
    city?: string;
    completeness?: number;
  };
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

export const columns: ColumnDef<Siswa>[] = [
  {
    accessorKey: "fullName",
    header: "Full Name",
    cell: ({ row }) => (
      <Link
        to={`/admin/siswa/${row.original.id}`}
        className="font-medium text-indigo-600 hover:underline"
      >
        {row.original.fullName || "-"}
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    accessorKey: "profile.schoolName",
    header: "School",
    cell: ({ row }) => row.original.profile?.schoolName || "-",
  },
  {
    accessorKey: "profile.schoolLevel",
    header: "Level",
    cell: ({ row }) => row.original.profile?.schoolLevel || "-",
  },
  {
    accessorKey: "profile.grade",
    header: "Grade",
    cell: ({ row }) => row.original.profile?.grade || "-",
  },
  {
    accessorKey: "profile.province",
    header: "Province",
    cell: ({ row }) => row.original.profile?.province || "-",
  },
  {
    accessorKey: "profile.city",
    header: "City",
    cell: ({ row }) => row.original.profile?.city || "-",
  },
  {
    accessorKey: "profile.completeness",
    header: "Completeness",
    cell: ({ row }) =>
      row.original.profile?.completeness !== undefined
        ? `${row.original.profile.completeness}%`
        : "-",
  },
  {
    accessorKey: "createdAt",
    header: "Registered At",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
