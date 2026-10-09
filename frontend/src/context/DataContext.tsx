import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { clientsService } from "../services/clients";
import { useEffect } from "react";
import { projectsService } from "../services/projects";
import { dealsService } from "../services/deals";
import { eventsService } from "../services/events";
import { useAuth } from "./AuthContext";

// --- TYPES ---
export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: "Actif" | "Inactif" | "Prospect" | "Ancien";
  address?: string;
  website?: string;
  sector?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    name: string;
  };
}

export interface Deal {
  id: number;
  title: string;
  client: string;

  client_id?: number;

  amount: number | string | null;

  stage: "lead" | "contact" | "proposal" | "won" | "lost";

  date: string;
  description?: string;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;

  createdAt: string;
  updatedAt: string;
  createdBy?: { id: number; name: string };
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  description: string;
  clientId: number;
  clientName: string;
  projectId: number;
  projectName: string;
  duration: number | null;
  status: string;
  createdBy?: { id: number; name: string };
}

export interface Project {
  id: number;
  title: string;
  dealId?: number;
  deal?: string;
  clientId: number;
  client_id?: number;
  client: string;
  description: string;
  status: "en_cours" | "en_attente" | "termine" | "archive";
  progress: number;
  startDate: string;
  endDate?: string;
  priority: "basse" | "moyenne" | "haute" | "critique";
  budget?: string;
  team?: string | string[];
  milestones: Milestone[];
  estimatedHours?: number;
  actualHours?: number;
  completionDate?: string;
  qualityScore?: number;
  retrospectiveNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: number; name: string };
}

export interface Milestone {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string;
  completedAt?: string;
}

export interface ProjectHistory {
  id: number;
  projectId: number;
  action: string;
  changes: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
  };
  timestamp: string;
  userId?: string;
}

export interface ProjectMetrics {
  estimatedHours?: number;
  actualHours?: number;
  completionDate?: string;
  qualityScore?: number;
  roi?: number;
  deadlineScore?: number;
  retrospectiveNotes?: string;
}

interface DataContextType {
  clients: Client[];
  loadingClients: boolean;
  deals: Deal[];
  loadingDeals: boolean;
  events: CalendarEvent[];
  loadingEvents: boolean;
  projects: Project[];
  loadingProjects: boolean;
  projectHistory: ProjectHistory[];
  addClient: (client: Omit<Client, "id">) => void;
  updateClient: (id: number, client: Partial<Client>) => void;
  deleteClient: (id: number) => void;
  addDeal: (deal: Omit<Deal, "id">) => void;
  deleteDeal: (id: number) => void;
  updateDeal: (id: number, data: Partial<Deal>) => void;
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  deleteEvent: (id: number) => void;
  updateEvent: (id: number, event: Partial<CalendarEvent>) => void;
  updateEventStatus: (id: number, status: string) => void;
  addProject: (project: Omit<Project, "id">) => void;
  updateProject: (id: number, project: Partial<Project>) => void;
  deleteProject: (id: number) => void;
  updateProjectProgress: (id: number, progress: number) => void;
  archiveProject: (id: number) => void;
  logProjectAction: (projectId: number, action: string, details?: any) => void;
  getProjectHistory: (projectId: number) => ProjectHistory[];
  calculateProjectROI: (projectId: number) => number;
  calculateDeadlineScore: (projectId: number) => number;
  getProjectMetrics: (projectId: number) => ProjectMetrics;

  askConfirm: (title: string, message: string, onConfirm: () => void) => void;

  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  };

  setConfirmDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      title: string;
      message: string;
      onConfirm: (() => void) | null;
    }>
  >;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Données initiales pour l'historique des projets
