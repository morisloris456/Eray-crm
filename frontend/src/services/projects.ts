import api from './api';
import { Project, ProjectFormData, ApiResponse } from '../types';

export const projectsService = {

  // 🔹 Récupérer tous les projets
  getAll: async (filters?: { status?: string; priority?: string }): Promise<Project[]> => {
    const params = new URLSearchParams();

    // ⚠️ Adapter aux noms Symfony
    if (filters?.status && filters.status !== 'Tous') {
      params.append('statut', filters.status);
    }
    if (filters?.priority) {
      params.append('priorite', filters.priority);
    }

    const response = await api.get<ApiResponse<Project[]>>(`/projets?${params}`);
    return response.data.data;
  },

  // 🔹 Récupérer un projet par ID
  getById: async (id: number): Promise<Project> => {
    const response = await api.get<ApiResponse<Project>>(`/projets/${id}`);
    return response.data.data;
  },

  // 🔹 Créer un projet
  create: async (data: ProjectFormData): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>('/projets', data);
    return response.data.data;
  },

  // 🔹 Mettre à jour un projet
  update: async (id: number, data: Partial<ProjectFormData>): Promise<void> => {
    await api.put(`/projets/${id}`, data);
  },

  // 🔹 Supprimer un projet
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projets/${id}`);
  },

  // 🔹 Changer statut / priorité (route Symfony existante)
  changeStatus: async (
    id: number,
    data: { statut?: string; priorite?: string }
  ): Promise<Project> => {
    const response = await api.patch<ApiResponse<Project>>(
      `/projets/${id}/change-statut`,
      data
    );
    return response.data.data;
  }
};