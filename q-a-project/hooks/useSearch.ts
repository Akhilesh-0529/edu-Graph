import { useState, useEffect, useRef } from "react";

export interface SearchResult {
  nodeId: string;
  label: string;
  content: string;
  score: number;
  graphId: string;
  graphTitle: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple in-memory cache for recent searches
  const cacheRef = useRef<Record<string, SearchResult[]>>({});

  useEffect(() => {
    // Debounce timer for 300ms
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      if (cacheRef.current[query]) {
        setResults(cacheRef.current[query]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error("Failed to retrieve search results.");
        }
        const data: SearchResponse = await response.json();
        const searchResults = data.results || [];

        // Save to cache
        cacheRef.current[query] = searchResults;
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search query failed.");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return {
    results,
    isLoading,
    error,
    search: setQuery,
    query,
  };
}
