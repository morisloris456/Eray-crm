import api from "./api";
import { User } from "../types";

/**
 * Interface utilisateur côté frontend
 */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roles?: string[];
}

/**
 * Service Users CRM
 */
export const userService = {
  // 📌 GET ALL USERS (ADMIN)
  getUsers: async (): Promise<User[]> => {
    const response = await api.get("/users");

    return response.data.data;
  },

  // 📌 GET ONE USER
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);

    return response.data.data;
  },

  // 📌 CREATE USER (ADMIN)
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post("/users", data);

    return response.data.data;
  },

  // 📌 UPDATE USER (ADMIN)
  updateUser: async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);

    return response.data.data;
  },

  // 📌 DELETE USER (ADMIN)
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // 📌 UPLOAD PROFILE PICTURE
  uploadPicture: async (formData: FormData): Promise<{ picture: string }> => {
    const response = await api.post("/user/upload-picture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // 📌 GET CURRENT USER (ME)
getMe: async (): Promise<User> => {
  const response = await api.get("/me");
  return response.data.data;
},

};