const INITIAL_PROJECT_HISTORY: ProjectHistory[] = [
  {
    id: 1001,
    projectId: 301,
    action: "Création du projet",
    changes: { description: "Projet initialisé avec budget de 15 000 Ar" },
    timestamp: "2026-01-25T10:00:00Z",
    userId: "system",
  },
  {
    id: 1002,
    projectId: 301,
    action: "Changement de statut",
    changes: {
      oldValue: "en_attente",
      newValue: "en_cours",
      description: "Passage en cours de développement",
    },
    timestamp: "2026-02-01T09:30:00Z",
    userId: "alice",
  },
  {
    id: 1003,
    projectId: 301,
    action: "Mise à jour du budget",
    changes: {
      oldValue: "12 000 Ar",
      newValue: "15 000 Ar",
      description: "Augmentation du budget suite à nouvelles fonctionnalités",
    },
    timestamp: "2026-02-15T14:20:00Z",
    userId: "alice",
  },
  {
    id: 1004,
    projectId: 302,
    action: "Création du projet",
    changes: { description: "Projet mobile créé avec priorité critique" },
    timestamp: "2026-03-05T11:00:00Z",
    userId: "system",
  },
  {
    id: 1005,
    projectId: 302,
    action: "Changement de statut",
    changes: {
      oldValue: "en_cours",
      newValue: "en_attente",
      description: "Mise en attente en attente de validation client",
    },
    timestamp: "2026-03-10T16:45:00Z",
    userId: "narisson",
  },
  {
    id: 1006,
    projectId: 303,
    action: "Clôture du projet",
    changes: { description: "Projet terminé avec succès, qualité: 4/5" },
    timestamp: "2026-03-31T17:30:00Z",
    userId: "alice",
  },
];

const mapApiClientToClient = (c: any): Client => ({
  id: c.id,
  name: c.nomClient,
  company: c.nomEntreprise,
  email: c.email,
  phone: c.telephone,
  status: mapStatutActif(c.statutActif),
  address: c.adresse,
  website: c.website,
  sector: c.secteur,
  notes: c.notes,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  createdBy: c.createdBy
    ? {
        id: c.createdBy.id,
        name: c.createdBy.name,
      }
    : undefined,
});

const mapApiProjectToProject = (p: any): Project => {
  // 1. Détection ultra-large des dates (Symfony peut renvoyer date_fin ou dateFin)
  const rawStartDate = p?.date_debut || p?.dateDebut || p?.startDate || "";
  const rawEndDate = p?.date_fin || p?.dateFin || p?.endDate || "";

  const formatSafeDate = (dateVal: any) => {
    if (!dateVal) return "";
    // Gère le format ISO (2026-04-29T...)
    if (typeof dateVal === "string") return dateVal.split("T")[0];
    // Gère l'objet DateTime de certains sérialiseurs PHP ({date: "2026-04-29 ..."})
    if (typeof dateVal === "object" && dateVal.date)
      return dateVal.date.split(" ")[0];
    return "";
  };

  return {
    id: p?.id ?? 0,
    title: p?.nom ?? p?.title ?? "Sans nom",

    // 2. IMPORTANT : On cherche l'ID du client dans l'objet imbriqué OU à la racine
    // Symfony/API Platform renvoie souvent { client: { id: 2, nomClient: '...' } }
    clientId: p?.client?.id || p?.client_id || p?.clientId || 0,

    // 3. Récupération du nom du client
    client:
      p?.client?.nomClient || p?.clientName || p?.nomClient || "Client inconnu",

    dealId: p?.deal?.id || p?.deal_id || p?.dealId || undefined,

    deal: p?.deal?.title || p?.dealTitle || "Aucun deal",

    description: p?.description ?? "",
    status: p?.statut ?? p?.status ?? "en_cours",
    priority: p?.priorite ?? p?.priority ?? "moyenne",
    progress: p?.progress ?? 0,
    budget: p?.budget ? String(p.budget) : "",

    // 4. On applique le formatage aux dates détectées
    startDate: formatSafeDate(rawStartDate),
    endDate: formatSafeDate(rawEndDate),

    team: p?.equipe ?? "",
    createdAt: p?.createdAt ?? "",
    updatedAt: p?.updatedAt ?? "",
    milestones: [],
    createdBy: p?.createdBy // ← ajout
      ? { id: p.createdBy.id, name: p.createdBy.name }
      : undefined,
  };
};

