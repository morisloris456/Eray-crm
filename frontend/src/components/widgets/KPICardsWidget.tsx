import { KPICard } from "../../types/dashboard";
import { Users, Target, DollarSign, Briefcase, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardsWidgetProps {
  data: KPICard[];
  isMinimized?: boolean;
  onEdit?: () => void;
}

const KPICardsWidget = ({ data, isMinimized = false, onEdit }: KPICardsWidgetProps) => {

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return Users;
      case 'Target': return Target;
      case 'DollarSign': return DollarSign;
      case 'Briefcase': return Briefcase;
      default: return Users;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-600';
      case 'purple': return 'bg-purple-50 text-purple-600';
      case 'green': return 'bg-green-50 text-green-600';
      case 'orange': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (isMinimized) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Indicateurs Clés</h3>
          <div className="flex gap-2">
            {data.slice(0, 4).map((kpi, index) => {
              const Icon = getIcon(kpi.icon);
              return (
                <div key={index} className={`flex h-8 w-8 items-center justify-center rounded-lg ${getColorClasses(kpi.color)}`}>
                  <Icon className="h-4 w-4" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Indicateurs Clés</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((kpi, index) => {
          const Icon = getIcon(kpi.icon);
          const TrendIcon = kpi.trend?.positive ? TrendingUp : TrendingDown;
          
          return (
            <div
              key={index}
              onClick={kpi.onClick}
              className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-800">{kpi.value}</p>
                  {kpi.trend && (
                    <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                      kpi.trend.positive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendIcon className="h-3 w-3" />
                      {kpi.trend.value}
                    </div>
                  )}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${getColorClasses(kpi.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPICardsWidget;
