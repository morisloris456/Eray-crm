import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface CalendarWidgetProps {
  isMinimized?: boolean;
  config?: any;
  onEdit?: () => void;
}

const CalendarWidget = ({ isMinimized = false }: CalendarWidgetProps) => {
  const { projects, deals, clients } = useData();
  const { user } = useAuth();

  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");

  const displayProjects = useMemo(() => {
    if (isAdmin) return projects;
    return projects.filter((p) => p.createdBy?.id === user?.id);
  }, [projects, user, isAdmin]);

  const displayDeals = useMemo(() => {
    if (isAdmin) return deals;
    return deals.filter(
      (d) => d.createdBy?.id === user?.id || d.assignedTo === user?.name,
    );
  }, [deals, user, isAdmin]);

  const displayClients = useMemo(() => {
    if (isAdmin) return clients;
    return clients.filter((c) => c.createdBy?.id === user?.id);
  }, [clients, user, isAdmin]);
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    type: "Rendez-vous" as "Rendez-vous" | "Appel" | "Réunion",
    client: "",
    description: "",
  });

  // Obtenir le mois et l'année actuels
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthName = monthNames[currentMonth];

  // Obtenir les jours du mois
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);

  // Générer les événements pour le mois
  const getEventsForMonth = () => {
    const events: any[] = [];

    // Ajouter les échéances de projets
    displayProjects.forEach((project) => {
      if (project.endDate) {
        const endDate = new Date(project.endDate);
        if (
          endDate.getMonth() === currentMonth &&
          endDate.getFullYear() === currentYear
        ) {
          events.push({
            day: endDate.getDate(),
            title: project.title,
            type: "Échéance",
            color: "orange",
            url: `/projects?search=${project.id}`,
          });
        }
      }
    });

    // Ajouter les dates de deals
    displayDeals.forEach((deal) => {
      if (deal.date) {
        const dealDate = new Date(deal.date);
        if (
          dealDate.getMonth() === currentMonth &&
          dealDate.getFullYear() === currentYear
        ) {
          events.push({
            day: dealDate.getDate(),
            title: deal.title,
            type: "Deal",
            color: "blue",
            url: `/pipeline?search=${deal.id}`,
          });
        }
      }
    });

    // Ajouter les dates de création de clients
    displayClients.forEach((client) => {
      const createdDate = new Date(client.createdAt);
      if (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      ) {
        events.push({
          day: createdDate.getDate(),
          title: client.name,
          type: "Client",
          color: "green",
          url: `/clients?search=${client.id}`,
        });
      }
    });

    return events;
  };

  const events = getEventsForMonth();

  // Navigation dans le calendrier
  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  // Ajouter un événement
  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      // Naviguer vers la page agenda avec les données pré-remplies
      const params = new URLSearchParams({
        new: "true",
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        type: newEvent.type,
        client: newEvent.client,
        description: newEvent.description,
      });
      navigate(`/agenda?${params.toString()}`);
      setShowAddForm(false);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        type: "Rendez-vous",
        client: "",
        description: "",
      });
    }
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    navigate(`/agenda?date=${dateStr}`);
  };

  if (isMinimized) {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-indigo-500" />
          <span className="font-medium text-gray-800">Calendrier</span>
        </div>
        <span className="text-sm text-gray-600">
          {monthName} {currentYear}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-bold text-gray-800">Calendrier</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          title="Ajouter un événement"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Formulaire d'ajout rapide */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <h4 className="text-sm font-medium text-indigo-800 mb-2">
            Nouveau Événement
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Titre de l'événement"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, time: e.target.value })
                }
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <select
              value={newEvent.type}
              onChange={(e) =>
                setNewEvent({ ...newEvent, type: e.target.value as any })
              }
              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            >
              <option value="Rendez-vous">Rendez-vous</option>
              <option value="Appel">Appel</option>
              <option value="Réunion">Réunion</option>
            </select>
            <input
              type="text"
              placeholder="Client (optionnel)"
              value={newEvent.client}
              onChange={(e) =>
                setNewEvent({ ...newEvent, client: e.target.value })
              }
              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description (optionnel)"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddEvent}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-indigo-200 bg-white py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation du mois */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <h4 className="font-semibold text-gray-800">
          {monthName} {currentYear}
        </h4>
        <button
          onClick={nextMonth}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["D", "L", "M", "M", "J", "V", "S"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 p-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Jours vides avant le début du mois */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="p-1" />
        ))}

        {/* Jours du mois */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = events.filter((event) => event.day === day);
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === currentMonth &&
            new Date().getFullYear() === currentYear;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`relative p-1 text-sm rounded-lg transition-colors ${
                isToday
                  ? "bg-indigo-100 text-indigo-800 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {day}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-0 right-0 w-1 h-1 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Événements du mois */}
      {events.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-sm font-medium text-gray-700">
            Événements du mois
          </h5>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {events.slice(0, 3).map((event, index) => (
              <button
                key={index}
                onClick={() => navigate(event.url)}
                className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full bg-${event.color}-500`}
                    style={{
                      backgroundColor:
                        event.color === "orange"
                          ? "#f97316"
                          : event.color === "blue"
                            ? "#3b82f6"
                            : "#10b981",
                    }}
                  />
                  <span className="text-xs font-medium text-gray-800">
                    {event.title}
                  </span>
                  <span className="text-xs text-gray-500">{event.day}</span>
                </div>
              </button>
            ))}
            {events.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{events.length - 3} autres événements
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lien vers l'agenda complet */}
      <button
        onClick={() => navigate("/agenda")}
        className="mt-4 w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        Voir l'agenda complet →
      </button>
    </div>
  );
};

export default CalendarWidget;
