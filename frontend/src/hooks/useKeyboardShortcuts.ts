import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorer si l'utilisateur tape dans un input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    shortcuts.forEach(shortcut => {
      if (shortcut.enabled === false) return;

      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Raccourcis prédéfinis pour le CRM
export const getCRMShortcuts = (navigate: (path: string) => void) => [
  {
    key: 'k',
    ctrlKey: true,
    description: 'Recherche universelle',
    action: () => {
      const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
      searchInput?.focus();
    }
  },
  {
    key: 'n',
    ctrlKey: true,
    description: 'Nouveau client',
    action: () => navigate('/clients')
  },
  {
    key: 'p',
    ctrlKey: true,
    description: 'Nouveau projet',
    action: () => navigate('/projects')
  },
  {
    key: 'd',
    ctrlKey: true,
    description: 'Dashboard',
    action: () => navigate('/dashboard')
  },
  {
    key: 'c',
    ctrlKey: true,
    description: 'Clients',
    action: () => navigate('/clients')
  },
  {
    key: 'i',
    ctrlKey: true,
    description: 'Pipeline',
    action: () => navigate('/pipeline')
  },
  {
    key: 'a',
    ctrlKey: true,
    description: 'Agenda',
    action: () => navigate('/agenda')
  },
  {
    key: 'r',
    ctrlKey: true,
    description: 'Archives',
    action: () => navigate('/archives')
  },
  {
    key: 's',
    ctrlKey: true,
    description: 'Paramètres',
    action: () => navigate('/settings')
  },
  {
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    description: 'Mode édition dashboard',
    action: () => {
      const editButton = document.querySelector('button[title*="Personnaliser"]') as HTMLButtonElement;
      editButton?.click();
    }
  },
  {
    key: 'f',
    ctrlKey: true,
    shiftKey: true,
    description: 'Actualiser les données',
    action: () => {
      const refreshButton = document.querySelector('button[title*="Actualiser"]') as HTMLButtonElement;
      refreshButton?.click();
    }
  },
  {
    key: 'Escape',
    description: 'Fermer les modales',
    action: () => {
      const closeButton = document.querySelector('[aria-label="Close"], .modal-close, button[title*="Fermer"]') as HTMLButtonElement;
      closeButton?.click();
      
      // Fermer les dropdowns
      const dropdowns = document.querySelectorAll('[data-dropdown-open="true"]');
      dropdowns.forEach(dropdown => {
        (dropdown as HTMLElement).click();
      });
    }
  },
  {
    key: 'Enter',
    shiftKey: true,
    description: 'Action rapide (contextuel)',
    action: () => {
      // Cliquer sur le premier bouton d'action visible
      const actionButton = document.querySelector('button[class*="bg-blue-600"], button[class*="bg-green-600"]') as HTMLButtonElement;
      actionButton?.click();
    }
  }
];

