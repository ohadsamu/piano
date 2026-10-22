import type { LiveMicTelemetry, MicCalibrationConfig, NoteInputEvent } from '../types';
import { frequencyToMidiAndCents, midiToFrequency, midiToNoteName } from '../utils/midiUtils';

export interface YinPitchEstimate {
  frequencyHz: number;
  midi: number;
  centsOff: number;
  confidence: number;
  rms: number;
}

export type NoteEventListener = (event: NoteInputEvent) => void;
export type MicTelemetryListener = (telemetry: LiveMicTelemetry) => void;

const DEFAULT_CALIBRATION: MicCalibrationConfig = {
  rmsThreshold: 0.012,
  yinThreshold: 0.16,
  stabilityFrames: 2,
};

/**
 * Pure 4-stage YIN / CMNDF Fundamental Frequency & MIDI Pitch Estimator.
 * Tuned for acoustic piano range C2 (65.4 Hz) through C6 (1046.5 Hz).
 */
export function estimatePitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  rmsThreshold = DEFAULT_CALIBRATION.rmsThreshold,
  yinThreshold = DEFAULT_CALIBRATION.yinThreshold
): YinPitchEstimate | null {
  const n = buffer.length;
  if (n < 64 || sampleRate <= 0) return null;

  // Stage 1: RMS Noise Gate
  let sumSquares = 0;
  for (let i = 0; i < n; i++) {
    const sample = buffer[i];
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / n);
  if (rms < rmsThreshold) {
    return null;
  }

  // Stage 2: Difference function d(tau) and CMNDF d'(tau)
  const halfWindow = Math.floor(n / 2);
  // Piano fundamental search bounds: ~60 Hz (below C2) to ~1100 Hz (above C6)
  const tauMin = Math.max(2, Math.floor(sampleRate / 1100));
  const tauMax = Math.min(halfWindow - 1, Math.ceil(sampleRate / 60));
  if (tauMax <= tauMin + 2) {
    return null;
  }

  const yinBuffer = new Float32Array(tauMax + 1);
  yinBuffer[0] = 1;

  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let diffSum = 0;
    for (let j = 0; j < halfWindow; j++) {
      const delta = buffer[j] - buffer[j + tau];
      diffSum += delta * delta;
    }
    runningSum += diffSum;
    yinBuffer[tau] = runningSum > 0 ? (diffSum * tau) / runningSum : 1;
  }

  // Stage 3: Absolute Threshold Selection (first deep dip below yinThreshold)
  let tauEstimate = -1;
  for (let tau = tauMin; tau < tauMax; tau++) {
    if (yinBuffer[tau] < yinThreshold) {
      while (tau + 1 < tauMax && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  // Fallback to global minimum if reasonably periodic (< 0.28)
  if (tauEstimate === -1) {
    let minVal = Infinity;
    let minTau = -1;
    for (let tau = tauMin; tau < tauMax; tau++) {
      if (yinBuffer[tau] < minVal) {
        minVal = yinBuffer[tau];
        minTau = tau;
      }
    }
    if (minTau !== -1 && minVal < 0.28) {
      tauEstimate = minTau;
    } else {
      return null;
    }
  }

  // Stage 4: Parabolic Interpolation around tauEstimate
  let refinedTau = tauEstimate;
  if (tauEstimate > 1 && tauEstimate < tauMax) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];
    const denom = 2 * (s0 - 2 * s1 + s2);
    if (Math.abs(denom) > 1e-9) {
      const adjustment = (s0 - s2) / denom;
      if (Math.abs(adjustment) < 1) {
        refinedTau = tauEstimate + adjustment;
      }
    }
  }

  const frequencyHz = sampleRate / refinedTau;
  const confidence = Math.max(0, Math.min(1, 1 - yinBuffer[tauEstimate]));

  if (confidence < 0.65) {
    return null;
  }

  const { midi, centsOff } = frequencyToMidiAndCents(frequencyHz);
  if (midi < 36 || midi > 96) {
    return null;
  }

  return {
    frequencyHz,
    midi,
    centsOff,
    confidence,
    rms,
  };
}

