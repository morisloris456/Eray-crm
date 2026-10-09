import api from './api';
import { User, ApiResponse } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  telephone?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Connexion
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/login_check', {
      username: credentials.email, 
      password: credentials.password
    });

    // On retourne directement response.data car il contient déjà {token, user}
    return response.data; 
  },

  // Inscription
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/register', data);
    
    // Même logique de sécurité pour le token
    const result = response.data.data || response.data;
    return result;
  },

  loginWithGoogle: async (token: string): Promise<AuthResponse> => {
    // On envoie le token Google à la route de ton contrôleur Symfony
    const response = await api.post('/auth/google', { token }); 
    return response.data;
  },
  // 👆 FIN DE L'AJOUT 👆



  
  // Déconnexion uniquement locale (le JWT ne peut pas être invalidé sur le serveur sans liste noire)
  logout: async (): Promise<void> => {
    // On ne fait plus d'appel api.post('/auth/logout') qui génère la 404
    return Promise.resolve();
  },

  // Rafraîchir le token
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return response.data.data;
  },

  // Vérifier le token
  verifyToken: async (): Promise<{ valid: boolean }> => {
    const response = await api.get<ApiResponse<{ valid: boolean }>>('/auth/verify');
    return response.data.data;
  },

  // Demander la réinitialisation du mot de passe
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  // Réinitialiser le mot de passe
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  // Changer le mot de passe
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  // Mettre à jour le profil
  updateProfile: async (data: {
    name: string;
    email: string;
    telephone?: string | null;
  }): Promise<{ user: User }> => {
    const response = await api.put('/profile/update', data);
    return response.data;
  },

  // Supprimer le compte
  deleteAccount: async (): Promise<void> => {
    await api.delete('/auth/account');
  },

  uploadPicture: async (formData: FormData): Promise<{ picture: string }> => {
    const response = await api.post('/user/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
