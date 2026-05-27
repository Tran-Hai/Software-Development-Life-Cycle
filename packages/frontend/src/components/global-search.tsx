'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { Search, ListTodo, FileText, Bug, X, ArrowRight, AlertCircle, Clock, Trash2 } from 'lucide-react';

const typeIcons: Record<string, any> = {
  issue: ListTodo,
  document: FileText,
  bug: Bug,
};

const typeColors: Record<string, string> = {
  issue: 'text-blue-600 bg-blue-50',
  document: 'text-purple-600 bg-purple-50',
  bug: 'text-red-600 bg-red-50',
};

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-purple-100 text-purple-700',
  testing: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  open: 'bg-red-100 text-red-700',
  fixed: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const groupedTypes = ['issue', 'document', 'bug'] as const;

interface RecentSearch {
  query: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 8;

function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter((s) => s.query.toLowerCase() !== query.toLowerCase());
    const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage not available
  }
}

function removeRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter((s) => s.query !== query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage not available
  }
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // localStorage not available
  }
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text || query.length < 2) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = () => {
      const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
      return elements.filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}

export default function GlobalSearch() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useFocusTrap(modalRef as React.RefObject<HTMLElement>, isOpen);

  const { data: results, isLoading, error, refetch } = useQuery({
    queryKey: ['search', projectId, debouncedQuery],
    queryFn: async () => {
      const qp = new URLSearchParams({ q: debouncedQuery });
      if (projectId) qp.set('projectId', projectId);
      const response = await apiClient.get(`/search?${qp}`);
      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
    retry: 1,
  });

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(-1);
      setShowRecent(false);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const flatResults = results || [];

  const groupedResults = groupedTypes
    .map((type) => {
      const items = flatResults.filter((r: any) => r.type === type);
      return { type, items };
    })
    .filter((g) => g.items.length > 0);

  const totalResults = flatResults.length;

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setShowRecent(true);
    }
  }, [isOpen]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(-1);
    setShowRecent(true);
  }, []);

  const executeSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setDebouncedQuery(searchQuery);
    saveRecentSearch(searchQuery);
    setSelectedIndex(0);
    setShowRecent(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
        return;
      }

      if (!isOpen) return;

      if (showRecent && recentSearches.length > 0 && debouncedQuery.length < 2) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < recentSearches.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : recentSearches.length - 1));
        } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < recentSearches.length) {
          e.preventDefault();
          executeSearch(recentSearches[selectedIndex].query);
        }
        return;
      }

      if (totalResults === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selectedResult = flatResults[selectedIndex];
        if (selectedResult) {
          handleSelect(selectedResult);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalResults, selectedIndex, flatResults, closeSearch, showRecent, recentSearches, debouncedQuery, executeSearch]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (result: any) => {
    saveRecentSearch(debouncedQuery);
    router.push(result.url);
    closeSearch();
  };

  let globalIndex = 0;

  const activeDescendantId = selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined;

  return (
    <div ref={searchRef} className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        aria-label="Open search"
        aria-haspopup="dialog"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-200 rounded">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]" role="dialog" aria-modal="true" aria-labelledby="search-title">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden" aria-describedby="search-description">
            <span id="search-description" className="sr-only">
              Search across issues, documents, and bugs. Use arrow keys to navigate, Enter to select, Escape to close.
            </span>

            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search issues, documents, bugs..."
                className="flex-1 text-sm outline-none placeholder:text-gray-400"
                id="search-title"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls="search-results"
                aria-activedescendant={activeDescendantId}
                aria-autocomplete="list"
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setSelectedIndex(-1); setShowRecent(true); }}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            <div
              ref={resultsRef}
              className="max-h-96 overflow-y-auto"
              id="search-results"
              role="listbox"
              aria-label="Search results"
            >
              {isLoading && (
                <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="sr-only">Searching...</span>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-8 text-red-600" role="alert" aria-live="assertive">
                  <AlertCircle className="h-8 w-8 mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium">Search failed</p>
                  <p className="text-xs text-gray-500 mt-1">Please try again</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 px-3 py-1 text-xs bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {showRecent && recentSearches.length > 0 && debouncedQuery.length < 2 && !isLoading && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Recent searches
                    </span>
                    <button
                      onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                      className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Clear all recent searches"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  </div>

                  {recentSearches.map((recent, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={recent.query}
                        data-index={index}
                        role="option"
                        aria-selected={isSelected}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => executeSearch(recent.query)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {recent.query}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(recent.query);
                            setRecentSearches(getRecentSearches());
                          }}
                          className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove "${recent.query}" from recent searches`}
                        >
                          <X className="h-3 w-3 text-gray-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLoading && !error && debouncedQuery.length >= 2 && totalResults === 0 && (
                <div className="text-center py-8 text-gray-500" aria-live="polite">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" aria-hidden="true" />
                  <p className="text-sm">No results found for &quot;{debouncedQuery}&quot;</p>
                </div>
              )}

              {!isLoading && !error && groupedResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50" aria-live="polite">
                    {totalResults} result{totalResults !== 1 ? 's' : ''}
                  </div>

                  {groupedResults.map(({ type, items }) => {
                    const Icon = typeIcons[type] || Search;
                    return (
                      <div key={type} role="group" aria-label={`${type} results`}>
                        <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                          {type === 'issue' ? 'Issues' : type === 'document' ? 'Documents' : 'Bugs'}
                        </div>
                        {items.map((result: any) => {
                          const currentIndex = globalIndex;
                          const isSelected = currentIndex === selectedIndex;
                          const resultId = `search-result-${currentIndex}`;
                          globalIndex++;

                          return (
                            <button
                              key={`${result.type}-${result.id}`}
                              id={resultId}
                              data-index={currentIndex}
                              onClick={() => handleSelect(result)}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              role="option"
                              aria-selected={isSelected}
                              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left transition-colors ${
                                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[result.type] || 'bg-gray-100'}`} aria-hidden="true">
                                <Icon className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {highlightText(result.title, debouncedQuery)}
                                </p>
                                {result.description && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {highlightText(result.description.substring(0, 100), debouncedQuery)}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500 capitalize">{result.type}</span>
                                  {result.projectKey && (
                                    <span className="text-xs text-gray-400">{result.projectKey}</span>
                                  )}
                                  {result.status && (
                                    <span className={`px-1.5 py-0.5 text-xs rounded-full capitalize ${statusColors[result.status] || 'bg-gray-100 text-gray-600'}`}>
                                      {result.status.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {debouncedQuery.length < 2 && !isLoading && recentSearches.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Type at least 2 characters to search
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">↵</kbd>
                  Select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
