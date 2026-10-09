import { useMemo } from "react";
import { useData } from "../context/DataContext";
import {
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle2,
  User,
  FileText,
  DollarSign,
  Flag,
  Archive,
  Play,
  Pause,
  ChevronRight,
} from "lucide-react";

interface ProjectTimelineProps {
  projectId: number;
}

const ProjectTimeline = ({ projectId }: ProjectTimelineProps) => {
  const { getProjectHistory } = useData();

  const history = useMemo(() => {
    return getProjectHistory(projectId);
  }, [projectId, getProjectHistory]);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "création du projet":
        return Play;
      case "changement de statut":
        return Flag;
      case "mise à jour du budget":
        return DollarSign;
      case "clôture du projet":
        return CheckCircle2;
      case "archivage":
        return Archive;
      case "mise en attente":
        return Pause;
      default:
        return FileText;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "création du projet":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "changement de statut":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "mise à jour du budget":
        return "bg-green-50 text-green-700 border-green-200";
      case "clôture du projet":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "archivage":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "mise en attente":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Aucun historique disponible</p>
        <p className="text-slate-400 text-sm mt-1">Les actions sur ce projet apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Timeline du projet</h3>
        <span className="text-sm text-slate-500">({history.length} événements)</span>
      </div>

      <div className="relative">
        {/* Ligne verticale centrale */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

        {/* Événements */}
        <div className="space-y-6">
          {history.map((entry, index) => {
            const Icon = getActionIcon(entry.action);
            const isLast = index === history.length - 1;

            return (
              <div key={entry.id} className="relative flex items-start gap-4">
                {/* Cercle sur la timeline */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${getActionColor(entry.action)} shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {!isLast && (
                    <div className="absolute top-12 left-1/2 h-6 w-0.5 -translate-x-1/2 bg-slate-200" />
                  )}
                </div>

                {/* Contenu de l'événement */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                    {/* En-tête */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-900 truncate">{entry.action}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm text-slate-500">{formatDate(entry.timestamp)}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400">{getRelativeTime(entry.timestamp)}</span>
                        </div>
                      </div>
                      
                      {entry.userId && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="h-3.5 w-3.5" />
                          <span className="capitalize">{entry.userId}</span>
                        </div>
                      )}
                    </div>

                    {/* Détails des changements */}
                    <div className="space-y-2">
                      {entry.changes.description && (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {entry.changes.description}
                        </p>
                      )}

                      {/* Changement de valeurs */}
                      {entry.changes.oldValue !== undefined && entry.changes.newValue !== undefined && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Avant:</span>
                            <span className="font-medium text-slate-700 line-through">
                              {entry.changes.oldValue}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Après:</span>
                            <span className="font-medium text-emerald-600">
                              {entry.changes.newValue}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Champ spécifique */}
                      {entry.changes.field && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs">
                          <Flag className="h-3 w-3.5 text-slate-500" />
                          <span className="font-medium text-slate-600">{entry.changes.field}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé statistique */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-slate-600" />
          <h4 className="font-medium text-slate-900">Résumé d'activité</h4>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Première action:</span>
            <span className="ml-2 font-medium text-slate-700">
              {history.length > 0 ? formatDate(history[history.length - 1].timestamp) : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Dernière action:</span>
            <span className="ml-2 font-medium text-slate-700">
              {history.length > 0 ? formatDate(history[0].timestamp) : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;
