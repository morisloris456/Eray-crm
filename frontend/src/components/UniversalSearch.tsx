import { useEffect, useRef } from 'react';
import { useUniversalSearch } from '../hooks/useUniversalSearch';
import { Search, Clock, TrendingUp, X, Command } from 'lucide-react';

interface UniversalSearchProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: any) => void;
}

const UniversalSearch = ({ 
  placeholder = "Rechercher clients, projets, deals...", 
  className = "",
  onResultSelect 
}: UniversalSearchProps) => {
  const {
    query,
    isOpen,
    selectedIndex,
    results,
    suggestions,
    recentSearches,
    setQuery,
    setIsOpen,
    handleSearch,
    handleSelect,
    handleKeyDown,
    clearRecentSearches,
    getTypeIcon,
    getTypeColor
  } = useUniversalSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Gérer le clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  // Raccourci clavier global
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K pour ouvrir la recherche
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setIsOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
    setIsOpen(value.length > 0 || recentSearches.length > 0);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleResultClick = (result: any) => {
    // console.log('Recherche sélectionnée:', result);
    handleSelect(result);
    onResultSelect?.(result);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input de recherche */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {!query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <kbd className="flex items-center gap-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">
              <Command className="h-3 w-3" />
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown de résultats */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {/* Suggestions */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <Clock className="h-3 w-3" />
                  Recherches récentes
                </div>
                {recentSearches.length > 0 && (
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick({ text: search, type: 'recent' })}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Résultats de recherche */}
          {results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full text-left rounded-xl p-3 transition-colors ${
                      index === selectedIndex 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {result.title}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeColor(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-1">{result.subtitle}</p>
                        
                        {result.description && (
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {result.description}
                          </p>
                        )}
                        
                        {/* Métadonnées spécifiques au type */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {result.type === 'client' && (
                            <>
                              <span>Statut: {result.metadata.status}</span>
                              {result.metadata.sector && <span>{result.metadata.sector}</span>}
                            </>
                          )}
                          
                          {result.type === 'deal' && (
                            <>
                              <span>{result.metadata.amount}</span>
                              <span>{result.metadata.stage}</span>
                              <span>{result.metadata.probability}%</span>
                            </>
                          )}
                          
                          {result.type === 'project' && (
                            <>
                              <span>{result.metadata.progress}%</span>
                              <span>{result.metadata.priority}</span>
                              {result.metadata.budget && <span>{result.metadata.budget}</span>}
                            </>
                          )}
                          
                          {result.type === 'event' && (
                            <>
                              <span>{result.metadata.date}</span>
                              <span>{result.metadata.time}</span>
                              <span>{result.metadata.type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message si aucun résultat */}
          {query && results.length === 0 && (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Aucun résultat trouvé</p>
              <p className="text-xs text-gray-400">Essayez avec d'autres mots-clés</p>
            </div>
          )}

          {/* Suggestions populaires */}
          {query && suggestions.length > 0 && results.length === 0 && (
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <TrendingUp className="h-3 w-3" />
                Suggestions
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversalSearch;
