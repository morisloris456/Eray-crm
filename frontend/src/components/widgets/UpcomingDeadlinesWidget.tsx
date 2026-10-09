import { useState } from "react";
import { Clock, Plus, Calendar } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useNavigate } from "react-router-dom";

interface UpcomingDeadlinesWidgetProps {
  isMinimized?: boolean;
  config?: any;
  onEdit?: () => void;
  deadlines?: any[];
}

const UpcomingDeadlinesWidget = ({
  isMinimized = false,
  deadlines,
}: UpcomingDeadlinesWidgetProps) => {
  const { projects } = useData();
  const navigate = useNavigate();

  // Filtrer les projets avec échéances dans 30 jours

  const sourceProjects = deadlines ?? projects;

  const upcomingDeadlines = sourceProjects
    .filter((p) => p.endDate) // enlève undefined et ''
    .filter((p) => {
      const end = new Date(p.endDate as string);
      if (isNaN(end.getTime())) return false;

      const today = new Date();
      const diffDays =
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays >= 0 && diffDays <= 30;
    })
    .sort((a, b) => {
      return (
        new Date(a.endDate as string).getTime() -
        new Date(b.endDate as string).getTime()
      );
    })
    .slice(0, 5);

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects?search=${projectId}`);
  };

  if (isMinimized) {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="font-medium text-gray-800">Échéances</span>
        </div>
        <span className="text-sm text-gray-600">
          {upcomingDeadlines.length} à venir
        </span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <h3 className="font-bold text-gray-800">Échéances</h3>
        </div>
        <button
          onClick={() => navigate("/projects?new=true")}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Ajouter une échéance"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Liste des échéances */}
      <div className="space-y-2">
        {upcomingDeadlines.length > 0 ? (
          upcomingDeadlines.map((project) => {
            const endDate = new Date(project.endDate!);
            const daysUntil = Math.ceil(
              (endDate.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            );
            const isUrgent = daysUntil <= 7;

            return (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {project.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {isUrgent ? "Urgent" : `${daysUntil} jours`}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    isUrgent
                      ? "bg-red-100 text-red-600"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {endDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune échéance à venir</p>

            <button
              onClick={() => navigate("/projects?new=true")}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Ajouter une échéance
            </button>
          </div>
        )}
      </div>

      {/* Lien vers tous les projets */}
      <button
        onClick={() => navigate("/projects")}
        className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Voir tous les projets →
      </button>
    </div>
  );
};

export default UpcomingDeadlinesWidget;
