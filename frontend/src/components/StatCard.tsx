import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: StatCardProps) => {
  return (
    <div 
      className={`rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`} 
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-800">{value}</h3>
          
          {trend && (
            <p className={`mt-2 text-xs font-semibold ${trend.positive ? "text-green-600" : "text-red-600"}`}>
              {trend.positive ? "↑" : "↓"} {trend.value} <span className="text-gray-400 font-normal">ce mois</span>
            </p>
          )}
        </div>
        
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;