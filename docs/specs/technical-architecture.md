# Technical Architecture Specification: Studio-Grade Beginner Piano Learning Web Application

## 1. Executive Summary & Architectural Principles

This specification defines the complete client-side technical architecture for an interactive beginner piano learning web application combining the best pedagogical and technical strengths of **Simply Piano** (step-by-step micro-stages, color-coded real-time feedback, Soloist & Chords paths, 5-minute workouts), **Flowkey** (Wait Mode, overhead hand/finger visual modeling, A–B measure looping, hand separation), and **Perfect Piano** (Falling Notes cascade visualizer, playable multi-octave synthesizer, timing accuracy grading).

Furthermore, the architecture solves the core gap in existing consumer apps through a dedicated **"Identify My Play & Fix Me" Coaching Engine** (`CoachDiagnosisEngine`) that evaluates live input from **Microphone (acoustic piano)**, **Web MIDI (digital keyboard)**, or **Virtual/QWERTY Keyboard**, diagnoses *why* a beginner made a mistake (neighbor key slip, Middle-C landmark drift, rhythm rushing/dragging, hand coordination lag, or chord finger tension), and dynamically prescribes both **Contextual Video Lessons** and a **3-Stage Interactive Remediation Micro-Loop** on the exact trouble measures.

### Core Engineering Principles
1. **Zero-Backend, Offline-Capable Studio Architecture**: Runs 100% in the browser using TypeScript, React 18+, Vite, Tailwind CSS, Web Audio API, Web MIDI API, and HTML5 Canvas/SVG. No external audio sample files or backend servers are required to boot and play.
2. **Sub-10ms Audio & Visual Lockstep**: Real-time note scheduling, pitch detection, and visual playhead rendering are driven by `AudioContext.currentTime` and `requestAnimationFrame` via mutable engine refs—never throttled by React component re-render cycles.
3. **Unified Tri-Modal Input Abstraction**: Microphone pitch detection, Web MIDI messages, and Virtual/QWERTY keyboard inputs are normalized into a single `NoteInputEvent` stream consumed identically by the `PracticeEngine`.
4. **Actionable Pedagogical Telemetry**: Every note attempt records pitch delta, timing offset (ms), hesitation latency (ms), finger assignment, and hint state so the app can coach the student like a human teacher rather than showing binary pass/fail scores.

---

## 2. Technology Stack & Module Architecture

### 2.1 Technology Stack
- **Language & Build**: TypeScript 5.x (strict mode), Vite 5.x
- **UI Framework**: React 18+ (Functional Components, Custom Hooks)
- **Styling & Design System**: Tailwind CSS 3.x + CSS Custom Properties for studio dark-mode theme and high-contrast visualizers
- **Audio & Pitch Processing**: Native Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `GainNode`, `ConvolverNode`, `DynamicsCompressorNode`, `AnalyserNode`, `MediaStreamAudioSourceNode`)
- **Hardware Connectivity**: Native Web MIDI API (`navigator.requestMIDIAccess`)
- **Graphics & Notation Rendering**:
  - **Falling Notes Cascade**: High-DPI HTML5 `<canvas>` (`devicePixelRatio` scaled, 60/120fps `requestAnimationFrame` loop)
  - **Interactive Grand Staff & Overhead Hand Ghost**: Vector SVG with hardware-accelerated CSS transforms (`translate3d`) for crisp musical typography at any zoom level
- **Persistence**: Typed `localStorage` repository (`StorageService`) storing curriculum progress, star ratings, error telemetry history, streak stats, and hardware calibration settings

### 2.2 Directory & Module Hierarchy

```text
src/
├── types/
│   ├── music.ts              # Pitch, MIDI, ScoreNoteEvent, Measure, ScoreData
│   ├── curriculum.ts         # Tracks, Lessons, LessonSteps, WorkoutDefinitions
│   ├── input.ts              # NoteInputEvent, InputSource, MicCalibrationConfig
│   ├── practice.ts           # PracticeMode, NoteEvalStatus, LiveCorrectionFeedback
│   ├── coach.ts              # NoteAttemptRecord, MistakeCategory, DiagnosisReport, RemediationPlan
│   └── video.ts              # VideoLesson, OverheadAnimationKeyframe, VideoRecommendation
├── engines/
│   ├── AudioEngine.ts        # Polyphonic Grand Piano synth, Reverb, Metronome, Backing Track
│   ├── MicPitchDetector.ts   # YIN/NSDF autocorrelation pitch detector + RMS gate + debounce
│   ├── MidiInputAdapter.ts   # Web MIDI API discovery, hot-plugging, message parser
│   ├── QwertyInputAdapter.ts # Computer keyboard C3–E5 mapper + key repeat suppression
│   ├── InputManager.ts       # Multiplexes Mic, MIDI, and Virtual/QWERTY into NoteInputEvent stream
│   ├── PracticeEngine.ts     # Real-time score clock, Wait/Slow/Perform/Drill state machine
│   └── CoachDiagnosisEngine.ts # Error pattern classifier, Fix-Me drill builder, Video recommender
├── data/
│   ├── curriculumData.ts     # Structured Soloist & Chords lessons with 5-step guided flow
│   ├── songLibraryData.ts    # Graded beginner songs & lead sheets with accompaniment tracks
│   ├── videoLibraryData.ts   # Curated video lessons (overhead animated demos + YouTube tutorials)
│   └── workoutData.ts        # 5-Minute Daily Workouts (Sight-Reading, Ear Training, Chords)
├── utils/
│   ├── midiUtils.ts          # MIDI <-> Frequency <-> NoteName <-> Staff Line/Ledger math
│   ├── keyboardLayout.ts     # Shared C3–B5 normalized X-coordinate geometry for Canvas & DOM
│   └── storage.ts            # LocalStorage persistence & telemetry aggregation
├── hooks/
│   ├── usePianoEngines.ts    # Lifecycle bridge connecting Audio, Input, Practice, and Coach engines
│   └── useAnimationFrame.ts  # High-precision RAF loop synced to PracticeEngine playhead
└── components/
    ├── layout/
    │   ├── TopNavigation.tsx         # Mode switcher, Input source status pill, Streak/XP bar
    │   └── TransportControlBar.tsx   # Play/Pause, Practice Mode, Hand Filter, Tempo, A-B Loop
    ├── visualizers/
    │   ├── GrandStaffView.tsx        # Treble/Bass SVG notation, ledger lines, finger badges, playhead
    │   ├── FallingNotesCanvas.tsx    # Perfect Piano cascade renderer with hit particles
    │   ├── InteractiveKeyboard.tsx   # 3-octave C3-B5 piano with live pitch & directional correction
    │   └── OverheadHandGuide.tsx     # Animated translucent LH/RH ghost hands & finger numbers
    ├── coaching/
    │   ├── LiveCoachBanner.tsx       # Real-time directional feedback ("Played F4 -> Move 1 key left to E4")
    │   ├── FixMeModal.tsx            # Post-attempt diagnostic breakdown & 3-Step Fix Drill launcher
    │   └── StepGuideStepper.tsx      # 5-Step Guided Lesson progression bar & instructions
    ├── video/
    │   ├── VideoCoachDrawer.tsx      # Contextual & recommended video lessons with mistake tags
    │   └── InteractiveVideoPlayer.tsx# Dual-mode player: Overhead Interactive Demo + YouTube Embed
    └── views/
        ├── CurriculumMapView.tsx     # Simply Piano Soloist & Chords path progression tree
        ├── PracticeStudioView.tsx    # Main interactive learning workspace
        ├── WorkoutsView.tsx          # 5-Minute Daily Workouts (Flashcards, Ear, Chords)
        └── InputSetupModal.tsx       # Microphone sensitivity calibration & MIDI device selector
```

