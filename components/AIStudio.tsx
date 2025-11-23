import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Send, Sparkles, Loader2, Bot, Upload } from 'lucide-react';
import { Pokemon, ChatMessage } from '../types';
import { createChatSession, editTeamImage } from '../services/geminiService';
import { Chat } from "@google/genai";

interface Props {
  team: Pokemon[];
}

export const AIStudio: React.FC<Props> = ({ team }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'image'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Bonjour ! Je suis votre Coach Neo-Dex. J'ai analysé votre équipe. Posez-moi des questions sur la stratégie, les contres ou les attaques !" }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = process.env.API_KEY;

  // Initialize Chat
  useEffect(() => {
    if (apiKey && !chatSessionRef.current) {
      chatSessionRef.current = createChatSession(apiKey, team);
    }
  }, [apiKey, team]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text;
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Erreur de connexion au Coach IA. Veuillez réessayer." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setGeneratedImage(null); // Reset generated image on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageGeneration = async () => {
    if (!selectedImage || !imagePrompt || !apiKey) return;
    
    setImageLoading(true);
    try {
      const result = await editTeamImage(apiKey, selectedImage, imagePrompt);
      if (result) {
        setGeneratedImage(result);
      }
    } catch (e) {
        console.error(e);
      alert("Échec de la génération de l'image. Essayez une autre instruction.");
    } finally {
      setImageLoading(false);
    }
  };

  if (!apiKey) {
      return <div className="p-8 text-center text-red-500 font-retro">Clé API manquante</div>;
  }

  return (
    <div className="glass-panel rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col backdrop-blur-xl border-white/20">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-4 font-retro text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'chat' 
              ? 'bg-white/50 dark:bg-black/20 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500' 
              : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-white/10'
          }`}
        >
          <Bot className="w-4 h-4" /> Coach Stratégique
        </button>
        <button 
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-4 font-retro text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'image' 
              ? 'bg-white/50 dark:bg-black/20 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500' 
              : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-white/10'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Studio Image
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white/40 dark:bg-black/20">
        
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 font-sans text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                  }`}>
                    {msg.role === 'model' && <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1 uppercase tracking-wider"><Bot size={12}/> COACH IA</div>}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Posez une question sur votre équipe..."
                  className="flex-1 bg-gray-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={chatLoading}
                  className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {chatLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE TAB */}
        {activeTab === 'image' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                 <h3 className="font-retro text-gray-800 dark:text-white">Éditeur Visuel</h3>
                 <p className="font-sans text-sm text-gray-600 dark:text-gray-400">Téléchargez une capture de votre équipe et utilisez l'IA pour appliquer des filtres rétro.</p>
              </div>

              {/* Upload Area */}
              <div className="flex flex-col md:flex-row gap-6">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex-1 h-64 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/20 transition-colors bg-white/10 dark:bg-black/10 overflow-hidden relative group"
                 >
                    {selectedImage ? (
                        <img src={selectedImage} alt="Original" className="w-full h-full object-contain" />
                    ) : (
                        <>
                            <Upload className="w-10 h-10 text-gray-400 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-sans text-sm text-gray-500 dark:text-gray-400">Cliquez pour ajouter une image</span>
                        </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </div>

                 {/* Result Area */}
                 <div className="flex-1 h-64 border-2 border-transparent bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
                    {imageLoading ? (
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                            <span className="font-retro text-xs text-gray-400">Magie en cours...</span>
                        </div>
                    ) : generatedImage ? (
                        <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                    ) : (
                        <span className="font-sans text-sm text-gray-400">Le résultat apparaîtra ici</span>
                    )}
                 </div>
              </div>

              {/* Controls */}
              <div className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col gap-4 backdrop-blur">
                 <div>
                    <label className="font-retro text-[10px] text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wide">Votre demande</label>
                    <input 
                      type="text" 
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="ex: 'Style GameBoy', 'Filtre pixel art', 'Ambiance néon'..."
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                    />
                 </div>
                 <button 
                   onClick={handleImageGeneration}
                   disabled={imageLoading || !selectedImage || !imagePrompt}
                   className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-retro text-xs hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
                 >
                    <Sparkles className="w-4 h-4" /> Générer avec Gemini
                 </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};