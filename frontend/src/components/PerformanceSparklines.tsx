import { useMemo } from "react";
import { useData } from "../context/DataContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";

interface PerformanceSparklinesProps {
  className?: string;
}

const PerformanceSparklines = ({ className = "" }: PerformanceSparklinesProps) => {
  const { projects } = useData();

  const monthlyData = useMemo(() => {
    const data: Record<string, { revenue: number; count: number; completed: number }> = {};
    
    projects.forEach(project => {
      if (!project.startDate) return;
      
      const date = new Date(project.startDate);
      const monthKey = date.toLocaleDateString("fr-FR", { year: "numeric", month: "short" });
      
      if (!data[monthKey]) {
        data[monthKey] = { revenue: 0, count: 0, completed: 0 };
      }
      
      const budget = parseInt(project.budget?.replace(/[^0-9]/g, '') || '0');
      data[monthKey].revenue += budget;
      data[monthKey].count += 1;
      
      if (project.status === "termine") {
        data[monthKey].completed += 1;
      }
    });
    
    return Object.entries(data)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-6); // Derniers 6 mois
  }, [projects]);

  const maxRevenue = useMemo(() => {
    return Math.max(...monthlyData.map(([, d]) => d.revenue), 1);
  }, [monthlyData]);

  const maxProjects = useMemo(() => {
    return Math.max(...monthlyData.map(([, d]) => d.count), 1);
  }, [monthlyData]);

  const Sparkline = ({ 
    data, 
    maxValue, 
    color = "blue", 
    height = 40 
  }: { 
    data: number[]; 
    maxValue: number; 
    color?: string; 
    height?: number; 
  }) => {
    const width = 120;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    }).join(' ');

    const trend = data.length >= 2 ? data[data.length - 1] - data[0] : 0;
    const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;
    const trendColor = trend >= 0 ? "text-emerald-600" : "text-red-600";

    return (
      <div className="flex items-center gap-3">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke={`rgb(${color === "blue" ? "59, 130, 246" : color === "green" ? "34, 197, 94" : "168, 85, 247"})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={points}
            fill={`rgba(${color === "blue" ? "59, 130, 246" : color === "green" ? "34, 197, 94" : "168, 85, 247"}, 0.1)`}
            stroke="none"
          />
        </svg>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {trend >= 0 ? "+" : ""}{((trend / (data[0] || 1)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const totalRevenue = monthlyData.reduce((sum, [, d]) => sum + d.revenue, 0);
  const totalProjects = monthlyData.reduce((sum, [, d]) => sum + d.count, 0);
  const avgCompletionRate = monthlyData.length > 0 
    ? Math.round((monthlyData.reduce((sum, [, d]) => sum + d.completed, 0) / totalProjects) * 100)
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Performance Mensuelle</h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          Derniers 6 mois
        </span>
      </div>

      {/* Cartes de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Revenue</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-600">
                {totalRevenue.toLocaleString()}Ar
              </p>
              <p className="text-xs text-slate-500">Total période</p>
            </div>
          </div>
          <Sparkline 
            data={monthlyData.map(([, d]) => d.revenue)} 
            maxValue={maxRevenue} 
            color="green"
          />
        </div>

        {/* Nombre de projets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Projets</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                {totalProjects}
              </p>
              <p className="text-xs text-slate-500">Total période</p>
            </div>
          </div>
          <Sparkline 
            data={monthlyData.map(([, d]) => d.count)} 
            maxValue={maxProjects} 
            color="blue"
          />
        </div>

        {/* Taux de complétion */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">Complétion</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600">
                {avgCompletionRate}%
              </p>
              <p className="text-xs text-slate-500">Taux moyen</p>
            </div>
          </div>
          <Sparkline 
            data={monthlyData.map(([, d]) => d.count > 0 ? (d.completed / d.count) * 100 : 0)} 
            maxValue={100} 
            color="purple"
          />
        </div>
      </div>

      {/* Tableau récapitulatif */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Détail mensuel</h4>
        <div className="space-y-2">
          {monthlyData.map(([month, data]) => (
            <div key={month} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm font-medium text-slate-600 w-20">{month}</span>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-emerald-600 font-medium">{data.revenue.toLocaleString()}Ar</span>
                <span className="text-blue-600">{data.count} projets</span>
                <span className="text-purple-600">{data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceSparklines;
