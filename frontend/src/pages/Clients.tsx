import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Save,
  Loader2,
  Building2,
  Trash2,
  X,
  MoreHorizontal,
  MapPin,
  Globe,
  Briefcase,
  Edit3,
  Calendar,
  Filter,
  ChevronDown,
  Users,
  FolderKanban,
  CalendarDays,
  Download,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useData, type Client } from "../context/DataContext";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

// ==============================
// CONFIGURATION
// ==============================
const CLIENT_STATUS = {
  Actif: { color: "bg-green-100 text-green-700", label: "Actif" },
  Inactif: { color: "bg-gray-100 text-gray-500", label: "Inactif" },
  Prospect: { color: "bg-blue-100 text-blue-700", label: "Prospect" },
  Ancien: { color: "bg-orange-100 text-orange-700", label: "Ancien" },
} as const;

type ClientStatusKey = keyof typeof CLIENT_STATUS;

const initialFormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "Actif" as ClientStatusKey,
  address: "",
  website: "",
  sector: "",
  notes: "",
};

const Clients = () => {
  const { user } = useAuth();
  const {
    clients,
    loadingClients,
    addClient,
    updateClient,
    deleteClient,
    projects,
    events,
  } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tous");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [filterMyClients, setFilterMyClients] = useState(false);
  const [filterByUser, setFilterByUser] = useState<number | "all">("all");
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unauthorizedOpen, setUnauthorizedOpen] = useState(false);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  const isOwner = (client: Client) => {
    if (!user) return false;
    if (isAdmin) return true;
    return client.createdBy?.id === user?.id;
  };

  // Collect unique users from clients list (for admin filter)
  const allUsers = useMemo(() => {
    const map = new Map<number, string>();
    clients.forEach((c) => {
      if (c.createdBy?.id && c.createdBy?.name) {
        map.set(c.createdBy.id, c.createdBy.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [clients]);

  const selectedUserName =
    filterByUser === "all"
      ? "Tous les utilisateurs"
      : (allUsers.find((u) => u.id === filterByUser)?.name ?? "Utilisateur");

  // ==============================
  // VALIDATION DU FORMULAIRE
  // ==============================
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Le nom est requis";
    }

    if (!formData.company.trim()) {
      errors.company = "L'entreprise est requise";
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "L'email n'est pas valide";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==============================
  // FONCTIONS D'EXPORT
  // ==============================
  const exportToCSV = () => {
    setIsExporting(true);

    const headers = [
      "Nom",
      "Entreprise",
      "Email",
      "Téléphone",
      "Statut",
      "Secteur",
      "Adresse",
      "Site web",
      "Notes",
      "Date de création",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredClients.map((client) =>
        [
          client.name,
          client.company,
          client.email,
          client.phone || "",
          client.status,
          client.sector || "",
          client.address || "",
          client.website || "",
          client.notes || "",
          new Date(client.createdAt).toLocaleDateString("fr-FR"),
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
      `clients_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 1000);
  };

  const exportToPDF = async () => {
    setIsExporting(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const content = filteredClients
      .map(
        (client) =>
          `${client.name} - ${client.company}\n` +
          `Email: ${client.email}\n` +
          `Téléphone: ${client.phone || "N/A"}\n` +
          `Statut: ${client.status}\n` +
          `Secteur: ${client.sector || "N/A"}\n` +
          `Créé le: ${new Date(client.createdAt).toLocaleDateString("fr-FR")}\n\n`,
      )
      .join("\n---\n\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clients_${new Date().toISOString().split("T")[0]}.txt`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 1500);
  };

  // ==============================
  // GESTION SÉLECTION MULTIPLE
  // ==============================
  const toggleClientSelection = (clientId: number) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
  };

  const selectAllClients = () => {
    const authorizedClients = filteredClients.filter((client) =>
      isOwner(client),
    );

    if (selectedClients.length === authorizedClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(authorizedClients.map((client) => client.id));
    }
  };

  const deleteSelectedClients = () => {
    if (selectedClients.length === 0) return;

    const unauthorizedClients = clients.filter(
      (client) => selectedClients.includes(client.id) && !isOwner(client),
    );

    if (unauthorizedClients.length > 0) {
      setUnauthorizedOpen(true);
      return;
    }

    setSelectedClient(null);
    setPendingDeleteIds(selectedClients);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    pendingDeleteIds.forEach((id) => {
      deleteClient(id);
    });

    setSelectedClients([]);
    setPendingDeleteIds([]);
    setConfirmOpen(false);

    if (selectedClient && pendingDeleteIds.includes(selectedClient.id)) {
      setSelectedClient(null);
    }
  };

  const handleCancelDelete = () => {
    setPendingDeleteIds([]);
    setConfirmOpen(false);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedClient(null);
    setIsEditing(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const normalizeWebsite = (url: string) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const getClientStats = (clientId: number) => {
    const clientProjects = projects.filter((p) => p.clientId === clientId);
    const clientEvents = events.filter((e) => e.clientId === clientId);

    return {
      projects: clientProjects.length,
      events: clientEvents.length,
    };
  };

  // ==============================
  // FILTERED CLIENTS
  // ==============================
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;

      const matchesStatus =
        statusFilter === "Tous" || client.status === statusFilter;

      // Filtre "Mes clients" — visible par tous
      const matchesMyClients =
        !filterMyClients || (user && client.createdBy?.id === user.id);

      // Filtre par utilisateur — admin seulement
      const matchesUserFilter =
        !isAdmin ||
        filterByUser === "all" ||
        client.createdBy?.id === filterByUser;

      return (
        matchesSearch && matchesStatus && matchesMyClients && matchesUserFilter
      );
    });
  }, [
    clients,
    searchTerm,
    statusFilter,
    filterMyClients,
    filterByUser,
    user,
    isAdmin,
  ]);

  // ==============================
  // STATS
  // ==============================
  const stats = useMemo(() => {
    return {
      total: clients.length,
      actifs: clients.filter((c) => c.status === "Actif").length,
      prospects: clients.filter((c) => c.status === "Prospect").length,
      inactifs: clients.filter((c) => c.status === "Inactif").length,
    };
  }, [clients]);

  // ==============================
  // ACTIONS
  // ==============================
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const clientData = {
        ...formData,
        website: normalizeWebsite(formData.website),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && editingClientId) {
        await updateClient(editingClientId, clientData);
      } else {
        await addClient({
          ...clientData,
          createdAt: new Date().toISOString(),
        });
      }

      setEditingClientId(null);
      closeModal();
    } catch (err) {
      console.error("ERROR SUBMIT:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(null);
    setEditingClientId(client.id);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone || "",
      status: client.status as ClientStatusKey,
      address: client.address || "",
      website: client.website || "",
      sector: client.sector || "",
      notes: client.notes || "",
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const confirmDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedClient(null);
    setPendingDeleteIds([id]);
    setConfirmOpen(true);
  };

  useEffect(() => {
    const close = () => {
      setShowFilters(false);
      setShowUserFilter(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <div className="space-y-6 text-left">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-linear-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm sm:p-8 text-left">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 backdrop-blur">
              <UserPlus className="h-3.5 w-3.5" />
              Annuaire clients
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-800">
              Gestion des Clients
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base font-medium">
              Centralisez vos contacts et optimisez le suivi de vos relations
              clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={isExporting || filteredClients.length === 0}
              className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-50 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              CSV
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExporting || filteredClients.length === 0}
              className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-50 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              PDF
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98]"
            >
              <UserPlus className="h-4 w-4" />
              Nouveau Client
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clients</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.actifs}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
              <div className="h-6 w-6 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Prospects</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.prospects}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactifs</p>
              <p className="text-2xl font-bold text-gray-600">
                {stats.inactifs}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
              <div className="h-6 w-6 rounded-full bg-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* BARRE D'OUTILS SELECTION MULTIPLE */}
      {selectedClients.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">
              {selectedClients.length} sélectionné(s)
            </span>
            <button
              onClick={selectAllClients}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {selectedClients.length === filteredClients.length
                ? "Désélectionner tout"
                : "Sélectionner tout"}
            </button>
            <button
              onClick={deleteSelectedClients}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* RECHERCHE + FILTRES */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Barre de recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, entreprise, email, secteur..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Toggle "Mes clients" */}
        <button
          onClick={() => {
            setFilterMyClients(!filterMyClients);
            // Si on active "mes clients", désactiver le filtre user admin
            if (!filterMyClients && isAdmin) setFilterByUser("all");
          }}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
            filterMyClients
              ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-100"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Mes clients
          {filterMyClients && (
            <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
              {filteredClients.length}
            </span>
          )}
        </button>

        {/* Filtre par statut */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>{statusFilter}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showFilters && (
            <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl">
              {["Tous", ...Object.keys(CLIENT_STATUS)].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowFilters(false);
                  }}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 ${
                    statusFilter === status
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtre par utilisateur — admin seulement */}
        {isAdmin && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowUserFilter(!showUserFilter)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                filterByUser !== "all"
                  ? "border-purple-400 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="max-w-[140px] truncate">{selectedUserName}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>

            {showUserFilter && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl">
                <button
                  onClick={() => {
                    setFilterByUser("all");
                    setFilterMyClients(false);
                    setShowUserFilter(false);
                  }}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 ${
                    filterByUser === "all"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
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
                      setFilterMyClients(false);
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
                  <p className="px-4 py-3 text-xs text-gray-400">
                    Aucun utilisateur trouvé
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Indicateur de filtres actifs */}
      {(filterMyClients || filterByUser !== "all") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            Filtres actifs :
          </span>
          {filterMyClients && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Mes clients
              <button
                onClick={() => setFilterMyClients(false)}
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
          <span className="text-xs text-gray-400">
            {filteredClients.length} résultat
            {filteredClients.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

     
{/* TABLE */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-250 w-full text-left">
            <thead>
              <tr className="bg-gray-50/70 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <th className="px-4 py-5">
                  <input
                    type="checkbox"
                    checked={
                      selectedClients.length === filteredClients.length &&
                      filteredClients.length > 0
                    }
                    onChange={selectAllClients}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-5">Client & Entreprise</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Secteur</th>
                <th className="px-6 py-5">Statut</th>

                <th className="px-6 py-5 text-center">Projets</th>
                <th className="px-6 py-5 text-center">RDV</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loadingClients ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    className="px-6 py-16 text-center"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const clientStats = getClientStats(client.id);
                  const statusStyle =
                    CLIENT_STATUS[client.status as keyof typeof CLIENT_STATUS];

                  return (
                    <tr
                      key={client.id}
                      data-client-id={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`group cursor-pointer transition-all hover:bg-blue-50/30 ${
                        selectedClients.includes(client.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td
                        className="px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          disabled={!isOwner(client)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleClientSelection(client.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 font-bold uppercase text-gray-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {client.name}
                            </p>
                            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
                              <Building2 className="h-3 w-3" />
                              {client.company}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 text-[11px] font-medium text-gray-500">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span className="max-w-52 truncate">
                              {client.email}
                            </span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                          {client.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              <a
                                href={normalizeWebsite(client.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="max-w-52 truncate text-blue-600 hover:underline"
                              >
                                {client.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {client.sector ? (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-3 w-3 text-gray-400" />
                            <span className="text-[11px] text-gray-600">
                              {client.sector}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyle.color}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-700">
                          <FolderKanban className="h-3.5 w-3.5" />
                          {clientStats.projects}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-600">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {clientStats.events}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOwner(client)) {
                                setUnauthorizedOpen(true);
                                return;
                              }
                              openEditModal(client);
                            }}
                            className="rounded-xl p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOwner(client)) {
                                setUnauthorizedOpen(true);
                                return;
                              }
                              confirmDelete(e, client.id);
                            }}
                            className="rounded-xl p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Aucun client trouvé
                      </h3>
                      <p className="text-sm text-gray-500">
                        Essaie un autre mot-clé ou modifie les filtres.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Modifier le client" : "Nouveau client"}
      >
        <form onSubmit={handleAddClient} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                * Nom complet
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name)
                    setFormErrors({ ...formErrors, name: "" });
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:bg-white ${
                  formErrors.name
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
              {formErrors.name && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.name}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                * Entreprise
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                * Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white"
              />
            </div>
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
                    status: e.target.value as ClientStatusKey,
                  })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white"
              >
                {Object.entries(CLIENT_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Secteur
              </label>
              <input
                type="text"
                value={formData.sector}
                onChange={(e) =>
                  setFormData({ ...formData, sector: e.target.value })
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white"
                placeholder="Ex: Technologie, Finance..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white"
              placeholder="Ex: Lot II M 35, Antananarivo"
            />
          </div>

          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Site web
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white"
              placeholder="exemple.com"
            />
          </div>

          <div className="space-y-1">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white"
              rows={4}
              placeholder="Informations supplémentaires sur le client..."
            />
          </div>

          <div className="text-sm text-blue-700 font-medium bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            Les champs précédés d'un{" "}
            <span className="font-bold text-gray-700">*</span> sont
            obligatoires.
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-200"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DRAWER DETAILS */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="flex h-full max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="border-b border-gray-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">
                    Détails Client
                  </span>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 p-6 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 text-2xl font-black text-white shadow-lg">
                  {selectedClient.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedClient.name}
                  </h3>
                  <p className="text-sm font-bold uppercase tracking-tight text-blue-600">
                    {selectedClient.company}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                      CLIENT_STATUS[
                        selectedClient.status as keyof typeof CLIENT_STATUS
                      ].color
                    }`}
                  >
                    {
                      CLIENT_STATUS[
                        selectedClient.status as keyof typeof CLIENT_STATUS
                      ].label
                    }
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getClientStats(selectedClient.id).projects}
                  </div>
                  <div className="text-xs font-medium text-blue-700">
                    Projets
                  </div>
                </div>

                <div className="rounded-2xl bg-purple-50 p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getClientStats(selectedClient.id).events}
                  </div>
                  <div className="text-xs font-medium text-purple-700">
                    Rendez-vous
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-4 rounded-3xl bg-gray-50 p-5">
                  <div>
                    <h4 className="mb-3 text-[10px] font-bold uppercase text-gray-400">
                      Coordonnées
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {selectedClient.email}
                        </span>
                      </div>
                      {selectedClient.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {selectedClient.phone}
                          </span>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {selectedClient.address}
                          </span>
                        </div>
                      )}
                      {selectedClient.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a
                            href={normalizeWebsite(selectedClient.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {selectedClient.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedClient.sector && (
                    <div className="border-t border-gray-200 pt-3">
                      <h4 className="mb-2 text-[10px] font-bold uppercase text-gray-400">
                        Secteur
                      </h4>
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {selectedClient.sector}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedClient.notes && (
                  <div className="rounded-3xl bg-blue-50 p-5">
                    <h4 className="mb-2 text-[10px] font-bold uppercase text-blue-600">
                      Notes
                    </h4>
                    <p className="text-sm leading-relaxed text-blue-800">
                      {selectedClient.notes}
                    </p>
                  </div>
                )}

                <div className="rounded-3xl bg-gray-50 p-5">
                  <h4 className="mb-3 text-[10px] font-bold uppercase text-gray-400">
                    Historique
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedClient.createdBy && (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Créé par{" "}
                          <span className="font-semibold text-gray-800">
                            {selectedClient.createdBy.name}
                          </span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Créé le{" "}
                        {new Date(selectedClient.createdAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Modifié le{" "}
                        {new Date(selectedClient.updatedAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 pb-2">
                {isOwner(selectedClient) ? (
                  <>
                    <button
                      onClick={() => openEditModal(selectedClient)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      Éditer
                    </button>
                    <button
                      onClick={(e) => confirmDelete(e, selectedClient.id)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </>
                ) : (
                  <div className="col-span-2 rounded-2xl bg-gray-50 border border-gray-200 py-3.5 text-center text-sm text-gray-500">
                    Vous n'êtes pas autorisé à modifier ce client
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">
              Confirmer la suppression
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tu es sur le point de supprimer le client{" "}
              <b>{clients.find((c) => c.id === pendingDeleteIds[0])?.name}</b>{" "}
              et toutes ses données associées. Cette action est irréversible.
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
              Vous ne pouvez modifier ou supprimer que les clients que vous avez
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

export default Clients;
