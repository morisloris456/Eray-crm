// Types centraux pour toute l'application

export interface User {
  id: number;
  name: string;
  email: string;
  picture?: string;
  provider?: "email" | "google";
  roles: string[];
  telephone?: string; 

}

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
}

export interface Deal {
  id: number;
  title: string;
  client: string;
  amount: string;
  stage: "lead" | "contact" | "proposal" | "won" | "lost";
  date: string;
  description?: string;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  client: string;
  date: string; // Format YYYY-MM-DD
  time: string;
  type: "Rendez-vous" | "Appel" | "Réunion";
  description?: string;
  project?: string;
  location?: string;
  duration?: number;
  status: "planifie" | "en_cours" | "termine" | "annule";
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  client: string;
  description: string;
  status: "en_cours" | "en_attente" | "termine" | "archive";
  progress: number; // 0-100
  startDate: string;
  endDate?: string;
  priority: "basse" | "moyenne" | "haute" | "critique";
  budget?: string;
  team?: string[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string;
  completedAt?: string;
}

// Types pour les formulaires
export interface ClientFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "Actif" | "Inactif" | "Prospect" | "Ancien";
  address: string;
  website: string;
  sector: string;
  notes: string;
}

export interface EventFormData {
  title: string;
  client: string;
  date: string;
  time: string;
  type: "Rendez-vous" | "Appel" | "Réunion";
  description: string;
  project?: string;
  location: string;
  duration?: number;
}

export interface ProjectFormData {
  title: string;
  client: string;
  description: string;
  status: "en_cours" | "en_attente" | "termine" | "archive";
  progress: number;
  startDate: string;
  endDate?: string;
  priority: "basse" | "moyenne" | "haute" | "critique";
  budget?: string;
  team?: string[];
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types pour les erreurs
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Types pour les notifications
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  time: string;
  read: boolean;
  action?: () => void;
  actionLabel?: string;
}

// Types pour les filtres et recherche
export interface ClientFilters {
  search: string;
  status: string;
  sector?: string;
}

export interface EventFilters {
  date: string;
  type?: string;
  client?: string;
}

export interface ProjectFilters {
  status: string;
  priority?: string;
  client?: string;
}

// Types pour les statistiques
export interface ClientStats {
  total: number;
  actifs: number;
  prospects: number;
  inactifs: number;
}

export interface ProjectStats {
  total: number;
  enCours: number;
  termines: number;
  enAttente: number;
  archives: number;
}

export interface DealStats {
  total: number;
  won: number;
  lost: number;
  pipeline: number;
  totalValue: number;
}
