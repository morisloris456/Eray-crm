import { useMemo, useState, useCallback } from "react";
import {
  Users,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import DashboardGrid from "../components/DashboardGrid";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "week" | "month" | "year";
type ViewMode = "overview" | "detailed" | "analytics";

const parseAmount = (amount: unknown) => {
  if (amount == null) return 0;

  const str = typeof amount === "number" ? String(amount) : amount;
  return parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { clients, deals, projects } = useData();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [showCharts, setShowCharts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");

  const displayClients = useMemo(() => {
    if (isAdmin) return clients;
    return clients.filter((c) => c.createdBy?.id === user?.id);
  }, [clients, user, isAdmin]);

  const displayDeals = useMemo(() => {
    if (isAdmin) return deals;
    return deals.filter(
      (d) => d.createdBy?.id === user?.id || d.assignedTo === user?.name,
    );
  }, [deals, user, isAdmin]);

  const displayProjects = useMemo(() => {
    if (isAdmin) return projects;
    return projects.filter((p) => p.createdBy?.id === user?.id);
  }, [projects, user, isAdmin]);

  const handleRefreshData = useCallback(async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleExportData = useCallback(() => {
    const exportStats = {
      clients: {
        total: displayClients.length,
        active: displayClients.filter((c) => c.status === "Actif").length,
        newThisMonth: displayClients.filter((c) => {
          const createdAt = new Date(c.createdAt);
          const now = new Date();
          return (
            createdAt.getMonth() === now.getMonth() &&
            createdAt.getFullYear() === now.getFullYear()
          );
        }).length,
      },
      deals: {
        total: displayDeals.length,
        active: displayDeals.filter(
          (d) => d.stage !== "won" && d.stage !== "lost",
        ).length,
        won: displayDeals.filter((d) => d.stage === "won").length,
        revenue: displayDeals
          .filter((d) => d.stage === "won")
          .reduce((sum, deal) => {
            return sum + parseAmount(deal.amount);
          }, 0),
      },
      projects: {
        total: displayProjects.length,
        active: displayProjects.filter((p) => p.status === "en_cours").length,
        completed: displayProjects.filter((p) => p.status === "termine").length,
      },
    };

    const data = {
      stats: exportStats,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [displayClients, displayDeals, displayProjects]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const handleViewAllDeals = useCallback(() => {
    navigate("/pipeline");
  }, [navigate]);

  const handleCreateNewClient = useCallback(() => {
    navigate("/clients");
  }, [navigate]);

  const handleCreateNewProject = useCallback(() => {
    navigate("/projects");
  }, [navigate]);

  const stats = useMemo(() => {
    const now = new Date();
    const totalClients = displayClients.length;
    const activeClients = displayClients.filter(
      (c) => c.status === "Actif",
    ).length;
    const newClientsThisMonth = displayClients.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return (
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length;

    const totalDeals = displayDeals.length;
    const activeDeals = displayDeals.filter(
      (d) => d.stage !== "won" && d.stage !== "lost",
    );
    const wonDeals = displayDeals.filter((d) => d.stage === "won");
    const lostDeals = displayDeals.filter((d) => d.stage === "lost");

    const totalRevenue = wonDeals.reduce((sum, deal) => {
      return sum + parseAmount(deal.amount);
    }, 0);

    const projectedRevenue = activeDeals.reduce((sum, deal) => {
      const value = parseAmount(deal.amount);
      return sum + (value * (deal.probability || 50)) / 100;
    }, 0);

    const conversionRate =
      totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

    const totalProjects = displayProjects.length;
    const activeProjects = displayProjects.filter(
      (p) => p.status === "en_cours",
    ).length;
    const completedProjects = displayProjects.filter(
      (p) => p.status === "termine",
    ).length;
    const archivedProjects = displayProjects.filter(
      (p) => p.status === "archive",
    ).length;

    return {
      clients: {
        total: totalClients,
        active: activeClients,
        newThisMonth: newClientsThisMonth,
        growthRate:
          totalClients > 0
            ? Math.round((newClientsThisMonth / totalClients) * 100)
            : 0,
      },
      deals: {
        total: totalDeals,
        active: activeDeals.length,
        won: wonDeals.length,
        lost: lostDeals.length,
        revenue: totalRevenue,
        projected: projectedRevenue,
        conversionRate,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        archived: archivedProjects,
        completionRate:
          totalProjects > 0
            ? Math.round((completedProjects / totalProjects) * 100)
            : 0,
      },
    };
  }, [displayClients, displayDeals, displayProjects]);
  // console.log("STATS FINAL:", stats);

  const dealsByStage = useMemo(() => {
    const stages = [
      "prospects",
      "contacted",
      "proposal",
      "negotiation",
      "won",
      "lost",
    ];
    return stages.map((stage) => ({
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      value: displayDeals.filter((d) => d.stage === stage).length,
      color:
        stage === "won" ? "#10b981" : stage === "lost" ? "#ef4444" : "#3b82f6",
    }));
  }, [displayDeals]);

  const projectStatus = useMemo(
    () => [
      { name: "En Cours", value: stats.projects.active, color: "#3b82f6" },
      { name: "Terminés", value: stats.projects.completed, color: "#10b981" },
      { name: "Archivés", value: stats.projects.archived, color: "#6b7280" },
    ],
    [stats.projects],
  );

  const monthlyData = useMemo(() => {
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    const currentMonth = new Date().getMonth();

    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthDeals = displayDeals.filter((d) => {
        const dealDate = new Date(d.date);
        return (
          dealDate.getMonth() === index &&
          dealDate.getFullYear() === new Date().getFullYear()
        );
      });

      const monthProjects = displayProjects.filter((p) => {
        const projectDate = new Date(p.startDate);
        return (
          projectDate.getMonth() === index &&
          projectDate.getFullYear() === new Date().getFullYear()
        );
      });

      const monthRevenue = monthDeals
        .filter((d) => d.stage === "won")
        .reduce((sum, deal) => sum + parseAmount(deal.amount), 0);

      return {
        month,
        deals: monthDeals.length,
        projects: monthProjects.length,
        revenue: monthRevenue,
        clients: displayClients.filter((c) => {
          const clientDate = new Date(c.createdAt);
          return (
            clientDate.getMonth() === index &&
            clientDate.getFullYear() === new Date().getFullYear()
          );
        }).length,
      };
    });
  }, [displayDeals, displayProjects, displayClients]);

  const performanceData = useMemo(() => {
    // console.log("STATS USED IN KPI:", stats);

    return [
      { metric: "Conversion", value: stats.deals.conversionRate },
      { metric: "Completion", value: stats.projects.completionRate },
      { metric: "Clients actifs", value: stats.clients.active },
      { metric: "Projets actifs", value: stats.projects.active },
    ];
  }, [stats]);
  const projectedGrowth =
    stats.deals.revenue > 0
      ? Math.round((stats.deals.projected / stats.deals.revenue) * 100)
      : 0;

  return (
    <div className="space-y-6 text-left">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-linear-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm sm:p-8 text-left">
        {/* Halos de couleur floutés en arrière-plan pour la profondeur */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Partie gauche : Titre, Éléments dynamiques utilisateur et Description */}
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
                Tableau de Bord
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                {/* Nom de l'utilisateur - Slate doux */}
                {user?.name && (
                  <span className="text-xl font-semibold tracking-tight text-slate-500 sm:text-2xl">
                    <span className="mr-2  font-light">|</span>
                    {user.name}
                  </span>
                )}

                {/* Badge Administrateur - Harmonisé en Bleu Clair Premium */}
                {user?.roles?.includes("ROLE_ADMIN") && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm shadow-blue-100/50 backdrop-blur-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Administrateur
                  </span>
                )}
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-600 sm:text-base font-medium">
              Vue d&apos;ensemble complète de votre activité Eray Digital.
            </p>
          </div>

          {/* Partie droite : Affichage de la date au format Widget Épuré */}
          <div className="flex items-center lg:justify-end">
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/60 bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:border-slate-300">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>
                {new Date().toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOUVEAU SYSTÈME DE WIDGETS */}
      <DashboardGrid />

      {/* BARRE D'OUTILS SIMPLIFIÉE */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Filtres et actions */}
          <div className="flex items-center gap-2">
            {/* Actions rapides */}
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showCharts ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showCharts ? "Cacher" : "Voir"} Graphiques
            </button>

            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Actualiser
            </button>

            <button
              onClick={handleExportData}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Exporter
            </button>
          </div>

          {/* Sélecteurs de vue */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1">
              {(["overview", "detailed", "analytics"] as ViewMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {mode === "overview"
                      ? "Vue d'ensemble"
                      : mode === "detailed"
                        ? "Détaillé"
                        : "Analytiques"}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU SPÉCIFIQUE SELON LA VUE */}
      {showCharts && (
        <div className="space-y-6">
          {viewMode === "overview" && (
            <>
              {/* Vue d'ensemble - Graphique d'évolution mensuelle */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Évolution Mensuelle
                    </h3>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip formatter={(value) => [value, "Valeur"]} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="deals"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#93bbfc"
                      name="Deals"
                    />
                    <Area
                      type="monotone"
                      dataKey="projects"
                      stackId="1"
                      stroke="#10b981"
                      fill="#86efac"
                      name="Projets"
                    />
                    <Area
                      type="monotone"
                      dataKey="clients"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#fcd34d"
                      name="Clients"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {viewMode === "detailed" && (
            <>
              {/* Vue détaillée - Informations complètes */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Détails Clients */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Détails Clients
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Clients
                      </span>
                      <span className="font-bold text-gray-800">
                        {stats.clients.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Clients Actifs
                      </span>
                      <span className="font-bold text-green-600">
                        {stats.clients.active}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Nouveaux ce mois
                      </span>
                      <span className="font-bold text-blue-600">
                        {stats.clients.newThisMonth}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Taux de croissance
                      </span>
                      <span className="font-bold text-purple-600">
                        {stats.clients.growthRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Détails Deals */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Détails Deals
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Deals</span>
                      <span className="font-bold text-gray-800">
                        {stats.deals.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Deals Actifs
                      </span>
                      <span className="font-bold text-blue-600">
                        {stats.deals.active}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Deals Gagnés
                      </span>
                      <span className="font-bold text-green-600">
                        {stats.deals.won}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Deals Perdus
                      </span>
                      <span className="font-bold text-red-600">
                        {stats.deals.lost}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Taux Conversion
                      </span>
                      <span className="font-bold text-purple-600">
                        {stats.deals.conversionRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Détails Projets */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Détails Projets
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Projets
                      </span>
                      <span className="font-bold text-gray-800">
                        {stats.projects.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Projets Actifs
                      </span>
                      <span className="font-bold text-blue-600">
                        {stats.projects.active}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Projets Terminés
                      </span>
                      <span className="font-bold text-green-600">
                        {stats.projects.completed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Projets Archivés
                      </span>
                      <span className="font-bold text-gray-600">
                        {stats.projects.archived}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Taux Complétion
                      </span>
                      <span className="font-bold text-purple-600">
                        {stats.projects.completionRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {viewMode === "analytics" && (
            <>
              {/* Vue analytiques - Métriques avancées */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Performance KPIs */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Indicateurs de Performance
                    </h3>
                  </div>

                  <ResponsiveContainer width="100%" height={250}>
                    {/* 1. Ajoutez layout="vertical" ici */}
                    <BarChart
                      data={performanceData}
                      layout="vertical"
                      margin={{ left: 30, right: 30, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        horizontal={false}
                      />

                      {/* 2. L'axe X doit être de type "number" pour les valeurs */}
                      <XAxis
                        type="number"
                        stroke="#6b7280"
                        fontSize={12}
                        hide={false}
                      />

                      {/* 3. L'axe Y doit être de type "category" pour les noms des métriques */}
                      <YAxis
                        dataKey="metric"
                        type="category"
                        stroke="#6b7280"
                        fontSize={12}
                        width={100}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />

                      {/* 4. Vérifiez que dataKey correspond bien à "value" dans performanceData */}
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pipeline des ventes */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metric" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value, "Valeur"]} />
                        <Bar
                          dataKey="value"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                      <h3 className="text-lg font-bold text-gray-800">
                        Pipeline des Ventes
                      </h3>
                    </div>
                    <button
                      onClick={handleViewAllDeals}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Voir tout →
                    </button>
                  </div>

                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dealsByStage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" name="Deals">
                        {dealsByStage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.deals.won}
                      </p>
                      <p className="text-xs text-gray-500">Gagnés</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.deals.active}
                      </p>
                      <p className="text-xs text-gray-500">Actifs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.deals.lost}
                      </p>
                      <p className="text-xs text-gray-500">Perdus</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Répartition projets et revenus */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Répartition Projets
                    </h3>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={projectStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {projectStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  <div className="mt-4 space-y-2">
                    {projectStatus.map((status) => (
                      <div
                        key={status.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {status.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {status.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenus et Projections */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Revenus & Projections
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Revenu total des deals
                      </span>
                      <span className="font-bold text-green-600">
                        {stats.deals.revenue.toLocaleString()} Ar
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Revenu Projeté
                      </span>
                      <span className="font-bold text-blue-600">
                        {stats.deals.projected.toLocaleString()} Ar
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Croissance Projetée
                      </span>
                      <span className="font-bold text-purple-600">
                        +{projectedGrowth}%
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600 mb-2">
                        Progression Mensuelle
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(projectedGrowth, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activité Récente */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Activité Récente
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">Nouveaux Clients</span>
                        <span className="font-bold text-blue-600">
                          {stats.clients.newThisMonth}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              (stats.clients.newThisMonth /
                                Math.max(stats.clients.total, 1)) *
                                100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">Deals Convertis</span>
                        <span className="font-bold text-green-600">
                          {stats.deals.won}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-green-600 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              stats.deals.conversionRate,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">Projets Terminés</span>
                        <span className="font-bold text-purple-600">
                          {stats.projects.completed}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              stats.projects.completionRate,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