---

## 3. Core Domain Data Models (`src/types/`)

```typescript
// src/types/music.ts

export type Hand = 'right' | 'left' | 'both';
export type SingleHand = 'right' | 'left';
export type Clef = 'treble' | 'bass';
export type FingerNumber = 1 | 2 | 3 | 4 | 5;

export type NoteDurationType = 'whole' | 'half' | 'quarter' | 'eighth';

export interface ScoreNoteEvent {
  /** Unique deterministic ID within the score (e.g., "m0-b0-rh-60") */
  id: string;
  /** MIDI note number (48 = C3, 60 = Middle C4, 72 = C5, 83 = B5) */
  midi: number;
  /** Scientific pitch notation (e.g., "C4", "F#4") */
  noteName: string;
  /** 0-indexed measure number */
  measureIndex: number;
  /** Global beat position from start of score (quarter note = 1.0 beat) */
  beatStart: number;
  /** Duration in beats (whole = 4, half = 2, quarter = 1, eighth = 0.5) */
  durationBeats: number;
  durationType: NoteDurationType;
  hand: SingleHand;
  clef: Clef;
  /** Recommended finger (1 = Thumb, 2 = Index, 3 = Middle, 4 = Ring, 5 = Pinky) */
  finger: FingerNumber;
  /** Optional chord symbol displayed above the staff (e.g., "C", "Am", "G7") */
  chordSymbol?: string;
  /** Optional pedagogical coaching tip for this specific note transition */
  techniqueTip?: string;
}

export interface AccompanimentEvent {
  beatStart: number;
  durationBeats: number;
  midiNotes: number[];
  style: 'warm_pad' | 'bass_pulse' | 'arpeggio' | 'percussion_accent';
  velocity: number;
}

export interface ScoreData {
  id: string;
  title: string;
  subtitle: string;
  /** Target 100% tempo in Beats Per Minute */
  bpm: number;
  timeSignature: [number, number]; // e.g., [4, 4] or [3, 4]
  keySignature: string;            // e.g., "C", "G", "F", "Am"
  totalMeasures: number;
  totalBeats: number;
  notes: ScoreNoteEvent[];
  accompaniment: AccompanimentEvent[];
}
```

```typescript
// src/types/curriculum.ts

export type CurriculumTrackId = 'soloist' | 'chords' | 'synthesis';

export type LessonStepType =
  | 'video_intro'        // Step 1: Watch technique video & overhead posture demo
  | 'key_discovery'      // Step 2: Find & press the target landmark keys on the keyboard
  | 'wait_mode'          // Step 3: Walk through the score note-by-note with zero clock pressure
  | 'slow_flow'          // Step 4: Guided tempo flow (65-75% BPM) with metronome & backing track
  | 'stage_performance'; // Step 5: 100% BPM Stage performance + Coach Diagnostic Review

export interface KeyDiscoveryPrompt {
  id: string;
  targetMidi: number;
  targetNoteName: string;
  hand: 'right' | 'left';
  finger: 1 | 2 | 3 | 4 | 5;
  instruction: string;     // e.g., "Find Middle C (left of the 2 black keys) with Right Thumb (1)"
  landmarkHint: string;    // e.g., "Look for the group of 2 black keys in the center of the piano"
}

export interface LessonStep {
  id: string;
  stepNumber: 1 | 2 | 3 | 4 | 5;
  type: LessonStepType;
  title: string;
  instruction: string;
  coachTip: string;
  /** Linked video ID for Step 1 or step-specific help */
  videoId?: string;
  /** Used when type === 'key_discovery' */
  discoveryPrompts?: KeyDiscoveryPrompt[];
  /** Tempo multiplier for practice steps (e.g., 0.7 for slow_tempo, 1.0 for performance_stage) */
  tempoMultiplier?: number;
  /** Hand filter override for this step */
  handFilter?: 'right' | 'left' | 'both';
  /** Loop range override if practicing a specific section */
  measureRange?: [number, number];
}

export interface Lesson {
  id: string;
  trackId: CurriculumTrackId;
  unitNumber: number;
  title: string;
  description: string;
  difficulty: 'Beginner 1' | 'Beginner 2' | 'Elementary';
  skillsTaught: string[];
  targetNotes: string[];
  primaryVideoId: string;
  remedialVideoIds: string[];
  score: ScoreData;
  steps: LessonStep[];
}
```

---

## 4. Audio Synthesis Engine (`AudioEngine`)

Because external multi-megabyte piano samples can fail to load or introduce network latency, `AudioEngine` synthesizes a rich, expressive acoustic grand piano, metronome, and backing accompaniment natively using the Web Audio API.

### 4.1 Acoustic Grand Piano Voice Topology

Each triggered piano note (`playNote(midi, velocity, durationSec)`) constructs a polyphonic voice subgraph routed into a shared Master Bus:

