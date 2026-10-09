import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { authService } from "../services/auth";
import { User } from "../types";
import { clientsService } from "../services/clients";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, telephone?: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// --- UTILITAIRES DE VALIDATION ---
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password: string) =>
  password.length >= 6 && /[A-Z]/.test(password) && /[0-9]/.test(password);

const isValidPhone = (phone: string) => /^[0-9]{10}$/.test(phone);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Persistance : Récupération de la session au chargement avec vérification de santé
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("crm_user");
      const token = localStorage.getItem("token");

      if (savedUser && token) {
        try {
          // On définit l'utilisateur localement d'abord pour un ressenti rapide (optimistic)
          setUser(JSON.parse(savedUser));
          
          // --- LE TEST DE SANTÉ ---
          // On tente de récupérer les clients. 
          // Si le token est expiré, l'intercepteur 401 gérera le nettoyage.
          await clientsService.getAll();
        } catch (err: any) {
          // On ne nettoie ici que SI l'intercepteur n'a pas déjà fait le travail (erreur réseau par exemple)
          if (err.response?.status !== 401) {
            console.error("Erreur santé session:", err);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // 2. Connexion (Login)
  const login = async (email: string, password: string) => {
    // Validations locales avant l'appel API
    if (!isValidEmail(email)) {
      toast.error("Format d'email invalide.");
      throw new Error("Invalid email");
    }
    if (!isValidPassword(password)) {
      toast.error(
        "Le mot de passe doit contenir 6 caractères, une majuscule et un chiffre."
      );
      throw new Error("Invalid password");
    }

    try {
      // Appel au service qui gère le endpoint /login_check
      const response = await authService.login({ email, password });

      // Stockage des infos retournées par Symfony
      localStorage.setItem("token", response.token);
      localStorage.setItem("crm_user", JSON.stringify(response.user));

      setUser(response.user);
      
      const userName = response.user?.name || "Utilisateur";
      toast.success(`Content de vous revoir, ${userName} !`);
      
      if (!response.user) {
        console.warn("User data missing from login response. This might be a backend configuration issue in production.");
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      const message = err.response?.data?.error || err.response?.data?.message || "Identifiants incorrects.";
      toast.error(message);
      throw err;
    }
  };

  // 3. Inscription (Register)
  const register = async (name: string, email: string, password: string, telephone?: string) => {
    if (!name || name.trim().length < 2) {
      toast.error("Le nom est trop court.");
      throw new Error("Invalid name");
    }
  
    if (!isValidEmail(email)) {
      toast.error("Email invalide.");
      throw new Error("Invalid email");
    }
  
    if (telephone && !isValidPhone(telephone)) {
      toast.error("Le numéro de téléphone doit contenir exactement 10 chiffres.");
      throw new Error("Invalid phone");
    }
  
    try {
      await authService.register({
        name,
        email,
        password,
        telephone, 
      });
  
      await login(email, password);
  
      toast.success("Compte créé avec succès ! Bienvenue.");
    } catch (err: any) {
      console.error("Register Error:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Erreur lors de l'inscription.";
      toast.error(errorMessage);
      throw err;
    }
  };
  // 4. Google Login
  // 4. Google Login
  // Ajoute "googleToken: string" ici
  const loginWithGoogle = async (googleToken: string) => {
    try {
      // Et passe le token à ton service
      const response = await authService.loginWithGoogle(googleToken);

      localStorage.setItem("token", response.token);
      localStorage.setItem("crm_user", JSON.stringify(response.user));

      setUser(response.user);
      toast.success("Connexion Google réussie.");
    } catch (err: any) {
      toast.error("La connexion Google a échoué.");
      throw err;
    }
  };

  // 5. Déconnexion (Logout)
  const logout = async () => {
    try {
      // On tente d'avertir le backend
      await authService.logout();
    } catch (err) {
      console.warn("Backend logout failed, forcing local logout.");
    } finally {
      // Nettoyage impératif du navigateur
      localStorage.removeItem("token");
      localStorage.removeItem("crm_user");
      setUser(null);
      toast.info("Session terminée.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        setUser,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {/* On n'affiche l'app que quand la vérification du localStorage est finie */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
};
