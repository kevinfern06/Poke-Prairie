import React from 'react';
import { Trash2, Shield, Sword } from 'lucide-react';
import { Pokemon } from '../types';
import { TypeBadge } from './TypeBadge';

interface Props {
  team: Pokemon[];
  onRemove: (id: number) => void;
}

export const TeamGrid: React.FC<Props> = ({ team, onRemove }) => {
  // Fill empty slots for visual consistency
  const slots = [...team, ...Array(6 - team.length).fill(null)];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {slots.map((pokemon, index) => (
        <div 
          key={pokemon ? pokemon.id : `empty-${index}`}
          className={`relative h-72 rounded-2xl transition-all duration-300 overflow-hidden ${
            pokemon 
              ? 'glass-panel shadow-glass hover:-translate-y-2 hover:shadow-lg' 
              : 'border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/10 dark:bg-black/10 flex items-center justify-center'
          }`}
        >
          {pokemon ? (
            <>
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-current opacity-5 rounded-bl-full pointer-events-none" style={{ color: '#000' }} />
              
              <div className="h-full p-5 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-retro text-sm text-gray-800 dark:text-white truncate w-32" title={pokemon.localizedName || pokemon.name}>
                      {pokemon.localizedName || pokemon.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-sans italic capitalize mb-2">{pokemon.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {pokemon.types.map(t => (
                        <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => onRemove(pokemon.id)}
                    className="p-1.5 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors dark:bg-red-900/20 dark:hover:bg-red-900"
                    title="Retirer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sprite */}
                <div className="flex-1 flex items-center justify-center relative">
                   <div className="absolute w-24 h-24 bg-white/30 dark:bg-white/5 rounded-full blur-xl"></div>
                   <img 
                      src={pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default} 
                      alt={pokemon.name}
                      className="w-32 h-32 object-contain drop-shadow-md z-10"
                    />
                </div>

                {/* Stats Footer */}
                <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-around text-xs font-sans text-gray-600 dark:text-gray-300 font-semibold pb-1">
                   <div className="flex items-center gap-1">
                     <Shield className="w-3 h-3 text-blue-400" /> 
                     <span>{pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <Sword className="w-3 h-3 text-red-400" /> 
                     <span>{pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <span className="text-[10px] text-gray-400">VIT</span>
                     <span>{pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat}</span>
                   </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
                 <span className="font-retro text-lg">{index + 1}</span>
              </div>
              <span className="font-retro text-[10px]">VIDE</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};