```text
[Osc 1: Triangle f0 (Fundamental)] ──────► [Gain: 0.65] ──┐
[Osc 2: Sine 2*f0 + detune (2nd Harm)] ──► [Gain: 0.28] ──┼──► [Key-Scaled Lowpass BiquadFilter]
[Osc 3: Sine 3*f0 + detune (3rd Harm)] ──► [Gain: 0.11] ──┤              │
[Osc 4: Sine 4*f0 + detune (4th Harm)] ──► [Gain: 0.05] ──┘              ▼
                                                                  [Voice Envelope Gain (ADSR)]
[Hammer Noise Buffer] ─► [Bandpass Filter 3kHz] ─► [12ms Decay] ─────────▲
                                                                         │
      ┌──────────────────────────────────────────────────────────────────┘
      ▼
[Dry Gain (0.78)] ─────────────────────────────────────────► [Master Compressor] ─► [Destination]
      │                                                             ▲
      └──► [ConvolverNode (Concert Room Impulse)] ─► [Wet Gain (0.22)]┘
```

#### Key Synthesis Formulas
1. **Pitch & Stretched Tuning Inharmonicity**:
   $$f_0 = 440 \cdot 2^{(m - 69)/12}$$
   Real piano strings exhibit slight stiffness inharmonicity. Higher partials are detuned slightly sharp:
   $$f_k = k \cdot f_0 \cdot \sqrt{1 + B \cdot k^2}, \quad B = 0.00015$$
2. **Velocity- & Register-Scaled Low-Pass Filter**:
   Higher velocity strikes produce brighter overtones; lower notes have warmer roll-off:
   $$f_{\text{cutoff}} = \min\left(16000,\; f_0 \cdot \left(2.2 + 7.5 \cdot v^{1.3}\right)\right)$$
   During the note decay, $f_{\text{cutoff}}$ exponentially decays toward $1.8 \cdot f_0$ over $1.4\text{ seconds}$, mimicking higher harmonics damping faster than the fundamental.
3. **Dual-Stage Piano Envelope**:
   - **Attack**: $t_{\text{attack}} = \max(0.003, 0.012 - 0.008 \cdot v)\text{ s}$ (faster attack on harder strikes).
   - **Initial Soundboard Decay**: Exponential ramp from peak gain $G_{\text{peak}} = 0.35 \cdot v^{1.1}$ to $0.45 \cdot G_{\text{peak}}$ over $0.28\text{ s}$.
   - **String Sustain Decay**: Register-dependent decay time constant $\tau_{\text{sustain}} = 4.2\text{ s} - 0.038 \cdot (m - 48)\text{ s}$ (bass strings ring longer than treble strings).
   - **Damper Release**: When `noteOff(midi)` is called (and sustain pedal is up), gain ramps exponentially to $0.0001$ over $0.14\text{ s}$.
4. **Hammer Felt Transient Burst**:
   A pre-allocated $40\text{ ms}$ white-noise `AudioBuffer` filtered through a `bandpass` filter centered at $2800\text{ Hz}$ ($Q = 1.8$) with a fast $12\text{ ms}$ decay envelope adds realistic mechanical key-strike presence.
5. **Procedural Room Reverb (`ConvolverNode`)**:
   On initialization, `AudioEngine` generates a $1.6\text{ s}$ stereo impulse response buffer with exponentially decaying decorrelated Gaussian noise and a $4\text{ kHz}$ high-frequency damping shelf, giving the piano warm concert-room acoustics without fetching external `.wav` impulse files.

### 4.2 `AudioEngine` Interface

```typescript
// src/engines/AudioEngine.ts

export interface ActiveVoice {
  midi: number;
  startedAt: number;
  release: (immediate?: boolean) => void;
  sustained: boolean;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private compressor!: DynamicsCompressorNode;
  private reverbConvolver!: ConvolverNode;
  private hammerNoiseBuffer!: AudioBuffer;
  private activeVoices = new Map<number, ActiveVoice>();
  private sustainPedalDown = false;
  private muted = false;

  /** Initializes or resumes the Web Audio API context on user gesture */
  public async init(): Promise<AudioContext>;

  /** Returns high-precision audio clock in seconds */
  public getCurrentTime(): number;

  /** Triggers polyphonic grand piano note; returns release handle */
  public noteOn(midi: number, velocity?: number, sourceHint?: 'user' | 'demo' | 'coach'): void;

  /** Releases active piano voice (or marks sustained if pedal is down) */
  public noteOff(midi: number): void;

  /** Toggles damper sustain pedal simulation */
  public setSustainPedal(down: boolean): void;

  /** Schedules a sample-accurate metronome woodblock click */
  public playMetronomeClick(isDownbeat: boolean, scheduledTime?: number): void;

  /** Plays a warm backing accompaniment chord/bass event */
  public playAccompanimentEvent(event: AccompanimentEvent, tempoBpm: number): void;

  /** Plays an auditory coaching cue (e.g., gentle success chime or soft pitch correction preview) */
  public playCoachCue(type: 'step_complete' | 'hint_target' | 'star_earned', targetMidi?: number): void;

  /** Immediately silences all active voices */
  public stopAllVoices(): void;
}
```

---

## 5. Real-Time Pitch & Input Detection Engine (`InputDetectionEngine`)

To deliver a true Simply Piano / Flowkey experience, the learner can play on:
1. **A real acoustic piano or keyboard via their device Microphone** (`MicPitchDetector`)
2. **A USB/Bluetooth MIDI keyboard via Web MIDI API** (`MidiInputAdapter`)
3. **The interactive on-screen touch/mouse piano or computer QWERTY keyboard** (`QwertyInputAdapter`)

### 5.1 Unified `NoteInputEvent` Contract

```typescript
// src/types/input.ts

export type InputSourceType = 'mic' | 'midi' | 'virtual';

export interface NoteInputEvent {
  type: 'note_on' | 'note_off';
  source: InputSourceType;
  /** Detected or pressed MIDI note number (e.g., 60 = C4) */
  midi: number;
  /** Scientific pitch name (e.g., "C4") */
  noteName: string;
  /** Detected fundamental frequency in Hz (exact for synth/MIDI, measured for Mic) */
  frequencyHz: number;
  /** Pitch deviation in cents (-50 to +50; 0 for MIDI/Virtual) */
  centsOff: number;
  /** Normalized velocity [0.0 - 1.0] */
  velocity: number;
  /** Detector confidence [0.0 - 1.0] */
  confidence: number;
  /** High-resolution performance.now() timestamp in ms */
  timestampMs: number;
}

export interface MicTelemetrySnapshot {
  isListening: boolean;
  rmsLevel: number;          // 0.0 to 1.0 live input volume meter
  noiseFloorRms: number;     // Calibrated ambient threshold
  detectedMidi: number | null;
  detectedNoteName: string | null;
  detectedHz: number | null;
  centsOff: number;
  confidence: number;
}
```

