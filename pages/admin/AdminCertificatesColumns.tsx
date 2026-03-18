import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { formatDateTime } from "../../lib/utils";

export type Certificate = {
  id: string;
  participantName: string;
  eventName: string;
  certificateNumber: string;
  status: string;
  issuedAt: string;
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
        {row.getValue("certificateNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "participantName",
    header: "Participant",
  },
  {
    accessorKey: "eventName",
    header: "Event",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "issuedAt",
    header: "Issued At",
    cell: ({ row }) => formatDateTime(row.getValue("issuedAt")),
  },
];
