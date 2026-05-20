import { useState, useEffect, useCallback } from 'react';
import { searchApi } from '../services/api';

const RECENT_SEARCHES_KEY = 'dn_recent_searches';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch trending on mount
  useEffect(() => {
    searchApi.trending().then((res) => {
      if (res.success) setTrending(res.data.trending || []);
    });
  }, []);

  // Debounced suggestions
  useEffect(() => {
    if (!query.trim()) {
      setTimeout(() => {
        setSuggestions([]);
      }, 0);
      return;
    }

    const handler = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await searchApi.suggestions(query);
        if (res.success) {
          setSuggestions(res.data.suggestions || []);
        }
      } catch (err) {
        console.error('Suggestions error:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const addRecentSearch = useCallback((item) => {
    setRecent((prev) => {
      // Avoid duplicates
      const filtered = prev.filter((i) => i.text !== item.text);
      const next = [item, ...filtered].slice(0, 5);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecent([]);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    trending,
    recent,
    loadingSuggestions,
    addRecentSearch,
    clearRecent,
  };
}
