import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData, type Project, type Client } from "../context/DataContext";
import {
  Archive,
  BarChart3,
  DollarSign,
  CheckCircle2,
  Clock,
  Award,
  Download,
  Eye,
  X,
  Calendar,
  Target,
  Users,
  FileText,
  User,
  Flag,
  AlertCircle,
  Trash2,
  Sparkles,
  TrendingUp,
  Layers3,
  CalendarDays,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

// =========================
// TYPES
// =========================
type ProjectStatusFilter = "tous" | "termine" | "archive";
type ProfitabilityFilter = "tous" | "rentable" | "non_rentable" | "en_attente";

type ClientStat = {
  name: string;
  totalProjects: number;
  completedProjects: number;
  totalRevenue: number;
  avgProgress: number;
};

type MonthlyStat = {
  total: number;
  completed: number;
};

// =========================
// CONFIGURATION
// =========================
const PROJECT_STATUS = {
  en_cours: { name: "En Cours", color: "bg-blue-500", icon: Clock },
  en_attente: { name: "En Attente", color: "bg-yellow-500", icon: AlertCircle },
  termine: { name: "Terminé", color: "bg-green-500", icon: CheckCircle2 },
  archive: { name: "Archivé", color: "bg-violet-500", icon: Archive },
} as const;

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

// =========================
// HELPERS
// =========================
const parseBudget = (budget?: string) => {
  if (!budget) return 0;
  return parseInt(budget.replace(/[^0-9]/g, ""), 10) || 0;
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("fr-FR");
};

const calculateDurationInDays = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "bg-emerald-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 25) return "bg-amber-500";
  return "bg-rose-500";
};

const getProjectProfitabilityStatus = ():
  | "rentable"
  | "non_rentable"
  | "en_attente" => {
  // Simulation de calcul ROI - à remplacer avec la vraie fonction
  const roi = 0.8; // Valeur par défaut
  if (roi >= 1.0) return "rentable";
  if (roi > 0 && roi < 1.0) return "non_rentable";
  return "en_attente";
};

