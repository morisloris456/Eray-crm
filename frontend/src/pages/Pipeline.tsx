
import { useState, useMemo, useRef } from "react";
import {
  MoreVertical,
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
  ArrowRightLeft,
  Trash2,
  TrendingUp,
  Calendar,
  Target,
  Edit3,
  Eye,
  User,
  BarChart3,
  X,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Download,
  GripVertical,
  Users,
  UserPlus,
} from "lucide-react";
import { useData, type Deal } from "../context/DataContext";
import Modal from "../components/Modal";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const STAGES = [
  { id: "lead", name: "Prospects", color: "bg-gray-400", description: "Nouveaux contacts" },
  { id: "contact", name: "Contacté", color: "bg-blue-500", description: "Prise de contact" },
  { id: "proposal", name: "Proposition", color: "bg-purple-500", description: "Offre envoyée" },
  { id: "won", name: "Gagné", color: "bg-green-500", description: "Deals conclus" },
  { id: "lost", name: "Perdu", color: "bg-red-500", description: "Opportunités perdues" },
];

const PROBABILITY_BY_STAGE = {
  lead: 20,
  contact: 40,
  proposal: 75,
  won: 100,
  lost: 0,
} as const;

const Pipeline = () => {
  const { user } = useAuth();
  const { deals, clients, addDeal, updateDeal, deleteDeal } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("Tous");
  const [amountFilter, setAmountFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isManualProbability, setIsManualProbability] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  // ✅ Filtres ownership — même logique que Projects
  const [filterMyDeals, setFilterMyDeals] = useState(false);
  const [filterByUser, setFilterByUser] = useState<number | "all">("all");
  const [showUserFilter, setShowUserFilter] = useState(false);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    amount: "",
    stage: "lead" as Deal["stage"],
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    description: "",
    probability: 20,
    expectedCloseDate: "",
    assignedTo: "",
  });

  const cleanAmount = (amount: string | number | undefined): number | null => {
    if (amount === undefined || amount === null || amount === "") return null;
    const amountStr = typeof amount === "string" ? amount : amount.toString();
    const cleaned = amountStr.replace(/[^0-9]/g, "");
    const parsed = parseInt(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  const safeDate = (d: any) => {
    if (!d || d === "") return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date.toISOString();
  };

  // ✅ Tous les utilisateurs uniques extraits des deals (pour filtre admin)
  const allUsers = useMemo(() => {
    const map = new Map<number, string>();
    deals.forEach((d) => {
      if (d.createdBy?.id && d.createdBy?.name) {
        map.set(d.createdBy.id, d.createdBy.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deals]);

  
  const selectedUserName =
    filterByUser === "all"
      ? "Tous les utilisateurs"
      : allUsers.find((u) => u.id === filterByUser)?.name ?? "Utilisateur";

  const clientsScope = isAdmin
    ? clients
    : clients.filter((c) => c.createdBy?.id === user?.id);

  
  const dealsScope = useMemo(() => {
    let base = isAdmin
      ? deals
      : deals.filter((d) => d.createdBy?.id === user?.id);

    if (filterMyDeals && user) {
      base = base.filter((d) => d.createdBy?.id === user.id);
    }

    if (isAdmin && filterByUser !== "all") {
      base = base.filter((d) => d.createdBy?.id === filterByUser);
    }

    return base;
  }, [deals, isAdmin, user, filterMyDeals, filterByUser]);

  // Stats
  const totalDeals = dealsScope.length;
  const wonDeals = dealsScope.filter((d) => d.stage === "won");
  const lostDeals = dealsScope.filter((d) => d.stage === "lost");
  const activeDeals = dealsScope.filter((d) => d.stage !== "won" && d.stage !== "lost");

  const wonAmount = wonDeals.reduce((sum, deal) => sum + (cleanAmount(deal.amount) ?? 0), 0);
  const weightedAmount = dealsScope.reduce((sum, deal) => {
    const amount = cleanAmount(deal.amount) ?? 0;
    const probability = deal.probability ?? PROBABILITY_BY_STAGE[deal.stage] ?? 0;
    return sum + (amount * probability) / 100;
  }, 0);
  const projectedAmount = activeDeals.reduce((sum, deal) => {
    const amount = cleanAmount(deal.amount) ?? 0;
    const probability = deal.probability ?? PROBABILITY_BY_STAGE[deal.stage] ?? 0;
    return sum + (amount * probability) / 100;
  }, 0);
  const conversionRate =
    totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  // ✅ filteredDeals basé sur dealsScope (ownership déjà appliqué)
  const filteredDeals = useMemo(() => {
    return dealsScope.filter((deal) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        deal.title?.toLowerCase().includes(searchTermLower) ||
        (deal.client || "").toLowerCase().includes(searchTermLower) ||
        deal.description?.toLowerCase().includes(searchTermLower) ||
        false;
      const matchesStage = stageFilter === "Tous" || deal.stage === stageFilter;
      const matchesAmount =
        !amountFilter || (cleanAmount(deal.amount) ?? 0) >= parseInt(amountFilter);
      return matchesSearch && matchesStage && matchesAmount;
    });
  }, [dealsScope, searchTerm, stageFilter, amountFilter]);

  const resetForm = (stageDefault: Deal["stage"] = "lead") => {
    setSelectedDeal(null);
    setIsEditing(false);
    setIsManualProbability(false);
    setFormData({
      title: "",
      client_id: "",
      amount: "",
      stage: stageDefault,
      date: new Date().toISOString().split("T")[0],
      description: "",
      probability: PROBABILITY_BY_STAGE[stageDefault],
      expectedCloseDate: "",
      assignedTo: "",
    });
  };

  const exportToCSV = () => {
    setIsExporting(true);
    const headers = ["Titre", "Client", "Montant", "Étape", "Probabilité", "Assigné à", "Créé par", "Date", "Description"];
    const csvContent = [
      headers.join(","),
      ...filteredDeals.map((deal) =>
        [
          deal.title,
          deal.client,
          deal.amount,
          STAGES.find((s) => s.id === deal.stage)?.name || deal.stage,
          `${deal.probability ?? PROBABILITY_BY_STAGE[deal.stage] ?? 0}%`,
          deal.assignedTo || "Non assigné",
          deal.createdBy?.name || "Inconnu",
          deal.date,
          deal.description || "",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pipeline_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const getProbabilityByStage = (stage: Deal["stage"]): number =>
    PROBABILITY_BY_STAGE[stage] || 0;

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", deal.id.toString());
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverStage(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragEnter = (stageId: string) => {
    dragCounter.current++;
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverStage(null);
  };

  const handleDrop = (targetStage: Deal["stage"]) => {
    dragCounter.current = 0;
    setDragOverStage(null);
    if (!draggedDeal) return;
    if (draggedDeal.stage !== targetStage) {
      const newProbability = getProbabilityByStage(targetStage);
      updateDeal(draggedDeal.id, { stage: targetStage, probability: newProbability });
      const stageName = STAGES.find((s) => s.id === targetStage)?.name || targetStage;
      toast.success(`Deal déplacé vers "${stageName}" - Probabilité: ${newProbability}%`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) return toast.error("Veuillez choisir un client");
    setIsSaving(true);
    await new Promise((res) => setTimeout(res, 600));
    const dealData = {
      title: formData.title,
      client_id: Number(formData.client_id),
      amount: cleanAmount(formData.amount),
      stage: formData.stage,
      date: safeDate(formData.date),
      description: formData.description,
      probability: formData.probability ?? PROBABILITY_BY_STAGE[formData.stage],
      expectedCloseDate: safeDate(formData.expectedCloseDate),
      assignedTo: formData.assignedTo || undefined,
    };
    if (isEditing && selectedDeal) {
      updateDeal(selectedDeal.id, dealData);
      setIsEditing(false);
      setSelectedDeal(null);
    } else {
      addDeal(dealData);
    }
    setIsSaving(false);
    setIsModalOpen(false);
    resetForm("lead");
  };

  const handleMoveStage = (dealId: number, currentStage: Deal["stage"]) => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1].id as Deal["stage"];
      updateDeal(dealId, { stage: nextStage, probability: getProbabilityByStage(nextStage) });
      toast.info(`Deal déplacé avec succès - Probabilité: ${getProbabilityByStage(nextStage)}%`);
    }
  };

  const openDealDetails = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormData({
      title: deal.title,
      client_id: String(deal.client_id ?? ""),
      amount: deal.amount ? String(deal.amount) : "",
      stage: deal.stage,
      date: deal.date,
      description: deal.description || "",
      probability: deal.probability ?? PROBABILITY_BY_STAGE[deal.stage],
      expectedCloseDate: deal.expectedCloseDate || "",
      assignedTo: deal.assignedTo || "",
    });
    setIsEditing(true);
    setIsDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const askDeleteDeal = (deal: Deal) => {
    setDealToDelete(deal);
    setIsDetailModalOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!dealToDelete) return;
    deleteDeal(dealToDelete.id);
    if (selectedDeal?.id === dealToDelete.id) {
      setSelectedDeal(null);
      setIsDetailModalOpen(false);
    }
    setConfirmOpen(false);
    setDealToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDealToDelete(null);
  };

  return (
    <div className="h-full space-y-6 text-left">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <TrendingUp className="h-4 w-4" />
              Suivi Commercial
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pipeline de Ventes
            </h1>
            <p className="mt-2 text-sm text-blue-100 sm:text-base">
              Gérez vos opportunités et suivez l'évolution de vos indicateurs en temps réel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:justify-end">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-right backdrop-blur min-w-[120px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-green-200">CA Gagné</span>
              <span className="text-base font-black tracking-tight text-white">{wonAmount.toLocaleString()} Ar</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-right backdrop-blur min-w-[120px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200">CA Pondéré</span>
              <span className="text-base font-black tracking-tight text-white">{weightedAmount.toLocaleString()} Ar</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-right backdrop-blur min-w-[120px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-200">Prévisionnel</span>
              <span className="text-base font-black tracking-tight text-white">{projectedAmount.toLocaleString()} Ar</span>
            </div>
            <button
              type="button"
              onClick={() => { resetForm("lead"); setIsModalOpen(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:scale-[1.02] hover:bg-blue-50 active:scale-95 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Nouveau Deal
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Deals", value: totalDeals, icon: BarChart3, textColor: "text-gray-800", iconWrap: "bg-blue-50 text-blue-600" },
          { label: "Actifs", value: activeDeals.length, icon: Target, textColor: "text-blue-600", iconWrap: "bg-blue-50 text-blue-600" },
          { label: "Gagnés", value: wonDeals.length, icon: CheckCircle2, textColor: "text-green-600", iconWrap: "bg-green-50 text-green-600" },
          { label: "Perdus", value: lostDeals.length, icon: AlertCircle, textColor: "text-red-600", iconWrap: "bg-red-50 text-red-600" },
          { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, textColor: "text-purple-600", iconWrap: "bg-purple-50 text-purple-600" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.iconWrap}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRE DE RECHERCHE, FILTRES ET OWNERSHIP */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, client, description..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bouton "Mes deals" - Réservé aux administrateurs */}
          {isAdmin && (
            <button
              onClick={() => {
                setFilterMyDeals(!filterMyDeals);
                if (!filterMyDeals && isAdmin) setFilterByUser("all");
              }}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                filterMyDeals
                  ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Mes deals
            </button>
          )}

          {/* Filtre par utilisateur — admin seulement */}
          {isAdmin && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowUserFilter(!showUserFilter)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                  filterByUser !== "all"
                    ? "border-purple-400 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{selectedUserName}</span>
                <ChevronDown className="h-4 w-4 shrink-0" />
              </button>

              {showUserFilter && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full z-20 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl">
                  <button
                    onClick={() => {
                      setFilterByUser("all");
                      setFilterMyDeals(false);
                      setShowUserFilter(false);
                    }}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 ${
                      filterByUser === "all" ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    Tous les utilisateurs
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setFilterByUser(u.id);
                        setFilterMyDeals(false);
                        setShowUserFilter(false);
                      }}
                      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 ${
                        filterByUser === u.id
                          ? "bg-purple-50 text-purple-700 font-semibold"
                          : "text-gray-700"
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
                    <p className="px-4 py-3 text-xs text-gray-400">Aucun utilisateur trouvé</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Filtres par Étape & Montant */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100"
            >
              <Filter className="h-4 w-4" />
              <span>{stageFilter === "Tous" ? "Toutes les étapes" : STAGES.find((s) => s.id === stageFilter)?.name ?? stageFilter}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Étape</label>
                    <select
                      value={stageFilter}
                      onChange={(e) => { setStageFilter(e.target.value); setShowFilters(false); }}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white"
                    >
                      <option value="Tous">Toutes les étapes</option>
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Montant minimum</label>
                    <input
                      type="number"
                      placeholder="Montant minimum (Ar)"
                      value={amountFilter}
                      onChange={(e) => setAmountFilter(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={exportToCSV}
            disabled={isExporting || filteredDeals.length === 0}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exporter CSV
          </button>
        </div>

        {/* ✅ Indicateurs filtres actifs (affiché uniquement si au moins un filtre est utilisé) */}
        {(filterMyDeals || (isAdmin && filterByUser !== "all") || stageFilter !== "Tous" || amountFilter) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Filtres actifs :</span>
            
            {filterMyDeals && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Mes deals
                <button onClick={() => setFilterMyDeals(false)} className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {isAdmin && filterByUser !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                {selectedUserName}
                <button onClick={() => setFilterByUser("all")} className="ml-0.5 rounded-full hover:bg-purple-200 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {stageFilter !== "Tous" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Étape: {STAGES.find((s) => s.id === stageFilter)?.name ?? stageFilter}
                <button onClick={() => setStageFilter("Tous")} className="ml-0.5 rounded-full hover:bg-gray-200 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {amountFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Min: {amountFilter} Ar
                <button onClick={() => setAmountFilter("")} className="ml-0.5 rounded-full hover:bg-green-200 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <span className="ml-auto text-xs text-gray-400">
              {filteredDeals.length} deal{filteredDeals.length > 1 ? "s" : ""} trouvé{filteredDeals.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* PLATEAU KANBAN */}
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-[70vh]">
        {STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
          const stageAmount = stageDeals.reduce(
            (sum, deal) => sum + (cleanAmount(deal.amount) ?? 0),
            0,
          );

          return (
            <div key={stage.id} className="flex flex-col gap-4 min-w-80 flex-1">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                  <div>
                    <h3 className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">
                      {stage.name}
                    </h3>
                    <p className="text-[9px] text-gray-400">{stage.description}</p>
                  </div>
                  <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                    {stageDeals.length}
                  </span>
                </div>
                <MoreVertical className="h-4 w-4 text-gray-300 cursor-pointer" />
              </div>

              {stageAmount > 0 && (
                <div className="px-2 text-xs font-bold text-gray-600">
                  {stageAmount.toLocaleString()} Ar
                </div>
              )}

              <div
                className={`flex flex-col gap-3 h-full rounded-3xl p-3 border transition-all ${
                  dragOverStage === stage.id
                    ? "bg-blue-50 border-blue-400 border-2"
                    : "bg-gray-50/50 border-gray-100"
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragEnter={() => handleDragEnter(stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => { e.preventDefault(); handleDrop(stage.id as Deal["stage"]); }}
              >
                {stageDeals.map((deal) => {
                  const probability = deal.probability ?? PROBABILITY_BY_STAGE[deal.stage] ?? 0;

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onDragEnd={handleDragEnd}
                      className={`group relative rounded-2xl bg-white p-4 shadow-sm border transition-all cursor-move ${
                        draggedDeal?.id === deal.id
                          ? "opacity-50 rotate-2 scale-95"
                          : "border-gray-100 hover:shadow-md hover:border-blue-200"
                      }`}
                      onClick={() => openDealDetails(deal)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 cursor-move" />
                          <h4 className="text-sm font-bold text-gray-800 leading-tight flex-1">
                            {deal.title}
                          </h4>
                        </div>
                        <div className="flex gap-1">
                          {stage.id !== "won" && stage.id !== "lost" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveStage(deal.id, deal.stage); }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                              title="Étape suivante"
                            >
                              <ArrowRightLeft className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(deal); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-600 hover:text-white transition-all"
                            title="Éditer"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); askDeleteDeal(deal); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] font-medium text-gray-400 mb-2 uppercase tracking-tighter">
                        {deal.client}
                      </p>

                   

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Probabilité</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-700">{probability}%</span>
                            {(deal.probability ?? PROBABILITY_BY_STAGE[deal.stage]) ===
                              PROBABILITY_BY_STAGE[deal.stage] && (
                              <span className="text-[8px] text-blue-500 bg-blue-50 px-1 rounded">Auto</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              probability >= 75 ? "bg-green-500"
                              : probability >= 50 ? "bg-yellow-500"
                              : probability >= 25 ? "bg-orange-500"
                              : "bg-red-500"
                            }`}
                            style={{ width: `${probability}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 rounded bg-green-50">
                            <DollarSign className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm font-black text-gray-700">
                            {deal.amount !== null && deal.amount !== undefined && deal.amount !== "" ? (
                              `${(cleanAmount(deal.amount) ?? 0).toLocaleString()} Ar`
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                Non défini
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                          {stage.id === "won" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : stage.id === "lost" ? (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {formatDate(deal.date)}
                        </div>
                      </div>

                      {deal.assignedTo && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-[10px] text-gray-500">{deal.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => { resetForm(stage.id as Deal["stage"]); setIsModalOpen(true); }}
                  className="group flex items-center justify-center gap-2 rounded-2xl py-4 border-2 border-dashed border-transparent hover:border-gray-200 hover:bg-white transition-all"
                >
                  <Plus className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                  <span className="text-xs font-bold text-gray-400 group-hover:text-blue-500">Ajouter</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE D'AJOUT/ÉDITION */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Modifier l'opportunité" : "Nouvelle opportunité"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">* Titre du projet</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white focus:border-blue-500"
              placeholder="Ex: Campagne Ads Avril"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">* Client</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white focus:border-blue-500"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Sélectionner un client</option>
                {clientsScope.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Montant (Ar)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Montant non défini"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">* Étape initiale</label>
              <select
                value={formData.stage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stage: e.target.value as Deal["stage"],
                    probability: PROBABILITY_BY_STAGE[e.target.value as Deal["stage"]],
                  })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Probabilité (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, probability: value });
                    setIsManualProbability(value !== PROBABILITY_BY_STAGE[formData.stage]);
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none pr-16 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const autoValue = PROBABILITY_BY_STAGE[formData.stage];
                    setFormData({ ...formData, probability: autoValue });
                    setIsManualProbability(false);
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] rounded-lg transition-all ${
                    !isManualProbability && formData.probability === PROBABILITY_BY_STAGE[formData.stage]
                      ? "bg-green-100 text-green-700 font-bold ring-1 ring-green-300"
                      : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                >
                  Auto
                </button>
              </div>
              <p className="text-[9px] text-gray-400">Auto: {PROBABILITY_BY_STAGE[formData.stage]}%</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigné à</label>
              <input
                type="text"
                placeholder="Assigné à..."
                value={formData.assignedTo || ""}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date de clôture prévue</label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white resize-none"
              rows={3}
              placeholder="Détails de l'opportunité..."
            />
          </div>

          <div className="text-sm text-blue-700 font-medium bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            Les champs précédés d'un <span className="font-bold">*</span> sont obligatoires.
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODALE DE DÉTAILS */}
      {selectedDeal && isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 transition-all">
          <div className="flex h-full max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Détails Deal</span>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedDeal.title}</h3>
                  <p className="text-sm font-bold text-blue-600">{selectedDeal.client}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase text-white ${STAGES.find((s) => s.id === selectedDeal.stage)?.color || "bg-gray-500"}`}>
                    {STAGES.find((s) => s.id === selectedDeal.stage)?.name}
                  </span>
                  <span className="text-lg font-black text-gray-800">
                    {selectedDeal.amount !== null && selectedDeal.amount !== undefined
                      ? `${Number(selectedDeal.amount).toLocaleString()} Ar`
                      : "Budget non défini"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Probabilité</span>
                    <span className="text-sm font-bold text-gray-700">
                      {selectedDeal.probability ?? PROBABILITY_BY_STAGE[selectedDeal.stage] ?? 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (selectedDeal.probability ?? PROBABILITY_BY_STAGE[selectedDeal.stage] ?? 0) >= 75
                          ? "bg-green-500"
                          : (selectedDeal.probability ?? PROBABILITY_BY_STAGE[selectedDeal.stage] ?? 0) >= 50
                            ? "bg-yellow-500"
                            : (selectedDeal.probability ?? PROBABILITY_BY_STAGE[selectedDeal.stage] ?? 0) >= 25
                              ? "bg-orange-500"
                              : "bg-red-500"
                      }`}
                      style={{ width: `${selectedDeal.probability ?? PROBABILITY_BY_STAGE[selectedDeal.stage] ?? 0}%` }}
                    />
                  </div>
                </div>

                {selectedDeal.description && (
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <h4 className="mb-2 text-[10px] font-bold uppercase text-blue-600">Description</h4>
                    <p className="text-sm leading-relaxed text-blue-800">{selectedDeal.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-[10px] font-bold uppercase text-gray-400">Date</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{formatDate(selectedDeal.date)}</p>
                  </div>
                  {selectedDeal.expectedCloseDate && (
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-[10px] font-bold uppercase text-gray-400">Clôture</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedDeal.expectedCloseDate)}</p>
                    </div>
                  )}
                </div>

                {selectedDeal.assignedTo && (
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-[10px] font-bold uppercase text-gray-400">Assigné à</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{selectedDeal.assignedTo}</p>
                  </div>
                )}

                {/* ✅ Créé par — même style que Projects */}
                {selectedDeal.createdBy && (
                  <div className="rounded-2xl bg-purple-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span className="text-[10px] font-bold uppercase text-purple-400">Créé par</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-700">
                        {selectedDeal.createdBy.name?.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold text-purple-700">
                        {selectedDeal.createdBy.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 pb-2">
                <button
                  onClick={() => openEditModal(selectedDeal)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4" /> Éditer
                </button>
                <button
                  onClick={() => askDeleteDeal(selectedDeal)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" /> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUPPRESSION */}
      {confirmOpen && dealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">Supprimer ce deal ?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Tu es sur le point de supprimer le deal <b>{dealToDelete.title}</b>. Cette action est irréversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
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

export default Pipeline;
