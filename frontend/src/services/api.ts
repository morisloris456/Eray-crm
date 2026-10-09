import axios from 'axios';

const api = axios.create({
  // Recommandé : définir VITE_API_URL dans l’environnement (dev/prod)
  // Éviter une fallback vers localhost qui casse en prod.
  baseURL: import.meta.env.VITE_API_URL,
  // baseURL: import.meta.env.VITE_API_URL || 'https://localhost:8000/api',
});

// 1. INTERCEPTEUR DE REQUÊTE (Ajout du token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. INTERCEPTEUR DE RÉPONSE UNIQUE (Gestion des erreurs)
api.interceptors.response.use(
  (response) => response, // Si tout va bien, on passe
  (error) => {
    // On vérifie si c'est une erreur 401
    if (error.response && error.response.status === 401) {
      
      // Est-ce qu'on est en train d'essayer de se connecter ?
      // (On ne veut pas rediriger si c'est juste une erreur de mot de passe)
      const isLoginRequest = error.config.url.includes('/login_check');

      if (!isLoginRequest) {
        console.warn("Session expirée. Nettoyage et redirection...");
        
        localStorage.removeItem('token');
        localStorage.removeItem('crm_user');

        // On ne redirige que si on n'est pas déjà sur la page d'accueil/login
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }

    // Très important : on retourne l'erreur pour que le catch() 
    // dans ton AuthContext puisse afficher le toast (ex: "Identifiants incorrects")
    return Promise.reject(error);
  }
);

export default api;