const Archives = () => {
  const { user } = useAuth();
  const { projects, deleteProject, events, clients, deals, updateProject } =
    useData();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  const visibleProjects = useMemo(
    () =>
      isAdmin ? projects : projects.filter((p) => p.createdBy?.id === user?.id),
    [projects, user, isAdmin],
  );

  const visibleEvents = useMemo(
    () =>
      isAdmin ? events : events.filter((e) => e.createdBy?.id === user?.id),
    [events, user, isAdmin],
  );

  const visibleClients = useMemo(
    () =>
      isAdmin ? clients : clients.filter((c) => c.createdBy?.id === user?.id),
    [clients, user, isAdmin],
  );

  const visibleDeals = useMemo(
    () => (isAdmin ? deals : deals.filter((d) => d.createdBy?.id === user?.id)),
    [deals, user, isAdmin],
  );

  const [searchTerm] = useState("");
  const [statusFilter] = useState<ProjectStatusFilter>("tous");
  const [profitabilityFilter] = useState<ProfitabilityFilter>("tous");
  const [archiveType] = useState<"projects" | "events" | "clients">("projects");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [isTableOpen, setIsTableOpen] = useState(false);

  // =========================
  // DATA FILTRÉE
  // =========================

  const allProjects = useMemo(
    () => visibleProjects.filter((p) => p.status === "archive"),
    [visibleProjects],
  );

  const pastEvents = useMemo(
    () =>
      visibleEvents.filter(
        (e) => e.status === "termine" || e.status === "annule",
      ),
    [visibleEvents],
  );

  const oldClients = useMemo(
    () =>
      visibleClients.filter(
        (c) => c.status === "Ancien" || c.status === "Inactif",
      ),
    [visibleClients],
  );

  const filteredProjects = useMemo(() => {
    if (archiveType !== "projects") return [];
    return allProjects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "tous" || project.status === statusFilter;

      const matchesProfitability =
        profitabilityFilter === "tous" ||
        getProjectProfitabilityStatus() === profitabilityFilter;

      return matchesSearch && matchesStatus && matchesProfitability;
    });
  }, [allProjects, searchTerm, statusFilter, profitabilityFilter, archiveType]);

  // =========================
  // STATS CLIENTS
  // =========================

  const isClosedProject = (project: Project) =>
    project.status === "termine" || project.status === "archive";

  const clientStats = useMemo(() => {
    const stats: Record<string, ClientStat> = {};

    visibleProjects.forEach((project) => {
      if (!stats[project.client]) {
        stats[project.client] = {
          name: project.client,
          totalProjects: 0,
          completedProjects: 0,
          totalRevenue: 0,
          avgProgress: 0,
        };
      }

      stats[project.client].totalProjects++;

      if (isClosedProject(project)) {
        stats[project.client].completedProjects++;
        stats[project.client].totalRevenue += parseBudget(project.budget);
      }
    });

    Object.keys(stats).forEach((clientName) => {
      const clientProjects = visibleProjects.filter(
        (p) => p.client === clientName && isClosedProject(p),
      );

      const avgProgress =
        clientProjects.length > 0
          ? Math.round(
              clientProjects.reduce((sum, p) => sum + p.progress, 0) /
                clientProjects.length,
            )
          : 0;

      stats[clientName].avgProgress = avgProgress;
    });

    return stats;
  }, [visibleProjects]);

  const topPerformers = useMemo(() => {
    return Object.values(clientStats)
      .filter((client) => client.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [clientStats]);

  // =========================
  // STATS MENSUELLES
  // =========================
  const monthlyStats = useMemo(() => {
    const stats: Record<string, MonthlyStat> = {};

    visibleProjects.forEach((project) => {
      const dateString =
        project.status === "termine" ? project.endDate : project.startDate;

      if (!dateString) return;

      const parsedDate = new Date(dateString);
      if (Number.isNaN(parsedDate.getTime())) return;

      const monthLabel = parsedDate.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
      });

      if (!stats[monthLabel]) {
        stats[monthLabel] = { total: 0, completed: 0 };
      }

      stats[monthLabel].total++;

      if (project.status === "termine") {
        stats[monthLabel].completed++;
      }
    });

    return Object.fromEntries(
      Object.entries(stats).sort((a, b) => {
        return new Date(a[0]).getTime() - new Date(b[0]).getTime();
      }),
    );
  }, [visibleProjects]);

  const clientEvents = useMemo(
    () =>
      selectedClient
        ? visibleEvents.filter((event) => event.clientId === selectedClient.id)
        : [],
    [selectedClient, visibleEvents],
  );

  const clientProjects = useMemo(
    () =>
      selectedClient
        ? visibleProjects.filter(
            (project) => project.clientId === selectedClient.id,
          )
        : [],
    [selectedClient, visibleProjects],
  );

  const clientDeals = useMemo(
    () =>
      selectedClient
        ? visibleDeals.filter(
            (deal) =>
              deal.client_id === selectedClient.id ||
              deal.client === selectedClient.name,
          )
        : [],
    [selectedClient, visibleDeals],
  );

  const pipelineStatus = useMemo(() => {
    if (!clientDeals.length) return "Aucun pipeline actif";

    const stageRanking: Record<string, number> = {
      lead: 0,
      contact: 1,
      proposal: 2,
      won: 3,
      lost: 4,
    };

    const sortedDeals = [...clientDeals].sort(
      (a, b) =>
        stageRanking[b.stage] - stageRanking[a.stage] ||
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const current = sortedDeals[0];
    if (current.stage === "won") return "Gagné";
    if (current.stage === "lost") return "Perdu";
    if (current.stage === "proposal") return "Proposition";
    if (current.stage === "contact") return "Contact";
    return "Lead";
  }, [clientDeals]);

  // =========================
  // ACTIONS
  // =========================
  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const closeProjectDetails = () => {
    setSelectedProject(null);
    setIsDetailModalOpen(false);
  };

  const confirmDeleteProject = (projectId: number, title: string) => {
    setPendingDelete({ id: projectId, title });
    setConfirmDeleteOpen(true);
  };

  const exportClientData = () => {
    if (!selectedClient) return;

    const dataToExport = {
      clientInfo: selectedClient,
      pipelineStatus,
      rendezVous: clientEvents,
      projets: clientProjects,
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");

    const fileName = selectedClient.name.replace(/\s+/g, "-").toLowerCase();

    link.href = url;
    link.download = `fiche-client-${fileName}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Fiche client exportée avec succès !");
  };

  return (
    <div className="space-y-8 text-left">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-linear-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Historique & Analyse des projets
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-800">
              Archives & Historique
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base font-medium">
              Explorez vos archives pour analyser vos relations clients passées,
              mesurer vos taux de réussite mensuels et consulter l'historique de
              vos projets terminés.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-100 p-3 shadow-inner">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
                  Analyse Client
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Fiche & Historique Client
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  Sélectionnez un client pour obtenir une vue d'ensemble de son
                  parcours : rendez-vous passés, statut actuel du pipeline et
                  projets archivés associés.
                </p>
              </div>
            </div>

            <div className="w-full sm:max-w-xs">
              <label
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                htmlFor="client-select"
              >
                Sélection du client
              </label>
              <div className="relative">
                <select
                  id="client-select"
                  value={selectedClient?.id ?? ""}
                  onChange={(event) => {
                    const clientId = Number(event.target.value);
                    const client =
                      visibleClients.find((c) => c.id === clientId) || null;
                    setSelectedClient(client);
                  }}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">-- Choisir un client --</option>
                  {visibleClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}{" "}
                      {client.company ? `— ${client.company}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {selectedClient ? (
          <div className="p-6 sm:p-8">
            {/* Header d'actions pour le client sélectionné */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Détails de {selectedClient.name}
                </h3>
                {selectedClient.company && (
                  <p className="text-sm font-medium text-slate-500">
                    Entreprise : {selectedClient.company}
                  </p>
                )}
              </div>
              <button
                onClick={exportClientData}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98] sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Exporter fiche client
              </button>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {/* Carte Rendez-vous */}
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-blue-100 bg-blue-50/50 p-5 transition-colors hover:bg-blue-50">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-600">
                    Rendez-vous
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {clientEvents.length}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100/80">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Carte Pipeline */}
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-orange-100 bg-orange-50/50 p-5 transition-colors hover:bg-orange-50">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-orange-600">
                    Statut pipeline
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900 line-clamp-1">
                    {pipelineStatus}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100/80">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>

              {/* Carte Projets */}
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 transition-colors hover:bg-emerald-50">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">
                    Projets associés
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {clientProjects.length}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100/80">
                  <Briefcase className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Historique Rendez-vous
                  </h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {clientEvents.length}
                  </span>
                </div>

                {clientEvents.length > 0 ? (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {clientEvents.map((event) => (
                      <div
                        key={event.id}
                        className="group flex flex-col justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {event.title}
                          </p>
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                            {formatDate(event.date)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-block rounded-md bg-slate-200/50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                            {event.type || "Événement"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                    <Calendar className="mb-2 h-6 w-6 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                      Aucun rendez-vous
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Projets Associés
                  </h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {clientProjects.length}
                  </span>
                </div>

                {clientProjects.length > 0 ? (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {clientProjects.map((project) => (
                      <div
                        key={project.id}
                        className="group flex flex-col justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {project.title}
                          </p>
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
                            {project.progress}%
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white ${PROJECT_STATUS[project.status].color}`}
                          >
                            {PROJECT_STATUS[project.status].name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                    <Briefcase className="mb-2 h-6 w-6 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                      Aucun projet trouvé
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <User className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-base font-medium text-slate-500">
              Sélectionnez un client ci-dessus pour afficher ses informations
              détaillées.
            </p>
          </div>
        )}
      </div>

      {/* TABLEAU ACCORDÉON PROJETS ARCHIVÉS (Placé juste en dessous) */}
      <div
        className={`overflow-hidden rounded-3xl border bg-white transition-all duration-300 ${
          isTableOpen
            ? "border-violet-200 shadow-lg shadow-violet-100/50"
            : "border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md hover:shadow-violet-100"
        }`}
      >
        <button
          onClick={() => setIsTableOpen(!isTableOpen)}
          className={`group flex w-full flex-col gap-4 p-6 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${
            isTableOpen ? "bg-violet-50/50" : "bg-white hover:bg-violet-50/30"
          }`}
        >
          <div className="flex items-center gap-5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
                isTableOpen
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "bg-violet-100 text-violet-600"
              }`}
            >
              <Archive className="h-6 w-6" />
            </div>
            <div>
              <h3
                className={`text-xl font-bold transition-colors ${isTableOpen ? "text-violet-900" : "text-slate-900 group-hover:text-violet-800"}`}
              >
                Projets Archivés
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {filteredProjects.length} projet(s) archivé(s) au total
              </p>
              {!isTableOpen && (
                <p className="mt-1 hidden text-base italic text-slate-400 sm:block">
                  Cliquez pour dérouler et consulter l'historique complet des
                  projets clôturés.
                </p>
              )}
            </div>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 self-start items-center justify-center rounded-full transition-all duration-300 sm:self-center ${
              isTableOpen
                ? "rotate-180 bg-white text-violet-600 shadow-sm"
                : "bg-slate-50 text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-600"
            }`}
          >
            <ChevronDown className="h-5 w-5" />
          </div>
        </button>

        {isTableOpen && (
          <div className="border-t border-violet-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/70">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Projet
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Progression
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Budget
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="group transition-colors hover:bg-violet-50/40"
                    >
                      <td className="px-6 py-5">
                        <div className="max-w-65">
                          <p className="font-semibold text-slate-800">
                            {project.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {project.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">
                        {project.client}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-xl bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                          {PROJECT_STATUS[project.status].name}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-2.5 rounded-full transition-all ${getProgressColor(project.progress)}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {project.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-800">
                        {project.budget || "N/A"}
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Début: {formatDate(project.startDate)}</span>
                          </div>
                          {project.endDate && (
                            <div className="flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5" />
                              <span>Fin: {formatDate(project.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openProjectDetails(project)}
                            className="rounded-xl bg-blue-50 p-2 text-blue-600 transition-all hover:scale-105 hover:bg-blue-100"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              confirmDeleteProject(project.id, project.title)
                            }
                            className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-all hover:scale-105 hover:bg-rose-100"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProjects.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
                  <Archive className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">
                  Aucun projet archivé
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  Aucun projet n'a encore été archivé.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BLOCS ANALYTIQUES */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* TOP CLIENTS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Award className="h-3.5 w-3.5" />
                Meilleurs clients
              </div>
              <h3 className="text-xl font-bold text-slate-900">Top Clients</h3>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <Users className="h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div className="space-y-3">
            {topPerformers.map((client, index) => (
              <div
                key={client.name}
                className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {client.completedProjects} projets clôturés
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {client.totalRevenue.toLocaleString()}Ar
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {client.avgProgress}% moy. clôturés
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE MENSUELLE */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <BarChart3 className="h-3.5 w-3.5" />
                Taux de réussite
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Performance Mensuelle
              </h3>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <Layers3 className="h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div className="space-y-5">
            {Object.entries(monthlyStats).map(([month, stats]) => {
              const completionPercentage =
                stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0;

              return (
                <div key={month} className="group space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {month}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-slate-400">
                        {stats.completed} / {stats.total} projet(s)
                      </span>
                      <span className="font-bold text-blue-600">
                        {completionPercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-linear-to-r from-blue-500 to-cyan-400 transition-all duration-700 ease-out"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(monthlyStats).length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">
                Aucune donnée pour générer les statistiques.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODALE DÉTAILS */}
      {selectedProject && isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-600">
                  <div className="rounded-2xl bg-blue-50 p-2.5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Détails Projet
                    </p>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Vue complète
                    </h4>
                  </div>
                </div>

                <button
                  onClick={closeProjectDetails}
                  className="rounded-full p-2 transition-colors hover:bg-slate-100"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* HEADER MODALE */}
              <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 to-blue-50 p-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
                      {selectedProject.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-blue-600">
                      {selectedProject.client}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase text-white ${
                        PROJECT_STATUS[selectedProject.status].color
                      }`}
                    >
                      {PROJECT_STATUS[selectedProject.status].name}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] font-semibold ${
                        PRIORITY_CONFIG[selectedProject.priority].color
                      }`}
                    >
                      <Flag className="mr-1 h-3 w-3" />
                      {PRIORITY_CONFIG[selectedProject.priority].name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Description
                </h4>
                <p className="text-sm leading-7 text-slate-700">
                  {selectedProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Début
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(selectedProject.startDate)}
                  </p>
                </div>

                {selectedProject.endDate && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Fin
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(selectedProject.endDate)}
                    </p>
                  </div>
                )}
              </div>

              {selectedProject.budget && (
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Budget
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-800">
                    {selectedProject.budget}
                  </p>
                </div>
              )}

              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Progression
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedProject.progress}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-3 rounded-full transition-all ${getProgressColor(
                      selectedProject.progress,
                    )}`}
                    style={{ width: `${selectedProject.progress}%` }}
                  />
                </div>
              </div>

              {Array.isArray(selectedProject.team) &&
                selectedProject.team.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Équipe
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedProject.team.map((member, index) => (
                        <div
                          key={`${member}-${index}`}
                          className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800"
                        >
                          <User className="h-3.5 w-3.5" />
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Durée
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {calculateDurationInDays(
                    selectedProject.startDate,
                    selectedProject.endDate,
                  ) !== null
                    ? `${calculateDurationInDays(
                        selectedProject.startDate,
                        selectedProject.endDate,
                      )} jours`
                    : "N/A"}
                </p>
              </div>

              {/* ACTIONS MODALE */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={async () => {
                    if (!selectedProject) return;
                    await updateProject(selectedProject.id, {
                      ...selectedProject,
                      status: "en_cours",
                    });
                    closeProjectDetails();
                    toast.success("Projet restauré avec succès !");
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Restaurer
                </button>
                <button
                  onClick={() => {
                    if (!selectedProject) return;
                    setPendingDelete({
                      id: selectedProject.id,
                      title: selectedProject.title,
                    });
                    setConfirmDeleteOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3.5 text-sm font-bold text-rose-700 transition-all hover:-translate-y-0.5 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CONFIRM SUPPRESSION */}
      {confirmDeleteOpen && pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Suppression définitive
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Êtes-vous sûr de vouloir supprimer définitivement le projet{" "}
              <b className="text-slate-700">{pendingDelete.title}</b> ? Cette
              action est irréversible.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Annuler
              </button>

              <button
                onClick={() => {
                  deleteProject(pendingDelete.id);
                  setConfirmDeleteOpen(false);
                  toast.error("Projet supprimé définitivement.");
                }}
                className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archives;
