import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.PolySynth;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  
  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.reverb = new Tone.Reverb(2).toDestination();
    this.delay = new Tone.FeedbackDelay("8n", 0.3).toDestination();
    
    this.synth.connect(this.reverb);
    this.synth.connect(this.delay);
    
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
}

export const audioEngine = new AudioEngine();
