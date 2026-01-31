
import React, { useState } from 'react';
import { ResumeData, EditorTab, ThemePreset } from '../types';
import { generateAuraBackground, generateCustomAura } from '../services/geminiService';

interface EditorProps {
  data: ResumeData;
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  onChange: (data: ResumeData) => void;
  themes: ThemePreset[];
  isGeneratingThemes: boolean;
  persona: string;
}

const VibeThumbnail = ({ 
  theme, 
  isActive, 
  isRefining, 
  onClick
}: { 
  theme: ThemePreset, 
  isActive: boolean, 
  isRefining: boolean, 
  onClick: () => void
}) => {
  const hasTexture = !!theme.bgImage;
  const isStatic = theme.type === 'static';

  return (
    <button
      onClick={onClick}
      disabled={isRefining}
      className={`relative w-full aspect-video rounded-3xl overflow-hidden text-left transition-all group border-2 ${
        isActive 
          ? 'border-emerald-500 scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.2)]' 
          : 'border-white/5 hover:border-white/20'
      }`}
    >
      {/* 1. CSS Gradient Placeholder (Always underneath) */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ 
          background: `linear-gradient(135deg, ${theme.secondaryColor} 0%, ${theme.accentColor}44 100%)`,
          backgroundColor: '#09090b'
        }}
      />

      {/* 2. Texture Layer (Fades in when ready) */}
      {!isStatic && (
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 group-hover:scale-110 ${hasTexture ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: hasTexture ? `url(${theme.bgImage})` : 'none' }}
        />
      )}

      {/* Pulse effect if loading texture */}
      {!isStatic && !hasTexture && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

      {/* Mini-Site Skeleton */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <div className="space-y-2">
          <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: theme.accentColor }} />
          <div className="h-1 w-2/5 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Label */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
          {theme.name}
        </div>
        {!isStatic && !hasTexture && (
           <div className="px-2 py-1 bg-white/10 rounded-full text-[8px] font-black text-white animate-pulse">
             DESIGNING...
           </div>
        )}
      </div>
    </button>
  );
};

const Editor: React.FC<EditorProps> = ({ data, activeTab, setActiveTab, onChange, themes, isGeneratingThemes, persona }) => {
  const [isRefining, setIsRefining] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [customGeneratedTheme, setCustomGeneratedTheme] = useState<ThemePreset | null>(null);

  const handleChange = (path: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    const keys = path.split('.');
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  const applyTheme = async (theme: ThemePreset) => {
    setIsRefining(true);
    let bgImage = theme.bgImage;
    if (!bgImage && theme.type !== 'static') {
      bgImage = await generateAuraBackground(theme, persona) || undefined;
    }
    
    onChange({
      ...data,
      appearance: {
        ...data.appearance,
        accentColor: theme.accentColor,
        fontFamily: theme.fontFamily,
        activeThemeId: theme.id,
        bgImage: theme.type === 'static' ? undefined : bgImage
      }
    });
    setIsRefining(false);
  };

  const handleCustomAura = async () => {
    if (!customPrompt.trim()) return;
    setIsCustomLoading(true);
    try {
      const customTheme = await generateCustomAura(customPrompt, persona);
      const bgImage = await generateAuraBackground(customTheme, persona) || undefined;
      const themeWithBg = { ...customTheme, bgImage };
      setCustomGeneratedTheme(themeWithBg);
      await applyTheme(themeWithBg);
      setCustomPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCustomLoading(false);
    }
  };

  const InputField = ({ label, value, onChange }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-white/5">
      <div className="flex p-4 gap-3 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        {[
          { id: EditorTab.CONTENT, icon: 'fa-file-lines', label: 'Info' },
          { id: EditorTab.VIBES, icon: 'fa-sparkles', label: 'Vibes' },
          { id: EditorTab.MAGIC, icon: 'fa-brain', label: 'Magic' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === tab.id 
                ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="hidden lg:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
        {activeTab === EditorTab.CONTENT && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <section className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400">Core Identity</h3>
              <div className="grid grid-cols-1 gap-6">
                <InputField label="Name" value={data.name} onChange={(v: string) => handleChange('name', v)} />
                <InputField label="Title" value={data.title} onChange={(v: string) => handleChange('title', v)} />
                <InputField label="Email" value={data.contact.email} onChange={(v: string) => handleChange('contact.email', v)} />
                <InputField label="Location" value={data.contact.location} onChange={(v: string) => handleChange('contact.location', v)} />
              </div>
            </section>
          </div>
        )}

        {activeTab === EditorTab.VIBES && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400">Generative Vibes</h3>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{persona}</span>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {/* 5-Card Layout Implementation */}
                {themes.map((theme) => (
                  <VibeThumbnail 
                    key={theme.id}
                    theme={theme}
                    isActive={data.appearance?.activeThemeId === theme.id}
                    isRefining={isRefining}
                    onClick={() => applyTheme(theme)}
                  />
                ))}

                {/* Slot 5: Custom Vibe or Hot-Swapped Result */}
                {customGeneratedTheme ? (
                  <VibeThumbnail 
                    theme={customGeneratedTheme}
                    isActive={data.appearance?.activeThemeId === customGeneratedTheme.id}
                    isRefining={isRefining}
                    onClick={() => applyTheme(customGeneratedTheme)}
                  />
                ) : (
                  <div className={`relative w-full aspect-video rounded-3xl overflow-hidden p-7 border-2 border-white/5 bg-slate-900/40 transition-all ${isCustomLoading ? 'border-emerald-500/50' : ''}`}>
                     {isCustomLoading && (
                       <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Casting custom aura...</span>
                       </div>
                     )}

                     <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                              <i className="fas fa-wand-magic-sparkles text-emerald-400"></i>
                           </div>
                           <h4 className="font-black text-xs uppercase tracking-wider text-white">Create Your Aura</h4>
                        </div>

                        <div className="relative">
                           <input 
                             type="text" 
                             placeholder="e.g. 'Cyberpunk Forest'..."
                             value={customPrompt}
                             onChange={(e) => setCustomPrompt(e.target.value)}
                             className="w-full bg-slate-950/80 border border-white/5 rounded-2xl px-5 py-4 text-[10px] text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all pr-14"
                           />
                           <button 
                             onClick={handleCustomAura}
                             disabled={isCustomLoading || !customPrompt.trim()}
                             className="absolute right-3 top-2.5 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:scale-110 disabled:opacity-30"
                           >
                             <i className="fas fa-arrow-right"></i>
                           </button>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === EditorTab.MAGIC && (
          <div className="h-[400px] flex flex-col justify-center items-center text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center relative">
              <i className="fas fa-robot text-3xl text-emerald-500"></i>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black uppercase text-white">The Career Oracle</h3>
              <p className="text-slate-500 text-xs px-10 font-medium leading-relaxed uppercase tracking-wider">
                Ask the assistant to rewrite sections or suggest bold changes to your branding.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900/40 border-t border-white/5">
         <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            <span>Stateless</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Instant</span>
         </div>
      </div>
    </div>
  );
};

export default Editor;
