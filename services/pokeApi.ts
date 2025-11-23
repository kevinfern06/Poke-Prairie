

import { Pokemon, PokemonLite } from '../types';
import { TYPE_CHART, POKE_TYPES } from '../constants';

const BASE_URL = 'https://pokeapi.co/api/v2';
const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';

// --- Utilities ---

// Simple Levenshtein distance for fuzzy matching (handling typos)
export const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = [];
  let i, j;

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

export const getSpriteUrl = (id: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
};

// --- API Calls ---

// Fetch lightweight index of all pokemon (ID, English Name, French Name)
export const fetchAllPokemonLite = async (): Promise<PokemonLite[]> => {
  try {
    const query = JSON.stringify({
      query: `query {
        pokemon_v2_pokemonspecies(order_by: {id: asc}, where: {id: {_lte: 1025}}) {
          id
          name
          pokemon_v2_pokemonspeciesnames(where: {language_id: {_eq: 5}}) {
            name
          }
        }
      }`
    });

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: query
    });

    const json = await response.json();
    
    if (!json.data || !json.data.pokemon_v2_pokemonspecies) {
      throw new Error("Invalid GraphQL response");
    }

    return json.data.pokemon_v2_pokemonspecies.map((p: any) => ({
      id: p.id,
      name: p.name, // English/Slug
      frenchName: p.pokemon_v2_pokemonspeciesnames?.[0]?.name || p.name // Fallback to english if no FR
    }));

  } catch (error) {
    console.warn("GraphQL autocomplete fetch failed, falling back to REST (no french names)", error);
    // Fallback to basic REST API if GraphQL fails (English only)
    try {
      const res = await fetch(`${BASE_URL}/pokemon?limit=1025`);
      const data = await res.json();
      return data.results.map((p: any) => {
        const id = parseInt(p.url.split('/').filter(Boolean).pop());
        return {
          id,
          name: p.name,
          frenchName: p.name // No french name in this fallback
        };
      });
    } catch (e) {
      return [];
    }
  }
};

// Helper to resolve a name (any language) to an ID using PokeAPI GraphQL
const resolvePokemonId = async (name: string): Promise<number | null> => {
  try {
    const query = JSON.stringify({
      query: `query search($name: String!) { 
        pokemon_v2_pokemonspeciesname(where: {name: {_ilike: $name}}) { 
          pokemon_species_id 
        } 
      }`,
      variables: { name }
    });

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: query
    });

    const json = await response.json();
    const result = json.data?.pokemon_v2_pokemonspeciesname?.[0];
    
    return result ? result.pokemon_species_id : null;
  } catch (e) {
    console.error("GraphQL Name Resolution Failed", e);
    return null;
  }
};

export const searchPokemon = async (query: string): Promise<Pokemon | null> => {
  try {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return null;
    
    let pokemonIdOrName = cleanQuery;
    let data = null;

    // 1. Try fetching directly (works for English names and IDs)
    let response = await fetch(`${BASE_URL}/pokemon/${cleanQuery}`);
    
    // 2. If 404, try resolving the name via GraphQL (for French, German, etc.)
    if (!response.ok) {
      const resolvedId = await resolvePokemonId(cleanQuery);
      if (resolvedId) {
        response = await fetch(`${BASE_URL}/pokemon/${resolvedId}`);
      }
    }

    if (!response.ok) {
      return null;
    }
    
    data = await response.json();
    
    // 3. Fetch Species data to get the French name
    let localizedName = data.name;
    if (data.species && data.species.url) {
      try {
        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        const frenchEntry = speciesData.names.find((n: any) => n.language.name === 'fr');
        if (frenchEntry) {
          localizedName = frenchEntry.name;
        }
      } catch (e) {
        console.warn("Could not fetch species data", e);
      }
    }
    
    // Transform minimal data to our interface
    return {
      id: data.id,
      name: data.name,
      localizedName: localizedName,
      types: data.types,
      sprites: data.sprites,
      stats: data.stats,
      species: data.species
    };
  } catch (error) {
    console.error("Error fetching pokemon:", error);
    return null;
  }
};

// Helper to get type effectiveness of a defending pokemon
// Returns a map of AttackingType -> Multiplier (0, 0.25, 0.5, 1, 2, 4)
export const calculateDefensiveProfile = (types: string[]): { [key: string]: number } => {
  const profile: { [key: string]: number } = {};
  
  POKE_TYPES.forEach(attacker => {
    let multiplier = 1;
    
    types.forEach(defender => {
      const effectiveness = TYPE_CHART[attacker]?.[defender];
      // If undefined in chart, it's neutral (1)
      const factor = effectiveness !== undefined ? effectiveness : 1;
      multiplier *= factor;
    });
    
    profile[attacker] = multiplier;
  });
  
  return profile;
};