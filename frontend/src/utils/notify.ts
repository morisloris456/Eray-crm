import { toast } from "sonner";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  duration?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

// Configuration des styles professionnels
const notificationStyles = {
  success: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    border: "1px solid #34d399"
  },
  error: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#ffffff", 
    border: "1px solid #f87171"
  },
  warning: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#ffffff",
    border: "1px solid #fbbf24"
  },
  info: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#ffffff",
    border: "1px solid #60a5fa"
  }
};

export const notify = {
  success: (msg: string, options?: NotificationOptions) => toast.success(msg, {
    duration: options?.duration || 4000,
    position: options?.position || "top-right",
    description: options?.action ? "Cliquez pour plus de détails" : undefined,
    action: options?.action,
    style: {
      background: notificationStyles.success.background,
      color: notificationStyles.success.color,
      border: notificationStyles.success.border,
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      backdropFilter: "blur(10px)",
      minWidth: "320px",
      maxWidth: "400px"
    }
  }),
  
  error: (msg: string, options?: NotificationOptions) => toast.error(msg, {
    duration: options?.duration || 6000,
    position: options?.position || "top-right",
    description: options?.action ? "Cliquez pour corriger" : undefined,
    action: options?.action,
    style: {
      background: notificationStyles.error.background,
      color: notificationStyles.error.color,
      border: notificationStyles.error.border,
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.2), 0 10px 10px -5px rgba(239, 68, 68, 0.08)",
      backdropFilter: "blur(10px)",
      minWidth: "320px",
      maxWidth: "400px"
    }
  }),
  
  warning: (msg: string, options?: NotificationOptions) => toast.warning(msg, {
    duration: options?.duration || 5000,
    position: options?.position || "top-right",
    description: options?.action ? "Attention requise" : undefined,
    action: options?.action,
    style: {
      background: notificationStyles.warning.background,
      color: notificationStyles.warning.color,
      border: notificationStyles.warning.border,
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15), 0 10px 10px -5px rgba(245, 158, 11, 0.06)",
      backdropFilter: "blur(10px)",
      minWidth: "320px",
      maxWidth: "400px"
    }
  }),
  
  info: (msg: string, options?: NotificationOptions) => toast.info(msg, {
    duration: options?.duration || 3000,
    position: options?.position || "top-right",
    description: options?.action ? "Plus d'informations" : undefined,
    action: options?.action,
    style: {
      background: notificationStyles.info.background,
      color: notificationStyles.info.color,
      border: notificationStyles.info.border,
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.06)",
      backdropFilter: "blur(10px)",
      minWidth: "320px",
      maxWidth: "400px"
    }
  }),

  // Notifications persistantes
  persistent: {
    success: (msg: string, options?: NotificationOptions) => notify.success(msg, { ...options, duration: Infinity }),
    error: (msg: string, options?: NotificationOptions) => notify.error(msg, { ...options, duration: Infinity }),
    warning: (msg: string, options?: NotificationOptions) => notify.warning(msg, { ...options, duration: Infinity }),
    info: (msg: string, options?: NotificationOptions) => notify.info(msg, { ...options, duration: Infinity })
  },

  // Notifications avec actions
  withAction: (type: NotificationType, msg: string, actionLabel: string, action: () => void, options?: NotificationOptions) => {
    return notify[type](msg, {
      ...options,
      action: { label: actionLabel, onClick: action }
    });
  },

  // Notification de chargement
  loading: (msg: string) => toast.loading(msg, {
    position: "top-right",
    style: {
      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      color: "#ffffff",
      border: "1px solid #818cf8",
      borderRadius: "12px",
      backdropFilter: "blur(10px)"
    }
  }),

  // Notification de progression
  progress: (msg: string, progress: number) => toast(msg, {
    duration: Infinity,
    position: "top-right",
    icon: `${progress}%`,
    style: {
      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      color: "#ffffff",
      border: "1px solid #a78bfa",
      borderRadius: "12px",
      backdropFilter: "blur(10px)"
    }
  }),

  // Fermer toutes les notifications
  dismiss: () => toast.dismiss(),

  // Fermer une notification spécifique
  dismissById: (id: string) => toast.dismiss(id)
};