

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

export interface PokemonSprite {
  front_default: string;
  other?: {
    'official-artwork'?: {
      front_default: string;
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  localizedName?: string; // Support for French names
  types: PokemonType[];
  sprites: PokemonSprite;
  stats: PokemonStat[];
  species: {
    url: string;
  };
}

export interface PokemonLite {
  id: number;
  name: string;      // English (API key)
  frenchName: string; // Display name
}

export interface TypeMatchup {
  type: string;
  effectiveness: number; // 0, 0.25, 0.5, 1, 2, 4
}

export interface TeamAnalysis {
  weaknesses: { [key: string]: number }; // Type -> Count of team members weak to it
  resistances: { [key: string]: number }; // Type -> Count of team members resisting it
  coverage: { [key: string]: number }; // Type -> Count of team members who can hit this super effectively (simplified for now as just defensive profile)
}

export interface Recommendation {
  name: string; // English name for API
  frenchName: string;
  reason: string;
  pokemonData?: Pokemon; // Populated after fetching
}

export type ViewMode = 'builder' | 'analysis' | 'ai-studio';

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};