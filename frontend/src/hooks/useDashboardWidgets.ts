import { useState, useCallback, useMemo } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  WidgetConfig,
  WidgetType,
  DashboardLayout,
  KPICard,
  ChartData,
  ActivityItem,
  WidgetPosition,
} from "../types/dashboard";

const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: "kpi-cards",
    type: "kpi-cards",
    title: "Indicateurs Clés",
    position: { x: 0, y: 0, width: 12, height: 2 },
    isVisible: true,
    isMinimized: false,
    config: {},
  },
  {
    id: "revenue-chart",
    type: "revenue-chart",
    title: "Évolution des Revenus",
    position: { x: 0, y: 2, width: 8, height: 4 },
    isVisible: true,
    isMinimized: false,
    config: { period: "month" },
    refreshInterval: 300,
  },
  {
    id: "pipeline-chart",
    type: "pipeline-chart",
    title: "Pipeline des Ventes",
    position: { x: 8, y: 2, width: 4, height: 4 },
    isVisible: true,
    isMinimized: false,
    config: {},
  },
  {
    id: "recent-clients",
    type: "recent-clients",
    title: "Clients Récents",
    position: { x: 0, y: 6, width: 4, height: 3 },
    isVisible: true,
    isMinimized: false,
    config: { limit: 5 },
  },
  {
    id: "upcoming-deadlines",
    type: "upcoming-deadlines",
    title: "Échéances",
    position: { x: 4, y: 6, width: 4, height: 3 },
    isVisible: true,
    isMinimized: false,
    config: { days: 30 },
  },
  {
    id: "quick-actions",
    type: "quick-actions",
    title: "Actions Rapides",
    position: { x: 8, y: 6, width: 4, height: 3 },
    isVisible: true,
    isMinimized: false,
    config: {},
  },
];

const parseAmount = (amount: unknown): number => {
  if (amount == null) return 0;

  if (typeof amount === "number") return amount;

  if (typeof amount !== "string") return 0;

  return parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0;
};

