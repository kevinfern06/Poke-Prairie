
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchPokemon, fetchAllPokemonLite, getSpriteUrl, getLevenshteinDistance } from '../services/pokeApi';
import { Pokemon, PokemonLite } from '../types';

interface Props {
  onAdd: (p: Pokemon) => void;
  disabled: boolean;
}

export const SearchBar: React.FC<Props> = ({ onAdd, disabled }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Autocomplete state
  const [allPokemon, setAllPokemon] = useState<PokemonLite[]>([]);
  const [suggestions, setSuggestions] = useState<PokemonLite[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load index on mount
  useEffect(() => {
    const loadIndex = async () => {
      const list = await fetchAllPokemonLite();
      setAllPokemon(list);
    };
    loadIndex();

    // Close suggestions on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions based on query
  useEffect(() => {
    if (!query.trim() || allPokemon.length === 0) {
      setSuggestions([]);
      return;
    }

    const cleanQuery = query.toLowerCase();

    // Strategy:
    // 1. Exact startsWith matches (High priority)
    // 2. Includes matches (Medium priority)
    // 3. Fuzzy matches (Low priority - for typos)

    const exactMatches: PokemonLite[] = [];
    const startsWithMatches: PokemonLite[] = [];
    const includesMatches: PokemonLite[] = [];
    const fuzzyMatches: { p: PokemonLite; dist: number }[] = [];

    // First pass: Direct text matching
    for (const p of allPokemon) {
      const frName = p.frenchName.toLowerCase();
      const enName = p.name.toLowerCase();
      
      if (frName === cleanQuery || enName === cleanQuery) {
        exactMatches.push(p);
      } else if (frName.startsWith(cleanQuery) || enName.startsWith(cleanQuery)) {
        startsWithMatches.push(p);
      } else if (frName.includes(cleanQuery) || enName.includes(cleanQuery)) {
        includesMatches.push(p);
      }
    }

    let results = [...exactMatches, ...startsWithMatches, ...includesMatches];

    // Second pass: If few results, look for typos (Fuzzy)
    // Only calculate Levenshtein if query is long enough to prevent noise
    if (results.length < 5 && cleanQuery.length >= 3) {
      for (const p of allPokemon) {
        if (results.includes(p)) continue;

        const distFr = getLevenshteinDistance(cleanQuery, p.frenchName.toLowerCase());
        const distEn = getLevenshteinDistance(cleanQuery, p.name.toLowerCase());
        const bestDist = Math.min(distFr, distEn);

        // Allow distance up to 2 characters (e.g. "pikachu" -> "pikachou")
        if (bestDist <= 2) {
          fuzzyMatches.push({ p, dist: bestDist });
        }
      }
      // Sort fuzzy matches by distance
      fuzzyMatches.sort((a, b) => a.dist - b.dist);
      results = [...results, ...fuzzyMatches.map(f => f.p)];
    }

    // Limit to 6 results
    setSuggestions(results.slice(0, 6));
    setShowSuggestions(true);
  }, [query, allPokemon]);

  const handleSearch = async (e: React.FormEvent, overrideName?: string) => {
    e.preventDefault();
    const targetName = overrideName || query;
    if (!targetName.trim()) return;
    
    setLoading(true);
    setError('');
    setShowSuggestions(false); // Hide dropdown
    
    const result = await searchPokemon(targetName);
    if (result) {
      onAdd(result);
      setQuery('');
    } else {
      setError('Pokémon introuvable !');
    }
    setLoading(false);
  };

  const handleSuggestionClick = (pokemon: PokemonLite) => {
    // Use the name to search
    setQuery(pokemon.frenchName);
    handleSearch({ preventDefault: () => {} } as React.FormEvent, pokemon.name);
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-10 relative z-40" ref={wrapperRef}>
      <form onSubmit={handleSearch} className="relative group">
        <div className={`absolute inset-0 bg-green-400 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity duration-300 ${disabled ? 'hidden' : ''}`}></div>
        <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError('');
              }}
              onFocus={() => {
                if(query && suggestions.length > 0) setShowSuggestions(true);
              }}
              disabled={disabled || loading}
              placeholder={disabled ? "Équipe complète !" : "Rechercher (ex: Pikachu)..."}
              className="w-full bg-white/90 dark:bg-slate-800/90 text-gray-800 dark:text-white backdrop-blur-sm border-2 border-transparent focus:border-green-400 px-6 py-4 pl-12 pr-32 rounded-full shadow-xl font-sans text-lg focus:outline-none transition-all placeholder:text-gray-400 disabled:opacity-50"
              autoComplete="off"
            />
            <Search className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <button
              type="submit"
              disabled={disabled || loading || !query}
              className="absolute right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2.5 rounded-full hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="font-bold text-xs px-2">AJOUTER</span>}
            </button>
        </div>
      </form>
      
      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-glass overflow-hidden border border-gray-100 dark:border-gray-700 animate-[fadeIn_0.2s_ease-out]">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {suggestions.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => handleSuggestionClick(p)}
                  className="w-full text-left px-5 py-3 hover:bg-green-50 dark:hover:bg-emerald-900/30 flex items-center gap-4 transition-colors group"
                >
                  <img 
                    src={getSpriteUrl(p.id)} 
                    alt="" 
                    className="w-10 h-10 object-contain pixelated opacity-80 group-hover:scale-110 transition-transform" 
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div>
                    <span className="font-retro text-xs text-gray-800 dark:text-gray-200 block">
                      {p.frenchName}
                    </span>
                    {p.frenchName !== p.name && (
                      <span className="font-sans text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                        {p.name}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 w-full text-center mt-2 text-red-500 font-sans font-medium text-sm animate-bounce bg-white/80 dark:bg-black/50 py-1 rounded-lg backdrop-blur">
          {error}
        </div>
      )}
    </div>
  );
};
