import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Zap, BookOpen, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantProps {
  currentPrime: number | null;
}

export const Assistant = ({ currentPrime }: AssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'AGENT LOG: Sequence initialized. Awaiting vector input for spatiotemporal analysis.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMsg].map(m => m.content).join('\n'),
        config: {
          systemInstruction: `You are a mathematical assistant specialized in number theory and primes. 
          The user is interacting with a 3D visualization of primes. 
          Current focused prime: ${currentPrime || 'None'}.
          If a prime is selected, you can reference if it is a Mersenne prime, part of a twin prime pair, or other interesting properties.
          Keep responses concise, insightful, and slightly mystical. Encourage the user to explore specific gaps or sequences like the Fibonacci sequence's intersection with primes.
          Maintain a "Technical Agent" tone: analytical, cold but insightful.`
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: `ANALYSIS: ${response.text || 'Process timeout.'}` }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'SYSTEM ERROR: Buffer overflow in number stream.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-mono text-[11px]">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-cyan-500" />
          <span className="uppercase tracking-[0.2em] font-bold text-neutral-400">Agentic_Theory</span>
        </div>
        <span className="text-[9px] text-neutral-600">ID: 412-PRIME</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "p-3 border leading-relaxed",
                m.role === 'user' 
                  ? "ml-4 bg-white/5 border-neutral-800 text-neutral-300" 
                  : "mr-4 bg-cyan-500/5 border-cyan-500/20 text-cyan-100"
              )}
            >
              <div className="text-[8px] uppercase tracking-[0.2em] mb-1.5 opacity-40">
                {m.role === 'user' ? 'Input_Vector' : 'Agent_Output'}
              </div>
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && <div className="text-cyan-500/30 animate-pulse uppercase tracking-widest text-[9px]">Processing_Map...</div>}
      </div>

      <div className="p-4 border-t border-neutral-800 bg-neutral-900/40 relative z-20">
        <div className="flex gap-2 isolate">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Query number patterns..."
            className="flex-1 bg-transparent border-b border-neutral-700 text-white px-2 py-1.5 outline-none focus:border-cyan-500 placeholder:text-neutral-700 transition-colors pointer-events-auto relative z-30"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="p-1 text-neutral-500 hover:text-white transition-colors disabled:opacity-20 pointer-events-auto"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
