import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError, logError, getErrorMessage } from '../utils/error-handler';

// Configuration globale pour les requêtes
export const queryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (gcTime remplace cacheTime dans v5)
  retry: (failureCount: number, error: any) => {
    // Ne pas réessayer pour les erreurs 4xx
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    // Réessayer jusqu'à 3 fois pour les erreurs 5xx ou réseau
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Hook personnalisé pour les requêtes GET
export const useApiQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn,
    ...queryConfig,
    ...options,
  });
};

// Hook personnalisé pour les mutations
export const useApiMutation = <T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: any, variables: V) => void;
    successMessage?: string;
    invalidateQueries?: string[][];
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalider les queries spécifiées
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Afficher un message de succès
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      // Appeler le callback onSuccess
      options?.onSuccess?.(data, variables);
    },
    onError: (error: any, variables) => {
      const apiError = handleApiError(error);
      logError(error, 'Mutation');
      toast.error(getErrorMessage(apiError));
      options?.onError?.(error, variables);
    },
  });
};

// Hook pour les mutations optimistes
export const useOptimisticMutation = <T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    queryKey: string[];
    optimisticUpdate: (oldData: any, variables: V) => any;
    successMessage?: string;
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: any, variables: V) => void;
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      
      // Sauvegarder les données précédentes
      const previousData = queryClient.getQueryData(options.queryKey);
      
      // Appliquer la mise à jour optimiste
      queryClient.setQueryData(options.queryKey, (old: any) => 
        options.optimisticUpdate(old, variables)
      );
      
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Restaurer les données précédentes en cas d'erreur
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
      
      const apiError = handleApiError(error);
      logError(error, 'Optimistic Mutation');
      toast.error(getErrorMessage(apiError));
      options.onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      // Afficher un message de succès
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      
      // Appeler le callback onSuccess
      options.onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Refetch les données pour s'assurer qu'elles sont à jour
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
};
