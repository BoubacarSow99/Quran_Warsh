import { useState, useEffect } from 'react';
import { useSourates } from './useSourates';

export const useSearch = () => {
  const { sourates } = useSourates();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [query, sourates]);

  const performSearch = () => {
    setSearching(true);

    const filtered = sourates.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.englishName.toLowerCase().includes(query.toLowerCase()) ||
      s.number.toString().includes(query)
    );

    setResults(filtered);
    setSearching(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return {
    query,
    setQuery,
    results,
    searching,
    clearSearch
  };
};