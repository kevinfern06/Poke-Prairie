import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Pokemon, Recommendation } from '../types';
import { TypeBadge } from './TypeBadge';

interface Props {
  recommendations: Recommendation[];
  onAdd: (p: Pokemon) => void;
  isFull: boolean;
}

export const Recommendations: React.FC<Props> = ({ recommendations, onAdd, isFull }) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-16">
      <div className="glass-panel p-8 rounded-3xl animate-[fadeIn_0.5s_ease-out]">
          <h3 className="text-emerald-900 dark:text-emerald-100 font-retro text-sm mb-6 flex items-center gap-2 justify-center border-b border-emerald-200 dark:border-emerald-800 pb-4 w-full">
             Recommandations Intelligentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col border border-white dark:border-gray-700">
                 {/* Header */}
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h4 className="font-retro text-xs text-gray-800 dark:text-gray-100">{rec.frenchName}</h4>
                     <div className="flex gap-1 mt-1.5">
                        {rec.pokemonData?.types.map(t => (
                           <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                        ))}
                     </div>
                   </div>
                   <button
                     onClick={() => rec.pokemonData && onAdd(rec.pokemonData)}
                     disabled={isFull}
                     className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-600"
                     title="Ajouter à l'équipe"
                   >
                     <PlusCircle className="w-5 h-5" />
                   </button>
                 </div>

                 {/* Sprite */}
                 <div className="flex justify-center my-4 relative">
                    <div className="absolute w-20 h-20 bg-gradient-to-tr from-emerald-200 to-yellow-100 rounded-full blur-xl opacity-60 dark:opacity-20"></div>
                    <img 
                      src={rec.pokemonData?.sprites.front_default} 
                      alt={rec.name} 
                      className="w-24 h-24 object-contain z-10 hover:scale-110 transition-transform duration-300"
                    />
                 </div>

                 {/* Reason */}
                 <div className="mt-auto bg-emerald-50 dark:bg-slate-900/50 p-3 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-200 font-sans border border-emerald-100 dark:border-emerald-800/30 leading-relaxed">
                    <span className="font-bold block mb-1 text-emerald-700 dark:text-emerald-400">Analyse :</span>
                    {rec.reason}
                 </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
};