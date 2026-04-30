
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AGENTS } from './constants';
import { Message } from './types';

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
);

const App: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: `${selectedAgent.systemPrompt} Focus on clinical accuracy. Ensure a tone consistent with medical research.`,
          temperature: 0.3,
        },
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'System unable to retrieve response.',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error communicating with clinical database. Please verify connection.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white shadow-none sm:shadow-sm border-x border-slate-100 overflow-hidden">
      
      {/* Agent Navigation - Centered & Branded */}
      <nav className="bg-white border-b border-slate-100 px-4 py-6 flex flex-wrap items-center justify-center gap-3">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => {
              setSelectedAgent(agent);
              setMessages([]);
            }}
            className={`px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 whitespace-nowrap ${
              selectedAgent.id === agent.id
                ? 'bg-[#fd4f00] text-white border-[#fd4f00] shadow-md scale-105'
                : 'bg-white text-slate-500 border-slate-200 hover:border-[#fd4f00] hover:text-[#fd4f00]'
            }`}
          >
            <span className={`text-lg leading-none ${selectedAgent.id === agent.id ? 'text-white' : 'text-[#fd4f00]'}`}>
              {agent.icon}
            </span>
            {agent.name}
          </button>
        ))}
      </nav>

      {/* Main Chat Content */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fdfdfd] custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl text-[#fd4f00] border border-slate-100 mb-2">
              {selectedAgent.icon}
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-montserrat uppercase tracking-tight">
              {selectedAgent.name}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-light">
              {selectedAgent.description} Inquiry portal connected to clinical research repositories. 
              Please state your research question below.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border ${
                msg.role === 'user' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white text-[#fd4f00] border-[#fd4f00]'
              }`}>
                {msg.role === 'user' ? 'USR' : selectedAgent.icon}
              </div>
              <div className={`p-5 rounded-2xl shadow-sm text-[14px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.content}
                <div className="mt-2 text-[9px] font-bold opacity-40 uppercase tracking-widest">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#fd4f00] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#fd4f00] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#fd4f00] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Clinical Drive</span>
             </div>
          </div>
        )}
      </main>

      {/* Input Console */}
      <footer className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Search clinical papers..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-[#fd4f00]/20 focus:border-[#fd4f00] transition-all resize-none min-h-[60px]"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-lg transition-all ${
              !input.trim() || isLoading
                ? 'text-slate-300'
                : 'bg-[#fd4f00] text-white hover:bg-black shadow-lg hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <SendIcon />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
           <span>SLA HEALTH CLINICAL ENGINE</span>
           <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
           <span>SECURE RESEARCH ACCESS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