### 5.2 Live Microphone Pitch Detection Algorithm (`MicPitchDetector`)

Acoustic pianos have rich harmonic overtones and percussive hammer attacks that fool naive zero-crossing or basic FFT peak detectors. Our `MicPitchDetector` implements a 4-stage **YIN / Normalized Square Difference (NSDF) Autocorrelation Pipeline** tuned specifically for the piano range `C2 (65.4 Hz)` through `C6 (1046.5 Hz)`:

```text
[MediaStream (echoCancellation: false, autoGainControl: false, noiseSuppression: false)]
      │
      ▼
[AnalyserNode (fftSize = 4096, float32 time-domain buffer @ 44.1/48kHz)]
      │
      ▼
[Stage 1: RMS Noise Gate & Onset Energy Detector]
      │  (Rejects frames where RMS < noiseFloorThreshold; detects fresh key strikes via RMS derivative)
      ▼
[Stage 2: YIN Cumulative Mean Normalized Difference Function d'(τ)]
      │  (Searches lag τ in [τ_min (C6=1046Hz), τ_max (C2=65Hz)] for first deep minimum < 0.16)
      ▼
[Stage 3: Parabolic Interpolation & Octave/Harmonic Verification]
      │  (Refines τ* to sub-sample precision; verifies τ* vs 2·τ* to prevent 2nd-harmonic octave jumps)
      ▼
[Stage 4: Multi-Frame Median & Stability Debounce Filter]
         (Requires 2 consecutive frames on same MIDI note within ±38 cents before emitting NoteOn)
```

#### Mathematical Formulation of Stage 2 & 3 (YIN Pitch Estimator)
Given a window of $W = 2048$ time-domain samples $x[0 \dots 2W-1]$ at sample rate $F_s$:
1. **Difference Function**:
   $$d(\tau) = \sum_{j=0}^{W-1} \left(x[j] - x[j + \tau]\right)^2$$
   For lags $\tau \in [\tau_{\min}, \tau_{\max}]$ where $\tau_{\min} = \lfloor F_s / 1100 \rfloor$ and $\tau_{\max} = \lceil F_s / 60 \rceil$.
2. **Cumulative Mean Normalized Difference Function (CMNDF)**:
   $$d'(\tau) = \begin{cases} 1 & \text{if } \tau = 0 \\ \dfrac{d(\tau)}{\frac{1}{\tau} \sum_{k=1}^{\tau} d(k)} & \text{if } \tau > 0 \end{cases}$$
3. **Absolute Threshold Selection**:
   Find the **smallest lag** $\tau^*$ such that $d'(\tau^*) < \theta_{\text{yin}}$ (default $\theta_{\text{yin}} = 0.16$) and $d'(\tau^*)$ is a local minimum ($d'(\tau^*) \le d'(\tau^* + 1)$). Choosing the *first* deep dip below threshold rather than the global minimum prevents sub-harmonic (octave-too-low) locking. If no lag falls below $\theta_{\text{yin}}$, select the global minimum if $d'(\tau_{\min\text{-global}}) < 0.28$; otherwise classify the frame as unpitched noise.