/**
 * Computes normalized Hann-windowed Goertzel spectral magnitude at an exact frequency `targetHz`.
 */
function computeGoertzelMagnitude(
  windowedBuffer: Float32Array,
  sampleRate: number,
  targetHz: number
): number {
  const n = windowedBuffer.length;
  if (targetHz <= 20 || targetHz >= sampleRate * 0.45) return 0;
  const omega = (2 * Math.PI * targetHz) / sampleRate;
  const coeff = 2 * Math.cos(omega);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = windowedBuffer[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return (2 * Math.sqrt(Math.max(0, power))) / n;
}

/**
 * Polyphonic Chord & Two-Hand Spectral Detector for Acoustic / Electric Piano over Microphone.
 * Evaluates exact semitone fundamentals across C3 (48) – B5 (83) with local semitone peak
 * isolation and overtone subtraction (canceling 2nd/3rd/4th harmonics of lower detected notes).
 */
export function estimatePolyphonicChords(
  buffer: Float32Array,
  sampleRate: number,
  expectedMidis: number[] = [],
  rmsThreshold = DEFAULT_CALIBRATION.rmsThreshold
): YinPitchEstimate[] {
  const n = buffer.length;
  if (n < 512 || sampleRate <= 0) return [];

  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    sumSq += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSq / n);
  if (rms < rmsThreshold) return [];

  // Apply Hann window to suppress spectral leakage between adjacent semitones
  const windowed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    windowed[i] = buffer[i] * w;
  }

  const minMidi = 48; // C3
  const maxMidi = 83; // B5
  const rawFundamental = new Float32Array(maxMidi + 2);
  const secondHarmonic = new Float32Array(maxMidi + 2);

  for (let m = minMidi - 1; m <= maxMidi + 1; m++) {
    const f0 = midiToFrequency(m);
    rawFundamental[m] = computeGoertzelMagnitude(windowed, sampleRate, f0);
    if (m >= minMidi && m <= maxMidi) {
      secondHarmonic[m] = computeGoertzelMagnitude(windowed, sampleRate, f0 * 2);
    }
  }

  // Step 1: Identify local semitone peaks (strictly sharper than m-1 and m+1)
  let maxMag = 0;
  for (let m = minMidi; m <= maxMidi; m++) {
    if (rawFundamental[m] > maxMag) {
      maxMag = rawFundamental[m];
    }
  }
  if (maxMag < 1e-4) return [];

  const effectiveFundamental = new Float32Array(rawFundamental);
  const expectedSet = new Set(expectedMidis);
  const detected: YinPitchEstimate[] = [];

  for (let m = minMidi; m <= maxMidi; m++) {
    const mag = effectiveFundamental[m];
    const leftMag = rawFundamental[m - 1];
    const rightMag = rawFundamental[m + 1];

    // Must be a local peak across adjacent semitones
    const isLocalPeak = mag > leftMag * 1.15 && mag > rightMag * 1.15;
    if (!isLocalPeak) continue;

    const isExpected = expectedSet.has(m);
    const relThreshold = isExpected ? 0.16 : 0.24;
    if (mag < maxMag * relThreshold) continue;

    // Verify harmonic support or strong fundamental energy
    const harmonicScore = mag + 0.35 * secondHarmonic[m];
    const confidence = Math.min(0.99, Math.max(0.72, harmonicScore / (maxMag * 1.1)));

    detected.push({
      frequencyHz: midiToFrequency(m),
      midi: m,
      centsOff: 0,
      confidence,
      rms,
    });

    // Subtract expected 2nd, 3rd, and 4th harmonic overtones from higher MIDI candidates
    // +12 semitones = 2f0, +19 semitones ≈ 3f0, +24 semitones = 4f0
    if (m + 12 <= maxMidi) {
      effectiveFundamental[m + 12] = Math.max(
        0,
        effectiveFundamental[m + 12] - rawFundamental[m] * 0.55
      );
    }
    if (m + 19 <= maxMidi) {
      effectiveFundamental[m + 19] = Math.max(
        0,
        effectiveFundamental[m + 19] - rawFundamental[m] * 0.28
      );
    }
    if (m + 24 <= maxMidi) {
      effectiveFundamental[m + 24] = Math.max(
        0,
        effectiveFundamental[m + 24] - rawFundamental[m] * 0.16
      );
    }
  }

  return detected.slice(0, 5);
}

