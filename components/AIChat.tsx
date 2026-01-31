
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, ResumeData } from '../types';
import { refineResumeWithChat } from '../services/geminiService';

interface AIChatProps {
  currentData: ResumeData;
  onUpdate: (newData: ResumeData) => void;
  initialDiagnosticTrigger?: boolean;
}

const DiffCard = ({ oldVal, newVal, onApply }: { oldVal: string, newVal: string, onApply: () => void }) => (
  <div className="bg-slate-950 border border-white/10 rounded-2xl overflow-hidden my-4 shadow-xl">
    <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex items-center justify-between">
      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Rewrite Proposal</span>
      <i className="fas fa-code-compare text-slate-600 text-[10px]"></i>
    </div>
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-red-500/50 uppercase">Current</span>
        <p className="text-xs text-slate-500 line-through leading-relaxed">{oldVal || 'None'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-emerald-500/50 uppercase">Proposed</span>
        <p className="text-xs text-slate-200 font-medium leading-relaxed">{newVal}</p>
      </div>
      <button 
        onClick={onApply}
        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
      >
        Apply Change
      </button>
    </div>
  </div>
);

const RoastCard = ({ text }: { text: string }) => (
  <div className="bg-red-500/5 border-l-4 border-red-500 rounded-r-2xl p-4 my-4">
    <div className="flex items-center gap-3 mb-2">
      <i className="fas fa-fire text-red-500 text-xs"></i>
      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Roast Mode</span>
    </div>
    <p className="text-xs text-slate-300 italic font-medium leading-relaxed">{text}</p>
  </div>
);

const AIChat: React.FC<AIChatProps> = ({ currentData, onUpdate, initialDiagnosticTrigger }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasTriggeredInitial = useRef(false);

  useEffect(() => {
    if (initialDiagnosticTrigger && !hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      runDiagnostic();
    }
  }, [initialDiagnosticTrigger]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const runDiagnostic = async () => {
    setIsTyping(true);
    try {
      const result = await refineResumeWithChat(currentData, "Run a full diagnostic on my resume. Be critical. Highlight one specific weakness and propose a fix.", []);
      handleResponse(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApplyProposal = (updatedData: ResumeData) => {
    onUpdate(updatedData);
    setMessages(prev => [...prev, { role: 'model', text: "✓ **Change Applied.** I've updated your resume live. What's next?" }]);
  };

  const handleResponse = (result: string) => {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/```\n([\s\S]*?)\n```/);
    let cleanText = result.replace(/```[\s\S]*?```/g, '').trim();
    let proposedData: ResumeData | null = null;

    if (jsonMatch) {
      try {
        proposedData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse patch", e);
      }
    }

    setMessages(prev => [
      ...prev, 
      { 
        role: 'model', 
        text: cleanText,
        // @ts-ignore - custom prop for internal handling
        proposal: proposedData 
      }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      const result = await refineResumeWithChat(currentData, userMsg, messages);
      handleResponse(result);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "**Error:** System timeout. Try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden fixed bottom-10 right-10 z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-emerald-500/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <i className="fas fa-brain text-white text-sm"></i>
          </div>
          <div>
            <span className="font-black text-xs uppercase tracking-widest text-white">Career Concierge</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">High-Agency Mode</span>
            </div>
          </div>
        </div>
        <button className="text-slate-600 hover:text-white transition-colors">
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/40">
        {messages.map((m, i) => {
          // @ts-ignore
          const proposal = m.proposal as ResumeData | undefined;
          const isRoast = m.text.toLowerCase().includes('roast') || m.text.toLowerCase().includes('critique');

          return (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-none font-medium' 
                  : 'bg-slate-800/50 text-slate-300 rounded-bl-none border border-white/5'
              }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                  {m.text}
                </ReactMarkdown>
                
                {proposal && (
                  <DiffCard 
                    oldVal={currentData.summary} // Over-simplified for demo; in real app we'd map parts
                    newVal={proposal.summary}
                    onApply={() => handleApplyProposal(proposal)}
                  />
                )}
                
                {isRoast && m.role === 'model' && !proposal && (
                   <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Agent Insights → Harsh Reality Check</p>
                   </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 px-5 py-4 rounded-3xl rounded-bl-none border border-white/5">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-emerald-500/40 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500/60 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-emerald-500/80 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-950 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Interrogate your resume..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600 font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="absolute right-3 top-2.5 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>
        <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.3em] mt-4 text-center">
          Career Strategy Model v3.0 Powered by Gemini
        </p>
      </div>
    </div>
  );
};

export default AIChat;
