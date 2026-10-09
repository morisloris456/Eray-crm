import { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';

export interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'project' | 'event';
  title: string;
  subtitle: string;
  description?: string;
  metadata: Record<string, any>;
  relevance: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'smart';
  count?: number;
}

// Algorithme de recherche floue simplifié
const fuzzyMatch = (query: string, text: string): number => {
  if (!text) return 0;
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Correspondance exacte
  if (textLower === queryLower) return 100;
  
  // Commence par la query
  if (textLower.startsWith(queryLower)) return 90;
  
  // Contient la query
  if (textLower.includes(queryLower)) return 80;
  
  // Correspondance partielle des caractères
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10;
      queryIndex++;
    }
  }
  
  return score;
};

export const useUniversalSearch = () => {
  const { clients, deals, projects, events } = useData();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Calculer les résultats de recherche
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const allResults: SearchResult[] = [];

    // Rechercher dans les clients
    clients.forEach(client => {
      const nameScore = fuzzyMatch(query, client.name);
      const companyScore = fuzzyMatch(query, client.company);
      const emailScore = fuzzyMatch(query, client.email);
      const sectorScore = fuzzyMatch(query, client.sector || '');
      
      const maxScore = Math.max(nameScore, companyScore, emailScore, sectorScore);
      
      if (maxScore > 30) {
        allResults.push({
          id: `client-${client.id}`,
          type: 'client',
          title: client.name,
          subtitle: client.company,
          description: client.email,
          metadata: {
            status: client.status,
            sector: client.sector,
            phone: client.phone,
            createdAt: client.createdAt
          },
          relevance: maxScore
        });
      }
    });

    // Rechercher dans les deals
    deals.forEach(deal => {
      const titleScore = fuzzyMatch(query, deal.title);
      const clientScore = fuzzyMatch(query, deal.client);
      const descScore = fuzzyMatch(query, deal.description || '');
      
      const maxScore = Math.max(titleScore, clientScore, descScore);
      
      if (maxScore > 30) {
        allResults.push({
          id: `deal-${deal.id}`,
          type: 'deal',
          title: deal.title,
          subtitle: deal.client,
          description: deal.description,
          metadata: {
            amount: deal.amount,
            stage: deal.stage,
            probability: deal.probability,
            date: deal.date
          },
          relevance: maxScore
        });
      }
    });

    // Rechercher dans les projets
    projects.forEach(project => {
      const titleScore = fuzzyMatch(query, project.title);
      const clientScore = fuzzyMatch(query, project.client);
      const descScore = fuzzyMatch(query, project.description);
      
      const maxScore = Math.max(titleScore, clientScore, descScore);
      
      if (maxScore > 30) {
        allResults.push({
          id: `project-${project.id}`,
          type: 'project',
          title: project.title,
          subtitle: project.client,
          description: project.description,
          metadata: {
            status: project.status,
            progress: project.progress,
            priority: project.priority,
            budget: project.budget,
            startDate: project.startDate,
            endDate: project.endDate
          },
          relevance: maxScore
        });
      }
    });

    // Rechercher dans les événements
    events.forEach(event => {
      const titleScore = fuzzyMatch(query, event.title);
      const clientScore = fuzzyMatch(query, event.clientName);
      const descScore = fuzzyMatch(query, event.description || '');
      const locationScore = fuzzyMatch(query, event.location || '');
      
      const maxScore = Math.max(titleScore, clientScore, descScore, locationScore);
      
      if (maxScore > 30) {
        allResults.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          subtitle: event.clientName,
          description: event.description,
          metadata: {
            date: event.date,
            time: event.time,
            type: event.type,
            location: event.location,
            status: event.status
          },
          relevance: maxScore
        });
      }
    });

    // Trier par pertinence et limiter les résultats
    return allResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8);
  }, [query, clients, deals, projects, events]);

  // Générer des suggestions intelligentes
  const suggestions = useMemo((): SearchSuggestion[] => {
    if (!query.trim()) {
      // Suggestions basées sur l'historique
      return recentSearches.slice(0, 5).map(search => ({
        text: search,
        type: 'recent' as const
      }));
    }

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Suggestions populaires basées sur les données
    const popularTerms = [
      ...clients.map(c => c.name),
      ...clients.map(c => c.company),
      ...deals.map(d => d.title),
      ...projects.map(p => p.title)
    ];

    const matchingTerms = popularTerms
      .filter(term => term.toLowerCase().includes(queryLower))
      .slice(0, 3);

    matchingTerms.forEach(term => {
      suggestions.push({
        text: term,
        type: 'popular',
        count: 1
      });
    });

    return suggestions;
  }, [query, recentSearches, clients, deals, projects]);

  // Actions
  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
    
    if (newQuery.trim() && !recentSearches.includes(newQuery)) {
      setRecentSearches(prev => [newQuery, ...prev.slice(0, 9)]);
    }
  }, [recentSearches]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Ajouter à l'historique
    if (!recentSearches.includes(result.title)) {
      setRecentSearches(prev => [result.title, ...prev.slice(0, 9)]);
    }
    
    // Navigation vers la page appropriée
    switch (result.type) {
      case 'client':
        // Naviguer vers la page clients avec filtre
        window.location.href = `/clients?search=${result.id}`;
        break;
      case 'deal':
        // Naviguer vers la page pipeline avec filtre
        window.location.href = `/pipeline?search=${result.id}`;
        break;
      case 'project':
        // Naviguer vers la page projets avec filtre
        window.location.href = `/projects?search=${result.id}`;
        break;
      case 'event':
        // Naviguer vers la page agenda avec filtre
        window.location.href = `/agenda?search=${result.id}`;
        break;
    }
    
    setIsOpen(false);
    setQuery('');
  }, [recentSearches]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, results, selectedIndex, handleSelect]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client': return '👤';
      case 'deal': return '💼';
      case 'project': return '📁';
      case 'event': return '📅';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client': return 'text-blue-600 bg-blue-50';
      case 'deal': return 'text-purple-600 bg-purple-50';
      case 'project': return 'text-green-600 bg-green-50';
      case 'event': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return {
    // État
    query,
    isOpen,
    selectedIndex,
    results,
    suggestions,
    recentSearches,
    
    // Actions
    setQuery,
    setIsOpen,
    handleSearch,
    handleSelect,
    handleKeyDown,
    clearRecentSearches,
    
    // Utilitaires
    getTypeIcon,
    getTypeColor
  };
};
