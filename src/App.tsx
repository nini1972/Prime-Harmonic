import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Share2, Volume2 } from 'lucide-react';
import { Viewport } from './components/Viewport';
import { Assistant } from './components/Assistant';
import { audioEngine } from './lib/audio';
import { getPrimeType, getPrimes, getUlamCoordinates } from './lib/math';

type WorkspaceView = 'visualization' | 'patterns' | 'theory';

const VIEW_OPTIONS: Array<{ id: WorkspaceView; label: string; description: string }> = [
  { id: 'visualization', label: 'Visualization', description: '3D field' },
  { id: 'patterns', label: 'Patterns', description: 'Key metrics' },
  { id: 'theory', label: 'Theory', description: 'Context notes' },
];

export default function App() {
  const [activePrime, setActivePrime] = useState<number | null>(null);
  const [limit, setLimit] = useState(500);
  const [audioStarted, setAudioStarted] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>('visualization');
  const [spectrum, setSpectrum] = useState<number[]>(Array(12).fill(0));

  const activeTypes = useMemo(() => activePrime ? getPrimeType(activePrime) : [], [activePrime]);
  const primes = useMemo(() => getPrimes(limit), [limit]);

  const activeCoords = useMemo(() => {
    if (!activePrime) return { x: 0, y: 0, z: 0 };
    const [x, y, z] = getUlamCoordinates(activePrime);
    return { x, y, z };
  }, [activePrime]);

  const stats = useMemo(() => {
    const primeCount = primes.length;
    const gaps = primes.slice(1).map((p, i) => p - primes[i]);
    const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const twinCount = primes.filter((p) => primes.includes(p + 2)).length;
    return {
      primeCount,
      avgGap,
      twinCount,
      maxPrime: primeCount ? primes[primeCount - 1] : 0,
    };
  }, [primes]);

  const horizonProgress = ((limit - 50) / 1950) * 100;
  const showIntroOverlay = !audioStarted && !introDismissed;
  const statusMessage = activePrime
    ? `Prime ${activePrime} selected. Orbit the field, inspect its tags, or ask the guide for more context.`
    : introDismissed
      ? 'Tip: click any glowing node to lock a prime and reveal its coordinates, tags, and sonic mapping.'
      : 'Preview the field, then enable sound when you want to hear the prime sonification.';

  const startAudio = useCallback(async () => {
    const started = await audioEngine.start();
    setAudioStarted(started);
    if (started) {
      setIntroDismissed(true);
    }
    return started;
  }, []);

  const handlePointClick = useCallback((n: number) => {
    setActivePrime(n);
    void (async () => {
      if (!audioEngine.isStarted()) {
        const started = await startAudio();
        if (!started) return;
      }
      audioEngine.playPrime(n);
    })();
  }, [startAudio]);

  const handleExportData = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      limit,
      activePrime,
      primes: primes.map((n) => ({
        n,
        coordinates: getUlamCoordinates(n),
        types: getPrimeType(n),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prime-harmonic-export-${limit}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activePrime, limit, primes]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSpectrum(audioEngine.getSpectrumBins(12));
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-neutral-300 font-sans px-4 py-4 sm:px-6 sm:py-6 lg:px-8 selection:bg-cyan-500 selection:text-black">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] flex-col gap-4 lg:min-h-[calc(100vh-3rem)]">
        <header className="rounded-[28px] border border-neutral-900 bg-neutral-950/80 px-4 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:px-6 lg:flex lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
              Prime Harmonic
            </div>
            <div className="space-y-2">
              <h1 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-[0.18em] text-white uppercase sm:text-xl">
                Prime_Harmonic
                <span className="text-neutral-600">/</span>
                <span className="text-sm font-normal tracking-[0.3em] text-cyan-400">v0.9.4</span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">
                Explore prime numbers on a 3D Ulam spiral, inspect pattern metrics, and optionally layer in spatial audio when you are ready.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:mt-0 lg:justify-end">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.85)]" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                {audioStarted ? 'Audio ready' : 'Visual mode ready'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/70 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-neutral-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              Export data
            </button>
          </div>
        </header>

        <main className="grid flex-1 gap-4 lg:min-h-0 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.7fr)_minmax(300px,1fr)]">
          <div className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
            <section className="rounded-[28px] border border-neutral-900 bg-neutral-900/40 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">Quick start</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">Start exploring in under a minute.</h2>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Active view</div>
                  <div className="mt-1 text-sm font-medium text-cyan-300">{VIEW_OPTIONS.find((view) => view.id === activeView)?.label}</div>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-neutral-400 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">1 / Browse</div>
                  <p className="mt-2 leading-relaxed">Drag to orbit the spiral and scroll to zoom into denser clusters.</p>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">2 / Select</div>
                  <p className="mt-2 leading-relaxed">Click a prime to reveal its tags, coordinates, and live context.</p>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">3 / Ask</div>
                  <p className="mt-2 leading-relaxed">Use the guide panel for prompts, pattern questions, and theory notes.</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-neutral-900 bg-neutral-900/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">Number horizon</p>
                  <h2 className="mt-2 text-base font-semibold text-white">{limit.toLocaleString()} numbers in view</h2>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Prime count</div>
                  <div className="mt-1 font-mono text-xl text-white">{stats.primeCount}</div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                  aria-label="Prime horizon limit"
                  className="horizon-slider w-full cursor-pointer appearance-none"
                  style={{
                    background: `linear-gradient(90deg, rgba(34,211,238,0.92) 0%, rgba(34,211,238,0.92) ${horizonProgress}%, rgba(38,38,38,0.95) ${horizonProgress}%, rgba(38,38,38,0.95) 100%)`,
                  }}
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span>50</span>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                    Active: {limit}
                  </span>
                  <span>2000</span>
                </div>
                <p className="text-sm leading-relaxed text-neutral-400">
                  Increase the horizon to reveal more primes and denser diagonal structure, or keep it low for a more legible introduction.
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-neutral-900 bg-neutral-900/40 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">Active prime</p>
                  <h2 className="mt-2 text-base font-semibold text-white">
                    {activePrime ? `Prime ${activePrime.toLocaleString()}` : 'Nothing selected yet'}
                  </h2>
                </div>
                {activePrime && (
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                    Locked selection
                  </span>
                )}
              </div>

              {activePrime ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
                    {activeTypes.length > 0 ? (
                      activeTypes.map((type) => (
                        <span key={type} className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-1 text-neutral-400">
                        No special tags
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">X</div>
                      <div className="mt-2 font-mono text-sm text-white">{activeCoords.x.toFixed(4)}</div>
                    </div>
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Y</div>
                      <div className="mt-2 font-mono text-sm text-white">{activeCoords.y.toFixed(4)}</div>
                    </div>
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Z</div>
                      <div className="mt-2 font-mono text-sm text-white">{activeCoords.z.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/60 p-4 text-sm leading-relaxed text-neutral-400">
                  Click any prime in the center field to inspect its coordinates, hear its tone, and unlock assistant prompts tailored to that selection.
                </div>
              )}
            </section>

            <section className="mt-auto rounded-[28px] border border-neutral-900 bg-neutral-900/40 p-5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyan-400">
                <Activity className="h-3.5 w-3.5" />
                Live guidance
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">{statusMessage}</p>
            </section>
          </div>

          <section className="relative flex min-h-[460px] flex-col overflow-hidden rounded-[32px] border border-neutral-900 bg-neutral-900/30 shadow-[0_24px_120px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-4 top-4 z-20 flex flex-col gap-3 rounded-[24px] border border-neutral-800/80 bg-neutral-950/75 p-4 backdrop-blur md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Workspace</p>
                <h2 className="text-base font-semibold text-white">
                  {activeView === 'visualization' && 'Prime field explorer'}
                  {activeView === 'patterns' && 'Pattern snapshot'}
                  {activeView === 'theory' && 'Theory notes'}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-neutral-400">
                  {activeView === 'visualization' && 'Drag to orbit, scroll to zoom, and click a node to inspect a prime without losing the overall context.'}
                  {activeView === 'patterns' && 'Use the current horizon to compare total primes, gap behavior, and twin-prime activity.'}
                  {activeView === 'theory' && 'Keep the core idea in view while you explore how primes cluster on the Ulam spiral.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {VIEW_OPTIONS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setActiveView(view.id)}
                    aria-pressed={activeView === view.id}
                    className={`rounded-full border px-3 py-2 text-left text-[10px] uppercase tracking-[0.22em] transition ${
                      activeView === view.id
                        ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                        : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span className="block">{view.label}</span>
                    <span className="mt-1 block text-[9px] normal-case tracking-normal opacity-80">{view.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeView === 'visualization' && (
              <div className="relative flex-1 min-h-0 pt-[140px] sm:pt-[124px]">
                <Viewport
                  limit={limit}
                  activeId={activePrime}
                  onPointClick={handlePointClick}
                />
                {!activePrime && (
                  <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-neutral-800/80 bg-neutral-950/75 px-4 py-3 text-sm text-neutral-300 backdrop-blur">
                    Click any bright node to pin a prime and reveal its context.
                  </div>
                )}
                <div className="pointer-events-none absolute bottom-4 right-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-neutral-400 font-mono">
                  <span className="rounded-full border border-neutral-800/80 bg-neutral-950/75 px-3 py-1">X {activeCoords.x.toFixed(4)}</span>
                  <span className="rounded-full border border-neutral-800/80 bg-neutral-950/75 px-3 py-1">Y {activeCoords.y.toFixed(4)}</span>
                  <span className="rounded-full border border-neutral-800/80 bg-neutral-950/75 px-3 py-1">Z {activeCoords.z.toFixed(4)}</span>
                </div>
              </div>
            )}

            {activeView === 'patterns' && (
              <div className="flex-1 min-h-0 space-y-5 overflow-y-auto p-6 pt-[140px] sm:pt-[124px] custom-scrollbar">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">Prime count</div>
                    <div className="mt-3 text-3xl font-mono text-white">{stats.primeCount}</div>
                    <p className="mt-2 text-sm text-neutral-400">Total primes currently visible inside the selected horizon.</p>
                  </div>
                  <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">Average gap</div>
                    <div className="mt-3 text-3xl font-mono text-white">{stats.avgGap.toFixed(2)}</div>
                    <p className="mt-2 text-sm text-neutral-400">Mean spacing between consecutive primes in the active range.</p>
                  </div>
                  <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">Twin pairs</div>
                    <div className="mt-3 text-3xl font-mono text-white">{stats.twinCount}</div>
                    <p className="mt-2 text-sm text-neutral-400">Pairs that sit two apart, still surfacing throughout the field.</p>
                  </div>
                  <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">Largest prime</div>
                    <div className="mt-3 text-3xl font-mono text-white">{stats.maxPrime}</div>
                    <p className="mt-2 text-sm text-neutral-400">The highest prime included at the current horizon setting.</p>
                  </div>
                </div>
                <div className="rounded-[24px] border border-neutral-800 bg-cyan-500/8 p-4 text-sm leading-relaxed text-neutral-300">
                  Increase the horizon to watch the average gap rise gradually while twin pairs continue to appear in bursts across the spiral.
                </div>
              </div>
            )}

            {activeView === 'theory' && (
              <div className="flex-1 min-h-0 space-y-5 overflow-y-auto p-6 pt-[140px] sm:pt-[124px] custom-scrollbar">
                <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-5 text-sm leading-relaxed text-neutral-300">
                  <p>
                    The Ulam spiral places consecutive integers on a square lattice. Primes seem to favor diagonal tracks, making geometric patterns visible even though the sequence itself is difficult to predict.
                  </p>
                  <p className="mt-4">
                    This workspace projects those lattice coordinates into 3D so you can switch between raw structure, quick metrics, and guided notes without leaving the same surface.
                  </p>
                  {activePrime && (
                    <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-cyan-100">
                      Prime {activePrime} is currently selected{activeTypes.length ? ` with tags: ${activeTypes.join(', ')}.` : '.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <div className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pl-1 custom-scrollbar">
            <section className="min-h-[360px] flex-1 overflow-hidden rounded-[28px] border border-neutral-900 bg-neutral-900/30">
              <Assistant currentPrime={activePrime} />
            </section>

            <section className="rounded-[28px] border border-neutral-900 bg-neutral-900/30 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">Sonic spectrum</p>
                  <h2 className="mt-2 text-base font-semibold text-white">Live activity</h2>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${audioStarted ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300' : 'border-neutral-800 bg-neutral-950/70 text-neutral-400'}`}>
                  {audioStarted ? 'Audio enabled' : 'Muted preview'}
                </div>
              </div>

              <div className="mb-4 flex h-36 items-end gap-1 rounded-[24px] border border-neutral-800 bg-neutral-950/60 px-3 py-3">
                {spectrum.map((level, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-cyan-400/25 transition-all duration-300"
                    style={{ height: `${Math.max(10, level * 100)}%`, opacity: audioStarted ? 1 : 0.25 }}
                  />
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Output</div>
                  <div className="mt-2 text-sm text-white">{audioStarted ? 'Spatial harmonic stream' : 'Ready when you enable sound'}</div>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Reverb tail</div>
                  <div className="mt-2 text-sm text-white">4.2s ambient decay</div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="rounded-[28px] border border-neutral-900 bg-neutral-950/80 px-4 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {!audioStarted ? (
                <button
                  type="button"
                  onClick={() => { void startAudio(); }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-cyan-400"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Enable sound
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  Sound active
                </div>
              )}

              <div className="grid gap-3 text-sm text-neutral-400 sm:grid-cols-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Current prime</div>
                  <div className="mt-1 font-mono text-white">{activePrime ?? 'None selected'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Visible primes</div>
                  <div className="mt-1 font-mono text-white">{stats.primeCount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">System</div>
                  <div className="mt-1 text-white">Operational</div>
                </div>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-neutral-400">
              {audioStarted
                ? 'Sound is live. Select another prime to hear its tone and watch the spectrum respond in real time.'
                : 'You can keep exploring silently, then enable sound whenever you want the sonification layer.'}
            </p>
          </div>
        </footer>
      </div>

      {showIntroOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/82 px-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl rounded-[32px] border border-neutral-800 bg-neutral-950/95 p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.6)] sm:p-10"
          >
            <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-neutral-800 bg-neutral-900/60">
              <Activity className="absolute z-10 h-8 w-8 text-cyan-400" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_68%)]" />
            </div>

            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.34em] text-cyan-300">Welcome</p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Start with visuals, then unlock spatial audio.</h2>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
                Prime Harmonic works immediately as a visual explorer. If you want to hear each selected prime, browsers require a single tap to enable audio first.
              </p>
            </div>

            <div className="mt-8 grid gap-3 text-left text-sm text-neutral-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/55 p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">Explore</div>
                <p className="mt-2 leading-relaxed">Orbit the field and zoom into diagonal clusters.</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/55 p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">Select</div>
                <p className="mt-2 leading-relaxed">Click a prime to inspect its tags and coordinates.</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/55 p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">Listen</div>
                <p className="mt-2 leading-relaxed">Enable sound only when you want the sonic layer.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => { void startAudio(); }}
                className="rounded-full bg-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-cyan-400"
              >
                Enable audio
              </button>
              <button
                type="button"
                onClick={() => setIntroDismissed(true)}
                className="rounded-full border border-neutral-700 bg-neutral-900/70 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-200 transition hover:border-neutral-500 hover:text-white"
              >
                Continue muted
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
