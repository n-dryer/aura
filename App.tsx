
import React, { useState, useEffect, useRef } from 'react';
import { AppStep, ResumeData, EditorTab, ThemePreset, PersonaResult } from './types';
import { classifyPersona, parseResume, generateDynamicThemes, generateAuraBackground } from './services/geminiService';
import Hero from './components/Hero';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AIChat from './components/AIChat';

const AURA_ZERO: ThemePreset = {
  id: 'aura-zero',
  name: 'Aura Zero',
  description: 'The Baseline. Clean, minimal, utility-first.',
  accentColor: '#10b981',
  secondaryColor: '#09090b',
  fontFamily: 'Inter',
  headingFont: 'Inter',
  style: 'Minimalist Utility',
  type: 'static'
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [activeTab, setActiveTab] = useState<EditorTab>(EditorTab.VIBES);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [persona, setPersona] = useState<string>('');
  const [roast, setRoast] = useState<string>('');
  const [themes, setThemes] = useState<ThemePreset[]>([AURA_ZERO]);
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readyForDiagnostic, setReadyForDiagnostic] = useState(false);
  
  // Cache to prevent redundant processing of the same file
  const lastProcessedHash = useRef<string | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-ignore
      if (typeof window.aistudio !== 'undefined') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setStep(AppStep.API_CONFIG);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setStep(AppStep.LANDING);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    // Simple hash for caching
    const fileHash = `${file.name}-${file.size}-${file.lastModified}`;
    if (fileHash === lastProcessedHash.current && resumeData) {
      setStep(AppStep.EDITING);
      return;
    }

    setStep(AppStep.ANALYZING);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const personaResult: PersonaResult = await classifyPersona(base64);
        setPersona(personaResult.persona);
        setRoast(personaResult.roast);

        setIsGeneratingThemes(true);
        const suggestedThemesPromise = generateDynamicThemes(personaResult.persona, personaResult.title);
        const fullDataPromise = parseResume(base64);

        const fullData = await fullDataPromise;
        setResumeData({
          ...fullData,
          appearance: {
            accentColor: AURA_ZERO.accentColor,
            fontFamily: AURA_ZERO.fontFamily,
            activeThemeId: AURA_ZERO.id,
            theme: 'glass'
          }
        });

        lastProcessedHash.current = fileHash;
        setStep(AppStep.EDITING);
        setReadyForDiagnostic(true);

        const suggestedThemes = await suggestedThemesPromise;
        suggestedThemes.forEach(async (theme) => {
          setThemes(prev => [...prev, theme]);
          try {
            const bg = await generateAuraBackground(theme, personaResult.persona);
            if (bg) {
              setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, bgImage: bg } : t));
            }
          } catch (e: any) {
            const msg = e.message || '';
            if (msg.includes("Requested entity was not found") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
              setError("High-quality model access restricted. Project quota likely reached.");
              setStep(AppStep.API_CONFIG);
            }
          }
        });

        setIsGeneratingThemes(false);
      } catch (err: any) {
        console.error("Analysis error:", err);
        const msg = err.message || '';
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
           setError("API Rate Limit hit. Please try again in a few moments or select a paid key.");
           setStep(AppStep.API_CONFIG);
        } else {
           setError(msg || "Analysis failed.");
           setStep(AppStep.LANDING);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = () => setStep(AppStep.PUBLISHED);

  if (step === AppStep.API_CONFIG) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-slate-950 text-white">
        <div className="max-w-md w-full text-center space-y-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <i className="fas fa-key text-3xl"></i>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Quota & Power</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              To generate high-quality 4K visual textures and use high-agency career analysis, AURA requires a project-linked API key with sufficient quota.
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-left space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Instructions</h4>
            <ul className="text-xs text-slate-300 space-y-3">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">1</span>
                <span>Select a project with billing enabled to avoid '429' errors.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">2</span>
                <span>Ensure the Google GenAI API is enabled in your Google Cloud console.</span>
              </li>
            </ul>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="block text-center py-2 text-[10px] font-bold text-slate-500 hover:text-white underline underline-offset-4"
            >
              Learn about billing documentation
            </a>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl shadow-emerald-500/20"
          >
            Select/Update API Key
          </button>
          <button 
            onClick={() => setStep(AppStep.LANDING)}
            className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-widest pt-4"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 selection:bg-emerald-500/30 selection:text-white">
      <nav className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl sticky top-0 z-[60]">
        <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setStep(AppStep.LANDING)}>
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <i className="fas fa-sparkles text-xl text-white"></i>
          </div>
          <span className="text-2xl font-black tracking-tighter text-white block uppercase text-emerald-400">AURA</span>
        </div>
        
        <div className="flex items-center gap-6">
          {step === AppStep.EDITING && (
            <button 
              onClick={handlePublish}
              className="bg-white text-slate-950 px-10 py-3.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
            >
              Deploy Site
              <i className="fas fa-rocket text-[10px]"></i>
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {step === AppStep.LANDING && <Hero onFileSelect={handleFileSelect} />}

        {step === AppStep.ANALYZING && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-950">
            <div className="relative z-10 text-center space-y-12 max-w-2xl">
              <div className="w-32 h-32 mx-auto relative">
                <div className="absolute inset-0 border-[3px] border-emerald-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-[3px] border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-brain text-4xl text-emerald-500 animate-pulse"></i>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Analyzing Aura...</h2>
                {roast && (
                  <div className="py-6 px-10 bg-white/5 border border-white/10 rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-700">
                    <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Spicy Take</p>
                    <p className="text-slate-300 text-lg font-medium italic">"{roast}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === AppStep.EDITING && resumeData && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-full md:w-[450px] shrink-0 z-10 border-r border-white/5">
              <Editor 
                data={resumeData} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onChange={setResumeData} 
                themes={themes}
                isGeneratingThemes={isGeneratingThemes}
                persona={persona}
              />
            </div>
            
            <div className="hidden md:flex flex-1 bg-black p-16 overflow-y-auto custom-scrollbar justify-center items-start">
              <div className="w-full max-w-5xl animate-in zoom-in-95 fade-in duration-1000 origin-top">
                <Preview data={resumeData} />
              </div>
            </div>

            <AIChat 
              currentData={resumeData} 
              onUpdate={setResumeData} 
              initialDiagnosticTrigger={readyForDiagnostic}
            />
          </div>
        )}

        {step === AppStep.PUBLISHED && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <i className="fas fa-check text-4xl text-white"></i>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-white mb-8 uppercase tracking-tighter">SITE IS LIVE.</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl">
              Your identity has been captured and deployed to the edge.
            </p>
            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 w-full max-w-2xl mb-12">
              <div className="flex items-center justify-between bg-black px-8 py-6 rounded-3xl border border-white/5">
                <span className="text-emerald-400 font-black text-lg truncate">https://aura.pages.dev/u/guest-{Math.random().toString(36).substring(7)}</span>
                <i className="fas fa-copy text-slate-500 cursor-pointer hover:text-white transition-colors"></i>
              </div>
            </div>
            <button onClick={() => setStep(AppStep.EDITING)} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px]">Back to Edit</button>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed bottom-8 right-8 bg-red-600 text-white px-8 py-4 rounded-[2rem] z-[200] animate-in slide-in-from-right-8 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-4">
          <i className="fas fa-triangle-exclamation"></i>
          <span className="max-w-[300px] truncate">{error}</span>
          <button onClick={() => setError(null)} className="ml-4 opacity-50"><i className="fas fa-times"></i></button>
        </div>
      )}
    </div>
  );
};

export default App;
