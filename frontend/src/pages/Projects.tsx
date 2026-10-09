import { useState, useMemo, useCallback } from "react";
import {
  useData,
  type Project,
  type CalendarEvent,
} from "../context/DataContext";
import {
  Briefcase,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  TrendingUp,
  Edit3,
  Eye,
  X,
  Trash2,
  Save,
  Loader2,
  BarChart3,
  Flag,
  Archive,
  Search,
  Filter,
  Download,
  Video,
  Phone,
  MapPin,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

// Configuration des statuts
const PROJECT_STATUS = {
  en_cours: {
    name: "En Cours",
    color: "bg-blue-500",
    light: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
  },
  en_attente: {
    name: "En Attente",
    color: "bg-yellow-500",
    light: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: AlertCircle,
  },
  termine: {
    name: "Terminé",
    color: "bg-green-500",
    light: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  archive: {
    name: "Archivé",
    color: "bg-gray-500",
    light: "bg-gray-50 text-gray-700 border-gray-200",
    icon: Archive,
  },
} as const;

// Configuration des priorités
const PRIORITY_CONFIG = {
  critique: {
    name: "Critique",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  haute: {
    name: "Haute",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  moyenne: {
    name: "Moyenne",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  basse: {
    name: "Basse",
    color: "bg-green-100 text-green-700 border-green-200",
  },
} as const;

const FILTERS = [
  { id: "tous", label: "Tous" },
  { id: "en_cours", label: "En Cours" },
  { id: "en_attente", label: "En Attente" },
  { id: "termine", label: "Terminés" },
] as const;

type FilterType = (typeof FILTERS)[number]["id"];

// Types pour la santé du projet
type ProjectHealth = "healthy" | "warning" | "critical" | "completed";

const Projects = () => {
  const { user } = useAuth();
  const {
    projects,
    loadingProjects,
    addProject,
    updateProject,
    deleteProject,
    updateProjectProgress,
    archiveProject,
    events,
    clients,
    deals,
  } = useData();

  const [filter, setFilter] = useState<FilterType>("tous");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // États pour les filtres avancés
  const [searchTerm, setSearchTerm] = useState("");
  const [budgetFilter, setBudgetFilter] = useState({ min: "", max: "" });
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [creationMode, setCreationMode] = useState<"manual" | "deal">("deal");
  const [selectedDealId, setSelectedDealId] = useState<string>("");

  const [unauthorizedOpen, setUnauthorizedOpen] = useState(false);

  // Filtres ownership
  const [filterMyProjects, setFilterMyProjects] = useState(false);
  const [filterByUser, setFilterByUser] = useState<number | "all">("all");
  const [showUserFilter, setShowUserFilter] = useState(false);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  const isOwner = (project: Project) => {
    if (!user) return false;
    if (isAdmin) return true;
    return project.createdBy?.id === user?.id;
  };

  // Tous les utilisateurs uniques extraits des projets (pour le filtre admin)
  const allUsers = useMemo(() => {
    const map = new Map<number, string>();
    projects.forEach((p) => {
      if (p.createdBy?.id && p.createdBy?.name) {
        map.set(p.createdBy.id, p.createdBy.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const selectedUserName =
    filterByUser === "all"
      ? "Tous les utilisateurs"
      : (allUsers.find((u) => u.id === filterByUser)?.name ?? "Utilisateur");

  const clientsScope = isAdmin
    ? clients
    : clients.filter((c) => c.createdBy?.id === user?.id);

  const dealsScope = isAdmin
    ? deals
    : deals.filter((d) => d.createdBy?.id === user?.id);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    client: "",
    description: "",
    status: "en_cours" as Project["status"],
    progress: 0,
    startDate: getTodayDate(),
    endDate: "",
    priority: "moyenne" as Project["priority"],
    budget: "",
    team: "",
  });

  // --- UTILITAIRES POUR LES RENDEZ-VOUS ---
  const getProjectEvents = useCallback(
    (projectTitle: string): CalendarEvent[] => {
      return events.filter(
        (event) =>
          event.projectName === projectTitle && event.status !== "annule",
      );
    },
    [events],
  );

  const getUpcomingEvents = useCallback(
    (projectTitle: string, limit: number = 3): CalendarEvent[] => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      return getProjectEvents(projectTitle)
        .filter((event) => event.date >= todayStr)
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        })
        .slice(0, limit);
    },
    [getProjectEvents],
  );

  const formatDateForEvent = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year:
          date.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });
    } catch {
      return dateString;
    }
  }, []);

  const getEventIcon = useCallback((type: string) => {
    switch (type) {
      case "Réunion":
        return Video;
      case "Appel":
        return Phone;
      case "Rendez-vous":
        return MapPin;
      default:
        return Calendar;
    }
  }, []);

  const navigateToAgendaWithProject = useCallback((projectTitle: string) => {
    sessionStorage.setItem("selectedProjectForAgenda", projectTitle);
    const currentUrl = window.location.origin;
    window.location.href = `${currentUrl}/agenda`;
  }, []);

  // --- LOGIQUE DE SANTÉ DES PROJETS ---
  const getProjectHealth = useCallback((project: Project): ProjectHealth => {
    if (project.status === "termine") return "completed";
    if (!project.endDate) return "healthy";

    const today = new Date();
    const endDate = new Date(project.endDate);
    const daysUntilEnd = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilEnd < 0) return "critical";
    if (daysUntilEnd <= 3) return "warning";
    return "healthy";
  }, []);

  const getHealthIndicator = useCallback((health: ProjectHealth) => {
    switch (health) {
      case "critical":
        return {
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: AlertCircle,
          label: "En retard",
        };
      case "warning":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          icon: Clock,
          label: "Urgent",
        };
      case "healthy":
        return {
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle2,
          label: "Normal",
        };
      case "completed":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          icon: CheckCircle2,
          label: "Terminé",
        };
    }
  }, []);

  const validateDateRange = useCallback(
    (startDate: string, endDate?: string): boolean => {
      if (!startDate) return false;
      if (!endDate) return true;
      const start = new Date(startDate);
      const end = new Date(endDate);
      return start <= end;
    },
    [],
  );

  const formatDateForDisplay = useCallback(
    (dateString: string | undefined): string => {
      if (!dateString) return "Non définie";
      try {
        return new Date(dateString).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        return "Date invalide";
      }
    },
    [],
  );

  const exportToCSV = useCallback(() => {
    setIsExporting(true);

    const headers = [
      "Titre",
      "Client",
      "Statut",
      "Priorité",
      "Progression",
      "Budget",
      "Date de début",
      "Date de fin",
      "Équipe",
    ];
    const csvContent = [
      headers.join(","),
      ...projects
        .filter((p) => p.status !== "archive")
        .map((project) =>
          [
            project.title,
            project.client,
            PROJECT_STATUS[project.status].name,
            PRIORITY_CONFIG[project.priority].name,
            `${project.progress}%`,
            project.budget || "",
            project.startDate,
            project.endDate || "",
            Array.isArray(project.team)
              ? project.team.join("; ")
              : project.team || "",
          ]
            .map((field) => `"${field}"`)
            .join(","),
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `projets_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 1000);
  }, [projects]);

  // --- FILTRAGE ---
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((p) => p.status !== "archive");

    if (filter !== "tous") {
      filtered = filtered.filter((p) => p.status === filter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.client.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower),
      );
    }

    if (budgetFilter.min || budgetFilter.max) {
      const minBudget = budgetFilter.min ? parseInt(budgetFilter.min) : 0;
      const maxBudget = budgetFilter.max
        ? parseInt(budgetFilter.max)
        : Infinity;
      filtered = filtered.filter((p) => {
        const budget = parseInt(p.budget?.replace(/[^0-9]/g, "") || "0");
        return budget >= minBudget && budget <= maxBudget;
      });
    }

    if (dateFilter.start) {
      filtered = filtered.filter((p) => p.startDate >= dateFilter.start);
    }
    if (dateFilter.end) {
      filtered = filtered.filter(
        (p) => !p.endDate || p.endDate <= dateFilter.end,
      );
    }

    if (teamFilter) {
      filtered = filtered.filter((p) => p.team?.includes(teamFilter));
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((p) => p.priority === priorityFilter);
    }

    // Filtre "Mes projets"
    if (filterMyProjects) {
      filtered = filtered.filter((p) => user && p.createdBy?.id === user.id);
    }

    // Filtre par utilisateur (admin seulement)
    if (isAdmin && filterByUser !== "all") {
      filtered = filtered.filter((p) => p.createdBy?.id === filterByUser);
    }

    return filtered.sort((a, b) => {
      const priorityOrder: Record<Project["priority"], number> = {
        critique: 0,
        haute: 1,
        moyenne: 2,
        basse: 3,
      };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [
    projects,
    filter,
    searchTerm,
    budgetFilter,
    dateFilter,
    teamFilter,
    priorityFilter,
    filterMyProjects,
    filterByUser,
    user,
    isAdmin,
  ]);

  // Statistiques

 // Pour les stats générales : tout ce que l'user voit, avec filtre "Mes projets" optionnel
const ownershipFilteredProjects = useMemo(() => {
  let base = projects.filter((p) => p.status !== "archive");

  if (isAdmin) {
    if (filterByUser !== "all") {
      base = base.filter((p) => p.createdBy?.id === filterByUser);
    }
    if (filterMyProjects) {
      base = base.filter((p) => p.createdBy?.id === user?.id);
    }
  } else {
    // User lambda voit tous les projets, sauf si "Mes projets" actif
    if (filterMyProjects) {
      base = base.filter((p) => p.createdBy?.id === user?.id);
    }
  }

  return base;
}, [projects, filterMyProjects, filterByUser, user, isAdmin]);

// Pour le revenu total : toujours uniquement les projets de l'user courant (ou filtre admin)
const myBudgetProjects = useMemo(() => {
  let base = projects.filter((p) => p.status !== "archive");

  if (isAdmin) {
    if (filterByUser !== "all") {
      base = base.filter((p) => p.createdBy?.id === filterByUser);
    } else if (filterMyProjects) {
      base = base.filter((p) => p.createdBy?.id === user?.id);
    }
    // Admin sans filtre → somme de tous
  } else {
    // User lambda → toujours seulement ses projets
    base = base.filter((p) => p.createdBy?.id === user?.id);
  }

  return base;
}, [projects, filterMyProjects, filterByUser, user, isAdmin]);

const stats = {
  total: ownershipFilteredProjects.length,
  enCours: ownershipFilteredProjects.filter((p) => p.status === "en_cours").length,
  enAttente: ownershipFilteredProjects.filter((p) => p.status === "en_attente").length,
  termines: ownershipFilteredProjects.filter((p) => p.status === "termine").length,
  avgProgress:
    ownershipFilteredProjects.length > 0
      ? Math.round(
          ownershipFilteredProjects.reduce((sum, p) => sum + p.progress, 0) /
            ownershipFilteredProjects.length,
        )
      : 0,
  totalBudget: myBudgetProjects.reduce((sum, p) => {
    const budget = parseInt(p.budget?.replace(/[^0-9]/g, "") || "0");
    return sum + (isNaN(budget) ? 0 : budget);
  }, 0),
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      alert("Veuillez remplir le titre du projet");
      return;
    }

    if (!validateDateRange(formData.startDate, formData.endDate)) {
      alert("La date de fin doit être postérieure à la date de début");
      return;
    }

    setIsSaving(true);

    await new Promise((res) => setTimeout(res, 600));

    const selectedClient = clients.find(
      (c) => c.id.toString() === formData.clientId.toString(),
    );
    let finalTitle = formData.title;

    if (creationMode === "deal") {
      const deal = deals.find((d: any) => d.id.toString() === selectedDealId);
      if (deal) finalTitle = deal.title;
    }

    const projectData: any = {
      ...formData,
      clientId: parseInt(formData.clientId),
      client_id: parseInt(formData.clientId),
      client: selectedClient ? selectedClient.name : "Projet interne Eray",
      deal_id: creationMode === "deal" ? parseInt(selectedDealId) : null,
      updatedAt: new Date().toISOString(),
    };

    const projectId = selectedProject?.id;

    try {
      if (isEditing && projectId !== undefined) {
        const updatedProject = { ...selectedProject, ...projectData };
        await updateProject(projectId, updatedProject);
        setIsEditing(false);
        setSelectedProject(null);
      } else {
        projectData.createdAt = new Date().toISOString();
        projectData.milestones = [];
        await addProject(projectData);
      }

      setIsModalOpen(false);
      setFormData({
        title: "",
        clientId: "",
        client: "",
        description: "",
        status: "en_cours",
        progress: 0,
        startDate: getTodayDate(),
        endDate: "",
        priority: "moyenne",
        budget: "",
        team: "",
      });
    } catch (error) {
      console.error("❌ ERREUR:", error);
      alert("Une erreur est survenue lors de la communication avec le serveur");
    } finally {
      setIsSaving(false);
    }
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(false);
    setCreationMode("manual");
    setSelectedDealId("");

    const idATester = project.clientId ?? project.client_id ?? "";

    setFormData({
      title: project.title,
      clientId: idATester.toString(),
      description: project.description || "",
      status: project.status,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate || "",
      priority: project.priority,
      budget: project.budget || "",
      team: Array.isArray(project.team)
        ? (project.team as string[]).join(", ")
        : (project.team as string) || "",
    } as any);

    setIsEditing(true);
    setIsModalOpen(true);
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setConfirmOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setProjectToDelete(null);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    await deleteProject(projectToDelete.id);
    setConfirmOpen(false);
    setProjectToDelete(null);
    setIsDetailModalOpen(false);
    setSelectedProject(null);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 100) return "Finalisé";
    if (progress >= 80) return "Presque terminé";
    if (progress >= 50) return "Bonne avancée";
    if (progress >= 25) return "En progression";
    return "Début";
  };

  return (
    <div className="space-y-8 text-left">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Briefcase className="h-4 w-4" />
              Gestion des projets
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Suivi des Projets
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
              Suivez l'avancement, les budgets, les équipes et les échéances de
              vos projets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-2xl border border-white/20 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-200 outline-none backdrop-blur transition-all focus:border-white/40 focus:bg-white/20"
              />
            </div>

            <button
              onClick={exportToCSV}
              disabled={isExporting || filteredProjects.length === 0}
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/20 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter CSV
            </button>

            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedProject(null);
                setCreationMode("deal");
                setFormData({
                  title: "",
                  clientId: "",
                  client: "",
                  description: "",
                  status: "en_cours",
                  progress: 0,
                  startDate: getTodayDate(),
                  endDate: "",
                  priority: "moyenne",
                  budget: "",
                  team: "",
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:scale-[1.02] hover:bg-blue-50 active:scale-95 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Nouveau Projet
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          {
            label: "Total Projets",
            value: stats.total,
            icon: BarChart3,
            textColor: "text-slate-800",
            iconWrap: "bg-blue-50 text-blue-600",
          },
          {
            label: "En Cours",
            value: stats.enCours,
            icon: Clock,
            textColor: "text-blue-600",
            iconWrap: "bg-blue-50 text-blue-600",
          },
          {
            label: "En Attente",
            value: stats.enAttente,
            icon: AlertCircle,
            textColor: "text-yellow-600",
            iconWrap: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Terminés",
            value: stats.termines,
            icon: CheckCircle2,
            textColor: "text-green-600",
            iconWrap: "bg-green-50 text-green-600",
          },
          {
            label: "Progression Moy.",
            value: `${stats.avgProgress}%`,
            icon: TrendingUp,
            textColor: "text-purple-600",
            iconWrap: "bg-purple-50 text-purple-600",
          },
          {
            label: "Revenu Total",
            value: stats.totalBudget.toLocaleString("fr-FR") + " Ar",
            icon: DollarSign,
            textColor: "text-emerald-600",
            iconWrap: "bg-emerald-50 text-emerald-600",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {item.label}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${item.textColor}`}>
                    {item.value}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconWrap} transition group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTRES STATUT + AVANCÉS + OWNERSHIP */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Statuts */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const count =
                item.id === "tous"
                  ? stats.total
                  : item.id === "en_cours"
                    ? stats.enCours
                    : item.id === "en_attente"
                      ? stats.enAttente
                      : stats.termines;

              return (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    filter === item.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${filter === item.id ? "bg-white/20 text-white" : "bg-white text-gray-500"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contrôles droits : Mes projets, Utilisateurs, Filtres avancés */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Bouton "Mes projets" (Admin seulement) */}

            <button
              onClick={() => {
                setFilterMyProjects(!filterMyProjects);
                if (!filterMyProjects && isAdmin) setFilterByUser("all");
              }}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                filterMyProjects
                  ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Mes projets
            </button>

            {/* Filtre par utilisateur — admin seulement */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowUserFilter(!showUserFilter)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    filterByUser !== "all"
                      ? "border-purple-400 bg-purple-50 text-purple-700"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="max-w-[140px] truncate">
                    {selectedUserName}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>

                {showUserFilter && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl">
                    <button
                      onClick={() => {
                        setFilterByUser("all");
                        setFilterMyProjects(false);
                        setShowUserFilter(false);
                      }}
                      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 ${filterByUser === "all" ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}
                    >
                      Tous les utilisateurs
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setFilterByUser(u.id);
                          setFilterMyProjects(false);
                          setShowUserFilter(false);
                        }}
                        className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 ${filterByUser === u.id ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-700"}`}
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
                      <p className="px-4 py-3 text-xs text-gray-400">
                        Aucun utilisateur trouvé
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bouton Filtres avancés */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100"
            >
              <Filter className="h-4 w-4" />
              Filtres avancés
              <span
                className={`ml-1 text-xs ${showAdvancedFilters ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
          </div>
        </div>

        {/* Panneau Filtres avancés */}
        {showAdvancedFilters && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Priorité
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                >
                  <option value="all">Toutes les priorités</option>
                  {Object.entries(PRIORITY_CONFIG).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Budget (Ar)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={budgetFilter.min}
                    onChange={(e) =>
                      setBudgetFilter({ ...budgetFilter, min: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={budgetFilter.max}
                    onChange={(e) =>
                      setBudgetFilter({ ...budgetFilter, max: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Période
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) =>
                      setDateFilter({ ...dateFilter, start: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) =>
                      setDateFilter({ ...dateFilter, end: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => {
                    setBudgetFilter({ min: "", max: "" });
                    setDateFilter({ start: "", end: "" });
                    setPriorityFilter("all");
                    setSearchTerm("");
                  }}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicateurs filtres actifs & Compteur */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          {(filterMyProjects || filterByUser !== "all") && (
            <>
              <span className="text-xs font-medium text-gray-500">
                Filtres actifs :
              </span>
              {filterMyProjects && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Mes projets
                  <button
                    onClick={() => setFilterMyProjects(false)}
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
            </>
          )}
        </div>
      </div>

      {/* GRILLE DES PROJETS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const StatusIcon = PROJECT_STATUS[project.status].icon;
          const health = getProjectHealth(project);
          const healthConfig = getHealthIndicator(health);
          const HealthIcon = healthConfig.icon;

          return (
            <div
              key={project.id}
              data-project-id={project.id}
              data-project-detail={project.id}
              onClick={() => openProjectDetails(project)}
              className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500" />

              {/* Header */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${PROJECT_STATUS[project.status].light}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {PROJECT_STATUS[project.status].name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${PRIORITY_CONFIG[project.priority].color}`}
                    >
                      <Flag className="h-3 w-3" />
                      {PRIORITY_CONFIG[project.priority].name}
                    </span>
                  </div>
                  <h3 className="truncate text-xl font-bold text-gray-800">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {project.client === "Client inconnu"
                      ? "Projet interne Eray"
                      : project.client}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOwner(project)) {
                        setUnauthorizedOpen(true);
                        return;
                      }
                      openEditModal(project);
                    }}
                    className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-blue-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOwner(project)) {
                        setUnauthorizedOpen(true);
                        return;
                      }
                      confirmDelete(project);
                    }}
                    className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="mb-5 line-clamp-3 text-sm leading-6 text-gray-600">
                {project.description ||
                  "Aucune description fournie pour ce projet."}
              </p>

              {/* Progression */}
              <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Progression
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-600">
                      {getProgressLabel(project.progress)}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-gray-800">
                    {project.progress}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Infos dates */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Début
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatDateForDisplay(project.startDate)}
                  </p>
                </div>
                <div
                  className={`rounded-2xl border p-3 ${healthConfig.bgColor} ${healthConfig.borderColor}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <HealthIcon className={`h-4 w-4 ${healthConfig.color}`} />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${healthConfig.color}`}
                    >
                      Fin
                    </span>
                  </div>
                  <p className={`text-sm font-semibold ${healthConfig.color}`}>
                    {formatDateForDisplay(project.endDate)}
                  </p>
                  {(health === "warning" || health === "critical") && (
                    <p
                      className={`mt-1 text-[10px] font-medium ${healthConfig.color}`}
                    >
                      {healthConfig.label}
                    </p>
                  )}
                </div>
              </div>

              {/* Budget + Team */}
              {/* Budget + Team */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                {isOwner(project) && (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                    <DollarSign className="h-4 w-4" />
                    {project.budget || "Budget non défini"}
                  </div>
                )}
                {project.team && (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{project.team}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openProjectDetails(project);
                  }}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Voir détails
                </button>
                {project.status !== "termine" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateProjectProgress(
                        project.id,
                        Math.min(100, project.progress + 10),
                      );
                    }}
                    className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700"
                  >
                    +10%
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LOADING + EMPTY STATE */}
      {loadingProjects ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center mt-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">
            Chargement des projets...
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Veuillez patienter pendant la récupération des données.
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center mt-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Briefcase className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">
            Aucun projet trouvé
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Aucun projet ne correspond au filtre sélectionné.
          </p>
        </div>
      ) : null}

      {/* MODALE D'AJOUT/ÉDITION */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Modifier le projet" : "Nouveau projet"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Mode de création
            </label>
            <select
              value={creationMode}
              onChange={(e) => {
                setCreationMode(e.target.value as "manual" | "deal");
                setSelectedDealId("");
                setFormData((prev) => ({ ...prev, title: "" }));
              }}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
            >
              <option value="manual">Projet manuel</option>
              <option value="deal">Depuis un deal</option>
            </select>
          </div>

          {creationMode === "deal" && (
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Sélectionner un deal
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedDealId(id);
                  const deal = deals.find((d: any) => d.id.toString() === id);
                  if (deal) {
                    setFormData((prev) => ({
                      ...prev,
                      title: deal.title,
                      clientId: deal.client_id?.toString() || "",
                      client: deal.client || prev.client,
                    }));
                  }
                }}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              >
                <option value="">Choisir un deal</option>
                {dealsScope.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.title || d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              * Titre du projet
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              placeholder="Ex: Refonte Site E-commerce"
            />
          </div>

          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Client
            </label>
            <select
              value={formData.clientId.toString()}
              onChange={(e) => {
                const id = e.target.value;
                const name =
                  clients.find((c) => c.id.toString() === id)?.name || "";
                setFormData({ ...formData, clientId: id, client: name });
              }}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="">Sélectionner un client</option>
              {clientsScope.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              rows={4}
              placeholder="Description détaillée du projet..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                * Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Project["status"],
                  })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {Object.entries(PROJECT_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                * Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Project["priority"],
                  })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                * Date de début
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Date de fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Budget (Ar)
              </label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                placeholder="Ex: 15 000"
              />
            </div>
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Progression (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: Number(e.target.value) || 0,
                  })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Équipe
            </label>
            <input
              type="text"
              value={formData.team}
              onChange={(e) =>
                setFormData({ ...formData, team: e.target.value })
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              placeholder="les gens qui vont travailler dessus"
            />
          </div>

          <div className="text-sm text-blue-700 font-medium bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            Les champs précédés d'un <span className="font-bold">*</span> sont
            obligatoires.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-bold text-gray-500 transition hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODALE DE DÉTAILS */}
      {selectedProject && isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="flex h-full max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">
                    Détails Projet
                  </span>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-full p-2 transition hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="rounded-3xl bg-linear-to-br from-blue-600 to-indigo-600 p-5 text-white">
                <h3 className="text-2xl font-bold">{selectedProject.title}</h3>
                <p className="mt-1 text-sm text-blue-100">
                  {!selectedProject.client ||
                  selectedProject.client === "Client inconnu"
                    ? "Projet interne Eray"
                    : selectedProject.client}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase text-white ${PROJECT_STATUS[selectedProject.status].color}`}
                  >
                    {PROJECT_STATUS[selectedProject.status].name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${PRIORITY_CONFIG[selectedProject.priority].color}`}
                  >
                    <Flag className="h-3 w-3" />
                    {PRIORITY_CONFIG[selectedProject.priority].name}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Description
                </h4>
                <p className="text-sm leading-7 text-blue-900">
                  {selectedProject.description ||
                    "Aucune description disponible."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Début
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatDateForDisplay(selectedProject.startDate)}
                  </p>
                </div>
                <div
                  className={`rounded-3xl border p-4 ${(() => {
                    const h = getProjectHealth(selectedProject);
                    const hc = getHealthIndicator(h);
                    return `${hc.bgColor} ${hc.borderColor}`;
                  })()}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {(() => {
                      const h = getProjectHealth(selectedProject);
                      const hc = getHealthIndicator(h);
                      const HIcon = hc.icon;
                      return (
                        <>
                          <HIcon className={`h-4 w-4 ${hc.color}`} />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${hc.color}`}
                          >
                            Fin
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <p
                    className={`text-sm font-semibold ${(() => {
                      const h = getProjectHealth(selectedProject);
                      return getHealthIndicator(h).color;
                    })()}`}
                  >
                    {formatDateForDisplay(selectedProject.endDate)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {selectedProject.budget && isOwner(selectedProject) && (
                  <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-green-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Budget
                      </span>
                    </div>
                    <p className="text-lg font-bold text-green-800">
                      {selectedProject.budget}
                    </p>
                  </div>
                )}
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Progression
                    </p>
                    <span className="text-xl font-bold text-gray-800">
                      {selectedProject.progress}%
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(selectedProject.progress)}`}
                      style={{ width: `${selectedProject.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {selectedProject.team && (
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-gray-400">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Équipe
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-6">
                    {selectedProject.team}
                  </p>
                </div>
              )}

              {selectedProject.createdBy && (
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-gray-400">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Créé par
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                      {selectedProject.createdBy.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {selectedProject.createdBy.name}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Rendez-vous
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      navigateToAgendaWithProject(selectedProject.title)
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Planifier
                  </button>
                </div>
                {(() => {
                  const upcomingEvents = getUpcomingEvents(
                    selectedProject.title,
                    3,
                  );
                  if (upcomingEvents.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-xs text-purple-500">
                          Aucun rendez-vous à venir
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {upcomingEvents.map((event) => {
                        const EventIcon = getEventIcon(event.type);
                        return (
                          <div
                            key={event.id}
                            className="flex items-start gap-3 rounded-2xl border border-purple-200 bg-white p-3"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                              <EventIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="truncate text-sm font-semibold text-gray-800">
                                {event.title}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {formatDateForEvent(event.date)} - {event.time}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
                {isOwner(selectedProject) ? (
                  <>
                    <button
                      onClick={() => openEditModal(selectedProject)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Edit3 className="h-4 w-4" /> Éditer
                    </button>
                    <button
                      onClick={() => confirmDelete(selectedProject)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </button>
                  </>
                ) : (
                  <div className="col-span-2 rounded-2xl bg-gray-50 border border-gray-200 py-3.5 text-center text-sm text-gray-500">
                    Vous n'êtes pas autorisé à modifier ce projet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">
              Supprimer ce projet ?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tu es sur le point de supprimer le projet{" "}
              <b>{projectToDelete.title}</b>. Cette action est irréversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {unauthorizedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 mx-auto">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-center text-lg font-bold text-gray-800">
              Action non autorisée
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Vous ne pouvez modifier ou supprimer que les projets que vous avez
              créés.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setUnauthorizedOpen(false)}
                className="rounded-xl bg-gray-100 px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const handlePipelineToProject = async (dealId: number) => {
  console.log(`Transformation du deal ${dealId} en projet - à implémenter`);
};

export default Projects;
