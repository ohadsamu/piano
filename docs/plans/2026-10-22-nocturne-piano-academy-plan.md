# Nocturne & Ivory — Interactive Piano Learning Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a studio-grade interactive beginner piano learning web application combining Simply Piano's step-by-step curriculum & color-coded live feedback, Flowkey's Wait Mode & overhead hand guides, Perfect Piano's Falling Notes & Grand Staff visualizers, and an intelligent "Identify My Play & Fix Me" Coaching + Video Recommendation system.

**Architecture:** Client-side TypeScript + React 18 + Vite + Tailwind CSS application driven by a sub-10ms Web Audio API polyphonic grand piano synthesizer, a tri-modal Input Detection Engine (Microphone YIN pitch detector, Web MIDI API adapter, and Virtual/QWERTY keyboard mapper), a real-time Practice & Evaluation State Machine (`PracticeEngine`), and a pedagogical Diagnostic & Remediation Engine (`CoachDiagnosisEngine`).

**Tech Stack:** TypeScript 5, React 18, Vite 5, Tailwind CSS 3, Lucide React icons, Web Audio API, Web MIDI API, HTML5 Canvas & SVG, Vitest.

**Spec:**
- `docs/specs/technical-architecture.md`
- `docs/specs/piano-pedagogy-and-ux-design.md`

## Global Constraints

- **Theme Identity**: *"Nocturne & Ivory — The Concert Conservatory Studio"* (`--bg-ebony-lacquer: #0D0F14`, `--bg-spruce-panel: #161922`, `--bg-iron-surface: #1E2230`, `--piano-felt-crimson: #9F1239`, `--accent-brass: #E5A93C`, `--eval-first-try-blue: #38BDF8`, `--eval-stage-emerald: #10B981`, `--eval-hint-amber: #F59E0B`, `--eval-error-coral: #F43F5E`, `--score-parchment-bg: #FAF6EE`).
- **Typography**: `'Fraunces'` for repertoire/lesson titles, `'Plus Jakarta Sans'` for arms-length legible studio UI & coaching copy, `'JetBrains Mono'` (`tabular-nums`) for BPM, measure/beat counters, Hz/cents, and finger numbers (`1`–`5`).
- **Tri-Modal Input**: Every interactive surface must respond identically to Microphone pitch detection, Web MIDI hardware input, and Virtual/QWERTY keyboard input.
- **Zero Dead-End Videos**: Every video lesson (`vid-01` through `vid-08`) must support both an always-available **Interactive Studio Overhead Hand Demo Player** (with Web Audio playback, synchronized hand/finger animation, chapter steps, and interactive keyboard checkpoints) AND a **Curated YouTube Lesson Embed** mode.

## Review Focus

1. **Polyphonic Chord & Two-Hand Matching in Wait Mode**: When a lesson beat contains multiple simultaneous notes (e.g., `C4+E4+G4` triad or `LH C3 + RH E4`), Wait Mode must track partial chord completion (highlighting held/matched notes while showing remaining notes in the chord) and advance as soon as all notes in the beat group are satisfied within a forgiving beginner window.
2. **Microphone Noise & Octave Stability**: Acoustic microphone pitch detection must apply an RMS noise gate and multi-frame stability filter so ambient room noise or key clicks do not trigger false wrong-note penalties.
3. **Directional "Identify My Play & Fix Me" Feedback**: Playing a wrong pitch must immediately show both the *actual note played* (in slate/coral on the keyboard) and the *target note* (in amber with finger number) plus plain-language directional guidance (e.g., `"You played F4 (1 key too high) — move 1 white key left to E4 with Right Hand Finger 3 (Middle)"`).
4. **Targeted Remediation Micro-Loop**: After an attempt with mistakes or when clicking **"Fix My Mistakes"**, `CoachDiagnosisEngine` must isolate the exact highest-trouble measure span and launch a 3-stage remediation loop (`Stage 1: Wait Mode Isolation` → `Stage 2: 60% Slow Loop` → `Stage 3: 90% Tempo Bridge`) plus surface the matching Video Tutorial.
5. **Sub-Pixel Alignment Between Falling Notes Canvas and Piano Keyboard**: `FallingNotesCanvas` and `InteractiveKeyboard` must consume the exact same `getKeyGeometry(midi)` math across `C3 (48)` to `B5 (83)` so falling note bars land directly on their corresponding white or black keys.

---

### Task 1: Project Scaffolding, Shared Types (`src/types/*`), & Pitch/Keyboard Geometry Utilities (`src/utils/*`)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/index.css`
- Create: `src/types/music.ts`, `src/types/input.ts`, `src/types/practice.ts`, `src/types/coach.ts`, `src/types/curriculum.ts`, `src/types/video.ts`, `src/types/index.ts`
- Create: `src/utils/midiUtils.ts`, `src/utils/keyboardLayout.ts`, `src/utils/storage.ts`
- Test: `src/utils/__tests__/midiUtils.test.ts`

- [x] **Step 1: Scaffold Vite + React + TypeScript + Tailwind + Vitest project and install dependencies**
- [x] **Step 2: Define canonical TypeScript interfaces across `src/types/*` unifying both specs**
- [x] **Step 3: Implement `midiUtils.ts`, `keyboardLayout.ts` (3-octave `C3–B5` exact key geometry), and `storage.ts` with unit tests**

---

### Task 2: Audio Synthesis & Tri-Modal Input Detection Engines (`src/engines/AudioEngine.ts`, `MicPitchDetector.ts`, `MidiInputAdapter.ts`, `QwertyInputAdapter.ts`, `InputManager.ts`)