/**
 * Real-time Web Audio microphone pitch detector with multi-frame debounce and re-attack detection.
 */
export class MicPitchDetector {
  private config: MicCalibrationConfig = { ...DEFAULT_CALIBRATION };
  private audioCtx: AudioContext | null = null;
  private ownsAudioCtx = false;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timeDomainBuffer: Float32Array | null = null;
  private rafId: number | null = null;
  private active = false;

  // Stability debounce & re-attack state
  private candidateMidi: number | null = null;
  private candidateCount = 0;
  private activeNoteMidi: number | null = null;
  private activePolyMidis: Set<number> = new Set();
  private expectedTargetMidis: number[] = [];
  private prevRms = 0;
  private minRmsSinceNoteOn = 0;
  private silentFramesCount = 0;
  private noteListeners: Set<NoteEventListener> = new Set();
  private telemetryListeners: Set<MicTelemetryListener> = new Set();

  private latestTelemetry: LiveMicTelemetry = {
    active: false,
    rmsLevel: 0,
    dbLevel: -100,
    detectedMidi: null,
    detectedNoteName: null,
    frequencyHz: null,
    centsOff: 0,
    confidence: 0,
  };

  constructor(
    initialConfig?: Partial<MicCalibrationConfig>,
    onNoteEvent?: NoteEventListener,
    onTelemetry?: MicTelemetryListener
  ) {
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig };
    }
    if (onNoteEvent) {
      this.noteListeners.add(onNoteEvent);
    }
    if (onTelemetry) {
      this.telemetryListeners.add(onTelemetry);
    }
  }

  public onNoteEvent(listener: NoteEventListener): () => void {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  }

  public onTelemetry(listener: MicTelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  public updateConfig(cfg: Partial<MicCalibrationConfig>): void {
    this.config = {
      ...this.config,
      ...cfg,
    };
  }

  public getConfig(): MicCalibrationConfig {
    return { ...this.config };
  }

  public setExpectedTargetMidis(midis: number[]): void {
    this.expectedTargetMidis = [...midis];
  }

  public getTelemetry(): LiveMicTelemetry {
    return { ...this.latestTelemetry };
  }

  public isActive(): boolean {
    return this.active;
  }
  /**
   * Requests microphone access and begins 60fps YIN pitch polling.
   */
  public async start(externalAudioCtx?: AudioContext): Promise<boolean> {
    if (this.active) return true;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      if (externalAudioCtx) {
        this.audioCtx = externalAudioCtx;
        this.ownsAudioCtx = false;
      } else {
        this.audioCtx = new AudioContext({ latencyHint: 'interactive' });
        this.ownsAudioCtx = true;
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0;

      this.sourceNode.connect(this.analyser);
      this.timeDomainBuffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));

      this.active = true;
      this.candidateMidi = null;
      this.candidateCount = 0;
      this.activeNoteMidi = null;
      this.prevRms = 0;
      this.minRmsSinceNoteOn = 0;
      this.silentFramesCount = 0;

      this.scheduleNextFrame();
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  /**
   * Stops microphone capture and emits a final note_off if a note was active.
   */
  public stop(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.activeNoteMidi !== null) {
      this.emitNoteOff(this.activeNoteMidi);
      this.activeNoteMidi = null;
    }
    for (const m of this.activePolyMidis) {
      this.emitNoteOff(m);
    }
    this.activePolyMidis.clear();
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // Ignore disconnect error
      }
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }

    if (this.ownsAudioCtx && this.audioCtx) {
      void this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.ownsAudioCtx = false;
    }

    this.analyser = null;
    this.timeDomainBuffer = null;
    this.active = false;

    this.latestTelemetry = {
      active: false,
      rmsLevel: 0,
      dbLevel: -100,
      detectedMidi: null,
      detectedNoteName: null,
      frequencyHz: null,
      centsOff: 0,
      confidence: 0,
    };
    this.emitTelemetry(this.latestTelemetry);
  }

  /**
   * Samples ambient room noise for `durationMs` and sets `rmsThreshold` to 2.2x ambient RMS.
   */
  public async calibrateNoiseFloor(durationMs = 900): Promise<number> {
    if (!this.active || !this.analyser || !this.timeDomainBuffer) {
      return this.config.rmsThreshold;
    }

    const samples: number[] = [];
    const startMs = performance.now();

    while (performance.now() - startMs < durationMs) {
      if (!this.analyser || !this.timeDomainBuffer) break;
      this.analyser.getFloatTimeDomainData(this.timeDomainBuffer);
      let sumSq = 0;
      for (let i = 0; i < this.timeDomainBuffer.length; i++) {
        const v = this.timeDomainBuffer[i];
        sumSq += v * v;
      }
      samples.push(Math.sqrt(sumSq / this.timeDomainBuffer.length));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    if (samples.length === 0) {
      return this.config.rmsThreshold;
    }

    const avgAmbientRms = samples.reduce((acc, v) => acc + v, 0) / samples.length;
    const calibratedThreshold = Math.max(0.006, Math.min(0.08, avgAmbientRms * 2.2));
    this.config.rmsThreshold = Number(calibratedThreshold.toFixed(4));
    return this.config.rmsThreshold;
  }

  private scheduleNextFrame(): void {
    if (!this.active) return;
    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame(() => this.processAudioFrame());
    }
  }

  private processAudioFrame(): void {
    if (!this.active || !this.analyser || !this.timeDomainBuffer || !this.audioCtx) {
      return;
    }

    this.analyser.getFloatTimeDomainData(this.timeDomainBuffer);

    // Compute frame RMS for telemetry even if below pitch gate
    let sumSquares = 0;
    const buf = this.timeDomainBuffer;
    for (let i = 0; i < buf.length; i++) {
      sumSquares += buf[i] * buf[i];
    }
    const rms = Math.sqrt(sumSquares / buf.length);
    const dbLevel = rms > 1e-6 ? Math.max(-100, 20 * Math.log10(rms)) : -100;

    // When 2+ simultaneous notes are expected (chords or two-hand play), run polyphonic spectral detection
    if (this.expectedTargetMidis.length >= 2 && rms >= this.config.rmsThreshold) {
      const polyEstimates = estimatePolyphonicChords(
        buf,
        this.audioCtx.sampleRate,
        this.expectedTargetMidis,
        this.config.rmsThreshold
      );
      if (polyEstimates.length >= 2) {
        this.silentFramesCount = 0;
        const currentMidis = new Set(polyEstimates.map((e) => e.midi));
        for (const est of polyEstimates) {
          if (!this.activePolyMidis.has(est.midi)) {
            this.activePolyMidis.add(est.midi);
            this.emitNoteOn(est);
          }
        }
        for (const prevMidi of Array.from(this.activePolyMidis)) {
          if (!currentMidis.has(prevMidi)) {
            this.activePolyMidis.delete(prevMidi);
            this.emitNoteOff(prevMidi);
          }
        }
        const primary = polyEstimates[0];
        this.latestTelemetry = {
          active: true,
          rmsLevel: Math.min(1, rms * 8),
          dbLevel: Math.round(dbLevel),
          detectedMidi: primary.midi,
          detectedNoteName: polyEstimates.map((p) => midiToNoteName(p.midi)).join('+'),
          frequencyHz: Number(primary.frequencyHz.toFixed(1)),
          centsOff: 0,
          confidence: Number(primary.confidence.toFixed(2)),
        };
        this.prevRms = rms;
        this.emitTelemetry(this.latestTelemetry);
        this.scheduleNextFrame();
        return;
      }
    }

    const estimate = estimatePitchYIN(
      buf,
      this.audioCtx.sampleRate,
      this.config.rmsThreshold,
      this.config.yinThreshold
    );

    if (
      estimate &&
      Math.abs(estimate.centsOff) <= 40 &&
      estimate.confidence >= 0.72
    ) {
      this.silentFramesCount = 0;
      const isSameNoteAsActive = this.activeNoteMidi === estimate.midi;
      const isFreshAttackSpike =
        isSameNoteAsActive &&
        estimate.rms > this.prevRms * 1.45 &&
        this.minRmsSinceNoteOn < estimate.rms * 0.68;

      if (isFreshAttackSpike && this.activeNoteMidi !== null) {
        this.emitNoteOff(this.activeNoteMidi);
        this.activeNoteMidi = estimate.midi;
        this.candidateMidi = estimate.midi;
        this.candidateCount = this.config.stabilityFrames;
        this.minRmsSinceNoteOn = estimate.rms;
        this.emitNoteOn(estimate);
      } else if (estimate.midi === this.candidateMidi) {
        this.candidateCount++;
      } else {
        this.candidateMidi = estimate.midi;
        this.candidateCount = 1;
      }

      if (
        this.candidateCount >= this.config.stabilityFrames &&
        this.activeNoteMidi !== this.candidateMidi &&
        this.candidateMidi !== null
      ) {
        if (this.activeNoteMidi !== null) {
          this.emitNoteOff(this.activeNoteMidi);
        }
        this.activeNoteMidi = estimate.midi;
        this.minRmsSinceNoteOn = estimate.rms;
        this.emitNoteOn(estimate);
      }

      if (this.activeNoteMidi !== null) {
        this.minRmsSinceNoteOn = Math.min(this.minRmsSinceNoteOn, estimate.rms);
      }

      this.latestTelemetry = {
        active: true,
        rmsLevel: Math.min(1, rms * 8),
        dbLevel: Math.round(dbLevel),
        detectedMidi: estimate.midi,
        detectedNoteName: midiToNoteName(estimate.midi),
        frequencyHz: Number(estimate.frequencyHz.toFixed(1)),
        centsOff: estimate.centsOff,
        confidence: Number(estimate.confidence.toFixed(2)),
      };
    } else {
      this.candidateMidi = null;
      this.candidateCount = 0;
      this.silentFramesCount++;

      // Release active note after 3 consecutive unpitched/silent frames
      if (this.activeNoteMidi !== null && this.silentFramesCount >= 3) {
        this.emitNoteOff(this.activeNoteMidi);
        this.activeNoteMidi = null;
      }
      if (this.activePolyMidis.size > 0 && this.silentFramesCount >= 3) {
        for (const m of this.activePolyMidis) {
          this.emitNoteOff(m);
        }
        this.activePolyMidis.clear();
      }
      this.latestTelemetry = {
        active: true,
        rmsLevel: Math.min(1, rms * 8),
        dbLevel: Math.round(dbLevel),
        detectedMidi: this.activeNoteMidi,
        detectedNoteName: this.activeNoteMidi !== null ? midiToNoteName(this.activeNoteMidi) : null,
        frequencyHz: null,
        centsOff: 0,
        confidence: 0,
      };
    }

    this.prevRms = rms;
    this.emitTelemetry(this.latestTelemetry);
    this.scheduleNextFrame();
  }

  private emitNoteOn(estimate: YinPitchEstimate): void {
    const velocity = Math.max(0.15, Math.min(1.0, estimate.rms * 6.5));
    const event: NoteInputEvent = {
      type: 'note_on',
      midi: estimate.midi,
      noteName: midiToNoteName(estimate.midi),
      frequencyHz: estimate.frequencyHz,
      velocity,
      source: 'microphone',
      timestampMs: performance.now(),
      centsOff: estimate.centsOff,
      confidence: estimate.confidence,
    };
    for (const listener of this.noteListeners) {
      listener(event);
    }
  }

  private emitNoteOff(midi: number): void {
    const event: NoteInputEvent = {
      type: 'note_off',
      midi,
      noteName: midiToNoteName(midi),
      frequencyHz: midiToFrequency(midi),
      velocity: 0,
      source: 'microphone',
      timestampMs: performance.now(),
    };
    for (const listener of this.noteListeners) {
      listener(event);
    }
  }

  private emitTelemetry(telemetry: LiveMicTelemetry): void {
    for (const listener of this.telemetryListeners) {
      listener(telemetry);
    }
  }
}
