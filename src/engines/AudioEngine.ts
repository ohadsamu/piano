import type { AccompanimentEvent } from '../types';
import { midiToFrequency } from '../utils/midiUtils';

export interface ActiveVoice {
  midi: number;
  startedAt: number;
  release: (immediate?: boolean) => void;
  sustained: boolean;
  autoReleaseTimer?: number;
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.AudioContext === 'function') {
    return window.AudioContext;
  }
  if ('webkitAudioContext' in window && typeof window.webkitAudioContext === 'function') {
    return window.webkitAudioContext as typeof AudioContext;
  }
  return null;
}

const INHARMONICITY_B = 0.00015;
const PARTIAL_GAINS = [0.65, 0.28, 0.11, 0.05] as const;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private hammerNoiseBuffer: AudioBuffer | null = null;
  private activeVoices: Map<number, ActiveVoice> = new Map();
  private sustainPedalDown = false;
  private masterVolume = 0.85;
  private muted = false;

  /**
   * Initializes the Web Audio API context and shared synthesis graph (reverb, compressor, hammer noise buffer).
   */
  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx = getAudioContextConstructor();
      if (!AudioCtx) return;

      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
      this.setupMasterGraph(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // User gesture may still be required
      }
    }
  }

  /**
   * Ensures the AudioContext is created and resumed on user interaction.
   */
  public async resume(): Promise<void> {
    await this.init();
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : performance.now() / 1000;
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = getAudioContextConstructor();
      if (AudioCtx) {
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });
        this.setupMasterGraph(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupMasterGraph(ctx: AudioContext): void {
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 3.5;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.18;

    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.78;

    this.wetGain = ctx.createGain();
    this.wetGain.gain.value = 0.22;

    this.reverbConvolver = ctx.createConvolver();
    this.reverbConvolver.buffer = this.buildConcertRoomImpulse(ctx, 1.6);

    this.hammerNoiseBuffer = this.buildHammerNoiseBuffer(ctx, 0.04);

    this.dryGain.connect(this.compressor);
    this.reverbConvolver.connect(this.wetGain);
    this.wetGain.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
  }

  /**
   * Generates a 1.6s stereo concert-room impulse response with exponential decay and high-frequency damping.
   */
  private buildConcertRoomImpulse(ctx: AudioContext, durationSec: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * durationSec));
    const impulse = ctx.createBuffer(2, length, sampleRate);

    // One-pole lowpass coefficient around 4kHz for natural warm concert-hall absorption
    const rc = 1 / (2 * Math.PI * 4000);
    const dt = 1 / sampleRate;
    const alpha = dt / (rc + dt);

    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      let prevSample = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Fast early reflections + warm exponential tail
        const env = Math.exp(-3.8 * t) * (1 + 0.25 * Math.sin(2 * Math.PI * 17 * t));
        // Box-Muller / uniform approximation for decorrelated noise
        const white = (Math.random() * 2 - 1 + (Math.random() * 2 - 1)) * 0.5;
        prevSample = prevSample + alpha * (white - prevSample);
        channelData[i] = prevSample * env * 0.45;
      }
    }

    return impulse;
  }

  /**
   * Pre-allocates a 40ms white-noise buffer for mechanical piano hammer felt transients.
   */
  private buildHammerNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const window = Math.exp(-6 * t);
      data[i] = (Math.random() * 2 - 1) * window;
    }
    return buffer;
  }

  /**
   * Triggers a polyphonic acoustic grand piano voice for the given MIDI note.
   */
  public noteOn(midi: number, velocity = 0.78, maxDurationSec = 4.5): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.dryGain || !this.reverbConvolver) return;

    // Release any currently sounding voice on the same MIDI key
    const existing = this.activeVoices.get(midi);
    if (existing) {
      existing.release(true);
      this.activeVoices.delete(midi);
    }

    const v = Math.max(0.05, Math.min(1.0, velocity));
    const now = ctx.currentTime;
    const f0 = midiToFrequency(midi);

    // Key- & velocity-scaled lowpass BiquadFilterNode
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const initialCutoff = Math.min(16000, f0 * (2.2 + 7.5 * Math.pow(v, 1.3)));
    const targetCutoff = Math.max(120, Math.min(14000, 1.8 * f0));
    filter.frequency.setValueAtTime(initialCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(targetCutoff, now + 1.4);
    filter.Q.value = 0.85;

    // Dual-stage piano amplitude envelope
    const voiceGain = ctx.createGain();
    const attackSec = Math.max(0.003, 0.012 - 0.008 * v);
    const peakGain = 0.35 * Math.pow(v, 1.1);
    const soundboardSustainGain = Math.max(0.001, 0.45 * peakGain);
    const sustainTau = Math.max(0.9, 4.2 - 0.038 * (midi - 48));

    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(peakGain, now + attackSec);
    voiceGain.gain.exponentialRampToValueAtTime(soundboardSustainGain, now + attackSec + 0.28);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + attackSec + 0.28 + sustainTau);

    filter.connect(voiceGain);
    voiceGain.connect(this.dryGain);
    voiceGain.connect(this.reverbConvolver);

    // 4-oscillator inharmonic partials with stretched tuning
    const oscillators: OscillatorNode[] = [];
    for (let k = 1; k <= 4; k++) {
      const fk = k * f0 * Math.sqrt(1 + INHARMONICITY_B * k * k);
      if (fk >= ctx.sampleRate * 0.46) continue;

      const osc = ctx.createOscillator();
      osc.type = k === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(fk, now);

      const partialGain = ctx.createGain();
      // Higher partials scale slightly more with velocity
      const velScale = k === 1 ? 1 : Math.pow(v, 0.35 * (k - 1));
      partialGain.gain.value = PARTIAL_GAINS[k - 1] * velScale;

      osc.connect(partialGain);
      partialGain.connect(filter);
      osc.start(now);
      oscillators.push(osc);
    }

    // Hammer felt transient bandpass noise burst (2800 Hz, Q = 1.8, 12ms decay)
    let hammerSource: AudioBufferSourceNode | null = null;
    if (this.hammerNoiseBuffer) {
      hammerSource = ctx.createBufferSource();
      hammerSource.buffer = this.hammerNoiseBuffer;

      const hammerBandpass = ctx.createBiquadFilter();
      hammerBandpass.type = 'bandpass';
      hammerBandpass.frequency.setValueAtTime(2800, now);
      hammerBandpass.Q.setValueAtTime(1.8, now);

      const hammerGain = ctx.createGain();
      const hammerPeak = 0.09 * Math.pow(v, 1.2);
      hammerGain.gain.setValueAtTime(Math.max(0.0001, hammerPeak), now);
      hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      hammerSource.connect(hammerBandpass);
      hammerBandpass.connect(hammerGain);
      hammerGain.connect(voiceGain);
      hammerSource.start(now);
      hammerSource.stop(now + 0.035);
    }

    let released = false;
    const release = (immediate = false) => {
      if (released) return;
      released = true;

      clearTimeout(voiceRecord.autoReleaseTimer);

      const releaseNow = ctx.currentTime;
      const damperTime = immediate ? 0.03 : 0.14;
      try {
        voiceGain.gain.cancelScheduledValues(releaseNow);
        const currentGain = Math.max(0.0001, voiceGain.gain.value);
        voiceGain.gain.setValueAtTime(currentGain, releaseNow);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, releaseNow + damperTime);
      } catch {
        // Ignore automation errors if context is closing
      }

      const stopTime = releaseNow + damperTime + 0.02;
      for (const osc of oscillators) {
        try {
          osc.stop(stopTime);
        } catch {
          // Ignore already stopped
        }
      }

      setTimeout(() => {
        try {
          voiceGain.disconnect();
          filter.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      }, (damperTime + 0.05) * 1000);
    };

    const voiceRecord: ActiveVoice = {
      midi,
      startedAt: now,
      release,
      sustained: false,
    };

    if (maxDurationSec > 0) {
      voiceRecord.autoReleaseTimer = window.setTimeout(() => {
        if (this.activeVoices.get(midi) === voiceRecord) {
          this.activeVoices.delete(midi);
        }
        release(false);
      }, maxDurationSec * 1000);
    }

    this.activeVoices.set(midi, voiceRecord);
  }

  /**
   * Releases an active piano voice (or marks it sustained if the sustain pedal is down).
   */
  public noteOff(midi: number): void {
    const voice = this.activeVoices.get(midi);
    if (!voice) return;

    if (this.sustainPedalDown) {
      voice.sustained = true;
      return;
    }

    this.activeVoices.delete(midi);
    voice.release(false);
  }

  /**
   * Plays a single piano note with a scheduled duration.
   */
  public playNote(midi: number, velocity = 0.78, durationSec = 0.55): void {
    this.noteOn(midi, velocity, durationSec + 1.5);
    const startedVoice = this.activeVoices.get(midi);
    const holdMs = Math.max(60, durationSec * 1000);
    setTimeout(() => {
      if (this.activeVoices.get(midi) === startedVoice) {
        this.noteOff(midi);
      }
    }, holdMs);
  }

  /**
   * Plays a polyphonic piano chord simultaneously.
   */
  public playChord(midis: number[], velocity = 0.72, durationSec = 0.8): void {
    if (midis.length === 0) return;
    // Scale per-voice velocity gently to prevent summing distortion on thick chords
    const scaledVelocity = Math.min(0.95, velocity / Math.pow(midis.length, 0.22));
    for (const midi of midis) {
      this.playNote(midi, scaledVelocity, durationSec);
    }
  }

  /**
   * Synthesizes a crisp conservatory woodblock metronome click.
   */
  public playMetronomeClick(isAccent = false, scheduledTime?: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.dryGain) return;

    const startTime = scheduledTime !== undefined ? Math.max(ctx.currentTime, scheduledTime) : ctx.currentTime;
    const freq = isAccent ? 1180 : 840;
    const peak = isAccent ? 0.24 : 0.14;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.62, startTime + 0.032);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, startTime);
    clickGain.gain.linearRampToValueAtTime(peak, startTime + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.038);

    osc.connect(clickGain);
    clickGain.connect(this.dryGain);

    osc.onended = () => {
      try {
        clickGain.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    };
    osc.start(startTime);
    osc.stop(startTime + 0.045);
  }

  /**
   * Plays a backing accompaniment event (warm pad, bass pulse, arpeggio, or percussion accent).
   */
  public playAccompaniment(event: AccompanimentEvent, bpm: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.dryGain || !this.reverbConvolver) return;

    const safeBpm = Math.max(25, bpm);
    const beatSec = 60 / safeBpm;
    const durationSec = Math.max(0.18, event.durationBeats * beatSec);
    const normalizedVel = event.velocity > 1 ? event.velocity / 127 : event.velocity;
    const vel = Math.max(0.05, Math.min(0.85, normalizedVel));
    if (event.style === 'arpeggio') {
      const stepSec = Math.min(0.14, durationSec / Math.max(1, event.midiNotes.length));
      event.midiNotes.forEach((midi, idx) => {
        setTimeout(() => {
          this.playNote(midi, vel * 0.65, Math.max(0.25, durationSec - idx * stepSec));
        }, idx * stepSec * 1000);
      });
      return;
    }

    if (event.style === 'percussion_accent') {
      this.playMetronomeClick(true);
      if (event.midiNotes.length > 0) {
        this.playChord(event.midiNotes, vel * 0.55, durationSec * 0.6);
      }
      return;
    }

    if (event.style === 'bass_pulse') {
      this.playChord(event.midiNotes, vel * 0.68, durationSec * 0.85);
      return;
    }

    // Default: 'warm_pad' — warm low-passed strings/synth pad underneath piano
    const now = ctx.currentTime;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(1100, now);

    const padGain = ctx.createGain();
    const peak = (0.11 * vel) / Math.max(1, Math.sqrt(event.midiNotes.length));
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.linearRampToValueAtTime(peak, now + 0.06);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec + 0.15);

    padFilter.connect(padGain);
    padGain.connect(this.dryGain);
    padGain.connect(this.reverbConvolver);

    for (const midi of event.midiNotes) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(midiToFrequency(midi), now);
      osc.connect(padFilter);
      osc.start(now);
      osc.stop(now + durationSec + 0.18);
    }
    setTimeout(() => {
      try {
        padGain.disconnect();
        padFilter.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }, (durationSec + 0.25) * 1000);
  }

  /**
   * Alias for playAccompaniment matching architectural spec naming.
   */
  public playAccompanimentEvent(event: AccompanimentEvent, tempoBpm: number): void {
    this.playAccompaniment(event, tempoBpm);
  }

  /**
   * Plays a celebratory ascending conservatory arpeggio chime (C5 -> E5 -> G5 -> C6).
   */
  public playSuccessChime(): void {
    const chimeNotes = [72, 76, 79, 84];
    chimeNotes.forEach((midi, idx) => {
      setTimeout(() => {
        this.playNote(midi, 0.58 + idx * 0.06, 0.45);
      }, idx * 75);
    });
  }

  /**
   * Plays an auditory coaching cue ('step_complete' | 'hint_target' | 'star_earned').
   */
  public playCoachCue(
    type: 'step_complete' | 'hint_target' | 'star_earned',
    targetMidi?: number
  ): void {
    if (type === 'hint_target' && targetMidi !== undefined) {
      this.playNote(targetMidi, 0.52, 0.45);
      return;
    }
    if (type === 'star_earned') {
      this.playSuccessChime();
      return;
    }
    // step_complete
    const stepNotes = [67, 72, 76];
    stepNotes.forEach((midi, idx) => {
      setTimeout(() => {
        this.playNote(midi, 0.55, 0.38);
      }, idx * 70);
    });
  }

  /**
   * Toggles the piano damper sustain pedal.
   */
  public setSustainPedal(active: boolean): void {
    const wasDown = this.sustainPedalDown;
    this.sustainPedalDown = active;

    if (wasDown && !active) {
      for (const [midi, voice] of this.activeVoices.entries()) {
        if (voice.sustained) {
          this.activeVoices.delete(midi);
          voice.release(false);
        }
      }
    }
  }

  public isSustainPedalActive(): boolean {
    return this.sustainPedalDown;
  }

  /**
   * Sets master output volume [0.0 - 1.0].
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      const target = this.muted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.015);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      const target = this.muted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.015);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Immediately releases all active piano voices.
   */
  public stopAll(): void {
    for (const voice of this.activeVoices.values()) {
      voice.release(true);
    }
    this.activeVoices.clear();
  }

  /**
   * Alias for stopAll matching architectural spec naming.
   */
  public stopAllVoices(): void {
    this.stopAll();
  }
}

export const sharedAudioEngine = new AudioEngine();
