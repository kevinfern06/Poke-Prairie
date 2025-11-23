import React, { useMemo } from 'react';
import { Pokemon } from '../types';
import { calculateDefensiveProfile } from '../services/pokeApi';
import { POKE_TYPES } from '../constants';
import { TypeBadge } from './TypeBadge';
import { AlertTriangle, CheckCircle, ShieldAlert, BarChart } from 'lucide-react';

interface Props {
  team: Pokemon[];
}

export const AnalysisPanel: React.FC<Props> = ({ team }) => {
  const analysis = useMemo(() => {
    const threats: { [type: string]: number } = {};
    const resistances: { [type: string]: number } = {};

    team.forEach(p => {
      const typeNames = p.types.map(t => t.type.name);
      const profile = calculateDefensiveProfile(typeNames);
      
      Object.entries(profile).forEach(([type, multiplier]) => {
        if (multiplier >= 2) {
          threats[type] = (threats[type] || 0) + 1;
        }
        if (multiplier <= 0.5) {
          resistances[type] = (resistances[type] || 0) + 1;
        }
      });
    });

    return { threats, resistances };
  }, [team]);

  if (team.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400 glass-panel rounded-2xl">
        <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="font-retro text-lg">Aucune donnée disponible</h2>
        <p className="font-sans mt-2">Ajoutez des Pokémon à votre équipe pour lancer l'analyse.</p>
      </div>
    );
  }

  const majorThreats = (Object.entries(analysis.threats) as [string, number][])
    .filter(([_, count]) => count >= Math.max(2, team.length / 2))
    .sort((a, b) => b[1] - a[1]);

  const goodResistances = (Object.entries(analysis.resistances) as [string, number][])
    .filter(([_, count]) => count >= Math.max(2, team.length / 2))
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm">
        <h2 className="font-retro text-xl text-gray-800 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
          <BarChart className="w-6 h-6 text-indigo-500" />
          Rapport Stratégique
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Vulnerabilities */}
          <div className="bg-red-50/50 dark:bg-red-900/20 p-5 rounded-xl border border-red-100 dark:border-red-800/30">
            <h3 className="font-sans font-bold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Faiblesses Critiques
            </h3>
            {majorThreats.length > 0 ? (
              <ul className="space-y-3">
                {majorThreats.map(([type, count]) => (
                  <li key={type} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <TypeBadge type={type} />
                    <span className="font-sans text-sm text-gray-600 dark:text-gray-300">
                      <strong className="text-red-500 dark:text-red-400">{count}</strong> coéquipiers faibles
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-sans p-2">
                 <CheckCircle className="w-5 h-5" />
                 <span>Aucune faiblesse majeure !</span>
              </div>
            )}
          </div>

          {/* Resistances */}
          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <h3 className="font-sans font-bold text-emerald-700 dark:text-emerald-300 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Résistances Partagées
            </h3>
            {goodResistances.length > 0 ? (
              <ul className="space-y-3">
                {goodResistances.map(([type, count]) => (
                  <li key={type} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <TypeBadge type={type} />
                    <span className="font-sans text-sm text-gray-600 dark:text-gray-300">
                      <strong className="text-emerald-500 dark:text-emerald-400">{count}</strong> coéquipiers résistent
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
               <p className="text-sm text-gray-500 dark:text-gray-400 font-sans italic p-2">Aucune résistance commune.</p>
            )}
          </div>
        </div>
      </div>

      {/* Full Type Matrix */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm overflow-x-auto">
        <h3 className="font-retro text-md text-gray-800 dark:text-white mb-6">Matrice de Couverture Défensive</h3>
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left font-retro text-xs text-gray-400 dark:text-gray-500">DEF \ ATT</th>
              {POKE_TYPES.map(t => (
                <th key={t} className="p-1">
                   <div className="writing-vertical-lr text-xs font-bold text-gray-500 dark:text-gray-400 uppercase rotate-180 h-24 text-center w-full flex items-center justify-center">
                     {t.slice(0,3)}
                   </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map(pokemon => {
              const typeNames = pokemon.types.map(t => t.type.name);
              const profile = calculateDefensiveProfile(typeNames);
              return (
                <tr key={pokemon.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-white/30 dark:hover:bg-black/20">
                  <td className="p-3 font-sans font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <img src={pokemon.sprites.front_default} className="w-8 h-8" alt="" />
                    <span className="hidden sm:inline">{pokemon.localizedName || pokemon.name}</span>
                  </td>
                  {POKE_TYPES.map(type => {
                    const val = profile[type];
                    let cellClass = "text-center font-retro text-[10px] p-1 rounded-sm ";
                    let content = "";
                    
                    if (val >= 4) {
                      cellClass += "bg-red-500 text-white";
                      content = "4";
                    } else if (val === 2) {
                      cellClass += "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
                      content = "2";
                    } else if (val === 0) {
                      cellClass += "bg-gray-800 text-gray-400 dark:bg-black dark:text-gray-500";
                      content = "0";
                    } else if (val <= 0.25) {
                      cellClass += "bg-green-500 text-white";
                      content = "¼";
                    } else if (val === 0.5) {
                      cellClass += "bg-green-100 text-green-800 dark:bg-emerald-900/50 dark:text-green-200";
                      content = "½";
                    } else {
                      cellClass += "text-gray-300 dark:text-gray-600";
                      content = "-";
                    }

                    return (
                      <td key={type} className="p-0.5">
                        <div className={cellClass + " h-8 w-6 flex items-center justify-center mx-auto"}>
                          {content}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};