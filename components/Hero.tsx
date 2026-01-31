
import React, { useState } from 'react';

interface HeroProps {
  onFileSelect: (file: File) => void;
}

const Hero: React.FC<HeroProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div 
      className={`relative flex-1 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ${isDragging ? 'bg-emerald-500/10' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Immersive Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[200px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[200px] animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:40px_40px] opacity-40"></div>
      </div>

      <div className="max-w-6xl w-full text-center space-y-12">
        <div className="space-y-6">
          <h1 className="text-8xl md:text-[11rem] font-black tracking-tighter leading-[0.75] text-white">
            CHECK YOUR<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500">AURA.</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-slate-400 max-w-2xl mx-auto font-light leading-snug">
            Your identity, dreamed up by AI. <br/>
            <span className="text-emerald-400 font-medium">Drop a PDF to deploy.</span>
          </p>
        </div>

        {/* Massive Drop Zone */}
        <div 
          onClick={() => document.getElementById('aura-file-input')?.click()}
          className={`relative group max-w-4xl mx-auto cursor-pointer p-1.5 transition-all duration-700 rounded-[4rem] ${isDragging ? 'scale-[1.05]' : 'hover:scale-[1.01]'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/50 via-cyan-500/30 to-emerald-500/50 rounded-[4rem] opacity-30 blur-3xl group-hover:opacity-60 transition-opacity"></div>
          
          <div className="relative bg-slate-900/40 backdrop-blur-3xl border-2 border-dashed border-white/10 group-hover:border-emerald-500/50 rounded-[3.8rem] p-24 md:p-36 overflow-hidden transition-all">
            <input 
              type="file" 
              id="aura-file-input" 
              className="hidden" 
              accept="image/*,.pdf" 
              onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} 
            />
            
            <div className="space-y-10 relative z-10">
              <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto ring-1 ring-white/10 group-hover:ring-emerald-500/50 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-1000 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <i className={`fas ${isDragging ? 'fa-arrow-down animate-bounce' : 'fa-cloud-arrow-up'} text-6xl text-emerald-400`}></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-white tracking-tight uppercase">Drop to Deploy</h3>
                <p className="text-slate-500 text-xl font-medium tracking-wide">PDF, PNG, or JPEG</p>
              </div>
            </div>

            {/* Pulsing Scan Effect */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 bg-emerald-500/10"></div>
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_30px_#10b981] animate-[aura-scan_2s_linear_infinite]"></div>
            </div>
          </div>
        </div>

        <div className="pt-12 text-slate-600 text-[11px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4">
           <span>Stateless</span>
           <span className="w-1 h-1 rounded-full bg-slate-800"></span>
           <span>Instant</span>
           <span className="w-1 h-1 rounded-full bg-slate-800"></span>
           <span>Bespoke</span>
        </div>
      </div>

      <style>{`
        @keyframes aura-scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Hero;
