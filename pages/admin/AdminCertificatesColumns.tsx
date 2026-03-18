import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/admin/StatusBadge";

export type Certificate = {
  id: string;
  certificateNumber?: string;
  recipient?: { fullName?: string } | null;
  event?: { title?: string } | null;
  type?: string;
  award?: string;
  issueDate?: string;
  issuedBy?: string;
  status?: string;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const columns: ColumnDef<Certificate>[] = [
  {
    accessorKey: "certificateNumber",
    header: "Certificate Number",
    cell: ({ row }) => (
      <Link
        to={`/verify-certificate/${row.original.id}`}
        className="font-medium text-indigo-600 hover:underline"
      >
        {row.original.certificateNumber || "-"}
      </Link>
    ),
  },
  {
    accessorKey: "recipient.fullName",
    header: "Recipient",
    cell: ({ row }) => row.original.recipient?.fullName || "-",
  },
  {
    accessorKey: "event.title",
    header: "Event",
    cell: ({ row }) => row.original.event?.title || "-",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => row.original.type || "-",
  },
  {
    accessorKey: "award",
    header: "Award",
    cell: ({ row }) => row.original.award || "-",
  },
  {
    accessorKey: "issueDate",
    header: "Issue Date",
    cell: ({ row }) => formatDate(row.original.issueDate),
  },
  {
    accessorKey: "issuedBy",
    header: "Issued By",
    cell: ({ row }) => row.original.issuedBy || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status || "-"} />,
  },
];
