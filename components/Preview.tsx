
import React from 'react';
import { ResumeData } from '../types';

interface PreviewProps {
  data: ResumeData;
}

const Preview: React.FC<PreviewProps> = ({ data }) => {
  const accentColor = data.appearance?.accentColor || '#10b981';
  const theme = data.appearance?.theme || 'glass';
  const bgImage = data.appearance?.bgImage;
  const fontFamily = data.appearance?.fontFamily || 'Inter';

  const containerStyle: React.CSSProperties = {
    fontFamily: fontFamily,
  };

  const themeStyles = {
    light: "bg-white text-slate-900 border-white/10",
    dark: "bg-slate-950 text-slate-100 border-white/5",
    glass: "bg-white/5 backdrop-blur-2xl text-slate-100 border-white/10"
  };

  return (
    <div 
      className={`w-full min-h-[1100px] max-w-7xl mx-auto shadow-[0_0_120px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-in-out overflow-hidden rounded-[3rem] border relative group ${themeStyles[theme as keyof typeof themeStyles] || themeStyles.glass}`}
      style={containerStyle}
    >
      
      {/* Background Layer */}
      {bgImage && (
        <div className="absolute inset-0 z-0 opacity-40 transition-opacity duration-1000">
          <img src={bgImage} alt="Generative Background" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 ${theme === 'light' ? 'bg-white/80' : 'bg-slate-950/80'}`}></div>
        </div>
      )}

      {/* Gradient Aura */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] opacity-10 transition-colors duration-1000" style={{ backgroundColor: accentColor }}></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] blur-[150px] opacity-10 transition-colors duration-1000" style={{ backgroundColor: accentColor }}></div>

      {/* Header Section */}
      <header className="px-10 md:px-16 pt-24 md:pt-36 pb-16 md:pb-24 relative z-10">
        <div className="max-w-5xl">
          <div className="space-y-8">
            <div className="w-20 h-2 rounded-full mb-12 transition-colors duration-500" style={{ backgroundColor: accentColor }}></div>
            <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8] break-words">
              {data.name.split(' ').map((part, i) => (
                <span key={i} className="block">{part}</span>
              ))}
            </h1>
            <p className="text-2xl sm:text-3xl md:text-5xl font-light opacity-90 tracking-tight transition-colors duration-500 mt-8 break-words" style={{ color: accentColor }}>
              {data.title}
            </p>
          </div>

          <div className="mt-16 md:mt-24 flex flex-wrap gap-x-12 gap-y-6 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
            <span className="flex items-center gap-3 shrink-0"><i className="far fa-envelope text-xs"></i> {data.contact.email}</span>
            <span className="flex items-center gap-3 shrink-0"><i className="fas fa-location-dot text-xs"></i> {data.contact.location}</span>
            {data.contact.linkedin && <span className="flex items-center gap-3 shrink-0"><i className="fab fa-linkedin text-xs"></i> LinkedIn</span>}
            {data.contact.github && <span className="flex items-center gap-3 shrink-0"><i className="fab fa-github text-xs"></i> GitHub</span>}
          </div>
        </div>
      </header>

      {/* Main Content - Improved Fluid Grid with responsive columns and gaps */}
      <div className="max-w-7xl mx-auto px-10 md:px-16 py-16 md:py-32 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-16 md:gap-24 relative z-10">
        
        {/* Primary Bio Column */}
        <div className="space-y-32 md:space-y-48">
          {/* Summary */}
          <section className="space-y-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">The Professional Identity</h2>
            <p className="text-2xl sm:text-3xl md:text-5xl font-light leading-[1.15] tracking-tight break-words hyphens-auto">
              {data.summary}
            </p>
          </section>

          {/* Experience */}
          <section className="space-y-16 md:space-y-24">
             <h2 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Selected Experience</h2>
             <div className="space-y-24 md:space-y-36">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="group relative">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 md:gap-6 mb-8">
                      <h3 className="text-3xl md:text-4xl font-black tracking-tight break-words">{exp.company}</h3>
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-30 shrink-0">{exp.period}</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold mb-8 transition-colors duration-500 break-words" style={{ color: accentColor }}>{exp.position}</p>
                    <ul className="space-y-8">
                      {exp.description.map((item, j) => (
                        <li key={j} className="flex items-start gap-6 text-lg md:text-xl opacity-60 font-light leading-relaxed group-hover:opacity-100 transition-opacity break-words">
                          <span className="mt-2.5 md:mt-3.5 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full flex-shrink-0 transition-colors duration-500" style={{ backgroundColor: accentColor }}></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Secondary Info Column */}
        <div className="space-y-24 md:space-y-40">
          {/* Skills */}
          <section className="space-y-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Core Mastery</h2>
            <div className="flex flex-col gap-4 md:gap-5">
              {data.skills.map((skill, i) => (
                <div key={i} className="group flex items-center justify-between py-3 border-b border-white/5 overflow-hidden">
                  <span className="text-xs md:text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 group-hover:translate-x-2 transition-all truncate pr-4">
                    {skill}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ backgroundColor: accentColor }}></div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="space-y-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Foundations</h2>
            <div className="space-y-16">
              {data.education.map((edu) => (
                <div key={edu.id} className="space-y-4">
                  <h3 className="text-2xl font-black leading-tight break-words">{edu.institution}</h3>
                  <div className="space-y-1.5">
                    <p className="text-sm md:text-base font-bold opacity-80 transition-colors duration-500 break-words" style={{ color: accentColor }}>{edu.degree}</p>
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-30">{edu.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="px-10 md:px-16 py-24 md:py-32 border-t border-white/5 relative z-10 flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] font-black uppercase tracking-[0.5em] opacity-20">
        <span className="flex items-center gap-3"><i className="fas fa-sparkles"></i> Crafted by Aura</span>
        <div className="flex flex-wrap justify-center gap-10">
          <span className="truncate max-w-[200px]">{data.name}</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default Preview;
