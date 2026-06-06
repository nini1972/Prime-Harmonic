import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.PolySynth;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private analyser: Tone.Analyser;
  
  constructor() {
    this.analyser = new Tone.Analyser("fft", 16);
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.reverb = new Tone.Reverb(4.2).toDestination();
    this.delay = new Tone.FeedbackDelay("8n", 0.3).toDestination();
    
    this.synth.connect(this.reverb);
    this.synth.connect(this.delay);
    
    // Connect all audio outputs to analyzer
    this.synth.connect(this.analyser);
    this.reverb.connect(this.analyser);
    this.delay.connect(this.analyser);
    
    this.synth.set({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.8,
        release: 1.5
      }
    });
  }

  async start() {
    await Tone.start();
  }

  playPrime(n: number) {
    // Map prime to frequency
    // Using a logarithmic scale for frequencies
    const baseFreq = 110; // A2
    const freq = baseFreq * Math.pow(Math.pow(2, 1/12), (n % 48));
    
    // Duration based on prime "modality"
    const duration = (n % 4) === 1 ? "4n" : "8n";
    
    this.synth.triggerAttackRelease(freq, duration);
  }

  getSpectrum(): number[] {
    try {
      const values = this.analyser.getValue() as Float32Array;
      if (!values) return Array(16).fill(0);
      
      const result: number[] = [];
      const len = values.length;
      for (let i = 0; i < len; i++) {
        const db = values[i];
        // Convert dB representation (typically -100 to 0) to a clear normalized range (0 to 100)
        // Adjust lower bounds so visual settles smoothly to near-zero when silent
        const normalized = Math.max(0, Math.min(100, (db + 100) * (100 / 70)));
        result.push(normalized);
      }
      return result;
    } catch {
      return Array(16).fill(0);
    }
  }
}

export const audioEngine = new AudioEngine();
