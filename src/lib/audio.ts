import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.PolySynth;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private analyser: Tone.Analyser;
  private started = false;
  
  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.reverb = new Tone.Reverb(2).toDestination();
    this.delay = new Tone.FeedbackDelay("8n", 0.3).toDestination();
    this.analyser = new Tone.Analyser("fft", 256);
    
    this.synth.connect(this.reverb);
    this.synth.connect(this.delay);
    this.synth.connect(this.analyser);
    
    this.synth.set({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8
      }
    });
  }

  async start() {
    try {
      await Tone.start();
      const context = Tone.getContext().rawContext;
      if (context.state !== "running") {
        await context.resume();
      }
      this.started = context.state === "running";
      return this.started;
    } catch {
      this.started = false;
      return false;
    }
  }

  playPrime(n: number) {
    if (!this.started) return;

    // Map prime to frequency
    // Using a logarithmic scale for frequencies
    const baseFreq = 110; // A2
    const freq = baseFreq * Math.pow(Math.pow(2, 1/12), (n % 48));
    
    // Duration based on prime "modality"
    const duration = (n % 4) === 1 ? "4n" : "8n";
    
    this.synth.triggerAttackRelease(freq, duration);
  }

  isStarted() {
    return this.started;
  }

  getSpectrumBins(binCount = 12): number[] {
    if (!this.started) return new Array(binCount).fill(0);

    const raw = this.analyser.getValue();
    if (!raw || typeof raw === "number" || raw.length === 0) {
      return new Array(binCount).fill(0);
    }

    const bins = Array.from(raw);
    const chunkSize = Math.max(1, Math.floor(bins.length / binCount));

    return Array.from({ length: binCount }, (_, i) => {
      const start = i * chunkSize;
      const end = i === binCount - 1 ? bins.length : Math.min(bins.length, start + chunkSize);
      const slice = bins.slice(start, end);
      const avg = slice.reduce((sum, v) => sum + v, 0) / Math.max(1, slice.length);
      const normalized = (avg + 140) / 140;
      return Math.max(0.05, Math.min(1, normalized));
    });
  }
}

export const audioEngine = new AudioEngine();
