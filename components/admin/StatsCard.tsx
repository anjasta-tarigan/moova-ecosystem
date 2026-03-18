import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  Icon: LucideIcon;
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease";
}

export const StatsCard = ({
  Icon,
  title,
  value,
  change,
  changeType,
}: StatsCardProps) => {
  const isIncrease = changeType === "increase";
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center">
        <div className="bg-gray-100 rounded-full p-3 mr-4">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span
            className={`font-semibold ${isIncrease ? "text-green-600" : "text-red-600"}`}
          >
            {isIncrease ? "▲" : "▼"} {change}
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
