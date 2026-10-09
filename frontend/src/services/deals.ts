import api from './api';
import { Deal, ApiResponse } from '../types';

export interface DealFilters {
  stage?: string;
  client?: string;
  assignedTo?: string;
}

export interface DealFormData {
  title: string;
  client_id: number; 
  amount: number;     
  stage: Deal['stage'];
  date: string;
  description?: string;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
}

export const dealsService = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/deals');
    return response.data.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/deals/${id}`);
    return response.data.data;
  },

  create: async (data: DealFormData): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/deals', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<DealFormData>): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(`/deals/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/deals/${id}`);
  }
};