import { ApiError } from '../types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, true, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND');
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 0, true, 'NETWORK_ERROR');
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, true, 'SERVER_ERROR');
  }
}

// Fonction pour traiter les erreurs API
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Erreur réponse du serveur
    const { status, data } = error.response;
    
    if (status === 401) {
      return {
        message: data?.message || 'Session expirée, veuillez vous reconnecter',
        code: 'AUTH_ERROR',
        details: data?.details
      };
    }
    
    if (status === 403) {
      return {
        message: data?.message || 'Accès refusé',
        code: 'AUTHORIZATION_ERROR',
        details: data?.details
      };
    }
    
    if (status === 404) {
      return {
        message: data?.message || 'Ressource non trouvée',
        code: 'NOT_FOUND',
        details: data?.details
      };
    }
    
    if (status === 422) {
      return {
        message: data?.message || 'Données invalides',
        code: 'VALIDATION_ERROR',
        details: data?.details || data?.errors
      };
    }
    
    if (status >= 500) {
      return {
        message: data?.message || 'Erreur serveur',
        code: 'SERVER_ERROR',
        details: data?.details
      };
    }
    
    return {
      message: data?.message || 'Erreur inconnue',
      code: data?.code || 'UNKNOWN_ERROR',
      details: data?.details
    };
  }
  
  if (error.request) {
    // Erreur réseau
    return {
      message: 'Impossible de contacter le serveur',
      code: 'NETWORK_ERROR',
      details: { originalError: error.message }
    };
  }
  
  // Erreur JavaScript
  return {
    message: error.message || 'Erreur inconnue',
    code: 'JAVASCRIPT_ERROR',
    details: { originalError: error.message }
  };
};

// Fonction pour logger les erreurs
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // En développement, logger dans la console
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorInfo);
  }

  // En production, envoyer à un service de logging
  if (import.meta.env.PROD) {
    // TODO: Implémenter l'envoi vers un service comme Sentry, LogRocket, etc.
    // sendToLoggingService(errorInfo);
  }
};

// Fonction pour afficher un message d'erreur approprié
export const getErrorMessage = (error: ApiError): string => {
  switch (error.code) {
    case 'AUTH_ERROR':
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    case 'AUTHORIZATION_ERROR':
      return 'Vous n\'avez pas les permissions pour effectuer cette action.';
    case 'NOT_FOUND':
      return 'La ressource demandée n\'existe pas.';
    case 'VALIDATION_ERROR':
      return 'Les données fournies sont invalides.';
    case 'NETWORK_ERROR':
      return 'Problème de connexion. Vérifiez votre internet.';
    case 'SERVER_ERROR':
      return 'Le serveur rencontre des problèmes. Veuillez réessayer plus tard.';
    default:
      return error.message || 'Une erreur est survenue.';
  }
};
