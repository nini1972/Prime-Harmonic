import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantProps {
  currentPrime: number | null;
}

export const Assistant = ({ currentPrime }: AssistantProps) => {
  const apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY ?? (import.meta as any).env?.GEMINI_API_KEY ?? '').trim();
  const modelName = ((import.meta as any).env?.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash').trim();
  const aiRef = useRef<GoogleGenAI | null>(apiKey ? new GoogleGenAI({ apiKey }) : null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ready to help. Ask about the current prime, the visible patterns, or where to explore next.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (currentPrime) {
      return [
        `Why is ${currentPrime} interesting?`,
        `What should I compare ${currentPrime} against?`,
        `Explain the pattern around ${currentPrime}.`,
      ];
    }

    return [
      'How do I read the Ulam spiral?',
      'What should I explore first?',
      'What are twin primes?',
    ];
  }, [currentPrime]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createLocalReply = (query: string) => {
    if (!currentPrime) {
      return `Offline mode is active. Select a prime first, then ask about patterns, gaps, or prime types for more specific guidance. You asked: "${query}".`;
    }

    return `Offline mode is active. Prime ${currentPrime} is currently selected, so a good next step is to inspect its local gap, compare its neighbors, or ask whether it belongs to a notable family. You asked: "${query}".`;
  };

  const handleSend = async (draft = input) => {
    const content = draft.trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (!aiRef.current) {
        setMessages((prev) => [...prev, { role: 'assistant', content: createLocalReply(userMsg.content) }]);
        return;
      }

      const response = await aiRef.current.models.generateContent({
        model: modelName,
        contents: [...messages, userMsg].map((message) => message.content).join('\n'),
        config: {
          systemInstruction: `You are a mathematical assistant specialized in number theory and primes.
          The user is interacting with a 3D visualization of primes.
          Current focused prime: ${currentPrime || 'None'}.
          If a prime is selected, you can reference if it is a Mersenne prime, part of a twin prime pair, or other interesting properties.
          Keep responses concise, insightful, and slightly mystical. Encourage the user to explore specific gaps or sequences like the Fibonacci sequence's intersection with primes.
          Maintain a "Technical Agent" tone: analytical, cold but insightful.`
        }
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: response.text || 'Process timeout.' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Gemini request failed. Continuing in local analysis mode.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-neutral-800 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Prime guide</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Ask for context, comparisons, or a suggested next step.
            </p>
          </div>

          {currentPrime && (
            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-300">
              Prime {currentPrime}
            </div>
          )}
        </div>
      </div>

      {!aiRef.current && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          Cloud responses are unavailable right now. You can still use the built-in guide for contextual prompts and offline suggestions.
        </div>
      )}

      <div className="border-b border-neutral-800 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => { void handleSend(suggestion); }}
              disabled={loading}
              className="rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-white disabled:opacity-40"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-[22px] border p-4 text-sm leading-relaxed whitespace-pre-wrap",
                message.role === 'user'
                  ? "ml-4 border-neutral-800 bg-white/5 text-neutral-200"
                  : "mr-4 border-cyan-500/20 bg-cyan-500/8 text-cyan-50"
              )}
            >
              <div className="mb-2 text-[10px] uppercase tracking-[0.2em] opacity-50">
                {message.role === 'user' ? 'You asked' : 'Guide'}
              </div>
              {message.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-400/50 animate-pulse">
            Thinking through the pattern...
          </div>
        )}
      </div>

      <div className="border-t border-neutral-800 bg-neutral-950/70 p-4">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          Ask about the current field
        </label>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                void handleSend();
              }
            }}
            placeholder={currentPrime ? `Ask about prime ${currentPrime}...` : 'Ask how to explore the field...'}
            className="flex-1 rounded-full border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => { void handleSend(); }}
            disabled={loading || !input.trim()}
            aria-label="Send prompt"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