4. **Parabolic Interpolation**:
   Fit a parabola through $(\tau^*-1, d'(\tau^*-1))$, $(\tau^*, d'(\tau^*))$, and $(\tau^*+1, d'(\tau^*+1))$:
   $$\hat{\tau} = \tau^* + \frac{d'(\tau^*-1) - d'(\tau^*+1)}{2 \left(d'(\tau^*-1) - 2 d'(\tau^*) + d'(\tau^*+1)\right)}$$
   $$f_0 = \frac{F_s}{\hat{\tau}}, \quad \text{confidence} = 1 - d'(\tau^*)$$
5. **MIDI & Cents Conversion**:
   $$m_{\text{float}} = 69 + 12 \log_2\left(\frac{f_0}{440}\right), \quad \text{midi} = \text{round}(m_{\text{float}}), \quad \text{centsOff} = \text{round}\left((m_{\text{float}} - \text{midi}) \times 100\right)$$
6. **Stability Debounce & Re-Attack Detection**:
   - A ring buffer holds the last 3 detected MIDI values.
   - `note_on` is emitted only when at least 2 consecutive valid frames agree on `midi` with $|\text{centsOff}| \le 40$ and `confidence >= 0.72`.
   - Repeated same-note strikes (e.g., playing `C4 -> C4 -> C4` in *Hot Cross Buns* or *Ode to Joy*) are detected when $\text{RMS}_t > 1.45 \times \text{RMS}_{t-1}$ after a transient dip, emitting a fresh `note_off` + `note_on` pair even if the pitch stayed on `C4`.

### 5.3 Web MIDI Adapter (`MidiInputAdapter`)
- Calls `navigator.requestMIDIAccess({ sysex: false })`.
- Enumerates all connected MIDI inputs and subscribes to `midimessage` and `statechange` (automatic USB plug-and-play detection).
- Parses status byte `cmd = data[0] & 0xf0`:
  - `0x90` with `data[2] > 0`: emits `NoteInputEvent` (`type: 'note_on'`, `velocity: data[2] / 127`) and triggers `AudioEngine.noteOn` (optional local synth monitoring toggle for controller keyboards without built-in speakers).
  - `0x80` or (`0x90` with `data[2] === 0`): emits `NoteInputEvent` (`type: 'note_off'`).
  - `0xB0` with `data[1] === 64`: updates `AudioEngine.setSustainPedal(data[2] >= 64)`.

### 5.4 Computer QWERTY & Multi-Touch Virtual Keyboard (`QwertyInputAdapter`)
Maps two ergonomic tiers of the computer keyboard across **C3 (MIDI 48)** to **E5 (MIDI 76)**:
- **Lower Row (Left Hand / Octave 3: C3–B3)**:
  - White keys: `Z` (C3), `X` (D3), `C` (E3), `V` (F3), `B` (G3), `N` (A3), `M` (B3)
  - Black keys: `S` (C#3), `D` (D#3), `G` (F#3), `H` (G#3), `J` (A#3)
- **Upper/Home Row (Right Hand / Octave 4–5: C4–E5)**:
  - White keys: `Q` or `,` (C4), `W` (D4), `E` (E4), `R` (F4), `T` (G4), `Y` (A4), `U` (B4), `I` (C5), `O` (D5), `P` (E5), `[` (F5), `]` (G5)
  - Black keys: `2` (C#4), `3` (D#4), `5` (F#4), `6` (G#4), `7` (A#4), `9` (C#5), `0` (D#5)
- Suppresses OS key auto-repeat (`if (event.repeat) return`) and tracks depressed keys in a `Set<string>` to guarantee balanced `note_on` / `note_off` events.

---

## 6. Practice & Real-Time Evaluation State Machine (`PracticeEngine`)

`PracticeEngine` is the central coordinator that advances the score playhead, evaluates incoming `NoteInputEvent`s against expected `ScoreNoteEvent`s, triggers Simply Piano color feedback, emits live directional correction banners, and records per-note telemetry for the `CoachDiagnosisEngine`.

### 6.1 State Machine & Practice Modes

```text
                       ┌──────────────────────┐
                       │      IDLE / READY    │
                       └──────────┬───────────┘
                                  │ startPractice(mode, options)
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────────┐
│ KEY_DISCOVERY │         │   WAIT_MODE   │         │   MOVING_CLOCK    │
│   (Step 2)    │         │   (Step 3)    │         │ (Slow / Perform / │
│               │         │               │         │   AutoDemo)       │
└───────┬───────┘         └───────┬───────┘         └─────────┬─────────┘
        │                         │                           │
        │ All prompts found       │ Playhead pauses at each   │ AudioContext clock advances
        │                         │ chord/beat group until    │ playheadBeat continuously;
        │                         │ all notes in group hit    │ A-B loop wraps or score ends
        └─────────────────────────┼───────────────────────────┘
                                  ▼
                       ┌──────────────────────┐
                       │  SESSION_COMPLETED   │
                       │  (Coach Diagnosis &  │
                       │   Step Advancement)  │
                       └──────────┬───────────┘
                                  │ Launch "Fix My Mistakes"
                                  ▼
                       ┌──────────────────────┐
                       │  REMEDIATION_DRILL   │
                       │  Phase A: Wait Mode  │
                       │  Phase B: 60% Loop   │
                       │  Phase C: 90% Check  │
                       └──────────────────────┘
```

### 6.2 Practice Mode Specifications & Timing Windows

| Practice Mode | Clock Advancement | Timing Tolerance Window | Backing Accompaniment | Wrong Note Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`key_discovery`** (Step 2) | Event-driven (Prompt index $0 \dots K-1$) | Infinite (untimed) | Off (Coach voice chimes) | Shows directional arrow from played key to target key; stays on prompt until correct key pressed. |
| **`wait_mode`** (Step 3) | Pauses at each distinct `beatStart` chord group | Infinite (hesitation hint triggers after $2200\text{ ms}$) | Off | Highlights played wrong key in Red + directional banner (`Move 2 keys right to G4`); marks note as `hinted`; waits until correct pitch is played. |
| **`slow_practice`** (Step 4) | Continuous at $0.60\times - 0.75\times$ BPM | $\pm 220\text{ ms}$ ($\approx \pm 0.30$ beats) | Active + Metronome | Records wrong pitch in telemetry, flashes live correction banner, continues clock (unless user enables "Auto-Pause on 3 Misses"). |
| **`performance`** (Step 5) | Continuous at $1.00\times$ BPM | $\pm 150\text{ ms}$ (Perfect: $\le 55\text{ ms}$, Good: $\le 150\text{ ms}$) | Full Band Accompaniment | Full stage scoring, streak multiplier, and post-song `CoachDiagnosisEngine` analysis. |
| **`remediation_drill`** ("Fix Me") | 3-Phase Micro-Loop over trouble measures $[M_a, M_b]$ | Phase 1: Wait Mode<br>Phase 2: $\pm 220\text{ ms}$ @ $60\%$<br>Phase 3: $\pm 170\text{ ms}$ @ $90\%$ | Metronome in Phases 2–3 | Requires 1 clean Wait walkthrough + 2 clean slow loops ($\ge 85\%$ accuracy) + 1 tempo check to graduate. |
| **`auto_demo`** (Listen) | Continuous at selected Tempo % | N/A (Synthesizer auto-plays score) | Active | Animates Overhead Hand Ghost, Staff Playhead, and Keyboard highlights so student can watch and listen. |

### 6.3 Simply Piano Color States & Evaluation Logic

Each `ScoreNoteEvent` in the active session maintains a real-time evaluation state:

```typescript
// src/types/practice.ts

export type NoteEvaluationStatus =
  | 'upcoming'            // Default neutral state (Blue for RH, Pink for LH in Falling Notes)
  | 'active_target'       // Currently under the playhead / waiting for user input
  | 'hint_active'         // User hesitated > 2.2s or hit a wrong note first; pulsing Amber guide
  | 'correct_first_try'   // Emerald/Blue (#10B981): Hit correct pitch on 1st try within window
  | 'correct_after_hint'  // Amber/Gold (#F59E0B): Hit correct pitch after wrong attempt or hesitation hint
  | 'wrong_pitch'         // Coral/Red (#EF4444): Currently striking an incorrect pitch for this target
  | 'missed';             // Muted Red (#DC2626): Playhead passed note window without correct hit

export interface LiveCorrectionFeedback {
  timestampMs: number;
  expectedNote: ScoreNoteEvent;
  playedMidi: number;
  playedNoteName: string;
  semitoneDelta: number;       // playedMidi - expectedNote.midi (e.g., +1 means 1 semitone too high)
  whiteKeyDelta: number;       // Signed count of white keys to move left (-) or right (+)
  direction: 'left' | 'right' | 'exact';
  headline: string;            // e.g., "You played F4 (1 key too high)"
  actionInstruction: string;   // e.g., "Move 1 white key LEFT to E4 • Use Right Hand Finger 3"
}
```

#### Polyphonic Chord & Both-Hands Group Matching
1. Score notes are grouped into `BeatChordGroup` buckets where $|n_i.\text{beatStart} - n_j.\text{beatStart}| < 0.02$, filtered by the active `HandFilter` (`'right' | 'left' | 'both'`).
2. **In `wait_mode`**:
   - A `BeatChordGroup` requiring $K$ simultaneous notes (e.g., `C4 + E4 + G4` triad or `C3 (LH) + E4 (RH)`) tracks `satisfiedNoteIds: Set<string>`.
   - As the user presses each required note (or strikes them together), the matched note transitions to `correct_first_try` (or `correct_after_hint` if a wrong key was pressed first).
   - Once `satisfiedNoteIds.size === group.notes.length`, the playhead smoothly advances to the next `BeatChordGroup`.
3. **In Moving Modes (`slow_practice`, `performance`, `remediation_drill` Phases 2–3)**:
   - For each incoming `note_on` at `currentBeat`, `PracticeEngine` searches for unmatched notes in the active `HandFilter` whose `beatStart` is within $\pm \Delta t_{\text{window}}$ of `currentBeat`.
   - **Exact Pitch Match**: If an unmatched note with `note.midi === input.midi` exists in the window, mark it `correct_first_try` (or `correct_after_hint` if prior wrong pitch occurred on that beat), record `timingErrorMs = (currentBeat - note.beatStart) * (60000 / effectiveBpm)`, and increment combo streak.
   - **Wrong Pitch Diagnostics**: If no matching MIDI exists in the window, find the closest active target note at `currentBeat`, record `playedMidi` into its `NoteAttemptRecord.playedMidiHistory`, set status to `hint_active`, and emit a `LiveCorrectionFeedback` object so the UI immediately highlights both the grey/red key the user hit and the amber key they should hit.

---

## 7. "Fix Me" Diagnostic & Remediation Algorithm (`CoachDiagnosisEngine`)

After any practice pass (or anytime the user clicks **"Fix My Mistakes"**), `CoachDiagnosisEngine` analyzes the recorded `NoteAttemptRecord[]` telemetry to identify specific beginner issues, explain them in plain language, recommend targeted **Video Lessons**, and build a custom **3-Step Remediation Micro-Drill**.

### 7.1 Telemetry & Diagnostic Data Structures

```typescript
// src/types/coach.ts

export interface NoteAttemptRecord {
  noteId: string;
  measureIndex: number;
  beatStart: number;
  expectedMidi: number;
  expectedNoteName: string;
  hand: 'right' | 'left';
  finger: 1 | 2 | 3 | 4 | 5;
  status: 'correct_first_try' | 'correct_after_hint' | 'missed';
  /** All wrong MIDI pitches played while attempting this note */
  wrongMidisPlayed: number[];
  /** Signed semitone error of first wrong note (playedMidi - expectedMidi), or 0 */
  firstSemitoneDelta: number;
  /** Signed timing error in ms (negative = early/rushing, positive = late/dragging) */
  timingErrorMs: number;
  /** Time elapsed (ms) between note becoming active target and correct key press (Wait Mode) */
  hesitationMs: number;
  /** For chord/both-hand beats: spread in ms between first and last note of the group */
  chordSpreadMs: number;
}

export type MistakeCategory =
  | 'ADJACENT_KEY_SLIP'          // Hitting adjacent neighbor key (±1 or ±2 semitones)
  | 'LANDMARK_DISPLACEMENT'      // Hand shifted out of Middle C / G-clef / F-clef anchor
  | 'OCTAVE_SHIFT'               // Playing correct note class in wrong octave (±12 semitones)
  | 'INTERVAL_MISJUDGE'          // Under/overshooting a skip (3rd/4th/5th)
  | 'CHROMATIC_ACCIDENTAL_MISS'  // Playing natural instead of sharp/flat (e.g., F4 vs F#4, D#5)
  | 'RUSHING_BEAT'               // Consistently playing >80ms ahead of the beat
  | 'DRAGGING_HESITATION'        // Late notes (>90ms) or >1.5s hesitation on note transitions
  | 'SHORT_NOTE_CLIPPING'        // Releasing half/whole notes too early (<55% held duration)
  | 'CHORD_TRANSITION_STALL'     // Delay or incomplete triad when switching chord shapes
  | 'TWO_HAND_DESYNC';           // Left & Right hand notes not landing together (>130ms spread)

export interface DetectedIssue {
  category: MistakeCategory;
  severity: 'high' | 'medium' | 'low';
  title: string;
  diagnosisExplanation: string;
  actionableFixTip: string;
  affectedMeasures: number[];      // 0-indexed measure numbers
  exampleDetail: string;           // e.g., "In Measure 3, you played F4 instead of E4 (Finger 3) twice."
  recommendedVideoIds: string[];
}

export interface MeasureHealthSummary {
  measureIndex: number;
  totalNotes: number;
  firstTryCount: number;
  hintedCount: number;
  missedCount: number;
  avgTimingErrorMs: number;
  maxHesitationMs: number;
  /** Composite trouble score [0 - 100]; >= 35 triggers targeted bar remediation */
  troubleScore: number;
}

export interface RemediationStage {
  stageNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  mode: 'wait_mode' | 'slow_practice';
  tempoMultiplier: number;
  handFilter: 'right' | 'left' | 'both';
  measureRange: [number, number];
  targetCleanReps: number;
}

export interface RemediationPlan {
  id: string;
  title: string;
  summary: string;
  measureRange: [number, number];
  focusHand: 'right' | 'left' | 'both';
  stages: RemediationStage[];
  linkedVideoIds: string[];
}

export interface CoachDiagnosisReport {
  overallAccuracyPct: number;
  firstTryPct: number;
  starsEarned: 0 | 1 | 2 | 3;
  meanTimingErrorMs: number;
  rhythmTendency: 'on_beat' | 'rushing' | 'dragging';
  measureSummaries: MeasureHealthSummary[];
  troubleMeasures: number[];
  detectedIssues: DetectedIssue[];
  remediationPlan: RemediationPlan | null;
  recommendedVideos: string[];
}
```

### 7.2 Diagnostic Classification Rules (`CoachDiagnosisEngine.analyze`)

1. **Measure Trouble Scoring**:
   For each measure $m$:
   $$\text{troubleScore}(m) = \min\left(100,\; \frac{100}{N_m} \sum_{i \in m} \left(1.0 \cdot \mathbb{I}_{\text{missed}} + 0.65 \cdot \mathbb{I}_{\text{wrong\_attempt}} + 0.4 \cdot \mathbb{I}_{\text{hesitation} > 1400\text{ms}} + 0.35 \cdot \mathbb{I}_{|\text{timingError}| > 120\text{ms}}\right)\right)$$
   Measures with $\text{troubleScore}(m) \ge 30$ are flagged as `troubleMeasures`.

2. **Root-Cause Pattern Classifiers**:
   - **`ADJACENT_KEY_SLIP`**:
     - *Condition*: At least 2 notes had `wrongMidisPlayed.length > 0` where $|\text{firstSemitoneDelta}| \in \{1, 2\}$ on diatonic steps.
     - *Explanation*: Identifies exact note pair (e.g., *"In Measure 2, you played **F4** instead of **E4**. Your Ring Finger (4) pressed down when your Middle Finger (3) was needed."*).
     - *Prescribed Video*: `"vid-01-posture-arch"` & `"vid-03-steps-vs-skips"`.
   - **`LANDMARK_DISPLACEMENT` / `OCTAVE_SHIFT`**:
     - *Condition*: Any wrong pitch has $|\text{firstSemitoneDelta}| \ge 5$ (`OCTAVE_SHIFT` when $|\Delta| = 12$; `LANDMARK_DISPLACEMENT` when $\pm 5, \pm 7$).
     - *Explanation*: *"Your hand drifted away from the Middle C home position ($+12$ semitones / 1 octave too high in Measure 1). Anchor your thumb on Middle C (left of the 2 black keys) before starting."*
     - *Prescribed Video*: `"vid-02-middle-c-landmark"`.
   - **`INTERVAL_MISJUDGE` / `CHROMATIC_ACCIDENTAL_MISS`**:
     - *Condition*: `INTERVAL_MISJUDGE` when $|\Delta| \in \{3, 4\}$ on a skip/leap; `CHROMATIC_ACCIDENTAL_MISS` when target is a black key (sharp/flat) and user plays the adjacent natural white key ($\pm 1$ semitone).
     - *Prescribed Video*: `"vid-03-steps-vs-skips"` & `"vid-07-black-keys-and-accidentals"`.
   - **`RUSHING_BEAT`**:
     - *Condition*: In moving modes, $\ge 35\%$ of notes have `timingErrorMs < -80` and mean `timingErrorMs < -55`.
     - *Explanation*: *"You are playing ahead of the beat (averaging $92\text{ ms}$ early). Listen to the metronome woodblock click and let each quarter note breathe."*
     - *Prescribed Video*: `"vid-04-rhythm-pulse-breathing"`.
   - **`DRAGGING_HESITATION` / `SHORT_NOTE_CLIPPING`**:
     - *Condition*: Mean `timingErrorMs > +75` OR $\ge 2$ notes have `hesitationMs > 1500` (`SHORT_NOTE_CLIPPING` when held duration on half/whole notes $< 55\%$ of expected duration).
     - *Explanation*: Identifies the exact transition where the user hesitated (e.g., *"You paused for $2.1\text{ s}$ moving from E4 to G4 in Measure 3. Look ahead to the next note while holding the current key."*).
     - *Prescribed Video*: `"vid-04-rhythm-pulse-breathing"` & `"vid-03-steps-vs-skips"`.
   - **`CHORD_TRANSITION_STALL`**:
     - *Condition*: On 3-note triads or chord changes, hesitation $> 1400\text{ ms}$ or $\ge 1$ note in the chord was missed/substituted.
     - *Explanation*: *"On the C Major to G Major chord switch, keep your hand arch locked so fingers 1–3–5 move together as a unit."*
     - *Prescribed Video*: `"vid-05-triad-claw-and-inversions"` & `"vid-06-left-hand-anchor-and-groove"`.
   - **`TWO_HAND_DESYNC`**:
     - *Condition*: In a `Both Hands` lesson, beats with simultaneous LH + RH events have `chordSpreadMs > 130` or one hand's miss rate is $\ge 2\times$ the other hand's.
     - *Explanation*: *"When playing both hands together in Measure 3, your Left Hand landed $165\text{ ms}$ after your Right Hand."*
     - *Prescribed Video*: `"vid-08-two-hand-independence"`.

3. **Automated 3-Stage Remediation Plan Generation**:
   - Selects the contiguous trouble span $[M_{\text{start}}, M_{\text{end}}]$ (clamped to $1–2$ measures for focused micro-practice).
   - Generates 3 progressive stages:
     - **Stage 1 (`Wait Mode Isolation`)**: Practice Measures $M_{\text{start}}\text{–}M_{\text{end}}$ in Wait Mode with finger hints visible (1 clean pass).
     - **Stage 2 (`Slow Groove Loop @ 60%`)**: Loop Measures $M_{\text{start}}\text{–}M_{\text{end}}$ at $60\%$ speed with metronome (2 consecutive clean passes $\ge 85\%$).
     - **Stage 3 (`Tempo Bridge @ 90%`)**: Play Measures $M_{\text{start}}\text{–}M_{\text{end}}$ at $90\%$ speed to lock in muscle memory (1 clean pass).

---

## 8. Contextual Video Coach Architecture

To fulfill **"suggests videos"** with zero broken embeds or dead ends, every `VideoLesson` in `videoLibraryData.ts` is a **Dual-Mode Interactive Video Asset**:
1. **Interactive Studio Overhead Demo (Always Available Built-in Mode)**:
   - Renders an animated top-down grand piano, synchronized animated Left/Right hands with numbered fingers, live voiceover/caption callouts, and interactive **"Try It With the Video"** checkpoints.
2. **Curated YouTube Lesson Embed Mode**:
   - Embeds real, vetted beginner piano tutorial videos (e.g., Pianote / Hoffman Academy / HDpiano foundational tutorials) via privacy-enhanced `youtube-nocookie.com/embed/{videoId}?start={startSec}` with instant one-click fallback to the built-in Interactive Studio Overhead Demo.

```typescript
// src/types/video.ts

export interface VideoChapter {
  timeSec: number;
  title: string;
  keyTakeaway: string;
  demoNotesMidi?: number[];
}

export interface VideoLesson {
  id: string;
  title: string;
  instructor: string;
  durationLabel: string;        // e.g., "3:15"
  category: 'Posture & Landmarks' | 'Sight Reading' | 'Rhythm & Tempo' | 'Chords & Accompaniment' | 'Hand Coordination';
  /** Mistake categories that automatically trigger recommending this video */
  addressesMistakes: MistakeCategory[];
  /** Lesson IDs where this video is the primary introduction */
  linkedLessonIds: string[];
  summary: string;
  keyCheckpoints: string[];
  youtubeVideoId: string;
  youtubeStartSec?: number;
  /** Built-in interactive overhead demonstration score so the video works offline or side-by-side */
  interactiveDemoScore: ScoreData;
  chapters: VideoChapter[];
}
```

---

## 9. Dual Visualizer & Interactive Keyboard Rendering Architecture

### 9.1 Shared Piano Geometry (`src/utils/keyboardLayout.ts`)
Both the `<InteractiveKeyboard />` and `<FallingNotesCanvas />` share a single mathematical coordinate system covering **3 full octaves: `C3 (MIDI 48)` through `B5 (MIDI 83)`** (21 white keys, 15 black keys, 36 total keys):
- Each white key index $w \in [0, 20]$ has normalized width $W_{\text{white}} = 1 / 21$ and normalized left offset $X_{\text{white}}(w) = w / 21$.
- Black keys sit at exact acoustic offsets between their adjacent white keys ($W_{\text{black}} = 0.62 \cdot W_{\text{white}}$), with slight natural grouping offsets for the 2-black-key (`C#`, `D#`) and 3-black-key (`F#`, `G#`, `A#`) clusters.
- Calling `getKeyGeometry(midi)` returns `{ isBlack, leftPct, widthPct, centerPct, whiteKeyIndex, octave, label }`. Because both the Falling Notes `<canvas>` and the Piano Keyboard consume `getKeyGeometry(midi)`, falling note bars align with sub-pixel precision onto the exact white or black key below.

### 9.2 Falling Notes Cascade Renderer (`FallingNotesCanvas.tsx`)
- Uses a `ResizeObserver` + `window.devicePixelRatio` scaling for razor-sharp rendering on Retina/4K displays.
- **Lookahead Window**: Displays `LOOKAHEAD_BEATS = 6.0` beats above the keyboard hit line (`y = height`).
- **Y-Coordinate Mapping**:
  $$y_{\text{bottom}}(\text{note}) = H \cdot \left(1 - \frac{\text{note.beatStart} - \text{currentBeat}}{\text{LOOKAHEAD\_BEATS}}\right)$$
  $$y_{\text{top}}(\text{note}) = H \cdot \left(1 - \frac{\text{note.beatStart} + \text{note.durationBeats} - \text{currentBeat}}{\text{LOOKAHEAD\_BEATS}}\right)$$
- **Visual Features**:
  - Measure beat grid lines scrolling downward in sync with the score.
  - Rounded pill bars colored by hand (`Right Hand = #38BDF8 Sky Blue`, `Left Hand = #F472B6 Rose Pink`) that morph to **Emerald (`#10B981`)**, **Amber (`#F59E0B`)**, or **Coral (`#EF4444`)** upon evaluation.
  - Finger number (`1–5`) and Note Name (`C4`) rendered inside the leading edge of each falling bar.
  - Active hit-line glow burst when the learner holds a matched note.

### 9.3 Interactive Grand Staff Renderer (`GrandStaffView.tsx`)
- Renders a scalable SVG **Grand Staff** (Treble Staff 5 lines + Bass Staff 5 lines joined by a grand brace) with horizontally scrolling measures.
- **Diatonic Staff Step Mapping**:
  - Converts MIDI note number to diatonic staff step $d$ relative to **Middle C (`C4`, $d = 0$)**:
    - `C4 = 0`, `D4 = +1` (below bottom treble line), `E4 = +2` (1st treble line), `F4 = +3` (1st space), `G4 = +4` (2nd line), etc.
    - `B3 = -1` (above top bass line), `A3 = -2` (5th bass line), `G3 = -3` (4th space), `F3 = -4` (4th bass line), etc.
  - Automatically renders **Ledger Lines** for `C4` (Middle C), `A5`, and low bass notes.
- **Pedagogical Annotations**:
  - Color-coded note heads matching Simply Piano evaluation status (`upcoming`, `active_target`, `correct_first_try`, `correct_after_hint`, `wrong_pitch`, `missed`).
  - Finger numbers (`1–5`) positioned above Treble notes and below Bass notes.
  - Toggleable **Beginner Note Name Badges** inside/beside note heads.
  - Highlighted **A–B Loop Region** and **Trouble Measure Warning Badges** (clickable to launch a quick Fix Drill on that bar).

### 9.4 Animated Overhead Hand & Finger Ghost (`OverheadHandGuide.tsx`)
- Positioned directly above/over the active piano keys.
- Computes the centroid X-position of the current Left Hand and Right Hand target notes (looking ahead 1 beat during rests) and smoothly interpolates Left and Right translucent SVG hands across the keyboard.
- Highlights the active finger (`Thumb 1` through `Pinky 5`) with a glowing ring and finger number badge so beginners immediately understand *which finger* presses *which key*.

---

## 10. Canonical Cross-Spec IDs & Aesthetic Design Tokens

To ensure seamless integration between the Technical Architecture and the Pedagogy & UX Specification (`docs/specs/piano-pedagogy-and-ux-design.md`), all modules standardize on the following tokens and IDs:

- **Theme Palette ("Nocturne & Ivory — The Concert Conservatory Studio")**:
  - Ebony Studio Canvas: `#0D0F14`
  - Spruce Elevated Surface: `#161922`
  - Warm Brass Accent: `#E5A93C`
  - First-Try Sky Blue: `#38BDF8`
  - Stage Mastery Emerald: `#10B981`
  - Hint / Post-Correction Amber: `#F59E0B`
  - Pitch / Rhythm Error Coral: `#F43F5E`
  - Sheet Music Parchment Card: `#FAF6EE`
- **Canonical Lesson IDs (`lesson-01` – `lesson-08`)**:
  - `lesson-01-middle-c-walk` (`soloist`), `lesson-02-ode-to-joy` (`soloist`), `lesson-03-bass-clef-anchors` (`soloist`), `lesson-04-skipping-stones-leaps` (`soloist`), `lesson-05-c-and-g-major-triads` (`chords`), `lesson-06-four-chord-pop-engine` (`chords`), `lesson-07-two-hand-conversation` (`synthesis`), `lesson-08-fur-elise-gymnopedie` (`synthesis`).
- **Canonical Video Lesson IDs (`vid-01` – `vid-08`)**:
  - `vid-01-posture-arch`, `vid-02-middle-c-landmark`, `vid-03-steps-vs-skips`, `vid-04-rhythm-pulse-breathing`, `vid-05-triad-claw-and-inversions`, `vid-06-left-hand-anchor-and-groove`, `vid-07-black-keys-and-accidentals`, `vid-08-two-hand-independence`.
- **Canonical 5-Minute Workout IDs**:
  - `workout-flashcard-sprint`, `workout-ear-pitch-match`, `workout-chord-switcher`.
