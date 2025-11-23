
import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, BarChart3, Bot, Github, Trash2, Leaf, Download, Loader2, Palette, Sparkles } from 'lucide-react';
import { Pokemon, ViewMode, Recommendation } from './types';
import { MAX_TEAM_SIZE } from './constants';
import { SearchBar } from './components/SearchBar';
import { TeamGrid } from './components/TeamGrid';
import { AnalysisPanel } from './components/AnalysisPanel';
import { AIStudio } from './components/AIStudio';
import { Recommendations } from './components/Recommendations';
import { generateTeamRecommendations } from './services/geminiService';
import { searchPokemon } from './services/pokeApi';
import html2canvas from 'html2canvas';

// --- Export Themes Configuration ---
const THEMES = [
  {
    id: 'green',
    name: 'Prairie',
    hex: '#064e3b', // emerald-900
    gradientClass: 'bg-gradient-to-br from-slate-900/80 via-emerald-900/50 to-slate-900/80 border-emerald-500/20',
    titleClass: 'text-emerald-100 drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
    subtitleClass: 'text-emerald-300/70',
    buttonClass: 'bg-emerald-500 ring-emerald-300',
  },
  {
    id: 'blue',
    name: 'Océan',
    hex: '#1e3a8a', // blue-900
    gradientClass: 'bg-gradient-to-br from-slate-900/80 via-blue-900/50 to-slate-900/80 border-blue-500/20',
    titleClass: 'text-blue-100 drop-shadow-[0_2px_10px_rgba(59,130,246,0.5)]',
    subtitleClass: 'text-blue-300/70',
    buttonClass: 'bg-blue-500 ring-blue-300',
  },
  {
    id: 'red',
    name: 'Volcan',
    hex: '#7f1d1d', // red-900
    gradientClass: 'bg-gradient-to-br from-slate-900/80 via-red-900/50 to-slate-900/80 border-red-500/20',
    titleClass: 'text-red-100 drop-shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
    subtitleClass: 'text-red-300/70',
    buttonClass: 'bg-red-500 ring-red-300',
  },
  {
    id: 'orange',
    name: 'Désert',
    hex: '#7c2d12', // orange-900
    gradientClass: 'bg-gradient-to-br from-slate-900/80 via-orange-900/50 to-slate-900/80 border-orange-500/20',
    titleClass: 'text-orange-100 drop-shadow-[0_2px_10px_rgba(249,115,22,0.5)]',
    subtitleClass: 'text-orange-300/70',
    buttonClass: 'bg-orange-500 ring-orange-300',
  },
  {
    id: 'pink',
    name: 'Féérique',
    hex: '#831843', // pink-900
    gradientClass: 'bg-gradient-to-br from-slate-900/80 via-pink-900/50 to-slate-900/80 border-pink-500/20',
    titleClass: 'text-pink-100 drop-shadow-[0_2px_10px_rgba(236,72,153,0.5)]',
    subtitleClass: 'text-pink-300/70',
    buttonClass: 'bg-pink-500 ring-pink-300',
  },
];

