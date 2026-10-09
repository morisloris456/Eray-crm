import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { notify } from "../utils/notify";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  time: string;
  read: boolean;
  action?: () => void;
}

const NotificationsPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, clients, projects } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");
  const currentUserId = user?.id;

  // Générer les notifications importantes avec persistance
  useEffect(() => {
    const generateNotifications = () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      const newNotifications: NotificationItem[] = [];

      // Événements aujourd'hui (toute la journée)
      const visibleEvents = isAdmin
        ? events
        : events.filter((e) => e.createdBy?.id === currentUserId);
      const visibleClients = isAdmin
        ? clients
        : clients.filter((c) => c.createdBy?.id === currentUserId);
      const visibleProjects = isAdmin
        ? projects
        : projects.filter((p) => p.createdBy?.id === currentUserId);

      const todayEvents = visibleEvents.filter((e) => e.date === todayStr);

      todayEvents.forEach((event) => {
        // On ne vérifie plus le "timeUntilEvent", on vérifie juste si c'est aujourd'hui
        newNotifications.push({
          id: `today-${event.id}`,
          title: `Rappel: ${event.title}`,
          message: `${event.type} avec ${event.clientName} - Aujourd'hui à ${event.time}`,
          type: "info",
          time: now.toISOString(),
          read: false,
          action: () => {
            navigate("/agenda");
            notify.info(`Navigation vers l'agenda pour ${event.title}`);
          },
        });
      });

      // Notifications pour les événements de demain
      const tomorrowEvents = visibleEvents.filter(
        (e) => e.date === tomorrowStr,
      );
      if (tomorrowEvents.length > 0) {
        newNotifications.push({
          id: "tomorrow-summary",
          title: "Préparation pour demain",
          message: `Vous avez ${tomorrowEvents.length} événement${
            tomorrowEvents.length > 1 ? "s" : ""
          } demain`,
          type: "warning",
          time: now.toISOString(),
          read: false,
          action: () => {
            navigate("/agenda");
            notify.info("Navigation vers l'agenda");
          },
        });
      }

      // Notifications pour les nouveaux clients (aujourd'hui uniquement)
      // On définit le début de la journée actuelle (00:00:00)
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const recentClients = visibleClients.filter(
        (client) => new Date(client.createdAt) >= startOfToday,
      );

      if (recentClients.length > 0) {
        const latestClient = recentClients[recentClients.length - 1];
        newNotifications.push({
          id: `new-client-${latestClient.id}`,
          title: "Nouveau client aujourd'hui",
          message: `${latestClient.name} (${latestClient.company}) vient d'être ajouté`,
          type: "success",
          time: now.toISOString(),
          read: false,
          action: () => {
            navigate("/clients");
            notify.info(
              `Navigation vers les clients pour ${latestClient.name}`,
            );
          },
        });
      }

      // Projets urgents (priorité critique ou < 25% de progression)
      // const urgentProjects = projects.filter(
      //   (p) =>
      //     p.status !== "archive" &&
      //     p.status !== "termine" &&
      //     (p.priority === "critique" || p.progress < 25)
      // );

      // urgentProjects.forEach((project) => {
      //   newNotifications.push({
      //     id: `project-urgent-${project.id}`,
      //     title: `Projet urgent`,
      //     message: `${project.title} - ${project.progress}% complété`,
      //     type: project.priority === "critique" ? "error" : "warning",
      //     time: now.toISOString(),
      //     read: false,
      //     action: () => {
      //       navigate("/projects");
      //       notify.info(`Navigation vers les projets pour ${project.title}`);
      //     },
      //   });
      // });

      // Notifications pour les projets proches de l'échéance
      const projectsNearDeadline = visibleProjects.filter((p) => {
        if (!p.endDate) return false;
        const deadline = new Date(p.endDate);
        const daysUntilDeadline = Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
      });

      if (projectsNearDeadline.length > 0) {
        newNotifications.push({
          id: "projects-deadline",
          title: "Échéances de projets approchent",
          message: `${projectsNearDeadline.length} projet${
            projectsNearDeadline.length > 1 ? "s" : ""
          } à finaliser cette semaine`,
          type: "warning",
          time: now.toISOString(),
          read: false,
          action: () => {
            navigate("/projects");
            notify.info("Navigation vers les projets");
          },
        });
      }

      return newNotifications;
    };

    const newNotifications = generateNotifications();

    // Ajouter les nouvelles notifications sans supprimer les existantes
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const filteredNew = newNotifications.filter(
        (n) => !existingIds.has(n.id),
      );
      return [...prev, ...filteredNew];
    });
  }, [events, clients, projects, navigate, isAdmin, currentUserId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: NotificationItem) => {
    // Marquer comme lue
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );

    // Exécuter l'action de navigation si elle existe
    if (notification.action) {
      notification.action();
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notify.success("Toutes les notifications marquées comme lues");
  };

  const clearAll = () => {
    setNotifications([]);
    notify.success("Notifications supprimées");
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    const iconStyles = {
      info: "h-5 w-5 text-blue-600 bg-blue-100 rounded-full p-1",
      success: "h-5 w-5 text-emerald-600 bg-emerald-100 rounded-full p-1",
      warning: "h-5 w-5 text-amber-600 bg-amber-100 rounded-full p-1",
      error: "h-5 w-5 text-red-600 bg-red-100 rounded-full p-1",
    };

    switch (type) {
      case "info":
        return <Info className={iconStyles.info} />;
      case "success":
        return <CheckCircle className={iconStyles.success} />;
      case "warning":
        return <AlertTriangle className={iconStyles.warning} />;
      case "error":
        return <AlertCircle className={iconStyles.error} />;
      default:
        return (
          <Bell className="h-5 w-5 text-slate-600 bg-slate-100 rounded-full p-1" />
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-sm p-3 shadow-lg transition-all duration-300 hover:bg-slate-50 hover:scale-105 active:scale-95"
      >
        <Bell className="h-5 w-5 text-slate-600 transition-transform group-hover:animate-pulse" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold flex items-center justify-center animate-bounce shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {isOpen && (
        <div className="absolute right-0 top-14 w-96 max-h-96 rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-right fade-in-0">
          {/* Header */}
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-slate-700" />
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Tout lire
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-500">Aucune notification</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-all duration-300 hover:bg-slate-50 cursor-pointer ${
                        !notification.read
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-slate-600 text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notification.time).toLocaleString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 p-3">
                  <button
                    onClick={clearAll}
                    className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                  >
                    Tout effacer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