export const useDashboardWidgets = () => {
  const { clients, deals, projects } = useData();
  const { user } = useAuth();

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
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  // Calculer les données pour chaque widget
  const kpiData = useMemo((): KPICard[] => {
    const totalClients = displayClients.length;
    const activeDeals = displayDeals.filter(
      (d) => d.stage !== "won" && d.stage !== "lost",
    ).length;
    const totalRevenue = displayDeals
      .filter((d) => d.stage === "won")
      .reduce((sum, deal) => {
        return sum + parseAmount(deal.amount);
      }, 0);

    const projectsInProgress = displayProjects.filter(
      (p) => p.status === "en_cours",
    );
    const totalInProgress = projectsInProgress.length;

    const avgProgress =
      projectsInProgress.length > 0
        ? Math.round(
            projectsInProgress.reduce((sum, p) => sum + (p.progress || 0), 0) /
              projectsInProgress.length,
          )
        : 0;
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const revenueCurrentMonth = deals
      .filter((d) => {
        if (d.stage !== "won") return false;

        const date = new Date(d.date);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      })
      .reduce((sum, d) => sum + parseAmount(d.amount), 0);

    const revenuePreviousMonth = deals
      .filter((d) => {
        if (d.stage !== "won") return false;

        const date = new Date(d.date);
        return (
          date.getMonth() === previousMonth &&
          date.getFullYear() === previousYear
        );
      })
      .reduce((sum, d) => sum + parseAmount(d.amount), 0);

    const revenueGrowth =
      revenuePreviousMonth > 0
        ? Math.round(
            ((revenueCurrentMonth - revenuePreviousMonth) /
              revenuePreviousMonth) *
              100,
          )
        : 100;

    return [
      {
        title: "Total de vos clients",
        value: totalClients,
        icon: "Users",
        color: "blue",
        trend: {
          value: `+${
            displayClients.filter((c) => {
              const createdAt = new Date(c.createdAt);
              const thisMonth = new Date().getMonth();
              return createdAt.getMonth() === thisMonth;
            }).length
          }`,
          positive: true,
        },
        onClick: () => navigate("/clients"),
      },
      {
        title: "Vos deals actifs",
        value: activeDeals,
        icon: "Target",
        color: "purple",
        trend: {
          value: `${Math.round((displayDeals.filter((d) => d.stage === "won").length / Math.max(displayDeals.length, 1)) * 100)}% conv.`,
          positive: true,
        },
        onClick: () => navigate("/pipeline"),
      },
      {
        title: "Votre revenu total de deal",
        value: `${totalRevenue.toLocaleString()} Ar`,
        icon: "DollarSign",
        color: "green",
        trend: {
          value: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}%`,
          positive: revenueGrowth >= 0,
        },
        onClick: () => navigate("/pipeline"),
      },
      {
        title: "Vos projets en cours",
        value: totalInProgress,
        icon: "Briefcase",
        color: "orange",
        trend: {
          value: `${avgProgress}% complété`,
          positive: avgProgress >= 60,
        },
        onClick: () => navigate("/projects"),
      },
    ];
  }, [displayClients, displayDeals, displayProjects, deals, navigate]);

  const revenueChartData = useMemo((): ChartData => {
    const monthlyData: Record<string, number> = {};

    displayDeals
      .filter((d) => d.stage === "won")
      .forEach((deal) => {
        const date = new Date(deal.date);
        const monthKey = date.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "short",
        });
        const amount = parseAmount(deal.amount);
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
      });

    return {
      labels: Object.keys(monthlyData).slice(-6),
      datasets: [
        {
          label: "Revenus",
          data: Object.values(monthlyData).slice(-6),
          color: "#10b981",
        },
      ],
    };
  }, [displayDeals]);

  const pipelineChartData = useMemo((): ChartData => {
    const stages = [
      "lead",
      "contact",
      "proposal",
      "negotiation",
      "won",
      "lost",
    ];

    return {
      labels: stages.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [
        {
          label: "Deals",
          data: stages.map(
            (stage) => displayDeals.filter((d) => d.stage === stage).length,
          ),
          color: "#3b82f6",
        },
      ],
    };
  }, [displayDeals]);

  const recentClients = useMemo(() => {
    return displayClients
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [displayClients]);

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limit = new Date();
    limit.setDate(limit.getDate() + 30);

    const filtered = displayProjects.filter((p) => {
      if (!p.endDate) return false;

      const end = new Date(p.endDate);
      if (isNaN(end.getTime())) return false; // 🔥 sécurité importante

      return end >= today && end <= limit;
    });

    return filtered
      .sort(
        (a, b) =>
          new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime(),
      )
      .slice(0, 5);
  }, [displayProjects]);

  const activityFeed = useMemo((): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Ajouter les clients récents
    displayClients.slice(-3).forEach((client) => {
      activities.push({
        id: `client-${client.id}`,
        type: "client",
        action: "Nouveau client",
        description: `${client.name} (${client.company})`,
        timestamp: client.createdAt,
      });
    });

    // Ajouter les deals récents
    displayDeals.slice(-3).forEach((deal) => {
      activities.push({
        id: `deal-${deal.id}`,
        type: "deal",
        action: "Deal créé",
        description: `${deal.title} - ${deal.amount}`,
        timestamp: deal.createdAt,
      });
    });

    return activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [displayClients, displayDeals]);

  // Actions sur les widgets
  const updateWidget = useCallback(
    (widgetId: string, updates: Partial<WidgetConfig>) => {
      setWidgets((prev) =>
        prev.map((widget) =>
          widget.id === widgetId ? { ...widget, ...updates } : widget,
        ),
      );
    },
    [],
  );

  const moveWidget = useCallback(
    (widgetId: string, newPosition: Partial<WidgetPosition>) => {
      updateWidget(widgetId, {
        position: {
          ...widgets.find((w) => w.id === widgetId)!.position,
          ...newPosition,
        },
      });
    },
    [widgets, updateWidget],
  );

  const toggleWidgetVisibility = useCallback(
    (widgetId: string) => {
      const widget = widgets.find((w) => w.id === widgetId);
      if (widget) {
        updateWidget(widgetId, { isVisible: !widget.isVisible });
      }
    },
    [widgets, updateWidget],
  );

  const toggleWidgetMinimized = useCallback(
    (widgetId: string) => {
      const widget = widgets.find((w) => w.id === widgetId);
      if (widget) {
        updateWidget(widgetId, { isMinimized: !widget.isMinimized });
      }
    },
    [widgets, updateWidget],
  );

  const addWidget = useCallback(
    (type: WidgetType, position?: Partial<WidgetPosition>) => {
      const newWidget: WidgetConfig = {
        id: `${type}-${Date.now()}`,
        type,
        title: type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        position: { x: 0, y: 0, width: 4, height: 3, ...position },
        isVisible: true,
        isMinimized: false,
        config: {},
      };

      setWidgets((prev) => [...prev, newWidget]);
    },
    [],
  );

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));
    setSelectedWidget(null);
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  const saveLayout = useCallback(
    (name: string) => {
      const layout: DashboardLayout = {
        id: `layout-${Date.now()}`,
        name,
        widgets,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Ici, vous pourriez sauvegarder dans le localStorage ou l'API
      localStorage.setItem("dashboard-layout", JSON.stringify(layout));

      return layout;
    },
    [widgets],
  );

  const loadLayout = useCallback((layout: DashboardLayout) => {
    setWidgets(layout.widgets);
  }, []);

  return {
    // État
    widgets,
    isEditMode,
    selectedWidget,

    // Données calculées
    kpiData,
    revenueChartData,
    pipelineChartData,
    recentClients,
    upcomingDeadlines,
    activityFeed,

    // Actions
    setIsEditMode,
    setSelectedWidget,
    updateWidget,
    moveWidget,
    toggleWidgetVisibility,
    toggleWidgetMinimized,
    addWidget,
    removeWidget,
    resetLayout,
    saveLayout,
    loadLayout,
  };
};