const App: React.FC = () => {
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [view, setView] = useState<ViewMode>('builder');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  
  // Recommendation State (Lifted Up)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  
  const teamRef = useRef<HTMLDivElement>(null);

  // Force dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const addPokemon = (pokemon: Pokemon) => {
    if (team.length >= MAX_TEAM_SIZE) return;
    if (team.some(p => p.id === pokemon.id)) return; // No duplicates
    setTeam([...team, pokemon]);
  };

  const removePokemon = (id: number) => {
    setTeam(team.filter(p => p.id !== id));
  };

  const handleClearTeam = () => {
    if (confirmClear) {
      setTeam([]);
      setRecommendations([]); // Clear recs too
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleDownloadTeam = async () => {
    if (!teamRef.current || team.length === 0) return;
    
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(teamRef.current, {
        backgroundColor: selectedTheme.hex,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `ma-team-pokeprairie-${selectedTheme.id}.png`;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("Erreur lors de la création de l'image. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleGetRecommendations = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;
    
    setRecLoading(true);
    try {
      const recs = await generateTeamRecommendations(apiKey, team);
      const hydratedRecs = await Promise.all(
        recs.map(async (rec) => {
          const p = await searchPokemon(rec.name);
          return { ...rec, pokemonData: p || undefined };
        })
      );
      setRecommendations(hydratedRecs.filter(r => r.pokemonData !== undefined));
    } catch (e) {
      console.error(e);
      alert("Impossible de générer des recommandations IA pour le moment.");
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-slate-900 via-emerald-900 to-slate-900 text-gray-100 flex flex-col">
      
      {/* Navbar - Glassmorphism */}
      <nav className="sticky top-0 z-50 glass-panel border-b-0 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('builder')}>
             <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 bg-emerald-800 text-emerald-200">
                <Leaf className="w-6 h-6 group-hover:rotate-12 transition-transform" />
             </div>
             <div>
               <h1 className="font-retro text-sm sm:text-lg tracking-tight text-white">
                 POKÉ-PRAIRIE
               </h1>
               <span className="text-[10px] font-sans opacity-70 block -mt-1">Team Builder</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex bg-white/10 p-1 rounded-full backdrop-blur-md">
              <button 
                onClick={() => setView('builder')}
                className={`p-2 rounded-full transition-all ${view === 'builder' ? 'bg-emerald-600 shadow text-white' : 'text-gray-400 hover:text-emerald-600'}`}
                title="Équipe"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setView('analysis')}
                className={`p-2 rounded-full transition-all ${view === 'analysis' ? 'bg-emerald-600 shadow text-white' : 'text-gray-400 hover:text-emerald-600'}`}
                title="Analyse"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setView('ai-studio')}
                className={`p-2 rounded-full transition-all ${view === 'ai-studio' ? 'bg-emerald-600 shadow text-white' : 'text-gray-400 hover:text-emerald-600'}`}
                title="Studio IA"
              >
                <Bot className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        
        {view === 'builder' && (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            
            {/* Top Controls: Search & Action Bar */}
            <div className="mb-8 relative z-30 space-y-6">
               <SearchBar onAdd={addPokemon} disabled={team.length >= MAX_TEAM_SIZE} />
               
               {team.length > 0 && (
                 <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                    
                    {/* Theme Selector */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-retro text-gray-400">
                        <Palette className="w-4 h-4" />
                        <span className="hidden sm:inline">Thème Export:</span>
                      </div>
                      <div className="flex gap-2">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme)}
                            className={`w-6 h-6 rounded-full transition-all duration-300 ${theme.buttonClass} ${selectedTheme.id === theme.id ? 'ring-2 ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                            title={`Thème ${theme.name}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {/* AI Suggestions Button */}
                      <button 
                        onClick={handleGetRecommendations}
                        disabled={recLoading || team.length >= MAX_TEAM_SIZE}
                        className="text-xs font-sans flex items-center gap-2 p-2 rounded-lg transition-all backdrop-blur-sm border text-amber-300 hover:text-amber-100 bg-amber-900/40 border-amber-800 hover:bg-amber-800/60 disabled:opacity-50"
                      >
                         {recLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                         <span className="hidden sm:inline">Suggestions IA</span>
                      </button>

                      {/* Export Button */}
                      <button 
                        onClick={handleDownloadTeam}
                        disabled={isExporting}
                        className="text-xs font-sans flex items-center gap-2 p-2 rounded-lg transition-all backdrop-blur-sm border text-emerald-300 hover:text-emerald-100 bg-emerald-900/40 border-emerald-800 hover:bg-emerald-800/60"
                      >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span className="hidden sm:inline">Exporter</span>
                      </button>

                      {/* Clear Button */}
                      <button 
                        onClick={handleClearTeam}
                        className={`text-xs font-sans flex items-center gap-1 p-2 rounded-lg transition-all backdrop-blur-sm border ${
                          confirmClear 
                            ? 'bg-red-600 text-white border-red-500 hover:bg-red-700 shadow-lg scale-105' 
                            : 'text-red-400 hover:text-red-300 bg-red-900/20 border-red-900/50 hover:bg-red-900/40'
                        }`}
                      >
                        <Trash2 className={`w-3 h-3 ${confirmClear ? 'animate-pulse' : ''}`} /> 
                        <span className="hidden sm:inline">{confirmClear ? "Confirmer ?" : "Vider"}</span>
                      </button>
                    </div>
                 </div>
               )}
            </div>

            {/* TEAM DISPLAY AREA (Captured for Export) */}
            <div 
              ref={teamRef} 
              className={`rounded-3xl p-4 sm:p-8 backdrop-blur-sm border border-white/5 shadow-2xl mb-8 transition-all duration-500 ${selectedTheme.gradientClass}`}
            >
              <div className="text-center mb-8">
                <h2 className={`font-retro text-xl sm:text-2xl mb-2 transition-colors duration-500 ${selectedTheme.titleClass}`}>
                  MA TEAM POKÉ-PRAIRIE
                </h2>
                <p className={`font-sans text-sm transition-colors duration-500 ${selectedTheme.subtitleClass}`}>
                  Prêt pour l'aventure.
                </p>
              </div>
              
              <TeamGrid team={team} onRemove={removePokemon} />
            </div>

            {/* AI Recommendations Display */}
            {recommendations.length > 0 && (
               <Recommendations 
                 recommendations={recommendations} 
                 onAdd={addPokemon} 
                 isFull={team.length >= MAX_TEAM_SIZE} 
               />
            )}
            
            {team.length > 0 && (
               <div className="text-center mt-12">
                 <button 
                   onClick={() => setView('analysis')}
                   className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-retro text-xs transition-all transform hover:scale-105 shadow-lg bg-emerald-800 text-emerald-100 border border-emerald-700 hover:bg-emerald-700"
                 >
                   Analyser la synergie &rarr;
                 </button>
               </div>
            )}
          </div>
        )}

        {view === 'analysis' && (
           <AnalysisPanel team={team} />
        )}

        {view === 'ai-studio' && (
           <div className="animate-[fadeIn_0.5s_ease-out]">
             <div className="mb-6 flex items-center justify-between">
                <h2 className="font-retro text-xl text-emerald-100">Studio IA</h2>
                <div className="text-xs font-sans px-3 py-1 rounded-full border backdrop-blur-md bg-emerald-900/50 border-emerald-700 text-emerald-300">
                   Propulsé par Gemini 2.5 & 3.0
                </div>
             </div>
             <AIStudio team={team} />
           </div>
        )}

      </main>
      
      <footer className="mt-auto border-t py-8 backdrop-blur-md border-emerald-900/50 bg-slate-900/50 text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center px-4 gap-4">
           <div className="text-center sm:text-left">
              <p className="font-sans text-sm text-slate-400">© {new Date().getFullYear()} Kévin Fernandez. Tous droits réservés.</p>
              <p className="font-retro text-[10px] mt-1 opacity-50">Créé avec passion • PokeAPI & Gemini</p>
           </div>
           <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 opacity-70 hover:opacity-100 transition-all transform hover:scale-110">
             <Github className="w-5 h-5" />
           </a>
        </div>
      </footer>
    </div>
  );
};


export default App;

