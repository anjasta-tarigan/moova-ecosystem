import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-blue-100 text-blue-800",
  submitted: "bg-purple-100 text-purple-800",
  revoked: "bg-red-100 text-red-800",
  "coming soon": "bg-indigo-100 text-indigo-800",
  open: "bg-teal-100 text-teal-800",
  closed: "bg-pink-100 text-pink-800",
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const colorClass =
    statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block",
        colorClass,
        className,
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
