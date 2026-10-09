import React, { useMemo } from "react";
import { useData, type Project } from "../context/DataContext";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

interface ProjectMetricsProps {
  project: Project;
}

const ProjectMetrics = ({ project }: ProjectMetricsProps) => {
  const { getProjectMetrics } = useData();

  const metrics = useMemo(() => {
    return getProjectMetrics(project.id);
  }, [project.id, getProjectMetrics]);

  const formatHours = (hours?: number) => {
    if (!hours) return "N/A";
    return `${hours}h`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    if (score >= 40) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle2;
    if (score >= 60) return Clock;
    if (score >= 40) return AlertTriangle;
    return TrendingDown;
  };

  const getQualityStars = (score?: number) => {
    if (!score) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Award
          key={i}
          className={`h-4 w-4 ${
            i <= score ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
          }`}
        />
      );
    }
    return stars;
  };

  const getROIColor = (roi: number) => {
    if (roi >= 1.2) return "text-emerald-600";
    if (roi >= 1.0) return "text-blue-600";
    if (roi >= 0.8) return "text-amber-600";
    return "text-red-600";
  };

  const getROIIcon = (roi: number) => {
    if (roi >= 1.0) return TrendingUp;
    return TrendingDown;
  };

  const getDeadlineStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-emerald-600" };
    if (score >= 60) return { label: "Bon", color: "text-amber-600" };
    if (score >= 40) return { label: "Critique", color: "text-orange-600" };
    return { label: "En retard", color: "text-red-600" };
  };

  const parseBudget = (budget?: string) => {
    if (!budget) return 0;
    return parseInt(budget.replace(/[^0-9]/g, ""), 10) || 0;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Analyse de Performance</h3>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ROI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700">ROI (Retour sur Investissement)</span>
            </div>
            {getROIIcon(metrics.roi || 0) && (
              <div className={`p-1.5 rounded-lg ${getROIColor(metrics.roi || 0)} bg-opacity-10`}>
                {React.createElement(getROIIcon(metrics.roi || 0), { className: "h-4 w-4" })}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${getROIColor(metrics.roi || 0)}`}>
              {metrics.roi ? `${metrics.roi.toFixed(2)}x` : "N/A"}
            </div>
            <div className="text-xs text-slate-500">
              Budget: {project.budget || "N/A"} · Coût réel: {metrics.actualHours ? `${(parseBudget(project.budget) / (project.estimatedHours || 100) * metrics.actualHours).toLocaleString()}Ar` : "N/A"}
            </div>
          </div>
        </div>

        {/* Score de respect des délais */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700">Respect des Délais</span>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getScoreColor(metrics.deadlineScore || 50)}`}>
              {getDeadlineStatus(metrics.deadlineScore || 50).label}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (metrics.deadlineScore || 50) >= 80
                      ? "bg-emerald-500"
                      : (metrics.deadlineScore || 50) >= 60
                      ? "bg-amber-500"
                      : (metrics.deadlineScore || 50) >= 40
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${metrics.deadlineScore || 50}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {metrics.deadlineScore || 0}%
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {project.endDate ? `Échéance: ${new Date(project.endDate).toLocaleDateString("fr-FR")}` : "Pas d'échéance définie"}
            </div>
          </div>
        </div>

        {/* Heures estimées vs réelles */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">Temps de travail</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Estimé:</span>
              <span className="font-medium text-slate-900">{formatHours(metrics.estimatedHours)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Réel:</span>
              <span className="font-medium text-slate-900">{formatHours(metrics.actualHours)}</span>
            </div>
            {metrics.estimatedHours && metrics.actualHours && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Écart:</span>
                  <span className={`font-medium ${
                    metrics.actualHours <= metrics.estimatedHours ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {metrics.actualHours <= metrics.estimatedHours ? "-" : "+"}
                    {Math.abs(metrics.actualHours - metrics.estimatedHours)}h
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Qualité */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">Score de Qualité</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex">
                {getQualityStars(metrics.qualityScore)}
              </div>
              <span className="font-medium text-slate-900">
                {metrics.qualityScore ? `${metrics.qualityScore}/5` : "N/A"}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {metrics.qualityScore ? (
                metrics.qualityScore >= 4 ? "Excellente qualité" :
                metrics.qualityScore >= 3 ? "Bonne qualité" :
                metrics.qualityScore >= 2 ? "Qualité moyenne" : "Qualité à améliorer"
              ) : "Non évalué"}
            </div>
          </div>
        </div>
      </div>

      {/* Indicateurs de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border p-3 flex items-center gap-3 ${
          (metrics.roi || 0) >= 1.0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
        }`}>
          <div className={`p-2 rounded-lg ${
            (metrics.roi || 0) >= 1.0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
          }`}>
            {(metrics.roi || 0) >= 1.0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-xs text-slate-600">Rentabilité</p>
            <p className={`text-sm font-semibold ${
              (metrics.roi || 0) >= 1.0 ? "text-emerald-700" : "text-red-700"
            }`}>
              {(metrics.roi || 0) >= 1.0 ? "Rentable" : "Non rentable"}
            </p>
          </div>
        </div>

        <div className={`rounded-xl border p-3 flex items-center gap-3 ${
          metrics.deadlineScore && metrics.deadlineScore >= 60 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
        }`}>
          <div className={`p-2 rounded-lg ${
            metrics.deadlineScore && metrics.deadlineScore >= 60 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
          }`}>
            {React.createElement(getScoreIcon(metrics.deadlineScore || 50), { className: "h-4 w-4" })}
          </div>
          <div>
            <p className="text-xs text-slate-600">Délais</p>
            <p className={`text-sm font-semibold ${
              metrics.deadlineScore && metrics.deadlineScore >= 60 ? "text-emerald-700" : "text-amber-700"
            }`}>
              {getDeadlineStatus(metrics.deadlineScore || 50).label}
            </p>
          </div>
        </div>

        <div className={`rounded-xl border p-3 flex items-center gap-3 ${
          metrics.qualityScore && metrics.qualityScore >= 3 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
        }`}>
          <div className={`p-2 rounded-lg ${
            metrics.qualityScore && metrics.qualityScore >= 3 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
          }`}>
            <Award className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-slate-600">Qualité</p>
            <p className={`text-sm font-semibold ${
              metrics.qualityScore && metrics.qualityScore >= 3 ? "text-emerald-700" : "text-slate-700"
            }`}>
              {metrics.qualityScore ? `${metrics.qualityScore}/5` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Notes de rétrospective */}
      {metrics.retrospectiveNotes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">Leçons apprises</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {metrics.retrospectiveNotes}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectMetrics;
