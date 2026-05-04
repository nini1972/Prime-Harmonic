import React, { useState, useCallback, useMemo } from 'react';
import { Viewport } from './components/Viewport';
import { Assistant } from './components/Assistant';
import { audioEngine } from './lib/audio';
import { motion } from 'motion/react';
import { Play, Volume2, Info, Maximize, Activity, Share2 } from 'lucide-react';
import { getPrimeType, getUlamCoordinates } from './lib/math';

const MemoizedViewport = React.memo(Viewport);

export default function App() {
  const [activePrime, setActivePrime] = useState<number | null>(null);
  const [limit, setLimit] = useState(500);
  const [audioStarted, setAudioStarted] = useState(false);

  const activeTypes = useMemo(() => activePrime ? getPrimeType(activePrime) : [], [activePrime]);

  const activeCoords = useMemo(() => {
    if (!activePrime) return { x: 0, y: 0, z: 0 };
    const [x, y, z] = getUlamCoordinates(activePrime);
    return { x, y, z };
  }, [activePrime]);

  const handlePointClick = useCallback((n: number) => {
    setActivePrime(n);
    if (!audioStarted) {
      audioEngine.start();
      setAudioStarted(true);
    }
    audioEngine.playPrime(n);
  }, [audioStarted]);

  return (
    <div className="h-screen w-full bg-neutral-950 text-neutral-300 font-sans flex flex-col p-8 overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-12 shrink-0">
        <div className="space-y-1">
          <h1 className="text-xs tracking-[0.3em] font-bold text-white uppercase flex items-center gap-2">
            Prime_Harmonic <span className="text-neutral-600 font-normal">//</span> <span className="text-cyan-400">v.0.9.4</span>
          </h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em]">Autonomous Mathematical Sonic Architecture</p>
        </div>
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-mono">Agent Active</span>
          </div>
          <button className="px-4 py-1.5 border border-neutral-800 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors flex items-center gap-2 group">
            <Share2 className="w-3 h-3 text-neutral-500 group-hover:text-black" />
            Export Data
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-12 gap-8 mb-8 overflow-hidden">
        
        {/* Left Column: Parameters */}
        <div className="col-span-3 flex flex-col gap-8 overflow-y-auto pr-4 custom-scrollbar">
          <section className="space-y-4">
            <h2 className="text-[10px] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2 flex justify-between">
              Input Formula <span>Calculated</span>
            </h2>
            <div className="bg-neutral-900/50 p-4 border border-neutral-800 space-y-2">
              <code className="text-sm text-cyan-400 font-mono block">f(p) = Ulam_Spiral(p)</code>
              <p className="text-[10px] text-neutral-500 italic">Projecting 3D coordinates for p ≤ {limit}</p>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-[10px] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Number Horizon</h2>
            <div className="space-y-4">
              <input 
                type="range" 
                min="50" 
                max="2000" 
                step="50"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full accent-white h-px bg-neutral-800 appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-500">
                <span>Min: 50</span>
                <span className="text-white">Active: {limit}</span>
                <span>Max: 2000</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Active Resonance</h2>
            <div className="p-4 bg-neutral-900/30 border border-neutral-800 space-y-3">
               <div className="text-4xl font-light font-mono text-white tracking-tighter">
                 {activePrime ? activePrime.toLocaleString() : "---"}
               </div>
               <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-wider">
                  {activeTypes.map(t => (
                    <span key={t} className="px-2 py-0.5 border border-cyan-500/30 text-cyan-400 bg-cyan-500/5">{t}</span>
                  ))}
                  {activePrime && activeTypes.length === 0 && <span className="text-neutral-600 italic">No Special properties</span>}
               </div>
            </div>
          </section>

          <section className="bg-neutral-900/30 border border-neutral-800 p-4 mt-auto">
            <p className="text-[11px] leading-relaxed opacity-70 font-mono">
              <span className="text-cyan-500 font-bold uppercase tracking-widest block mb-1">System Log:</span> 
              {activePrime 
                ? `Analyzing prime ${activePrime}. Harmonic resonance active.` 
                : "Awaiting system authorization. Select a coordinate to begin analysis."}
            </p>
          </section>
        </div>

        {/* Center Column: 3D Visualization */}
        <div className="col-span-6 relative border border-neutral-800 bg-neutral-900/20 rounded-sm overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 relative">
            <Viewport 
              limit={limit} 
              activeId={activePrime} 
              onPointClick={handlePointClick} 
            />
            <div className="absolute top-4 left-4 text-[9px] uppercase tracking-widest text-neutral-600 pointer-events-none">
              Visual Coordinate System: Polar Spiral
            </div>
            <div className="absolute bottom-4 right-4 flex gap-4 text-[9px] uppercase tracking-widest text-neutral-600 pointer-events-none font-mono">
              <span>X: {activeCoords.x.toFixed(4)}</span>
              <span>Y: {activeCoords.y.toFixed(4)}</span>
              <span>Z: {activeCoords.z.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Assistant & Sonic Spectrum */}
        <div className="col-span-3 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-neutral-800 bg-neutral-900/10">
            <Assistant currentPrime={activePrime} />
          </div>
          
          <div className="h-48 shrink-0 flex flex-col">
            <h2 className="text-[10px] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2 mb-4">Sonic Spectrum</h2>
            <div className="flex-1 flex items-end gap-1 px-2 mb-4">
              {[30, 60, 45, 90, 20, 55, 70, 100, 10, 40, 65, 80].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-cyan-500/20 transition-all duration-300"
                  style={{ height: `${activePrime ? (h + Math.random() * 20 - 10) : h * 0.1}%`, opacity: activePrime ? 1 : 0.2 }}
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div className="p-2 border border-neutral-800 bg-neutral-900/50">
                  <div className="text-[8px] text-neutral-600 uppercase mb-0.5 tracking-widest">Oscillator</div>
                  <div className="text-[10px] font-mono text-white truncate">Sine_Harmonic_A</div>
               </div>
               <div className="p-2 border border-neutral-800 bg-neutral-900/50">
                  <div className="text-[8px] text-neutral-600 uppercase mb-0.5 tracking-widest">Reverb</div>
                  <div className="text-[10px] font-mono text-white">4.2s Tail</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation / Playback */}
      <footer className="h-16 border-t border-neutral-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex gap-8 items-center h-full">
          {!audioStarted ? (
            <button 
              onClick={() => { audioEngine.start(); setAudioStarted(true); }}
              className="flex items-center gap-3 group px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
            >
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-black border-b-[4px] border-b-transparent"></div>
              Initialize Sonic Stream
            </button>
          ) : (
            <div className="flex items-center gap-3 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></div>
              Stream Active
            </div>
          )}
          <div className="h-4 w-px bg-neutral-800"></div>
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] text-neutral-600 uppercase tracking-tighter">Current P[n]</span>
              <span className="text-[10px] font-mono text-neutral-400">{activePrime || 'Static'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-neutral-600 uppercase tracking-tighter">Gap Probability</span>
              <span className="text-[10px] font-mono text-neutral-400">0.00142%</span>
            </div>
          </div>
        </div>

        <nav className="flex gap-8 items-center h-full">
          <div className="flex gap-6">
            <button className="text-[10px] uppercase tracking-widest text-white border-b border-white pb-1 transition-all">Visualization</button>
            <button className="text-[10px] uppercase tracking-widest text-neutral-600 hover:text-white transition-all">Patterns</button>
            <button className="text-[10px] uppercase tracking-widest text-neutral-600 hover:text-white transition-all">Theory</button>
          </div>
          <div className="h-4 w-px bg-neutral-800"></div>
          <span className="text-[9px] font-mono text-neutral-700 uppercase tracking-widest">Sys_Status: Operational</span>
        </nav>
      </footer>

      {/* Overlay Overlay for initial start */}
      {!audioStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md w-full"
          >
            <div className="w-24 h-24 border border-neutral-800 bg-neutral-900/50 flex items-center justify-center mx-auto mb-12 relative overflow-hidden group">
               <Activity className="w-8 h-8 text-cyan-500 absolute z-10" />
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent)] group-hover:scale-150 transition-transform duration-1000"></div>
            </div>
            
            <h2 className="text-xs font-bold text-white mb-4 tracking-[0.4em] uppercase">Security Protocol Required</h2>
            <p className="text-neutral-500 mb-12 text-[11px] uppercase tracking-widest leading-relaxed">
              Browser constraints require explicit interaction for spatial audio sonification of prime patterns.
            </p>
            
            <button 
              onClick={() => { audioEngine.start(); setAudioStarted(true); }}
              className="px-12 py-3 bg-white text-black font-bold text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              Authorize Frequency Access
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}