const mapStatutActif = (statut: string): Client["status"] => {
  switch (statut?.toLowerCase()) {
    case "actif":
      return "Actif";
    case "inactif":
      return "Inactif";
    case "prospect":
      return "Prospect";
    case "ancien":
      return "Ancien";
    default:
      return "Prospect";
  }
};

const reverseMapStatut = (status: Client["status"]): string => {
  return status.toLowerCase();
};

const mapEventStatus = (status: string): CalendarEvent["status"] => {
  switch (status?.toLowerCase()) {
    case "planifie":
    case "planifié":
      return "planifie";
    case "en_cours":
    case "en cours":
      return "en_cours";
    case "termine":
    case "terminé":
      return "termine";
    case "annule":
    case "annulé":
      return "annule";
    default:
      return "planifie";
  }
};

const mapApiEventToEvent = (e: any): CalendarEvent => {
  // On récupère la chaîne brute (ex: "2026-05-07T14:00:00+00:00")
  const rawTime = e.time || "";

  let formattedTime = "10:00"; // Valeur par défaut

  if (rawTime.includes("T")) {
    // On coupe après le 'T' -> "14:00:00+00:00"
    // Puis on prend les 5 premiers caractères -> "14:00"
    formattedTime = rawTime.split("T")[1].substring(0, 5);
  } else if (rawTime.length >= 5) {
    // Au cas où le back renvoie juste "14:00:00"
    formattedTime = rawTime.substring(0, 5);
  }

  return {
    id: e.id,
    title: e.title || "Sans titre",
    date: e.date ? e.date.split("T")[0] : "",
    time: formattedTime, // 🔥 ICI : On ne garde que "HH:mm"
    location: e.lieu || e.location || "",
    type: e.type || "Réunion",
    description: e.description || "",
    clientId: e.client?.id || e.client_id || 0,
    clientName: e.client?.nomClient || e.client?.name || "Client inconnu",
    projectId: e.projet?.id || e.projet_id || 0,
    projectName: e.projet?.nom || e.projet?.title || "Projet inconnu",
    duration: e.duree ?? e.duration ?? null,
    status: mapEventStatus(e.statut ?? e.status),
    createdBy: e.createdBy // ← ajout
      ? { id: e.createdBy.id, name: e.createdBy.name }
      : undefined,
  };
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectHistory, setProjectHistory] = useState<ProjectHistory[]>(
    INITIAL_PROJECT_HISTORY,
  ); // État pour l'historique
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const { user } = useAuth();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const askConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      try {
        const data = await clientsService.getAll();

        setClients(data.map(mapApiClientToClient));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const data = await projectsService.getAll();
        setProjects(data.map(mapApiProjectToProject));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user]);

  useEffect(() => {
    const fetchDeals = async () => {
      if (!user) return;
      try {
        const data = await dealsService.getAll();

        const normalizedDeals = data.map((d: any) => ({
          id: d.id,
          title: d.title,

          client:
            typeof d.client === "string"
              ? d.client
              : d.client?.nomClient || "Client inconnu",

          client_id: d.client_id ?? d.client?.id,

          amount: d.amount !== null && d.amount !== undefined && d.amount !== "" ? Number(d.amount) : null,

          stage: d.stage,
          date: d.date,
          description: d.description,
          probability: d.probability,
          expectedCloseDate: d.expectedCloseDate,
          assignedTo: d.assignedTo,

          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          createdBy: d.createdBy
            ? { id: d.createdBy.id, name: d.createdBy.name }
            : undefined,
        }));

        setDeals(normalizedDeals);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDeals(false);
      }
    };

    fetchDeals();
  }, [user]);

  useEffect(() => {
    const fetchEvents = async () => {
      // Si pas d'utilisateur, on arrête le chargement immédiatement
      if (!user) {
        setLoadingEvents(false);
        return;
      }

      try {
        const data = await eventsService.getAll();
        setEvents(data.map(mapApiEventToEvent));
      } catch (err) {
        console.error("Erreur events:", err);
        // Optionnel: toast.error("Impossible de charger les événements");
      } finally {
        // S'exécute toujours (après le succès OU l'erreur)
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user]);

  useEffect(() => {
    const now = new Date();

    // 1. On identifie les événements qui DOIVENT passer en "terminé"
    const eventsToUpdate = events.filter((event) => {
      if (!event.date) return false;

      // Condition critique : on ignore si déjà "annule" ou déjà "termine"
      if (event.status === "annule" || event.status === "termine") return false;

      const eventDateTime = new Date(`${event.date}T${event.time || "00:00"}`);

      // Si la date est passée, on doit le marquer comme terminé
      return eventDateTime < now;
    });

    // 2. Si rien à mettre à jour, on s'arrête là (évite les boucles infinies)
    if (eventsToUpdate.length === 0) return;

    // 3. Mise à jour
    eventsToUpdate.forEach((event) => {
      updateEvent(event.id, {
        ...event,
        status: "termine",
      });
    });
    // On ne met pas [events] seul en dépendance si updateEvent modifie 'events' sans précaution
    // Mais avec le filtre ci-dessus, le prochain cycle trouvera 0 événement à modifier.
  }, [events]);

  // ACTIONS CLIENTS
  const addClient = async (newClient: Omit<Client, "id">) => {
    try {
      const payload = {
        nomClient: newClient.name,
        nomEntreprise: newClient.company,
        email: newClient.email,
        telephone: newClient.phone,
        statutActif: reverseMapStatut(newClient.status),
        adresse: newClient.address,
        website: newClient.website,
        secteur: newClient.sector,
        notes: newClient.notes,
      };

      const created = await clientsService.create(payload as any);

      const formattedClient = mapApiClientToClient(created);

      setClients((prev) => [formattedClient, ...prev]);

      toast.success(`${formattedClient.name} ajouté avec succès`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout du client");
    }
  };

  const deleteClient = async (id: number) => {
    const clientToDelete = clients.find((c) => c.id === id);
    if (!clientToDelete) return;

    try {
      await clientsService.delete(id);

      setClients((prev) => prev.filter((c) => c.id !== id));
      setDeals((prev) => prev.filter((d) => d.client !== clientToDelete.name));
      setEvents((prev) => prev.filter((e) => e.clientName !== clientToDelete.name));

      toast.success(`Client "${clientToDelete.name}" supprimé`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const updateClient = async (id: number, updatedData: Partial<Client>) => {
    try {
      const existing = clients.find((c) => c.id === id);
      if (!existing) return;

      const merged = { ...existing, ...updatedData };

      const payload = {
        nomClient: merged.name,
        nomEntreprise: merged.company,
        email: merged.email,
        telephone: merged.phone,
        statutActif: reverseMapStatut(merged.status),
        adresse: merged.address,
        website: merged.website,
        secteur: merged.sector,
        notes: merged.notes,
      };

      const updated = await clientsService.update(id, payload as any);

      setClients((prev) =>
        prev.map((c) => (c.id === id ? mapApiClientToClient(updated) : c)),
      );

      toast.success("Client mis à jour !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // ACTIONS DEALS (PIPELINE)
  const addDeal = async (newDeal: any) => {
    try {
      const payload = {
        title: newDeal.title,
        client_id: Number(newDeal.client_id || newDeal.clientId),
        amount: newDeal.amount !== "" && newDeal.amount !== null ? parseFloat(newDeal.amount) : null,
        stage: newDeal.stage,
        date: newDeal.date,
        description: newDeal.description,
        probability: newDeal.probability,
        expectedCloseDate: newDeal.expectedCloseDate,
        assignedTo: newDeal.assignedTo,
      };

      const created = await dealsService.create(payload);

      // NORMALISATION OBLIGATOIRE
      const normalizedDeal: Deal = {
        id: created.id,
        title: created.title,

        client:
          typeof created.client === "string"
            ? created.client
            : created.client?.nomClient || "Client inconnu",

        client_id: created.client_id ?? created.client?.id,

        amount: created.amount !== null && created.amount !== undefined ? Number(created.amount) : null,
        stage: created.stage,
        date: created.date,
        description: created.description,
        probability: created.probability,
        expectedCloseDate: created.expectedCloseDate,
        assignedTo: created.assignedTo,

        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        createdBy: created.createdBy
          ? { id: created.createdBy.id, name: created.createdBy.name }
          : undefined,
      };

      setDeals((prev) => [normalizedDeal, ...prev]);

      toast.success("Deal créé !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur création deal");
    }
  };

  const updateDeal = async (id: number, updatedData: Partial<Deal>) => {
    try {
      const updated = await dealsService.update(id, updatedData as any);

      const normalizedDeal: Deal = {
        id: updated.id,
        title: updated.title,

        client:
          typeof updated.client === "string"
            ? updated.client
            : updated.client?.nomClient || "Client inconnu",

        client_id: updated.client_id ?? updated.client?.id,

        amount: updated.amount !== null && updated.amount !== undefined ? Number(updated.amount) : null,
        stage: updated.stage,
        date: updated.date,
        description: updated.description,
        probability: updated.probability,
        expectedCloseDate: updated.expectedCloseDate,
        assignedTo: updated.assignedTo,

        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        createdBy: updated.createdBy        
        ? { id: updated.createdBy.id, name: updated.createdBy.name }
        : undefined,
      };

      setDeals((prev) => prev.map((d) => (d.id === id ? normalizedDeal : d)));

      toast.success("Deal mis à jour !");
    } catch (err) {
      console.error("ERREUR updateDeal:", err);
      toast.error("Erreur update deal");
    }
  };

  const deleteDeal = async (id: number) => {
    try {
      const dealToDelete = deals.find((d) => d.id === id);

      await dealsService.delete(id);

      setDeals((prev) => prev.filter((d) => d.id !== id));

      toast.success(`Deal "${dealToDelete?.title}" supprimé`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression deal");
    }
  };

  // --- ACTIONS AGENDA ---

  const addEvent = async (newEvent: any) => {
    const payload = {
      title: newEvent.title,
      description: newEvent.description || "",
      lieu: newEvent.location || "",
      type: newEvent.type || "Réunion",
      client_id: newEvent.clientId ? Number(newEvent.clientId) : null,
      projet_id: newEvent.projectId ? Number(newEvent.projectId) : null,
      date: newEvent.date,
      time: `${newEvent.date}T${newEvent.time}:00`,
      duree: newEvent.duration != null ? Number(newEvent.duration) : null,
      statut: newEvent.status || "planifie",
    };

    try {
      const response = await eventsService.create(payload as any);

      const formatted = mapApiEventToEvent(response);
      setEvents((prev) => [formatted, ...prev]);

      toast.success("Événement ajouté !");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Erreur lors de la création";

      toast.error(errorMsg);
    }
  };

  const updateEvent = async (id: number, updatedData: any) => {
    try {
      const existingEvent = events.find((e) => e.id === id);
      if (!existingEvent) return;

      const eventDate = updatedData.date || existingEvent.date;
      let timeStr = updatedData.time || existingEvent.time;

      if (timeStr && timeStr.length === 5) {
        timeStr += ":00";
      }

      const payload = {
        title: updatedData.title ?? existingEvent.title,
        description: updatedData.description ?? existingEvent.description,
        lieu: updatedData.location ?? existingEvent.location,
        type: updatedData.type ?? existingEvent.type,

        client_id:
          updatedData.clientId !== undefined
            ? updatedData.clientId
              ? Number(updatedData.clientId)
              : null
            : existingEvent.clientId,

        projet_id:
          updatedData.projectId !== undefined
            ? updatedData.projectId
              ? Number(updatedData.projectId)
              : null
            : existingEvent.projectId,

        date: eventDate,
        time: `${eventDate}T${timeStr}`,
        duree:
          updatedData.duration != null
            ? Number(updatedData.duration)
            : (existingEvent.duration ?? null),
        statut: updatedData.status || existingEvent.status || "planifie",
      };

      const response = await eventsService.update(id, payload as any);
      const formatted = mapApiEventToEvent(response);

      setEvents((prev) => prev.map((e) => (e.id === id ? formatted : e)));

      toast.success("Événement mis à jour !");
    } catch (err) {
      toast.error("Erreur modification événement");
    }
  };

  const updateEventStatus = async (id: number, status: string) => {
    try {
      const updated = (await eventsService.update(id, { status } as any)) as any;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: mapEventStatus(updated.statut || updated.status) }
            : e,
        ),
      );
      toast.success("Statut mis à jour !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur changement statut");
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      const eventToDelete = events.find((e) => e.id === id);

      await eventsService.delete(id);

      setEvents((prev) => prev.filter((e) => e.id !== id));

      toast.success(`Événement "${eventToDelete?.title}" supprimé`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression de l'événement");
    }
  };

  // --- ACTIONS PROJETS ---
  const addProject = async (newProject: any) => {
    try {
      const payload = {
        nom: newProject.title,
        description: newProject.description,
        statut: newProject.status,
        priorite: newProject.priority,
        progress: newProject.progress || 0,
        budget: newProject.budget !== "" ? parseFloat(newProject.budget) : 0,
        date_debut: newProject.startDate,
        date_fin: newProject.endDate,
        equipe: newProject.team || "",
        client_id: Number(newProject.clientId),
        deal_id: newProject.dealId ? Number(newProject.dealId) : null,
      };

      const created = await projectsService.create(payload as any);

      // On transforme la réponse de l'API
      const formatted = mapApiProjectToProject(created);

      // --- CORRECTION ICI ---
      // 1. Si l'API ne renvoie pas le clientId ou le nom du client, on les réinjecte
      if (!formatted.clientId || formatted.clientId === 0) {
        formatted.clientId = Number(newProject.clientId);
      }

      if (formatted.client === "Client inconnu") {
        const clientAssocie = clients.find((c) => c.id === formatted.clientId);
        if (clientAssocie) formatted.client = clientAssocie.name;
      }

      // 2. Gestion de la date de fin (si elle est vide dans la réponse API)
      if (!formatted.endDate && newProject.endDate) {
        formatted.endDate = newProject.endDate;
      }

      setProjects((prev) => [formatted, ...prev]);
      toast.success("Projet créé !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur création projet");
    }
  };

  const updateProject = async (id: number, updatedData: any) => {
    try {
      const payload = {
        nom: updatedData.title,
        description: updatedData.description,
        statut: updatedData.status,
        priorite: updatedData.priority,
        progress: updatedData.progress,
        budget:
          updatedData.budget !== "" ? parseFloat(updatedData.budget) : null,
        dateDebut: updatedData.startDate || null,
        dateFin: updatedData.endDate || null,
        equipe: updatedData.team || "",
        client_id: updatedData.clientId ? Number(updatedData.clientId) : null,
        deal_id: updatedData.dealId ? Number(updatedData.dealId) : null,
      };

      const response = (await projectsService.update(id, payload as any)) as any;

      // Si la réponse est vide (undefined), on reconstruit l'objet à la main
      // pour ne pas perdre les données du formulaire
      let finalProject;

      if (response) {
        finalProject = mapApiProjectToProject(response);
      } else {
        // PLAN B : On fusionne l'ancien projet avec les nouvelles saisies
        const oldProject = projects.find((p) => p.id === id);
        finalProject = {
          ...oldProject,
          ...updatedData,
          id, // On s'assure de garder le bon ID
        };
      }

      // Double vérification pour le nom du client
      if (
        (!finalProject.client || finalProject.client === "Client inconnu") &&
        updatedData.clientId
      ) {
        const clientAssocie = clients.find(
          (c) => c.id === Number(updatedData.clientId),
        );
        if (clientAssocie) finalProject.client = clientAssocie.name;
      }

      setProjects((prev) => prev.map((p) => (p.id === id ? finalProject : p)));
      toast.success("Projet mis à jour");
    } catch (err) {
      console.error("Erreur lors de l'update:", err);
      toast.error("Erreur update projet");
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const projectToDelete = projects.find((p) => p.id === id);

      await projectsService.delete(id);

      setProjects((prev) => prev.filter((p) => p.id !== id));

      toast.success(`Projet "${projectToDelete?.title}" supprimé`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression projet");
    }
  };

  const updateProjectProgress = (id: number, progress: number) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              progress,
              status:
                progress === 100
                  ? "termine"
                  : project.status === "archive"
                    ? "archive"
                    : "en_cours",
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    );
    toast.success("Progression mise à jour !");
  };

  const archiveProject = (id: number) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              status: "archive" as const,
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    );
    toast.success("Projet archivé !");
  };

  // --- FONCTIONS D'AUDIT ET PERFORMANCE ---
  const logProjectAction = (
    projectId: number,
    action: string,
    details?: any,
  ) => {
    const historyEntry: ProjectHistory = {
      id: Date.now(),
      projectId,
      action,
      changes: details || { description: action },
      timestamp: new Date().toISOString(),
      userId: "current-user", // À remplacer par l'utilisateur connecté
    };
    setProjectHistory((prev) => [historyEntry, ...prev]);
  };

  const getProjectHistory = (projectId: number): ProjectHistory[] => {
    return projectHistory
      .filter((entry) => entry.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  };

  const calculateProjectROI = (projectId: number): number => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !project.budget || !project.actualHours) return 0;

    const budget = parseInt(project.budget.replace(/[^0-9]/g, "")) || 0;
    const hourlyRate = budget / (project.estimatedHours || 100); // Taux horaire estimé
    const actualCost = project.actualHours * hourlyRate;

    return actualCost > 0 ? Math.round((budget / actualCost) * 100) / 100 : 0;
  };

  const calculateDeadlineScore = (projectId: number): number => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !project.endDate) return 50; // Score neutre si pas de date de fin

    const today = new Date();
    const endDate = new Date(project.endDate);
    const completionDate = project.completionDate
      ? new Date(project.completionDate)
      : today;

    if (project.status === "termine") {
      const daysDiff = Math.ceil(
        (completionDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff <= 0) return 100; // Terminé à temps ou en avance
      if (daysDiff <= 7) return 80; // 1 semaine de retard
      if (daysDiff <= 14) return 60; // 2 semaines de retard
      return 40; // Plus de 2 semaines de retard
    }

    // Pour les projets en cours, calcul basé sur la date actuelle
    const daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysRemaining < 0) return 20; // En retard
    if (daysRemaining <= 7) return 60; // Urgent
    if (daysRemaining <= 30) return 80; // Bon temps
    return 90; // Excellent temps
  };

  const getProjectMetrics = (projectId: number): ProjectMetrics => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return {};

    return {
      estimatedHours: project.estimatedHours,
      actualHours: project.actualHours,
      completionDate: project.completionDate,
      qualityScore: project.qualityScore,
      roi: calculateProjectROI(projectId),
      deadlineScore: calculateDeadlineScore(projectId),
      retrospectiveNotes: project.retrospectiveNotes,
    };
  };

  return (
    <DataContext.Provider
      value={{
        clients,
        loadingClients,
        deals,
        loadingDeals,
        events,
        loadingEvents,
        projects,
        loadingProjects,
        projectHistory,
        addClient,
        updateClient,
        deleteClient,
        addDeal,
        deleteDeal,
        updateDeal,
        addEvent,
        deleteEvent,
        updateEvent,
        updateEventStatus,
        addProject,
        updateProject,
        deleteProject,
        updateProjectProgress,
        archiveProject,
        logProjectAction,
        getProjectHistory,
        calculateProjectROI,
        calculateDeadlineScore,
        getProjectMetrics,

        askConfirm,
        confirmDialog,
        setConfirmDialog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error(
      "useData doit être utilisé à l'intérieur d'un DataProvider",
    );
  }
  return context;
};
