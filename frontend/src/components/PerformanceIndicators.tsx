import { useMemo } from "react";
import { useData } from "../context/DataContext";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface PerformanceIndicatorsProps {
  projectId: number;
  compact?: boolean;
}

const PerformanceIndicators = ({ projectId, compact = false }: PerformanceIndicatorsProps) => {
  const { projects, calculateProjectROI, calculateDeadlineScore } = useData();

  const project = useMemo(() => {
    return projects.find(p => p.id === projectId);
  }, [projectId, projects]);

  if (!project) return null;

  const roi = useMemo(() => {
    return calculateProjectROI(projectId);
  }, [projectId, calculateProjectROI]);

  const deadlineScore = useMemo(() => {
    return calculateDeadlineScore(projectId);
  }, [projectId, calculateDeadlineScore]);

  const getPerformanceStatus = (score: number, thresholds: { excellent: number; good: number; warning: number }) => {
    if (score >= thresholds.excellent) return { status: "excellent", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: CheckCircle2 };
    if (score >= thresholds.good) return { status: "good", color: "text-blue-600", bgColor: "bg-blue-100", icon: Target };
    if (score >= thresholds.warning) return { status: "warning", color: "text-amber-600", bgColor: "bg-amber-100", icon: Clock };
    return { status: "critical", color: "text-red-600", bgColor: "bg-red-100", icon: AlertTriangle };
  };

  const roiStatus = getPerformanceStatus(roi * 100, { excellent: 120, good: 100, warning: 80 });
  const deadlineStatus = getPerformanceStatus(deadlineScore, { excellent: 80, good: 60, warning: 40 });

  const Indicator = ({ 
    status, 
    label, 
    value, 
    unit = "", 
    showTrend = false,
    trend = 0 
  }: {
    status: ReturnType<typeof getPerformanceStatus>;
    label: string;
    value: number;
    unit?: string;
    showTrend?: boolean;
    trend?: number;
  }) => {
    const Icon = status.icon;
    const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;
    const trendColor = trend >= 0 ? "text-emerald-600" : "text-red-600";

    if (compact) {
      return (
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${status.bgColor} ${status.color}`}>
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{value}{unit}</span>
        </div>
      );
    }

    return (
      <div className={`rounded-2xl border p-4 ${status.bgColor} border-opacity-20`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${status.bgColor}`}>
              <Icon className={`h-4 w-4 ${status.color}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </div>
          {showTrend && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`text-2xl font-bold ${status.color}`}>
          {value}{unit}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {status.status === "excellent" && "Excellent performance"}
          {status.status === "good" && "Bon performance"}
          {status.status === "warning" && "Attention requise"}
          {status.status === "critical" && "Action nécessaire"}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Indicator status={roiStatus} label="ROI" value={Math.round(roi * 100)} unit="%" />
        <Indicator status={deadlineStatus} label="Délais" value={deadlineScore} unit="%" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Indicateurs de Performance</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Indicator 
          status={roiStatus} 
          label="ROI (Retour sur Investissement)" 
          value={Math.round(roi * 100)} 
          unit="%" 
          showTrend={true}
          trend={roi >= 1 ? ((roi - 1) * 100) : ((roi - 1) * 100)}
        />
        
        <Indicator 
          status={deadlineStatus} 
          label="Respect des Délais" 
          value={deadlineScore} 
          unit="%" 
        />
      </div>

      {/* Résumé global */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Évaluation Globale</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Performance globale</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 max-w-32 bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    ((roi * 100 + deadlineScore) / 2) >= 80 ? "bg-emerald-500" :
                    ((roi * 100 + deadlineScore) / 2) >= 60 ? "bg-blue-500" :
                    ((roi * 100 + deadlineScore) / 2) >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min((roi * 100 + deadlineScore) / 2, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {Math.round((roi * 100 + deadlineScore) / 2)}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Rentabilité:</span>
              <span className={`ml-2 font-medium ${roiStatus.color}`}>
                {roi >= 1.2 ? "Excellente" : roi >= 1.0 ? "Bonne" : roi > 0 ? "Faible" : "Négative"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Délais:</span>
              <span className={`ml-2 font-medium ${deadlineStatus.color}`}>
                {deadlineScore >= 80 ? "Respectés" : deadlineScore >= 60 ? "Acceptables" : deadlineScore >= 40 ? "Critiques" : "Dépassés"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceIndicators;
