import api from "./api";
import {
  Client,
  ClientFormData,
  ClientFilters,
  PaginatedResponse,
} from "../types";

// ===============================
// 🔧 HELPERS SAFE RESPONSE
// ===============================
const getData = <T>(response: any): T => {
  // supporte plusieurs formats backend:
  // - { data: ... }
  // - { data: { data: ... } }
  // - direct data
  return response?.data?.data ?? response?.data ?? response;
};

// ===============================
// CLIENT SERVICE
// ===============================
export const clientsService = {
  // -------------------------------
  // GET ALL CLIENTS
  // -------------------------------
  getAll: async (filters?: ClientFilters): Promise<Client[]> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status && filters.status !== "Tous")
      params.append("status", filters.status);
    if (filters?.sector) params.append("sector", filters.sector);

    const res = await api.get(`/clients?${params.toString()}`);

    const data = getData<Client[]>(res);

    if (!Array.isArray(data)) {
      console.error("CLIENTS API RESPONSE INVALID 👉", data);
      return [];
    }

    return data;
  },

  // -------------------------------
  // PAGINATION
  // -------------------------------
  getPaginated: async (
    page = 1,
    limit = 10,
    filters?: ClientFilters
  ): Promise<PaginatedResponse<Client>> => {
    const params = new URLSearchParams();

    params.append("page", String(page));
    params.append("limit", String(limit));

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status && filters.status !== "Tous")
      params.append("status", filters.status);
    if (filters?.sector) params.append("sector", filters.sector);

    const res = await api.get(`/clients/paginated?${params.toString()}`);

    return getData<PaginatedResponse<Client>>(res);
  },

  // -------------------------------
  // GET BY ID
  // -------------------------------
  getById: async (id: number): Promise<Client> => {
    const res = await api.get(`/clients/${id}`);
    return getData<Client>(res);
  },

  // -------------------------------
  // CREATE
  // -------------------------------
  create: async (data: ClientFormData): Promise<Client> => {
    const res = await api.post("/clients", data);
    return getData<Client>(res);
  },

  // -------------------------------
  // UPDATE
  // -------------------------------
  update: async (
    id: number,
    data: Partial<ClientFormData>
  ): Promise<Client> => {
    const res = await api.put(`/clients/${id}`, data);
    return getData<Client>(res);
  },

  // -------------------------------
  // DELETE
  // -------------------------------
  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  // -------------------------------
  // BULK DELETE
  // -------------------------------
  deleteMany: async (ids: number[]): Promise<void> => {
    await api.delete("/clients/bulk", { data: { ids } });
  },

  // -------------------------------
  // SEARCH
  // -------------------------------
  search: async (query: string, limit = 10): Promise<Client[]> => {
    const res = await api.get(
      `/clients/search?q=${query}&limit=${limit}`
    );

    const data = getData<Client[]>(res);

    return Array.isArray(data) ? data : [];
  },

  // -------------------------------
  // STATS
  // -------------------------------
  getStats: async (): Promise<{
    total: number;
    actifs: number;
    prospects: number;
    inactifs: number;
  }> => {
    const res = await api.get("/clients/stats");
    return getData(res);
  },

  // -------------------------------
  // EXPORT CSV
  // -------------------------------
  exportCSV: async (filters?: ClientFilters): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status && filters.status !== "Tous")
      params.append("status", filters.status);
    if (filters?.sector) params.append("sector", filters.sector);

    const res = await api.get(`/clients/export/csv?${params.toString()}`, {
      responseType: "blob",
    });

    return res.data;
  },

  // -------------------------------
  // EXPORT PDF
  // -------------------------------
  exportPDF: async (filters?: ClientFilters): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status && filters.status !== "Tous")
      params.append("status", filters.status);
    if (filters?.sector) params.append("sector", filters.sector);

    const res = await api.get(`/clients/export/pdf?${params.toString()}`, {
      responseType: "blob",
    });

    return res.data;
  },

  // -------------------------------
  // IMPORT CSV
  // -------------------------------
  importCSV: async (
    file: File
  ): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/clients/import/csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return getData(res);
  },
};