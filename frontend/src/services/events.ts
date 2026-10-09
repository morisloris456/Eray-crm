import api from './api';
import { CalendarEvent, ApiResponse } from '../types'; // Assure-toi que CalendarEvent est bien dans types.ts

export interface EventFilters {
  clientId?: number;
  projectId?: number;
  type?: string;
  status?: string;
  // Tu peux rajouter des filtres de dates si ton API gère startDate / endDate
}

export interface EventFormData {
  title: string;
  description?: string;
  location?: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  type: string;
  clientId: number;
  projectId?: number;
}

// Helper pour formater les données React vers le format attendu par l'API Symfony



const formatPayload = (data: any) => {
  const payload: Record<string, any> = {};

  // On ne mappe que ce qui est défini
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.type !== undefined) payload.type = data.type;
  if (data.date !== undefined) payload.date = data.date;

  const location = data.location ?? data.lieu;
  const duration = data.duration ?? data.duree;
  const status = data.status ?? data.statut;
  const clientId = data.clientId ?? data.client_id;
  const projectId = data.projectId ?? data.projet_id;

  if (location !== undefined) payload.lieu = location;
  if (duration !== undefined) payload.duree = Number(duration);
  if (status !== undefined) payload.statut = status;
  if (clientId !== undefined) payload.client_id = Number(clientId);
  if (projectId !== undefined && projectId !== null && projectId !== "") {
    payload.projet_id = Number(projectId);
  } else {
    payload.projet_id = null;
  }

  // 🔥 FIX FINAL POUR LE TIME
  if (data.time) {
    let finalTime = data.time;
    
    // Si c'est du type "13:00", on rajoute les secondes pour Symfony
    if (finalTime.length === 5) finalTime += ":00";

    if (finalTime.includes('T')) {
      // Si on a un "undefinedT...", on nettoie pour ne garder que l'heure
      if (finalTime.startsWith('undefined')) {
        payload.time = finalTime.split('T')[1];
      } else {
        payload.time = finalTime;
      }
    } else if (data.date && data.date !== "undefined") {
      // Si on a une vraie date, on concatène proprement
      payload.time = `${data.date}T${finalTime}`;
    } else {
      // Sinon on envoie juste l'heure pure
      payload.time = finalTime;
    }
  }

  return payload;
};

export const eventsService = {
  // GET ALL
  getAll: async (filters?: EventFilters): Promise<CalendarEvent[]> => {
    const response = await api.get<ApiResponse<CalendarEvent[]>>('/reservations', { params: filters });
    return response.data.data;
  },

  // GET ONE
  getById: async (id: number): Promise<CalendarEvent> => {
    const response = await api.get<ApiResponse<CalendarEvent>>(`/reservations/${id}`);
    return response.data.data;
  },

  // CREATE
  create: async (data: EventFormData): Promise<CalendarEvent> => {
    const payload = formatPayload(data);
    const response = await api.post<ApiResponse<CalendarEvent>>('/reservations', payload);
    return response.data.data;
  },

  // UPDATE
  update: async (id: number, data: Partial<EventFormData>): Promise<CalendarEvent> => {
    const payload = formatPayload(data);
    const response = await api.put<ApiResponse<CalendarEvent>>(`/reservations/${id}`, payload);
    return response.data.data;
  },

  // DELETE
  delete: async (id: number): Promise<void> => {
    await api.delete(`/reservations/${id}`);
  }
};