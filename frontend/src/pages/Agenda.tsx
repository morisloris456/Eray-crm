
import { useMemo, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Calendar as CalendarIcon,
  Video,
  Phone,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  User,
  Briefcase,
  Timer,
  Sparkles,
  Search,
  Download,
  LayoutGrid, // Pour la vue calendrier
  List, // Pour la vue liste
  Filter, // Pour les types
  CheckCircle2, // Pour le statut terminé
  AlertCircle, // Pour annulé
  History, // Pour à venir
  UserPlus, // Pour bouton Mes rendez-vous
  Users, // Pour le filtre utilisateurs
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useData, type CalendarEvent } from "../context/DataContext";
import Modal from "../components/Modal";
import React from "react";
import { useAuth } from "../context/AuthContext";

// Types stricts pour éviter les erreurs de mapping
type EventType = "Réunion" | "Appel" | "Présentiel";
type EventStatus = "planifie" | "en_cours" | "termine" | "annule";

// =========================
// CONFIGURATION VISUELLE
// =========================
const EVENT_STYLES: Record<
  EventType,
  {
    color: string;
    icon: React.ComponentType<any>;
    dot: string;
    iconColor: string;
  }
> = {
  Réunion: {
    color: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/80",
    icon: Video,
    dot: "bg-blue-500",
    iconColor: "text-blue-600",
  },
  Appel: {
    color:
      "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100/80",
    icon: Phone,
    dot: "bg-orange-500",
    iconColor: "text-orange-500",
  },
  Présentiel: {
    color: "bg-green-50 text-green-700 border-green-100 hover:bg-green-100/80",
    icon: MapPin,
    dot: "bg-green-500",
    iconColor: "text-green-600",
  },
};

const STATUS_STYLES: Record<
  EventStatus,
  {
    color: string;
    label: string;
  }
> = {
  planifie: {
    color: "bg-slate-100 text-slate-700 border border-slate-200",
    label: "Planifié",
  },
  en_cours: {
    color: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    label: "En cours",
  },
  termine: {
    color: "bg-blue-100 text-blue-700 border border-blue-200",
    label: "Terminé",
  },
  annule: {
    color: "bg-red-100 text-red-700 border border-red-200",
    label: "Annulé",
  },
};