**Files:**
- Create: `src/engines/AudioEngine.ts`
- Create: `src/engines/MicPitchDetector.ts`
- Create: `src/engines/MidiInputAdapter.ts`
- Create: `src/engines/QwertyInputAdapter.ts`
- Create: `src/engines/InputManager.ts`
- Test: `src/engines/__tests__/MicPitchDetector.test.ts`

- [ ] **Step 1: Implement `AudioEngine.ts` with polyphonic grand piano synthesis (4 harmonic partials + hammer transient + ADSR + procedural stereo reverb), metronome click, and accompaniment synth**
- [ ] **Step 2: Implement `MicPitchDetector.ts` using YIN / NSDF autocorrelation + parabolic interpolation + RMS noise gate + stability debounce**
- [ ] **Step 3: Implement `MidiInputAdapter.ts`, `QwertyInputAdapter.ts`, and `InputManager.ts` multiplexing all 3 input sources**
- [ ] **Step 4: Verify YIN pitch detection accuracy on synthesized sine/harmonic buffers via Vitest**

---

### Task 3: Real-Time Practice State Machine & "Fix Me" Diagnostic Coach Engine (`src/engines/PracticeEngine.ts`, `CoachDiagnosisEngine.ts`)

**Files:**
- Create: `src/engines/PracticeEngine.ts`
- Create: `src/engines/CoachDiagnosisEngine.ts`
- Test: `src/engines/__tests__/PracticeAndCoach.test.ts`

- [ ] **Step 1: Implement `PracticeEngine.ts` supporting `key_discovery`, `wait_mode`, `slow_practice`, `performance`, `remediation_drill`, and `auto_demo` with Simply Piano color states (`correct_first_try`, `correct_after_hint`, `wrong_pitch`, `missed`) and directional `LiveCorrectionFeedback`**
- [ ] **Step 2: Implement `CoachDiagnosisEngine.ts` computing per-measure trouble scores, classifying the beginner's mistake patterns (`NEIGHBOR_KEY_SLIP`, `LANDMARK_OCTAVE_DRIFT`, `RHYTHM_RUSHING`, `RHYTHM_DRAGGING_HESITATION`, `CHORD_FINGER_TENSION`, `HAND_COORDINATION_LAG`), building the 3-stage Remediation Plan, and recommending contextual videos**
- [ ] **Step 3: Write unit tests verifying Wait Mode progression, directional wrong-note feedback, and Coach Diagnosis classification**

---

### Task 4: Complete Beginner Curriculum, Song Library, Contextual Video Catalog, & 5-Min Workouts Data (`src/data/*`)

**Files:**
- Create: `src/data/curriculumData.ts`
- Create: `src/data/videoLibraryData.ts`
- Create: `src/data/workoutData.ts`
- Create: `src/data/songLibraryData.ts`

- [ ] **Step 1: Implement all 8 progressive beginner lessons (`lesson-01` through `lesson-08`) across Foundations/Soloist, Chords, and Two-Hand Synthesis with 5 guided steps each (`video_intro`, `key_discovery`, `wait_mode`, `slow_tempo`, `performance_stage`)**
- [ ] **Step 2: Implement all 8 contextual Video Lessons (`vid-01` through `vid-08`) with chapter breakdowns, overhead hand demo scores, interactive keyboard checkpoints, error-trigger mappings, and curated YouTube tutorial IDs**
- [ ] **Step 3: Implement the 3 Daily 5-Minute Workouts (`Note Flashcard Sprint`, `Ear Pitch & Interval Match`, `Chord Switcher Turbo`) and extra repertoire songs**

---

### Task 5: Studio Visualizers, Interactive Piano Keybed, Video Academy Player, & Coaching UI (`src/components/*`, `src/App.tsx`)

**Files:**
- Create: `src/components/visualizers/InteractiveKeyboard.tsx`
- Create: `src/components/visualizers/FallingNotesCanvas.tsx`
- Create: `src/components/visualizers/GrandStaffView.tsx`
- Create: `src/components/visualizers/OverheadHandGuide.tsx`
- Create: `src/components/coaching/StepGuideStepper.tsx`
- Create: `src/components/coaching/LiveCoachBanner.tsx`
- Create: `src/components/coaching/FixMeModal.tsx`
- Create: `src/components/video/InteractiveVideoPlayer.tsx`
- Create: `src/components/video/VideoCoachDrawer.tsx`
- Create: `src/components/views/CurriculumMapView.tsx`
- Create: `src/components/views/PracticeStudioView.tsx`
- Create: `src/components/views/WorkoutsView.tsx`
- Create: `src/components/views/VideoAcademyView.tsx`
- Create: `src/components/views/InputSetupModal.tsx`
- Create: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Build the Visualizers (`InteractiveKeyboard`, `FallingNotesCanvas`, `GrandStaffView`, `OverheadHandGuide`)**
- [ ] **Step 2: Build the Step-by-Step Coaching & Video Components (`StepGuideStepper`, `LiveCoachBanner`, `FixMeModal`, `InteractiveVideoPlayer`, `VideoCoachDrawer`)**
- [ ] **Step 3: Build the 4 Studio Views (`CurriculumMapView`, `PracticeStudioView`, `VideoAcademyView`, `WorkoutsView`) and wire `App.tsx`**

---

### Task 6: Parallel Code & Design Reviews + Live Browser Verification

- [ ] **Step 1: Run unit test suite (`npm test`) and production build (`npm run build`)**
- [ ] **Step 2: Spawn parallel `CodeReviewer` and `PianoDesignReviewer` agents to audit code quality, audio/pitch engine correctness, piano pedagogy accuracy, and Nocturne & Ivory visual design**
- [ ] **Step 3: Address review findings and verify the live running app in Chromium via `eval` browser tool**