const Agenda = () => {
  const { user } = useAuth();
  const {
    events,
    clients,
    projects,
    addEvent,
    updateEvent,
    deleteEvent,
    loadingEvents,
  } = useData();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null,
  );

  // États pour les filtres et vue liste
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterDateRange, setFilterDateRange] = useState<string>("all"); // Changé sur 'all' par défaut
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  // ✅ Filtres ownership — même logique que Projects/Deals
  const [filterMyEvents, setFilterMyEvents] = useState(false);
  const [filterByUser, setFilterByUser] = useState<number | "all">("all");
  const [showUserFilter, setShowUserFilter] = useState(false);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  const [newEvent, setNewEvent] = useState({
    title: "",
    clientId: "",
    projectId: "",
    time: "10:00",
    type: "Réunion" as EventType,
    description: "",
    location: "",
    status: "en_cours" as EventStatus,
  });

  // =========================
  // GESTION UTILISATEURS (Admin)
  // =========================
  const allUsers = useMemo(() => {
    const map = new Map<number, string>();
    events.forEach((e) => {
      if (e.createdBy?.id && e.createdBy?.name) {
        map.set(e.createdBy.id, e.createdBy.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [events]);

  const selectedUserName =
    filterByUser === "all"
      ? "Tous les utilisateurs"
      : (allUsers.find((u) => u.id === filterByUser)?.name ?? "Utilisateur");

  // =========================
  // FILTRE SCOPE GLOBAL
  // =========================
  const eventsScope = useMemo(() => {
    let base = isAdmin
      ? events
      : events.filter((e) => e.createdBy?.id === user?.id);

    if (filterMyEvents && user) {
      base = base.filter((e) => e.createdBy?.id === user.id);
    }

    if (isAdmin && filterByUser !== "all") {
      base = base.filter((e) => e.createdBy?.id === filterByUser);
    }

    return base;
  }, [events, isAdmin, user, filterMyEvents, filterByUser]);

  // =========================
  // LOGIQUE CALENDRIER
  // =========================
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthName = currentDate.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const todayStats = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const todayEvents = eventsScope.filter((e) => e.date === todayStr);

    return {
      total: todayEvents.length,
      meetings: todayEvents.filter((e) => e.type === "Réunion").length,
      calls: todayEvents.filter((e) => e.type === "Appel").length,
    };
  }, [eventsScope]);

  // =========================
  // UTILITAIRES DE CALCUL
  // =========================
  const calculateEndTime = (time: string, duration: number): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
      2,
      "0",
    )}`;
  };

  // =========================
  // FONCTIONS AVANCÉES
  // =========================
  const exportToCSV = useCallback(() => {
    setIsExporting(true);

    const sortedEvents = [...eventsScope].sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    const headers = [
      "Date",
      "Heure",
      "Heure de fin",
      "Titre",
      "Type",
      "Client",
      "Statut",
      "Durée (minutes)",
      "Lieu",
      "Projet",
      "Description",
      "Créé par",
    ];
    const csvContent = [
      headers.join(","),
      ...sortedEvents.map((event) => {
        const endTime = calculateEndTime(event.time, event.duration || 60);
        return [
          event.date,
          event.time,
          endTime,
          event.title,
          event.type,
          event.clientName,
          STATUS_STYLES[event.status as EventStatus].label,
          `${event.duration || 60}`,
          event.location || "",
          event.projectName || "",
          event.description || "",
          event.createdBy?.name || "Inconnu",
        ]
          .map((field) => `"${field}"`)
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `agenda_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 1000);
  }, [eventsScope]);

  const normalizeEventStatus = (event: CalendarEvent): CalendarEvent => {
    if (!event.date) return event;

    const eventDateTime = new Date(`${event.date}T${event.time || "00:00"}`);
    const now = new Date();

    if (eventDateTime < now && event.status !== "termine") {
      return {
        ...event,
        status: "termine",
      };
    }

    return event;
  };

  // =========================
  // LOGIQUE DE FILTRAGE AMÉLIORÉE
  // =========================
  const filteredEvents = useMemo(() => {
    let filtered = [...eventsScope];

    // Filtre par recherche globale
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.description?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          (e.location?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          (e.projectName?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ),
      );
    }

    // Filtre par type
    if (filterType !== "all") {
      filtered = filtered.filter((e) => e.type === filterType);
    }

    // Filtre par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter((e) => e.status === filterStatus);
    }

    // Filtre par client (Correction de l'erreur toLowerCase)
    if (filterClient) {
      filtered = filtered.filter((e) =>
        (e.clientName || "").toLowerCase().includes(filterClient.toLowerCase()),
      );
    }

    // Filtre par plage de dates
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (filterDateRange === "upcoming") {
      filtered = filtered.filter((e) => e.date >= todayStr);
    } else if (filterDateRange === "today") {
      filtered = filtered.filter((e) => e.date === todayStr);
    } else if (filterDateRange === "week") {
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekStr = `${weekFromNow.getFullYear()}-${String(
        weekFromNow.getMonth() + 1,
      ).padStart(2, "0")}-${String(weekFromNow.getDate()).padStart(2, "0")}`;
      filtered = filtered.filter(
        (e) => e.date >= todayStr && e.date <= weekStr,
      );
    } else if (filterDateRange === "month") {
      const monthStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
      ).padStart(2, "0")}`;
      filtered = filtered.filter((e) => e.date.startsWith(monthStr));
    }

    // Trier par date et heure
    return filtered.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [
    eventsScope,
    searchTerm,
    filterType,
    filterStatus,
    filterClient,
    filterDateRange,
  ]);

  // =========================
  // ACTIONS
  // =========================
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

    if (!newEvent.clientId) {
      alert("Veuillez sélectionner un client.");
      return;
    }

    const dateString = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

    const payload = {
      ...newEvent,
      date: dateString,
      clientId: Number(newEvent.clientId),
      projectId: newEvent.projectId ? Number(newEvent.projectId) : undefined,
    };

    setIsSaving(true);
    try {
      await addEvent(payload);
      setIsModalOpen(false);
      setNewEvent({
        title: "",
        clientId: "",
        projectId: "",
        time: "10:00",
        type: "Réunion" as EventType,
        description: "",
        location: "",
        status: "en_cours" as EventStatus,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const payload = {
      ...newEvent,
      clientId: Number(newEvent.clientId),
      projectId: newEvent.projectId ? Number(newEvent.projectId) : undefined,
    };

    setIsSaving(true);
    try {
      await updateEvent(selectedEvent.id, payload);
      setIsDetailModalOpen(false);
      setIsEditMode(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Erreur update:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = (eventId: number) => {
    deleteEvent(eventId);
    setIsDetailModalOpen(false);
    setSelectedEvent(null);
  };

  const openEventDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    const cId = event.clientId || event.client?.id || "";
    const pId = event.projectId || event.project?.id || "";

    setNewEvent({
      title: event.title,
      clientId: String(cId),
      projectId: String(pId),
      time: event.time,
      type: event.type as EventType,
      description: event.description || "",
      location: event.location || "",
      status: event.status as EventStatus,
    });
    setIsDetailModalOpen(true);
    setIsEditMode(false);
  };

  const confirmDelete = async () => {
    if (!eventToDelete?.id) return;
    try {
      await handleDeleteEvent(eventToDelete.id);
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      setIsDetailModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error("Erreur API :", err);
    }
  };

  const startEditEvent = () => {
    if (selectedEvent) {
      setNewEvent({
        title: selectedEvent.title,
        description: selectedEvent.description || "",
        clientId: selectedEvent.clientId
          ? selectedEvent.clientId.toString()
          : "",
        projectId: selectedEvent.projectId
          ? selectedEvent.projectId.toString()
          : "",
        time: selectedEvent.time,
        type: selectedEvent.type,
        status: selectedEvent.status,
        location: selectedEvent.location || "",
        date: selectedEvent.date || "",
      });
    }
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    if (selectedEvent) {
      setNewEvent({
        title: selectedEvent.title,
        clientId: String(selectedEvent.clientId || ""),
        projectId: String(selectedEvent.projectId || ""),
        time: selectedEvent.time,
        type: selectedEvent.type as EventType,
        description: selectedEvent.description || "",
        location: selectedEvent.location || "",
        status: selectedEvent.status as EventStatus,
        date: selectedEvent.date || "",
      });
    }
  };

  const visibleClients = user?.roles?.includes("ROLE_ADMIN")
    ? clients
    : clients.filter((client) => client.createdBy?.id === user?.id);

  const visibleProjects = user?.roles?.includes("ROLE_ADMIN")
    ? projects
    : projects.filter((project) => project.createdBy?.id === user?.id);

  return (
    <div className="space-y-6 text-left">
      {/* HEADER */}
      <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-blue-50 p-6 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Planning intelligent
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 capitalize">
              {monthName}
            </h1>
            <p className="mt-2 text-base font-medium text-slate-600">
              Organisez les rendez-vous, appels et réunions de l'agence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Recherche globale */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Bouton Export */}
            <button
              onClick={exportToCSV}
              disabled={isExporting || eventsScope.length === 0}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              {isExporting ? (
                <Timer className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter CSV
            </button>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Aujourd'hui
              </p>
              <p className="text-lg font-bold text-slate-800">
                {todayStats.total} événement{todayStats.total > 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={goToToday}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Aujourd&apos;hui
            </button>

            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={prevMonth}
                className="rounded-xl p-2.5 transition-colors hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={nextMonth}
                className="rounded-xl p-2.5 transition-colors hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MINI STATS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">
              Événements du jour
            </span>
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-800">
            {todayStats.total}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">
              Réunions
            </span>
            <Video className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-800">
            {todayStats.meetings}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Appels</span>
            <Phone className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-800">
            {todayStats.calls}
          </p>
        </div>
      </div>

      {/* FILTRES ET VUE */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* GROUPE GAUCHE : Vues, Filtres Admin, Filtres Liste */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sélecteur de vue */}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "calendar"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Calendrier
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <List className="h-4 w-4" />
                Liste
              </button>
            </div>

            {/* Bouton "Mes rendez-vous" (Admin seulement) */}
            {isAdmin && (
              <button
                onClick={() => {
                  setFilterMyEvents(!filterMyEvents);
                  if (!filterMyEvents && isAdmin) setFilterByUser("all");
                }}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition-all ${
                  filterMyEvents
                    ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Mes rendez-vous
              </button>
            )}

            {/* Dropdown "Utilisateurs" (Admin seulement) */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowUserFilter(!showUserFilter)}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition-all ${
                    filterByUser !== "all"
                      ? "border-purple-400 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="max-w-[140px] truncate">
                    {selectedUserName}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>

                {showUserFilter && (
                  <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
                    <button
                      onClick={() => {
                        setFilterByUser("all");
                        setFilterMyEvents(false);
                        setShowUserFilter(false);
                      }}
                      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-slate-50 ${
                        filterByUser === "all"
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700"
                      }`}
                    >
                      Tous les utilisateurs
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setFilterByUser(u.id);
                          setFilterMyEvents(false);
                          setShowUserFilter(false);
                        }}
                        className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-slate-50 ${
                          filterByUser === u.id
                            ? "bg-purple-50 text-purple-700 font-semibold"
                            : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-600">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{u.name}</span>
                        </div>
                      </button>
                    ))}
                    {allUsers.length === 0 && (
                      <p className="px-4 py-3 text-xs text-slate-400">
                        Aucun utilisateur trouvé
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Filtres spécifiques à la vue liste */}
            {viewMode === "list" && (
              <>
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-8 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="all">Tous les types</option>
                    <option value="Réunion">Réunions</option>
                    <option value="Appel">Appels</option>
                    <option value="Présentiel">Présentiel</option>
                  </select>
                </div>

                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-8 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>

                <div className="relative">
                  <History className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-8 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="upcoming">À venir</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    placeholder="Rechercher un client..."
                    className="rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </>
            )}
          </div>

          {/* GROUPE DROITE : Compteur (événement globalement) */}
          <div className="text-sm text-slate-500 whitespace-nowrap">
            {viewMode === "calendar"
              ? `${eventsScope.length} événement(s) globalement`
              : `${filteredEvents.length} événement(s) trouvé(s)`}
          </div>
        </div>

        {/* ✅ Indicateurs filtres actifs (sous la barre principale) */}
        {(filterMyEvents || (isAdmin && filterByUser !== "all")) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">
              Filtres actifs :
            </span>
            {filterMyEvents && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Mes rendez-vous
                <button
                  onClick={() => setFilterMyEvents(false)}
                  className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {isAdmin && filterByUser !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                {selectedUserName}
                <button
                  onClick={() => setFilterByUser("all")}
                  className="ml-0.5 rounded-full hover:bg-purple-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* VUE CALENDRIER */}
      {viewMode === "calendar" && (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {/* Jours */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div
                key={d}
                className="border-r border-slate-200 py-4 text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500 last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className="grid grid-cols-7 gap-px bg-slate-200">
            {Array.from({ length: startingDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-37.5 bg-slate-50/60" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(
                currentDate.getMonth() + 1,
              ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              const dayEvents = eventsScope
                .map(normalizeEventStatus)
                .filter((e: CalendarEvent) => e.date === dateStr);

              const today = new Date();

              const isToday =
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setIsModalOpen(true);
                  }}
                  className="group relative flex min-h-37.5 flex-col gap-2 bg-white p-3 transition-all hover:bg-slate-50 cursor-pointer"
                >
                  {/* Header de la case */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-extrabold transition-all ${
                        isToday
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(day);

                        setNewEvent({
                          title: "",
                          clientId: "",
                          projectId: "",
                          time: "10:00",
                          type: "Réunion",
                          description: "",
                          location: "",
                          status: "en_cours",
                        });

                        setIsModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Events */}
                  <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
                    {dayEvents.map((ev: CalendarEvent) => {
                      const eventStyle =
                        EVENT_STYLES[ev.type as keyof typeof EVENT_STYLES];

                      if (!eventStyle) {
                        console.warn("Type inconnu :", ev.type, ev);
                        return null; // ou fallback UI
                      }
                      const EventIcon =
                        EVENT_STYLES[ev.type as keyof typeof EVENT_STYLES].icon;
                      const styleClass =
                        EVENT_STYLES[ev.type as keyof typeof EVENT_STYLES]
                          .color;
                      const statusStyle =
                        STATUS_STYLES[ev.status as keyof typeof STATUS_STYLES];
                      const dotClass =
                        EVENT_STYLES[ev.type as keyof typeof EVENT_STYLES].dot;

                      return (
                        <div
                          key={ev.id}
                          data-event-id={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventDetails(ev);
                          }}
                          className={`group/item relative rounded-2xl border p-2.5 text-[11px] font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${styleClass}`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClass}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-1.5">
                                <EventIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate font-bold">
                                  {ev.time}
                                </span>
                              </div>
                              <p className="truncate text-[11px] font-semibold">
                                {ev.title}
                              </p>
                              <div
                                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle.color}`}
                              >
                                {statusStyle.label}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setEventToDelete(ev);
                              if (typeof setIsDrawerOpen === "function")
                                setIsDrawerOpen(false);
                              setIsDeleteModalOpen(true);
                            }}
                            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/item:opacity-100"
                          >
                            <div className="rounded-full bg-white/80 p-1 hover:bg-white">
                              <X className="h-3 w-3" />
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VUE LISTE */}
      {viewMode === "list" && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {loadingEvents ? (
              <div className="p-24 text-center flex flex-col items-center justify-center">
                <div className="mb-4 h-12 w-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">
                  Chargement des événements...
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-24 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Aucun événement
                </h3>
                <p className="text-slate-500 mt-2">
                  Votre emploi du temps correspond à ces critères est vide.
                </p>
              </div>
            ) : (
              [...filteredEvents.map(normalizeEventStatus)]
                .sort((a, b) => {
                  const dateA = new Date(a.date || "").getTime();
                  const dateB = new Date(b.date || "").getTime();
                  if (dateB !== dateA) return dateB - dateA;
                  return (b.time || "").localeCompare(a.time || "");
                })
                .map((event: CalendarEvent) => {
                  const eventStyle =
                    EVENT_STYLES[event.type as keyof typeof EVENT_STYLES];

                  if (!eventStyle) {
                    console.warn("Type inconnu (liste) :", event.type, event);
                    return null; // ou fallback UI
                  }

                  const {
                    icon: EventIcon,
                    color: styleClass,
                    iconColor,
                  } = eventStyle;
                  const statusStyle =
                    STATUS_STYLES[event.status as keyof typeof STATUS_STYLES];
                  const eventDate = event.date || "";

                  return (
                    <div
                      key={event.id}
                      onClick={() => openEventDetails(event)}
                      className={`group relative flex flex-col md:flex-row md:items-center gap-30 p-8 transition-all hover:bg-slate-50/50 cursor-pointer border-l-4 ${styleClass.replace(
                        "bg-",
                        "border-l-",
                      )}`}
                    >
                      {/* BLOC GAUCHE : Icône et Heure */}
                      <div className="flex items-center gap-5 md:w-48 shrink-0">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${styleClass}`}
                        >
                          <EventIcon className={`h-7 w-7 ${iconColor}`} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                            {eventDate}
                          </div>
                          <div className="text-lg font-bold text-slate-900">
                            {event.time}
                          </div>
                        </div>
                      </div>

                      {/* BLOC CENTRAL : Titre, Statut et Détails */}
                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <h4 className="text-xl font-semibold text-slate-700 tracking-tight shrink-0">
                          {event.title}
                        </h4>

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border shrink-0 ${statusStyle.color}`}
                        >
                          {statusStyle.label}
                        </span>

                        <div className="hidden md:block h-5 w-px bg-slate-200 self-center"></div>

                        <div className="flex items-center gap-2 text-slate-600">
                          <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="font-semibold text-sm whitespace-nowrap">
                            {event.clientName}
                          </span>
                        </div>

                        {event.projectName && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                              <Briefcase className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="font-medium text-sm whitespace-nowrap">
                              {event.projectName}
                            </span>
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                              <MapPin className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm truncate max-w-[180px]">
                              {event.location}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* BLOC DROITE : Actions */}
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventToDelete(event);
                            setIsDeleteModalOpen(true);
                          }}
                          className="rounded-2xl bg-white border border-slate-200 p-3 text-slate-400 hover:text-red-600 hover:border-red-200 hover:shadow-md transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* MODALE AJOUT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Nouveau rendez-vous — ${selectedDay} ${monthName}`}
      >
        <form onSubmit={handleAddEvent} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              * Objet
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white"
                placeholder="Ex: Point d'étape projet"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              * Client associé
            </label>
            <select
              required
              value={newEvent.clientId}
              onChange={(e) =>
                setNewEvent({ ...newEvent, clientId: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">Sélectionner un client</option>
              {visibleClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Projet associé
            </label>
            <select
              value={newEvent.projectId}
              onChange={(e) => {
                const selectedProjectId = e.target.value;
                setNewEvent((prev) => ({
                  ...prev,
                  projectId: selectedProjectId,
                }));

                if (selectedProjectId) {
                  const project = projects.find(
                    (p) => String(p.id) === selectedProjectId,
                  );
                  if (project && project.clientId) {
                    setNewEvent((prev) => ({
                      ...prev,
                      projectId: selectedProjectId,
                      clientId: String(project.clientId),
                    }));
                  }
                }
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">Aucun projet</option>
              {visibleProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.client}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Description
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
              rows={3}
              placeholder="Ajoutez quelques détails..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                * Heure
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  required
                  value={newEvent.time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, time: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                * Canal
              </label>
              <div className="relative">
                {newEvent.type === "Appel" && (
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
                )}
                {newEvent.type === "Réunion" && (
                  <Video className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                )}
                {newEvent.type === "Présentiel" && (
                  <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                )}

                <select
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value as any })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Réunion">Visio / Réunion</option>
                  <option value="Appel">Appel téléphonique</option>

                  <option value="Présentiel">Présentiel</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  * Statut
                </label>
                <div className="relative">
                  {newEvent.status === "planifie" && (
                    <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  )}
                  {newEvent.status === "en_cours" && (
                    <History className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  )}
                  {newEvent.status === "termine" && (
                    <CheckCircle2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  )}
                  {newEvent.status === "annule" && (
                    <AlertCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                  )}

                  <select
                    value={newEvent.status}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Lieu
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, location: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white"
                placeholder="Ex: Google Meet, bureau client..."
              />
            </div>
          </div>

          <div className="text-sm text-blue-700 font-medium bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            Les champs précédés d’un <span className="font-bold">*</span> sont
            obligatoires.
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 hover:bg-black disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Planifier l'événement
            </button>
          </div>
        </form>
      </Modal>

      {/* MODALE DÉTAILS */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={
          isEditMode ? "Modifier le rendez-vous" : "Détails du rendez-vous"
        }
      >
        {selectedEvent && (
          <div className="space-y-5">
            {!isEditMode ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-2xl p-3 ${
                        EVENT_STYLES[selectedEvent.type].color
                      }`}
                    >
                      {React.createElement(
                        EVENT_STYLES[selectedEvent.type].icon,
                        {
                          className: "h-5 w-5",
                        },
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {selectedEvent.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {selectedEvent.type}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      STATUS_STYLES[selectedEvent.status].color
                    }`}
                  >
                    {STATUS_STYLES[selectedEvent.status].label}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Date
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {selectedEvent.date || "Non spécifiée"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Heure
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {selectedEvent.time}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Client
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {selectedEvent.clientName}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Lieu
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {selectedEvent.location || "Non spécifié"}
                    </p>
                  </div>
                </div>

                {selectedEvent.projectName && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Projet
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {selectedEvent.projectName}
                    </p>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Description
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {selectedEvent.createdBy && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Créé par
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {selectedEvent.createdBy.name}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={startEditEvent}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700"
                  >
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => {
                      if (selectedEvent) {
                        setEventToDelete(selectedEvent);
                      }

                      setIsDetailModalOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Objet
                  </label>
                  <input
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Client
                  </label>
                  <select
                    required
                    value={newEvent.clientId}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, clientId: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {visibleClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Projet
                  </label>
                  <select
                    value={newEvent.projectId}
                    onChange={(e) => {
                      const selectedProjectId = e.target.value;
                      const project = visibleProjects.find(
                        (p) => String(p.id) === selectedProjectId,
                      );

                      setNewEvent((prev) => ({
                        ...prev,
                        projectId: selectedProjectId,
                        clientId: project?.clientId
                          ? String(project.clientId)
                          : "",
                      }));
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Aucun projet</option>

                    {visibleProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newEvent.date || ""}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Heure
                    </label>
                    <input
                      type="time"
                      required
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Canal
                    </label>
                    <div className="relative">
                      {newEvent.type === "Appel" && (
                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
                      )}
                      {newEvent.type === "Réunion" && (
                        <Video className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                      )}
                      {newEvent.type === "Présentiel" && (
                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                      )}

                      <select
                        value={newEvent.type}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            type: e.target.value as any,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                      >
                        <option value="Réunion">Visio / Réunion</option>
                        <option value="Appel">Appel téléphonique</option>
                        <option value="Présentiel">Présentiel</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Statut
                    </label>
                    <div className="relative">
                      {newEvent.status === "planifie" && (
                        <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      )}
                      {newEvent.status === "en_cours" && (
                        <History className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                      )}
                      {newEvent.status === "termine" && (
                        <CheckCircle2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                      )}
                      {newEvent.status === "annule" && (
                        <AlertCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                      )}

                      <select
                        value={newEvent.status}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            status: e.target.value as any,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                      >
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-2xl bg-slate-200 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* CONFIRMATION SUPPRESSION */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">
              Confirmer la suppression
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tu es sur le point de supprimer l’événement{" "}
              <b>{eventToDelete?.title}</b>. Cette action est irréversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
